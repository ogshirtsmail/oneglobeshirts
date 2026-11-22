import { NextResponse } from "next/server";
import { getClientIp, isAllowedAdminRequest } from "@/lib/admin-access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lets the site menu know whether to show the Admin menu. Everyone not on the
// admin IP list gets a plain 404 (also enforced by src/proxy.ts).
export async function GET(request: Request) {
  if (!(await isAllowedAdminRequest(request))) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ admin: true, ip: getClientIp(request) }, { headers: { "Cache-Control": "private, no-store" } });
}
