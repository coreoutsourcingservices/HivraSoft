import mongoose, {
  Schema,
  Document,
  Model,
  Types,
} from "mongoose";

export type UserRole =
  | "customer"
  | "admin"
  | "super_admin";

export interface IAccount extends Document {
  user: Types.ObjectId;

  role: UserRole;

  emailVerified: boolean;
  phoneVerified: boolean;

  isActive: boolean;
  isBlocked: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const accountSchema = new Schema<IAccount>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    role: {
      type: String,
      enum: [
        "customer",
        "admin",
        "super_admin",
      ],
      default: "customer",
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    phoneVerified: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Account: Model<IAccount> =
  mongoose.models.Account ||
  mongoose.model<IAccount>(
    "Account",
    accountSchema
  );

export default Account;