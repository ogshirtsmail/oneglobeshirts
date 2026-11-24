/**
 * Minimal server-only Supabase client using its REST APIs (PostgREST + Storage) via fetch,
 * so no extra npm package is needed. Uses the service-role key: NEVER import this from a
 * "use client" component.
 *
 * Env vars (Vercel > Project > Settings > Environment Variables):
 *   SUPABASE_URL               https://<project-ref>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY  a secret key (sb_secret_…) or the legacy service_role key
 *                              (Supabase > Project Settings > API Keys)
 */

export const ORDER_BUCKET = "order-files";

/**
 * While ORDERS_PUBLIC isn't "true", only admin IPs can start new online orders
 * (everyone else gets the classic quote form). Set ORDERS_PUBLIC=true in Vercel to launch.
 */
export function ordersArePublic() {
  return process.env.ORDERS_PUBLIC === "true";
}

export function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function base() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  return { url: url.replace(/\/$/, ""), key };
}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  const { key } = base();
  // New secret keys (sb_secret_…) are not JWTs: Supabase only accepts them in the `apikey`
  // header and rejects them in `Authorization: Bearer`. Legacy service_role JWTs use both.
  return key.startsWith("sb_") ? { apikey: key, ...extra } : { apikey: key, Authorization: `Bearer ${key}`, ...extra };
}

async function check(res: Response, what: string) {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${what} failed (${res.status}): ${text.slice(0, 300)}`);
  }
}

// ---------------------------------------------------------------- database (PostgREST)

/** GET rows. `query` is a PostgREST query string, e.g. "select=*&order_no=eq.OG-1". */
export async function dbSelect<T>(table: string, query: string): Promise<T[]> {
  const res = await fetch(`${base().url}/rest/v1/${table}?${query}`, {
    headers: headers(),
    cache: "no-store",
  });
  await check(res, `select ${table}`);
  return (await res.json()) as T[];
}

/** INSERT one or more rows and return them. */
export async function dbInsert<T>(table: string, rows: object | object[]): Promise<T[]> {
  const res = await fetch(`${base().url}/rest/v1/${table}`, {
    method: "POST",
    headers: headers({ "Content-Type": "application/json", Prefer: "return=representation" }),
    body: JSON.stringify(rows),
    cache: "no-store",
  });
  await check(res, `insert ${table}`);
  return (await res.json()) as T[];
}

/** UPDATE rows matching `filter` (PostgREST filter, e.g. "id=eq.123") and return them. */
export async function dbUpdate<T>(table: string, filter: string, patch: object): Promise<T[]> {
  const res = await fetch(`${base().url}/rest/v1/${table}?${filter}`, {
    method: "PATCH",
    headers: headers({ "Content-Type": "application/json", Prefer: "return=representation" }),
    body: JSON.stringify(patch),
    cache: "no-store",
  });
  await check(res, `update ${table}`);
  return (await res.json()) as T[];
}

// ---------------------------------------------------------------- storage (private bucket)

export async function storageUpload(path: string, body: Blob | ArrayBuffer, contentType: string) {
  const res = await fetch(`${base().url}/storage/v1/object/${ORDER_BUCKET}/${encodePath(path)}`, {
    method: "POST",
    headers: headers({ "Content-Type": contentType || "application/octet-stream", "x-upsert": "false" }),
    body,
    cache: "no-store",
  });
  await check(res, "storage upload");
}

/** Short-lived signed links for private files (batch). Returns path -> absolute URL. */
export async function storageSignedUrls(paths: string[], expiresIn = 3600): Promise<Record<string, string>> {
  if (!paths.length) return {};
  const { url } = base();
  const res = await fetch(`${url}/storage/v1/object/sign/${ORDER_BUCKET}`, {
    method: "POST",
    headers: headers({ "Content-Type": "application/json" }),
    body: JSON.stringify({ expiresIn, paths }),
    cache: "no-store",
  });
  await check(res, "storage sign");
  const list = (await res.json()) as { path: string | null; signedURL: string | null; error: string | null }[];
  const out: Record<string, string> = {};
  for (const item of list) {
    if (item.path && item.signedURL) out[item.path] = `${url}/storage/v1${item.signedURL}`;
  }
  return out;
}

function encodePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

/** PostgREST value escaping for eq filters. */
export const eq = (v: string | number) => `eq.${encodeURIComponent(String(v))}`;
