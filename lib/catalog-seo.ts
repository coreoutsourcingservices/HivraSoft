import { cache } from "react";
import { getCachedActiveCategoryTree } from "@/src/services/storefront-fast";
import { categoryForPath, categorySeoFromTree } from "./category-metadata";
import { getOfferBySlug } from "@/src/services/offers";
import { type SeoInput } from "./seo";

export const categoryPageData = cache(async (path: string) => {
  const tree = await getCachedActiveCategoryTree();
  return { category: categoryForPath(tree, path), seo: categorySeoFromTree(tree, path) };
});
export const categorySeo = cache(async (path: string): Promise<SeoInput> => (await categoryPageData(path)).seo);
export const offerSeo = cache(async (slug: string): Promise<SeoInput> => {
  const offer = await getOfferBySlug(slug);
  const path = /^buy-\d+-get-\d+(?:-free)?$/.test(slug) ? `/${slug}` : `/offers/${slug}`;
  return { path, title: offer?.name || slug.replace(/-/g, " "), description: offer ? `Explore the ${offer.name} offer at HivraSoft. Shop eligible innerwear styles and available sizes.` : "Discover HivraSoft innerwear offers and comfortable everyday essentials.", image: offer?.image?.url };
});
