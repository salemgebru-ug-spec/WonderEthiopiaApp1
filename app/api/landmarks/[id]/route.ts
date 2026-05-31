import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Landmark from "@/models/Landmark";
import { getImageEmbedding } from "../recognize/route";

// Helper to convert frontend base64 strings or URLs to an ArrayBuffer
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
  } catch (error) {
    console.error("Error converting image item to buffer:", error);
    return null;
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await dbConnect();

  try {
    const { id } = await params;
    const body = await request.json();
    
    const { 
      name, description, region, city, gallery, coordinates, 
      date_of_establishment, significance, unesco_status, visitor_info 
    } = body;

    const allEmbeddings = [];
    const galleryPaths: string[] = [];
    const galleryItems = Array.isArray(gallery) ? gallery : [];

    // Process embeddings for updated images
    for (const item of galleryItems) {
      if (typeof item !== "string") continue;

      const arrayBuffer = await getArrayBufferFromItem(item);
      if (!arrayBuffer) continue;

      // Re-generate your vector embedding using your local handler
      const embedding = await getImageEmbedding(arrayBuffer);
      allEmbeddings.push(embedding);
      galleryPaths.push(item);
    }

    // Build the update payload dynamically
    const updateData: any = {
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
    };

    // Only update embedding vectors if new images were actually provided
    if (allEmbeddings.length > 0) {
      updateData.embedding = allEmbeddings[0];
    }

    const updatedLandmark = await Landmark.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedLandmark) {
      return NextResponse.json({ error: "Landmark not found" }, { status: 404 });
    }

    return NextResponse.json(updatedLandmark);

  } catch (error: any) {
    console.error("PUT Error:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    const deletedDestination = await Landmark.findByIdAndDelete(id);


    if (!deletedDestination) {
      return NextResponse.json({ error: "Landmark not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Delete successful" });
  } catch (error: any) {
    console.error("Error fetching landmark:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}