"use client";

import { useEffect, useRef, useState } from "react";
import {
  CHAT_TITLE,
  FILE_KIND_LABELS,
  STEPS,
  type OrderBundle,
  type OrderFileView,
  type OrderView,
  stepIndex,
  waitingLabel,
} from "@/lib/order-steps";

export const inputCls =
  "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
export const btnPrimary =
  "inline-flex items-center justify-center rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-50";
export const btnSecondary =
  "inline-flex items-center justify-center rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-navy transition-colors hover:border-brand hover:text-brand disabled:opacity-50";

export const fmtDate = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "";
export const fmtMoney = (n: number | null | undefined) =>
  n == null ? "—" : `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ---------------------------------------------------------------- step tracker

type StepState = "done" | "current" | "skipped" | "upcoming";

export function stepStates(o: OrderView): Record<string, StepState> {
  const cur = stepIndex(o.current_step);
  const out: Record<string, StepState> = {};
  STEPS.forEach((s, i) => {
    let st: StepState = i < cur ? "done" : i === cur ? "current" : "upcoming";
    if (o.status === "completed") st = "done";
    if (s.key === "design_own" && o.design_path === "request") st = "skipped";
    if (s.key === "design_request" && o.design_path === "own") st = "skipped";
    if ((s.key === "sample_request" || s.key === "sample_approval") && o.skip_sample && i !== cur) {
      st = s.key === "sample_request" ? "done" : "skipped";
    }
    if (s.key === "design_own" && st === "current" && o.step_status === "waiting_customer") st = "current";
    out[s.key] = st;
  });
  // Steps 2 & 3 are alternatives: while choosing, both are "current".
  if (o.current_step === "design_own" && o.step_status === "waiting_customer" && !o.design_path) out.design_request = "current";
  return out;
}

export function StepTracker({ order }: { order: OrderView }) {
  const states = stepStates(order);
  return (
    <ol className="space-y-1">
      {STEPS.map((s, i) => {
        const st = states[s.key];
        const isCur = st === "current";
        return (
          <li
            key={s.key}
            className={`flex items-start gap-3 rounded-xl px-3 py-2.5 ${isCur ? "bg-brand/5 ring-1 ring-brand/30" : ""}`}
          >
            <span
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                st === "done"
                  ? "bg-green-600 text-white"
                  : isCur
                    ? "bg-brand text-white"
                    : st === "skipped"
                      ? "bg-mist text-slate line-through"
                      : "border border-line bg-white text-slate"
              }`}
              aria-hidden
            >
              {st === "done" ? "✓" : i + 1}
            </span>
            <div className="min-w-0">
              <p className={`text-sm font-semibold ${st === "upcoming" || st === "skipped" ? "text-slate" : "text-navy"}`}>
                {s.title}
                {st === "skipped" && <span className="ml-2 text-xs font-normal">(skipped)</span>}
              </p>
              {isCur && (
                <p className="text-xs text-brand">{waitingLabel(order.step_status, order.status)}</p>
              )}
            </div>
          </li>
        );
      })}
      <li className="flex items-start gap-3 px-3 py-2.5">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-navy" aria-hidden>
          ✉
        </span>
        <p className="text-sm font-semibold text-navy">{CHAT_TITLE} <span className="text-xs font-normal text-slate">— open at every step</span></p>
      </li>
    </ol>
  );
}

// ---------------------------------------------------------------- files

const isImage = (f: OrderFileView) => (f.content_type || "").startsWith("image/");

export function FileThumbs({ files, empty }: { files: OrderFileView[]; empty?: string }) {
  if (!files.length) return empty ? <p className="text-sm text-slate">{empty}</p> : null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {files.map((f) => (
        <a
          key={f.id}
          href={f.url || undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="group overflow-hidden rounded-lg border border-line bg-white text-xs hover:border-brand"
        >
          {isImage(f) && f.url ? (
            // eslint-disable-next-line @next/next/no-img-element -- signed private links
            <img src={f.url} alt={f.file_name} className="aspect-square w-full object-contain bg-mist" loading="lazy" />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center bg-mist text-2xl font-bold text-slate">
              {(f.file_name.split(".").pop() || "FILE").toUpperCase().slice(0, 4)}
            </div>
          )}
          <div className="truncate px-2 py-1.5 text-slate group-hover:text-brand" title={f.file_name}>
            <span className="font-semibold text-navy">{FILE_KIND_LABELS[f.kind] || "File"}</span> · {f.file_name}
          </div>
        </a>
      ))}
    </div>
  );
}

