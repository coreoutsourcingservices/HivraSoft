import type { Metadata } from "next";

export const SITE_URL = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.hivrasoft.com").origin;
export const SITE_NAME = "HivraSoft";
export const DEFAULT_DESCRIPTION = "Shop HivraSoft innerwear, lingerie and everyday essentials for men and women. Explore comfortable styles, new arrivals and accessories online in India.";
export function plainText(value: unknown): string {
  return typeof value === "string" ? value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim() : "";
}
export function description(value: unknown, fallback = DEFAULT_DESCRIPTION): string {
  const text = plainText(value) || fallback;
  if (text.length <= 160) return text;
  return text.slice(0, 157).replace(/\s+\S*$/, "").trimEnd() + "…";
}
export function absoluteUrl(path: string): string {
  return new URL(path, `${SITE_URL}/`).href;
}
export type SeoInput = { path:string; title:string; description?:string; image?:string; canonical?:string; noindex?:boolean; nofollow?:boolean; keywords?:string[]; article?:boolean; publishedTime?:string; modifiedTime?:string; author?:string; ogTitle?:string; ogDescription?:string; ogImage?:string; twitterTitle?:string; twitterDescription?:string; twitterImage?:string };
export function pageMetadata(input: SeoInput): Metadata {
  const title = plainText(input.title) || SITE_NAME;
  const fullTitle = /hivra\s*soft/i.test(title) ? title : `${title} | ${SITE_NAME}`;
  const summary = description(input.description);
  let canonical = absoluteUrl(input.path);
  if (input.canonical) {
    try { const url=new URL(input.canonical, SITE_URL); if (url.protocol === "https:" || url.protocol === "http:") canonical=url.href; } catch { /* Keep self canonical for invalid API values. */ }
  }
  const image = absoluteUrl(input.image || "/images/logos/hivra-soft-logo.png");
  return {
    title: { absolute: fullTitle }, description: summary, alternates: { canonical },
    keywords: input.keywords?.filter(Boolean),
    robots: { index: !input.noindex, follow: !input.nofollow, googleBot: { index: !input.noindex, follow: !input.nofollow, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
    openGraph: { type: input.article ? "article" : "website", siteName: SITE_NAME, locale: "en_IN", url: canonical, title: input.ogTitle || fullTitle, description: description(input.ogDescription || summary), images: [{ url: input.ogImage ? absoluteUrl(input.ogImage) : image, alt: title }], ...(input.article ? { publishedTime: input.publishedTime, modifiedTime: input.modifiedTime, authors: input.author ? [input.author] : undefined } : {}) },
    twitter: { card: "summary_large_image", title: input.twitterTitle || fullTitle, description: description(input.twitterDescription || summary), images: [input.twitterImage ? absoluteUrl(input.twitterImage) : image] },
  };
}
export function breadcrumbSchema(items: Array<{ name:string; path:string }>) {
  return { "@context":"https://schema.org", "@type":"BreadcrumbList", itemListElement: items.map((item,index)=>({ "@type":"ListItem", position:index+1, name:item.name, item:absoluteUrl(item.path) })) };
}
