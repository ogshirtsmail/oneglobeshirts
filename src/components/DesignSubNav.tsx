import Link from "next/link";
import { designCategories } from "@/lib/design-categories";

export default function DesignSubNav({ activeSlug }: { activeSlug: string }) {
  return (
    <div className="border-b border-line bg-white">
      <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-6">
        {designCategories.map((cat) => {
          const active = cat.slug === activeSlug;
          return (
            <Link
              key={cat.slug}
              href={`/design-collection/${cat.slug}`}
              className={`shrink-0 border-b-2 px-4 py-4 text-sm font-semibold whitespace-nowrap transition-colors ${
                active
                  ? "border-brand text-brand"
                  : "border-transparent text-slate hover:text-navy"
              }`}
            >
              {cat.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
