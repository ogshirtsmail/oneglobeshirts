import type { Metadata } from "next";
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
      <div className="mt-10">
        <AdminUploadPanel />
      </div>
    </div>
  );
}
