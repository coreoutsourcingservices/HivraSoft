import NextLink from "next/link";
import type { ComponentProps } from "react";

// Storefront previews cross an application boundary and need a full navigation.
export default function ZoneLink(props: ComponentProps<typeof NextLink>) {
  const { href, prefetch, replace, scroll, ...rest } = props;
  if (typeof href === "string" && href.startsWith("/") && !/^\/admin(?:\/|$|\?)/.test(href)) {
    const origin = (process.env.NEXT_PUBLIC_STOREFRONT_URL || "http://localhost:3000").replace(/\/$/, "");
    return <a {...rest} href={`${origin}${href}`} />;
  }
  return <NextLink {...props} />;
}
