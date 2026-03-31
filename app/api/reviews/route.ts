import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Review from "@/models/Review";

// GET - List reviews for a specific target (destination or business)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get("target_id");
    const targetType = searchParams.get("target_type");

    if (!targetId || !targetType) {
      return NextResponse.json(
        { success: false, error: "target_id and target_type are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const reviews = await Review.find({ targetId, targetType })
      .populate("userId", "name role")
      .sort({ createdAt: -1 });

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return NextResponse.json({ success: true, reviews, avgRating });
  } catch (error: any) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a review
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // In demo mode or if session is missing, we might allow anonymous or use a demo user
    // However, for WondarEthiopia, let's require authentication
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const { target_id, target_type, rating, comment } = body;

    if (!target_id || !target_type || !rating) {
      return NextResponse.json(
        { error: "target_id, target_type, and rating are required" },
        { status: 400 }
      );
    }

    // Check if the user has already reviewed this target
    const existingReview = await Review.findOne({ 
      userId: session.user.id, 
      targetId: target_id 
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already reviewed this item" },
        { status: 400 }
      );
    }

    const review = await Review.create({
      userId: session.user.id,
      userName: session.user.name,
      targetId: target_id,
      targetType: target_type,
      rating,
      comment,
    });

    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating review:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "You have already reviewed this item" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
