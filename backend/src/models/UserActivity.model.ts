import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type ActivityType =
  | "register"
  | "login"
  | "logout"
  | "wishlist_add"
  | "wishlist_remove"
  | "wishlist_clear"
  | "cart_add"
  | "cart_remove"
  | "cart_update"
  | "cart_clear"
  | "cart_purchase"
  | "wishlist_purchase"
  | "checkout_started"
  | "order_created"
  | "order_paid"
  | "order_cancelled"
  | "order_delivered"
  | "product_view";

export interface IUserActivity extends Document {
  user: Types.ObjectId;
  type: ActivityType;
  product?: Types.ObjectId | null;
  order?: Types.ObjectId | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const userActivitySchema = new Schema<IUserActivity>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "register",
        "login",
        "logout",
        "wishlist_add",
        "wishlist_remove",
        "wishlist_clear",
        "cart_add",
        "cart_remove",
        "cart_update",
        "cart_clear",
        "cart_purchase",
        "wishlist_purchase",
        "checkout_started",
        "order_created",
        "order_paid",
        "order_cancelled",
        "order_delivered",
        "product_view",
      ],
      index: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      default: null,
      index: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      default: null,
      index: true,
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

userActivitySchema.index({ user: 1, createdAt: -1 });
userActivitySchema.index({ user: 1, type: 1, createdAt: -1 });

const UserActivity: Model<IUserActivity> =
  (mongoose.models.UserActivity as Model<IUserActivity>) ||
  mongoose.model<IUserActivity>("UserActivity", userActivitySchema);

export default UserActivity;
