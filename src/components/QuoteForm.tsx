"use client";

import { useState } from "react";
import { site } from "@/lib/site";

const field =
  "mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

type Status = "idle" | "sending" | "sent" | "error";

export default function QuoteForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const payload = Object.fromEntries(new FormData(form).entries());
    setStatus("sending");
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(String(res.status));
      form.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="py-6 text-center">
        <h2 className="text-xl font-extrabold text-navy">Thank you! Your request is on its way.</h2>
        <p className="mt-2 text-sm text-slate">
          We&apos;ve received your quote request and will get back to you at
          the email you provided.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-6 text-sm font-semibold text-brand hover:text-brand-dark"
        >
          Send another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Honeypot: hidden from people, tempting to bots. */}
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium text-navy">
          Name
          <input name="name" required maxLength={100} className={field} />
        </label>
        <label className="block text-sm font-medium text-navy">
          Email
          <input name="email" type="email" required maxLength={200} className={field} />
        </label>
        <label className="block text-sm font-medium text-navy">
          Team / organization
          <input name="org" maxLength={150} className={field} />
        </label>
        <label className="block text-sm font-medium text-navy">
          Sport / apparel type
          <input name="sport" maxLength={150} placeholder="e.g. Cricket jerseys" className={field} />
        </label>
      </div>
      <label className="block text-sm font-medium text-navy">
        Approximate quantity
        <input name="quantity" maxLength={50} placeholder="e.g. 25" className={field} />
      </label>
      <label className="block text-sm font-medium text-navy">
        Tell us about your idea
        <textarea
          name="message"
          rows={5}
          maxLength={5000}
          placeholder="Colors, logo, style, fabric preferences, deadline..."
          className={field}
        />
      </label>
      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
      >
        {status === "sending" ? "Sending..." : "Send quote request"}
      </button>
      {status === "error" && (
        <p role="alert" className="text-sm text-red-700">
          Sorry, we couldn&apos;t send your request. Please try again, or email us
          directly at{" "}
          <a className="font-medium underline" href={`mailto:${site.contactEmail}`}>
            {site.contactEmail}
          </a>
          .
        </p>
      )}
    </form>
  );
}
