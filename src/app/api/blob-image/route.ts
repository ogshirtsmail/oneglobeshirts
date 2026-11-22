import { get } from "@vercel/blob";
import { NextResponse, type NextRequest } from "next/server";
import { targetFromPathname } from "@/lib/uploads";

export const runtime = "nodejs";

// Delivers uploaded design / fabric images from the PRIVATE Blob store to everyone.
// Only paths under designs/<known category>/ and fabrics/ are served, and those are
// public product photos, so the response is cached by browsers and Vercel's CDN.
// Uploads get a random suffix, so a pathname's content never changes.
export async function GET(request: NextRequest) {
  const pathname = request.nextUrl.searchParams.get("pathname") || "";
  if (!pathname || pathname.includes("..") || !targetFromPathname(pathname) || !/\.(jpe?g|png|webp)$/i.test(pathname)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const result = await get(pathname, { access: "private" });
    if (!result || result.statusCode !== 200) {
      return new NextResponse("Not found", { status: 404 });
    }
    return new NextResponse(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=86400, s-maxage=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("blob-image failed:", pathname, err);
    return new NextResponse("Not found", { status: 404 });
  }
}
