import { cache } from "react";
import { getCachedActiveCategoryTree } from "@/src/services/storefront-fast";
import { findCategoryRoot, resolveCategoryPath } from "@/src/services/categories";
import { getOfferBySlug } from "@/src/services/offers";
import { descriptiveTitle, seoDescription, type SeoInput } from "./seo";
import { CATEGORY_SEO_COPY } from "./category-seo-copy";

export const categorySeo = cache(async (path: string): Promise<SeoInput> => {
  const [department, ...parts] = path.replace(/^\//, "").split("/").filter(Boolean);
  const tree = await getCachedActiveCategoryTree();
  const root = findCategoryRoot(tree, department);
  const node = root && (resolveCategoryPath(root, parts)?.at(-1) || (parts.length === 0 ? root : undefined));
  const title = node?.name || parts.at(-1)?.replace(/-/g, " ") || department;
  const copy = CATEGORY_SEO_COPY[path];
  const fallback = copy?.[0] === node?.name ? copy : undefined;
  return { path, preserveDescription: Boolean(node?.metaDescription), title: node?.metaTitle || fallback?.[1] || descriptiveTitle(`${title} Innerwear`, ["Styles to Shop Online", "& Everyday Essentials Online"]), description: node?.metaDescription || seoDescription(node?.description, fallback?.[2] || `Shop ${title} at HivraSoft. Compare available styles, colours and sizes, and view product details online.`), image: node?.images[0]?.url };
});
export const offerSeo = cache(async (slug: string): Promise<SeoInput> => {
  const offer = await getOfferBySlug(slug);
  const path = /^buy-\d+-get-\d+(?:-free)?$/.test(slug) ? `/${slug}` : `/offers/${slug}`;
  return { path, title: offer?.name || slug.replace(/-/g, " "), description: offer ? `Explore the ${offer.name} offer at HivraSoft. Shop eligible innerwear styles and available sizes.` : "Discover HivraSoft innerwear offers and comfortable everyday essentials.", image: offer?.image?.url };
});
