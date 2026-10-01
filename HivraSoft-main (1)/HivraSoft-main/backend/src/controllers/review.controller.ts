import type { Request, Response } from "express";
import mongoose from "mongoose";
import Review from "../models/Review.model";
import Order from "../models/Order.model";
import Product from "../models/Product.model";
import { uploadImageBuffer, uploadVideoBuffer } from "../services/cloudinary.service";

const oid = (value: unknown) => String(value || "").trim();
function validId(id: string) { return mongoose.Types.ObjectId.isValid(id); }
function userId(req: Request) { if (!req.user?._id) throw new Error("Not authenticated."); return String(req.user._id); }

async function refreshProductRating(productId: string) {
  const result = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId), isVerified: true } },
    { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const stats = result[0] || { average: 0, count: 0 };
  await Product.updateOne({ _id: productId }, { $set: { "ratings.average": Math.round(Number(stats.average || 0) * 100) / 100, "ratings.count": Number(stats.count || 0) } });
}

function publicReview(review: any) {
  return {
    _id: review._id, user: review.userId && typeof review.userId === "object" ? { _id: review.userId._id, name: review.userId.name } : undefined,
    productId: review.productId, rating: review.rating, title: review.title, comment: review.comment,
    media: review.media, isVerified: review.isVerified, conversation: review.conversation,
    userQuestionCount: review.userQuestionCount, maxUserQuestions: 5, createdAt: review.createdAt, updatedAt: review.updatedAt,
  };
}

export async function createReview(req: Request, res: Response) {
  try {
    const uid = userId(req), productId = oid(req.body?.productId), orderId = oid(req.body?.orderId);
    const rating = Number(req.body?.rating), title = String(req.body?.title || "").trim(), comment = String(req.body?.comment || "").trim();
    if (!validId(productId) || !validId(orderId)) return res.status(400).json({ success: false, message: "Valid productId and orderId are required." });
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ success: false, message: "Rating must be an integer from 1 to 5." });
    if (!comment) return res.status(400).json({ success: false, message: "Review comment is required." });
    const [product, order] = await Promise.all([Product.findById(productId).select("_id"), Order.findOne({ _id: orderId, user: uid }).lean()]);
    if (!product) return res.status(404).json({ success: false, message: "Product not found." });
    if (!order) return res.status(404).json({ success: false, message: "Order not found for this account." });
    const purchased = Array.isArray((order as any).items) && (order as any).items.some((item: any) => String(item.productId || item.product || "") === productId);
    if (!purchased) return res.status(403).json({ success: false, message: "This product was not purchased in the selected order." });
    const exists = await Review.exists({ userId: uid, productId, orderId });
    if (exists) return res.status(409).json({ success: false, message: "You already reviewed this product from this order." });

    const files = (req.files || {}) as Record<string, Express.Multer.File[]>;
    const images = files.images || [], videos = files.videos || [];
    if (images.length > 5 || videos.length > 3) return res.status(400).json({ success: false, message: "Maximum 5 images and 3 videos are allowed." });
    const media: any[] = [];
    for (const file of images) { const uploaded = await uploadImageBuffer(file.buffer, "hivrasoft/reviews"); media.push({ type: "image", url: uploaded.secure_url, publicId: uploaded.public_id }); }
    for (const file of videos) { const uploaded = await uploadVideoBuffer(file.buffer, "hivrasoft/reviews"); media.push({ type: "video", url: uploaded.secure_url, publicId: uploaded.public_id }); }

    const review = await Review.create({ userId: uid, productId, orderId, rating, title, comment, media, isVerified: true });
    await refreshProductRating(productId);
    return res.status(201).json({ success: true, message: "Review submitted.", review: publicReview(review.toObject()) });
  } catch (error: any) { return res.status(400).json({ success: false, message: error?.message || "Unable to submit review." }); }
}

export async function getProductReviews(req: Request, res: Response) {
  try {
    const productId = oid(req.params.productId); if (!validId(productId)) return res.status(400).json({ success: false, message: "Invalid product ID." });
    const page = Math.max(1, Number(req.query.page || 1)), limit = Math.min(50, Math.max(1, Number(req.query.limit || 10)));
    const query: any = { productId, isVerified: true }; const filterRating = Number(req.query.rating || 0); if (filterRating >= 1 && filterRating <= 5) query.rating = filterRating;
    const [items, total, product] = await Promise.all([
      Review.find(query).populate("userId", "name").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Review.countDocuments(query), Product.findById(productId).select("ratings").lean(),
    ]);
    return res.json({ success: true, total, page, limit, ratings: (product as any)?.ratings || { average: 0, count: 0 }, reviews: items.map(publicReview) });
  } catch (error: any) { return res.status(400).json({ success: false, message: error?.message || "Unable to load reviews." }); }
}

