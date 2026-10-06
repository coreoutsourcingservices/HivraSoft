import mongoose, { Schema, Document, Model } from "mongoose";

export type BraCondition =
  | "old_faded"
  | "stretched"
  | "broken_hooks_or_straps"
  | "minor_tears"
  | "good_no_longer_needed"
  | "mixed_condition";

export type BraHandoverPreference =
  | "courier"
  | "pickup_information"
  | "team_guide";

export interface ISendYourBraSubmission extends Document {
  fullName: string;
  whatsappNumber: string;
  city: string;
  pinCode: string;
  numberOfBras: number;
  condition: BraCondition;
  anythingElse: string;
  handoverPreference: BraHandoverPreference;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<ISendYourBraSubmission>(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    whatsappNumber: { type: String, required: true, trim: true, maxlength: 20 },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    pinCode: { type: String, required: true, trim: true, maxlength: 10 },
    numberOfBras: { type: Number, required: true, min: 1, max: 5 },
    condition: {
      type: String,
      required: true,
      enum: [
        "old_faded",
        "stretched",
        "broken_hooks_or_straps",
        "minor_tears",
        "good_no_longer_needed",
        "mixed_condition",
      ],
      index: true,
    },
    anythingElse: { type: String, trim: true, default: "", maxlength: 1000 },
    handoverPreference: {
      type: String,
      required: true,
      enum: ["courier", "pickup_information", "team_guide"],
      index: true,
    },
  },
  { timestamps: true, versionKey: false }
);

schema.index({ createdAt: -1 });
schema.index({ whatsappNumber: 1, createdAt: -1 });

const SendYourBraSubmission: Model<ISendYourBraSubmission> =
  (mongoose.models.SendYourBraSubmission as Model<ISendYourBraSubmission>) ||
  mongoose.model<ISendYourBraSubmission>("SendYourBraSubmission", schema);

export default SendYourBraSubmission;
