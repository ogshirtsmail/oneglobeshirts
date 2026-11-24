import type { Metadata } from "next";
import FindOrderForm from "@/components/orders/FindOrderForm";

export const metadata: Metadata = { title: "Find my order", robots: { index: false, follow: true } };

export default function FindOrderPage() {
  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-3xl font-extrabold tracking-tight text-navy">Find my order</h1>
      <p className="mt-2 text-slate">
        Enter your order number and the email you used. We'll email you the private link to your order page.
      </p>
      <div className="mt-8 rounded-2xl border border-line bg-white p-6">
        <FindOrderForm />
      </div>
    </div>
  );
}