export async function getMyReviews(req: Request, res: Response) {
  try { const items = await Review.find({ userId: userId(req) }).populate("productId", "colors ratings").sort({ createdAt: -1 }).lean(); return res.json({ success: true, count: items.length, reviews: items }); }
  catch (error: any) { return res.status(400).json({ success: false, message: error?.message || "Unable to load reviews." }); }
}

export async function updateMyReview(req: Request, res: Response) {
  try {
    const uid = userId(req), id = oid(req.params.id); const review = await Review.findOne({ _id: id, userId: uid });
    if (!review) return res.status(404).json({ success: false, message: "Review not found." });
    if (req.body?.rating !== undefined) { const rating = Number(req.body.rating); if (!Number.isInteger(rating) || rating < 1 || rating > 5) return res.status(400).json({ success: false, message: "Rating must be 1 to 5." }); review.rating = rating; }
    if (req.body?.title !== undefined) review.title = String(req.body.title || "").trim();
    if (req.body?.comment !== undefined) { const c = String(req.body.comment || "").trim(); if (!c) return res.status(400).json({ success: false, message: "Comment cannot be empty." }); review.comment = c; }
    await review.save(); await refreshProductRating(String(review.productId)); return res.json({ success: true, message: "Review updated.", review });
  } catch (error: any) { return res.status(400).json({ success: false, message: error?.message || "Unable to update review." }); }
}

export async function deleteMyReview(req: Request, res: Response) {
  try { const review = await Review.findOneAndDelete({ _id: oid(req.params.id), userId: userId(req) }); if (!review) return res.status(404).json({ success: false, message: "Review not found." }); await refreshProductRating(String(review.productId)); return res.json({ success: true, message: "Review deleted." }); }
  catch (error: any) { return res.status(400).json({ success: false, message: error?.message || "Unable to delete review." }); }
}

export async function addUserQuestion(req: Request, res: Response) {
  try {
    const review = await Review.findOne({ _id: oid(req.params.id), userId: userId(req) }); if (!review) return res.status(404).json({ success: false, message: "Review not found." });
    if (!review.conversation.some((m: any) => m.sender === "admin")) return res.status(409).json({ success: false, message: "You can ask a follow-up after the admin replies to your review." });
    if (review.userQuestionCount >= 5) return res.status(400).json({ success: false, message: "Maximum 5 follow-up questions allowed for this review." });
    const message = String(req.body?.message || "").trim(); if (!message) return res.status(400).json({ success: false, message: "Question is required." });
    review.userQuestionCount += 1; review.conversation.push({ sender: "user", message, questionNumber: review.userQuestionCount, createdAt: new Date() } as any); await review.save();
    return res.status(201).json({ success: true, message: "Question added.", userQuestionCount: review.userQuestionCount, maxUserQuestions: 5, conversation: review.conversation });
  } catch (error: any) { return res.status(400).json({ success: false, message: error?.message || "Unable to add question." }); }
}

export async function listAdminReviews(req: Request, res: Response) {
  try { const page = Math.max(1, Number(req.query.page || 1)), limit = Math.min(100, Math.max(1, Number(req.query.limit || 20))); const total = await Review.countDocuments(); const reviews = await Review.find().populate("userId", "name email phone").populate("productId", "colors ratings").sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit).lean(); return res.json({ success: true, total, page, limit, reviews }); }
  catch (error: any) { return res.status(500).json({ success: false, message: error?.message || "Unable to load reviews." }); }
}
export async function getAdminReview(req: Request, res: Response) {
  try { const review = await Review.findById(oid(req.params.id)).populate("userId", "name email phone").populate("productId", "colors ratings").populate("orderId", "orderNumber status").lean(); if (!review) return res.status(404).json({ success: false, message: "Review not found." }); return res.json({ success: true, review }); }
  catch (error: any) { return res.status(400).json({ success: false, message: error?.message || "Unable to load review." }); }
}
export async function addAdminReply(req: Request, res: Response) {
  try { const review = await Review.findById(oid(req.params.id)); if (!review) return res.status(404).json({ success: false, message: "Review not found." }); const message = String(req.body?.message || "").trim(); if (!message) return res.status(400).json({ success: false, message: "Reply message is required." }); const replyTo = oid(req.body?.replyTo); review.conversation.push({ sender: "admin", message, replyTo: validId(replyTo) ? new mongoose.Types.ObjectId(replyTo) : null, createdAt: new Date() } as any); await review.save(); return res.status(201).json({ success: true, message: "Admin reply added.", conversation: review.conversation }); }
  catch (error: any) { return res.status(400).json({ success: false, message: error?.message || "Unable to reply." }); }
}

export async function getAdminUserReviews(req: Request, res: Response) {
  try { const uid = oid(req.params.userId); if (!validId(uid)) return res.status(400).json({ success:false, message:"Invalid user ID." }); const reviews = await Review.find({ userId: uid }).populate("productId", "colors ratings").sort({createdAt:-1}).lean(); return res.json({success:true,count:reviews.length,reviews}); }
  catch (error:any) { return res.status(400).json({success:false,message:error?.message||"Unable to load user reviews."}); }
}
