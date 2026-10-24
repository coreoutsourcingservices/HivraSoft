import type { StorefrontCategoryNode } from "@/src/services/categories";
import { findCategoryRoot, resolveCategoryPath } from "@/src/services/categories";
import { descriptiveTitle, plainText, seoDescription, type SeoInput } from "./seo";
import { CATEGORY_SEO_COPY } from "./category-seo-copy";
import { STATIC_SEO } from "./seo-pages";

const ROOT_ALIASES: Record<string, string[]> = {
  "new-launch": ["new-innerwear-online", "new-launch", "new-launches", "new-arrivals", "new-arrival"],
  "new-innerwear-online": ["new-innerwear-online", "new-launch", "new-launches", "new-arrivals", "new-arrival"],
  "bundle-pricing": ["bundle-pricing", "bundle-price", "bundle-prices", "bundle"],
};

const STATIC_CATEGORY_NAMES: Record<string, string> = {
  "/bundle-pricing": "Bundle Pricing",
  "/new-launch": "New Launch",
  "/new-innerwear-online": "New Launch",
  "/send-your-bra": "Send your Bra",
  "/reseller-registration": "Reseller Registration",
};

export function categoryForPath(tree: StorefrontCategoryNode[], path: string) {
  const [department, ...parts] = path.split("/").filter(Boolean);
  const root = (ROOT_ALIASES[department] || [department])
    .map((slug) => findCategoryRoot(tree, slug)).find(Boolean);
  if (!root) return undefined;
  if (!parts.length) return root;
  return resolveCategoryPath(root, parts)?.at(-1);
}

/** Saved category SEO takes priority; blank fields retain readable fallbacks. */
export function categorySeoFromTree(tree: StorefrontCategoryNode[], path: string): SeoInput {
  const node = categoryForPath(tree, path);
  const name = node?.name || path.split("/").filter(Boolean).at(-1)?.replace(/-/g, " ") || "Collection";
  const copy = CATEGORY_SEO_COPY[path];
  const fallback = copy?.[0] === node?.name ? copy : undefined;
  const staticCopy = !node || node.name === STATIC_CATEGORY_NAMES[path] ? STATIC_SEO[path] : undefined;
  const metaTitle = plainText(node?.metaTitle);
  const metaDescription = plainText(node?.metaDescription);
  return {
    path,
    title: metaTitle || fallback?.[1] || staticCopy?.title
      || descriptiveTitle(name + " Innerwear", ["Styles to Shop Online", "& Everyday Essentials Online"]),
    preserveTitle: Boolean(metaTitle),
    description: metaDescription || seoDescription(node?.description,
      fallback?.[2] || staticCopy?.description
      || `Shop ${name} at HivraSoft. Compare available styles, colours and sizes, and view product details online.`),
    preserveDescription: Boolean(metaDescription),
    image: node?.images[0]?.url,
  };
}
