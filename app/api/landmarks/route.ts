import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Landmark from "@/models/Landmark";
import { formatError } from "@/lib/apiError";
// getImageEmbedding will be imported lazily in POST handler

export async function GET() {
  try {
    await dbConnect();
    const landmarks = await Landmark.find(); // ✅ FIXED

    return NextResponse.json(landmarks);
  } catch (error: any) {
    console.error("GET Landmarks Error:", error);
    return NextResponse.json(formatError(error, 500));
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    // 1. Read directly as JSON matching your frontend layout setup
    const { getImageEmbedding } = await import("./recognize/route");
    const body = await request.json();
    const {
      name,
      description,
      region,
      city,
      gallery,
      coordinates,
      date_of_establishment,
      significance,
      unesco_status,
      visitor_info
    } = body;

    // Validate required fields
    const missingFields = [];
    if (!name) missingFields.push("name");
    if (!description) missingFields.push("description");
    if (!region) missingFields.push("region");
    if (!city) missingFields.push("city");
    if (!coordinates) missingFields.push("coordinates");
    if (missingFields.length) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    const allEmbeddings = [];
    const galleryPaths: string[] = [];

    // Ensure gallery is an array of strings (Base64 data URLs)
    const galleryItems = Array.isArray(gallery) ? gallery : [];

    for (const item of galleryItems) {
      if (typeof item !== "string") continue;
      const arrayBuffer = await getArrayBufferFromItem(item);
      if (!arrayBuffer) continue;
      try {
        const embedding = await getImageEmbedding(arrayBuffer);
        allEmbeddings.push(embedding);
        galleryPaths.push(item);
      } catch (embedErr: any) {
        console.error("Embedding generation failed for an item", embedErr);
        return NextResponse.json(
          {
            error: "Failed to process image embedding",
            details: { stack: embedErr.stack, name: embedErr.name }
          },
          { status: 500 }
        );
      }
    }

    // Isolate vector coordinates for your search query engine matching structure
    const primaryEmbedding = allEmbeddings.length > 0 ? allEmbeddings[0] : [];

    const landmark = await Landmark.create({
      name,
      description,
      region,
      city,
      coordinates: {
        longitude: parseFloat(coordinates?.longitude) || 0,
        latitude: parseFloat(coordinates?.latitude) || 0
      },
      date_of_establishment,
      significance,
      unesco_status,
      visitor_info: {
        fee: visitor_info?.fee || "",
        opening_hours: visitor_info?.opening_hours || ""
      },
      gallery: galleryPaths,
      embedding: primaryEmbedding
    });

    return NextResponse.json(landmark);
  } catch (error: any) {
    console.error("POST Landmark Error:", error);
    return NextResponse.json(formatError(error, 500));
  }
}

async function getArrayBufferFromItem(item: string): Promise<ArrayBuffer | null> {
  try {
    if (item.startsWith("data:image")) {
      const base64Data = item.split(",")[1];
      const buffer = Buffer.from(base64Data, "base64");
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    } else if (item.startsWith("http")) {
      const response = await fetch(item);
      if (!response.ok) return null;
      return await response.arrayBuffer();
    }
    return null;
  } catch (error: any) {
    console.error("Error converting image item to buffer:", error);
    return null;
  }
}