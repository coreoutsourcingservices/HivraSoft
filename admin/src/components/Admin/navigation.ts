"use client";
import { usePathname as nextPathname, useRouter as nextRouter } from "next/navigation";
export { useSearchParams, useParams, notFound, redirect } from "next/navigation";
export function usePathname() { return nextPathname().replace(/^\/superadmin(?=\/|$)/, "/admin"); }
export function useRouter() {
 const router = nextRouter(); const pathname = nextPathname();
 const path = (href: string) => pathname.startsWith("/superadmin") ? href.replace(/^\/admin(?=\/|$|\?)/, "/superadmin") : href;
 return { ...router, push: (href: string, options?: Parameters<typeof router.push>[1]) => router.push(path(href), options), replace: (href: string, options?: Parameters<typeof router.replace>[1]) => router.replace(path(href), options) };
}
