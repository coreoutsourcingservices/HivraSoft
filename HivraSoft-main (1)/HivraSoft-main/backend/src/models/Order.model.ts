import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type OrderStatus =
  | "pending"
  | "pending_payment"
  | "confirmed"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "canceled"
  | "returned"
  | "refunded";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface IOrder extends Document {
  orderNumber: string;
  invoiceNumber?: string;
  user: Types.ObjectId;
  customer: Record<string, unknown>;
  items: any[];
  subtotal: number;
  automaticDiscount: number;
  automaticDiscountDetails?: Record<string, unknown>;
  codeDiscount: number;
  codeDiscountDetails?: Record<string, unknown>;
  discount: number;
  discountCode?: string;
  tax: number;
  taxName?: string;
  taxPercentage: number;
  taxDetails?: Record<string, unknown>;
  shipping: number;
  deliveryCharge?: Record<string, unknown>;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  payment: Record<string, unknown>;
  shippingAddress: Record<string, unknown>;
  statusHistory: any[];
  inventoryCommitted: boolean;
  fulfillmentState: "pending" | "processing" | "done" | "failed" | "cancelled";
  cancelledAt?: Date | null;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const statusHistorySchema = new Schema(
  {
    status: { type: String, required: true, trim: true },
    message: { type: String, trim: true, default: "" },
    at: { type: Date, default: Date.now },
    by: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    invoiceNumber: { type: String, unique: true, sparse: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    customer: { type: Schema.Types.Mixed, default: {} },
    items: { type: [Schema.Types.Mixed] as any, default: [] },
    subtotal: { type: Number, required: true, min: 0 },
    automaticDiscount: { type: Number, default: 0, min: 0 },
    automaticDiscountDetails: { type: Schema.Types.Mixed, default: {} },
    codeDiscount: { type: Number, default: 0, min: 0 },
    codeDiscountDetails: { type: Schema.Types.Mixed, default: {} },
    discount: { type: Number, default: 0, min: 0 },
    discountCode: { type: String, uppercase: true, trim: true, default: "" },
    tax: { type: Number, default: 0, min: 0 },
    taxName: { type: String, trim: true, default: "GST" },
    taxPercentage: { type: Number, default: 0, min: 0, max: 100 },
    taxDetails: { type: Schema.Types.Mixed, default: {} },
    shipping: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: [
        "pending",
        "pending_payment",
        "confirmed",
        "processing",
        "shipped",
        "out_for_delivery",
        "delivered",
        "cancelled",
        "canceled",
        "returned",
        "refunded",
      ],
      default: "confirmed",
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    paymentMethod: { type: String, trim: true, lowercase: true, default: "cod", index: true },
    payment: {
      type: Schema.Types.Mixed,
      default: () => ({
        gateway: "cod",
        razorpayOrderId: "",
        razorpayPaymentId: "",
        transactionId: "",
        amount: 0,
        currency: "INR",
        paidAt: null,
      }),
    },
    shippingAddress: { type: Schema.Types.Mixed, required: true },
    statusHistory: { type: [statusHistorySchema] as any, default: [] },
    inventoryCommitted: { type: Boolean, default: false, index: true },
    fulfillmentState: {
      type: String,
      enum: ["pending", "processing", "done", "failed", "cancelled"],
      default: "pending",
      index: true,
    },
    cancelledAt: { type: Date, default: null },
    cancellationReason: { type: String, trim: true, default: "" },
  },
  { timestamps: true, versionKey: false }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ "payment.razorpayOrderId": 1 }, { sparse: true });
orderSchema.index({ "customer.email": 1, createdAt: -1 });
orderSchema.index({ "customer.phone": 1, createdAt: -1 });

const Order: Model<IOrder> =
  (mongoose.models.Order as Model<IOrder>) || mongoose.model<IOrder>("Order", orderSchema);

export default Order;
