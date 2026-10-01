import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IBlogCategory extends Document {
  name: string;
  slug: string;
  description: string;
  image: { url: string; publicId: string };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const imageSchema = new Schema(
  {
    url: { type: String, default: "", trim: true },
    publicId: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const blogCategorySchema = new Schema<IBlogCategory>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    description: { type: String, default: "", trim: true, maxlength: 1000 },
    image: { type: imageSchema, default: () => ({ url: "", publicId: "" }) },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, versionKey: false }
);

const BlogCategory: Model<IBlogCategory> =
  (mongoose.models.BlogCategory as Model<IBlogCategory>) ||
  mongoose.model<IBlogCategory>("BlogCategory", blogCategorySchema);

export default BlogCategory;
