import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { dbInsert, dbSelect, dbUpdate, eq, storageSignedUrls, storageUpload } from "./supabase";
import {
  type Actor,
  type OrderBundle,
  type OrderEventView,
  type OrderFileView,
  type OrderMessageView,
  type OrderView,
  type ShippingAddress,
  type StaffRole,
  type StepKey,
  PAYMENT_LABELS,
  PRODUCTION_STAGES,
  SIZE_GROUPS,
  STAFF_ROLES,
  STEP_KEYS,
  productionLabel,
  stepTitle,
} from "./order-steps";
import { notifyCustomer, notifyTeam } from "./order-mail";

export type OrderRow = OrderView & { id: string; access_key: string };

export const SITE_URL = (process.env.SITE_URL || "https://ogshirtsusa.com").replace(/\/$/, "");

export class OrderError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

// ---------------------------------------------------------------- helpers

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\r/g, "").trim().slice(0, max) : "");
const oneLine = (s: string) => s.replace(/\s+/g, " ");

function newOrderNo() {
  const d = new Date();
  const ymd = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(4);
  const suffix = Array.from(bytes, (b) => abc[b % abc.length]).join("");
  return `OG-${ymd}-${suffix}`;
}

export function customerLink(order: Pick<OrderRow, "order_no" | "access_key">) {
  return `${SITE_URL}/orders/${encodeURIComponent(order.order_no)}?key=${encodeURIComponent(order.access_key)}`;
}

