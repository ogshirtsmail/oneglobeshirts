import type { Metadata } from "next";
import Link from "next/link";
import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import DesignSubNav from "@/components/DesignSubNav";
import DesignGrid from "@/components/DesignGrid";
import { getDesignCategory } from "@/lib/design-categories";
import { listBlobImages } from "@/lib/blob";

// Pages depend on live Blob uploads (see /admin/upload), so they must be
// rendered per-request rather than baked in at build time.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = getDesignCategory(category);
  if (!cat) return {};
  return {
    title: cat.label,
    description: `Browse One Globe's ${cat.label.toLowerCase()} designs, customizable with your colors, names, numbers and logo.`,
  };
}

function getLocalDesigns(slug: string) {
  const dir = path.join(process.cwd(), "public", "designs", slug);
  if (!fs.existsSync(dir)) return [];
  const files = fs
    .readdirSync(dir)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  return files.map((file) => ({ file, src: `/designs/${slug}/${file}` }));
}

async function getCategoryDesigns(slug: string) {
  const [local, uploaded] = await Promise.all([
    getLocalDesigns(slug),
    listBlobImages(`designs/${slug}/`),
  ]);
  return [...local, ...uploaded];
}

export default async function DesignCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = getDesignCategory(category);
  if (!cat) notFound();

  const designs = await getCategoryDesigns(cat.slug);

  return (
    <div>
      <section className="bg-mist px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">
            Design collection
          </p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-navy">
            {designs.length > 0 ? `${designs.length}+ ${cat.label.toLowerCase()}, ready to customize` : cat.label}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate">
            {designs.length > 0
              ? "Every design here can be customized with your colors, names, numbers and logo. Tell us which ones catch your eye when you request a quote."
              : `We're building out the ${cat.label.toLowerCase()} design library. Tell us what you're after and we'll help you find or create it.`}
          </p>
        </div>
      </section>

      <DesignSubNav activeSlug={cat.slug} />

      {designs.length > 0 ? (
        <section className="mx-auto max-w-6xl px-6 py-16">
          <DesignGrid designs={designs} categoryLabel={cat.label} pageSize={100} />
        </section>
      ) : (
        <section className="mx-auto max-w-6xl px-6 py-20 text-center">
          <div className="mx-auto max-w-md rounded-2xl border border-line bg-mist p-10">
            <h2 className="text-xl font-bold text-navy">
              {cat.label} designs coming soon
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate">
              This category doesn&apos;t have sample designs online yet.
              Reach out with your idea and we&apos;ll work with you directly.
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-block rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              Request a Custom Quote
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
