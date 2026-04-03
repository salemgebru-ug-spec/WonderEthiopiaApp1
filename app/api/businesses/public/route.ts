import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Business from "@/models/Business";

// Simple test to see if route is accessible
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "0", 10);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "all";
    const region = searchParams.get("region") || "all";

    await dbConnect();

    const query: any = { status: "approved", /*isActive: true*/ }; 

    if (search) {
      // Escape regex special characters to prevent errors
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { description: { $regex: escapedSearch, $options: "i" } },
      ];
    }

    if (category !== "all") {
      query.category = category;
    }

    if (region !== "all") {
      query["location.region"] = region;
    }

    let businessQuery = Business.find(query)
      .select("name description category location contactPhone contactEmail profilePicture")
      .sort({ createdAt: -1 });

    if (limit > 0) {
      businessQuery = businessQuery.limit(limit);
    }

    const businesses = await businessQuery;
    return NextResponse.json({ businesses: businesses || [] });
  } catch (error) {
    console.error("DEBUG API ERROR:", error);
    return NextResponse.json(
      { businesses: [], error: "Database or route error" },
      { status: 500 }
    );
  }
}
