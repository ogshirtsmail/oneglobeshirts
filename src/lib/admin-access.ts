const LOCAL_IPS = new Set(["127.0.0.1", "::1"]);

function getClientIp(request: Request): string | null {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const xri = request.headers.get("x-real-ip");
  if (xri) return xri.trim();
  return null;
}

function allowedIpsFromEnv(): string[] {
  return (process.env.ADMIN_ALLOWED_IPS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Gates access to /admin and /api/admin/*. Fails open only for direct,
 * header-less connections in development (i.e. `next dev` on your own
 * machine) and fails closed everywhere else, including production requests
 * with no forwarded-IP header at all.
 */
export function isAllowedAdminRequest(request: Request): boolean {
  const ip = getClientIp(request);
  if (!ip) return process.env.NODE_ENV !== "production";
  if (LOCAL_IPS.has(ip)) return true;
  return allowedIpsFromEnv().includes(ip);
}

export { getClientIp };
