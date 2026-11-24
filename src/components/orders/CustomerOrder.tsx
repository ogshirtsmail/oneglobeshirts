"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  PAYMENT_LABELS,
  PRODUCTION_STAGES,
  STEPS,
  type OrderBundle,
  type OrderFileView,
  type ShippingAddress,
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

export default function CustomerOrder({ orderNo, accessKey }: { orderNo: string; accessKey: string }) {
  const q = `?key=${encodeURIComponent(accessKey)}`;
  const base = `/api/orders/${encodeURIComponent(orderNo)}`;
  const [bundle, setBundle] = useState<OrderBundle | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(base + q, { cache: "no-store" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) setError(j.error || "We couldn't load this order.");
    else {
      setError(null);
      setBundle(j as OrderBundle);
    }
  }, [base, q]);

  useEffect(() => {
    load();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, 20000);
    return () => clearInterval(t);
  }, [load]);

  async function post(path: string, body: unknown) {
    const res = await fetch(base + path + q, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(j.error || "Something went wrong.");
    setBundle(j as OrderBundle);
  }
  const act = (action: string, extra: Record<string, unknown> = {}) => post("/action", { action, ...extra });

  if (error && !bundle) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <h1 className="text-2xl font-extrabold text-navy">Order not found</h1>
        <p className="mt-3 text-slate">{error}</p>
        <p className="mt-6 text-sm text-slate">
          Lost your link? <Link href="/orders/find" className="font-semibold text-brand">Find my order</Link>
        </p>
      </div>
    );
  }
  if (!bundle) return <p className="px-6 py-20 text-center text-slate">Loading your order…</p>;

  const o = bundle.order;
  return (
    <div className="bg-mist/50">
      <section className="border-b border-line bg-white px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">Your order</p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-navy">{o.order_no}</h1>
            <span className="text-slate">{o.team_name || o.customer_name}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-brand/10 px-3 py-1 text-brand">Step: {stepTitle(o.current_step)}</span>
            <span className={`rounded-full px-3 py-1 ${o.step_status === "waiting_customer" && o.status === "active" ? "bg-amber-100 text-amber-900" : "bg-mist text-navy"}`}>
              {o.step_status === "waiting_customer" && o.status === "active" ? "Your action needed" : waitingLabel(o.step_status, o.status)}
            </span>
            <span className="rounded-full bg-mist px-3 py-1 text-navy">{PAYMENT_LABELS[o.payment_status]}</span>
          </div>
          <p className="mt-3 text-xs text-slate">Bookmark this page — it's your private link to this order.</p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[280px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-line bg-white p-3">
            <StepTracker order={o} />
          </div>
        </aside>

        <div className="min-w-0 space-y-6">
          <ActionCard bundle={bundle} act={act} filesEndpoint={`${base}/files${q}`} />
          <div className="grid gap-6 xl:grid-cols-2">
            <ChatPanel
              bundle={bundle}
              me="customer"
              filesEndpoint={`${base}/files${q}`}
              send={(body, file_ids) => post("/messages", { body, file_ids })}
            />
            <div className="space-y-6">
              <OrderSummary order={o} />
              {o.shipping_address && !o.shipped_at && <ShippingCard bundle={bundle} act={act} compact />}
            </div>
          </div>
          <section className="rounded-2xl border border-line bg-white p-5">
            <h2 className="mb-4 font-bold text-navy">Order history</h2>
            <Timeline bundle={bundle} />
          </section>
        </div>
      </div>
    </div>
  );
}

type Act = (action: string, extra?: Record<string, unknown>) => Promise<void>;

function useRun() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run };
}

function Card({ step, title, children }: { step?: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border-2 border-brand/30 bg-white p-6 shadow-sm">
      {step && <p className="text-xs font-bold uppercase tracking-widest text-brand">Step {step} of {STEPS.length}</p>}
      <h2 className="mt-1 text-xl font-extrabold text-navy">{title}</h2>
      <div className="mt-3 space-y-4 text-sm text-ink">{children}</div>
    </section>
  );
}

const stepNo = (key: string) => STEPS.findIndex((s) => s.key === key) + 1;
const latest = (files: OrderFileView[], kind: string) => {
  const list = files.filter((f) => f.kind === kind);
  if (!list.length) return [];
  const last = new Date(list[list.length - 1].created_at).getTime();
  return list.filter((f) => last - new Date(f.created_at).getTime() < 10 * 60 * 1000);
};

