import type { Metadata } from "next";
import Link from "next/link";
import fs from "node:fs";
import path from "node:path";
import FabricCard from "@/components/FabricCard";
import DesignGrid from "@/components/DesignGrid";
import { fabrics } from "@/lib/content";
import { listBlobImages } from "@/lib/blob";

// Depends on live Blob uploads (see /admin/upload) and local files added to
// public/fabrics/, so render per-request rather than at build time.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Fabrics",
  description:
    "Compare performance knits, interlocks, jacquards and meshes before we manufacture your sample.",
};

/** Any image file in public/fabrics/ that isn't already one of the curated fabrics above. */
function getExtraLocalFabrics() {
  const dir = path.join(process.cwd(), "public", "fabrics");
  if (!fs.existsSync(dir)) return [];
  const curatedFiles = new Set(fabrics.map((f) => f.image.split("/").pop()));
  return fs
    .readdirSync(dir)
    .filter((f) => /\.(jpe?g|png|webp)$/i.test(f) && !curatedFiles.has(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((file) => ({ file, src: `/fabrics/${file}` }));
}

export default async function FabricsPage() {
  const [extraLocalFabrics, uploadedFabrics] = await Promise.all([
    getExtraLocalFabrics(),
    listBlobImages("fabrics/"),
  ]);
  const moreFabrics = [...extraLocalFabrics, ...uploadedFabrics];

  return (
    <div>
      <section className="bg-mist px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">Quality &amp; fabric</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-navy">
            Options instead of one-size-fits-all material
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate">
            Different sports, budgets and performance needs call for different
            fabrics. Compare texture, weight and comfort in hand before we
            manufacture your sample.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {fabrics.map((fabric) => (
            <FabricCard key={fabric.slug} fabric={fabric} />
          ))}
        </div>
        <p className="mt-8 text-sm text-slate">
          Exact composition and GSM are available on request.
        </p>
      </section>

      {moreFabrics.length > 0 && (
        <section className="bg-mist py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-2xl font-extrabold tracking-tight text-navy">More fabrics</h2>
            <div className="mt-8">
              <DesignGrid designs={moreFabrics} categoryLabel="fabric" pageSize={100} />
            </div>
          </div>
        </section>
      )}

      <section className="bg-navy py-16 text-center text-white">
        <div className="mx-auto max-w-xl px-6">
          <h2 className="text-2xl font-extrabold tracking-tight">Want to feel the fabrics?</h2>
          <p className="mt-3 text-white/70">
            Ask us about fabric samples and we&apos;ll help you choose.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold text-navy transition-colors hover:bg-mist"
          >
            Ask for samples
          </Link>
        </div>
      </section>
    </div>
  );
}
