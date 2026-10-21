import { Types } from "mongoose";
import Product from "../models/Product.model";
import Category from "../models/Category.model";
import { calculateSeoScore } from "../utils/productSeoAnalyzer";
import { formatProductResponse } from "./product.service";

const PAGE_SIZE = 10;
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export function parseAdminProductPage(value: unknown): number {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

export async function getAdminProductsPage(query: Record<string, unknown>) {
  const filter: any = { isDeleted: { $ne: true } };
  const search = text(query.search);
  if (query.status === "active") filter.isActive = true;
  if (query.status === "inactive") filter.isActive = { $ne: true };
  if (query.productType === "color") filter.isColor = true;
  if (query.productType === "no-color") filter.isColor = { $ne: true };
  const category = text(query.category);
  if (category && category !== "all") {
    filter.categories = Types.ObjectId.isValid(category) ? new Types.ObjectId(category) : { $in: [] };
  }
  if (search) {
    const regex = new RegExp(escapeRegex(search), "i");
    const matchingCategories = await Category.find({ $or: [{ name: regex }, { slug: regex }] }).select("_id").lean();
    filter.$or = [
      { "colors.nameProduct": regex }, { "colors.slugProduct": regex },
      { "colors.nameColor": regex }, { categories: { $in: matchingCategories.map(item => item._id) } },
      { $expr: { $regexMatch: { input: { $toString: "$_id" }, regex: escapeRegex(search), options: "i" } } },
    ];
  }
  const stock = { $sum: { $map: { input: { $ifNull: ["$colors", []] }, as: "color", in: {
    $sum: { $map: { input: { $ifNull: ["$$color.sizes", []] }, as: "size", in: {
      $cond: [{ $ne: ["$$size.isActive", false] }, { $max: [0, { $ifNull: ["$$size.stock", 0] }] }, 0],
    } } },
  } } } };
  if (query.stockStatus === "in") filter.$expr = { $gte: [stock, 10] };
  if (query.stockStatus === "low") filter.$expr = { $and: [{ $gt: [stock, 0] }, { $lt: [stock, 10] }] };
  if (query.stockStatus === "out") filter.$expr = { $lte: [stock, 0] };

  // SEO scores are calculated from content, so resolve matching IDs before paging.
  if (["good", "warning", "poor"].includes(text(query.seoStatus))) {
    const candidates = await Product.find(filter).select("colors").lean();
    filter._id = { $in: candidates.filter(product => {
      const colors = product.colors || [];
      const score = calculateSeoScore(colors.find(color => color.isDefault) || colors[0]);
      return query.seoStatus === "good" ? score >= 80 : query.seoStatus === "warning" ? score >= 60 && score < 80 : score < 60;
    }).map(product => product._id) };
  }
  const [total, totalProducts, categoryIds] = await Promise.all([
    Product.countDocuments(filter), Product.countDocuments(),
    Product.distinct("categories", { isDeleted: { $ne: true } }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(parseAdminProductPage(query.page), totalPages);
  const [products, categories] = await Promise.all([
    Product.find(filter).populate("categories", "_id name slug level")
      .sort({ createdAt: -1, _id: -1 }).skip((page - 1) * PAGE_SIZE).limit(PAGE_SIZE),
    Category.find({ _id: { $in: categoryIds } }).select("_id name").sort({ name: 1 }).lean(),
  ]);
  return {
    products: products.map(product => formatProductResponse(product, false)),
    pagination: { page, pageSize: PAGE_SIZE, total, totalPages, totalProducts },
    categories: categories.map(item => ({ id: String(item._id), name: item.name })),
  };
}
