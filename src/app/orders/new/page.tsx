import type { Metadata } from "next";
import QuoteForm from "@/components/QuoteForm";
import NewOrderForm from "@/components/orders/NewOrderForm";
import { isSupabaseConfigured } from "@/lib/supabase";
import { STEPS } from "@/lib/order-steps";

export const metadata: Metadata = {
  title: "Request a Quote",
  description: "Start your custom jersey or team shirt order. Get a quote, approve your design and a physical sample, and track your order to your door.",
};
export const dynamic = "force-dynamic";

export default function NewOrderPage() {
  const online = isSupabaseConfigured();
  return (
    <div>
      <section className="bg-mist px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">Step 1 of {STEPS.length}</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-navy">Request a Quote</h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate">
            Tell us what you need. After you submit, you get a private order page where you can approve your design,
            request a physical sample, track your order and shipping, and chat with our sales team.
          </p>
          <ol className="mt-6 flex flex-wrap gap-2 text-xs font-semibold">
            {STEPS.map((s, i) => (
              <li key={s.key} className={`rounded-full px-3 py-1 ${i === 0 ? "bg-brand text-white" : "bg-white text-navy"}`}>
                {i + 1}. {s.title}
              </li>
            ))}
            <li className="rounded-full bg-amber-400 px-3 py-1 text-navy">Chat with Sales — anytime</li>
          </ol>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
          {online ? <NewOrderForm /> : <QuoteForm />}
        </div>
      </section>
    </div>
  );
}