function ActionCard({ bundle, act, filesEndpoint }: { bundle: OrderBundle; act: Act; filesEndpoint: string }) {
  const o = bundle.order;
  const s = o.current_step;
  const waitingMe = o.step_status === "waiting_customer";
  const { busy, error, run } = useRun();
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<OrderFileView[]>([]);
  const [mode, setMode] = useState<"own" | "request" | null>(null);
  const [changes, setChanges] = useState(false);
  const ids = files.map((f) => f.id);
  const err = error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>;

  if (o.status === "cancelled") {
    return <Card title="This order was cancelled"><p>If this is a mistake, please message us in Chat with Sales.</p></Card>;
  }
  if (o.status === "completed") {
    return (
      <Card title="Thank you for your order! 🎉">
        <p>Your order is complete{o.feedback_rating ? ` and we received your ${o.feedback_rating}-star feedback` : ""}. We'd love to make your next set too.</p>
        <Link href="/orders/new" className={btnPrimary}>Request a Quote for a new order</Link>
      </Card>
    );
  }

  // ---- 1 Request a Quote
  if (s === "quote") {
    if (!waitingMe) {
      return (
        <Card step={1} title="Request a Quote — received">
          <p>Thanks! We're reviewing your request and will send your quote here soon. You'll also get an email.</p>
          <p className="text-slate">Have questions or more details? Use Chat with Sales below.</p>
        </Card>
      );
    }
    return (
      <Card step={1} title="Your quote is ready">
        <p className="text-3xl font-extrabold text-navy">{fmtMoney(o.quote_amount)}</p>
        {o.quote_note && <p className="whitespace-pre-wrap rounded-lg bg-mist p-3">{o.quote_note}</p>}
        <FileThumbs files={latest(bundle.files, "other").filter((f) => f.uploaded_by !== "customer")} />
        {err}
        <div className="flex flex-wrap gap-3">
          <button className={btnPrimary} disabled={busy} onClick={() => run(() => act("accept_quote"))}>Accept quote</button>
          <span className="self-center text-slate">Questions or changes? Use Chat with Sales below.</span>
        </div>
      </Card>
    );
  }

  // ---- 2/3 Design Your Own Shirt or Request a Design
  if ((s === "design_own" || s === "design_request") && waitingMe) {
    return (
      <Card step={2} title="Design Your Own Shirt — or Request a Design">
        <p>Choose how you'd like to create your design.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { k: "own" as const, t: "Design Your Own Shirt", d: "Upload your design, logos and colors — or create one with our Design Your Shirt tool." },
            { k: "request" as const, t: "Request a Design", d: "Tell us your ideas and our designers will create the design for you." },
          ].map((c) => (
            <button
              key={c.k}
              type="button"
              onClick={() => setMode(c.k)}
              className={`rounded-xl border-2 p-4 text-left ${mode === c.k ? "border-brand bg-brand/5" : "border-line hover:border-brand/50"}`}
            >
              <span className="block font-bold text-navy">{c.t}</span>
              <span className="mt-1 block text-xs text-slate">{c.d}</span>
            </button>
          ))}
        </div>
        {mode === "own" && (
          <div className="space-y-3">
            <p className="text-slate">
              Need a tool? <a href="/design-your-shirt.html" target="_blank" className="font-semibold text-brand">Open Design Your Shirt</a>, save your design, then upload it here.
            </p>
            <FileUploader endpoint={filesEndpoint} kind="own_design" label="Upload your design and logos" onChange={setFiles} />
            <textarea className={inputCls} rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Colors, logo positions, names & numbers, anything else…" />
            {err}
            <button className={btnPrimary} disabled={busy || (!ids.length && !note.trim())} onClick={() => run(() => act("submit_own_design", { note, file_ids: ids }))}>
              Submit my design
            </button>
          </div>
        )}
        {mode === "request" && (
          <div className="space-y-3">
            <textarea className={inputCls} rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Describe your ideas: colors, style, logo, names & numbers, designs you like…" />
            <FileUploader endpoint={filesEndpoint} kind="reference" label="Upload logos or reference pictures (optional)" onChange={setFiles} />
            {err}
            <button className={btnPrimary} disabled={busy || (!note.trim() && !ids.length)} onClick={() => run(() => act("submit_design_request", { note, file_ids: ids }))}>
              Request a Design
            </button>
          </div>
        )}
      </Card>
    );
  }
  if (s === "design_request" || (s === "design_approval" && !waitingMe)) {
    return (
      <Card step={stepNo(s)} title={s === "design_request" ? "Request a Design — our designers are on it" : "Approve Design — we're preparing your proof"}>
        <p>We'll post your design proof here and email you as soon as it's ready.</p>
      </Card>
    );
  }

  // ---- 4 Approve Design
  if (s === "design_approval" && waitingMe) {
    return (
      <Card step={4} title="Approve Design">
        <p>Please check your design proof carefully — colors, spelling, names and numbers.</p>
        <FileThumbs files={latest(bundle.files, "proof")} empty="(proof files are in the order history below)" />
        {err}
        {!changes ? (
          <div className="flex flex-wrap gap-3">
            <button className={btnPrimary} disabled={busy} onClick={() => run(() => act("approve_design"))}>Approve Design</button>
            <button className={btnSecondary} disabled={busy} onClick={() => setChanges(true)}>Request changes</button>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea className={inputCls} rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What should we change?" />
            <FileUploader endpoint={filesEndpoint} kind="reference" label="Attach pictures (optional)" onChange={setFiles} />
            <div className="flex gap-3">
              <button className={btnPrimary} disabled={busy || !note.trim()} onClick={() => run(() => act("request_design_changes", { note, file_ids: ids }))}>Send changes</button>
              <button className={btnSecondary} onClick={() => setChanges(false)}>Back</button>
            </div>
          </div>
        )}
      </Card>
    );
  }

  // ---- 5 Request a Physical Sample
  if (s === "sample_request") {
    return (
      <Card step={5} title="Request a Physical Sample">
        <p>We can make one physical sample so you can check the fit, fabric and print before the full order. Or skip straight to production.</p>
        <textarea className={inputCls} rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Sample size and any notes (optional)" />
        {err}
        <div className="flex flex-wrap gap-3">
          <button className={btnPrimary} disabled={busy} onClick={() => run(() => act("request_sample", { note }))}>Request a Physical Sample</button>
          <button className={btnSecondary} disabled={busy} onClick={() => run(() => act("skip_sample", { note }))}>Skip sample — start my order</button>
        </div>
      </Card>
    );
  }

  // ---- 6 Approve Physical Sample
  if (s === "sample_approval") {
    if (!waitingMe) {
      return <Card step={6} title="Approve Physical Sample — we're making your sample"><p>We'll post photos and tracking here when your sample is on its way.</p></Card>;
    }
    return (
      <Card step={6} title="Approve Physical Sample">
        <p>Your sample is on its way or has arrived. Once you've checked it, approve it or tell us what to change.</p>
        <FileThumbs files={latest(bundle.files, "sample_photo")} />
        {err}
        {!changes ? (
          <div className="flex flex-wrap gap-3">
            <button className={btnPrimary} disabled={busy} onClick={() => run(() => act("approve_sample"))}>Approve Physical Sample</button>
            <button className={btnSecondary} disabled={busy} onClick={() => setChanges(true)}>Request changes</button>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea className={inputCls} rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What should we change?" />
            <FileUploader endpoint={filesEndpoint} kind="reference" label="Attach pictures (optional)" onChange={setFiles} />
            <div className="flex gap-3">
              <button className={btnPrimary} disabled={busy || !note.trim()} onClick={() => run(() => act("request_sample_changes", { note, file_ids: ids }))}>Send changes</button>
              <button className={btnSecondary} onClick={() => setChanges(false)}>Back</button>
            </div>
          </div>
        )}
      </Card>
    );
  }

  // ---- 7 Order Status
  if (s === "order_status") {
    const cur = PRODUCTION_STAGES.findIndex((x) => x.key === o.production_stage);
    return (
      <Card step={7} title="Order Status">
        <ol className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {PRODUCTION_STAGES.map((st, i) => (
            <li key={st.key} className={`rounded-lg px-3 py-2 text-center text-xs font-semibold ${i <= cur ? "bg-green-600 text-white" : "bg-mist text-slate"}`}>
              {i <= cur ? "✓ " : ""}{st.label}
            </li>
          ))}
        </ol>
        <FileThumbs files={latest(bundle.files, "production_photo")} />
        <RequestUpdate label="Request order status" action="request_order_status" act={act} />
        {!o.shipping_address && <ShippingCard bundle={bundle} act={act} />}
      </Card>
    );
  }

  // ---- 8 Shipping Details
  if (s === "shipping_details") {
    return <ShippingCard bundle={bundle} act={act} heading />;
  }

  // ---- 9 Shipping Status
  if (s === "shipping_status") {
    const link = trackingUrl(o.carrier, o.tracking_number);
    return (
      <Card step={9} title="Shipping Status">
        {o.shipped_at ? (
          <>
            <p>
              Shipped on {fmtDate(o.shipped_at)} with <strong>{o.carrier}</strong>. Tracking number: <strong>{o.tracking_number}</strong>
            </p>
            {link && <a href={link} target="_blank" rel="noopener noreferrer" className={btnSecondary}>Track shipment</a>}
            {err}
            <button className={btnPrimary} disabled={busy} onClick={() => run(() => act("confirm_delivery"))}>I received my order</button>
          </>
        ) : (
          <p>Your order is packed and being prepared for shipping. Tracking details will appear here.</p>
        )}
        <RequestUpdate label="Request shipping status" action="request_shipping_status" act={act} />
      </Card>
    );
  }

  // ---- 10 Feedback
  if (s === "feedback") {
    return <FeedbackCard act={act} />;
  }
  return null;
}

