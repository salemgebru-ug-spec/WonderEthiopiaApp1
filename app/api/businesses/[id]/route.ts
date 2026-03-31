import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Business from "@/models/Business";

import AppNotification from "@/models/Notification";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { sendApprovalEmail, sendRejectionEmail } from "@/lib/email";
import Service from "@/models/Service";

// GET - Fetch a single business details (Public Access for Discovery)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dbConnect();
    
    const business = await Business.findById(id)
      .select("name description category location contactPhone contactEmail updatedAt status profilePicture");
    
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Fetch services registered by this business
    const services = await Service.find({ businessId: business._id }).sort({ createdAt: -1 });
    
    return NextResponse.json({ data: business, services, success: true });
  } catch (error) {
    console.error("Single Business Fetch Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Update business status (FR-04: Tourism Admin recommends, FR-05: Super Admin decides)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await dbConnect();

    const body = await request.json();
    const { action, note } = body;
    const role = session.user.role;

    const business = await Business.findById(id);
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Tourism Admin can recommend
    if (role === "tourism_admin") {
      if (!["recommended_approve", "recommended_reject"].includes(action)) {
        return NextResponse.json(
          { error: "Tourism admin can only recommend approval or rejection" },
          { status: 400 }
        );
      }

      business.status = action;
      business.recommendationNote = note || "";
      business.recommendedBy = new mongoose.Types.ObjectId(session.user.id);
      await business.save();

      // Notify Super Admin
      await AppNotification.create({
        recipientRole: "super_admin",
        title: action === "recommended_approve" ? "Business Recommended for Approval" : "Business Recommended for Rejection",
        message: `Tourism Admin ${session.user.name} reviewed "${business.name}" and recommended ${action === "recommended_approve" ? "approval" : "rejection"}. Reason: ${note || "None"}`,
        type: "business_recommended",
        relatedId: business._id,
      });

      return NextResponse.json({
        message: `Business ${action === "recommended_approve" ? "recommended for approval" : "recommended for rejection"}`,
        business,
      });
    }

    // Super Admin can make final decisions
    if (role === "super_admin") {
      if (!["approved", "rejected", "suspended"].includes(action)) {
        return NextResponse.json(
          { error: "Invalid action. Use: approved, rejected, or suspended" },
          { status: 400 }
        );
      }

      business.status = action;
      business.decisionNote = note || "";
      business.decidedBy = new mongoose.Types.ObjectId(session.user.id);

      if (action === "approved") {
        // Super-admin registers the business (creates the account)
        const temporaryPassword = Math.random().toString(36).slice(-8); // Generate random password
        const hashedPassword = await bcrypt.hash(temporaryPassword, 12);

        // Check if user already exists
        let user = await User.findOne({ email: business.applicantEmail });
        if (!user) {
          user = await User.create({
            name: business.applicantName,
            email: business.applicantEmail,
            password: hashedPassword,
            role: "business_owner",
          });
        }

        business.ownerId = user._id as Types.ObjectId;

        // REAL EMAIL SENDING
        try {
          await sendApprovalEmail(business.applicantEmail, business.name, temporaryPassword);
          console.log(`[REAL EMAIL SENT TO ${business.applicantEmail}] with credentials.`);
        } catch (emailError) {
          console.error("Failed to send approval email:", emailError);
          // Still create the user and approve the business even if email fails - admins can see credentials elsewhere or reset password
        }
      } else if (action === "rejected") {
        // REAL REJECTION EMAIL
        try {
          await sendRejectionEmail(business.applicantEmail, business.name, note || "Your application did not meet our requirements.");
          console.log(`[REAL EMAIL SENT TO ${business.applicantEmail}] for rejection.`);
        } catch (emailError) {
          console.error("Failed to send rejection email:", emailError);
        }
      }

      await business.save();

      return NextResponse.json({
        message: `Business ${action} successfully`,
        business,
      });
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (error: unknown) {
    console.error("Error updating business:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a business (FR-05: Super Admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await dbConnect();

    const business = await Business.findByIdAndDelete(id);
    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Business deleted successfully" });
  } catch (error: unknown) {
    console.error("Error deleting business:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
