import { applySoftDeletePlugin } from "../utils/softDelete";
import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type OfferType = "buy_get" | "fixed_price_bundle";
export type OfferHistoryAction = "created" | "updated" | "status_changed" | "deleted";

export interface IOfferImage {
  url: string;
  publicId: string;
}

export interface IOfferHistory {
  action: OfferHistoryAction;
  name: string;
  slug: string;
  offerType: OfferType;
  buyQuantity: number;
  getQuantity: number;
  fixedPrice: number;
  appliesToAllProducts: boolean;
  productCount: number;
  categoryCount: number;
  isActive: boolean;
  imageUrl?: string;
  imagePublicId?: string;
  changedAt: Date;
  changedBy?: Types.ObjectId | null;
}

export interface IOffer extends Document {
  name: string;
  slug: string;
  offerType: OfferType;
  buyQuantity: number;
  getQuantity: number;
  fixedPrice: number;
  appliesToAllProducts: boolean;
  productIds: Types.ObjectId[];
  categoryIds: Types.ObjectId[];
  image: IOfferImage | null;
  isActive: boolean;
  isDeleted: boolean;
  history: IOfferHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const historySchema = new Schema<IOfferHistory>(
  {
    action: {
      type: String,
      enum: ["created", "updated", "status_changed", "deleted"],
      required: true,
    },
    name: { type: String, trim: true, default: "" },
    slug: { type: String, trim: true, lowercase: true, default: "" },
    offerType: {
      type: String,
      enum: ["buy_get", "fixed_price_bundle"],
      required: true,
    },
    buyQuantity: { type: Number, min: 1, default: 1 },
    getQuantity: { type: Number, min: 0, default: 0 },
    fixedPrice: { type: Number, min: 0, default: 0 },
    appliesToAllProducts: { type: Boolean, default: false },
    productCount: { type: Number, min: 0, default: 0 },
    categoryCount: { type: Number, min: 0, default: 0 },
    isActive: { type: Boolean, default: true },
    imageUrl: { type: String, trim: true, default: "" },
    imagePublicId: { type: String, trim: true, default: "" },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { _id: true, versionKey: false }
);

const offerSchema = new Schema<IOffer>(
  {
    name: { type: String, trim: true, maxlength: 140, required: true },
    slug: { type: String, trim: true, lowercase: true, maxlength: 160 },
    offerType: {
      type: String,
      enum: ["buy_get", "fixed_price_bundle"],
      required: true,
      index: true,
    },
    buyQuantity: { type: Number, min: 1, max: 999, required: true },
    getQuantity: { type: Number, min: 0, max: 999, default: 0 },
    fixedPrice: { type: Number, min: 0, default: 0 },
    appliesToAllProducts: { type: Boolean, default: false },
    productIds: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    categoryIds: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    image: {
      type: new Schema<IOfferImage>({
        url: { type: String, trim: true, required: true },
        publicId: { type: String, trim: true, required: true },
      }, { _id: false }),
      default: null,
    },
    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    history: { type: [historySchema], default: [] },
  },
  { timestamps: true, versionKey: false }
);

offerSchema.index(
  { slug: 1 },
  {
    unique: true,
    partialFilterExpression: {
      isDeleted: false,
      slug: { $type: "string" },
    },
  }
);
offerSchema.index({ offerType: 1, isDeleted: 1, isActive: 1, updatedAt: -1 });
offerSchema.index({ productIds: 1, isActive: 1 });
offerSchema.index({ categoryIds: 1, isActive: 1 });

applySoftDeletePlugin(offerSchema);

const Offer: Model<IOffer> =
  (mongoose.models.Offer as Model<IOffer>) || mongoose.model<IOffer>("Offer", offerSchema);

export default Offer;
