"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const CACHE_KEY = "og-admin-check";
const CACHE_MS = 10 * 60 * 1000; // re-check every 10 minutes

export const adminLinks = [
  { href: "/design-collection/jerseys", label: "Manage designs" },
  { href: "/admin/upload", label: "Upload page" },
  { href: "/admin/access", label: "Admin IPs" },
  { href: "/og-shirts-order-form.html", label: "Order form" },
];

/** Asks the server (once per 10 min) whether this visitor's IP is on the admin list. */
export function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    let cancelled = false;
    try {
      const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || "null") as { v: boolean; at: number } | null;
      if (cached && Date.now() - cached.at < CACHE_MS) {
        setIsAdmin(cached.v);
        return;
      }
    } catch {}
    fetch("/api/admin/me", { cache: "no-store" })
      .then((r) => r.ok)
      .catch(() => false)
      .then((ok) => {
        if (cancelled) return;
        setIsAdmin(ok);
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({ v: ok, at: Date.now() }));
        } catch {}
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return isAdmin;
}

/** Slim admin bar shown above the main menu — only for allowed admin IPs. */
export default function AdminMenuBar({ isAdmin }: { isAdmin: boolean }) {
  if (!isAdmin) return null;
  return (
    <div className="bg-navy text-white">
      <div className="mx-auto flex max-w-7xl items-center gap-5 overflow-x-auto px-6 py-1.5 text-xs">
        <span className="shrink-0 rounded bg-amber-400 px-1.5 py-0.5 font-bold uppercase tracking-wider text-navy">
          Admin
        </span>
        {adminLinks.map((l) => (
          <Link key={l.href} href={l.href} className="shrink-0 whitespace-nowrap font-medium text-white/85 hover:text-white">
            {l.label}
          </Link>
        ))}
        <span className="ml-auto hidden shrink-0 text-white/50 sm:inline">Only visible to your admin IPs</span>
      </div>
    </div>
  );
}
