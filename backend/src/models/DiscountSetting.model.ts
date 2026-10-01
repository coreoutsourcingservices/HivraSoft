import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type ExtraValueType = "percentage" | "fixed";
export type PricingRuleAction = "created" | "updated" | "status_changed" | "deleted";

export interface IDiscountSettingHistory {
  action: PricingRuleAction;
  name: string;
  valueType: ExtraValueType;
  percentage: number;
  fixedAmount: number;
  isActive: boolean;
  minAmount: number;
  maxAmount: number | null;
  excludedProductCount: number;
  changedAt: Date;
  changedBy?: Types.ObjectId | null;
}

export interface IDiscountSetting extends Document {
  name: string;
  valueType: ExtraValueType;
  percentage: number;
  fixedAmount: number;
  isActive: boolean;
  isDeleted: boolean;
  minAmount: number;
  maxAmount: number | null;
  excludedProducts: Types.ObjectId[];
  history: IDiscountSettingHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const historySchema = new Schema<IDiscountSettingHistory>(
  {
    action: {
      type: String,
      enum: ["created", "updated", "status_changed", "deleted"],
      required: true,
    },
    name: { type: String, trim: true, default: "Automatic Discount", maxlength: 100 },
    valueType: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
    percentage: { type: Number, min: 0, max: 100, default: 0 },
    fixedAmount: { type: Number, min: 0, default: 0 },
    isActive: { type: Boolean, default: false },
    minAmount: { type: Number, min: 0, default: 0 },
    maxAmount: { type: Number, min: 0, default: null },
    excludedProductCount: { type: Number, min: 0, default: 0 },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { _id: true, versionKey: false }
);

const discountSettingSchema = new Schema<IDiscountSetting>(
  {
    name: { type: String, trim: true, default: "Automatic Discount", maxlength: 100 },
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
    excludedProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    history: { type: [historySchema], default: [] },
  },
  { timestamps: true, versionKey: false }
);

discountSettingSchema.index({ isDeleted: 1, isActive: 1, minAmount: 1, maxAmount: 1 });

const DiscountSetting: Model<IDiscountSetting> =
  (mongoose.models.DiscountSetting as Model<IDiscountSetting>) ||
  mongoose.model<IDiscountSetting>("DiscountSetting", discountSettingSchema);

export default DiscountSetting;
