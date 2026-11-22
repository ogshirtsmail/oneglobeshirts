import { NextResponse } from "next/server";
import { envAdminIps, getClientIp, isAllowedAdminRequest } from "@/lib/admin-access";
import { addAdminIp, getStoredAdminIps, normalizeIp, removeAdminIp } from "@/lib/admin-store";
import { isBlobConfigured } from "@/lib/blob";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function snapshot(request: Request) {
  return {
    yourIp: getClientIp(request),
    envIps: envAdminIps(),
    storedIps: await getStoredAdminIps(true),
    configured: isBlobConfigured(),
  };
}

export async function GET(request: Request) {
  if (!(await isAllowedAdminRequest(request))) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(await snapshot(request));
}

// Body: { action: "add", ip, label? } or { action: "remove", ip }
export async function POST(request: Request) {
  if (!(await isAllowedAdminRequest(request))) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (!isBlobConfigured()) {
    return NextResponse.json({ error: "Blob storage isn't connected, so IPs can't be saved." }, { status: 503 });
  }

  let body: { action?: unknown; ip?: unknown; label?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const ip = typeof body.ip === "string" ? normalizeIp(body.ip) : null;
  if (!ip) {
    return NextResponse.json({ error: "That doesn't look like a valid IP address." }, { status: 400 });
  }

  try {
    if (body.action === "add") {
      const label = typeof body.label === "string" ? body.label.trim() : "";
      await addAdminIp(ip, label);
    } else if (body.action === "remove") {
      if (envAdminIps().includes(ip)) {
        return NextResponse.json(
          { error: "This IP is set in Vercel (ADMIN_ALLOWED_IPS) and can only be removed there." },
          { status: 400 },
        );
      }
      await removeAdminIp(ip);
    } else {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
  } catch (err) {
    console.error("Admin IP update failed:", err);
    return NextResponse.json({ error: "Couldn't save the change. Please try again." }, { status: 502 });
  }

  return NextResponse.json(await snapshot(request));
}
