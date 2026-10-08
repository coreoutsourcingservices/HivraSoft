import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type NotificationDeliveryChannel = "email" | "website";
export type NotificationDeliveryStatus = "pending" | "sent" | "failed" | "cancelled";

export interface INotificationDelivery extends Document {
  notification?: Types.ObjectId | null;
  schedule?: Types.ObjectId | null;
  user: Types.ObjectId;
  channel: NotificationDeliveryChannel;
  status: NotificationDeliveryStatus;
  scheduledFor: Date;
  processedAt?: Date | null;
  sentAt?: Date | null;
  failureReason: string;
  dedupeKey: string;
  eventType: "none" | "birthday" | "anniversary";
  eventYear?: number | null;
  daysBefore: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<INotificationDelivery>({
  notification: { type: Schema.Types.ObjectId, ref: "Notification", default: null, index: true },
  schedule: { type: Schema.Types.ObjectId, ref: "NotificationSchedule", default: null, index: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  channel: { type: String, enum: ["email", "website"], required: true, index: true },
  status: { type: String, enum: ["pending", "sent", "failed", "cancelled"], default: "pending", index: true },
  scheduledFor: { type: Date, required: true, index: true },
  processedAt: { type: Date, default: null },
  sentAt: { type: Date, default: null },
  failureReason: { type: String, trim: true, default: "", maxlength: 2000 },
  dedupeKey: { type: String, required: true, trim: true, unique: true },
  eventType: { type: String, enum: ["none", "birthday", "anniversary"], default: "none", index: true },
  eventYear: { type: Number, default: null, index: true },
  daysBefore: { type: Number, default: 0, min: 0, max: 365 },
  metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true, versionKey: false });

schema.index({ schedule: 1, user: 1, channel: 1, eventYear: 1, daysBefore: 1 });
schema.index({ status: 1, scheduledFor: -1 });

const NotificationDelivery: Model<INotificationDelivery> =
  (mongoose.models.NotificationDelivery as Model<INotificationDelivery>) ||
  mongoose.model<INotificationDelivery>("NotificationDelivery", schema);

export default NotificationDelivery;
