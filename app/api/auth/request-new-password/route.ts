import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/mailer";

const generateRandomPassword = (length = 10) => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0, n = charset.length; i < length; ++i) {
    password += charset.charAt(Math.floor(Math.random() * n));
  }
  return password;
};

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!user.needsPasswordChange) {
      return NextResponse.json({ error: "Account does not have a pending setup." }, { status: 400 });
    }

    // Generate Credentials
    const plainPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 12);

    // Update User
    const tempPasswordExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    user.password = hashedPassword;
    user.tempPasswordExpiresAt = tempPasswordExpiry;
    
    const emailText = `Hello ${user.name},\n\nYou have requested a new setup link for your WondarEthiopia dashboard.\n\nHere are your new login credentials:\nEmail: ${user.email}\nTemporary Password: ${plainPassword}\n\n⚠️ IMPORTANT: This temporary password will expire in 24 hours. You must log in and change your password before it expires.\n\nPlease change your password immediately after logging in.`;

    try {
      await sendEmail(user.email, "WondarEthiopia - Your New Setup Credentials", emailText);
    } catch (emailError: any) {
      console.error("Email Dispatch Error:", emailError);
      return NextResponse.json({ error: "Failed to dispatch email. Please try again later." }, { status: 500 });
    }

    // Only save if email was successful
    await user.save();

    return NextResponse.json({ message: "New credentials have been sent to your email." });

  } catch (error: any) {
    console.error("Request new password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
