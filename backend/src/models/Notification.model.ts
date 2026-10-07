import { applySoftDeletePlugin } from "../utils/softDelete";
import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type NotificationType =
  | "general"
  | "promotion"
  | "order"
  | "account"
  | "system"
  | "cart_reminder"
  | "wishlist_reminder";

export type NotificationAudience = "all" | "selected" | "filtered";
export type NotificationSource = "admin" | "system";

export interface INotification extends Document {
  title: string;
  message: string;
  subject: string;
  deliveryEmail: boolean;
  deliveryWebsite: boolean;
  type: NotificationType;
  audience: NotificationAudience;
  userIds: Types.ObjectId[];
  filters: Record<string, unknown>;
  recipientCount: number;
  link: string;
  imageUrl: string;
  isActive: boolean;
  readBy: Types.ObjectId[];
  deletedBy: Types.ObjectId[];
  createdBy?: Types.ObjectId | null;
  source: NotificationSource;
  dedupeKey?: string | null;
  product?: Types.ObjectId | null;
  reminderStageDays?: number | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50000,
    },
    subject: { type: String, trim: true, default: "", maxlength: 200 },
    deliveryEmail: { type: Boolean, default: false, index: true },
    deliveryWebsite: { type: Boolean, default: true, index: true },
    type: {
      type: String,
      enum: [
        "general",
        "promotion",
        "order",
        "account",
        "system",
        "cart_reminder",
        "wishlist_reminder",
      ],
      default: "general",
      index: true,
    },
    audience: {
      type: String,
      enum: ["all", "selected", "filtered"],
      required: true,
      default: "all",
      index: true,
    },
    userIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    filters: {
      type: Schema.Types.Mixed,
      default: {},
    },
    recipientCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    link: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1500,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    readBy: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    deletedBy: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    source: {
      type: String,
      enum: ["admin", "system"],
      default: "admin",
      index: true,
    },
    dedupeKey: {
      type: String,
      trim: true,
      default: null,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      default: null,
      index: true,
    },
    reminderStageDays: {
      type: Number,
      default: null,
      min: 0,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

notificationSchema.index({ createdAt: -1, isActive: 1 });
notificationSchema.index({ audience: 1, userIds: 1, createdAt: -1 });
notificationSchema.index(
  { dedupeKey: 1 },
  {
    unique: true,
    partialFilterExpression: { dedupeKey: { $type: "string" } },
  }
);

applySoftDeletePlugin(notificationSchema);

const Notification: Model<INotification> =
  (mongoose.models.Notification as Model<INotification>) ||
  mongoose.model<INotification>("Notification", notificationSchema);

export default Notification;
