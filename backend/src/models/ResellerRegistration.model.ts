import mongoose, { Schema, Document, Model } from "mongoose";

export type SellingPlatform =
  | "whatsapp_instagram"
  | "meesho_glowroad"
  | "online_store"
  | "offline_local_market"
  | "multiple_platforms";

export type ExpectedOrderQuantity =
  | "20_49"
  | "50_99"
  | "100_199"
  | "200_plus";

export interface IResellerRegistration extends Document {
  fullName: string;
  mobileNumber: string;
  emailAddress: string;
  city: string;
  sellingPlatform: SellingPlatform;
  expectedOrderQuantity: ExpectedOrderQuantity;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IResellerRegistration>(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    mobileNumber: { type: String, required: true, trim: true, maxlength: 20 },
    emailAddress: { type: String, required: true, trim: true, lowercase: true, maxlength: 180 },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    sellingPlatform: {
      type: String,
      required: true,
      enum: ["whatsapp_instagram", "meesho_glowroad", "online_store", "offline_local_market", "multiple_platforms"],
      index: true,
    },
    expectedOrderQuantity: {
      type: String,
      required: true,
      enum: ["20_49", "50_99", "100_199", "200_plus"],
      index: true,
    },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ createdAt: -1 });
schema.index({ emailAddress: 1, createdAt: -1 });

const ResellerRegistration: Model<IResellerRegistration> =
  (mongoose.models.ResellerRegistration as Model<IResellerRegistration>) ||
  mongoose.model<IResellerRegistration>("ResellerRegistration", schema);

export default ResellerRegistration;
