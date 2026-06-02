import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import RoomBooking from "@/models/RoomBooking";
import Room from "@/models/Room";

export async function GET(
  request: NextRequest,
  { params }: { params: { businessId: string } }
) {
  try {
    await dbConnect();

    // Get all rooms belonging to the business
    const rooms = await Room.find({
      businessId: params.businessId,
    }).select("_id");

    const roomIds = rooms.map((room) => room._id);

    // Get bookings for those rooms
    const bookings = await RoomBooking.find({
      room_id: { $in: roomIds },
    })
      .populate("room_id")
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: "Room bookings retrieved successfully",
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
