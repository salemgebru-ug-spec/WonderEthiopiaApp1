import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Service from "@/models/Service";
import Business from "@/models/Business";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "business_owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const business = await Business.findOne({ ownerId: session.user.id });
    if (!business) return NextResponse.json({ services: [] });

    const services = await Service.find({ businessId: business._id });
    return NextResponse.json({ services });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "business_owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const business = await Business.findOne({ ownerId: session.user.id });
    if (!business) return NextResponse.json({ error: "Business not approved yet" }, { status: 403 });

    const body = await request.json();
    console.log("Registry Request Received:", {
      name: body.name,
      category: body.category,
      imagesCount: body.images?.length,
      isUpdate: !!body._id
    });

    let service;
    if (body._id) {
      // Update existing service
      service = await Service.findOneAndUpdate(
        { _id: body._id, businessId: business._id },
        { ...body },
        { new: true, runValidators: true }
      );
      if (!service) {
        return NextResponse.json({ error: "Service not found or unauthorized" }, { status: 404 });
      }
    } else {
      // Create new service
      service = await Service.create({
        ...body,
        businessId: business._id,
      });
    }

    return NextResponse.json({ service });
  } catch (error: any) {
    console.error("Service Listing Cluster Failure:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to list new service",
      details: error.errors ? Object.keys(error.errors) : undefined
    }, { status: 500 });
  }
}
