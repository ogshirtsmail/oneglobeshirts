"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  PAYMENT_LABELS,
  PRODUCTION_STAGES,
  STAFF_ROLES,
  STEPS,
  type OrderBundle,
  type OrderFileView,
  type StaffRole,
  STEP_KEYS,
  productionLabel,
  stepTitle,
  trackingUrl,
  waitingLabel,
} from "@/lib/order-steps";
import {
  ChatPanel,
  FileThumbs,
  FileUploader,
  OrderSummary,
  StepTracker,
  Timeline,
  btnPrimary,
  btnSecondary,
  fmtDate,
  fmtMoney,
  inputCls,
} from "./OrderParts";

const ID_KEY = "og-staff-identity";

export function useStaffIdentity() {
  const [id, setId] = useState<{ role: StaffRole; name: string }>({ role: "owner", name: "" });
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(ID_KEY) || "null");
      if (v && v.role) setId(v);
    } catch {}
  }, []);
  const save = (v: { role: StaffRole; name: string }) => {
    setId(v);
    try {
      localStorage.setItem(ID_KEY, JSON.stringify(v));
    } catch {}
  };
  return [id, save] as const;
}

export function StaffIdentityPicker({ id, save }: { id: { role: StaffRole; name: string }; save: (v: { role: StaffRole; name: string }) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-slate">Acting as</span>
      <select value={id.role} onChange={(e) => save({ ...id, role: e.target.value as StaffRole })} className="rounded-lg border border-line px-2 py-1.5">
        {STAFF_ROLES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
      </select>
      <input value={id.name} onChange={(e) => save({ ...id, name: e.target.value })} placeholder="Your name" className="w-36 rounded-lg border border-line px-2 py-1.5" />
    </div>
  );
}

export default function AdminOrder({ orderNo }: { orderNo: string }) {
  const base = `/api/admin/orders/${encodeURIComponent(orderNo)}`;
  const [bundle, setBundle] = useState<OrderBundle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [id, saveId] = useStaffIdentity();

  const load = useCallback(async () => {
    const res = await fetch(base, { cache: "no-store" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) setError(j.error || "Couldn't load this order.");
    else {
      setError(null);
      setBundle(j as OrderBundle);
    }
  }, [base]);

  useEffect(() => {
    load();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 20000);
    return () => clearInterval(t);
  }, [load]);

  async function post(path: string, body: Record<string, unknown>) {
    const res = await fetch(base + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, role: id.role, name: id.name }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j.error || "Something went wrong.");
    setBundle(j as OrderBundle);
  }
  const act = (action: string, extra: Record<string, unknown> = {}) => post("/action", { action, ...extra });

  if (error && !bundle) return <p className="px-6 py-20 text-center text-red-700">{error}</p>;
  if (!bundle) return <p className="px-6 py-20 text-center text-slate">Loading order…</p>;
  const o = bundle.order;

  return (
    <div className="bg-mist/50">
      <section className="border-b border-line bg-white px-6 py-6">
        <div className="mx-auto max-w-7xl">
          <Link href="/admin/orders" className="text-sm font-semibold text-brand">← All orders</Link>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-navy">{o.order_no}</h1>
            <span className="text-slate">{o.team_name || "—"} · {o.customer_name} · <a className="text-brand" href={`mailto:${o.customer_email}`}>{o.customer_email}</a>{o.customer_phone ? ` · ${o.customer_phone}` : ""}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="rounded-full bg-brand/10 px-3 py-1 text-brand">Step: {stepTitle(o.current_step)}</span>
            <span className={`rounded-full px-3 py-1 ${o.step_status === "waiting_team" && o.status === "active" ? "bg-amber-100 text-amber-900" : "bg-mist text-navy"}`}>
              {waitingLabel(o.step_status, o.status)}
            </span>
            <span className="rounded-full bg-mist px-3 py-1 text-navy">{PAYMENT_LABELS[o.payment_status]}</span>
            <span className="rounded-full bg-mist px-3 py-1 text-navy">Quote {fmtMoney(o.quote_amount)}</span>
            <span className="ml-auto"><StaffIdentityPicker id={id} save={saveId} /></span>
          </div>
          {bundle.customerLink && <CopyLink link={bundle.customerLink} />}
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-line bg-white p-3"><StepTracker order={o} /></div>
          <OrderTools bundle={bundle} act={act} />
        </aside>
        <div className="min-w-0 space-y-6">
          <StaffActionCard bundle={bundle} act={act} filesEndpoint={`${base}/files`} role={id.role} />
          <div className="grid gap-6 xl:grid-cols-2">
            <ChatPanel bundle={bundle} me="staff" filesEndpoint={`${base}/files`} fileExtra={{ role: id.role }} send={(body, file_ids) => post("/messages", { body, file_ids })} />
            <div className="space-y-6">
              <OrderSummary order={o} />
              <div className="rounded-2xl border border-line bg-white p-5 text-sm">
                <h2 className="mb-2 font-bold text-navy">Shipping Details</h2>
                {o.shipping_address ? (
                  <p className="whitespace-pre-line">
                    {[o.shipping_address.name, o.shipping_address.line1, o.shipping_address.line2, `${o.shipping_address.city}, ${o.shipping_address.state} ${o.shipping_address.zip}`, o.shipping_address.country, o.shipping_address.phone].filter(Boolean).join("\n")}
                  </p>
                ) : <p className="text-slate">Not added yet.</p>}
                {o.tracking_number && <p className="mt-2">Tracking: <strong>{o.carrier} {o.tracking_number}</strong>{o.delivered_at ? ` · delivered ${fmtDate(o.delivered_at)}` : ""}</p>}
                {o.feedback_rating && <p className="mt-2">Feedback: {"★".repeat(o.feedback_rating)} {o.feedback_text}</p>}
              </div>
              <div className="rounded-2xl border border-line bg-white p-5">
                <h2 className="mb-3 font-bold text-navy">All files ({bundle.files.length})</h2>
                <FileThumbs files={bundle.files} empty="No files yet." />
              </div>
            </div>
          </div>
          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="mb-4 font-bold text-navy">Order history (everything everyone did)</h2>
            <Timeline bundle={bundle} staffView />
          </section>
        </div>
      </div>
    </div>
  );
}

function CopyLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <p className="mt-3 text-xs text-slate">
      Customer's private link:{" "}
      <button
        className="font-semibold text-brand"
        onClick={async () => {
          await navigator.clipboard.writeText(link).catch(() => {});
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? "Copied ✓" : "Copy link"}
      </button>{" "}
      · <a href={link} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand">Open as customer</a>
    </p>
  );
}

type Act = (action: string, extra?: Record<string, unknown>) => Promise<void>;

function useRun() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const run = async (fn: () => Promise<void>, ok = "Saved ✓") => {
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      await fn();
      setDone(ok);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };
  const msg = (
    <>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
      {done && <p className="text-sm text-green-700">{done}</p>}
    </>
  );
  return { busy, run, msg };
}

function Box({ title, children, hint }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border-2 border-brand/30 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-extrabold text-navy">{title}</h2>
      {hint && <p className="mt-1 text-sm text-slate">{hint}</p>}
      <div className="mt-4 space-y-3 text-sm">{children}</div>
    </section>
  );
}

function StaffActionCard({ bundle, act, filesEndpoint, role }: { bundle: OrderBundle; act: Act; filesEndpoint: string; role: StaffRole }) {
  const o = bundle.order;
  const s = o.current_step;
  const { busy, run, msg } = useRun();
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState(o.quote_amount ? String(o.quote_amount) : "");
  const [files, setFiles] = useState<OrderFileView[]>([]);
  const [uploaderKey, setUploaderKey] = useState(0);
  const [stage, setStage] = useState(o.production_stage || "in_production");
  const [carrier, setCarrier] = useState(o.carrier || "UPS");
  const [tracking, setTracking] = useState(o.tracking_number || "");
  const ids = files.map((f) => f.id);
  const reset = () => {
    setNote("");
    setFiles([]);
    setUploaderKey((k) => k + 1);
  };
  const extra = { role };
  const stepInfo = STEPS.find((x) => x.key === s);
  const customerFiles = bundle.files.filter((f) => f.uploaded_by === "customer");

  if (o.status !== "active") {
    return <Box title={o.status === "completed" ? "Order completed ✓" : "Order cancelled"} hint="Use 'Reopen order' on the left if something needs to change." >{null}</Box>;
  }

  const noteBox = (ph: string) => <textarea className={inputCls} rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder={ph} />;
  const waitingCustomer = o.step_status === "waiting_customer";

  const header = (
    <p className={`rounded-lg px-3 py-2 ${waitingCustomer ? "bg-mist text-slate" : "bg-amber-50 text-amber-900"}`}>
      <strong>{stepTitle(s)}:</strong> {waitingCustomer ? `Waiting for the customer — ${stepInfo?.customer}` : stepInfo?.team}
    </p>
  );

  if (s === "quote") {
    return (
      <Box title="1 · Request a Quote — send the quote">
        {header}
        <label className="block font-semibold text-navy">Quote amount (USD)
          <input className={inputCls} type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 850.00" />
        </label>
        {noteBox("What's included: price per shirt, fabric, printing, delivery time, deposit…")}
        <FileUploader key={uploaderKey} endpoint={filesEndpoint} kind="other" label="Attach a quote PDF (optional)" extra={extra} onChange={setFiles} />
        {msg}
        <button className={btnPrimary} disabled={busy || !amount} onClick={() => run(async () => { await act("send_quote", { amount, note, file_ids: ids }); reset(); }, "Quote sent ✓ — customer emailed")}>
          {o.quote_amount ? "Send updated quote" : "Send quote"}
        </button>
      </Box>
    );
  }

  if (["design_own", "design_request", "design_approval"].includes(s)) {
    return (
      <Box title="2–4 · Design — send the design proof">
        {header}
        {customerFiles.length > 0 && (
          <div>
            <p className="mb-2 font-semibold text-navy">Customer's files</p>
            <FileThumbs files={customerFiles} />
          </div>
        )}
        <FileUploader key={uploaderKey} endpoint={filesEndpoint} kind="proof" label="Upload design proof (front, back, details)" extra={extra} onChange={setFiles} />
        {noteBox("Notes for the customer about this proof…")}
        {msg}
        <button className={btnPrimary} disabled={busy || !ids.length} onClick={() => run(async () => { await act("send_proof", { note, file_ids: ids }); reset(); }, "Proof sent ✓ — customer asked to Approve Design")}>
          Send design proof for approval
        </button>
      </Box>
    );
  }

  if (s === "sample_request") {
    return <Box title="5 · Request a Physical Sample">{header}<p>The customer will choose to request a sample or skip it.</p></Box>;
  }

  if (s === "sample_approval") {
    return (
      <Box title="6 · Approve Physical Sample — sample sent">
        {header}
        <FileUploader key={uploaderKey} endpoint={filesEndpoint} kind="sample_photo" label="Upload sample photos" extra={extra} onChange={setFiles} />
        <div className="grid gap-3 sm:grid-cols-2">
          <CarrierSelect value={carrier} onChange={setCarrier} />
          <label className="block font-semibold text-navy">Tracking number (optional)<input className={inputCls} value={tracking} onChange={(e) => setTracking(e.target.value)} /></label>
        </div>
        {noteBox("Notes for the customer…")}
        {msg}
        <button className={btnPrimary} disabled={busy} onClick={() => run(async () => { await act("sample_sent", { note, file_ids: ids, carrier, tracking_number: tracking }); reset(); }, "Sample marked as sent ✓")}>
          Sample sent — ask customer to approve
        </button>
      </Box>
    );
  }

  const shipForm = (
    <div className="space-y-3 rounded-xl border border-line p-4">
      <p className="font-semibold text-navy">Mark as shipped</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <CarrierSelect value={carrier} onChange={setCarrier} />
        <label className="block font-semibold text-navy">Tracking number<input className={inputCls} value={tracking} onChange={(e) => setTracking(e.target.value)} /></label>
      </div>
      <button className={btnPrimary} disabled={busy || !tracking.trim()} onClick={() => run(() => act("mark_shipped", { carrier, tracking_number: tracking, note }), "Marked shipped ✓ — customer emailed")}>
        Mark as shipped
      </button>
    </div>
  );

  if (s === "order_status") {
    return (
      <Box title="7 · Order Status — production update" hint={`Current stage: ${productionLabel(o.production_stage)}`}>
        {header}
        <label className="block font-semibold text-navy">Production stage
          <select className={inputCls} value={stage} onChange={(e) => setStage(e.target.value)}>
            {PRODUCTION_STAGES.map((p) => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </label>
        <FileUploader key={uploaderKey} endpoint={filesEndpoint} kind="production_photo" label="Production photos (optional)" extra={extra} onChange={setFiles} />
        {noteBox("Update for the customer (optional)…")}
        {msg}
        <button className={btnPrimary} disabled={busy} onClick={() => run(async () => { await act("production_update", { stage, note, file_ids: ids }); reset(); }, "Update posted ✓")}>
          Post update
        </button>
        <p className="text-xs text-slate">Choosing “Ready to ship” moves the order to Shipping Details / Shipping Status.</p>
      </Box>
    );
  }

  if (s === "shipping_details" || (s === "shipping_status" && !o.shipped_at)) {
    return (
      <Box title={`${STEP_KEYS.indexOf(s) + 1} · ${stepTitle(s)}`}>
        {header}
        {!o.shipping_address && <p className="text-amber-900">The customer hasn't added a delivery address yet. You can still ship if you have it from chat.</p>}
        {noteBox("Note for the customer (optional)…")}
        {shipForm}
        {msg}
      </Box>
    );
  }

  if (s === "shipping_status") {
    const link = trackingUrl(o.carrier, o.tracking_number);
    return (
      <Box title="9 · Shipping Status">
        {header}
        <p>Shipped {fmtDate(o.shipped_at)} — <strong>{o.carrier} {o.tracking_number}</strong> {link && <a className="font-semibold text-brand" href={link} target="_blank" rel="noopener noreferrer">Track</a>}</p>
        {msg}
        <button className={btnPrimary} disabled={busy} onClick={() => run(() => act("mark_delivered"), "Marked delivered ✓ — feedback requested")}>Mark as delivered</button>
      </Box>
    );
  }

  return <Box title="10 · Feedback">{header}<p>Waiting for the customer's feedback.</p></Box>;
}

function CarrierSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="block font-semibold text-navy">Carrier
      <select className={inputCls} value={value} onChange={(e) => onChange(e.target.value)}>
        {["UPS", "USPS", "FedEx", "DHL", "Other"].map((c) => <option key={c}>{c}</option>)}
      </select>
    </label>
  );
}

function OrderTools({ bundle, act }: { bundle: OrderBundle; act: Act }) {
  const o = bundle.order;
  const { busy, run, msg } = useRun();
  const [pay, setPay] = useState(o.payment_status);
  const [step, setStep] = useState<string>(o.current_step);
  const [waiting, setWaiting] = useState("waiting_team");
  return (
    <div className="space-y-4 rounded-2xl border border-line bg-white p-4 text-sm">
      <div>
        <p className="font-semibold text-navy">Payment</p>
        <div className="mt-1 flex gap-2">
          <select className="flex-1 rounded-lg border border-line px-2 py-1.5" value={pay} onChange={(e) => setPay(e.target.value as typeof pay)}>
            {Object.entries(PAYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button className={btnSecondary + " !px-3 !py-1.5"} disabled={busy || pay === o.payment_status} onClick={() => run(() => act("set_payment", { payment_status: pay }))}>Save</button>
        </div>
      </div>
      <div>
        <p className="font-semibold text-navy">Move to step <span className="font-normal text-slate">(corrections)</span></p>
        <select className="mt-1 w-full rounded-lg border border-line px-2 py-1.5" value={step} onChange={(e) => setStep(e.target.value)}>
          {STEPS.map((s, i) => <option key={s.key} value={s.key}>{i + 1}. {s.title}</option>)}
        </select>
        <select className="mt-2 w-full rounded-lg border border-line px-2 py-1.5" value={waiting} onChange={(e) => setWaiting(e.target.value)}>
          <option value="waiting_team">With the OG team</option>
          <option value="waiting_customer">Waiting for customer</option>
        </select>
        <button className={btnSecondary + " mt-2 w-full !py-1.5"} disabled={busy} onClick={() => run(() => act("move_to_step", { step, waiting }))}>Move</button>
      </div>
      <div className="border-t border-line pt-3">
        {o.status === "active" ? (
          <button className="text-sm font-semibold text-red-700" disabled={busy} onClick={() => { if (window.confirm("Cancel this order?")) run(() => act("cancel_order")); }}>Cancel order</button>
        ) : (
          <button className="text-sm font-semibold text-brand" disabled={busy} onClick={() => run(() => act("reopen_order"))}>Reopen order</button>
        )}
      </div>
      {msg}
    </div>
  );
}
