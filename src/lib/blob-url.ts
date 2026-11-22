/**
 * Helpers shared by server and browser code (no Blob SDK import here).
 *
 * This project's Vercel Blob store is PRIVATE, so files can't be shown with their raw
 * blob URL. Images are delivered through /api/blob-image instead (see that route).
 * If the store is ever switched to a public one, set NEXT_PUBLIC_BLOB_ACCESS=public.
 */
export const BLOB_UPLOAD_ACCESS: "public" | "private" =
  process.env.NEXT_PUBLIC_BLOB_ACCESS === "public" ? "public" : "private";

/** URL to use in <img src>: the raw URL for public blobs, the delivery route for private ones. */
export function blobImageSrc(url: string, pathname: string): string {
  return url.includes(".private.blob.") ? `/api/blob-image?pathname=${encodeURIComponent(pathname)}` : url;
}
