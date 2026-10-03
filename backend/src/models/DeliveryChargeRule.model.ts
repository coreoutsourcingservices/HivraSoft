import { applySoftDeletePlugin } from "../utils/softDelete";
import mongoose, { Document, Model, Schema, Types } from "mongoose";

export type DeliveryPaymentMethod = "cod" | "online";

export interface IDeliveryChargeHistory {
  action: "created" | "updated" | "status_changed" | "deleted";
  paymentMethod: DeliveryPaymentMethod;
  minAmount: number;
  maxAmount: number | null;
  charge: number;
  isActive: boolean;
  changedAt: Date;
  changedBy?: Types.ObjectId | null;
}

export interface IDeliveryChargeRule extends Document {
  paymentMethod: DeliveryPaymentMethod;
  minAmount: number;
  maxAmount: number | null;
  charge: number;
  isActive: boolean;
  isDeleted: boolean;
  history: IDeliveryChargeHistory[];
  createdAt: Date;
  updatedAt: Date;
}

const historySchema = new Schema<IDeliveryChargeHistory>(
  {
    action: {
      type: String,
      enum: ["created", "updated", "status_changed", "deleted"],
      required: true,
    },
    paymentMethod: { type: String, enum: ["cod", "online"], required: true },
    minAmount: { type: Number, required: true, min: 0 },
    maxAmount: { type: Number, default: null, min: 0 },
    charge: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, required: true },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { _id: true, versionKey: false }
);

const deliveryChargeRuleSchema = new Schema<IDeliveryChargeRule>(
  {
    paymentMethod: {
      type: String,
      enum: ["cod", "online"],
      required: true,
      index: true,
    },
    minAmount: { type: Number, required: true, min: 0, default: 0 },
    maxAmount: { type: Number, default: null, min: 0 },
    charge: { type: Number, required: true, min: 0, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    history: { type: [historySchema], default: [] },
  },
  { timestamps: true, versionKey: false }
);

deliveryChargeRuleSchema.index({ isDeleted: 1, paymentMethod: 1, minAmount: 1, maxAmount: 1 });

applySoftDeletePlugin(deliveryChargeRuleSchema);

const DeliveryChargeRule: Model<IDeliveryChargeRule> =
  (mongoose.models.DeliveryChargeRule as Model<IDeliveryChargeRule>) ||
  mongoose.model<IDeliveryChargeRule>("DeliveryChargeRule", deliveryChargeRuleSchema);

export default DeliveryChargeRule;
