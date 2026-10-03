import { list } from "@vercel/blob";

export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** Lists uploaded images under a prefix (e.g. "designs/jerseys/" or "fabrics/"). Returns [] if Blob isn't configured or the call fails. */
export async function listBlobImages(
  prefix: string,
): Promise<{ file: string; src: string }[]> {
  if (!isBlobConfigured()) return [];
  try {
    const { blobs } = await list({ prefix });
    return blobs
      .sort((a, b) => a.pathname.localeCompare(b.pathname))
      .map((b) => ({ file: b.pathname.split("/").pop() || b.pathname, src: b.url }));
  } catch (err) {
    console.error(`Blob list failed for prefix "${prefix}":`, err);
    return [];
  }
}
