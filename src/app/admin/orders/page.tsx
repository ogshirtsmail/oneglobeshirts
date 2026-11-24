import type { Metadata } from "next";
import AdminOrdersList from "@/components/orders/AdminOrdersList";
import { isSupabaseConfigured } from "@/lib/supabase";

export const metadata: Metadata = { title: "Orders (admin)", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function AdminOrdersPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-extrabold text-navy">Orders</h1>
        <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
          The order system isn't switched on yet. Add <code>SUPABASE_URL</code> and <code>SUPABASE_SERVICE_ROLE_KEY</code> in
          Vercel → Project → Settings → Environment Variables, then redeploy.
        </p>
      </div>
    );
  }
  return <AdminOrdersList />;
}
