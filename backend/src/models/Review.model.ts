import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IReviewMedia { type: "image" | "video"; url: string; publicId: string; }
export interface IReviewMessage { sender: "user" | "admin"; message: string; questionNumber?: number; replyTo?: Types.ObjectId | null; createdAt: Date; }
export interface IReview extends Document {
  userId: Types.ObjectId; productId: Types.ObjectId; orderId: Types.ObjectId;
  rating: number; title: string; comment: string; media: IReviewMedia[];
  isVerified: boolean; conversation: IReviewMessage[]; userQuestionCount: number;
  createdAt: Date; updatedAt: Date;
}

const mediaSchema = new Schema<IReviewMedia>({
  type: { type: String, enum: ["image", "video"], required: true },
  url: { type: String, required: true, trim: true },
  publicId: { type: String, required: true, trim: true },
}, { _id: false });

const messageSchema = new Schema<IReviewMessage>({
  sender: { type: String, enum: ["user", "admin"], required: true },
  message: { type: String, required: true, trim: true, maxlength: 1500 },
  questionNumber: { type: Number, min: 1, max: 5 },
  replyTo: { type: Schema.Types.ObjectId, default: null },
  createdAt: { type: Date, default: Date.now },
});

const reviewSchema = new Schema<IReview>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
  orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, trim: true, maxlength: 160, default: "" },
  comment: { type: String, required: true, trim: true, maxlength: 4000 },
  media: { type: [mediaSchema], default: [] },
  isVerified: { type: Boolean, default: false, index: true },
  conversation: { type: [messageSchema], default: [] },
  userQuestionCount: { type: Number, default: 0, min: 0, max: 5 },
}, { timestamps: true, versionKey: false });

reviewSchema.index({ userId: 1, productId: 1, orderId: 1 }, { unique: true });
reviewSchema.index({ productId: 1, createdAt: -1 });

const Review: Model<IReview> = (mongoose.models.Review as Model<IReview>) || mongoose.model<IReview>("Review", reviewSchema);
export default Review;
