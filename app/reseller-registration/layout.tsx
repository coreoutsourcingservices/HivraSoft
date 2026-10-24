import type { ReactNode } from "react";
import { categorySeo } from "@/lib/catalog-seo";
import { pageMetadata } from "@/lib/seo";
import CategorySeoLayout from "@/src/components/Storefront/CategorySeoLayout";

export const dynamic = "force-dynamic";
const path = "/reseller-registration";
export async function generateMetadata() { return pageMetadata(await categorySeo(path)); }
export default function Layout({ children }: { children: ReactNode }) {
  return <CategorySeoLayout path={path}>{children}</CategorySeoLayout>;
}
