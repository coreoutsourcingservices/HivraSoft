import type { Metadata } from "next";
import type { ApiProduct } from "@/src/services/products";
import type { BlogRecord } from "./blog";


export const SITE_URL = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://hivrasoft.com").replace(/\/+$/, "");
export const BRAND = "HivraSoft";
export const LOGO = `${SITE_URL}/images/logos/hivra-desktop.png.png`;
export const DEFAULT_DESCRIPTION = "Shop men's and women's innerwear at HivraSoft. Explore bras, panties, briefs and trunks in a range of sizes, colours and styles.";
export function absoluteUrl(path: string) {
  try { const url = new URL(path, `${SITE_URL}/`); return /^https?:$/.test(url.protocol) ? url.href : SITE_URL; }
  catch { return SITE_URL; }
}
export function plainText(value: unknown) {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/\s+/g, " ").trim();
}
export type SeoInput = { title: string; preserveTitle?: boolean; description?: string; preserveDescription?: boolean; path: string; image?: string; keywords?: string[]; index?: boolean; follow?: boolean; canonical?: string; article?: { publishedTime?: string; modifiedTime?: string; author: string }; };
// Cut only at word boundaries; metadata must not contain artificial ellipses.
export function snippet(value: unknown, limit: number) {
  const text = plainText(value);
  if (text.length <= limit) return text;
  const prefix = text.slice(0, limit + 1);
  return prefix.slice(0, prefix.lastIndexOf(" ") > 0 ? prefix.lastIndexOf(" ") : limit)
    .replace(/[\s,;:|\u2013-]+$/, "");
}
function titleTopic(value: unknown) {
  return plainText(value).replace(/\s*[|\u2013-]\s*hivra\s*soft(?:\s.*)?$/i, "").trim();
}
export function seoTitle(value: unknown) {
  const topic = titleTopic(value) || BRAND;
  const branded = /hivra\s*soft/i.test(topic) ? topic : topic + " | " + BRAND;
  if (branded.length <= 60) return branded;
  // Keep a complete 50-60 character API title instead of cutting off its topic.
  if (topic.length <= 60) return topic;
  const main = topic.split(/\s*\|\s*/)[0];
  if (main.length + BRAND.length + 3 <= 60) return main + " | " + BRAND;
  if (main.length <= 60) return main;
  return snippet(main, 60).replace(/\s+(?:for|with|and|or|of|the|a|in|&|by)$/i, "");
}
export function descriptiveTitle(value: unknown, suffixes: string[]) {
  const initial = titleTopic(value);
  const resolved = seoTitle(initial);
  const topic = resolved.length < 50 ? titleTopic(resolved).split(/\s*\|\s*/)[0] : initial;
  for (const candidate of [topic, ...suffixes.map(suffix => topic + " " + suffix)]) {
    const title = seoTitle(candidate);
    if (title.length >= 50 && title.length <= 60) return candidate;
  }
  return topic;
}
export function seoDescription(value: unknown, fallback: string) {
  const text = plainText(value);
  // Product names alone and cut-off sentences are not useful descriptions.
  if (text.length >= 70 && text.length <= 135 && /[.!?]$/.test(text)) return text;
  const sentences = text.match(/[^.!?]+[.!?](?:\s|$)/g) || [];
  let complete = "";
  for (const sentence of sentences) {
    if ((complete + sentence).trim().length > 135) break;
    complete += sentence;
  }
  return complete.trim().length >= 70 ? complete.trim() : fallback;
}
export function pageMetadata(input: SeoInput): Metadata {
  const title = plainText(input.title) || BRAND;
  const fullTitle = input.preserveTitle ? title : seoTitle(title);
  const copy = plainText(input.description) || DEFAULT_DESCRIPTION;
  const description = input.preserveDescription || copy.length <= 135 ? copy : seoDescription(copy, DEFAULT_DESCRIPTION);
  const url = absoluteUrl(input.canonical || input.path);
  const image = absoluteUrl(input.image || LOGO);
  return {
    metadataBase: new URL(SITE_URL), title: { absolute: fullTitle }, description,
    applicationName: BRAND, keywords: input.keywords?.filter(Boolean),
    alternates: { canonical: url },
    // Indexing is the default. Explicit index on a parent conflicts with the
    // framework's noindex tag when a child calls notFound().
    robots: input.index === false || input.follow === false ? { index: input.index !== false, follow: input.follow !== false } : undefined,
    openGraph: { title: fullTitle, description, url, siteName: BRAND, locale: "en_IN", images: [{ url: image, alt: title }], ...(input.article ? { type: "article", publishedTime: input.article.publishedTime, modifiedTime: input.article.modifiedTime, authors: [input.article.author] } : { type: "website" }) },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [image] },
  };
}
export function webpageSchema(input: SeoInput) {
  const url = absoluteUrl(input.canonical || input.path);
  return { "@context": "https://schema.org", "@type": "WebPage", "@id": `${url}#webpage`, url, name: plainText(input.title), description: plainText(input.description || DEFAULT_DESCRIPTION), isPartOf: { "@id": `${SITE_URL}/#website` }, publisher: { "@id": `${SITE_URL}/#organization` } };
}
export function breadcrumbs(items: Array<{ name: string; path: string }>) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: absoluteUrl(item.path) })) };
}
export const siteSchema = { "@context": "https://schema.org", "@graph": [
  { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: BRAND, url: SITE_URL, logo: { "@type": "ImageObject", url: LOGO } },
  { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: BRAND, url: SITE_URL, publisher: { "@id": `${SITE_URL}/#organization` } },
] };
// Use the API description, keeping the rendered search snippet within the audit limit.
export function blogMetaDescription(value: unknown) {
  const text = plainText(value);
  if (text.length <= 135) return text;
  const shortened = snippet(text, 134)
    .replace(/\s+(?:in|for|and|with|of|to|the|a|an|or|at|by)$/i, "")
    .replace(/[,.!?;:]+$/, "");
  return shortened + ".";
}
// Saved API values are the source of truth for every blog.
export function blogSeo(blog: BlogRecord): SeoInput {
  const seo = blog.seo || {};
  const title = plainText(seo.metaTitle) || plainText(blog.title);
  const description = blogMetaDescription(plainText(seo.metaDescription) || plainText(blog.excerpt) || plainText(blog.content));
  const tags = (blog.tags || []).map(tag => typeof tag === "string" ? tag : tag.name);
  const keywords = [...new Set([
    ...(Array.isArray(seo.keywords) ? seo.keywords : String(seo.keywords || "").split(",")),
    ...(Array.isArray(seo.secondaryKeywords) ? seo.secondaryKeywords : []), seo.focusKeyword, ...tags,
  ].map(plainText).filter(Boolean))];
  return { title, description, path: "/" + blog.slug, canonical: plainText(seo.canonicalUrl) || undefined,
    image: seo.openGraph?.image || blog.featuredImage?.url || LOGO,
    keywords, index: seo.robots?.index !== false, follow: seo.robots?.follow !== false,
    article: { publishedTime: blog.publishedAt || blog.createdAt || undefined, modifiedTime: blog.updatedAt, author: typeof blog.author === "string" ? blog.author : blog.author?.name || BRAND } };
}
export function blogMetadata(blog: BlogRecord): Metadata {
  const input = blogSeo(blog), meta = pageMetadata(input), seo = blog.seo || {};
  return { ...meta, title: { absolute: input.title }, description: input.description,
    robots: { index: input.index !== false, follow: input.follow !== false },
    openGraph: { ...meta.openGraph, type: "article", title: plainText(seo.openGraph?.title) || input.title,
      description: plainText(seo.openGraph?.description) || input.description,
      images: [{ url: absoluteUrl(input.image || LOGO), alt: blog.featuredImage?.alt || blog.title }],
      tags: (blog.tags || []).map(tag => typeof tag === "string" ? tag : tag.name) },
    twitter: { card: "summary_large_image", title: plainText(seo.twitter?.title) || input.title,
      description: plainText(seo.twitter?.description) || input.description,
      images: [{ url: absoluteUrl(seo.twitter?.image || input.image || LOGO), alt: blog.featuredImage?.alt || blog.title }] } };
}
export function blogSchema(blog: BlogRecord) {
  const input = blogSeo(blog), url = absoluteUrl(input.canonical || input.path);
  return { "@context": "https://schema.org", "@type": "BlogPosting", "@id": `${url}#article`, url, mainEntityOfPage: { "@id": `${url}#webpage` }, headline: plainText(blog.title), description: plainText(input.description), image: absoluteUrl(input.image || LOGO), datePublished: input.article?.publishedTime, dateModified: input.article?.modifiedTime, author: { "@type": "Person", name: input.article?.author }, publisher: { "@id": `${SITE_URL}/#organization` }, inLanguage: "en-IN" };
}
export function productSeo(product: ApiProduct, slug: string) {
  const colors = (product.colors || []).filter(color => color.isActive !== false);
  const color = colors.find(color => color.slugProduct === slug) || colors.find(color => color.isDefault) || colors[0];
  const images = (color?.images?.length ? color.images : product.mainImages || []).filter(image => image.url);
  const name = color?.nameProduct || product.name || "Innerwear";
  const label = plainText(name).split(/\s*\|\s*/)[0].replace(/hivra\s*soft\s*/ig, "").replace(/BlueCotton/g, "Blue Cotton").trim();
  const activeSizes = (color?.sizes || []).filter(size => size.isActive !== false).map(size => size.size || size.name).filter(Boolean);
  const sizeLabel = activeSizes.length ? activeSizes.length === 1 ? activeSizes[0] : activeSizes[0] + "-" + activeSizes.at(-1) : "";
  const rawTitle = plainText(color?.seoTitle);
  // Some old variants contain another colour's SEO title; use their actual name.
  const selectedColor = plainText(color?.nameColor).toLowerCase();
  const wrongColor = selectedColor && !/default|multi/i.test(selectedColor) && !rawTitle.toLowerCase().includes(selectedColor)
    && /\b(?:red|blue|white|black|pink|green|maroon|beige)\b/i.test(rawTitle);
  const title = descriptiveTitle(wrongColor || /(?:\b\d+\s*(?:x|great|amazing|best|premium|positive)|\bNo\.?\s*1\b|\b24H(?:r)?\b|\bPowerx|5-star)/i.test(rawTitle) ? label : rawTitle || label,
    [sizeLabel ? "in Sizes " + sizeLabel : "Online", "Shop Online", "Online", "Everyday Comfort", "Daily Wear", "Buy Online", "Comfort Fit", "for Everyday Comfort", "Everyday Styles & Sizes Online"]);
  const shortLabel = snippet(label, 60);
  const apiDescription = plainText(color?.seoDescription || color?.shortDescription || product.shortDescription);
  const unreliableDescription = /(?:\+91|\bcall\b|\border now from\b)/i.test(apiDescription)
    || (selectedColor && !/default|multi/i.test(selectedColor) && !apiDescription.toLowerCase().includes(selectedColor) && /\b(?:red|blue|white|black|pink|green|maroon|beige)\b/i.test(apiDescription));
  const description = seoDescription(unreliableDescription ? "" : apiDescription,
    `Shop ${shortLabel} at HivraSoft. ${sizeLabel ? `Sizes ${sizeLabel}. ` : ""}View colours and product details.`);
  const input: SeoInput = { title, description, path: `/product/${slug}`, image: images.find(image => image.isDefault)?.url || images[0]?.url, keywords: [color?.focusKeyword || "", ...(color?.tags || [])] };
  const sizes = (color?.sizes || []).filter(size => size.isActive !== false);
  const selected = sizes.find(size => size.isDefault) || sizes.find(size => Number(size.stock || 0) > 0) || sizes[0];
  const price = Number(selected?.showPrice ?? selected?.sellingPrice ?? selected?.price ?? color?.showPrice ?? color?.sellingPrice ?? product.sellingPrice ?? product.price);
  const inStock = sizes.some(size => Number(size.stock || 0) > 0);
  const schema = { "@context": "https://schema.org", "@type": "Product", "@id": `${absoluteUrl(input.path)}#product`, url: absoluteUrl(input.path), name, description: plainText(input.description), image: images.map(image => absoluteUrl(image.url!)), sku: `${product._id || product.id || slug}:${color?._id || color?.id || slug}`, color: color?.nameColor, brand: { "@type": "Brand", name: BRAND },
    ...(Number.isFinite(price) && price > 0 ? { offers: { "@type": "Offer", url: absoluteUrl(input.path), priceCurrency: "INR", price, itemCondition: "https://schema.org/NewCondition", availability: `https://schema.org/${inStock ? "InStock" : "OutOfStock"}`, seller: { "@id": `${SITE_URL}/#organization` } } } : {}),
    ...(Number(product.ratings?.count) > 0 && Number(product.ratings?.average) > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.ratings!.average, reviewCount: product.ratings!.count } } : {}) };
  return { input, schema };
}
