import Link from "next/link";
import Logo from "@/components/Logo";
import { site } from "@/lib/site";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy text-white/70">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[2fr_1fr_1fr]">
          <div>
            <Logo className="text-white" idPrefix="footer" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
              Custom sportswear and apparel. Flexible orders, quality
              manufacturing and a sample for your approval before every bulk
              order.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Explore</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/products" className="hover:text-white">Products</Link></li>
              <li><Link href="/how-it-works" className="hover:text-white">How It Works</Link></li>
              <li><Link href="/fabrics" className="hover:text-white">Fabrics</Link></li>
              <li><Link href="/about" className="hover:text-white">About</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">Get in touch</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href={`mailto:${site.contactEmail}`} className="hover:text-white">
                  {site.contactEmail}
                </a>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white">
                  Request a quote
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/40 sm:flex-row sm:justify-between">
          <p>© {year} One Globe (OG). All rights reserved.</p>
          <p>{site.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
