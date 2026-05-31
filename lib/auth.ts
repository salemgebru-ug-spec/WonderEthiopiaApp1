import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { adminAuth } from "./firebase-admin";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        idToken: { label: "Firebase ID Token", type: "text" },
      },
      async authorize(credentials) {
        await dbConnect();

        // 1. Google (Firebase) Authentication Flow
        if (credentials?.idToken) {
        try {
            const decodedToken = await adminAuth.verifyIdToken(credentials.idToken);
            if (!decodedToken.email) throw new Error("No email in Google record");

            let user = await User.findOne({ email: decodedToken.email.toLowerCase() });

            // Auto-provision a new 'tourist' user if they don't exist
            if (!user) {
              const randomPassword = await bcrypt.hash(Math.random().toString(36).substring(2), 10);
              user = await User.create({
                name: decodedToken.name || "Google User",
                email: decodedToken.email.toLowerCase(),
                password: randomPassword,
                role: "tourist",
              });
            }

            return {
              id: user._id.toString(),
              name: user.name,
              email: user.email,
              role: user.role,
              needsPasswordChange: user.needsPasswordChange,
              image: user.profileImage,
            };
          } catch (error: any) {
            console.error("Firebase Auth Error code:", error?.code);
            console.error("Firebase Auth Error message:", error?.message);
            console.error("Firebase project ID in use:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
            console.error("Firebase client email in use:", process.env.FIREBASE_CLIENT_EMAIL);
            throw new Error("Invalid Google sign-in: " + (error?.message || "unknown"));
          }
        }

        // 2. Standard Email/Password Authentication Flow
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please provide email and password");
        }

        await dbConnect();

        const user = await User.findOne({ email: credentials.email }).select(
          "+password"
        );

        if (!user) {
          throw new Error("Invalid email or password");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid email or password");
        }

        // Check if temporary password has expired
        if (user.needsPasswordChange && user.tempPasswordExpiresAt) {
          if (new Date() > user.tempPasswordExpiresAt) {
            throw new Error("EXPIRED_TEMP_PASSWORD");
          }
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          needsPasswordChange: user.needsPasswordChange,
          image: user.profileImage,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 2 * 60 * 60, // 2 hours
    updateAge: 10 * 60, // 10 minutes
  },
  jwt: {
    maxAge: 2 * 60 * 60, // align JWT expiration with session
  },
  callbacks: {
    async jwt({ token, user, trigger, session: updateSession }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.needsPasswordChange = (user as any).needsPasswordChange;
        token.image = (user as any).image;
      }

      // Handle manual session updates (trigger: "update")
      if (trigger === "update" && updateSession) {
        if (updateSession.role) token.role = updateSession.role;
        if (updateSession.needsPasswordChange !== undefined) {
          token.needsPasswordChange = updateSession.needsPasswordChange;
        }
        if (updateSession.image) token.image = updateSession.image;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        (session.user as any).needsPasswordChange = token.needsPasswordChange as boolean;
        (session.user as any).image = token.image as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
