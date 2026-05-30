import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Destination from "@/models/Destination";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const {id}=await params;
    await dbConnect();
    const destination = await Destination.findById(id);


    if (!destination) {
      return NextResponse.json({ error: "Destination not found" }, { status: 404 });
    }

    return NextResponse.json({ data: destination });
  } catch (error: any) {
    console.error("Error fetching destination:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
