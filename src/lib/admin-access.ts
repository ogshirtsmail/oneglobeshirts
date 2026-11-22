import { getStoredAdminIps } from "./admin-store";

const LOCAL_IPS = new Set(["127.0.0.1", "::1"]);

type HeaderSource = { get(name: string): string | null };

export function getClientIpFromHeaders(headers: HeaderSource): string | null {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const xri = headers.get("x-real-ip");
  if (xri) return xri.trim();
  return null;
}

function getClientIp(request: Request): string | null {
  return getClientIpFromHeaders(request.headers);
}

/** IPs set in the ADMIN_ALLOWED_IPS environment variable (Vercel settings). Always allowed, can't be removed from the admin page. */
export function envAdminIps(): string[] {
  return (process.env.ADMIN_ALLOWED_IPS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Decides whether an IP may use the admin area. Allowed: local development
 * connections, IPs in ADMIN_ALLOWED_IPS, and IPs added on /admin/access
 * (stored in Vercel Blob). Fails open only for header-less connections in
 * development (`next dev` on your own machine) and closed everywhere else.
 */
export async function isAdminIp(ip: string | null): Promise<boolean> {
  if (!ip) return process.env.NODE_ENV !== "production";
  const norm = ip.trim().toLowerCase();
  if (LOCAL_IPS.has(norm)) return true;
  if (envAdminIps().includes(norm)) return true;
  const stored = await getStoredAdminIps();
  return stored.some((s) => s.ip === norm);
}

/** Gates /admin and /api/admin/* (see src/proxy.ts and each admin route). */
export async function isAllowedAdminRequest(request: Request): Promise<boolean> {
  return isAdminIp(getClientIp(request));
}

/** For Server Components: pass the result of `await headers()`. */
export async function isAdminFromHeaders(headers: HeaderSource): Promise<boolean> {
  return isAdminIp(getClientIpFromHeaders(headers));
}

export { getClientIp };
