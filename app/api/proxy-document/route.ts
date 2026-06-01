import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const MIME_MAP: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const fileName = searchParams.get("fileName");

    if (!url) {
      return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
    }

    // Only allow Cloudinary URLs
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname !== "res.cloudinary.com") {
      return NextResponse.json({ error: "URL not allowed" }, { status: 403 });
    }

    // Detect MIME type from fileName or URL extension

    const ext = (
      fileName
        ? fileName.split(".").pop()
        : parsedUrl.pathname.split(".").pop()
    )?.toLowerCase().split("?")[0]  "";

    const OFFICE_EXTENSIONS = ["doc", "docx", "xls", "xlsx", "ppt", "pptx"];
    if (OFFICE_EXTENSIONS.includes(ext)) {
      const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
      return NextResponse.redirect(googleViewerUrl);
    }

    const contentType = MIME_MAP[ext] ||  "application/octet-stream";
    const fileResponse = await fetch(url);
    if (!fileResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch document" }, { status: fileResponse.status });
    }

    const buffer = await fileResponse.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        // Force correct MIME type — overrides Cloudinary's octet-stream
        "Content-Type": contentType,
        // Force the browser to display inline, not download
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Proxy document error:", error);
    return NextResponse.json({ error: "Proxy failed" }, { status: 500 });
  }
}
