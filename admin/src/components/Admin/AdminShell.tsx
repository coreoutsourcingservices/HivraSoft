"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import AdminConfirmProvider from "./AdminConfirmProvider";
import { AdminUserProvider, type AdminIdentity } from "./AdminUserContext";

export default function AdminShell({
  children,
  user,
}: {
  children: ReactNode;
  user: AdminIdentity | null;
}) {
  const pathname = usePathname();
  const [menuRoute, setMenuRoute] = useState<string | null>(null);
  const menuOpen = menuRoute === pathname;
  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    const mobile = window.matchMedia("(max-width: 1023px)");
    if (mobile.matches) document.body.style.overflow = "hidden";
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuRoute(null); };
    const resize = () => { if (!mobile.matches) setMenuRoute(null); };
    window.addEventListener("keydown", close);
    mobile.addEventListener("change", resize);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", close); mobile.removeEventListener("change", resize); };
  }, [menuOpen]);

  return (
    <AdminUserProvider user={user}>
      <AdminConfirmProvider />
      <div
      className="
        min-h-screen
        admin-shell
        bg-[#F7F3EF]
        text-[#211A18]
      "
    >
      <div className="relative z-[60] flex h-16 items-center justify-between bg-[#211A18] px-4 text-white lg:hidden">
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
      {menuOpen && <button type="button" aria-label="Close navigation" className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={()=>setMenuRoute(null)}/>}
      <div
        id="admin-navigation"
        className={`${menuOpen ? "block" : "hidden"} fixed bottom-0 left-0 top-16 z-50 w-[min(85vw,320px)] overflow-y-auto overscroll-contain bg-[#211A18] shadow-xl lg:inset-y-0 lg:block lg:w-[270px] lg:shadow-none`}
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
            admin-content
            min-w-0
            px-4
            py-5
            md:px-8
            md:py-8
          "
        >
          {children}
        </main>
      </div>
    </div>
    </AdminUserProvider>
  );
}
