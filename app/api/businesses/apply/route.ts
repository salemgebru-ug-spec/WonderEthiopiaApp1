import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Business from "@/models/Business";
import AppNotification from "@/models/Notification";
import { pusherServer } from "@/lib/pusher";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const data: Record<string, any> = {};
    formData.forEach((value, key) => {
      if (!key.startsWith("file_") && key !== "category") {
        data[key] = value;
      }
    });

    const categories = formData.getAll("category") as string[];
    data.category = categories;

    const contactEmail = formData.get("contactEmail") as string;
    const applicantName = formData.get("applicantName") as string;

    // Required fields check
    const required = ["applicantName", "name", "contactEmail", "permitNumber"];
    for (const f of required) {
      if (!formData.get(f)) {
        return NextResponse.json({ error: `Missing required field: ${f}` }, { status: 400 });
      }
    }

    if (!categories || categories.length === 0) {
      return NextResponse.json({ error: "At least one business category is required" }, { status: 400 });
    }

    await dbConnect();

    // Re-application restriction
    const existing = await Business.findOne({
      contactEmail: contactEmail,
      status: { $in: ["pending", "recommended_approve", "recommended_reject"] },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You already have a pending application. Please wait for the final decision." },
        { status: 400 }
      );
    }

    // Process files
    const uploadedFilePaths: string[] = [];
    const industryFilesMetadata: any[] = [];
    
    // Warning: Storing files as Base64 in MongoDB has a hard limit of 16MB per document.
    for (const [key, value] of Array.from(formData.entries())) {
      if (key.startsWith("file_") && value instanceof File) {
        const file = value;
        const buffer = Buffer.from(await file.arrayBuffer());
        
        // Convert file buffer to Base64 string
        const base64Data = buffer.toString("base64");
        const dataUrl = `data:${file.type};base64,${base64Data}`;
        
        uploadedFilePaths.push(dataUrl);
        industryFilesMetadata.push({
          fieldName: key.replace("file_", ""),
          fileName: file.name,
          url: dataUrl
        });
      }
    }

    const industryDetailsBase = data.industryDetails ? JSON.parse(data.industryDetails) : {};
    const finalIndustryDetails = {
      ...industryDetailsBase,
      documents: industryFilesMetadata
    };

    // Create a new business application with "pending" status
    const newBusiness = await Business.create({
      applicantName: applicantName,
      applicantEmail: contactEmail, // Map contactEmail to applicantEmail
      name: data.name,
      description: data.description || "",
      category: categories,
      location: {
        region: data.region || "",
        city: data.city || "",
        address: data.address || "",
      },
      industryDetails: finalIndustryDetails,
      permitNumber: data.permitNumber,
      contactEmail: contactEmail,
      contactPhone: data.contactPhone || "",
      status: "pending",
      documents: uploadedFilePaths // Main documents array also stores URLs
    });

    // Create a persistent notification record
    await AppNotification.create({
      recipientRole: "tourism_admin",
      title: "New Business Application",
      message: `A new registration for "${newBusiness.name}" (${categories.join(", ")}) has been submitted.`,
      type: "business_registration",
      relatedId: newBusiness._id,
    });

    // Send real-time notification
    try {
      await pusherServer.trigger("admin-notifications", "new-application", {
        message: `New business application received: ${newBusiness.name}`,
        businessId: newBusiness._id,
      });
    } catch (pusherError) {
      console.error("Pusher error:", pusherError);
    }

    return NextResponse.json(
      { message: "Application submitted successfully.", business: newBusiness },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Application error:", error);

    // Provide a professional message to the user for unexpected errors
    return NextResponse.json(
      { error: "An unexpected error occurred while processing your application. Please try again later." },
      { status: 500 }
    );
  }
}
