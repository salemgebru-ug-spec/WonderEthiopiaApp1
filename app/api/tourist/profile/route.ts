import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import TourismProfile from "@/models/TourismProfile";
import mongoose from "mongoose";
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "tourist") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const profile = await TourismProfile.findOne({ userId: new mongoose.Types.ObjectId(session.user.id) });
    
    return NextResponse.json({ profile });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "tourist") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    await dbConnect();
    const userId = new mongoose.Types.ObjectId(session.user.id);
    const profile = await TourismProfile.findOneAndUpdate(
      { userId },
      { ...body, userId, isCompleted: true },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json({ message: "Profile synchronized with registry axis.", profile });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
