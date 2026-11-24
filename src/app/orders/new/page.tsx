import type { Metadata } from "next";
import QuoteForm from "@/components/QuoteForm";
import NewOrderForm from "@/components/orders/NewOrderForm";
import { headers } from "next/headers";
import { isAdminFromHeaders } from "@/lib/admin-access";
import { isSupabaseConfigured, ordersArePublic } from "@/lib/supabase";
import { STEPS } from "@/lib/order-steps";

export const metadata: Metadata = {
  title: "Request a Quote",
  description: "Start your custom jersey or team shirt order. Get a quote, approve your design and a physical sample, and track your order to your door.",
};
export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  const isPublic = ordersArePublic();
  const isAdmin = isPublic ? false : await isAdminFromHeaders(await headers());
  const online = isSupabaseConfigured() && (isPublic || isAdmin);
  return (
    <div>
      <section className="bg-mist px-6 py-14">
        <div className="mx-auto max-w-5xl">
          {online ? (
            <>
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
            </>
          ) : (
            <>
              <p className="text-sm font-semibold uppercase tracking-widest text-brand">Get started</p>
              <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-navy">Request a Quote</h1>
              <p className="mt-3 max-w-2xl text-lg leading-relaxed text-slate">
                Tell us about your team, your sport and your quantities, and we&apos;ll get back to you with a quote.
              </p>
            </>
          )}
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-6 py-12">
        {online && !isPublic && (
          <p className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <strong>Admin preview:</strong> only your admin IPs see this new order form. Customers still see the
            classic quote form until you set <code>ORDERS_PUBLIC=true</code> in Vercel.
          </p>
        )}
        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
          {online ? <NewOrderForm /> : <QuoteForm />}
        </div>
      </section>
    </div>
  );
}
