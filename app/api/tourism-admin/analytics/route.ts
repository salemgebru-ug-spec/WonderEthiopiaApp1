import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Business from "@/models/Business";
import Report from "@/models/Report";
import User from "@/models/User";
import Review from "@/models/Review";
import Booking from "@/models/Booking";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["tourism_admin", "super_admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await dbConnect();

    // ── Businesses ────────────────────────────────────────────────
    const allBusinesses = await Business.find({}).lean();

    const businessStats = {
      total: allBusinesses.length,
      pending: allBusinesses.filter(b => b.status === "pending").length,
      recommended: allBusinesses.filter(b =>
        b.status === "recommended_approve" || b.status === "recommended_reject"
      ).length,
      approved: allBusinesses.filter(b => b.status === "approved").length,
      rejected: allBusinesses.filter(b => b.status === "rejected").length,
      suspended: allBusinesses.filter(b => b.status === "suspended").length,
    };

    // Category breakdown
    const categoryCount: Record<string, number> = {
      hotel: 0,
      tour_operator: 0,
      car_rental: 0,
      event_organizer: 0,
    };
    for (const biz of allBusinesses) {
      const cats = Array.isArray(biz.category) ? biz.category : [biz.category];
      for (const cat of cats) {
        if (cat in categoryCount) categoryCount[cat]++;
      }
    }

    // Region breakdown — top 8
    const regionCount: Record<string, number> = {};
    for (const biz of allBusinesses) {
      const region = biz.location?.region || "Unknown";
      regionCount[region] = (regionCount[region] || 0) + 1;
    }
    const topRegions = Object.entries(regionCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([region, count]) => ({ region, count }));

    // Monthly registration trend — last 6 months
    const now = new Date();
    const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const end = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 1);
      const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      const count = allBusinesses.filter(b => {
        const created = new Date(b.createdAt);
        return created >= d && created < end;
      }).length;
      return { label, count };
    });

    // ── Reports ───────────────────────────────────────────────────
    const allReports = await Report.find({}).lean();

    const reportStats = {
      total: allReports.length,
      pending: allReports.filter(r => r.status === "pending").length,
      under_review: allReports.filter(r =>
        r.status === "recommended_under_review" ||
        r.status === "recommended_warning" ||
        r.status === "recommended_suspension" ||
        r.status === "recommended_dismissal"
      ).length,
      dismissed: allReports.filter(r => r.status === "dismissed").length,
      suspended: allReports.filter(r => r.status === "suspended").length,
      warned: allReports.filter(r => r.status === "warned").length,
    };

    const reasonCount: Record<string, number> = {};
    for (const report of allReports) {
      const reason = report.reason || "other";
      reasonCount[reason] = (reasonCount[reason] || 0) + 1;
    }
    const reportsByReason = Object.entries(reasonCount)
      .sort((a, b) => b[1] - a[1])
      .map(([reason, count]) => ({ reason, count }));

    // ── Users ─────────────────────────────────────────────────────
    const [touristCount, businessOwnerCount, tourismAdminCount] = await Promise.all([
      User.countDocuments({ role: "tourist" }),
      User.countDocuments({ role: "business_owner" }),
      User.countDocuments({ role: "tourism_admin" }),
    ]);

    // ── Reviews ───────────────────────────────────────────────────
    const allReviews = await Review.find({}).lean();
    const reviewStats = {
      total: allReviews.length,
      avgRating: allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
        : 0,
    };

    // ── Bookings ──────────────────────────────────────────────────
    const allBookings = await Booking.find({}).lean();
    const bookingStats = {
      total: allBookings.length,
      pending: allBookings.filter(b => b.status === "pending").length,
      confirmed: allBookings.filter(b => b.status === "confirmed").length,
      completed: allBookings.filter(b => b.status === "completed").length,
      cancelled: allBookings.filter(b => b.status === "cancelled").length,
    };

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      businesses: { stats: businessStats, byCategory: categoryCount, byRegion: topRegions, monthlyTrend },
      reports: { stats: reportStats, byReason: reportsByReason },
      users: { tourists: touristCount, businessOwners: businessOwnerCount, tourismAdmins: tourismAdminCount },
      reviews: reviewStats,
      bookings: bookingStats,
    });

  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
