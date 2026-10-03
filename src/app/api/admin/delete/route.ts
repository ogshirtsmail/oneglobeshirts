import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { isAllowedAdminRequest } from "@/lib/admin-access";
import { targetFromPathname } from "@/lib/uploads";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isAllowedAdminRequest(request)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  let body: { url?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  if (typeof body.url !== "string" || !body.url) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  let pathname: string;
  try {
    pathname = new URL(body.url).pathname.replace(/^\/+/, "");
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  // Only allow deleting blobs under a known designs/<category>/ or fabrics/ prefix.
  if (!targetFromPathname(pathname)) {
    return NextResponse.json({ error: "invalid_target" }, { status: 400 });
  }

  try {
    await del(body.url);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Blob delete error:", error);
    return NextResponse.json({ error: "delete_failed" }, { status: 502 });
  }
}
