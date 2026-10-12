import type { MetadataRoute } from "next";
import { absoluteUrl, SITE_URL } from "./seo";
type Row = Record<string, any>;
const API=(process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/,"").replace(/\/api$/i,"");
export const STATIC_PATHS=["/","/new-launch","/new-innerwear-online","/bundle-pricing","/contact","/faq","/size-guide","/shipping","/returns","/privacy","/terms","/send-your-bra","/reseller-registration","/landing","/blog"];
export async function sitemapFetch(path:string):Promise<Row> {
  const response=await fetch(`${API}${path}`,{next:{revalidate:300},signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw new Error(`Sitemap source unavailable: ${path} (${response.status})`);
  return response.json();
}
function date(value:unknown):string|undefined {
  if(typeof value!=="string")return undefined;
  return Number.isNaN(Date.parse(value))?undefined:new Date(value).toISOString();
}
export function buildSitemap(products:Row[],categories:Row[],blogs:Row[],offers:Row[]):MetadataRoute.Sitemap {
  const entries:MetadataRoute.Sitemap=STATIC_PATHS.map(path=>({url:absoluteUrl(path),changeFrequency:path==="/"?"daily":"weekly",priority:path==="/"?1:0.6}));
  for(const product of products){
    if(product.isActive===false)continue;
    const colors=Array.isArray(product.colors)?product.colors.filter((color:Row)=>color.isActive!==false):[];
    const slugs=colors.map((color:Row)=>color.slugProduct).filter(Boolean);
    if(!slugs.length&&product.slug)slugs.push(product.slug);
    for(const slug of slugs)entries.push({url:absoluteUrl(`/product/${encodeURIComponent(slug)}`),lastModified:date(product.updatedAt),changeFrequency:"weekly",priority:0.8});
  }
  function walk(node:Row,path:string){
    if(node.isActive===false)return;
    entries.push({url:absoluteUrl(path),lastModified:date(node.updatedAt),changeFrequency:"weekly",priority:0.7});
    for(const child of node.children||[])walk(child,`${path}/${encodeURIComponent(child.slug)}`);
  }
  for(const root of categories){const slug=String(root.slug);if(["men","women","accessories","accessory"].includes(slug))walk(root,`/${slug==="accessory"?"accessories":slug}`);}
  for(const blog of blogs){
    if(!blog.slug || blog.seo?.robots?.index===false || (blog.status&&blog.status!=="PUBLISHED"))continue;
    const self=absoluteUrl(`/${encodeURIComponent(blog.slug)}`);
    if(blog.seo?.canonicalUrl){try{if(new URL(blog.seo.canonicalUrl,SITE_URL).href!==self)continue;}catch{/* Invalid canonical values fall back to self. */}}
    entries.push({url:self,lastModified:date(blog.updatedAt||blog.publishedAt||blog.createdAt),changeFrequency:"monthly",priority:0.7});
  }
  for(const offer of offers)if(offer.isActive!==false&&offer.offerType==="buy_get"&&offer.slug)entries.push({url:absoluteUrl(`/offers/${encodeURIComponent(offer.slug)}`),lastModified:date(offer.updatedAt),changeFrequency:"weekly",priority:0.6});
  return [...new Map(entries.map(entry=>[entry.url,entry])).values()];
}
