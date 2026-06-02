import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import EventBooking from "@/models/EventBooking";
import Service from "@/models/Service";

export async function GET(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    await dbConnect();

    // Find all event services belonging to this business
    const events = await Service.find({
      businessId: params.businessId,
    }).select("_id");

    const eventIds = events.map((event) => event._id);

    // Find bookings for those events
    const bookings = await EventBooking.find({
      event_id: { $in: eventIds },
    })
      .populate("event_id")
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: "Event bookings retrieved successfully",
        data: bookings,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Something went wrong",
      },
      { status: 500 }
    );
  }
}
