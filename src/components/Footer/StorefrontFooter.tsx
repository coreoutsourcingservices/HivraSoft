"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function StorefrontFooter({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Blog pages already render their own footer; admin and landing keep their layouts.
  if (
    pathname === "/admin" || pathname.startsWith("/admin/") ||
    pathname === "/blog" || pathname.startsWith("/blog/") ||
    pathname === "/landing"
  ) return null;

  return children;
}
