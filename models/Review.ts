import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IReview extends Document {
  userId?: Types.ObjectId;
  userName: string; // fallback in case user isn't logged in? Or just use ref. Wait, the source used string.
  targetId: Types.ObjectId;
  targetType: "destination" | "business";
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User", // reference to the user from wonderethiopia
    },
    userName: {
      type: String, // in case we want to support anonymous reviews? Or just use session.user.name.
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    targetType: {
      type: String,
      enum: ["destination", "business"],
      required: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required (1-5)"],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent multiple reviews from the same user on the same object
ReviewSchema.index({ userId: 1, targetId: 1 }, { unique: true });

const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>("Review", ReviewSchema);

export default Review;
