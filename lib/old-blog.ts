import oldBlogData from "@/data/hivrasoft-blogs-clean-nextjs.json";
import type { BlogRecord, BlogTaxonomy } from "@/lib/blog";

export type OldBlogRaw = {
  id: number | string;
  slug: string;
  title: string;
  excerpt?: string;
  contentHtml?: string;
  featuredImage?: {
    id?: number | string;
    url?: string;
    alt?: string;
    title?: string;
    mimeType?: string;
  } | null;
  images?: Array<{
    id?: number | string;
    url?: string;
    alt?: string;
    title?: string | null;
    mimeType?: string;
  }>;
  author?: { id?: number | string; name?: string } | null;
  categories?: Array<{ id?: number | string; name?: string; slug?: string }>;
  tags?: Array<{ id?: number | string; name?: string; slug?: string }>;
  primaryCategory?: { id?: number | string; name?: string; slug?: string } | null;
  seo?: {
    title?: string;
    description?: string;
    focusKeywords?: string[];
    score?: number;
    ogImage?: string;
  } | null;
  publishedAt?: string | null;
  publishedAtGmt?: string | null;
  modifiedAt?: string | null;
  modifiedAtGmt?: string | null;
  status?: string;
  commentStatus?: string;
  commentCount?: number;
  wordCount?: number;
  readingMinutes?: number;
  sourceUrl?: string;
  wordpress?: Record<string, unknown>;
};

type OldBlogFile = {
  schemaVersion?: string;
  site?: Record<string, unknown>;
  total?: number;
  posts?: OldBlogRaw[];
};

const file = oldBlogData as OldBlogFile;
const rawPosts = Array.isArray(file.posts) ? file.posts : [];

function taxonomy(value: { id?: number | string; name?: string; slug?: string } | null | undefined): BlogTaxonomy | null {
  if (!value?.name || !value?.slug) return null;
  return {
    _id: `old-tax-${String(value.id ?? value.slug)}`,
    name: value.name,
    slug: value.slug,
  };
}

export function oldBlogToRecord(post: OldBlogRaw): BlogRecord {
  const category = taxonomy(post.primaryCategory) || taxonomy(post.categories?.[0]);
  const tags = (post.tags || []).map(taxonomy).filter((item): item is BlogTaxonomy => Boolean(item));
  const image = post.featuredImage || post.images?.[0] || null;
  const focusKeywords = Array.isArray(post.seo?.focusKeywords) ? post.seo?.focusKeywords : [];

  return {
    _id: `old-${String(post.id)}`,
    title: String(post.title || "Untitled Blog"),
    slug: String(post.slug || ""),
    excerpt: String(post.excerpt || ""),
    content: String(post.contentHtml || ""),
    blocks: [],
    featuredImage: {
      url: String(image?.url || ""),
      publicId: "",
      alt: String(image?.alt || post.title || ""),
      title: String(image?.title || post.title || ""),
      caption: "",
      width: 0,
      height: 0,
    },
    category,
    tags,
    author: {
      _id: `old-author-${String(post.author?.id ?? 1)}`,
      name: String(post.author?.name || "Hivra Soft"),
    },
    seo: {
      metaTitle: String(post.seo?.title || post.title || ""),
      metaDescription: String(post.seo?.description || post.excerpt || ""),
      focusKeyword: String(focusKeywords[0] || ""),
      keywords: focusKeywords,
      openGraph: {
        title: String(post.seo?.title || post.title || ""),
        description: String(post.seo?.description || post.excerpt || ""),
        image: typeof post.seo?.ogImage === "string" && post.seo.ogImage.startsWith("http")
          ? post.seo.ogImage
          : String(image?.url || ""),
      },
    },
    status: "PUBLISHED",
    publishedAt: post.publishedAt || post.publishedAtGmt || null,
    scheduledAt: null,
    readingTime: Math.max(1, Number(post.readingMinutes || 1)),
    views: 0,
    likeCount: 0,
    isFeatured: false,
    customCss: "",
    revisions: [],
    createdAt: post.publishedAt || post.publishedAtGmt || undefined,
    updatedAt: post.modifiedAt || post.modifiedAtGmt || post.publishedAt || undefined,
  };
}

export function getOldBlogs() {
  return rawPosts
    .filter((post) => String(post.status || "publish").toLowerCase() === "publish")
    .map(oldBlogToRecord)
    .sort((a, b) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime());
}

export function getOldBlogBySlug(slug: string) {
  const normalized = decodeURIComponent(slug || "").trim().toLowerCase();
  const raw = rawPosts.find((post) => String(post.slug || "").trim().toLowerCase() === normalized);
  return raw ? { raw, blog: oldBlogToRecord(raw) } : null;
}

export function getOldRelatedBlogs(slug: string, limit = 4) {
  const current = getOldBlogBySlug(slug);
  if (!current) return [];
  const currentCategory = current.blog.category && typeof current.blog.category !== "string" ? current.blog.category.slug : "";

  return getOldBlogs()
    .filter((blog) => blog.slug !== current.blog.slug)
    .sort((a, b) => {
      const aCategory = a.category && typeof a.category !== "string" ? a.category.slug : "";
      const bCategory = b.category && typeof b.category !== "string" ? b.category.slug : "";
      const aMatch = currentCategory && aCategory === currentCategory ? 1 : 0;
      const bMatch = currentCategory && bCategory === currentCategory ? 1 : 0;
      if (aMatch !== bMatch) return bMatch - aMatch;
      return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
    })
    .slice(0, limit);
}

export function getOldBlogRawData() {
  return {
    schemaVersion: file.schemaVersion || "1.0",
    site: file.site || {},
    total: rawPosts.length,
    posts: rawPosts,
  };
}
