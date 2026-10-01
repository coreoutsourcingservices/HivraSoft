import mongoose, { Schema, Document, Model, Types } from "mongoose";
import type { HomepageChangeAction, IHomepageImage } from "./OnTrendPick.model";

export type HomepageGender = "men" | "women";

export interface IAlwaysInItHistory {
  action: HomepageChangeAction;
  gender: HomepageGender;
  mainImage: IHomepageImage;
  productIds: Types.ObjectId[];
  isActive: boolean;
  changedAt: Date;
  changedBy?: Types.ObjectId | null;
}

export interface IAlwaysInIt extends Document {
  name: string;
  gender: HomepageGender;
  mainImage: IHomepageImage;
  productIds: Types.ObjectId[];
  isActive: boolean;
  isDeleted: boolean;
  history: IAlwaysInItHistory[];
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

const historySchema = new Schema<IAlwaysInItHistory>(
  {
    action: {
      type: String,
      enum: ["created", "updated", "status_changed", "deleted"],
      required: true,
    },
    gender: { type: String, enum: ["men", "women"], required: true },
    mainImage: { type: imageSchema, required: true },
    productIds: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    isActive: { type: Boolean, default: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { _id: true, versionKey: false }
);

const alwaysInItSchema = new Schema<IAlwaysInIt>(
  {
    name: { type: String, default: "ALWAYS IN IT", trim: true },
    gender: { type: String, enum: ["men", "women"], required: true, index: true },
    mainImage: { type: imageSchema, required: true },
    productIds: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    history: { type: [historySchema], default: [] },
  },
  { timestamps: true, versionKey: false }
);

alwaysInItSchema.index({ isDeleted: 1, gender: 1, isActive: 1 });

const AlwaysInIt: Model<IAlwaysInIt> =
  (mongoose.models.AlwaysInIt as Model<IAlwaysInIt>) ||
  mongoose.model<IAlwaysInIt>("AlwaysInIt", alwaysInItSchema);

export default AlwaysInIt;
