import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export type BlogStatus = "DRAFT" | "PUBLISHED" | "SCHEDULED" | "PRIVATE";

export interface IBlog extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  blocks: Array<Record<string, unknown>>;
  featuredImage: {
    url: string;
    publicId: string;
    alt: string;
    title: string;
    caption: string;
    width: number;
    height: number;
  };
  category?: Types.ObjectId | null;
  tags: Types.ObjectId[];
  author: Types.ObjectId;
  seo: Record<string, any>;
  status: BlogStatus;
  publishedAt?: Date | null;
  scheduledAt?: Date | null;
  readingTime: number;
  views: number;
  isFeatured: boolean;
  customCss: string;
  revisions: Array<Record<string, unknown>>;
  createdAt: Date;
  updatedAt: Date;
}

const featuredImageSchema = new Schema(
  {
    url: { type: String, default: "", trim: true },
    publicId: { type: String, default: "", trim: true },
    alt: { type: String, default: "", trim: true },
    title: { type: String, default: "", trim: true },
    caption: { type: String, default: "", trim: true },
    width: { type: Number, default: 0, min: 0 },
    height: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const seoSchema = new Schema(
  {
    metaTitle: { type: String, default: "", trim: true, maxlength: 180 },
    metaDescription: { type: String, default: "", trim: true, maxlength: 500 },
    keywords: { type: [String], default: [] },
    canonicalUrl: { type: String, default: "", trim: true },
    focusKeyword: { type: String, default: "", trim: true },
    secondaryKeywords: { type: [String], default: [] },
    robots: {
      index: { type: Boolean, default: true },
      follow: { type: Boolean, default: true },
    },
    openGraph: {
      title: { type: String, default: "", trim: true },
      description: { type: String, default: "", trim: true },
      image: { type: String, default: "", trim: true },
    },
    twitter: {
      title: { type: String, default: "", trim: true },
      description: { type: String, default: "", trim: true },
      image: { type: String, default: "", trim: true },
    },
  },
  { _id: false }
);

const revisionSchema = new Schema(
  {
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    title: { type: String, default: "" },
    slug: { type: String, default: "" },
    excerpt: { type: String, default: "" },
    content: { type: String, default: "" },
    blocks: { type: [Schema.Types.Mixed], default: [] },
    seo: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: true }
);

const blogSchema = new Schema<IBlog>(
  {
    title: { type: String, required: true, trim: true, maxlength: 220 },
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    excerpt: { type: String, default: "", trim: true, maxlength: 1200 },
    content: { type: String, default: "" },
    blocks: { type: [Schema.Types.Mixed], default: [] },
    featuredImage: { type: featuredImageSchema, default: () => ({}) },
    category: { type: Schema.Types.ObjectId, ref: "BlogCategory", default: null, index: true },
    tags: { type: [{ type: Schema.Types.ObjectId, ref: "BlogTag" }], default: [] },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    seo: { type: seoSchema, default: () => ({}) },
    status: { type: String, enum: ["DRAFT", "PUBLISHED", "SCHEDULED", "PRIVATE"], default: "DRAFT", index: true },
    publishedAt: { type: Date, default: null, index: true },
    scheduledAt: { type: Date, default: null, index: true },
    readingTime: { type: Number, default: 1, min: 1 },
    views: { type: Number, default: 0, min: 0 },
    isFeatured: { type: Boolean, default: false, index: true },
    customCss: { type: String, default: "", maxlength: 20000 },
    revisions: { type: [revisionSchema], default: [] },
  },
  { timestamps: true, versionKey: false }
);

blogSchema.index({ status: 1, publishedAt: -1 });
blogSchema.index({ category: 1, status: 1, publishedAt: -1 });
blogSchema.index({ tags: 1, status: 1, publishedAt: -1 });
blogSchema.index({ isFeatured: 1, status: 1, publishedAt: -1 });

const Blog: Model<IBlog> = (mongoose.models.Blog as Model<IBlog>) || mongoose.model<IBlog>("Blog", blogSchema);

export default Blog;
