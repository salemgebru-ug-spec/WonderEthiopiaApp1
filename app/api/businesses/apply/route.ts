import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Business from "@/models/Business";
import AppNotification from "@/models/Notification";
import { pusherServer } from "@/lib/pusher";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = (buffer: Buffer, originalFilename: string, mimeType: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    let resourceType: "image" | "raw" | "auto" = "auto";
    if (mimeType.startsWith("image/")) resourceType = "image";
    else resourceType = "raw";
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "business_uploads",
        resource_type: resourceType,
        public_id: `${Date.now()}_${originalFilename.replace(/\\s+/g, "_").split(".")[0]}`,
        allowed_formats: undefined,
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("Cloudinary upload failed"));
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
};

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

    for (const [key, value] of Array.from(formData.entries())) {
      if (key.startsWith("file_") && value instanceof File) {
        const file = value;
        const buffer = Buffer.from(await file.arrayBuffer());

        const publicUrl = await uploadToCloudinary(buffer, file.name, file.type);


        uploadedFilePaths.push(publicUrl);
        industryFilesMetadata.push({
          fieldName: key.replace("file_", ""),
          fileName: file.name,
          url: publicUrl
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

    // Provide a detailed but professional error response for debugging
    return NextResponse.json(
      {
        error: "An unexpected error occurred while processing your application. Please try again later.",
        details: {
          message: error?.message,
          name: error?.name,
          stack: error?.stack
        },
        hint: "Check Vercel logs and ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET are set in Vercel environment variables."
      },
      { status: 500 }
    );
  }
}
