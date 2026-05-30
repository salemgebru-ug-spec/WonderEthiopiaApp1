import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Service from "@/models/Service";
import Business from "@/models/Business";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "business_owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    const business = await Business.findOne({ ownerId: session.user.id });
    if (!business) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const body = await request.json();
    const service = await Service.findOneAndUpdate(
      { _id: id, businessId: business._id },
      { $set: body },
      { new: true }
    );

    if (!service) return NextResponse.json({ error: "Service record not found" }, { status: 404 });
    return NextResponse.json({ service });
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "business_owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();
    const business = await Business.findOne({ ownerId: session.user.id });
    if (!business) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const deleted = await Service.findOneAndDelete({ _id: id, businessId: business._id });
    if (!deleted) return NextResponse.json({ error: "Service not found" }, { status: 404 });

    return NextResponse.json({ message: "Service de-listed" });
  } catch (error) {
    return NextResponse.json({ error: "Deletion failed" }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const payment = await Service.findOne({ _id: id });
    return NextResponse.json(
      {
        message: "Service retrieved successfully",
        data: payment
      },
      { status: 200 }
    );
   
    }catch(error:any){
        const status = error.status || 500;


        return NextResponse.json(
            {
                success: false,
                message: error.message || "Something went wrong",
            },
            { status: status || 500 } 
        );
    }
    
}