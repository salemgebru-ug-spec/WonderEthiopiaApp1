import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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

const OFFICE_EXTENSIONS = ["doc", "docx", "xls", "xlsx", "ppt", "pptx"];

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

    // Detect extension from fileName or URL
    const ext = (
      fileName
        ? fileName.split(".").pop()
        : parsedUrl.pathname.split(".").pop()
    )?.toLowerCase().split("?")[0] ?? "";

    // Office files → redirect to Google Docs Viewer
    if (OFFICE_EXTENSIONS.includes(ext)) {
      const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
      return NextResponse.redirect(googleViewerUrl);
    }

    // Extract public_id and resource_type from the Cloudinary URL
    // URL format: https://res.cloudinary.com/{cloud}/{resource_type}/upload/v{version}/{folder}/{public_id}.{ext}
    const pathParts = parsedUrl.pathname.split("/");
    // pathParts: ['', '{cloud}', '{resource_type}', 'upload', 'v{version}', ...rest]
    const resourceType = pathParts[2] as "image" | "raw" | "video"; // 'raw' for docs
    const uploadIndex = pathParts.indexOf("upload");

    if (uploadIndex === -1) {
      return NextResponse.json({ error: "Invalid Cloudinary URL" }, { status: 400 });
    }

    // Everything after 'upload' (skip version segment starting with 'v')
    const afterUpload = pathParts.slice(uploadIndex + 1);
    const startIndex = afterUpload[0]?.match(/^v\d+$/) ? 1 : 0;
    const publicIdWithExt = afterUpload.slice(startIndex).join("/");
    // For raw resources, keep extension as part of public_id (handles legacy uploads)
const publicId = resourceType === "raw" 
  ? publicIdWithExt 
  : publicIdWithExt.replace(/\.[^/.]+$/, "");

    // Generate a short-lived signed URL (valid 60s) so Cloudinary serves it
    const signedUrl = cloudinary.url(publicId, {
      resource_type: resourceType,
      type: "upload",
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + 60,
      secure: true,
    });

    // Fetch using the signed URL
    const fileResponse = await fetch(signedUrl, {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!fileResponse.ok) {
      console.error("Cloudinary fetch failed:", fileResponse.status, await fileResponse.text().catch(() => ""));
      return NextResponse.json(
        { error: `Failed to fetch document (${fileResponse.status})` },
        { status: fileResponse.status }
      );
    }

    const contentType = MIME_MAP[ext] ?? "application/octet-stream";
    const buffer = await fileResponse.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Proxy document error:", error);
    return NextResponse.json({ error: "Proxy failed" }, { status: 500 });
  }
}
