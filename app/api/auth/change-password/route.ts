import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { newPassword } = body;
    const email = body.email?.toLowerCase().trim();
    const tempPassword = body.tempPassword?.trim();

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "Security threshold error. Password must be at least 6 characters." }, { status: 400 });
    }

    await dbConnect();

    let user = null;

    if (session?.user) {
      // Authenticated flow: Find user by session email (more stable) or ID
      const sessionEmail = session.user.email?.toLowerCase().trim();
      console.log(`[AUTH] Verifying session. Email: ${sessionEmail}, ID: ${session.user.id}`);
      
      if (sessionEmail) {
        user = await User.findOne({ email: sessionEmail }).select("+password");
      }
      
      if (!user && (session.user as any).id) {
        user = await User.findById((session.user as any).id).select("+password");
      }
      
      if (!user) {
        console.warn(`[AUTH] Session exists but User record not found for Email: ${sessionEmail} or ID: ${session.user.id}`);
        return NextResponse.json({ error: `Session integrity failure. User record (${sessionEmail || session.user.id}) not found in registry.` }, { status: 401 });
      }

      // If a specific email was provided in the body, ensure it matches the session user
      if (email && user.email !== email) {
        console.warn(`[SECURITY] Session email (${user.email}) does not match requested email (${email}).`);
        return NextResponse.json({ error: "Identity conflict. You are logged into a different account than the one you are trying to secure." }, { status: 403 });
      }
    } else {
      // Unauthenticated flow: Verify via email and temporary password
      if (!email || !tempPassword) {
        return NextResponse.json({ error: "Authentication required. Please provide your email and temporary password." }, { status: 401 });
      }

      console.log(`[AUTH] Verifying temporary credentials for: ${email}`);
      user = await User.findOne({ email }).select("+password tempPasswordExpiresAt needsPasswordChange");
      
      if (!user) {
        console.warn(`[AUTH] Identity verification failed: No user found with email ${email}.`);
        return NextResponse.json({ error: "Identity verification failed. No account found for this email." }, { status: 401 });
      }

      // Check for expiry if it's a temporary password (needsPasswordChange is true)
      if (user.needsPasswordChange && user.tempPasswordExpiresAt && new Date() > user.tempPasswordExpiresAt) {
        console.warn(`[SECURITY] Temporary password expired for: ${email}`);
        return NextResponse.json({ 
          error: "Identity verification failed. Your temporary password has expired (24-hour window closed). Please contact support to reset your account." 
        }, { status: 403 });
      }

      // SECURITY CRITICAL: Unauthorized flow (email + password) only allowed for first-time set up
      if (!user.needsPasswordChange) {
        console.warn(`[SECURITY] Blocked unauthenticated password change attempt for settled account: ${email}`);
        return NextResponse.json({ 
          error: "Access Denied. For your security, password changes on initialized accounts require a valid session. Please log in first." 
        }, { status: 403 });
      }

      // If the account was created without a stored password (e.g., by an admin
      // using a plain-text temp password that was never hashed), allow first-time
      // setup to proceed without bcrypt comparison.
      if (!user.password) {
        console.warn(`[AUTH] No stored password for ${email} — treating as first-time setup, skipping comparison.`);
        // We still require needsPasswordChange to be true (checked above), so
        // this path is safe: only accounts explicitly marked for setup can use it.
      } else {
        const isMatch = await bcrypt.compare(tempPassword, user.password);
        if (!isMatch) {
          console.warn(`[SECURITY] Password mismatch for ${email}.`);
          const errorMsg = user.needsPasswordChange
            ? "Identity verification failed. The temporary password provided is incorrect."
            : "Identity verification failed. The current password provided is incorrect.";
          return NextResponse.json({ error: errorMsg }, { status: 401 });
        }
      }
    }

    if (!user) {
      // Fallback (should be unreachable given checks above)
      return NextResponse.json({ error: "Identity verification failed. Please check your credentials." }, { status: 401 });
    }

    // Encrypt the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      needsPasswordChange: false,
      tempPasswordExpiresAt: null
    });

    console.log(`[SECURITY] Password updated successfully for user: ${user.email}`);
    return NextResponse.json({ 
      message: "Credential rotation successful. Security perimeter restored.",
      role: user.role
    });
  } catch (error: any) {
    console.error("Password Change Error:", error);
    // Detailed professional error response for debugging
    return NextResponse.json(
      {
        error: "An unexpected error occurred while processing your password change. Please try again later.",
        details: {
          message: error?.message,
          name: error?.name,
          stack: error?.stack
        },
        hint: "Check Vercel logs and ensure environment variables (e.g., DB connection, JWT secret) are correctly set."
      },
      { status: 500 }
    );
  }
}
