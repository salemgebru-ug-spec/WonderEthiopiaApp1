import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    // Only allow proxying Cloudinary URLs from our account
    const allowedHosts = ["res.cloudinary.com"];
    const parsedUrl = new URL(url);
    if (!allowedHosts.some(h => parsedUrl.hostname === h)) {
      return NextResponse.json({ error: "URL not allowed" }, { status: 403 });
    }

    const fileResponse = await fetch(url);

    if (!fileResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch document" }, { status: fileResponse.status });
    }

    const contentType = fileResponse.headers.get("content-type") || "application/octet-stream";
    const buffer = await fileResponse.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Forces the browser to display inline (not download)
        "Content-Disposition": "inline",
        // Allow embedding in iframes
        "X-Frame-Options": "SAMEORIGIN",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Proxy document error:", error);
    return NextResponse.json({ error: "Proxy failed" }, { status: 500 });
  }
}
