import mongoose, { Schema, Document } from "mongoose";

export interface ITourismProfile extends Document {
  userId: mongoose.Types.ObjectId;
  activity_preferences: string[];
  travel_style: string;
  interests: string[];
  accommodation_type: string;
  room_type: string;
  amenities: string[];
  duration_preference: string;
  fitness_level: string;
  group_type: string;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TourismProfileSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    activity_preferences: { 
      type: [String], 
      enum: ["hiking", "safari", "water_activities"],
      default: []
    },
    travel_style: { 
      type: String, 
      enum: ["luxury", "budget", "backpacking", "eco_friendly", ""]
    },
    interests: { 
      type: [String], 
      enum: ["history", "culture", "festivals", "food"],
      default: []
    },
    accommodation_type: { 
      type: String, 
      enum: ["hotel", "lodge", "hostel", ""]
    },
    room_type: { 
      type: String, 
      enum: ["private", "shared", ""]
    },
    amenities: { 
      type: [String], 
      enum: ["wifi", "pool", "spa"],
      default: []
    },
    duration_preference: { 
      type: String, 
      enum: ["short", "medium", "long", ""]
    },
    fitness_level: { 
      type: String, 
      enum: ["easy", "moderate", "hard", ""]
    },
    group_type: { 
      type: String, 
      enum: ["solo", "couple", "family", ""]
    },
    isCompleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.models.TourismProfile || mongoose.model<ITourismProfile>("TourismProfile", TourismProfileSchema);
