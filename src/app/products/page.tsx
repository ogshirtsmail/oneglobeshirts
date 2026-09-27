import type { Metadata } from "next";
import Link from "next/link";
import { audiences, sports } from "@/lib/content";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Custom jerseys, team kits, shorts, tracks and shirts for cricket, basketball, soccer, volleyball, rugby, tennis and more.",
};

export default function ProductsPage() {
  return (
    <div>
      <section className="bg-mist px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">Product portfolio</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-navy">
            One supplier for multiple sports and apparel needs
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate">
            From full team kits to everyday shirts, every piece can be customized
            with your colors, names, numbers and logos.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {sports.map((sport) => (
            <div key={sport.name} className="rounded-2xl border border-line p-6">
              <h2 className="text-lg font-bold text-navy">{sport.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate">{sport.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-mist py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-extrabold tracking-tight text-navy">Who we serve</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {audiences.map((item) => (
              <li key={item} className="rounded-xl bg-white px-5 py-4 text-sm text-ink shadow-sm">
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/contact"
            className="mt-10 inline-block rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Request a Custom Quote
          </Link>
        </div>
      </section>
    </div>
  );
}
