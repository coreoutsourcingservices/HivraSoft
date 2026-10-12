import type { ReactNode } from "react";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata({"path":"/wishlist","title":"My Wishlist","noindex":true});
export default function Layout({ children }: { children: ReactNode }) { return children; }
