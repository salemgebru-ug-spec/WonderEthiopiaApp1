import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Business from "@/models/Business";
import Service from "@/models/Service";
import Review from "@/models/Review";
import EventBooking from "@/models/EventBooking";
import TourBooking from "@/models/TourBooking";
import "@/models/User"; // Ensure User model is registered for refs

// Simple test to see if route is accessible
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "0", 10);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "all";
    const region = searchParams.get("region") || "all";

    await dbConnect();

    // 1. Master Category/Tag Mapping
    const sectorTagMap: Record<string, string[]> = {
      hotel: ["hotel", "room", "suite", "stay", "accommodation", "resort", "lodging"],
      tour_operator: ["tour_operator", "tour", "expedition", "culture", "wildlife", "hiking", "transfer", "custom", "trip", "trek"],
      car_rental: ["car_rental", "car", "rental", "vehicle", "driver", "fleet", "transport"],
      event_organizer: ["event_organizer", "event", "conference", "meeting", "wedding", "organizer"],
    };

    // 2. Identify all approved businesses first
    const bizFilter: any = { status: "approved" };
    if (region !== "all") {
      bizFilter["location.region"] = region;
    }
    // We don't filter Business.category yet because we'll filter the services directly by their mapped tags
    const approvedBusinesses = await Business.find(bizFilter).select("_id");
    const approvedBizIds = approvedBusinesses.map(b => b._id);

    if (approvedBizIds.length === 0) {
      return NextResponse.json({ services: [] });
    }

    // 3. Build the Service Query
    const svcQuery: any = { businessId: { $in: approvedBizIds } };

    // Apply strict category filtering if a sector is selected
    if (category !== "all") {
      const tags = sectorTagMap[category] || [category];
      svcQuery.category = { $in: tags };
    }

    // Prepare searchBizIds for business name search if needed
    let searchBizIds: any[] = [];
    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const businessesByName = await Business.find({
        ...bizFilter,
        name: { $regex: escapedSearch, $options: "i" }
      }).select("_id");
      searchBizIds = businessesByName.map(b => b._id);

      svcQuery.$or = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { description: { $regex: escapedSearch, $options: "i" } },
        { businessId: { $in: searchBizIds } }
      ];
    }

    let serviceQuery = Service.find(svcQuery)
      .populate("businessId", "name location contactPhone profilePicture")
      .sort({ createdAt: -1 });

    if (limit > 0) {
      serviceQuery = serviceQuery.limit(limit);
    }

    const services = await serviceQuery.lean();

    // 5. Enrich with Ratings
    const svcIds = services.map((s: any) => s._id);
    const reviews = await Review.find({ targetId: { $in: svcIds }, targetType: "service" }).select("targetId rating");

    const svcStats: Record<string, { total: number, count: number }> = {};
    reviews.forEach(r => {
      const targetStr = String(r.targetId);
      if (!svcStats[targetStr]) svcStats[targetStr] = { total: 0, count: 0 };
      if (r.rating && !isNaN(r.rating)) {
        svcStats[targetStr].total += Number(r.rating);
        svcStats[targetStr].count += 1;
      }
    });

    const enriched = services.map((s: any) => {
      const idStr = String(s._id);
      const stats = svcStats[idStr];
      return {
        ...s,
        avgRating: stats && stats.count > 0 ? (stats.total / stats.count) : null
      }
    });

    // 6. Capacity Filtering
    // Fetch Event/Tour Bookings for the relevant services
    const eventBookings = await EventBooking.find({ event_id: { $in: svcIds } }).select("event_id number_of_tickets");
    const tourBookings = await TourBooking.find({ tour_id: { $in: svcIds } }).select("tour_id number_of_people");

    const capacityStats: Record<string, number> = {};
    eventBookings.forEach(b => {
      const id = String(b.event_id);
      capacityStats[id] = (capacityStats[id] || 0) + (b.number_of_tickets || 0);
    });
    tourBookings.forEach(b => {
      const id = String(b.tour_id);
      capacityStats[id] = (capacityStats[id] || 0) + (b.number_of_people || 0);
    });

    const enrichedAndFiltered = enriched.filter((s: any) => {
      // Check if service is event or tour
      const isEvent = Array.isArray(s.category) && (s.category.includes("event_organizer") || s.category.includes("venue") || s.category.includes("corporate"));
      const isTour = Array.isArray(s.category) && (s.category.includes("tour_operator") || s.category.includes("tour") || s.category.includes("expedition") || s.category.includes("culture") || s.category.includes("wildlife") || s.category.includes("hiking"));

      if (isEvent || isTour) {
        const idStr = String(s._id);
        const maxCapacity = s.availability?.quantity || s.metadata?.capacity || s.metadata?.maxOccupancy || s.metadata?.eventCapacity || 0;
        const totalBooked = capacityStats[idStr] || 0;
        // Exclude if full
        if (maxCapacity > 0 && totalBooked >= maxCapacity) {
          return false;
        }
      }
      return true;
    });

    return NextResponse.json({ services: enrichedAndFiltered });
  } catch (error: any) {
    console.error("CRITICAL PUBLIC API ERROR:", error);
    return NextResponse.json(
      { 
        services: [], 
        error: error.message || "Database or route error"
      },
      { status: 500 }
    );
  }
}
