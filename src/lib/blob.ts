import { list } from "@vercel/blob";
import { blobImageSrc } from "./blob-url";

export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** Lists uploaded images under a prefix (e.g. "designs/jerseys/" or "fabrics/"). Returns [] if Blob isn't configured or the call fails. */
export async function listBlobImages(
  prefix: string,
): Promise<{ file: string; src: string; url: string }[]> {
  if (!isBlobConfigured()) return [];
  try {
    const { blobs } = await list({ prefix });
    return blobs
      .sort((a, b) => a.pathname.localeCompare(b.pathname))
      .map((b) => ({
        file: b.pathname.split("/").pop() || b.pathname,
        src: blobImageSrc(b.url, b.pathname),
        url: b.url,
      }));
  } catch (err) {
    console.error(`Blob list failed for prefix "${prefix}":`, err);
    return [];
  }
}
