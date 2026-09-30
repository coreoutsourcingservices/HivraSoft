import type { Request, Response } from "express";
import { Types } from "mongoose";
import Blog from "../models/Blog.model";
import BlogCategory from "../models/BlogCategory.model";
import BlogTag from "../models/BlogTag.model";
import {
  createBlog,
  duplicateBlog,
  listPublicBlogs,
  publicBlogMatch,
  updateBlog,
} from "../services/blog.service";
import { createSlug } from "../utils/slug";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function currentAdminId(req: Request) {
  const id = String(req.user?._id || "");
  if (!Types.ObjectId.isValid(id)) throw new Error("Admin authentication is required.");
  return id;
}

function duplicateMessage(error: unknown) {
  const anyError = error as any;
  if (anyError?.code === 11000) return "A record with this slug already exists.";
  return error instanceof Error ? error.message : "Request failed.";
}

export async function listAdminBlogs(req: Request, res: Response) {
  try {
    const page = Math.max(1, Number(req.query.page || 1) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 20) || 20));
    const match: any = {};
    const search = text(req.query.search);
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      match.$or = [{ title: rx }, { slug: rx }, { excerpt: rx }];
    }
    const status = text(req.query.status).toUpperCase();
    if (["DRAFT", "PUBLISHED", "SCHEDULED", "PRIVATE"].includes(status)) match.status = status;
    const category = text(req.query.category);
    if (Types.ObjectId.isValid(category)) match.category = new Types.ObjectId(category);
    const author = text(req.query.author);
    if (Types.ObjectId.isValid(author)) match.author = new Types.ObjectId(author);
    if (text(req.query.dateFrom) || text(req.query.dateTo)) {
      match.createdAt = {};
      if (text(req.query.dateFrom)) match.createdAt.$gte = new Date(String(req.query.dateFrom));
      if (text(req.query.dateTo)) {
        const d = new Date(String(req.query.dateTo));
        d.setHours(23, 59, 59, 999);
        match.createdAt.$lte = d;
      }
    }

    const [total, blogs] = await Promise.all([
      Blog.countDocuments(match),
      Blog.find(match)
        .populate("category", "name slug")
        .populate("tags", "name slug")
        .populate("author", "name email avatar")
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);
    return res.json({ success: true, blogs, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } });
  } catch (error) {
    return res.status(500).json({ success: false, message: duplicateMessage(error) });
  }
}

export async function getAdminBlog(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "");
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid blog ID." });
    const blog = await Blog.findById(id).populate("category", "name slug").populate("tags", "name slug").populate("author", "name email avatar").lean();
    if (!blog) return res.status(404).json({ success: false, message: "Blog not found." });
    return res.json({ success: true, blog });
  } catch (error) {
    return res.status(500).json({ success: false, message: duplicateMessage(error) });
  }
}

export async function createAdminBlog(req: Request, res: Response) {
  try {
    const blog = await createBlog(req.body || {}, currentAdminId(req));
    return res.status(201).json({ success: true, message: "Blog created.", blog });
  } catch (error) {
    return res.status(/already exists/i.test(duplicateMessage(error)) ? 409 : 400).json({ success: false, message: duplicateMessage(error) });
  }
}

export async function updateAdminBlog(req: Request, res: Response) {
  try {
    const blog = await updateBlog(String(req.params.id || ""), req.body || {}, currentAdminId(req));
    return res.json({ success: true, message: "Blog updated.", blog });
  } catch (error) {
    return res.status(/not found/i.test(duplicateMessage(error)) ? 404 : /already exists/i.test(duplicateMessage(error)) ? 409 : 400).json({ success: false, message: duplicateMessage(error) });
  }
}

export async function deleteAdminBlog(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "");
    if (!Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid blog ID." });
    const deleted = await Blog.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: "Blog not found." });
    return res.json({ success: true, message: "Blog deleted." });
  } catch (error) {
    return res.status(500).json({ success: false, message: duplicateMessage(error) });
  }
}

export async function publishAdminBlog(req: Request, res: Response) {
  req.body = { ...(req.body || {}), status: "PUBLISHED" };
  return updateAdminBlog(req, res);
}

export async function duplicateAdminBlog(req: Request, res: Response) {
  try {
    const blog = await duplicateBlog(String(req.params.id || ""), currentAdminId(req));
    return res.status(201).json({ success: true, message: "Blog duplicated as draft.", blog });
  } catch (error) {
    return res.status(400).json({ success: false, message: duplicateMessage(error) });
  }
}

