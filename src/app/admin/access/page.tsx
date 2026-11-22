import type { Metadata } from "next";
import Link from "next/link";
import AdminIpManager from "@/components/admin/AdminIpManager";

export const metadata: Metadata = {
  title: "Admin access",
  robots: { index: false, follow: false },
};

export default function AdminAccessPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand">Admin</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-navy">Admin access</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate">
        Only the IP addresses listed here can see the admin tools — the upload box and delete buttons on the Design
        Collection pages, and the pages under /admin. Everyone else sees the normal site. Changes work immediately.
      </p>
      <div className="mt-4 flex gap-4 text-sm">
        <Link href="/design-collection/jerseys" className="font-semibold text-brand hover:text-brand-dark">
          ← Design Collection
        </Link>
        <Link href="/admin/upload" className="font-semibold text-brand hover:text-brand-dark">
          Upload page
        </Link>
      </div>
      <div className="mt-10">
        <AdminIpManager />
      </div>
    </div>
  );
}
