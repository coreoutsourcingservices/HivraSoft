import type { ReactNode } from "react";
import { pageMetadata, webpageSchema } from "@/lib/seo";
import { STATIC_SEO } from "@/lib/seo-pages";
import StructuredData from "@/src/components/Storefront/StructuredData";
const seo = STATIC_SEO["/bundle-pricing"];
export const metadata = pageMetadata(seo);
export default function Layout({ children }: { children: ReactNode }) {
  return <><StructuredData data={webpageSchema(seo)} />{children}</>;
}
