import type { Metadata } from "next";
import type { ApiProduct } from "@/src/services/products";
import type { BlogRecord } from "./blog";

export const SITE_URL = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://hivrasoft.com").replace(/\/+$/, "");
export const BRAND = "HivraSoft";
export const LOGO = `${SITE_URL}/images/logos/hivra-desktop.png.png`;
export const DEFAULT_DESCRIPTION = "Shop comfortable men's and women's innerwear, bras, panties and accessories at HivraSoft. Explore everyday essentials, new arrivals and bundle offers.";
export function absoluteUrl(path: string) {
  try { const url = new URL(path, `${SITE_URL}/`); return /^https?:$/.test(url.protocol) ? url.href : SITE_URL; }
  catch { return SITE_URL; }
}
export function plainText(value: unknown) {
  return String(value || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/\s+/g, " ").trim();
}
export type SeoInput = { title: string; description?: string; path: string; image?: string; keywords?: string[]; index?: boolean; follow?: boolean; canonical?: string; article?: { publishedTime?: string; modifiedTime?: string; author: string }; };
export function snippet(value: unknown, limit: number) {
  const text = plainText(value);
  if (text.length <= limit) return text;
  const prefix = text.slice(0, limit - 1);
  const boundary = prefix.lastIndexOf(" ");
  return `${prefix.slice(0, boundary > limit * 0.6 ? boundary : prefix.length).replace(/[\s,;:|–-]+$/, "")}…`;
}
export function seoTitle(value: unknown) {
  const topic = plainText(value).replace(/\s*[|–-]\s*hivra\s*soft\s*$/i, "").trim() || BRAND;
  return /hivra\s*soft/i.test(topic) ? snippet(topic, 60) : `${snippet(topic, 48)} | ${BRAND}`;
}
export function pageMetadata(input: SeoInput): Metadata {
  const title = plainText(input.title) || BRAND;
  const fullTitle = seoTitle(title);
  const description = snippet(plainText(input.description) || DEFAULT_DESCRIPTION, 135);
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
export function blogSeo(blog: BlogRecord): SeoInput {
  const seo = blog.seo || {};
  return { title: seo.metaTitle || blog.title, description: seo.metaDescription || blog.excerpt || plainText(blog.content).slice(0, 160), path: `/${blog.slug}`, canonical: seo.canonicalUrl || undefined,
    image: seo.openGraph?.image || blog.featuredImage?.url || LOGO,
    keywords: [...(Array.isArray(seo.keywords) ? seo.keywords : []), ...(seo.focusKeyword ? [seo.focusKeyword] : [])], index: seo.robots?.index !== false, follow: seo.robots?.follow !== false,
    article: { publishedTime: blog.publishedAt || blog.createdAt || undefined, modifiedTime: blog.updatedAt, author: typeof blog.author === "string" ? blog.author : blog.author?.name || BRAND } };
}
export function blogMetadata(blog: BlogRecord): Metadata {
  const input = blogSeo(blog), meta = pageMetadata(input), seo = blog.seo || {};
  return { ...meta, openGraph: { ...meta.openGraph, title: seo.openGraph?.title ? seoTitle(seo.openGraph.title) : meta.openGraph?.title, description: snippet(seo.openGraph?.description || meta.description, 135) },
    twitter: { card: "summary_large_image", title: seoTitle(seo.twitter?.title || input.title), description: snippet(seo.twitter?.description || input.description, 135), images: [absoluteUrl(seo.twitter?.image || input.image || LOGO)] } };
}
export function blogSchema(blog: BlogRecord) {
  const input = blogSeo(blog), url = absoluteUrl(input.canonical || input.path);
  return { "@context": "https://schema.org", "@type": "BlogPosting", "@id": `${url}#article`, url, mainEntityOfPage: { "@id": `${url}#webpage` }, headline: plainText(blog.title), description: plainText(input.description), image: absoluteUrl(input.image || LOGO), datePublished: input.article?.publishedTime, dateModified: input.article?.modifiedTime, author: { "@type": "Person", name: input.article?.author }, publisher: { "@id": `${SITE_URL}/#organization` }, inLanguage: "en-IN" };
}
export function productSeo(product: ApiProduct, slug: string) {
  const colors = (product.colors || []).filter(color => color.isActive !== false);
  const color = colors.find(color => color.slugProduct === slug) || colors.find(color => color.isDefault) || colors[0];
  const images = (color?.images || product.mainImages || []).filter(image => image.url);
  const name = color?.nameProduct || product.name || "Innerwear";
  const input: SeoInput = { title: color?.seoTitle || name, description: color?.seoDescription || color?.shortDescription || product.shortDescription || plainText(color?.description || product.description).slice(0, 160) || `Shop ${name} at HivraSoft. Explore available sizes, colors and everyday comfort.`, path: `/product/${slug}`, image: images.find(image => image.isDefault)?.url || images[0]?.url, keywords: [color?.focusKeyword || "", ...(color?.tags || [])] };
  const sizes = (color?.sizes || []).filter(size => size.isActive !== false);
  const selected = sizes.find(size => size.isDefault) || sizes.find(size => Number(size.stock || 0) > 0) || sizes[0];
  const price = Number(selected?.showPrice ?? selected?.sellingPrice ?? selected?.price ?? color?.showPrice ?? color?.sellingPrice ?? product.sellingPrice ?? product.price);
  const inStock = sizes.some(size => Number(size.stock || 0) > 0);
  const schema = { "@context": "https://schema.org", "@type": "Product", "@id": `${absoluteUrl(input.path)}#product`, url: absoluteUrl(input.path), name, description: plainText(input.description), image: images.map(image => absoluteUrl(image.url!)), sku: `${product._id || product.id || slug}:${color?._id || color?.id || slug}`, color: color?.nameColor, brand: { "@type": "Brand", name: BRAND },
    ...(Number.isFinite(price) && price > 0 ? { offers: { "@type": "Offer", url: absoluteUrl(input.path), priceCurrency: "INR", price, itemCondition: "https://schema.org/NewCondition", availability: `https://schema.org/${inStock ? "InStock" : "OutOfStock"}`, seller: { "@id": `${SITE_URL}/#organization` } } } : {}),
    ...(Number(product.ratings?.count) > 0 && Number(product.ratings?.average) > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: product.ratings!.average, reviewCount: product.ratings!.count } } : {}) };
  return { input, schema };
}
