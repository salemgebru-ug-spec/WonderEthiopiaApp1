import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDestination extends Document {
  name: string;
  description: string;
  region: string;
  city: string;
  images: string[];
  rating: number;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

const DestinationSchema = new Schema<IDestination>(
  {
    name: {
      type: String,
      required: [true, "Destination name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    region: {
      type: String,
      required: [true, "Region is required"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
    },
    images: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      default: "Other",
    },
  },
  {
    timestamps: true,
  }
);

const Destination: Model<IDestination> =
  mongoose.models.Destination || mongoose.model<IDestination>("Destination", DestinationSchema);

export default Destination;
