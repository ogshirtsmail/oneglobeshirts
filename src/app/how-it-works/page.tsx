import type { Metadata } from "next";
import Link from "next/link";
import ProcessSteps from "@/components/ProcessSteps";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "From idea to approved production: share your idea, choose a design and fabric, approve a sample, then we manufacture.",
};

const business = [
  {
    title: "1. Your need",
    items: ["Sport / occasion", "Design preference", "Quantity", "Budget", "Fabric requirement"],
  },
  {
    title: "2. Our solution",
    items: ["Design options", "Fabric samples", "Custom sample", "Pricing", "Manufacturing coordination"],
  },
  {
    title: "3. Your value",
    items: ["More choice", "Lower risk", "Competitive pricing", "Small-order flexibility", "Quality-focused delivery"],
  },
];

export default function HowItWorksPage() {
  return (
    <div>
      <section className="bg-mist px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">Customer-first process</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-navy">
            From idea to approved production
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate">
            You imagine it. OG designs it. You choose the fabric. OG samples it.
            You approve it. OG manufactures it.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <ProcessSteps />
      </section>

      <section className="bg-mist py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-2xl font-extrabold tracking-tight text-navy">
            A flexible, sample-first approach
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {business.map((col) => (
              <div key={col.title} className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="font-bold text-brand">{col.title}</h3>
                <ul className="mt-3 space-y-2 text-sm text-slate">
                  {col.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <Link
            href="/contact"
            className="mt-10 inline-block rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Start with your idea
          </Link>
        </div>
      </section>
    </div>
  );
}
