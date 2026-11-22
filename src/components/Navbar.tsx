"use client";

import Link from "next/link";
import { useState } from "react";
import Logo from "@/components/Logo";
import AdminMenuBar, { useIsAdmin } from "@/components/AdminMenuBar";

const links = [
  { href: "/products", label: "Products" },
  { href: "/design-collection", label: "Designs" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/fabrics", label: "Fabrics" },
  { href: "/design-your-shirt.html", label: "Design Your Shirt" },
  { href: "/og-shirts-order-form.html", label: "Order Form" },
  { href: "/about", label: "About" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const isAdmin = useIsAdmin();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur-sm">
      <AdminMenuBar isAdmin={isAdmin} />
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
        <Link href="/" className="shrink-0 text-navy" onClick={() => setOpen(false)}>
          <Logo idPrefix="nav" />
        </Link>

        <ul className="hidden items-center gap-5 lg:flex xl:gap-8">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="whitespace-nowrap text-sm font-medium text-slate transition-colors hover:text-brand"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/contact"
          className="hidden shrink-0 whitespace-nowrap rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark lg:inline-block"
        >
          Request a Quote
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
          className="flex flex-col gap-1.5 p-2 lg:hidden"
        >
          <span className={`h-0.5 w-6 bg-navy transition-transform ${open ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`h-0.5 w-6 bg-navy transition-opacity ${open ? "opacity-0" : ""}`} />
          <span className={`h-0.5 w-6 bg-navy transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>
      </nav>

      {open && (
        <ul className="flex flex-col gap-1 border-t border-line px-6 py-4 lg:hidden">
          {[...links, { href: "/contact", label: "Request a Quote" }].map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={() => setOpen(false)}
                className="block rounded-md px-2 py-2.5 text-base font-medium text-slate hover:bg-mist hover:text-navy"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