export async function listAdminBlogCategories(_req: Request, res: Response) {
  const categories = await BlogCategory.find({}).sort({ name: 1 }).lean();
  return res.json({ success: true, categories });
}

export async function createAdminBlogCategory(req: Request, res: Response) {
  try {
    const name = text(req.body?.name);
    if (!name) throw new Error("Category name is required.");
    const slug = createSlug(text(req.body?.slug) || name);
    const category = await BlogCategory.create({
      name,
      slug,
      description: text(req.body?.description),
      image: req.body?.image || {},
      isActive: req.body?.isActive !== false,
    });
    return res.status(201).json({ success: true, category });
  } catch (error) {
    return res.status((error as any)?.code === 11000 ? 409 : 400).json({ success: false, message: duplicateMessage(error) });
  }
}

export async function updateAdminBlogCategory(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "");
    if (!Types.ObjectId.isValid(id)) throw new Error("Invalid category ID.");
    const category = await BlogCategory.findById(id);
    if (!category) return res.status(404).json({ success: false, message: "Category not found." });
    const name = text(req.body?.name || category.name);
    category.name = name;
    category.slug = createSlug(text(req.body?.slug || category.slug) || name);
    category.description = text(req.body?.description ?? category.description);
    if (req.body?.image) category.image = req.body.image;
    if (req.body?.isActive !== undefined) category.isActive = req.body.isActive !== false;
    await category.save();
    return res.json({ success: true, category });
  } catch (error) {
    return res.status((error as any)?.code === 11000 ? 409 : 400).json({ success: false, message: duplicateMessage(error) });
  }
}

export async function deleteAdminBlogCategory(req: Request, res: Response) {
  const id = String(req.params.id || "");
  if (!Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid category ID." });
  const used = await Blog.exists({ category: id });
  if (used) return res.status(409).json({ success: false, message: "Category is used by a blog and cannot be deleted." });
  const deleted = await BlogCategory.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ success: false, message: "Category not found." });
  return res.json({ success: true, message: "Category deleted." });
}

export async function listAdminBlogTags(_req: Request, res: Response) {
  const tags = await BlogTag.find({}).sort({ name: 1 }).lean();
  return res.json({ success: true, tags });
}

export async function createAdminBlogTag(req: Request, res: Response) {
  try {
    const name = text(req.body?.name);
    if (!name) throw new Error("Tag name is required.");
    const tag = await BlogTag.create({ name, slug: createSlug(text(req.body?.slug) || name) });
    return res.status(201).json({ success: true, tag });
  } catch (error) {
    return res.status((error as any)?.code === 11000 ? 409 : 400).json({ success: false, message: duplicateMessage(error) });
  }
}

export async function updateAdminBlogTag(req: Request, res: Response) {
  try {
    const id = String(req.params.id || "");
    if (!Types.ObjectId.isValid(id)) throw new Error("Invalid tag ID.");
    const tag = await BlogTag.findById(id);
    if (!tag) return res.status(404).json({ success: false, message: "Tag not found." });
    const name = text(req.body?.name || tag.name);
    tag.name = name;
    tag.slug = createSlug(text(req.body?.slug || tag.slug) || name);
    await tag.save();
    return res.json({ success: true, tag });
  } catch (error) {
    return res.status((error as any)?.code === 11000 ? 409 : 400).json({ success: false, message: duplicateMessage(error) });
  }
}

export async function deleteAdminBlogTag(req: Request, res: Response) {
  const id = String(req.params.id || "");
  if (!Types.ObjectId.isValid(id)) return res.status(400).json({ success: false, message: "Invalid tag ID." });
  await Blog.updateMany({ tags: id }, { $pull: { tags: new Types.ObjectId(id) } });
  const deleted = await BlogTag.findByIdAndDelete(id);
  if (!deleted) return res.status(404).json({ success: false, message: "Tag not found." });
  return res.json({ success: true, message: "Tag deleted." });
}

export async function listPublicBlogController(req: Request, res: Response) {
  try {
    const result = await listPublicBlogs(req.query);
    return res.json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ success: false, message: duplicateMessage(error) });
  }
}

export async function listFeaturedBlogs(req: Request, res: Response) {
  try {
    const result = await listPublicBlogs({ ...req.query, isFeatured: true });
    return res.json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ success: false, message: duplicateMessage(error) });
  }
}