export function keyMatches(order: OrderRow, key: string | null) {
  if (!key) return false;
  const a = Buffer.from(order.access_key);
  const b = Buffer.from(key);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function getOrder(orderNo: string): Promise<OrderRow | null> {
  if (!/^OG-\d{8}-[A-Z0-9]{4}$/.test(orderNo)) return null;
  const rows = await dbSelect<OrderRow>("orders", `select=*&order_no=${eq(orderNo)}&limit=1`);
  return rows[0] ?? null;
}

async function patchOrder(order: OrderRow, patch: Partial<OrderRow>): Promise<OrderRow> {
  const rows = await dbUpdate<OrderRow>("orders", `id=${eq(order.id)}`, patch);
  return rows[0] ?? { ...order, ...patch };
}

async function addEvent(
  order: OrderRow,
  actor: Actor,
  actorName: string | null,
  step: string,
  action: string,
  label: string,
  note?: string | null,
  fileIds: string[] = [],
) {
  await dbInsert("order_events", {
    order_id: order.id,
    actor,
    actor_name: actorName,
    step,
    action,
    label,
    note: note || null,
    file_ids: fileIds,
  });
}

/** Keeps only file ids that really belong to this order. */
async function ownFileIds(order: OrderRow, ids: unknown): Promise<string[]> {
  if (!Array.isArray(ids) || !ids.length) return [];
  const wanted = ids.filter((x): x is string => typeof x === "string" && /^[0-9a-f-]{36}$/i.test(x)).slice(0, 20);
  if (!wanted.length) return [];
  const rows = await dbSelect<{ id: string }>(
    "order_files",
    `select=id&order_id=${eq(order.id)}&id=in.(${wanted.join(",")})`,
  );
  return rows.map((r) => r.id);
}

// ---------------------------------------------------------------- create (Step 1: Request a Quote)

export type QuoteInput = Record<string, unknown>;

export async function createOrder(input: QuoteInput): Promise<OrderRow> {
  const name = oneLine(clean(input.name, 100));
  const email = clean(input.email, 200).toLowerCase();
  if (!name) throw new OrderError("Please enter your name.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new OrderError("Please enter a valid email address.");

  const quantities: Record<string, number> = {};
  const rawQty = (input.quantities && typeof input.quantities === "object" ? input.quantities : {}) as Record<string, unknown>;
  for (const g of SIZE_GROUPS) {
    for (const s of g.sizes) {
      const k = `${g.key} ${s}`;
      const n = Math.floor(Number(rawQty[k]));
      if (Number.isFinite(n) && n > 0 && n < 100000) quantities[k] = n;
    }
  }
  const sizeTotal = Object.values(quantities).reduce((a, b) => a + b, 0);
  const approx = Math.floor(Number(input.total_qty));
  const total_qty = sizeTotal || (Number.isFinite(approx) && approx > 0 && approx < 100000 ? approx : 0);

  const neededRaw = clean(input.needed_by, 10);
  const needed_by = /^\d{4}-\d{2}-\d{2}$/.test(neededRaw) ? neededRaw : null;

  const row = {
    order_no: newOrderNo(),
    access_key: randomBytes(24).toString("base64url"),
    customer_name: name,
    customer_email: email,
    customer_phone: oneLine(clean(input.phone, 40)) || null,
    team_name: oneLine(clean(input.team_name, 150)) || null,
    order_type: oneLine(clean(input.order_type, 60)) || null,
    quantities,
    total_qty,
    fabric: oneLine(clean(input.fabric, 120)) || null,
    needed_by,
    details: clean(input.details, 5000) || null,
    current_step: "quote",
    step_status: "waiting_team",
  };
  const [order] = await dbInsert<OrderRow>("orders", row);
  await addEvent(order, "customer", name, "quote", "quote_requested", "Quote requested", order.details);

  const link = customerLink(order);
  await Promise.allSettled([
    notifyCustomer(order, link, `Your quote request ${order.order_no}`, [
      `Thanks, ${name}! We've received your quote request.`,
      "Use your private link below anytime to see your order status, approve designs and chat with our sales team.",
      "Keep this link safe — anyone with it can view your order.",
    ]),
    notifyTeam(order, `New quote request ${order.order_no} — ${order.team_name || name}`, [
      `${name} (${email}) requested a quote.`,
      `Order type: ${order.order_type || "-"} · Quantity: ${order.total_qty || "-"}`,
    ]),
  ]);
  return order;
}

// ---------------------------------------------------------------- read

export async function loadBundle(order: OrderRow, viewer: "customer" | "staff"): Promise<OrderBundle> {
  const [events, messages, files] = await Promise.all([
    dbSelect<OrderEventView>("order_events", `select=id,created_at,actor,actor_name,step,action,label,note,file_ids&order_id=${eq(order.id)}&order=created_at.asc`),
    dbSelect<OrderMessageView>("order_messages", `select=id,created_at,sender,sender_name,body,file_ids&order_id=${eq(order.id)}&order=created_at.asc`),
    dbSelect<OrderFileView & { storage_path: string }>(
      "order_files",
      `select=id,created_at,uploaded_by,kind,file_name,content_type,size_bytes,storage_path&order_id=${eq(order.id)}&order=created_at.asc`,
    ),
  ]);
  const signed = await storageSignedUrls(files.map((f) => f.storage_path)).catch(() => ({}) as Record<string, string>);
  const fileViews: OrderFileView[] = files.map(({ storage_path, ...f }) => ({ ...f, url: signed[storage_path] ?? null }));

  // Opening the order marks the other side's chat messages as read.
  const unreadField = viewer === "customer" ? "unread_for_customer" : "unread_for_staff";
  if (order[unreadField] > 0) {
    order = await patchOrder(order, { [unreadField]: 0 } as Partial<OrderRow>);
  }

  const { id: _id, access_key: _key, ...view } = order;
  void _id;
  void _key;
  return {
    order: view,
    events,
    messages,
    files: fileViews,
    ...(viewer === "staff" ? { customerLink: customerLink(order) } : {}),
  };
}

export async function listOrdersForStaff(filter: { step?: string; status?: string; q?: string }) {
  const parts = [
    "select=order_no,created_at,updated_at,customer_name,customer_email,team_name,order_type,total_qty,current_step,step_status,status,payment_status,quote_amount,unread_for_staff,last_message_at",
    "order=updated_at.desc",
    "limit=500",
  ];
  if (filter.step && STEP_KEYS.includes(filter.step as StepKey)) parts.push(`current_step=${eq(filter.step)}`);
  if (filter.status && ["active", "completed", "cancelled"].includes(filter.status)) parts.push(`status=${eq(filter.status)}`);
  const q = clean(filter.q, 80).replace(/[(),*%]/g, " ").trim();
  if (q) {
    const like = encodeURIComponent(`*${q}*`);
    parts.push(`or=(order_no.ilike.${like},customer_name.ilike.${like},customer_email.ilike.${like},team_name.ilike.${like})`);
  }
  return dbSelect<Partial<OrderView>>("orders", parts.join("&"));
}

// ---------------------------------------------------------------- files

const ALLOWED_FILE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "application/pdf",
  "application/postscript", // .ai / .eps
  "application/zip",
]);
export const MAX_ORDER_FILE_BYTES = 4 * 1024 * 1024; // Vercel limits request bodies to ~4.5 MB
const FILE_KINDS = new Set(["logo", "own_design", "reference", "proof", "sample_photo", "production_photo", "chat", "other"]);
const STAFF_ONLY_KINDS = new Set(["proof", "sample_photo", "production_photo"]);

