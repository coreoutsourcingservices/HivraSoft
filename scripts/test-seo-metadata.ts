import assert from "node:assert/strict";
import { blogMetadata, pageMetadata, productSeo, seoDescription, seoTitle } from "../lib/seo";
import { STATIC_SEO } from "../lib/seo-pages";
import { BLOG_SEO_COPY } from "../lib/blog-seo-copy";
import { CATEGORY_SEO_COPY } from "../lib/category-seo-copy";
import type { BlogRecord } from "../lib/blog";

for (const input of Object.values(STATIC_SEO)) {
  const meta = pageMetadata(input);
  const title = (meta.title as { absolute: string }).absolute;
  if (input.index !== false) assert.ok(title.length >= 50 && title.length <= 60, input.path);
  assert.ok(meta.description && meta.description.length <= 135, input.path);
  assert.equal(meta.openGraph?.description, meta.description);
  if (input.index === false) assert.equal((meta.robots as { index: boolean }).index, false);
}
for (const [path, [, title, description]] of Object.entries(CATEGORY_SEO_COPY)) {
  assert.ok(seoTitle(title).length >= 50 && seoTitle(title).length <= 60, path);
  assert.ok(description.length <= 135 && description.endsWith("."), path);
}
for (const [slug, copy] of Object.entries(BLOG_SEO_COPY)) {
  const original: BlogRecord = { _id: slug, slug, title: "Article heading", excerpt: "", content: "", blocks: [], featuredImage: { url: "", publicId: "" }, tags: [], status: "PUBLISHED", readingTime: 1, views: 0, isFeatured: false, seo: { metaTitle: copy.sourceTitle, metaDescription: copy.sourceDescription } };
  const meta = blogMetadata(original);
  assert.equal((meta.title as { absolute: string }).absolute, seoTitle(copy.title));
  assert.equal(meta.description, copy.description);
  assert.ok(seoTitle(copy.title).length >= 50 && seoTitle(copy.title).length <= 60, slug);
  assert.ok(copy.description.length <= 135, slug);
  const updated = blogMetadata({ ...original, seo: { metaTitle: "New Article: Updated Innerwear Buying Guide", metaDescription: "Read our updated article about choosing innerwear, comparing fabric, fit and sizing for comfortable everyday wear." } });
  assert.equal((updated.title as { absolute: string }).absolute, "New Article: Updated Innerwear Buying Guide | HivraSoft");
  assert.ok(updated.description?.startsWith("Read our updated article"), "Admin changes must override reviewed copy");
}
const product = {
  colors: [{ slugProduct: "white-brief", nameProduct: "White Cotton Briefs for Men", nameColor: "White", seoTitle: "Red Cotton Briefs for Men | 3x Comfort", seoDescription: "Shop red briefs in breathable cotton. Call +91 98105 20250 for details and order support today.", images: [], sizes: [{ size: "M", stock: 2 }] }],
  mainImages: [{ url: "https://example.com/white.jpg" }],
};
const saved = JSON.stringify(product);
const { input } = productSeo(product, "white-brief");
assert.ok(input.title.includes("White") && !input.title.includes("Red"));
assert.ok(input.description?.includes("White") && !input.description.includes("98105"));
assert.equal(input.image, "https://example.com/white.jpg");
assert.equal(JSON.stringify(product), saved, "SEO rendering must not mutate API records");
assert.equal(seoDescription("A very long incomplete phrase ".repeat(20), "A complete fallback."), "A complete fallback.");
assert.equal(seoTitle("Fit & Comfort Guide | HivraSoft"), "Fit & Comfort Guide | HivraSoft");
console.log("PASS: static/category/blog metadata, API edit precedence, variant colours, descriptions, image fallback and noindex");
