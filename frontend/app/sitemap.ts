import { connection } from "next/server";
import type { MetadataRoute } from "next";
import { buildSitemap, sitemapFetch } from "@/lib/sitemap-data";
export const revalidate=300;
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
  // Fetch live catalog data on requests; builds must not require a running backend.
  await connection();
  const [products,categories,first,offers]=await Promise.all([
    sitemapFetch("/api/products/active"),sitemapFetch("/api/categories/tree?active=true"),sitemapFetch("/api/blogs?page=1&limit=50&sort=latest"),sitemapFetch("/api/offers"),
  ]);
  const blogs=[...(first.blogs||[])];
  // The public blog API caps page size at 50; follow pagination, never silently truncate.
  const totalPages=Number(first.pagination?.totalPages||1);
  if(totalPages>900)throw new Error("Sitemap needs splitting before exceeding 50,000 URLs.");
  for(let page=2;page<=totalPages;page++){
    const next=await sitemapFetch(`/api/blogs?page=${page}&limit=50&sort=latest`);blogs.push(...(next.blogs||[]));
  }
  const result=buildSitemap(products.products||products.data||[],categories.categories||categories.data||categories,blogs,offers.offers||[]);
  if(result.length>50000)throw new Error("Sitemap needs splitting before exceeding 50,000 URLs.");
  return result;
}