export async function uploadOrderFile(order: OrderRow, uploader: Actor, kindRaw: string, file: File): Promise<OrderFileView> {
  if (!(file instanceof File) || file.size === 0) throw new OrderError("No file received.");
  if (file.size > MAX_ORDER_FILE_BYTES) throw new OrderError("That file is over 4 MB. Please send a smaller version or share a link in the chat.");
  const type = file.type || "application/octet-stream";
  if (!ALLOWED_FILE_TYPES.has(type)) throw new OrderError("Please upload JPG, PNG, WEBP, GIF, SVG, PDF, AI/EPS or ZIP files.");
  let kind = FILE_KINDS.has(kindRaw) ? kindRaw : "other";
  if (uploader === "customer" && STAFF_ONLY_KINDS.has(kind)) kind = "other";

  const safe = file.name.replace(/[^A-Za-z0-9._-]+/g, "_").slice(-80) || "file";
  const path = `${order.order_no}/${randomUUID()}-${safe}`;
  await storageUpload(path, await file.arrayBuffer(), type);
  const [row] = await dbInsert<OrderFileView & { storage_path: string }>("order_files", {
    order_id: order.id,
    uploaded_by: uploader,
    kind,
    storage_path: path,
    file_name: file.name.slice(0, 150),
    content_type: type,
    size_bytes: file.size,
  });
  const signed = await storageSignedUrls([path]).catch(() => ({}) as Record<string, string>);
  const { storage_path, ...view } = row;
  return { ...view, url: signed[storage_path] ?? null };
}

// ---------------------------------------------------------------- chat with sales

export async function addMessage(order: OrderRow, sender: Actor, senderName: string | null, bodyRaw: unknown, fileIdsRaw: unknown) {
  const body = clean(bodyRaw, 4000);
  const fileIds = await ownFileIds(order, fileIdsRaw);
  if (!body && !fileIds.length) throw new OrderError("Please type a message.");
  await dbInsert("order_messages", {
    order_id: order.id,
    sender,
    sender_name: senderName,
    body: body || "(attachment)",
    file_ids: fileIds,
  });
  const fromCustomer = sender === "customer";
  await patchOrder(order, {
    last_message_at: new Date().toISOString(),
    ...(fromCustomer
      ? { unread_for_staff: (order.unread_for_staff || 0) + 1 }
      : { unread_for_customer: (order.unread_for_customer || 0) + 1 }),
  } as Partial<OrderRow>);

  const preview = body.length > 300 ? `${body.slice(0, 300)}…` : body;
  if (fromCustomer) {
    await notifyTeam(order, `New message on ${order.order_no} — ${order.team_name || order.customer_name}`, [
      `${order.customer_name} wrote:`,
      preview || "(sent an attachment)",
    ]).catch(() => {});
  } else {
    await notifyCustomer(order, customerLink(order), `New message about your order ${order.order_no}`, [
      `${senderName || "Our sales team"} sent you a message:`,
      preview || "(sent an attachment)",
    ]).catch(() => {});
  }
}

// ---------------------------------------------------------------- workflow actions

type Payload = Record<string, unknown>;
type Outcome = { patch: Partial<OrderRow>; step: string; label: string; note?: string | null; fileIds?: string[]; chat?: string };

function need(cond: unknown, msg: string) {
  if (!cond) throw new OrderError(msg, 409);
}

