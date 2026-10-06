type SeoImageLike = {
  alt?: unknown;
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

const stripHtml = (value: unknown): string =>
  String(value || "")
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

const normalize = (value: unknown): string =>
  stripHtml(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[’'`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const includesKeyword = (value: unknown, keyword: unknown): boolean => {
  const text = normalize(value);
  const phrase = normalize(keyword);
  if (!text || !phrase) return false;

  const pattern = `(?:^|\\s)${escapeRegExp(phrase).replace(/\\ /g, "\\s+")}(?=\\s|$)`;
  try {
    return new RegExp(pattern, "u").test(text);
  } catch {
    return text.includes(phrase);
  }
};

const countOccurrences = (value: unknown, keyword: unknown): number => {
  const text = normalize(value);
  const phrase = normalize(keyword);
  if (!text || !phrase) return 0;

  const pattern = `(?:^|\\s)${escapeRegExp(phrase).replace(/\\ /g, "\\s+")}(?=\\s|$)`;
  try {
    return (text.match(new RegExp(pattern, "gu")) || []).length;
  } catch {
    return 0;
  }
};

const getHeadingText = (html: unknown): string => {
  const source = String(html || "");
  const headings: string[] = [];
  const regex = /<h[2-6]\b[^>]*>([\s\S]*?)<\/h[2-6]>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(source))) headings.push(stripHtml(match[1] || ""));
  return headings.join(" ");
};

const getContentImageAlts = (html: unknown): string[] => {
  const source = String(html || "");
  const alts: string[] = [];
  const regex = /<img\b[^>]*\balt\s*=\s*(["'])(.*?)\1[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(source))) alts.push(String(match[2] || ""));
  return alts;
};

const getLinks = (html: unknown): string[] => {
  const source = String(html || "");
  const links: string[] = [];
  const regex = /<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(source))) links.push(String(match[1] || "").trim());
  return links;
};

const configuredInternalHosts = (): Set<string> => {
  const hosts = new Set([
    "hivrasoft.com",
    "www.hivrasoft.com",
    "hivrasoft.zyvora.com",
  ]);

  for (const raw of [process.env.FRONTEND_URL, process.env.SITE_URL, process.env.WEBSITE_URL]) {
    if (!raw) continue;
    try {
      hosts.add(new URL(String(raw)).hostname.toLowerCase());
    } catch {
      // Ignore malformed optional environment URLs.
    }
  }

  return hosts;
};

const isInternalLink = (href: string): boolean => {
  const value = String(href || "").trim();
  if (!value) return false;
  if (/^(\/|\.\/|\.\.\/)/.test(value)) return true;
  if (!/^https?:\/\//i.test(value)) return false;

  try {
    const host = new URL(value).hostname.toLowerCase();
    return configuredInternalHosts().has(host) || host.endsWith(".hivrasoft.com");
  } catch {
    return false;
  }
};

const hasPowerWord = (title: unknown): boolean => {
  const normalizedTitle = normalize(title);
  return POWER_WORDS.some((word) => includesKeyword(normalizedTitle, word));
};

const keywordNearBeginning = (title: unknown, keyword: unknown): boolean => {
  const cleanTitle = normalize(title);
  const cleanKeyword = normalize(keyword);
  if (!cleanTitle || !cleanKeyword) return false;
  const index = cleanTitle.indexOf(cleanKeyword);
  if (index < 0) return false;
  return index <= Math.ceil(cleanTitle.length * 0.3);
};

export const calculateSeoScore = (color: any): number => {
  const keyword = String(color?.focusKeyword || "").trim();
  const seoTitle = String(color?.seoTitle || "").trim();
  const seoDescription = String(color?.seoDescription || "").trim();
  const slug = String(color?.slugProduct || "").trim();
  const shortDescription = String(color?.shortDescription || "");
  const description = String(color?.description || "");
  const htmlContent = `${shortDescription} ${description}`;
  const plainContent = stripHtml(htmlContent);
  const words = plainContent ? plainContent.split(/\s+/).filter(Boolean) : [];
  const firstTenPercent = words
    .slice(0, Math.max(1, Math.ceil(words.length * 0.1)))
    .join(" ");

  const occurrences = countOccurrences(plainContent, keyword);
  // Custom HivraSoft rule requested by admin:
  // 10 occurrences = 1.00%
  // 20 occurrences = 2.00%
  const density = Number((occurrences / 10).toFixed(2));
  const headingText = getHeadingText(description);

  const imageAlts: string[] = Array.isArray(color?.images)
    ? color.images.map((image: SeoImageLike) => String(image?.alt || ""))
    : [];
  imageAlts.push(...getContentImageAlts(htmlContent));
  const imageAltPass = imageAlts.some((alt) => includesKeyword(alt, keyword));

  const links = getLinks(htmlContent);
  const internalLinkPass = links.some((href) => isInternalLink(href));
  const externalLinkPass = links.some(
    (href) => /^https?:\/\//i.test(href) && !isInternalLink(href)
  );

  const urlValue = slug ? `/product/${slug}` : "";

  const checks: Array<[boolean, number]> = [
    [includesKeyword(seoTitle, keyword), 10],
    [includesKeyword(seoDescription, keyword), 10],
    [includesKeyword(slug.replace(/[-_]+/g, " "), keyword), 8],
    [includesKeyword(firstTenPercent, keyword), 8],
    [includesKeyword(plainContent, keyword), 8],
    [words.length >= 600 && words.length <= 2500, 6],
    [includesKeyword(headingText, keyword), 5],
    [imageAltPass, 4],
    [Boolean(keyword) && density >= 1 && density <= 2, 5],
    [Boolean(slug) && urlValue.length <= 75, 3],
    [externalLinkPass, 5],
    [internalLinkPass, 5],
    [Boolean(keyword), 3],
    [keywordNearBeginning(seoTitle, keyword), 8],
    [hasPowerWord(seoTitle), 8],
    [/\d/.test(seoTitle), 4],
  ];

  const score = checks.reduce(
    (total, [pass, points]) => total + (pass ? points : 0),
    0
  );

  return Math.max(0, Math.min(100, score));
};
