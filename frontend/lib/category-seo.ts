import { cache } from "react";
import { notFound } from "next/navigation";
import { getCachedActiveCategoryTree } from "@/src/services/storefront-fast";
import { breadcrumbSchema, pageMetadata } from "./seo";

export const categorySeo = cache(async (rootSlug:string, path:string) => {
  const tree = await getCachedActiveCategoryTree();
  const root = tree.find(node => node.slug === rootSlug || (rootSlug === "accessories" && ["accessory","accessories"].includes(node.name.toLowerCase())));
  if (!root) notFound();
  const crumbs = [{name:"Home",path:"/"},{name:root.name,path:`/${rootSlug}`}];
  let current=root, url=`/${rootSlug}`;
  for (const part of path.split("/").filter(Boolean)) {
    const child=current.children.find(node=>node.slug===part);
    if (!child) notFound();
    current=child;url+=`/${encodeURIComponent(part)}`;crumbs.push({name:current.name,path:url});
  }
  return { metadata:pageMetadata({path:url,title:`${current.name} Collection - Shop Online`,description:current.description || `Shop the HivraSoft ${current.name} collection online. Explore available styles, colours and sizes to find comfortable essentials for your everyday wardrobe.`,image:current.images[0]?.url}), breadcrumbs:breadcrumbSchema(crumbs) };
});
