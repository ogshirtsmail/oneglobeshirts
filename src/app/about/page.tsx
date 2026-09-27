import type { Metadata } from "next";
import Link from "next/link";
import { strengths } from "@/lib/content";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description:
    "One Globe is building a trusted U.S. apparel brand through flexible customization, extensive design choice, quality manufacturing and competitive pricing.",
};

const promise = ["Choice", "Customization", "Sample approval", "Consistent manufacturing", "Customer-focused quality"];

const quality = [
  "Multiple fabric choices for different sports, budgets and performance needs",
  "Physical fabric samples to compare texture, weight and comfort",
  "Full-sublimation and other custom-printing approaches where appropriate",
  "Quality stitching, fit, durability and finishing, not only the printed design",
  "A finished sample before larger orders to reduce your risk",
  "Capability beyond jerseys: shirts, tracks and shorts",
];

export default function AboutPage() {
  return (
    <div>
      <section className="bg-navy px-6 py-20 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-white/60">Our vision</p>
          <h1 className="mt-2 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            A flexible, customer-driven apparel business
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-white/75">
            To build One Globe into a trusted U.S. apparel brand by combining
            flexible customization, extensive design choices, quality
            manufacturing and competitive pricing.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-extrabold tracking-tight text-navy">Where we&apos;re going</h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          <li className="rounded-2xl border border-line p-6 text-slate">
            <span className="font-bold text-navy">Start</span> with customized sportswear and team apparel.
          </li>
          <li className="rounded-2xl border border-line p-6 text-slate">
            <span className="font-bold text-navy">Expand</span> into school, office, party and general apparel.
          </li>
          <li className="rounded-2xl border border-line p-6 text-slate">
            <span className="font-bold text-navy">Grow</span> from direct orders to online and nationwide distribution.
          </li>
        </ul>
      </section>

      <section className="bg-mist py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-navy">Quality &amp; fabric strategy</h2>
            <ul className="mt-6 space-y-3 text-slate">
              {quality.map((q) => (
                <li key={q} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <h3 className="text-lg font-bold text-brand">The OG Quality Promise</h3>
            <ul className="mt-4 flex flex-wrap gap-2">
              {promise.map((p) => (
                <li key={p} className="rounded-full bg-mist px-4 py-2 text-sm font-medium text-navy">
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-extrabold tracking-tight text-navy">Why customers choose One Globe</h2>
        <div className="mt-8 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {strengths.map((item) => (
            <div key={item.title}>
              <h3 className="font-bold text-navy">{item.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className="bg-mist py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-[1fr_1.2fr] md:items-center">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-navy">Contact us</h2>
            <p className="mt-3 leading-relaxed text-slate">
              Tell us your sport, colors, logo, style and quantity and we&apos;ll
              get back to you with designs, fabric options and a sample plan.
            </p>
            <Link
              href="/contact"
              className="mt-6 inline-block rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              Request a Quote
            </Link>
          </div>
          <dl className="space-y-5 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate">Email</dt>
              <dd className="mt-1">
                <a href={`mailto:${site.contactEmail}`} className="font-medium text-brand hover:text-brand-dark">
                  {site.contactEmail}
                </a>
              </dd>
            </div>
            {site.contactPhone && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate">Phone</dt>
                <dd className="mt-1">
                  <a
                    href={`tel:${site.contactPhone.replace(/[^\d+]/g, "")}`}
                    className="font-medium text-brand hover:text-brand-dark"
                  >
                    {site.contactPhone}
                  </a>
                </dd>
              </div>
            )}
            {site.contactAddress && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate">Address</dt>
                <dd className="mt-1 whitespace-pre-line text-ink">{site.contactAddress}</dd>
              </div>
            )}
          </dl>
        </div>
      </section>
    </div>
  );
}
