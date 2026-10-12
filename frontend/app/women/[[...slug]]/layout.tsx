import type { ReactNode } from "react";
import { categorySeo } from "@/lib/category-seo";
import JsonLd from "@/src/components/Seo/JsonLd";
type Props={children:ReactNode;params:Promise<{slug?:string[]}>};
export async function generateMetadata({params}:Props){return (await categorySeo("women",((await params).slug||[]).map(part=>part.trim().toLowerCase()).join("/"))).metadata;}
export default async function Layout({children,params}:Props){const seo=await categorySeo("women",((await params).slug||[]).map(part=>part.trim().toLowerCase()).join("/"));return <><h1 className="sr-only">{seo.breadcrumbs.itemListElement.at(-1)?.name}</h1><JsonLd data={seo.breadcrumbs}/>{children}</>;}
