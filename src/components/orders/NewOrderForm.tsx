"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ORDER_TYPES, SIZE_GROUPS } from "@/lib/order-steps";
import { btnPrimary, inputCls } from "./OrderParts";

const FABRICS = [
  "Not sure – please recommend",
  "Dri-Fit Polyester (Moisture-Wicking)",
  "Sublimation Polyester",
  "Micro Mesh",
  "Honeycomb / Birdseye Mesh",
  "Interlock Polyester",
  "Dazzle",
  "Tackle Twill / Heavy-Weight Poly",
  "Rugby Knit (Cotton/Poly)",
  "Spandex / Lycra Blend",
  "100% Cotton",
  "Cotton-Poly Blend",
  "Tri-Blend",
  "Pique (Polo Knit)",
  "Bamboo Blend",
];

const KIDS_AGES: Record<string, string> = { XS: "3–4", S: "5–6", M: "7–8", L: "9–10", XL: "11–12", XXL: "13–14" };

export default function NewOrderForm() {
  const router = useRouter();
  const [qty, setQty] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = Object.values(qty).reduce((a, v) => a + (parseInt(v, 10) > 0 ? parseInt(v, 10) : 0), 0);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, unknown>;
    data.quantities = Object.fromEntries(Object.entries(qty).filter(([, v]) => parseInt(v, 10) > 0).map(([k, v]) => [k, parseInt(v, 10)]));
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "We couldn't send your request.");
      if (j.path) router.push(j.path);
      else setError("Thanks! Your request was received.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't send your request.");
      setBusy(false);
    }
  }

  const label = "block text-sm font-semibold text-navy";
  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

      <fieldset className="space-y-4">
        <legend className="text-lg font-bold text-navy">What do you need?</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={label}>
            Order type
            <select name="order_type" required className={inputCls} defaultValue="">
              <option value="" disabled>Choose…</option>
              {ORDER_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label className={label}>
            Team / company / school name
            <input name="team_name" maxLength={150} className={inputCls} placeholder="e.g. Phoenix Strikers CC" />
          </label>
          <label className={label}>
            Fabric
            <select name="fabric" className={inputCls} defaultValue={FABRICS[0]}>
              {FABRICS.map((f) => <option key={f}>{f}</option>)}
            </select>
          </label>
          <label className={label}>
            Needed by <span className="font-normal text-slate">(optional)</span>
            <input name="needed_by" type="date" className={inputCls} />
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-lg font-bold text-navy">Sizes &amp; quantity</legend>
        <p className="mt-1 text-sm text-slate">Rough numbers are fine — you can change them later. Or just give a total below.</p>
        <div className="mt-4 space-y-4">
          {SIZE_GROUPS.map((g) => (
            <div key={g.key}>
              <p className="mb-2 text-sm font-semibold text-navy">{g.key}</p>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                {g.sizes.map((s) => {
                  const k = `${g.key} ${s}`;
                  return (
                    <label key={k} className="rounded-lg border border-line p-2 text-center text-xs font-semibold text-navy">
                      {s}
                      {g.key === "Kids" && <span className="block font-normal text-slate">{KIDS_AGES[s]} yrs</span>}
                      <input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={qty[k] ?? ""}
                        onChange={(e) => setQty({ ...qty, [k]: e.target.value.replace(/\D/g, "") })}
                        className="mt-1 w-full rounded-md border border-line px-2 py-1.5 text-center text-sm"
                        placeholder="0"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <p className="text-sm font-semibold text-navy">Total from sizes: <span className="text-brand">{total}</span></p>
          {total === 0 && (
            <label className="flex items-center gap-2 text-sm text-navy">
              or approximate total
              <input name="total_qty" type="number" min={1} className="w-28 rounded-lg border border-line px-3 py-1.5 text-sm" />
            </label>
          )}
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-bold text-navy">Your details</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className={label}>Name<input name="name" required maxLength={100} className={inputCls} /></label>
          <label className={label}>Email<input name="email" type="email" required maxLength={200} className={inputCls} /></label>
          <label className={label}>Phone <span className="font-normal text-slate">(optional)</span><input name="phone" maxLength={40} className={inputCls} /></label>
        </div>
        <label className={label}>
          Anything else?
          <textarea name="details" rows={4} maxLength={5000} className={inputCls} placeholder="Colors, style, logos, names & numbers, budget, questions…" />
        </label>
        <p className="text-xs text-slate">You can upload logos and designs on your order page right after this step.</p>
      </fieldset>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      <button type="submit" disabled={busy} className={`${btnPrimary} w-full sm:w-auto`}>
        {busy ? "Sending…" : "Request a Quote"}
      </button>
    </form>
  );
}
