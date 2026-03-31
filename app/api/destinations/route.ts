import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Destination from "@/models/Destination";

// GET - List destinations with filters
export async function GET(request: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const region = searchParams.get("region");
    const city = searchParams.get("city");
    const category = searchParams.get("category");
    const minRating = searchParams.get("minRating");

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (region && region !== "all") query.region = region;
    if (city && city !== "all") query.city = city;
    if (category && category !== "all") query.category = category;
    if (minRating) query.rating = { $gte: parseFloat(minRating) };

    const destinations = await Destination.find(query).sort({ rating: -1, createdAt: -1 });

    return NextResponse.json(destinations);
  } catch (error: any) {
    console.error("Error fetching destinations:", error);
    return NextResponse.json({ error: "Failed to fetch destinations" }, { status: 500 });
  }
}

// POST - Create a new destination (Admin only)
export async function POST(request: Request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { name, description, region, city, images, category } = body;

    if (!name || !region || !description) {
      return NextResponse.json(
        { error: "Name, region, and description are required" },
        { status: 400 }
      );
    }

    const destination = await Destination.create({
      name,
      description,
      region,
      city: city || "",
      images: images || [],
      category: category || "Other",
      rating: 0,
    });

    return NextResponse.json(destination, { status: 201 });
  } catch (error: any) {
    console.error("Error creating destination:", error);
    return NextResponse.json({ error: "Failed to create destination" }, { status: 500 });
  }
}
