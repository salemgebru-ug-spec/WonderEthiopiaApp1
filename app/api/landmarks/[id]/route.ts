import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Landmark from "@/models/Landmark";
import { getImageEmbedding } from "../recognize/route";
import mongoose from "mongoose";

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: `Malformed ID format: '${id}' is not a valid 24-character hex string.` },
        { status: 400 }
      );
    }
    await dbConnect();
    const landmark = await Landmark.findById(id);
    if (!landmark) {
      return NextResponse.json({ error: "Landmark not found" }, { status: 404 });
    }
    return NextResponse.json({ data: landmark });
  } catch (error: any) {
    console.error("GET Landmark Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        details: { name: error.name, code: error.code }
      },
      { status: 500 }
    );
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
      try {
        const embedding = await getImageEmbedding(arrayBuffer);
        allEmbeddings.push(embedding);
        galleryPaths.push(item);
      } catch (embedErr: any) {
        console.error("Embedding generation failed for gallery item:", embedErr);
        return NextResponse.json(
          {
            error: "Failed to process image embedding during update",
            details: { name: embedErr.name, stack: embedErr.stack }
          },
          { status: 500 }
        );
      }
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
    console.error("PUT Landmark Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Server error",
        details: { name: error.name, stack: error.stack, code: error.code }
      },
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
    console.error("DELETE Landmark Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        details: { name: error.name, stack: error.stack, code: error.code }
      },
      { status: 500 }
    );
  }
}
