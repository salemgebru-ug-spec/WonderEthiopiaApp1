import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Destination from "@/models/Destination";
import Business from "@/models/Business";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await dbConnect();

    // Seed Admins
    const admins = [
      {
        name: "Super Admin",
        email: "superadmin@wondar.com",
        password: "SuperAdmin123!",
        role: "super_admin",
      },
      {
        name: "Tourism Admin",
        email: "tourismadmin@wondar.com",
        password: "TourismAdmin123!",
        role: "tourism_admin",
      },
    ];

    const results: any = { admins: [], destinations: [], businesses: [] };

    for (const admin of admins) {
      const existing = await User.findOne({ email: admin.email });
      if (!existing) {
        const hashedPassword = await bcrypt.hash(admin.password, 12);
        await User.create({ ...admin, password: hashedPassword });
        results.admins.push({ email: admin.email, status: "created" });
      } else {
        results.admins.push({ email: admin.email, status: "already exists" });
      }
    }

    // Seed Destinations
    const destinations = [
      {
        name: "Lalibela Rock-Hewn Churches",
        description: "The 11 medieval monolithic cave churches of this 13th-century 'New Jerusalem' are situated in a mountainous region in the heart of Ethiopia.",
        region: "Amhara",
        city: "Lalibela",
        images: ["https://images.unsplash.com/photo-1599932170364-4447dd060e22?q=80&w=2070&auto=format&fit=crop"],
        category: "Religious",
        rating: 4.9,
      },
      {
        name: "Simien Mountains National Park",
        description: "Massive erosion over the years on the Ethiopian plateau has created one of the most spectacular landscapes in the world, with jagged mountain peaks, deep valleys and sharp precipices.",
        region: "Amhara",
        city: "Debark",
        images: ["https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?q=80&w=2071&auto=format&fit=crop"],
        category: "Nature",
        rating: 4.8,
      },
      {
        name: "Fasil Ghebbi - Gondar",
        description: "The fortress-city of Fasil Ghebbi was the residence of the Ethiopian emperor Fasilides and his successors.",
        region: "Amhara",
        city: "Gondar",
        images: ["https://images.unsplash.com/photo-1588667500599-4d2bc279310d?q=80&w=1974&auto=format&fit=crop"],
        category: "Historical",
        rating: 4.7,
      },
    ];

    for (const dest of destinations) {
      const existing = await Destination.findOne({ name: dest.name });
      if (!existing) {
        await Destination.create(dest);
        results.destinations.push({ name: dest.name, status: "created" });
      } else {
        results.destinations.push({ name: dest.name, status: "already exists" });
      }
    }

    return NextResponse.json({ message: "Seeding finished", results });
  } catch (error: unknown) {
    console.error("Seeding failed:", error);
    return NextResponse.json({ error: "Seeding failed", details: String(error) }, { status: 500 });
  }
}
