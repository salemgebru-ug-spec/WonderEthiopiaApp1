import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Landmark from "@/models/Landmark";
import getEmbeddings from "./recognize/route";

export async function GET() {
  await dbConnect();

  try {
    const landmarks = await Landmark.find(); // ✅ FIXED

    return NextResponse.json(landmarks);
  } catch (error: any) {
    console.log(error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  await dbConnect();

  try {
    const formData = await request.formData();
    const galleryItems = formData.getAll("gallery");
    const allEmbeddings = [];
    const galleryPaths: string[] = [];

    for (const item of galleryItems) {
      let arrayBuffer: ArrayBuffer;

      if (item instanceof File) {
        // CASE 1: It's an actual file upload
        arrayBuffer = await item.arrayBuffer();
        // You would usually save the file to S3/Cloudinary here 
        // and push the resulting URL to galleryPaths
      } else if (typeof item === "string" && item.startsWith("http")) {
        // CASE 2: It's a URL string
        const response = await fetch(item);
        if (!response.ok) continue;
        arrayBuffer = await response.arrayBuffer();
        galleryPaths.push(item);
      } else {
        continue; 
      }

      const embedding = await getEmbeddings(arrayBuffer);
      allEmbeddings.push(embedding);
    }

    // Use the first embedding found as the primary vector for search
    const primaryEmbedding = allEmbeddings.length > 0 ? allEmbeddings[0] : [];

    const landmark = await Landmark.create({
      name: formData.get("name"),
      description: formData.get("description"),
      region: formData.get("region"),
      city: formData.get("city"),
      // If coordinates is sent as a string like "[12, 39]", parse it:
      coordinates: {
          longitude:formData.get("longitude"),
          latitude:formData.get("latitude")
      },
      date_of_establishment: formData.get("date_of_establishment"),
      significance: formData.get("significance"),
      unesco_status: formData.get("unesco_status"),
      visitor_info: {
        fee: formData.get("fee"),
        opening_hours: formData.get("opening_hours")
      },
      rating: formData.get("rating"),
      gallery: galleryPaths,
      embedding: primaryEmbedding // Must be [number], not [[number]]
    });

    return NextResponse.json({ success: true, landmark });

  } catch (error: any) {
    console.error("Post Error:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}