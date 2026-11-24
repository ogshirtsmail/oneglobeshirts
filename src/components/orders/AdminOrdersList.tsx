"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PAYMENT_LABELS, STEPS, type OrderView, stepTitle, waitingLabel } from "@/lib/order-steps";
import { fmtDate, fmtMoney } from "./OrderParts";

type Row = Partial<OrderView>;

export default function AdminOrdersList() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("active");
  const [step, setStep] = useState("");
  const [q, setQ] = useState("");
  const [onlyMine, setOnlyMine] = useState(false);

  const load = useCallback(async () => {
    const sp = new URLSearchParams();
    if (status) sp.set("status", status);
    if (step) sp.set("step", step);
    if (q.trim()) sp.set("q", q.trim());
    const res = await fetch(`/api/admin/orders?${sp}`, { cache: "no-store" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) setError(j.error || "Couldn't load orders.");
    else {
      setError(null);
      setRows(j.orders);
    }
  }, [status, step, q]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const shown = (rows || []).filter((r) => !onlyMine || (r.step_status === "waiting_team" && r.status === "active") || (r.unread_for_staff || 0) > 0);
  const counts = STEPS.map((s) => ({ ...s, n: (rows || []).filter((r) => r.current_step === s.key).length }));

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">Admin</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-navy">Orders</h1>
        </div>
        <Link href="/orders/new" target="_blank" className="text-sm font-semibold text-brand">Open Request a Quote form ↗</Link>
      </div>

      {error && <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
        <div className="flex overflow-hidden rounded-full border border-line">
          {[["active", "Active"], ["completed", "Completed"], ["cancelled", "Cancelled"], ["", "All"]].map(([k, l]) => (
            <button key={k} onClick={() => setStatus(k)} className={`px-4 py-1.5 font-semibold ${status === k ? "bg-navy text-white" : "bg-white text-navy"}`}>{l}</button>
          ))}
        </div>
        <select value={step} onChange={(e) => setStep(e.target.value)} className="rounded-full border border-line px-3 py-1.5">
          <option value="">All steps</option>
          {STEPS.map((s, i) => <option key={s.key} value={s.key}>{i + 1}. {s.title}</option>)}
        </select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order no, name, email, team…" className="min-w-[240px] flex-1 rounded-full border border-line px-4 py-1.5" />
        <label className="flex items-center gap-2 font-semibold text-navy">
          <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} /> Needs our action
        </label>
      </div>

      {!step && rows && (
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {counts.filter((c) => c.n).map((c) => (
            <button key={c.key} onClick={() => setStep(c.key)} className="rounded-full bg-mist px-3 py-1 font-semibold text-navy hover:bg-brand/10">{c.title}: {c.n}</button>
          ))}
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-mist text-left text-xs uppercase tracking-wider text-slate">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer / team</th>
              <th className="px-4 py-3">Type · Qty</th>
              <th className="px-4 py-3">Step</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Quote</th>
              <th className="px-4 py-3">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows === null && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate">Loading…</td></tr>}
            {rows && shown.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate">No orders here yet.</td></tr>}
            {shown.map((r) => {
              const ours = r.status === "active" && r.step_status === "waiting_team";
              return (
                <tr key={r.order_no} className="hover:bg-mist/60">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${encodeURIComponent(r.order_no!)}`} className="font-bold text-brand">{r.order_no}</Link>
                    {(r.unread_for_staff || 0) > 0 && <span className="ml-2 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">{r.unread_for_staff} new</span>}
                  </td>
                  <td className="px-4 py-3"><p className="font-semibold text-navy">{r.customer_name}</p><p className="text-xs text-slate">{r.team_name || r.customer_email}</p></td>
                  <td className="px-4 py-3">{r.order_type || "—"} · {r.total_qty || "—"}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-navy">{stepTitle(r.current_step || "")}</p>
                    <p className={`text-xs ${ours ? "font-semibold text-amber-700" : "text-slate"}`}>{waitingLabel(r.step_status || "", r.status || "")}</p>
                  </td>
                  <td className="px-4 py-3">{PAYMENT_LABELS[r.payment_status || "unpaid"]}</td>
                  <td className="px-4 py-3">{fmtMoney(r.quote_amount)}</td>
                  <td className="px-4 py-3 text-xs text-slate">{fmtDate(r.updated_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
