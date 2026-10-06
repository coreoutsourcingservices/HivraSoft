import sanitizeHtml from "sanitize-html";
import { Types } from "mongoose";
import Blog, { type BlogStatus } from "../models/Blog.model";
import Category from "../models/Category.model";
import BlogTag from "../models/BlogTag.model";
import { createSlug } from "../utils/slug";
import { legacyBlogSlugExists, listLegacyBlogs } from "./legacy-blog.service";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function bool(value: unknown, fallback = false) {
  if (value === true || value === "true" || value === 1 || value === "1") return true;
  if (value === false || value === "false" || value === 0 || value === "0") return false;
  return fallback;
}

function safeSlug(value: unknown, fallback: string) {
  return createSlug(text(value) || fallback);
}

function cleanCss(value: unknown) {
  return text(value)
    .replace(/<\/?style[^>]*>/gi, "")
    .replace(/@import\s+[^;]+;?/gi, "")
    .replace(/expression\s*\(/gi, "")
    .replace(/javascript\s*:/gi, "")
    .slice(0, 20000);
}

const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    "h1", "h2", "h3", "h4", "h5", "h6", "p", "strong", "b", "em", "i", "u", "s", "del", "span", "br", "hr",
    "a", "img", "picture", "source", "figure", "figcaption", "ul", "ol", "li", "blockquote", "pre", "code", "table", "thead",
    "tbody", "tfoot", "tr", "th", "td", "section", "article", "div", "details", "summary", "sup", "sub", "iframe", "button"
  ],
  allowedAttributes: {
    "*": ["class", "id", "style", "title"],
    a: ["href", "target", "rel", "class", "id", "style", "title"],
    img: ["src", "alt", "title", "width", "height", "loading", "class", "id", "style", "data-align", "data-width"],
    source: ["srcset", "type", "media"],
    iframe: ["src", "width", "height", "title", "allow", "allowfullscreen", "loading", "referrerpolicy", "class", "id", "style"],
    td: ["colspan", "rowspan", "class", "id", "style"],
    th: ["colspan", "rowspan", "scope", "class", "id", "style"],
    button: ["type", "class", "id", "style"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedIframeHostnames: ["www.youtube.com", "youtube.com", "www.youtube-nocookie.com", "player.vimeo.com"],
  allowedStyles: {
    "*": {
      color: [/^#[0-9a-f]{3,8}$/i, /^rgb/i, /^hsl/i, /^[a-z]+$/i],
      "background-color": [/^#[0-9a-f]{3,8}$/i, /^rgb/i, /^hsl/i, /^[a-z]+$/i],
      "font-size": [/^\d+(?:\.\d+)?(px|rem|em|%)$/],
      "font-family": [/^[a-z0-9 ,\-\'"]+$/i],
      "font-weight": [/^(normal|bold|[1-9]00)$/],
      "text-align": [/^(left|right|center|justify)$/],
      "line-height": [/^[\d.]+(px|rem|em|%)?$/],
      margin: [/^(?:(?:auto|0|-?\d+(?:\.\d+)?(?:px|rem|em|%)?)(?:\s+|$)){1,4}$/],
      "margin-left": [/^(?:auto|0|-?\d+(?:\.\d+)?(?:px|rem|em|%)?)$/],
      "margin-right": [/^(?:auto|0|-?\d+(?:\.\d+)?(?:px|rem|em|%)?)$/],
      padding: [/^[\d\s.-]+(px|rem|em|%)?$/],
      "border-radius": [/^\d+(px|rem|em|%)$/],
      width: [/^[\d.]+(px|rem|em|%)$/],
      "max-width": [/^[\d.]+(px|rem|em|%)$/],
      height: [/^(?:auto|[\d.]+(?:px|rem|em|%))$/],
      display: [/^(?:block|inline|inline-block)$/],
    },
  },
};

export function sanitizeBlogHtml(value: unknown) {
  return sanitizeHtml(String(value ?? ""), sanitizeOptions);
}

function styleString(style: any = {}) {
  const values: string[] = [];
  if (style.color) values.push(`color:${text(style.color)}`);
  if (style.backgroundColor) values.push(`background-color:${text(style.backgroundColor)}`);
  if (style.fontSize) values.push(`font-size:${text(style.fontSize)}`);
  if (style.fontWeight) values.push(`font-weight:${text(style.fontWeight)}`);
  if (style.textAlign) values.push(`text-align:${text(style.textAlign)}`);
  if (style.lineHeight) values.push(`line-height:${text(style.lineHeight)}`);
  if (style.margin) values.push(`margin:${text(style.margin)}`);
  if (style.padding) values.push(`padding:${text(style.padding)}`);
  if (style.borderRadius) values.push(`border-radius:${text(style.borderRadius)}`);
  return values.join(";");
}

function attrs(block: any) {
  const style = styleString(block?.style);
  const id = text(block?.anchorId || block?.idAttribute);
  const className = text(block?.className);
  return `${id ? ` id="${sanitizeHtml(id, { allowedTags: [], allowedAttributes: {} })}"` : ""}${className ? ` class="${sanitizeHtml(className, { allowedTags: [], allowedAttributes: {} })}"` : ""}${style ? ` style="${style}"` : ""}`;
}

function esc(value: unknown) {
  return sanitizeHtml(text(value), { allowedTags: [], allowedAttributes: {} });
}

export function renderBlogBlocks(blocksInput: unknown) {
  const blocks = Array.isArray(blocksInput) ? blocksInput : [];
  const html = blocks.map((block: any, blockIndex: number) => {
    const type = text(block?.type).toLowerCase();
    const data = block?.data && typeof block.data === "object" ? block.data : {};
    const a = attrs(block);

    if (type === "heading") {
      const level = Math.max(1, Math.min(6, Number(data.level || 2)));
      const explicitAnchor = text(block?.anchorId || block?.idAttribute);
      const headingText = sanitizeHtml(String(data.text || ""), { allowedTags: [], allowedAttributes: {} });
      const autoAnchor = createSlug(headingText) || `heading-${blockIndex + 1}`;
      const headingAttrs = explicitAnchor ? a : `${a} id="${autoAnchor}-${blockIndex + 1}"`;
      return `<h${level}${headingAttrs}>${sanitizeBlogHtml(data.text)}</h${level}>`;
    }
    if (type === "paragraph") return `<p${a}>${sanitizeBlogHtml(data.text)}</p>`;
    if (type === "quote") return `<blockquote${a}>${sanitizeBlogHtml(data.text)}</blockquote>`;
    if (type === "code") return `<pre${a}><code>${esc(data.code)}</code></pre>`;
    if (type === "divider") return `<hr${a} />`;
    if (type === "spacer") {
      const height = Math.max(8, Math.min(400, Number(data.height || 32)));
      return `<div${a} style="${styleString(block?.style)};height:${height}px" aria-hidden="true"></div>`;
    }
    if (type === "image") {
      const url = text(data.url);
      if (!url) return "";
      const alt = esc(data.alt);
      const caption = text(data.caption);
      const link = text(data.link);
      const img = `<img src="${esc(url)}" alt="${alt}" title="${esc(data.title)}" loading="lazy"${data.width ? ` width="${Number(data.width)}"` : ""}${data.height ? ` height="${Number(data.height)}"` : ""} />`;
      const wrapped = link ? `<a href="${esc(link)}" rel="noopener noreferrer">${img}</a>` : img;
      return `<figure${a}>${wrapped}${caption ? `<figcaption>${sanitizeBlogHtml(caption)}</figcaption>` : ""}</figure>`;
    }
    if (type === "button") {
      const href = text(data.href) || "#";
      return `<p${a}><a href="${esc(href)}" rel="noopener noreferrer" class="blog-cta">${esc(data.text || "Read more")}</a></p>`;
    }
    if (type === "list") {
      const ordered = bool(data.ordered);
      const items = Array.isArray(data.items) ? data.items : text(data.items).split("\n").filter(Boolean);
      const tag = ordered ? "ol" : "ul";
      return `<${tag}${a}>${items.map((item: unknown) => `<li>${sanitizeBlogHtml(item)}</li>`).join("")}</${tag}>`;
    }
    if (type === "faq" || type === "accordion") {
      const items = Array.isArray(data.items) ? data.items : [];
      return `<section${a}>${items.map((item: any) => `<details><summary>${esc(item?.question || item?.title)}</summary><div>${sanitizeBlogHtml(item?.answer || item?.content)}</div></details>`).join("")}</section>`;
    }
    if (type === "callout") return `<div${a}>${sanitizeBlogHtml(data.text || data.html)}</div>`;
    if (type === "video") {
      const src = text(data.url || data.src);
      return src ? `<div${a}><iframe src="${esc(src)}" title="${esc(data.title || "Video")}" loading="lazy" allowfullscreen></iframe></div>` : "";
    }
    if (type === "table") {
      const rows = Array.isArray(data.rows) ? data.rows : [];
      return `<table${a}><tbody>${rows.map((row: any[]) => `<tr>${(Array.isArray(row) ? row : []).map((cell: unknown) => `<td>${sanitizeBlogHtml(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    }
    if (type === "columns") {
      const columns = Array.isArray(data.columns) ? data.columns : [];
      return `<div${a} class="blog-columns ${text(block?.className)}">${columns.map((column: any) => `<div>${sanitizeBlogHtml(column?.html || column?.text || "")}</div>`).join("")}</div>`;
    }
    if (type === "html") return `<div${a}>${sanitizeBlogHtml(data.html)}</div>`;
    return "";
  }).join("\n");
  return sanitizeBlogHtml(html);
}

function stripHtml(value: string) {
  return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, " ").trim();
}

function readingTime(value: string) {
  const words = stripHtml(value).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function defaultExcerpt(content: string) {
  const plain = stripHtml(content);
  return plain.length <= 220 ? plain : `${plain.slice(0, 217).trim()}...`;
}

function normalizeSeo(value: any = {}) {
  return {
    metaTitle: text(value.metaTitle),
    metaDescription: text(value.metaDescription),
    keywords: Array.isArray(value.keywords) ? value.keywords.map(text).filter(Boolean) : text(value.keywords).split(",").map((v) => v.trim()).filter(Boolean),
    canonicalUrl: text(value.canonicalUrl),
    focusKeyword: text(value.focusKeyword),
    secondaryKeywords: Array.isArray(value.secondaryKeywords) ? value.secondaryKeywords.map(text).filter(Boolean) : text(value.secondaryKeywords).split(",").map((v) => v.trim()).filter(Boolean),
    robots: {
      index: value?.robots?.index !== false,
      follow: value?.robots?.follow !== false,
    },
    openGraph: {
      title: text(value?.openGraph?.title),
      description: text(value?.openGraph?.description),
      image: text(value?.openGraph?.image),
    },
    twitter: {
      title: text(value?.twitter?.title),
      description: text(value?.twitter?.description),
      image: text(value?.twitter?.image),
    },
  };
}

function normalizeFeaturedImage(value: any = {}) {
  return {
    url: text(value.url),
    publicId: text(value.publicId),
    alt: text(value.alt),
    title: text(value.title),
    caption: text(value.caption),
    width: Math.max(0, Number(value.width || 0)),
    height: Math.max(0, Number(value.height || 0)),
  };
}

function normalizeStatus(value: unknown): BlogStatus {
  const status = text(value).toUpperCase();
  return (["DRAFT", "PUBLISHED", "SCHEDULED", "PRIVATE"].includes(status) ? status : "DRAFT") as BlogStatus;
}

async function validateProductCategory(categoryId: string) {
  if (!categoryId) return;
  if (!Types.ObjectId.isValid(categoryId)) throw new Error("Invalid product category.");
  if (!(await Category.exists({ _id: categoryId }))) throw new Error("Product category not found.");
}

async function resolveBlogTags(values: unknown[]) {
  const rawValues = values
    .flatMap((value) => text(value).split(","))
    .map((value) => value.trim())
    .filter(Boolean);

  const seenNames = new Set<string>();
  const uniqueValues = rawValues.filter((value) => {
    const key = value.toLowerCase();
    if (seenNames.has(key)) return false;
    seenNames.add(key);
    return true;
  });
  const ids: Types.ObjectId[] = [];

  for (const value of uniqueValues) {
    if (Types.ObjectId.isValid(value)) {
      const existingById = await BlogTag.findById(value).select("_id").lean();
      if (existingById?._id) {
        ids.push(new Types.ObjectId(String(existingById._id)));
        continue;
      }
    }

    const name = value.trim();
    const slug = createSlug(name);
    if (!name || !slug) continue;

    let tag = await BlogTag.findOne({ slug }).select("_id").lean();
    if (!tag) {
      try {
        const created = await BlogTag.create({ name, slug });
        tag = { _id: created._id } as any;
      } catch (error: any) {
        if (error?.code !== 11000) throw error;
        tag = await BlogTag.findOne({ slug }).select("_id").lean();
      }
    }

    if (tag?._id) ids.push(new Types.ObjectId(String(tag._id)));
  }

  const seenIds = new Set<string>();
  return ids.filter((id) => {
    const key = String(id);
    if (seenIds.has(key)) return false;
    seenIds.add(key);
    return true;
  });
}

export async function createBlog(input: any, authorId: string) {
  const title = text(input?.title);
  if (!title) throw new Error("Blog title is required.");
  if (!Types.ObjectId.isValid(authorId)) throw new Error("Invalid blog author.");
  const slug = safeSlug(input?.slug, title);
  if (!slug) throw new Error("Blog slug is required.");
  if (await Blog.exists({ slug }) || legacyBlogSlugExists(slug)) throw new Error("A blog with this slug already exists.");

  const categoryId = text(input?.category);
  await validateProductCategory(categoryId);
  const tagIds = await resolveBlogTags(Array.isArray(input?.tags) ? input.tags : []);
  const blocks = Array.isArray(input?.blocks) ? input.blocks : [];
  const rendered = blocks.length ? renderBlogBlocks(blocks) : sanitizeBlogHtml(input?.content);
  const status = normalizeStatus(input?.status);
  const scheduledAt = input?.scheduledAt ? new Date(input.scheduledAt) : null;
  if (status === "SCHEDULED" && (!scheduledAt || Number.isNaN(scheduledAt.getTime()))) throw new Error("Scheduled publish date is required.");
  const now = new Date();

  return Blog.create({
    title,
    slug,
    excerpt: text(input?.excerpt) || defaultExcerpt(rendered),
    content: rendered,
    blocks,
    featuredImage: normalizeFeaturedImage(input?.featuredImage),
    category: categoryId ? new Types.ObjectId(categoryId) : null,
    tags: tagIds.map((id) => new Types.ObjectId(id)),
    author: new Types.ObjectId(authorId),
    seo: normalizeSeo(input?.seo),
    status,
    scheduledAt: status === "SCHEDULED" ? scheduledAt : null,
    publishedAt: status === "PUBLISHED" ? now : null,
    readingTime: readingTime(rendered),
    isFeatured: bool(input?.isFeatured),
    customCss: cleanCss(input?.customCss),
  });
}

export async function updateBlog(id: string, input: any, changedBy: string) {
  if (!Types.ObjectId.isValid(id)) throw new Error("Invalid blog ID.");
  const blog = await Blog.findById(id);
  if (!blog) throw new Error("Blog not found.");

  const title = text(input?.title || blog.title);
  const nextSlug = safeSlug(input?.slug || blog.slug, title);
  if (nextSlug !== blog.slug && (await Blog.exists({ slug: nextSlug, _id: { $ne: blog._id } }) || legacyBlogSlugExists(nextSlug))) throw new Error("A blog with this slug already exists.");

  const categoryId = input?.category === null ? "" : text(input?.category ?? blog.category);
  await validateProductCategory(categoryId);
  const tagIds = await resolveBlogTags(Array.isArray(input?.tags) ? input.tags : blog.tags.map(String));
  const blocks = Array.isArray(input?.blocks) ? input.blocks : blog.blocks;
  const rendered = blocks.length ? renderBlogBlocks(blocks) : sanitizeBlogHtml(input?.content ?? blog.content);
  const status = normalizeStatus(input?.status ?? blog.status);
  const scheduledAt = input?.scheduledAt ? new Date(input.scheduledAt) : blog.scheduledAt;
  if (status === "SCHEDULED" && (!scheduledAt || Number.isNaN(new Date(scheduledAt).getTime()))) throw new Error("Scheduled publish date is required.");

  blog.revisions.push({
    changedAt: new Date(),
    changedBy: Types.ObjectId.isValid(changedBy) ? new Types.ObjectId(changedBy) : null,
    title: blog.title,
    slug: blog.slug,
    excerpt: blog.excerpt,
    content: blog.content,
    blocks: blog.blocks,
    seo: blog.seo,
  } as any);
  if (blog.revisions.length > 20) blog.revisions = blog.revisions.slice(-20) as any;

  blog.title = title;
  blog.slug = nextSlug;
  blog.excerpt = text(input?.excerpt) || defaultExcerpt(rendered);
  blog.content = rendered;
  blog.blocks = blocks;
  blog.featuredImage = normalizeFeaturedImage(input?.featuredImage ?? blog.featuredImage) as any;
  blog.category = categoryId ? new Types.ObjectId(categoryId) : null;
  blog.tags = tagIds.map((tagId) => new Types.ObjectId(tagId));
  blog.seo = normalizeSeo(input?.seo ?? blog.seo) as any;
  blog.status = status;
  blog.scheduledAt = status === "SCHEDULED" ? (scheduledAt ? new Date(scheduledAt) : null) : null;
  if (status === "PUBLISHED" && !blog.publishedAt) blog.publishedAt = new Date();
  blog.readingTime = readingTime(rendered);
  blog.isFeatured = bool(input?.isFeatured, blog.isFeatured);
  blog.customCss = cleanCss(input?.customCss ?? blog.customCss);
  await blog.save();
  return blog;
}

export async function duplicateBlog(id: string, authorId: string) {
  if (!Types.ObjectId.isValid(id)) throw new Error("Invalid blog ID.");
  const source = await Blog.findById(id).lean();
  if (!source) throw new Error("Blog not found.");
  let slug = `${source.slug}-copy`;
  let i = 2;
  while (await Blog.exists({ slug }) || legacyBlogSlugExists(slug)) slug = `${source.slug}-copy-${i++}`;
  const { _id, createdAt, updatedAt, revisions, views, likes, ...rest } = source as any;
  return Blog.create({ ...rest, slug, title: `${source.title} Copy`, author: new Types.ObjectId(authorId), status: "DRAFT", publishedAt: null, scheduledAt: null, views: 0, likes: [], revisions: [] });
}

export function publicBlogMatch() {
  const now = new Date();
  return {
    $or: [
      { status: "PUBLISHED" as const },
      { status: "SCHEDULED" as const, scheduledAt: { $lte: now } },
    ],
  };
}

export async function listPublicBlogs(input: any = {}) {
  const page = Math.max(1, Number(input.page || 1) || 1);
  const limit = Math.max(1, Math.min(50, Number(input.limit || 12) || 12));
  const match: any = publicBlogMatch();

  if (text(input.search)) {
    const rx = new RegExp(text(input.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const [matchingCategories, matchingTags] = await Promise.all([
      Category.find({ $or: [{ name: rx }, { slug: rx }], isActive: true }).select("_id").lean(),
      BlogTag.find({ $or: [{ name: rx }, { slug: rx }] }).select("_id").lean(),
    ]);
    const searchOr: any[] = [{ title: rx }, { excerpt: rx }, { content: rx }];
    if (matchingCategories.length) searchOr.push({ category: { $in: matchingCategories.map((item: any) => item._id) } });
    if (matchingTags.length) searchOr.push({ tags: { $in: matchingTags.map((item: any) => item._id) } });
    match.$and = [{ $or: searchOr }];
  }

  if (input.isFeatured === true || input.isFeatured === "true") match.isFeatured = true;

  if (text(input.categorySlug)) {
    const category = await Category.findOne({ slug: text(input.categorySlug), isActive: true }).select("_id").lean();
    match.category = category?._id || { $in: [] };
  }

  if (text(input.tagSlug)) {
    const tag = await BlogTag.findOne({ slug: text(input.tagSlug) }).select("_id").lean();
    match.tags = tag?._id || { $in: [] };
  }

  const databaseBlogs = await Blog.find(match)
    .select("title slug excerpt featuredImage category tags author status publishedAt scheduledAt readingTime views likes isFeatured createdAt updatedAt seo")
    .populate("category", "name slug")
    .populate("tags", "name slug")
    .populate("author", "name avatar")
    .lean();

  const normalizedDatabaseBlogs = databaseBlogs.map((blog: any) => {
    const { likes = [], ...rest } = blog;
    return { ...rest, likeCount: Array.isArray(likes) ? likes.length : 0 };
  });

  const fileBlogs = listLegacyBlogs(input).map((blog: any) => {
    const { content, blocks, customCss, revisions, ...summary } = blog;
    return summary;
  });

  // A database blog wins if a slug ever appears in both places. The API never
  // exposes which storage layer supplied a blog, so the storefront sees one
  // normal, unified blog collection.
  const bySlug = new Map<string, any>();
  for (const blog of fileBlogs) bySlug.set(String(blog.slug || "").toLowerCase(), blog);
  for (const blog of normalizedDatabaseBlogs) bySlug.set(String(blog.slug || "").toLowerCase(), blog);
  const blogs = [...bySlug.values()];

  const sort = text(input.sort).toLowerCase();
  const dateValue = (blog: any) => new Date(blog.publishedAt || blog.createdAt || 0).getTime() || 0;
  blogs.sort((a: any, b: any) => {
    if (sort === "oldest") return dateValue(a) - dateValue(b);
    if (sort === "most-viewed") {
      const viewDiff = Number(b.views || 0) - Number(a.views || 0);
      return viewDiff || dateValue(b) - dateValue(a);
    }
    if (sort === "featured") {
      const featuredDiff = Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured));
      return featuredDiff || dateValue(b) - dateValue(a);
    }
    return dateValue(b) - dateValue(a);
  });

  const total = blogs.length;
  const start = (page - 1) * limit;
  const paginatedBlogs = blogs.slice(start, start + limit);

  return {
    blogs: paginatedBlogs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}
