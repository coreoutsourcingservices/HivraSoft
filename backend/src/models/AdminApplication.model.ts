import mongoose, { Schema, type Document, type Model } from "mongoose";
export type ApplicationStatus = "otp_pending" | "pending_approval" | "processing" | "approved" | "rejected" | "email_failed";
export interface IAdminApplication extends Document {
  name: string; email: string; phone: string; otpHash?: string; otpExpiresAt?: Date;
  otpAttempts: number; otpSentAt?: Date; emailVerified: boolean;
  status: ApplicationStatus; userId?: mongoose.Types.ObjectId; approvedAt?: Date;
  createdAt: Date; updatedAt: Date;
}
const schema = new Schema<IAdminApplication>({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, lowercase: true, trim: true, unique: true },
  phone: { type: String, required: true, trim: true, maxlength: 20 },
  otpHash: { type: String, select: false },
  otpExpiresAt: Date,
  otpAttempts: { type: Number, default: 0 }, otpSentAt: Date,
  emailVerified: { type: Boolean, default: false },
  status: { type: String, enum: ["otp_pending", "pending_approval", "processing", "approved", "rejected", "email_failed"], default: "otp_pending", index: true },
  userId: { type: Schema.Types.ObjectId, ref: "User" }, approvedAt: Date,
}, { timestamps: true });
schema.index({ status: 1, createdAt: -1 });
export default (mongoose.models.AdminApplication as Model<IAdminApplication>) || mongoose.model<IAdminApplication>("AdminApplication", schema);
