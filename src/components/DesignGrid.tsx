"use client";

import { useEffect, useRef, useState } from "react";

type Design = { file: string; src: string; uploaded?: boolean; url?: string };

export default function DesignGrid({
  designs: initialDesigns,
  categoryLabel,
  pageSize = 100,
  adminCategory,
}: {
  designs: Design[];
  categoryLabel: string;
  pageSize?: number;
  /** Set only for admins (allowed IPs): shows a delete button on each design. */
  adminCategory?: string;
}) {
  const [designs, setDesigns] = useState(initialDesigns);
  const [busy, setBusy] = useState<string | null>(null);
  const [visible, setVisible] = useState(Math.min(pageSize, initialDesigns.length));

  // Pick up server changes (e.g. after an upload + router.refresh()).
  useEffect(() => {
    setDesigns(initialDesigns);
  }, [initialDesigns]);

  async function removeDesign(design: Design) {
    if (!adminCategory) return;
    const what = design.uploaded
      ? "Delete this uploaded design permanently?"
      : "Remove this design from the site? (You can restore it from the admin panel above.)";
    if (!window.confirm(what)) return;
    setBusy(design.src);
    try {
      const res = design.uploaded
        ? await fetch("/api/admin/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: design.url ?? design.src }),
          })
        : await fetch("/api/admin/designs", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "hide", category: adminCategory, file: design.file }),
          });
      if (!res.ok) throw new Error(String(res.status));
      setDesigns((list) => list.filter((d) => d.src !== design.src));
    } catch {
      window.alert("Sorry, that design couldn't be removed. Please try again.");
    } finally {
      setBusy(null);
    }
  }
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Load the next 100 automatically as the sentinel scrolls into view.
  useEffect(() => {
    if (visible >= designs.length) return;
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible((v) => Math.min(v + pageSize, designs.length));
        }
      },
      { rootMargin: "800px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible, designs.length, pageSize]);

  const shown = designs.slice(0, visible);

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
        {shown.map((design, i) => (
          <div
            key={design.src}
            className={`relative overflow-hidden rounded-xl border border-line bg-white ${
              busy === design.src ? "opacity-40" : ""
            }`}
          >
            {adminCategory && (
              <button
                type="button"
                onClick={() => removeDesign(design)}
                disabled={busy === design.src}
                aria-label={`Delete design ${i + 1}`}
                title={design.uploaded ? "Delete (uploaded image)" : "Remove from site (can be restored)"}
                className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-lg leading-none text-white shadow transition-colors hover:bg-red-600"
              >
                &times;
              </button>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element -- large static catalog; plain <img> with native lazy-loading avoids per-image optimizer overhead */}
            <img
              src={design.src}
              alt={`Custom ${categoryLabel.toLowerCase()} design ${i + 1}`}
              width={1080}
              height={1080}
              loading="lazy"
              decoding="async"
              className="aspect-square w-full object-cover"
            />
          </div>
        ))}
      </div>

      {visible < designs.length && (
        <div ref={sentinelRef} className="flex justify-center py-10">
          <button
            type="button"
            onClick={() => setVisible((v) => Math.min(v + pageSize, designs.length))}
            className="rounded-full border border-line px-6 py-3 text-sm font-semibold text-navy transition-colors hover:border-brand hover:text-brand"
          >
            Load more ({designs.length - visible} remaining)
          </button>
        </div>
      )}

      <p className="mt-8 text-center text-xs text-slate">
        Showing {shown.length} of {designs.length}
      </p>
    </>
  );
}
