"use client";

import { useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import AdminConfirmProvider from "./AdminConfirmProvider";

export default function AdminShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [menuRoute, setMenuRoute] = useState<string | null>(null);
  const menuOpen = menuRoute === pathname;

  return (
    <>
      <AdminConfirmProvider />
      <div
      className="
        min-h-screen
        bg-[#F7F3EF]
        text-[#211A18]
      "
    >
      <div className="flex h-16 items-center justify-between bg-[#211A18] px-5 text-white lg:hidden">
        <span className="font-semibold">HIVRASOFT</span>
        <button
          type="button"
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
          title={menuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={menuOpen}
          aria-controls="admin-navigation"
          onClick={() => setMenuRoute(menuOpen ? null : pathname)}
          className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-white/10"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      <div
        id="admin-navigation"
        className={`${menuOpen ? "block" : "hidden"} lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-[270px]`}
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) setMenuRoute(null);
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") setMenuRoute(null);
        }}
      >
        <AdminSidebar key={pathname} />
      </div>

      <div
        className="
          min-h-screen
          min-w-0
          lg:pl-[270px]
        "
      >
        <AdminHeader />

        <main
          className="
            px-5
            py-7
            md:px-8
            md:py-8
          "
        >
          {children}
        </main>
      </div>
    </div>
    </>
  );
}