export async function listLatestBlogs(req: Request, res: Response) {
  try {
    const result = await listPublicBlogs({ ...req.query, sort: "latest" });
    return res.json({ success: true, ...result });
  } catch (error) {
    return res.status(500).json({ success: false, message: duplicateMessage(error) });
  }
}

export async function listBlogsByCategory(req: Request, res: Response) {
  const result = await listPublicBlogs({ ...req.query, categorySlug: req.params.slug });
  return res.json({ success: true, ...result });
}

export async function listBlogsByTag(req: Request, res: Response) {
  const result = await listPublicBlogs({ ...req.query, tagSlug: req.params.slug });
  return res.json({ success: true, ...result });
}

const viewCache = new Map<string, number>();

export async function getPublicBlogBySlug(req: Request, res: Response) {
  try {
    const slug = text(req.params.slug).toLowerCase();
    const blog = await Blog.findOne({ slug, ...publicBlogMatch() })
      .populate("category", "name slug")
      .populate("tags", "name slug")
      .populate("author", "name avatar")
      .lean();
    if (!blog) return res.status(404).json({ success: false, message: "Blog not found." });

    const clientKey = `${String(blog._id)}:${String(req.ip || req.headers["x-forwarded-for"] || "unknown")}`;
    const now = Date.now();
    const last = viewCache.get(clientKey) || 0;
    if (now - last > 30 * 60 * 1000) {
      viewCache.set(clientKey, now);
      await Blog.updateOne({ _id: blog._id }, { $inc: { views: 1 } }).catch(() => undefined);
      (blog as any).views = Number((blog as any).views || 0) + 1;
    }
    if (viewCache.size > 5000) {
      for (const [key, timestamp] of viewCache) if (now - timestamp > 30 * 60 * 1000) viewCache.delete(key);
    }

    const tagIds = Array.isArray((blog as any).tags) ? (blog as any).tags.map((tag: any) => tag?._id).filter(Boolean) : [];
    const categoryId = (blog as any).category?._id;
    const relatedQuery: any = { _id: { $ne: blog._id }, ...publicBlogMatch() };
    relatedQuery.$and = [{ $or: [
      ...(categoryId ? [{ category: categoryId }] : []),
      ...(tagIds.length ? [{ tags: { $in: tagIds } }] : []),
    ] }];
    const related = (categoryId || tagIds.length)
      ? await Blog.find(relatedQuery).select("title slug excerpt featuredImage publishedAt readingTime category likes").populate("category", "name slug").sort({ publishedAt: -1 }).limit(4).lean()
      : [];

    const { likes = [], ...publicBlog } = blog as any;
    const publicRelated = related.map((item: any) => {
      const { likes: relatedLikes = [], ...rest } = item;
      return { ...rest, likeCount: Array.isArray(relatedLikes) ? relatedLikes.length : 0 };
    });

    return res.json({
      success: true,
      blog: { ...publicBlog, likeCount: Array.isArray(likes) ? likes.length : 0 },
      related: publicRelated,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: duplicateMessage(error) });
  }
}


export async function likePublicBlog(req: Request, res: Response) {
  try {
    const userId = String(req.user?._id || "");
    if (!Types.ObjectId.isValid(userId) || req.user?.role !== "customer") {
      return res.status(403).json({ success: false, message: "Customer login is required to like a blog." });
    }

    const slug = text(req.params.slug).toLowerCase();
    const blog = await Blog.findOneAndUpdate(
      { slug, ...publicBlogMatch() },
      { $addToSet: { likes: new Types.ObjectId(userId) } },
      { new: true }
    ).select("likes").lean();

    if (!blog) return res.status(404).json({ success: false, message: "Blog not found." });
    return res.json({
      success: true,
      liked: true,
      likeCount: Array.isArray((blog as any).likes) ? (blog as any).likes.length : 0,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: duplicateMessage(error) });
  }
}

export async function listPublicBlogCategories(_req: Request, res: Response) {
  const categories = await BlogCategory.find({ isActive: true }).sort({ name: 1 }).lean();
  return res.json({ success: true, categories });
}

export async function listPublicBlogTags(_req: Request, res: Response) {
  const tags = await BlogTag.find({}).sort({ name: 1 }).lean();
  return res.json({ success: true, tags });
}
