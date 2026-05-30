import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Business from "@/models/Business";
import AppNotification from "@/models/Notification";
import User from "@/models/User";
import { sendExpansionApprovalEmail, sendExpansionRejectionEmail } from "@/lib/email";
import path from "path";
import { mkdir, writeFile } from "fs/promises";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "business_owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const formData = await req.formData();
    const category = formData.get("category");
    const reason = formData.get("reason");
    const industryDetailsRaw = formData.get("industryDetails");
    const industryDetails = industryDetailsRaw ? JSON.parse(industryDetailsRaw.toString()) : {};

    if (!category) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 });
    }

    const business = await Business.findOne({ ownerId: session.user.id });
    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // Process File Uploads
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    try { await mkdir(uploadDir, { recursive: true }); } catch (e) {}

    const industryFilesMetadata: any[] = [];
    for (const [key, value] of Array.from(formData.entries())) {
      if (key.startsWith("file_") && value instanceof File) {
        const file = value;
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `req_${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
        const filePath = path.join(uploadDir, fileName);
        
        await writeFile(filePath, buffer);
        const publicUrl = `/uploads/${fileName}`;
        
        industryFilesMetadata.push({
          fieldName: key.replace("file_", ""),
          fileName: file.name,
          url: publicUrl
        });
      }
    }

    // Format industry details and files for the notification
    let detailsString = "";
    if (Object.keys(industryDetails).length > 0) {
      detailsString = "\n\n### Supplemental Industry Data:\n" + 
        Object.entries(industryDetails)
          .map(([key, val]) => `- **${key.charAt(0).toUpperCase() + key.slice(1)}**: ${val}`)
          .join("\n");
    }

    if (industryFilesMetadata.length > 0) {
      detailsString += "\n\n### Supporting Documents:\n" + 
        industryFilesMetadata
          .map(doc => `- [${doc.fileName}](${doc.url}) (${doc.fieldName})`)
          .join("\n");
    }

    // Create a notification for the tourism_admin
    await AppNotification.create({
      recipientRole: "tourism_admin",
      title: "Expansional Domain Request",
      message: `Business "${business.name}" has formally requested internal expansion into the following domains: "${category}".\n\n**Justification:** ${reason || "No strategic reason provided."}${detailsString}`,
      type: "category_request",
      relatedId: business._id,
    });

    return NextResponse.json({ success: true, message: "Category request submitted successfully." });
  } catch (error: any) {
    console.error("Failed to submit category request:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["tourism_admin", "super_admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    let query: any;
    if (session.user.role === "super_admin") {
      query = {
        type: "category_request",
        isRead: false,
        $or: [
          { recipientRole: "super_admin" },
          { recipientRole: "tourism_admin", recommendationAction: null }
        ]
      };
    } else {
      query = { type: "category_request", recipientRole: "tourism_admin", isRead: false };
    }

    const requests = await AppNotification.find(query)
      .sort({ createdAt: -1 })
      .populate("relatedId");

    return NextResponse.json({ requests });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["tourism_admin", "super_admin"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { notificationId, action, note, message } = await req.json();

    const notification = await AppNotification.findById(notificationId);
    if (!notification) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    const business = await Business.findById(notification.relatedId);
    if (!business) return NextResponse.json({ error: "Associated business not found" }, { status: 404 });

    // Handle chat messages
    if (message && message.trim()) {
      const newMessage = {
        senderId: session.user.id,
        senderName: session.user.name,
        senderRole: session.user.role,
        message: message.trim(),
        timestamp: new Date(),
      };

      // Find all related notifications (the original and the forwarded one)
      const allRelatedNotifs = await AppNotification.find({
        $or: [
          { _id: notification._id },
          { sourceNotificationId: notification._id },
          { _id: notification.sourceNotificationId || null }
        ].filter(condition => condition._id !== null)
      });

      for (const n of allRelatedNotifs) {
        if (!n.discussion) n.discussion = [];
        n.discussion.push(newMessage as any);
        await n.save();
      }

      if (!action) {
         try {
           const { pusherServer } = await import("@/lib/pusher");
           await pusherServer.trigger(`admin-notifications-tourism_admin`, "new-internal-message", { senderName: session.user.name, message: "New message in Expansion Request" });
           await pusherServer.trigger(`admin-notifications-super_admin`, "new-internal-message", { senderName: session.user.name, message: "New message in Expansion Request" });
         } catch (e) {}
         return NextResponse.json({ success: true });
      }
    }

    if (session.user.role === "tourism_admin") {
      if (action !== "recommend_approve" && action !== "recommend_reject") {
        return NextResponse.json({ error: "Tourism Admin can only recommend" }, { status: 400 });
      }

      // Forward to super admin with full context + tourism admin note
      const superAdminNotif = await AppNotification.create({
        recipientRole: "super_admin",
        title: action === "recommend_approve" ? "Expansion Recommended for Approval" : "Expansion Recommended for Rejection",
        message: `Tourism Admin **${session.user.name}** recommended ${action === "recommend_approve" ? "APPROVING" : "REJECTING"} this expansion request.\n\n**Tourism Admin Note:** ${note || "No institutional grounds provided."}\n\n---\n\n${notification.message}`,
        type: "category_request",
        relatedId: business._id,
        sourceNotificationId: notification._id,
      });

      // Stamp the original notification with the recommendation state (keep isRead: false — stays visible)
      notification.recommendationAction = action;
      notification.recommendedAt = new Date();
      await notification.save();

      return NextResponse.json({ success: true, message: `Expansion Request ${action === "recommend_approve" ? "Approved" : "Rejected"}.` });
    }

    if (session.user.role === "super_admin") {
      // Extract the requested categories from the message
      const match = notification.message.match(/following domains: "([^"]+)"/);
      const requestedCategories = match && match[1]
        ? match[1].split(",").map((c: string) => c.trim())
        : [];

      // Apply the expansion if approved
      if (action === "approve" && requestedCategories.length > 0) {
        const currentCats = Array.isArray(business.category) ? business.category : [business.category];
        business.category = Array.from(new Set([...currentCats, ...requestedCategories])) as ("hotel" | "tour_operator" | "car_rental" | "event_organizer")[];

        // Parse Supplemental Industry Data from notification message and merge into industryDetails
        const existingDetails = business.industryDetails || {};
        const newDetails: Record<string, any> = { ...existingDetails };

        // Parse "### Supplemental Industry Data:" section
        const supplementalMatch = notification.message.match(/### Supplemental Industry Data:\n([\s\S]+?)(?:\n\n###|$)/);
        if (supplementalMatch) {
          const lines = supplementalMatch[1].split("\n").filter((l: string) => l.startsWith("- **"));
          lines.forEach((line: string) => {
            const kv = line.match(/- \*\*([^*]+)\*\*: (.*)/);
            if (kv) {
              // Convert key from PascalCase label back to camelCase
              const rawKey = kv[1].trim();
              const camelKey = rawKey.charAt(0).toLowerCase() + rawKey.slice(1).replace(/\s+(\w)/g, (_: string, c: string) => c.toUpperCase());
              newDetails[camelKey] = kv[2].trim();
            }
          });
        }

        // Parse "### Supporting Documents:" section and merge into documents array
        const docsMatch = notification.message.match(/### Supporting Documents:\n([\s\S]+?)(?:\n\n###|$)/);
        if (docsMatch) {
          const docLines = docsMatch[1].split("\n").filter((l: string) => l.startsWith("- ["));
          const newDocs: any[] = [];
          docLines.forEach((line: string) => {
            const docMatch = line.match(/- \[([^\]]+)\]\(([^)]+)\) \(([^)]+)\)/);
            if (docMatch) {
              newDocs.push({ fileName: docMatch[1], url: docMatch[2], fieldName: docMatch[3] });
            }
          });
          if (newDocs.length > 0) {
            const existingDocs = Array.isArray(existingDetails.documents) ? existingDetails.documents : [];
            newDetails.documents = [...existingDocs, ...newDocs];
          }
        }

        business.industryDetails = newDetails;
        // Mark modified since industryDetails is Mixed type
        business.markModified("industryDetails");
        await business.save();
      }

      // Mark this super_admin notification as read
      notification.isRead = true;
      await notification.save();

      // Also mark the original tourism_admin notification as read (clear their queue)
      if ((notification as any).sourceNotificationId) {
        await AppNotification.findByIdAndUpdate((notification as any).sourceNotificationId, { isRead: true });
      } else {
        await AppNotification.updateMany(
          { type: "category_request", recipientRole: "tourism_admin", relatedId: business._id, isRead: false },
          { isRead: true }
        );
      }

      // Fetch business owner's email
      const owner = business.ownerId ? await User.findById(business.ownerId).select("email") : null;
      const ownerEmail = owner?.email || business.applicantEmail;

      // Send in-app notification to business owner
      if (business.ownerId) {
        await AppNotification.create({
          recipientRole: "business_owner",
          title: action === "approve" ? "Domain Expansion Approved ✓" : "Domain Expansion Update",
          message: action === "approve"
            ? `Congratulations! Your expansion request for "${requestedCategories.join(", ")}" has been approved. Your business can now operate in these new domains.`
            : `Your expansion request for "${requestedCategories.join(", ")}" was not approved at this time. ${note ? `Admin Note: "${note}"` : ""} You may re-apply after addressing any concerns.`,
          type: "business_status_update",
          relatedId: business._id,
        });
      }

      // Send email to business owner
      if (ownerEmail) {
        try {
          if (action === "approve") {
            await sendExpansionApprovalEmail(ownerEmail, business.name, requestedCategories);
          } else {
            await sendExpansionRejectionEmail(ownerEmail, business.name, requestedCategories, note);
          }
        } catch (emailError) {
          console.error("Failed to send expansion email:", emailError);
          // Don't fail the request if email fails
        }
      }

      return NextResponse.json({ success: true, message: `Expansion Request ${action === "approve" ? "Approved" : "Rejected"}.` });
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
