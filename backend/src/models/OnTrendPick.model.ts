import { applySoftDeletePlugin } from "../utils/softDelete";
import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type HomepageChangeAction = "created" | "updated" | "status_changed" | "deleted";

export interface IHomepageImage {
  url: string;
  publicId: string;
}

export interface IOnTrendHistory {
  action: HomepageChangeAction;
  image: IHomepageImage;
  link: string;
  productId: Types.ObjectId | null;
  categoryId: Types.ObjectId | null;
  order: number;
  isActive: boolean;
  changedAt: Date;
  changedBy?: Types.ObjectId | null;
}

export interface IOnTrendPick extends Document {
  name: string;
  image: IHomepageImage;
  link: string;
  productId: Types.ObjectId | null;
  categoryId: Types.ObjectId | null;
  order: number;
  isActive: boolean;
  isDeleted: boolean;
  history: IOnTrendHistory[];
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

const historySchema = new Schema<IOnTrendHistory>(
  {
    action: {
      type: String,
      enum: ["created", "updated", "status_changed", "deleted"],
      required: true,
    },
    image: { type: imageSchema, required: true },
    link: { type: String, default: "", trim: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", default: null },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    order: { type: Number, min: 0, default: 0 },
    isActive: { type: Boolean, default: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { _id: true, versionKey: false }
);

const onTrendPickSchema = new Schema<IOnTrendPick>(
  {
    name: { type: String, default: "ON TREND PICKS", trim: true },
    image: { type: imageSchema, required: true },
    link: { type: String, default: "", trim: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", default: null, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", default: null, index: true },
    order: { type: Number, min: 0, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    history: { type: [historySchema], default: [] },
  },
  { timestamps: true, versionKey: false }
);

onTrendPickSchema.index({ isDeleted: 1, isActive: 1, order: 1, createdAt: 1 });

applySoftDeletePlugin(onTrendPickSchema);

const OnTrendPick: Model<IOnTrendPick> =
  (mongoose.models.OnTrendPick as Model<IOnTrendPick>) ||
  mongoose.model<IOnTrendPick>("OnTrendPick", onTrendPickSchema);

export default OnTrendPick;
