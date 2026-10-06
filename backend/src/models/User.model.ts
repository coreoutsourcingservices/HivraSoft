import mongoose, {
  Schema,
  Document,
  Model,
} from "mongoose";

export type UserRole =
  | "customer"
  | "admin"
  | "super_admin";

export interface IUser extends Document {
  name: string;
  username?: string;
  passwordHash?: string;
  email: string;
  phone: string;
  gender: "male" | "female" | "other";
  birthday?: Date | null;
  anniversary?: Date | null;

  role: UserRole;

  emailVerified: boolean;
  isActive: boolean;
  accountStatus: "active" | "inactive" | "blocked";
  lastActiveAt?: Date | null;

  avatar?: {
    url: string;
    publicId: string;
  };

  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, unique: true, sparse: true, trim: true },
    passwordHash: { type: String, select: false },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
      default: "other",
      index: true,
    },

    birthday: {
      type: Date,
      default: null,
      index: true,
    },

    anniversary: {
      type: Date,
      default: null,
      index: true,
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

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    accountStatus: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
      index: true,
    },

    lastActiveAt: {
      type: Date,
      default: null,
      index: true,
    },

    avatar: {
      url: {
        type: String,
        default: "",
      },

      publicId: {
        type: String,
        default: "",
      },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ role: 1, createdAt: -1 });
userSchema.index({ role: 1, accountStatus: 1, createdAt: -1 });

const User: Model<IUser> =
  mongoose.models.User ||
  mongoose.model<IUser>(
    "User",
    userSchema
  );

export default User;
