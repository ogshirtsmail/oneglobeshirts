import { NextResponse } from "next/server";
import { isAllowedAdminRequest } from "@/lib/admin-access";
import { hideDesign, isValidDesignRef, restoreDesign } from "@/lib/admin-store";
import { isBlobConfigured } from "@/lib/blob";

export const runtime = "nodejs";

// Hides / restores a built-in design image (one stored in public/designs/<category>/).
// Those files are part of the deployed site and can't be deleted at runtime, so
// "delete" on the site hides them instead. Uploaded images use /api/admin/delete.
// Body: { action: "hide" | "restore", category, file }
export async function POST(request: Request) {
  if (!(await isAllowedAdminRequest(request))) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!isBlobConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  let body: { action?: unknown; category?: unknown; file?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const { action, category, file } = body;
  if (typeof category !== "string" || typeof file !== "string" || !isValidDesignRef(category, file)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  try {
    if (action === "hide") await hideDesign(category, file);
    else if (action === "restore") await restoreDesign(category, file);
    else return NextResponse.json({ error: "bad_request" }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Design hide/restore failed:", err);
    return NextResponse.json({ error: "update_failed" }, { status: 502 });
  }
}
