"use client";

import { upload } from "@vercel/blob/client";
import { useCallback, useEffect, useId, useState } from "react";
import { designCategories } from "@/lib/design-categories";
import {
  ALLOWED_UPLOAD_CONTENT_TYPES,
  MAX_UPLOAD_SIZE_BYTES,
  pathnameFor,
  prefixFor,
  type UploadTarget,
} from "@/lib/uploads";

type ExistingBlob = { url: string; pathname: string; size: number; uploadedAt: string };

type QueueItem = {
  id: string;
  file: File;
  status: "queued" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
};

const MAX_MB = Math.round(MAX_UPLOAD_SIZE_BYTES / (1024 * 1024));

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminUploadPanel() {
  const [mode, setMode] = useState<"design" | "fabric">("design");
  const [category, setCategory] = useState(designCategories[0].slug);
  const [existing, setExisting] = useState<ExistingBlob[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputId = useId();

  const target: UploadTarget = mode === "design" ? { type: "design", category } : { type: "fabric" };
  const prefix = prefixFor(target);

  const refreshExisting = useCallback(async () => {
    setLoadingExisting(true);
    try {
      const res = await fetch(`/api/admin/list?prefix=${encodeURIComponent(prefix)}`);
      const data = await res.json();
      if (res.ok) {
        setConfigured(Boolean(data.configured));
        setExisting(data.blobs ?? []);
      } else {
        setConfigured(false);
        setExisting([]);
      }
    } catch {
      setConfigured(false);
      setExisting([]);
    } finally {
      setLoadingExisting(false);
    }
  }, [prefix]);

  useEffect(() => {
    refreshExisting();
  }, [refreshExisting]);

  function addFiles(files: FileList | File[]) {
    const items: QueueItem[] = [];
    for (const file of Array.from(files)) {
      if (!ALLOWED_UPLOAD_CONTENT_TYPES.includes(file.type)) {
        items.push({ id: crypto.randomUUID(), file, status: "error", progress: 0, error: "Unsupported file type" });
        continue;
      }
      if (file.size > MAX_UPLOAD_SIZE_BYTES) {
        items.push({ id: crypto.randomUUID(), file, status: "error", progress: 0, error: `Over ${MAX_MB}MB` });
        continue;
      }
      items.push({ id: crypto.randomUUID(), file, status: "queued", progress: 0 });
    }
    setQueue((q) => [...q, ...items]);
  }

  async function startUpload() {
    const pending = queue.filter((q) => q.status === "queued");
    for (const item of pending) {
      setQueue((q) => q.map((x) => (x.id === item.id ? { ...x, status: "uploading" } : x)));
      try {
        await upload(pathnameFor(target, item.file.name), item.file, {
          access: "public",
          handleUploadUrl: "/api/admin/upload",
          onUploadProgress: ({ percentage }) => {
            setQueue((q) => q.map((x) => (x.id === item.id ? { ...x, progress: percentage } : x)));
          },
        });
        setQueue((q) => q.map((x) => (x.id === item.id ? { ...x, status: "done", progress: 100 } : x)));
      } catch (err) {
        setQueue((q) =>
          q.map((x) =>
            x.id === item.id
              ? { ...x, status: "error", error: err instanceof Error ? err.message : "Upload failed" }
              : x,
          ),
        );
      }
    }
    refreshExisting();
  }

  async function handleDelete(url: string) {
    setExisting((e) => e.filter((b) => b.url !== url));
    try {
      const res = await fetch("/api/admin/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error();
    } catch {
      refreshExisting();
    }
  }

  const hasQueued = queue.some((q) => q.status === "queued");
  const hasActive = queue.some((q) => q.status === "uploading");

  return (
    <div>
      {configured === false && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          Blob storage isn&apos;t connected yet. Uploads won&apos;t work until{" "}
          <code className="rounded bg-amber-100 px-1 py-0.5">BLOB_READ_WRITE_TOKEN</code> is set (link a Vercel
          Blob store to this project, or set it locally in <code className="rounded bg-amber-100 px-1 py-0.5">.env.local</code>
          ).
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full border border-line bg-white p-1">
          <button
            type="button"
            onClick={() => setMode("design")}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              mode === "design" ? "bg-brand text-white" : "text-slate hover:text-navy"
            }`}
          >
            Design Collection
          </button>
          <button
            type="button"
            onClick={() => setMode("fabric")}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              mode === "fabric" ? "bg-brand text-white" : "text-slate hover:text-navy"
            }`}
          >
            Fabrics
          </button>
        </div>

        {mode === "design" && (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium text-navy"
          >
            {designCategories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.label}
              </option>
            ))}
          </select>
        )}
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
          if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
        }}
        className={`mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-colors ${
          dragOver ? "border-brand bg-brand/5" : "border-line bg-mist"
        }`}
      >
        <p className="font-semibold text-navy">Drag images here, or click to choose files</p>
        <p className="mt-1 text-sm text-slate">
          JPG, PNG or WEBP, up to {MAX_MB}MB each &middot; uploading to{" "}
          <code className="rounded bg-white px-1 py-0.5">{prefix}</code>
        </p>
        <input
          id={inputId}
          type="file"
          multiple
          accept={ALLOWED_UPLOAD_CONTENT_TYPES.join(",")}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {queue.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-navy">Upload queue ({queue.length})</h2>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setQueue((q) => q.filter((x) => x.status === "uploading"))}
                className="text-sm text-slate hover:text-navy"
              >
                Clear finished
              </button>
              <button
                type="button"
                onClick={startUpload}
                disabled={!hasQueued || hasActive}
                className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
              >
                {hasActive ? "Uploading..." : `Upload ${queue.filter((q) => q.status === "queued").length} file(s)`}
              </button>
            </div>
          </div>
          <ul className="mt-3 space-y-2">
            {queue.map((item) => (
              <li key={item.id} className="flex items-center gap-3 rounded-lg border border-line bg-white px-4 py-2 text-sm">
                <span className="flex-1 truncate">{item.file.name}</span>
                <span className="text-xs text-slate">{formatSize(item.file.size)}</span>
                {item.status === "queued" && <span className="text-xs text-slate">Queued</span>}
                {item.status === "uploading" && (
                  <span className="text-xs font-medium text-brand">{item.progress}%</span>
                )}
                {item.status === "done" && <span className="text-xs font-medium text-green-700">Done</span>}
                {item.status === "error" && (
                  <span className="text-xs font-medium text-red-700">{item.error}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10">
        <h2 className="text-sm font-semibold text-navy">
          Currently live under <code className="rounded bg-mist px-1 py-0.5">{prefix}</code>
          {!loadingExisting && ` (${existing.length})`}
        </h2>
        {loadingExisting ? (
          <p className="mt-3 text-sm text-slate">Loading...</p>
        ) : existing.length === 0 ? (
          <p className="mt-3 text-sm text-slate">No uploads yet in this category.</p>
        ) : (
          <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {existing.map((blob) => (
              <div key={blob.url} className="group relative overflow-hidden rounded-lg border border-line bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element -- admin thumbnail grid of remote blob URLs */}
                <img src={blob.url} alt="" className="aspect-square w-full object-cover" loading="lazy" />
                <button
                  type="button"
                  onClick={() => handleDelete(blob.url)}
                  aria-label="Delete"
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
