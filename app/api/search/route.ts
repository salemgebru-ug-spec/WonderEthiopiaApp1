import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Business from "@/models/Business";
import Service from "@/models/Service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    await dbConnect();

    // Search for businesses (approved only for public, but maybe all for admins? let's stick to name search)
    const businesses = await Business.find({
      name: { $regex: query, $options: "i" },
      status: { $in: ["approved", "recommended_approve"] }
    }).limit(5).select("name category profilePicture _id");

    // Search for services
    const services = await Service.find({
      name: { $regex: query, $options: "i" }
    }).limit(10).select("name category images _id businessId");

    const results = [
      ...businesses.map(b => ({
        id: b._id,
        name: b.name,
        type: "business",
        category: b.category,
        image: b.profilePicture,
        href: `/discover/businesses/${b._id}`
      })),
      ...services.map(s => ({
        id: s._id,
        name: s.name,
        type: "service",
        category: s.category,
        image: s.images[0],
        href: `/discover/businesses/${s.businessId}?expand=${s._id}`
      }))
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Global Search Error:", error);
    return NextResponse.json({ error: "Failed to perform search" }, { status: 500 });
  }
}
