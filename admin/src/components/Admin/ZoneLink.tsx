"use client";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";
export default function ZoneLink(props: ComponentProps<typeof NextLink>) {
 const pathname = usePathname(); const href = props.href;
 if (typeof href === "string" && /^\/(admin|superadmin)(?:\/|$|\?)/.test(href)) return <NextLink {...props} href={pathname.startsWith("/superadmin") ? href.replace(/^\/admin(?=\/|$|\?)/, "/superadmin") : href.replace(/^\/admin(?=\/|$|\?)/, "") || "/"} />;
 if (typeof href === "string" && href.startsWith("/")) { const { prefetch, replace, scroll, ...rest } = props; return <a {...rest} href={(process.env.NEXT_PUBLIC_STOREFRONT_URL || "").replace(/\/$/, "") + href} />; }
 return <NextLink {...props} />;
}
