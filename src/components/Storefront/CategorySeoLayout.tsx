import type { ReactNode } from "react";
import { categoryPageData } from "@/lib/catalog-seo";
import { webpageSchema } from "@/lib/seo";
import StructuredData from "./StructuredData";
import CategoryDescription from "./CategoryDescription";

export default async function CategorySeoLayout({ path, children }: { path: string; children: ReactNode }) {
  const { category, seo } = await categoryPageData(path);
  return <>
    <StructuredData data={webpageSchema(seo)} />
    {children}
    {category?.description?.trim() && <CategoryDescription title={category.name} html={category.description} pagePath={path} />}
  </>;
}
