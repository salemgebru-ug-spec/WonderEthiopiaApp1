import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Business from "@/models/Business";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "business_owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const business = await Business.findOne({ ownerId: session.user.id });
    
    if (!business) {
      return NextResponse.json({ error: "Business registry not found" }, { status: 404 });
    }

    return NextResponse.json({ business });
  } catch (error) {
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "business_owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await request.json();
    await dbConnect();

    // Only allow specific fields to be updated by owner
    const updatableFields = ["name", "description", "location", "contactPhone", "contactEmail", "isActive", "profilePicture"];
    const update: any = {};
    updatableFields.forEach(f => {
      if (json[f] !== undefined) update[f] = json[f];
    });

    console.log("UPDATING BUSINESS PROFILE:", { id: session.user.id, businessId: json._id, update });
    console.log("PROFILE PICTURE IN UPDATE:", update.profilePicture);

    const filter: any = { ownerId: session.user.id };
    if (json._id) filter._id = json._id;

    const business = await Business.findOneAndUpdate(
      filter,
      { $set: update },
      { new: true }
    );

    if (!business) {
      console.error("BUSINESS NOT FOUND FOR OWNER ID:", session.user.id);
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    console.log("BUSINESS PROFILE UPDATED SUCCESSFULLY:", business._id, "Profile Picture:", business.profilePicture);
    return NextResponse.json({ business });
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
