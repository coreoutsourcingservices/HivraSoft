"use client";

import {
  usePathname,
} from "next/navigation";

import type {
  ReactNode,
} from "react";

export default function StorefrontFooter({
  children,
}: {
  children:
    ReactNode;
}) {
  const pathname =
    usePathname();

  /* =========================================================
     HIDE FOOTER

     Existing:
     - Admin
     - Blog
     - Landing

     Added:
     - Thanks
     - Account Thanks
  ========================================================= */

  if (
    pathname ===
      "/admin" ||
    pathname.startsWith(
      "/admin/",
    ) ||
    pathname ===
      "/blog" ||
    pathname.startsWith(
      "/blog/",
    ) ||
    pathname ===
      "/landing" ||
    pathname ===
      "/thanks" ||
    pathname.startsWith(
      "/thanks/",
    ) ||
    pathname ===
      "/account/thanks" ||
    pathname.startsWith(
      "/account/thanks/",
    )
  ) {
    return null;
  }

  return children;
}