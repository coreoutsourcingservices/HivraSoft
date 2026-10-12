import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata({"path":"/search","title":"Search Products","noindex":true});
export default function Layout({ children }: { children: ReactNode }) { return children; }
