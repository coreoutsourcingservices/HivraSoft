import type { StorefrontCategoryNode } from "@/src/services/categories";
import { findCategoryRoot, resolveCategoryPath } from "@/src/services/categories";
import { plainText, type SeoInput } from "./seo";
import { STATIC_SEO } from "./seo-pages";

const ROOT_ALIASES: Record<string, string[]> = {
  "new-launch": ["new-innerwear-online", "new-launch", "new-launches", "new-arrivals", "new-arrival"],
  "new-innerwear-online": ["new-innerwear-online", "new-launch", "new-launches", "new-arrivals", "new-arrival"],
  "bundle-pricing": ["bundle-pricing", "bundle-price", "bundle-prices", "bundle"],
};

export function categoryForPath(tree: StorefrontCategoryNode[], path: string) {
  const [department, ...parts] = path.split("/").filter(Boolean);
  const root = (ROOT_ALIASES[department] || [department])
    .map((slug) => findCategoryRoot(tree, slug)).find(Boolean);
  if (!root) return undefined;
  if (!parts.length) return root;
  return resolveCategoryPath(root, parts)?.at(-1);
}

/** Saved category SEO takes priority; each blank field uses the category name. */
export function categorySeoFromTree(tree: StorefrontCategoryNode[], path: string): SeoInput {
  const node = categoryForPath(tree, path);
  const name = node?.name || path.split("/").filter(Boolean).at(-1)?.replace(/-/g, " ") || "Collection";
  const staticCopy = !node ? STATIC_SEO[path] : undefined;
  const metaTitle = plainText(node?.metaTitle);
  const metaDescription = plainText(node?.metaDescription);
  return {
    path,
    title: metaTitle || staticCopy?.title || name,
    preserveTitle: Boolean(node),
    description: metaDescription || staticCopy?.description || name,
    preserveDescription: Boolean(node),
    image: node?.images[0]?.url,
  };
}
