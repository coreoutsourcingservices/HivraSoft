"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/** Scope desktop sizing to public pages, including client-side navigation. */
export default function StorefrontViewport({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const viewportRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (isAdmin) return;

    const updateScale = () => {
      const width = document.documentElement.clientWidth;
      viewportRef.current?.style.setProperty(
        "--storefront-scale",
        String(width / 1366),
      );
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    const observer = new ResizeObserver(updateScale);
    observer.observe(document.documentElement);
    return () => {
      window.removeEventListener("resize", updateScale);
      observer.disconnect();
    };
  }, [isAdmin]);

  return (
    <div ref={viewportRef} className={isAdmin ? undefined : "storefront-viewport"} style={{ display: "contents" }}>
      {children}
    </div>
  );
}
