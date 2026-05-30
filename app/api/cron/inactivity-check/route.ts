import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Business from "@/models/Business";
import { sendInactivityWarningEmail, sendInactivityRemovalEmail } from "@/lib/email";

// This route should be triggered periodically (e.g., daily) by a Cron Job
export async function GET(request: Request) {
  try {
    // Optional: secure the route with a secret key passed in the query params
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");
    
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const now = new Date();
    
    // Configurable thresholds
    const INACTIVITY_WARNING_MONTHS = 6;
    const GRACE_PERIOD_DAYS = 30;

    const warningThresholdDate = new Date();
    warningThresholdDate.setMonth(warningThresholdDate.getMonth() - INACTIVITY_WARNING_MONTHS);

    const removalThresholdDate = new Date();
    removalThresholdDate.setDate(removalThresholdDate.getDate() - GRACE_PERIOD_DAYS);

    let warningsSent = 0;
    let removalsProcessed = 0;

    // 1. Process Removals (businesses that were warned but didn't act within grace period)
    const businessesToRemove = await Business.find({
      status: { $in: ["approved", "pending", "recommended_approve", "recommended_reject"] },
      inactivityWarningSentAt: { $lt: removalThresholdDate, $ne: null },
      lastActivityAt: { $lt: warningThresholdDate } // Ensure they haven't been active since the warning
    });

    for (const business of businessesToRemove) {
      // Suspend the business
      business.status = "suspended";
      business.isActive = false;
      business.historyLogs.push({
        action: "auto_suspended",
        description: "Business automatically suspended due to prolonged inactivity after warning.",
        date: new Date()
      });
      await business.save();

      // Send the removal email
      if (business.contactEmail) {
        await sendInactivityRemovalEmail(business.contactEmail, business.name);
      }
      removalsProcessed++;
    }

    // 2. Process Warnings (businesses inactive for 6 months, haven't been warned yet)
    // We consider businesses that have either lastActivityAt < 6 months or if missing, updatedAt < 6 months
    const businessesToWarn = await Business.find({
      status: { $in: ["approved"] }, // We only warn approved businesses
      inactivityWarningSentAt: null, // Only those who haven't received a warning yet
      $or: [
        { lastActivityAt: { $lt: warningThresholdDate } },
        { lastActivityAt: { $exists: false }, updatedAt: { $lt: warningThresholdDate } }
      ]
    });

    for (const business of businessesToWarn) {
      // Mark as warned
      business.inactivityWarningSentAt = new Date();
      await business.save();

      // Send the warning email
      if (business.contactEmail) {
        await sendInactivityWarningEmail(business.contactEmail, business.name, GRACE_PERIOD_DAYS);
      }
      warningsSent++;
    }

    // 3. Clear warnings for businesses that became active again
    // If they have been active since the warning was sent, we clear the warning flag so they can be warned again in the future if they go inactive.
    await Business.updateMany({
      inactivityWarningSentAt: { $ne: null },
      $expr: { $gt: ["$lastActivityAt", "$inactivityWarningSentAt"] }
    }, {
      $set: { inactivityWarningSentAt: null }
    });

    return NextResponse.json({
      success: true,
      message: "Inactivity check completed.",
      warningsSent,
      removalsProcessed,
    });
  } catch (error: any) {
    console.error("Cron Error (inactivity-check):", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
