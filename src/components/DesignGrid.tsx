"use client";

import { useEffect, useRef, useState } from "react";

type Design = { file: string; src: string };

export default function DesignGrid({
  designs,
  categoryLabel,
  pageSize = 100,
}: {
  designs: Design[];
  categoryLabel: string;
  pageSize?: number;
}) {
  const [visible, setVisible] = useState(Math.min(pageSize, designs.length));
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
            key={design.file}
            className="overflow-hidden rounded-xl border border-line bg-white"
          >
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
