import oldBlogData from "../data/hivrasoft-blogs-clean-nextjs.json";

type OldTaxonomy = { id?: number | string; name?: string; slug?: string };
type OldImage = { id?: number | string; url?: string; alt?: string; title?: string; mimeType?: string | null };
type OldBlogRaw = {
  id: number | string;
  slug: string;
  title: string;
  excerpt?: string;
  contentHtml?: string;
  featuredImage?: OldImage | null;
  images?: OldImage[];
  author?: { id?: number | string; name?: string } | null;
  categories?: OldTaxonomy[];
  tags?: OldTaxonomy[];
  primaryCategory?: OldTaxonomy | null;
  seo?: {
    title?: string;
    description?: string;
    focusKeywords?: string[];
    score?: number | null;
    ogImage?: string | null;
  } | null;
  publishedAt?: string | null;
  publishedAtGmt?: string | null;
  modifiedAt?: string | null;
  modifiedAtGmt?: string | null;
  status?: string;
  readingMinutes?: number;
};

type OldBlogFile = {
  posts?: OldBlogRaw[];
};

const rawPosts = Array.isArray((oldBlogData as OldBlogFile).posts)
  ? (oldBlogData as OldBlogFile).posts!
  : [];

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function stableId(namespace: string, value: unknown) {
  const input = `${namespace}:${String(value ?? "")}`;
  const seeds = [0x811c9dc5, 0x9e3779b9, 0x85ebca6b];
  return seeds.map((seed) => {
    let hash = seed >>> 0;
    for (let i = 0; i < input.length; i += 1) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash.toString(16).padStart(8, "0");
  }).join("");
}

function taxonomy(value: OldTaxonomy | null | undefined) {
  const name = text(value?.name);
  const slug = text(value?.slug).toLowerCase();
  if (!name || !slug) return null;
  return { _id: stableId("taxonomy", value?.id ?? slug), name, slug };
}

function postDate(post: OldBlogRaw) {
  return post.publishedAt || post.publishedAtGmt || null;
}

export function legacyBlogToPublicRecord(post: OldBlogRaw) {
  const category = taxonomy(post.primaryCategory) || taxonomy(post.categories?.[0]);
  const tags = (post.tags || []).map(taxonomy).filter(Boolean);
  const image = post.featuredImage || post.images?.[0] || null;
  const focusKeywords = Array.isArray(post.seo?.focusKeywords) ? post.seo!.focusKeywords! : [];

  return {
    _id: stableId("blog", post.id),
    title: text(post.title) || "Untitled Blog",
    slug: text(post.slug).toLowerCase(),
    excerpt: text(post.excerpt),
    content: String(post.contentHtml || ""),
    blocks: [],
    featuredImage: {
      url: text(image?.url),
      publicId: "",
      alt: text(image?.alt) || text(post.title),
      title: text(image?.title) || text(post.title),
      caption: "",
      width: 0,
      height: 0,
    },
    category,
    tags,
    author: {
      _id: stableId("author", post.author?.id ?? "hivrasoft"),
      name: text(post.author?.name) || "Hivra Soft",
    },
    seo: {
      metaTitle: text(post.seo?.title) || text(post.title),
      metaDescription: text(post.seo?.description) || text(post.excerpt),
      keywords: focusKeywords.map(text).filter(Boolean),
      canonicalUrl: "",
      focusKeyword: text(focusKeywords[0]),
      secondaryKeywords: focusKeywords.slice(1).map(text).filter(Boolean),
      robots: { index: true, follow: true },
      openGraph: {
        title: text(post.seo?.title) || text(post.title),
        description: text(post.seo?.description) || text(post.excerpt),
        image: typeof post.seo?.ogImage === "string" && /^https?:\/\//i.test(post.seo.ogImage)
          ? post.seo.ogImage
          : text(image?.url),
      },
      twitter: {
        title: text(post.seo?.title) || text(post.title),
        description: text(post.seo?.description) || text(post.excerpt),
        image: text(image?.url),
      },
    },
    status: "PUBLISHED" as const,
    publishedAt: postDate(post),
    scheduledAt: null,
    readingTime: Math.max(1, Number(post.readingMinutes || 1)),
    views: 0,
    likeCount: 0,
    isFeatured: false,
    customCss: "",
    revisions: [],
    createdAt: postDate(post) || undefined,
    updatedAt: post.modifiedAt || post.modifiedAtGmt || postDate(post) || undefined,
  };
}

