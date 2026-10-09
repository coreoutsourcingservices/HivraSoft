import mongoose, { Schema, type Model, type Types, type Document } from "mongoose";

export type CustomerPromotionText = { id: number; text: string };
export type CustomerPromotionStatus = "pending" | "processing" | "sent" | "cancelled";

export interface ICustomerPromotionMessage extends Document {
  user: Types.ObjectId;
  date: string;
  title: string;
  message: CustomerPromotionText[] | string; // older records may still contain a string
  status: CustomerPromotionStatus;
  scheduledFor: Date;
  processingAt?: Date | null;
  sentAt?: Date | null;
  notification?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const entrySchema = new Schema<CustomerPromotionText>({
  id: { type: Number, required: true, min: 1 },
  text: { type: String, required: true, trim: true, maxlength: 2000 },
}, { _id: false });

const schema = new Schema<ICustomerPromotionMessage>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
  // These are backend-owned; client supplies only {date, message}.
  title: { type: String, default: "HivraSoft Promotion", required: true },
  message: { type: [entrySchema], required: true, validate: {
    validator: (value: unknown) => Array.isArray(value) && value.length > 0 && value.length <= 100,
    message: "Provide 1-100 promotional messages.",
  } },
  status: { type: String, enum: ["pending", "processing", "sent", "cancelled"], default: "pending", index: true },
  scheduledFor: { type: Date, required: true, index: true },
  processingAt: { type: Date, default: null },
  sentAt: { type: Date, default: null },
  notification: { type: Schema.Types.ObjectId, ref: "Notification", default: null },
}, { timestamps: true, versionKey: false });

schema.index({ user: 1, scheduledFor: 1, createdAt: -1 });
schema.index({ status: 1, scheduledFor: 1 });

const CustomerPromotionMessage: Model<ICustomerPromotionMessage> =
  (mongoose.models.CustomerPromotionMessage as Model<ICustomerPromotionMessage>) ||
  mongoose.model<ICustomerPromotionMessage>("CustomerPromotionMessage", schema);

export default CustomerPromotionMessage;
