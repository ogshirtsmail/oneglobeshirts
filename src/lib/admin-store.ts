import { del, list, put } from "@vercel/blob";
import { isBlobConfigured } from "./blob";
import { designCategories } from "./design-categories";

/*
 * Small settings store kept in Vercel Blob (no database needed):
 *  - settings/admin-ips/<ip>~<label>.txt          -> one file per allowed admin IP
 *  - settings/hidden-designs/<category>/<file>.txt -> built-in design images hidden from the site
 * Everything is encoded in the pathname, so reads only need list() (no file downloads, no CDN caching issues).
 */

const ADMIN_IP_PREFIX = "settings/admin-ips/";
const HIDDEN_PREFIX = "settings/hidden-designs/";

export type StoredAdminIp = { ip: string; label: string; addedAt: string };

async function listAll(prefix: string) {
  const out: { pathname: string; url: string; uploadedAt: Date }[] = [];
  let cursor: string | undefined;
  do {
    const res = await list({ prefix, cursor, limit: 1000 });
    for (const b of res.blobs) out.push({ pathname: b.pathname, url: b.url, uploadedAt: b.uploadedAt });
    cursor = res.hasMore ? res.cursor : undefined;
  } while (cursor);
  return out;
}

async function putMarker(pathname: string) {
  await put(pathname, "1", {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "text/plain",
  });
}

// ---------------------------------------------------------------- admin IPs

const IPV4 = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
const IPV6 = /^[0-9a-fA-F:]{2,39}$/;

export function normalizeIp(raw: string): string | null {
  const ip = raw.trim().toLowerCase();
  if (IPV4.test(ip)) return ip;
  if (ip.includes(":") && IPV6.test(ip)) return ip;
  return null;
}

const encIp = (ip: string) => ip.replace(/:/g, "_");
const decIp = (s: string) => s.replace(/_/g, ":");
const encLabel = (label: string) => Buffer.from(label.slice(0, 60), "utf8").toString("base64url");
const decLabel = (s: string) => {
  try {
    return Buffer.from(s, "base64url").toString("utf8");
  } catch {
    return "";
  }
};

let ipCache: { at: number; ips: StoredAdminIp[] } | null = null;
const IP_CACHE_MS = 30_000;

export async function getStoredAdminIps(fresh = false): Promise<StoredAdminIp[]> {
  if (!isBlobConfigured()) return [];
  if (!fresh && ipCache && Date.now() - ipCache.at < IP_CACHE_MS) return ipCache.ips;
  try {
    const blobs = await listAll(ADMIN_IP_PREFIX);
    const ips = blobs
      .map((b) => {
        const name = b.pathname.slice(ADMIN_IP_PREFIX.length).replace(/\.txt$/, "");
        const [ipPart, labelPart = ""] = name.split("~");
        return { ip: decIp(ipPart), label: decLabel(labelPart), addedAt: new Date(b.uploadedAt).toISOString() };
      })
      .filter((x) => normalizeIp(x.ip));
    ipCache = { at: Date.now(), ips };
    return ips;
  } catch (err) {
    console.error("Could not read admin IP list from Blob:", err);
    return ipCache?.ips ?? [];
  }
}

export async function addAdminIp(ip: string, label: string) {
  await removeAdminIp(ip); // replace any older entry (e.g. new label)
  await putMarker(`${ADMIN_IP_PREFIX}${encIp(ip)}~${encLabel(label)}.txt`);
  ipCache = null;
}

export async function removeAdminIp(ip: string) {
  const blobs = await listAll(`${ADMIN_IP_PREFIX}${encIp(ip)}~`);
  if (blobs.length) await del(blobs.map((b) => b.url));
  ipCache = null;
}

// ---------------------------------------------------------------- hidden built-in designs

const SAFE_FILE = /^[A-Za-z0-9._-]{1,150}$/;

export function isValidDesignRef(category: string, file: string) {
  return designCategories.some((c) => c.slug === category) && SAFE_FILE.test(file) && /\.(jpe?g|png|webp)$/i.test(file);
}

export async function getHiddenDesigns(category: string): Promise<Set<string>> {
  if (!isBlobConfigured()) return new Set();
  try {
    const blobs = await listAll(`${HIDDEN_PREFIX}${category}/`);
    return new Set(blobs.map((b) => b.pathname.slice(`${HIDDEN_PREFIX}${category}/`.length).replace(/\.txt$/, "")));
  } catch (err) {
    console.error("Could not read hidden designs from Blob:", err);
    return new Set();
  }
}

export async function hideDesign(category: string, file: string) {
  await putMarker(`${HIDDEN_PREFIX}${category}/${file}.txt`);
}

export async function restoreDesign(category: string, file: string) {
  const blobs = await listAll(`${HIDDEN_PREFIX}${category}/${file}.txt`);
  if (blobs.length) await del(blobs.map((b) => b.url));
}