function publishedPosts() {
  return rawPosts.filter((post) => text(post.status || "publish").toLowerCase() === "publish" && text(post.slug));
}

export function legacyBlogSlugExists(slug: string) {
  const wanted = text(slug).toLowerCase();
  return publishedPosts().some((post) => text(post.slug).toLowerCase() === wanted);
}

export function getLegacyBlogBySlug(slug: string) {
  const wanted = decodeURIComponent(text(slug)).toLowerCase();
  const post = publishedPosts().find((item) => text(item.slug).toLowerCase() === wanted);
  return post ? legacyBlogToPublicRecord(post) : null;
}

export function listLegacyBlogs(input: any = {}) {
  const search = text(input.search).toLowerCase();
  const categorySlug = text(input.categorySlug).toLowerCase();
  const tagSlug = text(input.tagSlug).toLowerCase();
  const featuredOnly = input.isFeatured === true || input.isFeatured === "true";
  if (featuredOnly) return [];

  return publishedPosts()
    .filter((post) => {
      const categories = [post.primaryCategory, ...(post.categories || [])]
        .map((item) => text(item?.slug).toLowerCase())
        .filter(Boolean);
      const tags = (post.tags || []).map((item) => text(item.slug).toLowerCase()).filter(Boolean);

      if (categorySlug && !categories.includes(categorySlug)) return false;
      if (tagSlug && !tags.includes(tagSlug)) return false;
      if (!search) return true;

      const haystack = [
        post.title,
        post.excerpt,
        post.contentHtml,
        ...(post.categories || []).flatMap((item) => [item.name, item.slug]),
        ...(post.tags || []).flatMap((item) => [item.name, item.slug]),
      ].map(text).join(" ").toLowerCase();
      return haystack.includes(search);
    })
    .map(legacyBlogToPublicRecord);
}

export function getLegacyRelatedBlogs(slug: string, limit = 4) {
  const current = getLegacyBlogBySlug(slug);
  if (!current) return [];
  const currentCategory = current.category && typeof current.category !== "string" ? current.category.slug : "";
  const currentTags = new Set((current.tags || []).map((tag: any) => typeof tag === "string" ? tag : tag?.slug).filter(Boolean));

  return listLegacyBlogs()
    .filter((blog) => blog.slug !== current.slug)
    .sort((a, b) => {
      const aCategory = a.category && typeof a.category !== "string" ? a.category.slug : "";
      const bCategory = b.category && typeof b.category !== "string" ? b.category.slug : "";
      const aTags = (a.tags || []).map((tag: any) => typeof tag === "string" ? tag : tag?.slug).filter(Boolean);
      const bTags = (b.tags || []).map((tag: any) => typeof tag === "string" ? tag : tag?.slug).filter(Boolean);
      const aScore = (currentCategory && aCategory === currentCategory ? 2 : 0) + aTags.filter((tag) => currentTags.has(tag)).length;
      const bScore = (currentCategory && bCategory === currentCategory ? 2 : 0) + bTags.filter((tag) => currentTags.has(tag)).length;
      if (aScore !== bScore) return bScore - aScore;
      return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
    })
    .slice(0, limit);
}

export function getLegacyCategories() {
  const map = new Map<string, any>();
  for (const post of publishedPosts()) {
    for (const item of [post.primaryCategory, ...(post.categories || [])]) {
      const value = taxonomy(item);
      if (value && !map.has(value.slug)) map.set(value.slug, value);
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function getLegacyTags() {
  const map = new Map<string, any>();
  for (const post of publishedPosts()) {
    for (const item of post.tags || []) {
      const value = taxonomy(item);
      if (value && !map.has(value.slug)) map.set(value.slug, value);
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}
