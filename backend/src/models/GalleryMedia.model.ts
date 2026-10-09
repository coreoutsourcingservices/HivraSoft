import mongoose, { Schema, type Model } from "mongoose";

const galleryMediaSchema = new Schema({
  publicId: { type: String, required: true, unique: true, index: true },
  title: { type: String, default: "Gallery image" },
  image: {
    publicId: { type: String, required: true },
    url: { type: String, required: true },
  },
  isDeleted: { type: Boolean, default: false, index: true },
  deletedAt: { type: Date, default: null },
  deletedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true, strict: true });

const GalleryMedia: Model<any> = (mongoose.models.GalleryMedia as Model<any>) || mongoose.model("GalleryMedia", galleryMediaSchema);
export default GalleryMedia;
