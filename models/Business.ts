import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IBusiness extends Document {
  ownerId?: Types.ObjectId;
  applicantName: string;
  applicantEmail: string;
  name: string;
  description: string;
  category: "hotel" | "tour_operator" | "car_rental" | "event_organizer" | "restaurant" | "other";
  location: {
    region: string;
    city: string;
    address: string;
  };
  industryDetails: Record<string, any>; // Flexible storage for category-specific questions
  permitNumber: string;
  documents: string[];
  status: "pending" | "recommended_approve" | "recommended_reject" | "approved" | "rejected" | "suspended";
  recommendationNote: string;
  recommendedBy: Types.ObjectId | null;
  decidedBy: Types.ObjectId | null;
  decisionNote: string;
  contactPhone: string;
  contactEmail: string;
  isActive: boolean;
  profilePicture: string;
  createdAt: Date;
  updatedAt: Date;
}

const BusinessSchema = new Schema<IBusiness>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      // required: true -> changed to false because super-admin creates the user later
    },
    applicantName: {
      type: String,
      required: [true, "Applicant name is required"],
      trim: true,
    },
    applicantEmail: {
      type: String,
      required: [true, "Applicant email is required"],
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: [true, "Business name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Business description is required"],
    },
    category: {
      type: String,
      enum: ["hotel", "tour_operator", "car_rental", "event_organizer", "restaurant", "other"],
      required: true,
    },
    location: {
      region: { type: String, required: true },
      city: { type: String, required: true },
      address: { type: String, required: true },
    },
    industryDetails: {
      type: Schema.Types.Mixed,
      default: {},
    },
    permitNumber: {
      type: String,
      required: [true, "Permit number is required"],
    },
    documents: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["pending", "recommended_approve", "recommended_reject", "approved", "rejected", "suspended"],
      default: "pending",
    },
    recommendationNote: {
      type: String,
      default: "",
    },
    recommendedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    decidedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    decisionNote: {
      type: String,
      default: "",
    },
    contactPhone: {
      type: String,
      default: "",
    },
    contactEmail: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    profilePicture: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Business: Model<IBusiness> =
  mongoose.models.Business || mongoose.model<IBusiness>("Business", BusinessSchema);

export default Business;
