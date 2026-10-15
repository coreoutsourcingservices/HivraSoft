import type { ReactNode } from "react";
import { categorySeo } from "@/lib/catalog-seo";
import { pageMetadata, webpageSchema, breadcrumbs } from "@/lib/seo";
import StructuredData from "@/src/components/Storefront/StructuredData";
type Props = { params: Promise<{ slug?: string[] }>; children: ReactNode };
async function getSeo(params: Props["params"]) {
  const value = await params;
  return categorySeo("/men" + (value.slug?.length ? "/" + value.slug.join("/") : ""));
}
export async function generateMetadata({ params }: Props) { return pageMetadata(await getSeo(params)); }
export default async function Layout({ params, children }: Props) {
  const seo = await getSeo(params);
  return <><StructuredData data={[webpageSchema(seo), breadcrumbs([{name:"Home",path:"/"},{name:seo.title,path:seo.path}])]} />{children}</>;
}
