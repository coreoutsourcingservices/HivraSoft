export type SeoImageLike = {
  alt?: string | null;
};

export type SeoAnalyzerInput = {
  focusKeyword?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  slug?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  images?: SeoImageLike[] | null;
};

export type SeoCheck = {
  label: string;
  pass: boolean;
  points: number;
  guidance: string;
};

export type SeoAnalysisResult = {
  score: number;
  basic: SeoCheck[];
  additional: SeoCheck[];
  titleReadability: SeoCheck[];
  wordCount: number;
  keywordOccurrences: number;
  keywordDensity: number;
};

const POWER_WORDS = [
  "best",
  "amazing",
  "ultimate",
  "exclusive",
  "premium",
  "perfect",
  "powerful",
  "easy",
  "proven",
  "essential",
  "top",
  "new",
  "special",
  "complete",
  "affordable",
  "popular",
  "trending",
  "luxury",
  "smart",
  "must have",
  "sale",
  "save",
  "guide",
  "advanced",
  "awesome",
  "beautiful",
  "bonus",
  "breakthrough",
  "cheap",
  "comfortable",
  "effective",
  "fast",
  "free",
  "great",
  "hot",
  "improved",
  "incredible",
  "limited",
  "modern",
  "natural",
  "original",
  "professional",
  "recommended",
  "simple",
  "strong",
  "successful",
  "trusted",
  "unique",
  "valuable",
  "winner",
];

