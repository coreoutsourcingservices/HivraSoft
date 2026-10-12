import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export type AdminAuditAction =
  | "DELETE" | "BLOCK" | "UNBLOCK" | "EXPORT"
  | "CREATE"
  | "UPDATE"
  | "SOFT_DELETE"
  | "RESTORE"
  | "PERMANENT_DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "APPROVE"
  | "REJECT"
  | "SET_STATUS";

export interface IAdminAuditLog extends Document {
  action: AdminAuditAction;
  module: string;
  recordId: string;
  recordName: string;
  performedBy: Types.ObjectId | null;
  metadata: Record<string, unknown>;
  actor?: { name?: string; username?: string; email?: string; role?: string };
  status?: string;
  ip?: string;
  createdAt: Date;
  updatedAt: Date;
}

const adminAuditLogSchema = new Schema<IAdminAuditLog>(
  {
    action: {
      type: String,
      enum: ["CREATE", "UPDATE", "SOFT_DELETE", "RESTORE", "PERMANENT_DELETE", "LOGIN", "LOGOUT", "APPROVE", "REJECT", "SET_STATUS", "DELETE", "BLOCK", "UNBLOCK", "EXPORT"],
      required: true,
      index: true,
    },
    module: { type: String, required: true, trim: true, index: true },
    recordId: { type: String, required: true, trim: true, index: true },
    recordName: { type: String, default: "", trim: true },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    actor: { name: String, username: String, email: String, role: String },
    status: { type: String, enum: ["success", "failure"] },
    ip: String,
  },
  { timestamps: true, versionKey: false }
);

adminAuditLogSchema.index({ module: 1, recordId: 1, createdAt: -1 });
adminAuditLogSchema.index({ performedBy: 1, createdAt: -1 });

const AdminAuditLog: Model<IAdminAuditLog> =
  (mongoose.models.AdminAuditLog as Model<IAdminAuditLog>) ||
  mongoose.model<IAdminAuditLog>("AdminAuditLog", adminAuditLogSchema);

export default AdminAuditLog;
