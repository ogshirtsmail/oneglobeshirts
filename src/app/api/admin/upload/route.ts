import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { isAllowedAdminRequest } from "@/lib/admin-access";
import { ALLOWED_UPLOAD_CONTENT_TYPES, MAX_UPLOAD_SIZE_BYTES, targetFromPathname } from "@/lib/uploads";

export const runtime = "nodejs";

// Token-issuing endpoint for client-direct uploads (browser -> Vercel Blob
// directly). Files never pass through this function's own request body, so
// there's no serverless body-size limit to worry about.
export async function POST(request: Request) {
  if (!isAllowedAdminRequest(request)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!targetFromPathname(pathname)) {
          throw new Error("Unknown upload destination.");
        }
        return {
          allowedContentTypes: ALLOWED_UPLOAD_CONTENT_TYPES,
          maximumSizeInBytes: MAX_UPLOAD_SIZE_BYTES,
          addRandomSuffix: true,
        };
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Blob upload token error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "upload_failed" },
      { status: 400 },
    );
  }
}
