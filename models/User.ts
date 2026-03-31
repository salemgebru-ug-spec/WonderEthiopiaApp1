import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "tourist" | "business_owner" | "tourism_admin" | "super_admin";
  phoneNumber?: string;
  bio?: string;
  profileImage?: string;
  preferences?: {
    categories?: string[]; // e.g. ["adventure", "culture", "religious"]
    regions?: string[]; // e.g. ["amhara", "tigray"]
    budget?: "low" | "mid" | "high";
    language?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: [6, "Password must be at least 6 characters"],
    },
    role: {
      type: String,
      enum: ["tourist", "business_owner", "tourism_admin", "super_admin"],
      default: "tourist",
    },
    phoneNumber: { type: String, default: "" },
    bio: { type: String, default: "" },
    profileImage: { type: String, default: "" },
    preferences: {
      type: Schema.Types.Mixed,
      default: {
        categories: [],
        regions: [],
        budget: "mid",
        language: "english",
      },
    },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