export function stripHtml(value: unknown): string {
  return String(value || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function countWords(value: unknown): number {
  const clean = stripHtml(value);
  return clean ? clean.split(/\s+/).filter(Boolean).length : 0;
}

export function normalizeKeyword(value: unknown): string {
  return stripHtml(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[’'`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function hasKeyword(value: unknown, keyword: unknown): boolean {
  const cleanKeyword = normalizeKeyword(keyword);
  const cleanValue = normalizeKeyword(value);
  if (!cleanKeyword || !cleanValue) return false;

  const pattern = `(?:^|\\s)${escapeRegExp(cleanKeyword).replace(/\\ /g, "\\s+")}(?=\\s|$)`;
  try {
    return new RegExp(pattern, "u").test(cleanValue);
  } catch {
    return cleanValue.includes(cleanKeyword);
  }
}

export function keywordOccurrences(value: unknown, keyword: unknown): number {
  const cleanKeyword = normalizeKeyword(keyword);
  const cleanValue = normalizeKeyword(value);
  if (!cleanKeyword || !cleanValue) return 0;

  const pattern = `(?:^|\\s)${escapeRegExp(cleanKeyword).replace(/\\ /g, "\\s+")}(?=\\s|$)`;
  try {
    return (cleanValue.match(new RegExp(pattern, "gu")) || []).length;
  } catch {
    return 0;
  }
}

export function keywordDensity(value: unknown, keyword: unknown): {
  occurrences: number;
  density: number;
  wordCount: number;
} {
  const wordCount = countWords(value);
  const occurrences = keywordOccurrences(value, keyword);

  // Custom HivraSoft rule requested by admin:
  // 10 occurrences = 1.00%
  // 20 occurrences = 2.00%
  // Green only from 1.00% through 2.00%.
  const density = Number((occurrences / 10).toFixed(2));

  return { occurrences, density, wordCount };
}

function getHeadingText(html: unknown): string {
  const source = String(html || "");
  const headings: string[] = [];
  const headingRegex = /<h[2-6]\b[^>]*>([\s\S]*?)<\/h[2-6]>/gi;
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(source))) {
    headings.push(stripHtml(match[1] || ""));
  }

  return headings.join(" ");
}

export function keywordInHeadings(html: unknown, keyword: unknown): boolean {
  return hasKeyword(getHeadingText(html), keyword);
}

function getContentImageAlts(html: unknown): string[] {
  const source = String(html || "");
  const alts: string[] = [];
  const imageRegex = /<img\b[^>]*\balt\s*=\s*(["'])(.*?)\1[^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = imageRegex.exec(source))) {
    alts.push(String(match[2] || ""));
  }

  return alts;
}

export function keywordInImageAlt(
  images: SeoImageLike[] | null | undefined,
  html: unknown,
  keyword: unknown
): boolean {
  const imageAlts = Array.isArray(images)
    ? images.map((image) => String(image?.alt || ""))
    : [];
  const contentAlts = getContentImageAlts(html);
  return [...imageAlts, ...contentAlts].some((alt) => hasKeyword(alt, keyword));
}

type SeoLink = { href: string; rel: string };

function getLinks(html: unknown): SeoLink[] {
  const source = String(html || "");
  const links: SeoLink[] = [];
  const anchorRegex = /<a\b([^>]*)href=["']([^"']+)["']([^>]*)>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorRegex.exec(source))) {
    const attributes = `${match[1] || ""} ${match[3] || ""}`;
    const relMatch = attributes.match(/\brel=["']([^"']*)["']/i);
    links.push({
      href: String(match[2] || "").trim(),
      rel: String(relMatch?.[1] || "").toLowerCase(),
    });
  }

  return links;
}

function internalHosts(): Set<string> {
  const hosts = new Set([
    "hivrasoft.com",
    "www.hivrasoft.com",
    "hivrasoft.zyvora.com",
  ]);

  if (typeof window !== "undefined" && window.location?.hostname) {
    hosts.add(window.location.hostname.toLowerCase());
  }

  return hosts;
}

function isInternalLink(href: string): boolean {
  const value = String(href || "").trim();
  if (!value) return false;
  if (/^(\/|\.\/|\.\.\/)/.test(value)) return true;
  if (!/^https?:\/\//i.test(value)) return false;

  try {
    const host = new URL(value).hostname.toLowerCase();
    if (internalHosts().has(host)) return true;
    return host.endsWith(".hivrasoft.com");
  } catch {
    return false;
  }
}

export function hasExternalLinks(html: unknown): boolean {
  return getLinks(html).some(
    (link) => /^https?:\/\//i.test(link.href) && !isInternalLink(link.href)
  );
}

export function hasInternalLinks(html: unknown): boolean {
  return getLinks(html).some((link) => isInternalLink(link.href));
}

export function hasPowerWord(title: unknown): boolean {
  const normalizedTitle = normalizeKeyword(title);
  return POWER_WORDS.some((word) => hasKeyword(normalizedTitle, word));
}

export function titleHasNumber(title: unknown): boolean {
  return /\d/.test(String(title || ""));
}

export function keywordInFirst10Percent(content: unknown, keyword: unknown): boolean {
  const cleanText = stripHtml(content);
  if (!cleanText || !normalizeKeyword(keyword)) return false;
  const words = cleanText.split(/\s+/).filter(Boolean);
  if (!words.length) return false;
  const firstTenPercent = words
    .slice(0, Math.max(1, Math.ceil(words.length * 0.1)))
    .join(" ");
  return hasKeyword(firstTenPercent, keyword);
}

export function keywordInTitle(title: unknown, keyword: unknown): boolean {
  return hasKeyword(title, keyword);
}

export function keywordInMeta(meta: unknown, keyword: unknown): boolean {
  return hasKeyword(meta, keyword);
}

export function keywordInSlug(slug: unknown, keyword: unknown): boolean {
  return hasKeyword(String(slug || "").replace(/[-_]+/g, " "), keyword);
}

function keywordNearBeginningOfTitle(title: unknown, keyword: unknown): boolean {
  const cleanTitle = normalizeKeyword(title);
  const cleanKeyword = normalizeKeyword(keyword);
  if (!cleanTitle || !cleanKeyword) return false;

  const index = cleanTitle.indexOf(cleanKeyword);
  if (index < 0) return false;

  const maxStartIndex = Math.ceil(cleanTitle.length * 0.3);
  return index <= maxStartIndex;
}

function makeCheck(
  pass: boolean,
  passedLabel: string,
  failedLabel: string,
  points: number,
  guidance: string
): SeoCheck {
  return {
    pass,
    label: pass ? passedLabel : failedLabel,
    points,
    guidance,
  };
}

export function analyzeProductSeo(input: SeoAnalyzerInput): SeoAnalysisResult {
  const keyword = String(input.focusKeyword || "").trim();
  const seoTitle = String(input.seoTitle || "").trim();
  const seoDescription = String(input.seoDescription || "").trim();
  const slug = String(input.slug || "").trim();
  const shortDescription = String(input.shortDescription || "");
  const description = String(input.description || "");
  const htmlContent = `${shortDescription} ${description}`;
  const plainContent = stripHtml(htmlContent);
  const densityInfo = keywordDensity(plainContent, keyword);

  const titleKeywordPass = keywordInTitle(seoTitle, keyword);
  const metaKeywordPass = keywordInMeta(seoDescription, keyword);
  const slugKeywordPass = keywordInSlug(slug, keyword);
  const firstTenPass = keywordInFirst10Percent(plainContent, keyword);
  const contentKeywordPass = hasKeyword(plainContent, keyword);
  const contentLengthPass = densityInfo.wordCount >= 600 && densityInfo.wordCount <= 2500;

  let contentLengthPassedLabel = `Content is ${densityInfo.wordCount} words long. Good job!`;
  let contentLengthFailedLabel = `Content is ${densityInfo.wordCount} words long. Add more content. Aim for at least 600 words.`;
  if (densityInfo.wordCount > 2500) {
    contentLengthFailedLabel = `Content is ${densityInfo.wordCount} words long. Try to keep it under 2500 words.`;
  }

  const basic: SeoCheck[] = [
    makeCheck(
      titleKeywordPass,
      "Hurray! You're using Focus Keyword in the SEO Title.",
      "Add Focus Keyword to the SEO title.",
      10,
      "Add the exact Focus Keyword naturally inside the SEO Title."
    ),
    makeCheck(
      metaKeywordPass,
      "Focus Keyword used inside SEO Meta Description.",
      "Add Focus Keyword to your SEO Meta Description.",
      10,
      "Add the Focus Keyword naturally inside the SEO Meta Description."
    ),
    makeCheck(
      slugKeywordPass,
      "Focus Keyword used in the URL.",
      "Use Focus Keyword in the URL.",
      8,
      "Use the Focus Keyword in the product slug. Spaces and hyphens are normalized while checking."
    ),
    makeCheck(
      firstTenPass,
      "Focus Keyword appears in the first 10% of the content.",
      "Use Focus Keyword at the beginning of your content.",
      8,
      "Use the Focus Keyword naturally within the first 10% of the product content."
    ),
    makeCheck(
      contentKeywordPass,
      "Focus Keyword found in the content.",
      "Use Focus Keyword in the content.",
      8,
      "Use the Focus Keyword naturally in the product description/content."
    ),
    makeCheck(
      contentLengthPass,
      contentLengthPassedLabel,
      contentLengthFailedLabel,
      6,
      "Keep the product content between 600 and 2500 words."
    ),
  ];

  const headingPass = keywordInHeadings(description, keyword);
  const imageAltPass = keywordInImageAlt(input.images, htmlContent, keyword);
  const densityPass = Boolean(keyword) && densityInfo.density >= 1 && densityInfo.density <= 2;
  const slugAvailable = Boolean(slug);
  const urlValue = slugAvailable ? `/product/${slug}` : "";
  const shortUrlPass = slugAvailable && urlValue.length <= 75;
  const externalPass = hasExternalLinks(htmlContent);
  const internalPass = hasInternalLinks(htmlContent);
  const focusKeywordPass = Boolean(keyword);

  const occurrenceText = `${densityInfo.occurrences} time${densityInfo.occurrences === 1 ? "" : "s"}`;

  let densityPassedLabel =
    `Keyword Density is ${densityInfo.density.toFixed(2)}%, ` +
    `the Focus Keyword and combination appears ${occurrenceText}. Good job!`;

  let densityFailedLabel =
    "Keyword Density is 0.00%, the Focus Keyword and combination appears 0 times. " +
    "Increase keyword usage. Keep Keyword Density between 1% and 2%.";

  if (keyword && densityInfo.occurrences > 0) {
    if (densityInfo.density < 1) {
      densityFailedLabel =
        `Keyword Density is ${densityInfo.density.toFixed(2)}%, ` +
        `the Focus Keyword and combination appears ${occurrenceText}. ` +
        "Increase keyword usage. Keep Keyword Density between 1% and 2%.";
    } else if (densityInfo.density > 2) {
      densityFailedLabel =
        `Keyword Density is ${densityInfo.density.toFixed(2)}%, ` +
        `the Focus Keyword and combination appears ${occurrenceText}. ` +
        "Reduce keyword usage. Keep Keyword Density between 1% and 2%.";
    }
  }

  const urlPassedLabel = `URL is ${urlValue.length} characters long. Kudos!`;
  const urlFailedLabel = !slugAvailable
    ? "URL unavailable. Add a short URL."
    : `URL is ${urlValue.length} characters long. Keep it within 75 characters.`;

  const additional: SeoCheck[] = [
    makeCheck(
      headingPass,
      "Focus Keyword found in the subheading(s).",
      "Use Focus Keyword in subheading(s) like H2, H3, H4, etc.",
      5,
      "Add the Focus Keyword to at least one H2, H3, H4, H5 or H6 heading."
    ),
    makeCheck(
      imageAltPass,
      "Focus Keyword found in image alt attribute(s).",
      "Add an image with your Focus Keyword as alt text.",
      4,
      "Add the Focus Keyword naturally to at least one product image ALT or content image ALT."
    ),
    makeCheck(
      densityPass,
      densityPassedLabel,
      densityFailedLabel,
      5,
      "Keep Keyword Density between 1% and 2%. Under 1% or over 2% is an error."
    ),
    makeCheck(
      shortUrlPass,
      urlPassedLabel,
      urlFailedLabel,
      3,
      "Use a clean product slug and keep /product/{slug} within about 75 characters."
    ),
    makeCheck(
      externalPass,
      "Great! You are linking to external resources.",
      "Link out to external resources.",
      5,
      "Add a relevant external link to a trusted resource in the product content."
    ),
    makeCheck(
      internalPass,
      "You are linking to other resources on your website which is great.",
      "Add internal links in your content.",
      5,
      "Add a relative HivraSoft link such as /product/..., /category/... or /blog/..., or an absolute HivraSoft URL."
    ),
    makeCheck(
      focusKeywordPass,
      "Focus Keyword is set for this content.",
      "Set a Focus Keyword for this content.",
      3,
      "Enter one clear primary Focus Keyword for this product/color."
    ),
  ];

  const nearBeginningPass = keywordNearBeginningOfTitle(seoTitle, keyword);
  const powerWordPass = hasPowerWord(seoTitle);
  const numberPass = titleHasNumber(seoTitle);

  const titleReadability: SeoCheck[] = [
    makeCheck(
      nearBeginningPass,
      "Focus Keyword used at the beginning of SEO title.",
      "Use the Focus Keyword near the beginning of SEO title.",
      8,
      "Place the Focus Keyword at the start or within roughly the first 30% of the SEO Title."
    ),
    makeCheck(
      powerWordPass,
      "Your title contains at least 1 power word.",
      "Your title doesn't contain a power word. Add at least one.",
      8,
      "Use a relevant power word such as Best, Premium, Ultimate, Exclusive, Complete, Smart or Guide."
    ),
    makeCheck(
      numberPass,
      "You are using a number in your SEO title.",
      "Your SEO title doesn't contain a number.",
      4,
      "Add a useful number when it fits naturally, for example 5, 10, 2026 or 50%."
    ),
  ];

  const checks = [...basic, ...additional, ...titleReadability];
  const score = Math.max(
    0,
    Math.min(
      100,
      checks.reduce((total, check) => total + (check.pass ? check.points : 0), 0)
    )
  );

  return {
    score,
    basic,
    additional,
    titleReadability,
    wordCount: densityInfo.wordCount,
    keywordOccurrences: densityInfo.occurrences,
    keywordDensity: densityInfo.density,
  };
}
