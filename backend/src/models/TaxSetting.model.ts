import { applySoftDeletePlugin } from "../utils/softDelete";
import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type TaxValueType = "percentage" | "fixed";
export type TaxRuleAction = "created" | "updated" | "status_changed" | "deleted";

export interface ITaxSettingHistory {
  action: TaxRuleAction;
  name: string;
  valueType: TaxValueType;
  percentage: number;
  fixedAmount: number;
  isActive: boolean;
  minAmount: number;
  maxAmount: number | null;
  applyToAllProducts: boolean;
  excludedProductCount: number;
  changedAt: Date;
  changedBy?: Types.ObjectId | null;
}

export interface ITaxSetting extends Document {
  name: string;
  valueType: TaxValueType;
  percentage: number;
  fixedAmount: number;
  isActive: boolean;
  isDeleted: boolean;
  minAmount: number;
  maxAmount: number | null;
  applyToAllProducts: boolean;
  excludedProducts: Types.ObjectId[];
  history: ITaxSettingHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const historySchema = new Schema<ITaxSettingHistory>(
  {
    action: {
      type: String,
      enum: ["created", "updated", "status_changed", "deleted"],
      required: true,
    },
    name: { type: String, trim: true, default: "GST", maxlength: 100 },
    valueType: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
    percentage: { type: Number, min: 0, max: 100, default: 0 },
    fixedAmount: { type: Number, min: 0, default: 0 },
    isActive: { type: Boolean, default: false },
    minAmount: { type: Number, min: 0, default: 0 },
    maxAmount: { type: Number, min: 0, default: null },
    applyToAllProducts: { type: Boolean, default: true },
    excludedProductCount: { type: Number, min: 0, default: 0 },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { _id: true, versionKey: false }
);

const taxSettingSchema = new Schema<ITaxSetting>(
  {
    name: { type: String, trim: true, default: "GST", maxlength: 100 },
    valueType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
      index: true,
    },
    percentage: { type: Number, min: 0, max: 100, default: 0 },
    fixedAmount: { type: Number, min: 0, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    minAmount: { type: Number, min: 0, default: 0, index: true },
    maxAmount: { type: Number, min: 0, default: null },
    applyToAllProducts: { type: Boolean, default: true },
    excludedProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    history: { type: [historySchema], default: [] },
  },
  { timestamps: true, versionKey: false }
);

taxSettingSchema.index({ isDeleted: 1, isActive: 1, minAmount: 1, maxAmount: 1 });

applySoftDeletePlugin(taxSettingSchema);

const TaxSetting: Model<ITaxSetting> =
  (mongoose.models.TaxSetting as Model<ITaxSetting>) ||
  mongoose.model<ITaxSetting>("TaxSetting", taxSettingSchema);

export default TaxSetting;
