import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type DiscountCodeValueType = "percentage" | "fixed";
export type DiscountCodeAction = "created" | "updated" | "status_changed" | "deleted";

export interface IDiscountCodeHistory {
  action: DiscountCodeAction;
  code: string;
  valueType: DiscountCodeValueType;
  percentage: number;
  fixedAmount: number;
  minAmount: number;
  maxAmount: number | null;
  isActive: boolean;
  appliesToAllProducts: boolean;
  productCount: number;
  changedAt: Date;
  changedBy?: Types.ObjectId | null;
}

export interface IDiscountCode extends Document {
  code: string;
  valueType: DiscountCodeValueType;
  percentage: number;
  fixedAmount: number;
  minAmount: number;
  maxAmount: number | null;
  isActive: boolean;
  isDeleted: boolean;
  appliesToAllProducts: boolean;
  productIds: Types.ObjectId[];
  startsAt?: Date | null;
  endsAt?: Date | null;
  history: IDiscountCodeHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const historySchema = new Schema<IDiscountCodeHistory>(
  {
    action: {
      type: String,
      enum: ["created", "updated", "status_changed", "deleted"],
      required: true,
    },
    code: { type: String, uppercase: true, trim: true, required: true },
    valueType: { type: String, enum: ["percentage", "fixed"], default: "percentage" },
    percentage: { type: Number, min: 0, max: 100, default: 0 },
    fixedAmount: { type: Number, min: 0, default: 0 },
    minAmount: { type: Number, min: 0, default: 0 },
    maxAmount: { type: Number, min: 0, default: null },
    isActive: { type: Boolean, default: true },
    appliesToAllProducts: { type: Boolean, default: true },
    productCount: { type: Number, min: 0, default: 0 },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { _id: true, versionKey: false }
);

const discountCodeSchema = new Schema<IDiscountCode>(
  {
    code: {
      type: String,
      required: [true, "Discount code is required."],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 40,
      match: [/^[A-Z0-9_-]+$/, "Code can use only letters, numbers, _ or -."],
      index: true,
    },
    valueType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
    },
    percentage: { type: Number, min: 0, max: 100, default: 0 },
    fixedAmount: { type: Number, min: 0, default: 0 },
    minAmount: { type: Number, min: 0, default: 0 },
    maxAmount: { type: Number, min: 0, default: null },
    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    appliesToAllProducts: { type: Boolean, default: true },
    productIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "Product" }],
      default: [],
    },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    history: { type: [historySchema], default: [] },
  },
  { timestamps: true, versionKey: false }
);

discountCodeSchema.index({ isDeleted: 1, isActive: 1, createdAt: -1 });
discountCodeSchema.index({ productIds: 1 });

const DiscountCode: Model<IDiscountCode> =
  (mongoose.models.DiscountCode as Model<IDiscountCode>) ||
  mongoose.model<IDiscountCode>("DiscountCode", discountCodeSchema);

export default DiscountCode;
