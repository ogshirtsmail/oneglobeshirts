"use client";

import { upload } from "@vercel/blob/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { ALLOWED_UPLOAD_CONTENT_TYPES, MAX_UPLOAD_SIZE_BYTES, pathnameFor } from "@/lib/uploads";

type HiddenDesign = { file: string; src: string };
type Item = { id: string; name: string; status: "uploading" | "done" | "error"; progress: number; error?: string };

const MAX_MB = Math.round(MAX_UPLOAD_SIZE_BYTES / (1024 * 1024));

/**
 * Shown on /design-collection/<category> only to admins (allowed IPs — checked on the server).
 * Uploads go straight to Vercel Blob under designs/<category>/ and appear on the page right away.
 */
export default function CategoryAdminPanel({
  category,
  categoryLabel,
  liveCount,
  hiddenDesigns,
}: {
  category: string;
  categoryLabel: string;
  liveCount: number;
  hiddenDesigns: HiddenDesign[];
}) {
  const router = useRouter();
  const inputId = useId();
  const [items, setItems] = useState<Item[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  const uploading = items.some((i) => i.status === "uploading");

  async function uploadFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    const queue: { item: Item; file: File }[] = files.map((file) => {
      const bad = !ALLOWED_UPLOAD_CONTENT_TYPES.includes(file.type)
        ? "Use JPG, PNG or WEBP"
        : file.size > MAX_UPLOAD_SIZE_BYTES
          ? `Over ${MAX_MB}MB`
          : undefined;
      return {
        file,
        item: { id: crypto.randomUUID(), name: file.name, status: bad ? "error" : "uploading", progress: 0, error: bad },
      };
    });
    setItems((prev) => [...queue.map((q) => q.item), ...prev]);

    let anyDone = false;
    for (const { item, file } of queue) {
      if (item.status === "error") continue;
      try {
        await upload(pathnameFor({ type: "design", category }, file.name), file, {
          access: "public",
          handleUploadUrl: "/api/admin/upload",
          onUploadProgress: ({ percentage }) =>
            setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, progress: Math.round(percentage) } : x))),
        });
        anyDone = true;
        setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, status: "done", progress: 100 } : x)));
      } catch (err) {
        setItems((prev) =>
          prev.map((x) =>
            x.id === item.id ? { ...x, status: "error", error: err instanceof Error ? err.message : "Upload failed" } : x,
          ),
        );
      }
    }
    if (anyDone) router.refresh();
  }

  async function restore(file: string) {
    setRestoring(file);
    try {
      const res = await fetch("/api/admin/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore", category, file }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      window.alert("Sorry, that design couldn't be restored. Please try again.");
    } finally {
      setRestoring(null);
    }
  }

  return (
    <section className="border-b border-amber-200 bg-amber-50/60">
      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-800">Admin · only visible to allowed IPs</p>
            <h2 className="mt-1 text-lg font-bold text-navy">
              Manage {categoryLabel} <span className="font-medium text-slate">({liveCount} live)</span>
            </h2>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link href="/admin/access" className="rounded-full border border-line bg-white px-4 py-1.5 font-semibold text-navy hover:border-brand hover:text-brand">
              Manage admin IPs
            </Link>
            <Link href="/admin/upload" className="rounded-full border border-line bg-white px-4 py-1.5 font-semibold text-navy hover:border-brand hover:text-brand">
              Full upload page
            </Link>
          </div>
        </div>

        <label
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files.length && !uploading) uploadFiles(e.dataTransfer.files);
          }}
          className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-7 text-center transition-colors ${
            dragOver ? "border-brand bg-brand/5" : "border-amber-300 bg-white"
          } ${uploading ? "pointer-events-none opacity-60" : ""}`}
        >
          <p className="font-semibold text-navy">
            {uploading ? "Uploading…" : `Upload ${categoryLabel.toLowerCase()} designs — drag images here or click`}
          </p>
          <p className="mt-1 text-sm text-slate">JPG, PNG or WEBP, up to {MAX_MB}MB each. Square 1080×1080 images look best.</p>
          <input
            id={inputId}
            type="file"
            multiple
            accept={ALLOWED_UPLOAD_CONTENT_TYPES.join(",")}
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) uploadFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>

        {items.length > 0 && (
          <ul className="mt-3 max-h-48 space-y-1 overflow-y-auto text-sm">
            {items.map((it) => (
              <li key={it.id} className="flex items-center gap-3 rounded-lg border border-line bg-white px-3 py-1.5">
                <span className="flex-1 truncate">{it.name}</span>
                {it.status === "uploading" && <span className="text-xs font-medium text-brand">{it.progress}%</span>}
                {it.status === "done" && <span className="text-xs font-medium text-green-700">Uploaded</span>}
                {it.status === "error" && <span className="text-xs font-medium text-red-700">{it.error}</span>}
              </li>
            ))}
          </ul>
        )}

        <p className="mt-3 text-xs text-slate">
          Tip: use the × on any design below to remove it. Uploaded designs are deleted; built-in designs are hidden and
          can be restored here.
        </p>

        {hiddenDesigns.length > 0 && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowHidden((v) => !v)}
              className="text-sm font-semibold text-brand hover:text-brand-dark"
            >
              {showHidden ? "Hide" : "Show"} removed designs ({hiddenDesigns.length})
            </button>
            {showHidden && (
              <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-8">
                {hiddenDesigns.map((d) => (
                  <div key={d.file} className="overflow-hidden rounded-lg border border-line bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element -- small admin thumbnails */}
                    <img src={d.src} alt="" loading="lazy" className="aspect-square w-full object-cover opacity-60" />
                    <button
                      type="button"
                      onClick={() => restore(d.file)}
                      disabled={restoring === d.file}
                      className="w-full border-t border-line py-1 text-xs font-semibold text-brand hover:bg-mist disabled:opacity-50"
                    >
                      {restoring === d.file ? "Restoring…" : "Restore"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
