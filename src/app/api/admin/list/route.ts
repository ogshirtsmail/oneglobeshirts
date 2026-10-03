import { list } from "@vercel/blob";
import { NextResponse } from "next/server";
import { isAllowedAdminRequest } from "@/lib/admin-access";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!isAllowedAdminRequest(request)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ blobs: [], configured: false });
  }

  const { searchParams } = new URL(request.url);
  const prefix = searchParams.get("prefix") || "";
  if (!prefix.startsWith("designs/") && prefix !== "fabrics/") {
    return NextResponse.json({ error: "invalid_prefix" }, { status: 400 });
  }

  try {
    const { blobs } = await list({ prefix });
    return NextResponse.json({
      configured: true,
      blobs: blobs
        .sort((a, b) => a.pathname.localeCompare(b.pathname))
        .map((b) => ({
          url: b.url,
          pathname: b.pathname,
          size: b.size,
          uploadedAt: b.uploadedAt,
        })),
    });
  } catch (error) {
    console.error("Blob list error:", error);
    return NextResponse.json({ error: "list_failed" }, { status: 502 });
  }
}
