import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { encode } from "next-auth/jwt";

/**
 * Endpoint for a newly approved business owner to finalize their temporary password.
 *
 * Expected JSON payload:
 * {
 *   "email": "owner@example.com",
 *   "temporaryPassword": "tempPassSentViaEmail",
 *   "newPassword": "chosenSecurePassword"
 * }
 */
export async function POST(request: Request) {
  try {
    await dbConnect();
    const { email, temporaryPassword, newPassword } = await request.json();
    if (!email || !temporaryPassword || !newPassword) {
      return NextResponse.json({ error: "email, temporaryPassword and newPassword are required" }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Ensure this is a temporary‑password flow
    if (!user.needsPasswordChange || !user.tempPasswordExpiresAt) {
      return NextResponse.json({ error: "No pending temporary password for this user" }, { status: 400 });
    }
    // Expiration check
    if (new Date() > user.tempPasswordExpiresAt) {
      return NextResponse.json({ error: "EXPIRED_TEMP_PASSWORD" }, { status: 400 });
    }
    // Verify temporary password matches stored hash
    const isTempValid = await bcrypt.compare(temporaryPassword, user.password);
    if (!isTempValid) {
      return NextResponse.json({ error: "Invalid temporary password" }, { status: 401 });
    }

    // Set new permanent password
    const hashed = await bcrypt.hash(newPassword, 12);
    user.password = hashed;
    user.needsPasswordChange = false;
    user.tempPasswordExpiresAt = null;
    await user.save();

    // Issue JWT token compatible with NextAuth session config (2‑hour expiry)
    const token = await encode({
      token: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        needsPasswordChange: false,
        image: user.profileImage,
      },
      secret: process.env.NEXTAUTH_SECRET,
      maxAge: 2 * 60 * 60,
    });

    // Return response and set the session cookie so the user is instantly logged in
    const response = NextResponse.json({
      message: "Password updated and user logged in",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.profileImage,
      },
    });
    response.cookies.set({
      name: "next-auth.session-token",
      value: token,
      httpOnly: true,
      path: "/",
      maxAge: 2 * 60 * 60,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return response;
  } catch (error: any) {
    console.error("Complete‑setup error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
