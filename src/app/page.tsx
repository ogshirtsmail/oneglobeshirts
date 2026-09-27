import Link from "next/link";
import FabricCard from "@/components/FabricCard";
import ProcessSteps from "@/components/ProcessSteps";
import { fabrics, sports, strengths } from "@/lib/content";
import { site } from "@/lib/site";

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <p className="text-sm font-semibold uppercase tracking-widest text-white/60">
            From custom sportswear to a nationwide apparel brand
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
            Your team. Your design. Your fabric.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/75">
            One Globe designs and manufactures custom jerseys, team kits and
            apparel. Choose from 1,000+ designs or create your own, compare
            fabrics in hand, and approve a sample before your bulk order.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="rounded-full bg-white px-6 py-3 text-center text-sm font-semibold text-navy transition-colors hover:bg-mist"
            >
              Request a Custom Quote
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-full border border-white/30 px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:border-white/60"
            >
              See How It Works
            </Link>
          </div>
          <dl className="mt-14 grid max-w-2xl grid-cols-3 gap-6 border-t border-white/15 pt-8">
            <div>
              <dt className="text-xs uppercase tracking-wide text-white/50">Designs</dt>
              <dd className="mt-1 text-2xl font-bold sm:text-3xl">1,000+</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-white/50">Fabric options</dt>
              <dd className="mt-1 text-2xl font-bold sm:text-3xl">{fabrics.length}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-white/50">Before bulk</dt>
              <dd className="mt-1 text-2xl font-bold sm:text-3xl">Sample</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Sports */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand">Product portfolio</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-navy">
          One supplier for multiple sports and apparel needs
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sports.slice(0, 7).map((sport) => (
            <div key={sport.name} className="rounded-2xl border border-line bg-mist p-6">
              <h3 className="font-bold text-navy">{sport.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate">{sport.description}</p>
            </div>
          ))}
          <Link
            href="/products"
            className="flex items-center justify-center rounded-2xl bg-brand p-6 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            View all products →
          </Link>
        </div>
      </section>

      {/* Why */}
      <section className="bg-mist py-20">
        <div className="mx-auto max-w-6xl px-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">Why One Globe?</p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-navy">
            Flexible, customer-driven, low risk
          </h2>
          <div className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {strengths.map((item) => (
              <div key={item.title}>
                <h3 className="font-bold text-navy">{item.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand">How it works</p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-navy">
          You imagine it. OG designs it. You approve it.
        </h2>
        <div className="mt-10">
          <ProcessSteps />
        </div>
      </section>

      {/* Fabrics */}
      <section className="bg-mist py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-brand">Fabrics</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-navy">
                Compare fabrics before we make your sample
              </h2>
            </div>
            <Link href="/fabrics" className="text-sm font-semibold text-brand hover:text-brand-dark">
              All fabric options →
            </Link>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {fabrics.slice(0, 3).map((fabric) => (
              <FabricCard key={fabric.slug} fabric={fabric} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy py-20 text-center text-white">
        <div className="mx-auto max-w-2xl px-6">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{site.tagline}</h2>
          <p className="mt-4 text-white/70">
            Tell us your sport, colors, logo, style and quantity, and we&apos;ll
            take it from there.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-block rounded-full bg-white px-6 py-3 text-sm font-semibold text-navy transition-colors hover:bg-mist"
          >
            Request a Custom Quote
          </Link>
        </div>
      </section>
    </>
  );
}
