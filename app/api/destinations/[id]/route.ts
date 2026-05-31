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

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
   
    const body = await request.json();
    const { name, description, region, city, category, images, coordinates } = body;

    await dbConnect();

   
    const updatedDestination = await Destination.findByIdAndUpdate(
      id,
      {
        name,
        description,
        region,
        city,
        category,
        images,
        coordinates,
      },
      { 
        new: true,          
        runValidators: true 
      }
    );

    if (!updatedDestination) {
      return NextResponse.json({ error: "Destination not found" }, { status: 404 });
    }

    return NextResponse.json(updatedDestination);
  } catch (error: any) {
    console.error("Error updating destination payload data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    const deletedDestination = await Destination.findByIdAndDelete(id);


    if (!deletedDestination) {
      return NextResponse.json({ error: "Destination not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Delete successful" });
  } catch (error: any) {
    console.error("Error fetching destination:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}