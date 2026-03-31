import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IService extends Document {
  businessId: Types.ObjectId;
  name: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  images: string[];
  availability: {
    isAvailable: boolean;
    quantity?: number; // e.g. number of rooms or car fleet size
    slots?: { start: string; end: string; remaining: number }[]; // for tours/events
  };
  features: string[]; // e.g. ["Wi-Fi", "Breakfast", "AC"]
  metadata: Record<string, any>; // Domain specific: views, duration, car model, etc.
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
  {
    businessId: {
      type: Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Service name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Service description is required"],
    },
    category: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    currency: {
      type: String,
      default: "ETB",
    },
    images: {
      type: [String],
      default: [],
    },
    availability: {
      isAvailable: { type: Boolean, default: true },
      quantity: { type: Number, default: 1 },
      slots: [
        {
          start: String,
          end: String,
          remaining: Number,
        },
      ],
    },
    features: {
      type: [String],
      default: [],
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const Service: Model<IService> =
  mongoose.models.Service || mongoose.model<IService>("Service", ServiceSchema);

export default Service;
