import mongoose, {
  Schema,
  Document,
  Model,
} from "mongoose";

export type OtpPurpose =
  | "register"
  | "login"
  | "email_change";

export interface IOtp extends Document {
  email: string;
  otpHash: string;
  purpose: OtpPurpose;
  userId?: mongoose.Types.ObjectId | null;
  attempts: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const otpSchema = new Schema<IOtp>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    otpHash: {
      type: String,
      required: true,
    },

    purpose: {
      type: String,
      enum: ["register", "login", "email_change"],
      required: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    attempts: {
      type: Number,
      default: 0,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

/* OTP automatically remove after expiry */
otpSchema.index(
  {
    expiresAt: 1,
  },
  {
    expireAfterSeconds: 0,
  }
);

/* One OTP per email + purpose */
otpSchema.index(
  {
    email: 1,
    purpose: 1,
  },
  {
    unique: true,
  }
);

const Otp: Model<IOtp> =
  mongoose.models.Otp ||
  mongoose.model<IOtp>(
    "Otp",
    otpSchema
  );

export default Otp;