import type { ReactNode } from "react";
import { offerSeo } from "@/lib/catalog-seo";
import { pageMetadata, webpageSchema } from "@/lib/seo";
import StructuredData from "@/src/components/Storefront/StructuredData";
type Props = { params: Promise<{slug:string}>; children:ReactNode };
export async function generateMetadata({params}:Props) {return pageMetadata(await offerSeo((await params).slug));}
export default async function Layout({params,children}:Props) {const seo=await offerSeo((await params).slug);return <><StructuredData data={webpageSchema(seo)}/>{children}</>;}