function parseAddress(p: unknown): ShippingAddress {
  const a = (p && typeof p === "object" ? p : {}) as Record<string, unknown>;
  const addr: ShippingAddress = {
    name: oneLine(clean(a.name, 100)),
    line1: oneLine(clean(a.line1, 150)),
    line2: oneLine(clean(a.line2, 150)) || undefined,
    city: oneLine(clean(a.city, 80)),
    state: oneLine(clean(a.state, 60)),
    zip: oneLine(clean(a.zip, 20)),
    country: oneLine(clean(a.country, 60)) || "USA",
    phone: oneLine(clean(a.phone, 40)) || undefined,
  };
  if (!addr.name || !addr.line1 || !addr.city || !addr.state || !addr.zip) {
    throw new OrderError("Please fill in name, street address, city, state and ZIP code.");
  }
  return addr;
}

const afterOrderStatus = (o: OrderRow) => STEP_KEYS.indexOf(o.current_step) >= STEP_KEYS.indexOf("order_status");

export async function customerAction(order: OrderRow, action: string, p: Payload) {
  need(order.status === "active", "This order is closed.");
  const s = order.current_step;
  const w = order.step_status;
  const note = clean(p.note, 3000) || null;
  const fileIds = await ownFileIds(order, p.file_ids);
  let out: Outcome;

  switch (action) {
    case "accept_quote":
      need(s === "quote" && w === "waiting_customer", "There's no quote to accept yet.");
      out = { patch: { current_step: "design_own", step_status: "waiting_customer" }, step: "quote", label: "Quote accepted", note };
      break;
    case "submit_own_design":
      need((s === "design_own" || s === "design_request") && w === "waiting_customer", "Designs can't be submitted right now.");
      need(fileIds.length || note, "Please upload your design or describe it.");
      out = {
        patch: { design_path: "own", current_step: "design_approval", step_status: "waiting_team" },
        step: "design_own",
        label: "Own design submitted",
        note,
        fileIds,
      };
      break;
    case "submit_design_request":
      need((s === "design_own" || s === "design_request") && w === "waiting_customer", "A design can't be requested right now.");
      need(note || fileIds.length, "Please describe the design you'd like.");
      out = {
        patch: { design_path: "request", current_step: "design_request", step_status: "waiting_team" },
        step: "design_request",
        label: "Design requested",
        note,
        fileIds,
      };
      break;
    case "approve_design":
      need(s === "design_approval" && w === "waiting_customer", "There's no design proof waiting for approval.");
      out = { patch: { current_step: "sample_request", step_status: "waiting_customer" }, step: "design_approval", label: "Design approved", note };
      break;
    case "request_design_changes":
      need(s === "design_approval" && w === "waiting_customer", "There's no design proof waiting for approval.");
      need(note, "Please describe the changes you'd like.");
      out = { patch: { step_status: "waiting_team" }, step: "design_approval", label: "Design changes requested", note, fileIds };
      break;
    case "request_sample":
      need(s === "sample_request" && w === "waiting_customer", "A physical sample can't be requested right now.");
      out = {
        patch: { skip_sample: false, current_step: "sample_approval", step_status: "waiting_team" },
        step: "sample_request",
        label: "Physical sample requested",
        note,
      };
      break;
    case "skip_sample":
      need(s === "sample_request" && w === "waiting_customer", "This step can't be skipped right now.");
      out = {
        patch: { skip_sample: true, current_step: "order_status", step_status: "waiting_team" },
        step: "sample_request",
        label: "Physical sample skipped — go straight to the full order",
        note,
      };
      break;
    case "approve_sample":
      need(s === "sample_approval" && w === "waiting_customer", "There's no sample waiting for approval.");
      out = { patch: { current_step: "order_status", step_status: "waiting_team" }, step: "sample_approval", label: "Physical sample approved", note };
      break;
    case "request_sample_changes":
      need(s === "sample_approval" && w === "waiting_customer", "There's no sample waiting for approval.");
      need(note, "Please describe the changes you'd like.");
      out = { patch: { step_status: "waiting_team" }, step: "sample_approval", label: "Sample changes requested", note, fileIds };
      break;
    case "request_order_status":
      need(s === "order_status", "Order status updates are available once production starts.");
      out = { patch: {}, step: "order_status", label: "Order status update requested", note, chat: `Request for order status${note ? `: ${note}` : ""}` };
      break;
    case "save_shipping": {
      need(!order.shipped_at, "Your order has already shipped. Please message us to change the address.");
      const addr = parseAddress(p.address);
      const patch: Partial<OrderRow> = { shipping_address: addr };
      if (s === "shipping_details") Object.assign(patch, { current_step: "shipping_status", step_status: "waiting_team" });
      out = { patch, step: "shipping_details", label: order.shipping_address ? "Shipping details updated" : "Shipping details added" };
      break;
    }
    case "request_shipping_status":
      need(s === "shipping_status", "Shipping status is available once your order is ready to ship.");
      out = { patch: {}, step: "shipping_status", label: "Shipping status update requested", note, chat: `Request for shipping status${note ? `: ${note}` : ""}` };
      break;
    case "confirm_delivery":
      need(s === "shipping_status" && order.shipped_at, "Your order hasn't shipped yet.");
      out = {
        patch: { delivered_at: new Date().toISOString(), current_step: "feedback", step_status: "waiting_customer" },
        step: "shipping_status",
        label: "Delivery confirmed by customer",
      };
      break;
    case "submit_feedback": {
      need(s === "feedback" || (s === "shipping_status" && order.shipped_at), "Feedback opens once your order is delivered.");
      const rating = Math.round(Number(p.rating));
      need(rating >= 1 && rating <= 5, "Please choose a rating from 1 to 5 stars.");
      out = {
        patch: {
          feedback_rating: rating,
          feedback_text: note,
          current_step: "feedback",
          step_status: "done",
          status: "completed",
          delivered_at: order.delivered_at || new Date().toISOString(),
        },
        step: "feedback",
        label: `Feedback received — ${"★".repeat(rating)}${"☆".repeat(5 - rating)}`,
        note,
      };
      break;
    }
    default:
      throw new OrderError("Unknown action.");
  }

  const updated = await commit(order, "customer", order.customer_name, out);
  await notifyTeam(updated, `${out.label} — ${updated.order_no} (${updated.team_name || updated.customer_name})`, [
    `${updated.customer_name}: ${out.label}.`,
    ...(out.note ? [`Note: ${out.note}`] : []),
    `Now at: ${stepTitle(updated.current_step)}`,
  ]).catch(() => {});
  return updated;
}

