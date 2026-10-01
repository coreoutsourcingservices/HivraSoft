import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IBlogTag extends Document {
  name: string;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}

const blogTagSchema = new Schema<IBlogTag>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
  },
  { timestamps: true, versionKey: false }
);

const BlogTag: Model<IBlogTag> =
  (mongoose.models.BlogTag as Model<IBlogTag>) || mongoose.model<IBlogTag>("BlogTag", blogTagSchema);

export default BlogTag;
