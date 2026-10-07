import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type ScheduleRecurrence = "daily" | "monthly" | "yearly";
export type ScheduleEventType = "none" | "birthday" | "anniversary";
export type ScheduleAudience = "all" | "selected" | "filtered";

export interface INotificationSchedule extends Document {
  name: string;
  title: string;
  message: string;
  subject: string;
  deliveryEmail: boolean;
  deliveryWebsite: boolean;
  daysBefore: number[];
  type: "general" | "promotion" | "order" | "account" | "system";
  link: string;
  audience: ScheduleAudience;
  filters: Record<string, unknown>;
  userIds: Types.ObjectId[];
  eventType: ScheduleEventType;
  recurrence: ScheduleRecurrence;
  startDate: string;
  time: string;
  timezone: string;
  nextRunAt: Date;
  lastRunAt?: Date | null;
  runCount: number;
  isActive: boolean;
  createdBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<INotificationSchedule>(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 50000 },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    deliveryEmail: { type: Boolean, default: false },
    deliveryWebsite: { type: Boolean, default: true },
    daysBefore: { type: [{ type: Number, min: 0, max: 3 }], default: [0] },
    type: { type: String, enum: ["general", "promotion", "order", "account", "system"], default: "general" },
    link: { type: String, trim: true, default: "", maxlength: 500 },
    audience: { type: String, enum: ["all", "selected", "filtered"], default: "all", index: true },
    filters: { type: Schema.Types.Mixed, default: {} },
    userIds: { type: [{ type: Schema.Types.ObjectId, ref: "User" }], default: [] },
    eventType: { type: String, enum: ["none", "birthday", "anniversary"], default: "none", index: true },
    recurrence: { type: String, enum: ["daily", "monthly", "yearly"], required: true, default: "daily" },
    startDate: { type: String, required: true, trim: true },
    time: { type: String, required: true, trim: true },
    timezone: { type: String, default: "Asia/Kolkata", trim: true },
    nextRunAt: { type: Date, required: true, index: true },
    lastRunAt: { type: Date, default: null },
    runCount: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ isActive: 1, nextRunAt: 1 });
schema.index({ createdAt: -1 });

const NotificationSchedule: Model<INotificationSchedule> =
  (mongoose.models.NotificationSchedule as Model<INotificationSchedule>) ||
  mongoose.model<INotificationSchedule>("NotificationSchedule", schema);

export default NotificationSchedule;
