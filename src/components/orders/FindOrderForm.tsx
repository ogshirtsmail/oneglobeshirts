"use client";

import { useState } from "react";
import { btnPrimary, inputCls } from "./OrderParts";

export default function FindOrderForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    setState("sending");
    const res = await fetch("/api/orders/find", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).catch(() => null);
    setState(res && res.ok ? "sent" : "error");
  }
  if (state === "sent") {
    return <p className="text-sm text-navy">If those details match an order, we've emailed the link to you. Please check your inbox (and spam folder).</p>;
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-sm font-semibold text-navy">Order number<input name="order_no" required placeholder="OG-20261123-K7QX" className={inputCls} /></label>
      <label className="block text-sm font-semibold text-navy">Email<input name="email" type="email" required className={inputCls} /></label>
      {state === "error" && <p className="text-sm text-red-700">Something went wrong. Please try again or contact us.</p>}
      <button className={btnPrimary} disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Email me my order link"}</button>
    </form>
  );
}
