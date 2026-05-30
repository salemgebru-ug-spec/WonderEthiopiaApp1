import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Business from "@/models/Business";
import Service from "@/models/Service";
import Review from "@/models/Review";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "business_owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    console.log("FETCHING BUSINESS PROFILE FOR OWNER ID:", session.user.id);
    let business = await Business.findOne({ ownerId: session.user.id });
    
    if (!business) {
      console.warn("BUSINESS REGISTRY NOT FOUND BY ID. TRYING EMAIL FALLBACK:", session.user.email);
      // Fallback: Try to find by contact email and link it (Repair logic)
      business = await Business.findOne({ 
        contactEmail: session.user.email?.toLowerCase(),
        ownerId: { $exists: false } // Only link if not already linked to someone else
      });

      if (business) {
        console.log("REPAIRING LINKAGE: Setting ownerId for business:", business.name);
        business.ownerId = session.user.id as any;
        await business.save();
      } else {
        // Final check: find by email regardless of current ownerId (Aggressive repair)
        business = await Business.findOne({ contactEmail: session.user.email?.toLowerCase() });
        if (business) {
          if (String(business.ownerId) !== session.user.id) {
             console.log("ID MISMATCH DETECTED. Re-linking business", business.name, "from", business.ownerId, "to", session.user.id);
             business.ownerId = session.user.id as any;
             await business.save();
          }
        } else {
            return NextResponse.json({ error: "Business registry not found" }, { status: 404 });
        }
      }
    }

    console.log("BUSINESS REGISTRY ACTIVE:", business._id, business.name);

    const services = await Service.find({ businessId: business._id }).select("_id");
    const serviceIds = services.map(s => s._id);
    const reviews = await Review.find({ targetId: { $in: serviceIds }, targetType: "service" });
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

    return NextResponse.json({ business: { ...business.toObject(), avgRating } });
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
    update.lastActivityAt = new Date(); // Reset inactivity timer

    console.log("UPDATING BUSINESS PROFILE:", { id: session.user.id, businessId: json._id, update });
    console.log("PROFILE PICTURE IN UPDATE:", update.profilePicture);

    let filter: any = { ownerId: session.user.id };
    if (json._id) filter._id = json._id;

    // Security Check: Prevent making suspended business active
    if (update.isActive === true) {
      const checkBusiness = await Business.findOne(filter);
      if (checkBusiness && checkBusiness.status === "suspended") {
        return NextResponse.json(
          { error: "Action strictly prohibited. Suspended businesses cannot be taken online. Please appeal at the Ministry of Tourism." },
          { status: 403 }
        );
      }
    }

    let business = await Business.findOneAndUpdate(
      filter,
      { $set: update },
      { new: true }
    );

    if (!business) {
      console.warn("PATCH: BUSINESS NOT FOUND BY ID. TRYING EMAIL FALLBACK:", session.user.email);
      // Fallback: Find by email and re-link/update
      business = await Business.findOne({ contactEmail: session.user.email?.toLowerCase() });

      if (business) {
        console.log("PATCH: REPAIRING LINKAGE FOR:", business.name);
        business.ownerId = session.user.id as any;
        // Apply updates to the found record
        Object.assign(business, update);
        await business.save();
      } else {
        console.error("BUSINESS NOT FOUND FOR EMAIL:", session.user.email);
        return NextResponse.json({ error: "Business not found" }, { status: 404 });
      }
    }

    console.log("BUSINESS PROFILE UPDATED SUCCESSFULLY:", business._id, "Profile Picture:", business.profilePicture);
    return NextResponse.json({ business });
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
