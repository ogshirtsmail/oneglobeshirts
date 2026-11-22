import type { Metadata } from "next";
import Link from "next/link";
import AdminUploadPanel from "@/components/admin/AdminUploadPanel";

export const metadata: Metadata = {
  title: "Upload",
  robots: { index: false, follow: false },
};

export default function AdminUploadPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight text-navy">Upload Designs &amp; Fabrics</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate">
        This page only loads from allowed IP addresses — everyone else gets a
        plain 404. Anything you upload here appears on the live site
        immediately.
      </p>
      <Link href="/admin/access" className="mt-3 inline-block text-sm font-semibold text-brand hover:text-brand-dark">
        Manage which IP addresses can use admin tools →
      </Link>
      <div className="mt-10">
        <AdminUploadPanel />
      </div>
    </div>
  );
}
