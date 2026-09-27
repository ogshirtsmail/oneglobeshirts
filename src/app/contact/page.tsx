import type { Metadata } from "next";
import QuoteForm from "@/components/QuoteForm";

export const metadata: Metadata = {
  title: "Request a Quote",
  description: "Tell One Globe about your sport, colors, logo, style and quantity to get a custom quote.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-[1fr_1.4fr]">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-brand">Get started</p>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-navy">Request a custom quote</h1>
        <p className="mt-4 leading-relaxed text-slate">
          Share your sport, colors, logo, style and quantity. We&apos;ll suggest
          designs and fabrics, and make a sample for your approval before any
          bulk order.
        </p>
      </div>
      <div className="rounded-2xl border border-line bg-mist p-6 sm:p-8">
        <QuoteForm />
      </div>
    </div>
  );
}
