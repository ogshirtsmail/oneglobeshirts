import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isAllowedAdminRequest } from "@/lib/admin-access";

// Hides /admin and /api/admin/* from anyone not on the allowlist (see
// src/lib/admin-access.ts). Returns a bare 404 rather than a 403 so the
// admin area doesn't announce its own existence to random visitors.
export function proxy(request: NextRequest) {
  if (!isAllowedAdminRequest(request)) {
    return new NextResponse(null, { status: 404 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