function RequestUpdate({ label, action, act }: { label: string; action: string; act: Act }) {
  const { busy, error, run } = useRun();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);
  if (sent) return <p className="text-sm text-green-700">✓ Request sent. We'll reply in Chat with Sales.</p>;
  if (!open) return <button className={btnSecondary} onClick={() => setOpen(true)}>{label}</button>;
  return (
    <div className="space-y-2">
      <textarea className={inputCls} rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything specific you'd like to know? (optional)" />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button className={btnPrimary} disabled={busy} onClick={() => run(async () => { await act(action, { note }); setSent(true); })}>{label}</button>
    </div>
  );
}

function ShippingCard({ bundle, act, heading, compact }: { bundle: OrderBundle; act: Act; heading?: boolean; compact?: boolean }) {
  const o = bundle.order;
  const a = o.shipping_address;
  const [edit, setEdit] = useState(!a);
  const [f, setF] = useState<ShippingAddress>(
    a ?? { name: o.customer_name, line1: "", line2: "", city: "", state: "", zip: "", country: "USA", phone: o.customer_phone || "" },
  );
  const { busy, error, run } = useRun();
  const set = (k: keyof ShippingAddress) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const body = !edit && a ? (
    <div className="space-y-2">
      <p className="whitespace-pre-line">{[a.name, a.line1, a.line2, `${a.city}, ${a.state} ${a.zip}`, a.country, a.phone].filter(Boolean).join("\n")}</p>
      <button className="text-sm font-semibold text-brand" onClick={() => setEdit(true)}>Change address</button>
    </div>
  ) : (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate">Full name<input className={inputCls} value={f.name} onChange={set("name")} /></label>
        <label className="text-xs font-semibold text-slate">Phone<input className={inputCls} value={f.phone || ""} onChange={set("phone")} /></label>
        <label className="text-xs font-semibold text-slate sm:col-span-2">Street address<input className={inputCls} value={f.line1} onChange={set("line1")} /></label>
        <label className="text-xs font-semibold text-slate sm:col-span-2">Apt, suite (optional)<input className={inputCls} value={f.line2 || ""} onChange={set("line2")} /></label>
        <label className="text-xs font-semibold text-slate">City<input className={inputCls} value={f.city} onChange={set("city")} /></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs font-semibold text-slate">State<input className={inputCls} value={f.state} onChange={set("state")} /></label>
          <label className="text-xs font-semibold text-slate">ZIP<input className={inputCls} value={f.zip} onChange={set("zip")} /></label>
        </div>
        <label className="text-xs font-semibold text-slate">Country<input className={inputCls} value={f.country} onChange={set("country")} /></label>
      </div>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button className={btnPrimary} disabled={busy} onClick={() => run(async () => { await act("save_shipping", { address: f }); setEdit(false); })}>
        Save Shipping Details
      </button>
    </div>
  );

  if (compact) {
    return (
      <div className="rounded-2xl border border-line bg-white p-5 text-sm">
        <h2 className="mb-2 font-bold text-navy">Shipping Details</h2>
        {body}
      </div>
    );
  }
  return heading ? (
    <Card step={8} title="Shipping Details"><p>Where should we deliver your order?</p>{body}</Card>
  ) : (
    <div className="rounded-xl border border-line p-4">
      <h3 className="mb-2 font-bold text-navy">Shipping Details</h3>
      <p className="mb-3 text-slate">Add your delivery address now so we can ship as soon as your order is ready.</p>
      {body}
    </div>
  );
}

function FeedbackCard({ act }: { act: Act }) {
  const [rating, setRating] = useState(0);
  const [note, setNote] = useState("");
  const { busy, error, run } = useRun();
  return (
    <Card step={10} title="Feedback">
      <p>How did we do? Your feedback helps us make every order better.</p>
      <div className="flex gap-1 text-3xl" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" aria-label={`${n} stars`} onClick={() => setRating(n)} className={n <= rating ? "text-amber-400" : "text-line"}>
            ★
          </button>
        ))}
      </div>
      <textarea className={inputCls} rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tell us about the quality, fit, delivery and service…" />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button className={btnPrimary} disabled={busy || !rating} onClick={() => run(() => act("submit_feedback", { rating, note }))}>Send Feedback</button>
    </Card>
  );
}
