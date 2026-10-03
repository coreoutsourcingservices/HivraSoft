import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export type AdminAuditAction =
  | "CREATE"
  | "UPDATE"
  | "SOFT_DELETE"
  | "RESTORE"
  | "PERMANENT_DELETE";

export interface IAdminAuditLog extends Document {
  action: AdminAuditAction;
  module: string;
  recordId: string;
  recordName: string;
  performedBy: Types.ObjectId | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const adminAuditLogSchema = new Schema<IAdminAuditLog>(
  {
    action: {
      type: String,
      enum: ["CREATE", "UPDATE", "SOFT_DELETE", "RESTORE", "PERMANENT_DELETE"],
      required: true,
      index: true,
    },
    module: { type: String, required: true, trim: true, index: true },
    recordId: { type: String, required: true, trim: true, index: true },
    recordName: { type: String, default: "", trim: true },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, versionKey: false }
);

adminAuditLogSchema.index({ module: 1, recordId: 1, createdAt: -1 });
adminAuditLogSchema.index({ performedBy: 1, createdAt: -1 });

const AdminAuditLog: Model<IAdminAuditLog> =
  (mongoose.models.AdminAuditLog as Model<IAdminAuditLog>) ||
  mongoose.model<IAdminAuditLog>("AdminAuditLog", adminAuditLogSchema);

export default AdminAuditLog;
