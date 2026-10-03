import { designCategories } from "./design-categories";

export const ALLOWED_UPLOAD_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_UPLOAD_SIZE_BYTES = 15 * 1024 * 1024; // 15MB, enough for a phone photo

export type UploadTarget = { type: "design"; category: string } | { type: "fabric" };

export function prefixFor(target: UploadTarget): string {
  return target.type === "design" ? `designs/${target.category}/` : "fabrics/";
}

/** Strips path separators and anything that isn't filename-safe. */
export function sanitizeFilename(name: string): string {
  const base = name.split(/[/\\]/).pop() || "file";
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "-");
  return cleaned.slice(-150) || "file";
}

export function pathnameFor(target: UploadTarget, filename: string): string {
  return `${prefixFor(target)}${sanitizeFilename(filename)}`;
}

/** Validates a blob pathname (as received server-side) against a known upload target. */
export function targetFromPathname(pathname: string): UploadTarget | null {
  if (pathname.startsWith("designs/")) {
    const rest = pathname.slice("designs/".length);
    const slash = rest.indexOf("/");
    if (slash <= 0) return null;
    const category = rest.slice(0, slash);
    if (!designCategories.some((c) => c.slug === category)) return null;
    return { type: "design", category };
  }
  if (pathname.startsWith("fabrics/")) {
    return { type: "fabric" };
  }
  return null;
}