export async function staffAction(order: OrderRow, role: StaffRole, staffName: string, action: string, p: Payload) {
  const s = order.current_step;
  const note = clean(p.note, 3000) || null;
  const fileIds = await ownFileIds(order, p.file_ids);
  let out: Outcome;

  switch (action) {
    case "send_quote": {
      need(order.status === "active", "This order is closed.");
      need(s === "quote", "The quote was already accepted. Use 'Move to step' to go back if needed.");
      const amount = Math.round(Number(p.amount) * 100) / 100;
      need(Number.isFinite(amount) && amount > 0, "Please enter the quote amount.");
      out = {
        patch: { quote_amount: amount, quote_note: note, step_status: "waiting_customer" },
        step: "quote",
        label: `Quote sent — $${amount.toFixed(2)}`,
        note,
        fileIds,
      };
      break;
    }
    case "send_proof":
      need(order.status === "active", "This order is closed.");
      need(["design_own", "design_request", "design_approval"].includes(s), "Design proofs are sent during the design steps.");
      need(fileIds.length, "Please attach the design proof.");
      out = { patch: { current_step: "design_approval", step_status: "waiting_customer" }, step: "design_approval", label: "Design proof sent", note, fileIds };
      break;
    case "sample_sent": {
      need(order.status === "active", "This order is closed.");
      need(s === "sample_approval", "Samples are sent during 'Approve Physical Sample'.");
      const tracking = oneLine(clean(p.tracking_number, 60));
      const carrier = oneLine(clean(p.carrier, 30));
      out = {
        patch: { step_status: "waiting_customer" },
        step: "sample_approval",
        label: `Physical sample sent${tracking ? ` — ${carrier ? `${carrier} ` : ""}${tracking}` : ""}`,
        note,
        fileIds,
      };
      break;
    }
    case "production_update": {
      need(order.status === "active", "This order is closed.");
      need(s === "order_status", "Production updates are posted during 'Order Status'.");
      const stage = clean(p.stage, 30);
      need(PRODUCTION_STAGES.some((x) => x.key === stage), "Please choose a production stage.");
      const patch: Partial<OrderRow> = { production_stage: stage };
      if (stage === "ready") {
        Object.assign(patch, order.shipping_address
          ? { current_step: "shipping_status", step_status: "waiting_team" }
          : { current_step: "shipping_details", step_status: "waiting_customer" });
      }
      out = { patch, step: "order_status", label: `Order status: ${productionLabel(stage)}`, note, fileIds };
      break;
    }
    case "mark_shipped": {
      need(order.status === "active", "This order is closed.");
      need(["order_status", "shipping_details", "shipping_status"].includes(s), "Orders are shipped after production.");
      const carrier = oneLine(clean(p.carrier, 30));
      const tracking = oneLine(clean(p.tracking_number, 60));
      need(carrier && tracking, "Please enter the carrier and tracking number.");
      out = {
        patch: {
          carrier,
          tracking_number: tracking,
          shipped_at: new Date().toISOString(),
          production_stage: "ready",
          current_step: "shipping_status",
          step_status: "waiting_customer",
        },
        step: "shipping_status",
        label: `Shipped — ${carrier} ${tracking}`,
        note,
      };
      break;
    }
    case "mark_delivered":
      need(order.status === "active", "This order is closed.");
      need(s === "shipping_status" && order.shipped_at, "Mark the order as shipped first.");
      out = {
        patch: { delivered_at: new Date().toISOString(), current_step: "feedback", step_status: "waiting_customer" },
        step: "shipping_status",
        label: "Delivered",
        note,
      };
      break;
    case "set_payment": {
      const ps = clean(p.payment_status, 10);
      need(ps in PAYMENT_LABELS, "Unknown payment status.");
      out = { patch: { payment_status: ps as OrderRow["payment_status"] }, step: s, label: `Payment: ${PAYMENT_LABELS[ps]}`, note };
      break;
    }
    case "move_to_step": {
      const to = clean(p.step, 30) as StepKey;
      need(STEP_KEYS.includes(to), "Unknown step.");
      const who = p.waiting === "waiting_customer" ? "waiting_customer" : "waiting_team";
      out = {
        patch: { current_step: to, step_status: who, status: "active" },
        step: to,
        label: `Moved to “${stepTitle(to)}” (${who === "waiting_customer" ? "waiting for customer" : "with the OG team"})`,
        note,
      };
      break;
    }
    case "cancel_order":
      need(order.status === "active", "This order is already closed.");
      out = { patch: { status: "cancelled" }, step: s, label: "Order cancelled", note };
      break;
    case "reopen_order":
      need(order.status !== "active", "This order is already open.");
      out = { patch: { status: "active", step_status: order.step_status === "done" ? "waiting_team" : order.step_status }, step: s, label: "Order reopened", note };
      break;
    default:
      throw new OrderError("Unknown action.");
  }

  const updated = await commit(order, role, staffName, out);
  const nowWaitingForCustomer = updated.step_status === "waiting_customer" && order.step_status !== "waiting_customer";
  if (nowWaitingForCustomer || action === "mark_shipped" || action === "production_update") {
    await notifyCustomer(updated, customerLink(updated), `${out.label} — your order ${updated.order_no}`, [
      `Update on your order: ${out.label}.`,
      ...(out.note ? [out.note] : []),
      updated.step_status === "waiting_customer" ? `Your next step: ${stepTitle(updated.current_step)}.` : "",
    ].filter(Boolean)).catch(() => {});
  }
  return updated;
}

async function commit(order: OrderRow, actor: Actor, actorName: string | null, out: Outcome) {
  const updated = Object.keys(out.patch).length ? await patchOrder(order, out.patch) : order;
  await addEvent(updated, actor, actorName, out.step, out.label.toLowerCase().replace(/[^a-z]+/g, "_").slice(0, 40), out.label, out.note, out.fileIds);
  if (out.chat) await addMessage(updated, actor, actorName, out.chat, []);
  return updated;
}

export const isStaffRole = (r: unknown): r is StaffRole => STAFF_ROLES.some((x) => x.key === r);