export function filesById(bundle: OrderBundle) {
  return new Map(bundle.files.map((f) => [f.id, f]));
}

/** Upload box. `endpoint` is the files API for this viewer (customer or staff). Returns uploaded file ids via onChange. */
export function FileUploader({
  endpoint,
  kind,
  label,
  extra,
  onChange,
}: {
  endpoint: string;
  kind: string;
  label: string;
  extra?: Record<string, string>;
  onChange: (files: OrderFileView[]) => void;
}) {
  const [files, setFiles] = useState<OrderFileView[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function add(list: FileList | null) {
    if (!list?.length) return;
    setBusy(true);
    setError(null);
    const added: OrderFileView[] = [];
    for (const file of Array.from(list)) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", kind);
      for (const [k, v] of Object.entries(extra || {})) fd.append(k, v);
      try {
        const res = await fetch(endpoint, { method: "POST", body: fd });
        const j = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(j.error || "Upload failed.");
        added.push(j as OrderFileView);
      } catch (e) {
        setError(`${file.name}: ${e instanceof Error ? e.message : "Upload failed."}`);
      }
    }
    const next = [...files, ...added];
    setFiles(next);
    onChange(next);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <label className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-line bg-white px-4 py-5 text-center text-sm hover:border-brand ${busy ? "pointer-events-none opacity-60" : ""}`}>
        <span className="font-semibold text-navy">{busy ? "Uploading…" : label}</span>
        <span className="mt-1 text-xs text-slate">JPG, PNG, PDF, AI/EPS, SVG or ZIP · up to 4 MB each</span>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => add(e.target.files)} />
      </label>
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
      {files.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-2 rounded-lg bg-mist px-3 py-1.5">
              <span className="text-green-700">✓</span>
              <span className="flex-1 truncate">{f.file_name}</span>
              <button
                type="button"
                className="text-slate hover:text-red-700"
                onClick={() => {
                  const next = files.filter((x) => x.id !== f.id);
                  setFiles(next);
                  onChange(next);
                }}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- history

const ACTOR_LABEL: Record<string, string> = { customer: "Customer", owner: "OG Owner", sales: "OG Sales", production: "OG Production", system: "System" };

export function Timeline({ bundle, staffView = false }: { bundle: OrderBundle; staffView?: boolean }) {
  const byId = filesById(bundle);
  const events = [...bundle.events].reverse();
  return (
    <ol className="relative space-y-5 border-l border-line pl-5">
      {events.map((e) => (
        <li key={e.id} className="relative">
          <span className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full ${e.actor === "customer" ? "bg-amber-400" : "bg-brand"}`} />
          <p className="text-sm font-semibold text-navy">{e.label}</p>
          <p className="text-xs text-slate">
            {fmtDate(e.created_at)} · {staffView ? `${ACTOR_LABEL[e.actor] || e.actor}${e.actor_name ? ` (${e.actor_name})` : ""}` : e.actor === "customer" ? "You" : "OG team"}
          </p>
          {e.note && <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{e.note}</p>}
          {e.file_ids.length > 0 && (
            <div className="mt-2">
              <FileThumbs files={e.file_ids.map((id) => byId.get(id)).filter((f): f is OrderFileView => !!f)} />
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}

// ---------------------------------------------------------------- chat with sales

export function ChatPanel({
  bundle,
  me,
  send,
  filesEndpoint,
  fileExtra,
}: {
  bundle: OrderBundle;
  me: "customer" | "staff";
  send: (body: string, fileIds: string[]) => Promise<void>;
  filesEndpoint: string;
  fileExtra?: Record<string, string>;
}) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<OrderFileView[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploaderKey, setUploaderKey] = useState(0);
  const [showAttach, setShowAttach] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const byId = filesById(bundle);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest" });
  }, [bundle.messages.length]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() && !files.length) return;
    setBusy(true);
    setError(null);
    try {
      await send(text, files.map((f) => f.id));
      setText("");
      setFiles([]);
      setUploaderKey((k) => k + 1);
      setShowAttach(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Message not sent.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col rounded-2xl border border-line bg-white">
      <div className="border-b border-line px-5 py-3">
        <h2 className="font-bold text-navy">{CHAT_TITLE}</h2>
        <p className="text-xs text-slate">
          {me === "customer" ? "Questions about your order? Our sales team replies here and by email." : `Chat with ${bundle.order.customer_name}`}
        </p>
      </div>
      <div className="max-h-[420px] min-h-[160px] space-y-3 overflow-y-auto px-5 py-4">
        {bundle.messages.length === 0 && <p className="text-sm text-slate">No messages yet. Say hello!</p>}
        {bundle.messages.map((m) => {
          const mine = me === "customer" ? m.sender === "customer" : m.sender !== "customer";
          const att = m.file_ids.map((id) => byId.get(id)).filter((f): f is OrderFileView => !!f);
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${mine ? "bg-brand text-white" : "bg-mist text-ink"}`}>
                <p className={`mb-0.5 text-[11px] font-semibold ${mine ? "text-white/80" : "text-slate"}`}>
                  {m.sender === "customer" ? (me === "customer" ? "You" : m.sender_name || "Customer") : `${m.sender_name || "OG Sales"} · OG team`} · {fmtDate(m.created_at)}
                </p>
                <p className="whitespace-pre-wrap">{m.body}</p>
                {att.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {att.map((f) => (
                      <li key={f.id}>
                        <a href={f.url || undefined} target="_blank" rel="noopener noreferrer" className={`underline ${mine ? "text-white" : "text-brand"}`}>
                          📎 {f.file_name}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={onSend} className="space-y-2 border-t border-line px-5 py-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          maxLength={4000}
          placeholder="Type your message…"
          className={inputCls}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) (e.currentTarget.form as HTMLFormElement).requestSubmit();
          }}
        />
        {showAttach && (
          <FileUploader key={uploaderKey} endpoint={filesEndpoint} kind="chat" label="Attach files" extra={fileExtra} onChange={setFiles} />
        )}
        {error && <p className="text-xs text-red-700">{error}</p>}
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={() => setShowAttach((v) => !v)} className="text-sm font-semibold text-brand hover:text-brand-dark">
            📎 {showAttach ? "Hide attachments" : "Attach a file"}
          </button>
          <button type="submit" disabled={busy || (!text.trim() && !files.length)} className={btnPrimary}>
            {busy ? "Sending…" : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------- summary

export function OrderSummary({ order }: { order: OrderView }) {
  const qty = Object.entries(order.quantities || {});
  const rows: [string, React.ReactNode][] = [
    ["Order type", order.order_type || "—"],
    ["Team / company", order.team_name || "—"],
    ["Quantity", order.total_qty ? `${order.total_qty} shirts` : "—"],
    ["Fabric", order.fabric || "—"],
    ["Needed by", order.needed_by ? new Date(order.needed_by + "T12:00:00").toLocaleDateString() : "—"],
    ["Quote", order.quote_amount != null ? fmtMoney(order.quote_amount) : "Being prepared"],
  ];
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <h2 className="font-bold text-navy">Order details</h2>
      <dl className="mt-3 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-slate">{k}</dt>
            <dd className="text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      {qty.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {qty.map(([k, v]) => (
            <span key={k} className="rounded-full bg-mist px-2.5 py-1 text-xs text-navy">
              {k}: <strong>{v}</strong>
            </span>
          ))}
        </div>
      )}
      {order.details && <p className="mt-3 whitespace-pre-wrap border-t border-line pt-3 text-sm text-ink">{order.details}</p>}
    </div>
  );
}
