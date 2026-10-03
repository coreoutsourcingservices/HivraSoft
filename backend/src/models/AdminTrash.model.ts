import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export type TrashEntityType =
  | "product"
  | "category"
  | "banner"
  | "blog"
  | "blog_category"
  | "blog_tag"
  | "notification"
  | "automatic_discount"
  | "discount_code"
  | "tax"
  | "delivery_charge"
  | "offer"
  | "on_trend_pick"
  | "always_in_it"
  | "prime_selection";

export interface IAdminTrash extends Document {
  entityType: TrashEntityType;
  entityId: Types.ObjectId;
  modelName: string;
  recordName: string;
  snapshot: Record<string, unknown>;
  deletedAt: Date;
  expiresAt: Date;
  deletedBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const adminTrashSchema = new Schema<IAdminTrash>(
  {
    entityType: {
      type: String,
      required: true,
      enum: [
        "product",
        "category",
        "banner",
        "blog",
        "blog_category",
        "blog_tag",
        "notification",
        "automatic_discount",
        "discount_code",
        "tax",
        "delivery_charge",
        "offer",
        "on_trend_pick",
        "always_in_it",
        "prime_selection",
      ],
      index: true,
    },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    modelName: { type: String, required: true, trim: true },
    recordName: { type: String, required: true, trim: true, index: true },
    snapshot: { type: Schema.Types.Mixed, required: true, default: {} },
    deletedAt: { type: Date, required: true, default: Date.now, index: true },
    expiresAt: { type: Date, required: true, index: true },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User", default: null, index: true },
  },
  { timestamps: true, versionKey: false }
);

adminTrashSchema.index({ entityType: 1, entityId: 1 }, { unique: true });
adminTrashSchema.index({ expiresAt: 1, entityType: 1 });
adminTrashSchema.index({ recordName: 1, deletedAt: -1 });

const AdminTrash: Model<IAdminTrash> =
  (mongoose.models.AdminTrash as Model<IAdminTrash>) ||
  mongoose.model<IAdminTrash>("AdminTrash", adminTrashSchema);

export default AdminTrash;
