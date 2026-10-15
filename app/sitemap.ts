import type { MetadataRoute } from "next";
import { absoluteUrl, blogSeo } from "@/lib/seo";
import { STATIC_SEO } from "@/lib/seo-pages";
import { fetchBlogsServer } from "@/lib/blog-server";
import { getCachedActiveCategoryTree, getCachedActiveProducts } from "@/src/services/storefront-fast";
import { getActiveOffers } from "@/src/services/offers";
import type { StorefrontCategoryNode } from "@/src/services/categories";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = new Map<string, MetadataRoute.Sitemap[number]>();
  const add = (path: string, changed?: string) => {
    const url = absoluteUrl(path);
    if (new URL(url).origin !== new URL(absoluteUrl("/")).origin) return;
    const date = changed ? new Date(changed) : undefined;
    entries.set(url, { url, ...(date && !Number.isNaN(date.getTime()) ? { lastModified: date } : {}) });
  };
  Object.values(STATIC_SEO).filter(item => item.index !== false).forEach(item => add(item.canonical || item.path));
  const [tree, products, offers, first] = await Promise.all([getCachedActiveCategoryTree(), getCachedActiveProducts(), getActiveOffers(), fetchBlogsServer("page=1&limit=50")]);
  if (!first) throw new Error("Cannot generate sitemap: public blog API unavailable");
  const visit = (nodes: StorefrontCategoryNode[], prefix = "") => {
    for (const node of nodes) {
      if (node.isActive === false) continue;
      const path = `${prefix}/${node.slug}`;
      if (!prefix && !["men", "women", "accessories"].includes(node.slug)) continue;
      add(path); visit(node.children, path);
    }
  };
  visit(tree);
  for (const product of products) {
    const colors = (product.colors || []).filter(color => color.isActive !== false && color.slugProduct);
    for (const color of colors) add(`/product/${color.slugProduct}`);
    if (!colors.length && product.slug) add(`/product/${product.slug}`);
  }
  for (const offer of offers) if (offer.isActive) add(/^buy-\d+-get-\d+(?:-free)?$/.test(offer.slug) ? `/${offer.slug}` : `/offers/${offer.slug}`, offer.updatedAt);
  const addBlogs = (blogs: NonNullable<typeof first>["blogs"]) => { for (const blog of blogs) { const seo = blogSeo(blog); if (seo.index !== false) add(seo.canonical || seo.path, blog.updatedAt || blog.publishedAt || undefined); } };
  addBlogs(first.blogs);
  for (let page = 2; page <= first.pagination.totalPages; page++) {
    const result = await fetchBlogsServer(`page=${page}&limit=50`);
    if (!result) throw new Error("Cannot generate complete blog sitemap");
    addBlogs(result.blogs);
  }
  return [...entries.values()];
}
