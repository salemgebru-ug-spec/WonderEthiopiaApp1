import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Service from "@/models/Service";
import Business from "@/models/Business";
import Review from "@/models/Review";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "business_owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    let business = await Business.findOne({ ownerId: session.user.id });
    
    if (!business) {
      // Fallback: Link by email
      business = await Business.findOne({ 
        contactEmail: session.user.email?.toLowerCase(),
        ownerId: { $exists: false }
      });
      if (business) {
        business.ownerId = session.user.id as any;
        await business.save();
      } else {
        // Final check for already linked cases with mismatch or not found
        business = await Business.findOne({ contactEmail: session.user.email?.toLowerCase() });
        if (business && !business.ownerId) {
             business.ownerId = session.user.id as any;
             await business.save();
        } else if (!business) {
            return NextResponse.json({ services: [] });
        }
      }
    }

    const services = await Service.find({ businessId: business._id }).lean();
    const serviceIds = services.map(s => s._id);
    const reviews = await Review.find({ targetId: { $in: serviceIds }, targetType: "service" });

    const enrichedServices = services.map(s => {
      const serviceReviews = reviews.filter(r => String(r.targetId) === String(s._id));
      const avgRating = serviceReviews.length > 0
        ? serviceReviews.reduce((sum, r) => sum + r.rating, 0) / serviceReviews.length
        : null;
      return { ...s, avgRating };
    });

    return NextResponse.json({ services: enrichedServices });
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
    let business = await Business.findOne({ ownerId: session.user.id });
    
    if (!business) {
      business = await Business.findOne({ 
        contactEmail: session.user.email?.toLowerCase(),
        ownerId: { $exists: false }
      });
      if (business) {
        business.ownerId = session.user.id as any;
        await business.save();
      } else {
        business = await Business.findOne({ contactEmail: session.user.email?.toLowerCase() });
        if (business && !business.ownerId) {
             business.ownerId = session.user.id as any;
             await business.save();
        } else if (!business) {
            return NextResponse.json({ error: "Business not approved yet or not found" }, { status: 403 });
        }
      }
    }

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

    // Reset inactivity timer for the business
    await Business.updateOne({ _id: business._id }, { $set: { lastActivityAt: new Date() } });

    return NextResponse.json({ service });
  } catch (error: any) {
    console.error("Service Listing Cluster Failure:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to list new service",
      details: error.errors ? Object.keys(error.errors) : undefined
    }, { status: 500 });
  }
}
