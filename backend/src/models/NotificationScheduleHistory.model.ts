import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface INotificationScheduleHistory extends Document {
  schedule: Types.ObjectId;
  scheduleName: string;
  ranAt: Date;
  recipientCount: number;
  status: "success" | "skipped" | "failed";
  note: string;
  notification?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<INotificationScheduleHistory>(
  {
    schedule: { type: Schema.Types.ObjectId, ref: "NotificationSchedule", required: true, index: true },
    scheduleName: { type: String, required: true, trim: true },
    ranAt: { type: Date, required: true, default: Date.now, index: true },
    recipientCount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["success", "skipped", "failed"], required: true, index: true },
    note: { type: String, trim: true, default: "", maxlength: 1000 },
    notification: { type: Schema.Types.ObjectId, ref: "Notification", default: null },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ schedule: 1, ranAt: -1 });

const NotificationScheduleHistory: Model<INotificationScheduleHistory> =
  (mongoose.models.NotificationScheduleHistory as Model<INotificationScheduleHistory>) ||
  mongoose.model<INotificationScheduleHistory>("NotificationScheduleHistory", schema);

export default NotificationScheduleHistory;
