import mongoose, { Schema, Document, Model, Types } from "mongoose";
import type { IHomepageImage } from "./OnTrendPick.model";
import type { HomepageGender } from "./AlwaysInIt.model";

export type PrimeSelectionAction =
  | "created"
  | "updated"
  | "status_changed"
  | "hotspot_added"
  | "hotspot_updated"
  | "hotspot_deleted"
  | "deleted";

export interface IPrimeHotspot {
  _id?: Types.ObjectId;
  x: number;
  y: number;
  /** Multiple products can be attached to one hotspot. */
  productIds: Types.ObjectId[];
  /** Legacy single-product field kept so old database records keep working. */
  productId?: Types.ObjectId | null;
  categoryId: Types.ObjectId | null;
  isActive: boolean;
}

export interface IPrimeSelectionHistory {
  action: PrimeSelectionAction;
  gender: HomepageGender;
  mainImage: IHomepageImage;
  hotspots: IPrimeHotspot[];
  isActive: boolean;
  changedAt: Date;
  changedBy?: Types.ObjectId | null;
}

export interface IPrimeSelection extends Document {
  name: string;
  gender: HomepageGender;
  mainImage: IHomepageImage;
  hotspots: IPrimeHotspot[];
  isActive: boolean;
  isDeleted: boolean;
  history: IPrimeSelectionHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const imageSchema = new Schema<IHomepageImage>(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, required: true, trim: true },
  },
  { _id: false, versionKey: false }
);

const hotspotSchema = new Schema<IPrimeHotspot>(
  {
    x: { type: Number, required: true, min: 0, max: 100 },
    y: { type: Number, required: true, min: 0, max: 100 },
    productIds: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    // Backward compatibility for records created before multi-product hotspots.
    productId: { type: Schema.Types.ObjectId, ref: "Product", default: null },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    isActive: { type: Boolean, default: true },
  },
  { _id: true, versionKey: false }
);

const historyHotspotSchema = new Schema<IPrimeHotspot>(
  {
    x: { type: Number, required: true, min: 0, max: 100 },
    y: { type: Number, required: true, min: 0, max: 100 },
    productIds: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    productId: { type: Schema.Types.ObjectId, ref: "Product", default: null },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    isActive: { type: Boolean, default: true },
  },
  { _id: false, versionKey: false }
);

const historySchema = new Schema<IPrimeSelectionHistory>(
  {
    action: {
      type: String,
      enum: [
        "created",
        "updated",
        "status_changed",
        "hotspot_added",
        "hotspot_updated",
        "hotspot_deleted",
        "deleted",
      ],
      required: true,
    },
    gender: { type: String, enum: ["men", "women"], required: true },
    mainImage: { type: imageSchema, required: true },
    hotspots: { type: [historyHotspotSchema], default: [] },
    isActive: { type: Boolean, default: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { _id: true, versionKey: false }
);

const primeSelectionSchema = new Schema<IPrimeSelection>(
  {
    name: { type: String, default: "PRIME SELECTION", trim: true },
    gender: { type: String, enum: ["men", "women"], required: true, index: true },
    mainImage: { type: imageSchema, required: true },
    hotspots: { type: [hotspotSchema], default: [] },
    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    history: { type: [historySchema], default: [] },
  },
  { timestamps: true, versionKey: false }
);

primeSelectionSchema.index({ isDeleted: 1, gender: 1, isActive: 1 });

const PrimeSelection: Model<IPrimeSelection> =
  (mongoose.models.PrimeSelection as Model<IPrimeSelection>) ||
  mongoose.model<IPrimeSelection>("PrimeSelection", primeSelectionSchema);

export default PrimeSelection;
