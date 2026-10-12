"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronRight, LoaderCircle, LogOut, Search, X } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const titles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/products": "Products",
  "/admin/products/new": "Add Product",
  "/admin/categories": "Categories",
  "/admin/pages": "Pages",
  "/admin/banners": "Banners",
  "/admin/orders": "Orders",
  "/admin/cart": "Cart Tracking",
  "/admin/wishlist": "Wishlist Tracking",
  "/admin/blog": "Blogs",
  "/admin/blog/add": "Add New Blog",
  "/admin/blog/categories": "Blog Categories",
  "/admin/blog/tags": "Blog Tags",
  "/admin/customers": "Customers",
  "/admin/notifications": "Notifications",
  "/admin/extra-add/automatic-discount": "Automatic Discount",
  "/admin/extra-add/discount-code": "Discount Code",
  "/admin/extra-add/tax": "Tax Settings",
  "/admin/extra-add/delivery-charge": "Delivery Charges",
  "/admin/homepage/prime-selection": "Prime Selection",
  "/admin/homepage/on-trend-picks": "On-Trend Picks",
  "/admin/homepage/always-in-it": "Always In It",
  "/admin/trash": "Trash",
  "/admin/settings": "Settings",
};

type SearchItem = {
  _id: string;
  name: string;
  subtitle?: string;
  type: string;
  adminUrl: string;
};

type SearchGroup = {
  key: string;
  label: string;
  items: SearchItem[];
};

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(false);
  const [query, setQuery] = useState("");
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);
  const mobileSearchWrapRef = useRef<HTMLDivElement>(null);

  async function signOut() {
    setLoggingOut(true);
    setLogoutError(false);
    try {
      const response = await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Logout failed");
      router.replace("/admin");
      router.refresh();
    } catch {
      setLogoutError(true);
      setLoggingOut(false);
    }
  }

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) {
      setGroups([]);
      setSearchError("");
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setSearching(true);
        setSearchError("");
        const response = await fetch(
          `${API_URL}/api/admin/global-search?q=${encodeURIComponent(value)}&limit=5`,
          {
            credentials: "include",
            cache: "no-store",
            signal: controller.signal,
          }
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data?.message || "Unable to search.");
        setGroups(Array.isArray(data?.groups) ? data.groups : []);
        setSearchOpen(true);
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return;
        setSearchError(error instanceof Error ? error.message : "Unable to search.");
        setGroups([]);
        setSearchOpen(true);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      const inDesktop = searchWrapRef.current?.contains(target);
      const inMobile = mobileSearchWrapRef.current?.contains(target);
      if (!inDesktop && !inMobile) setSearchOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    setSearchOpen(false);
    setQuery("");
  }, [pathname]);

  const title = (() => {
    if (titles[pathname]) return titles[pathname];
    if (pathname === "/admin/banners/new") return "Add Banner";
    if (pathname.startsWith("/admin/banners/") && pathname.endsWith("/edit")) return "Edit Banner";
    if (/^\/admin\/customers\/[^/]+$/.test(pathname)) return "Customer Details";
    if (/^\/admin\/blog\/[^/]+\/edit$/.test(pathname)) return "Edit Blog";
    if (pathname.startsWith("/admin/products/") && pathname.endsWith("/edit")) return "Edit Product";
    return "Admin";
  })();

  const resultCount = groups.reduce((total, group) => total + group.items.length, 0);

  return (
    <header className="sticky top-0 z-40 border-b border-[#211A18]/10 bg-[#F7F3EF]/95 backdrop-blur-xl">
      <div className="flex min-h-[78px] items-center gap-4 px-5 md:px-8">
        <div className="min-w-0 shrink-0">
          <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-[#8C1839]">
            HivraSoft Admin
          </p>
          <h1 className="mt-1 truncate text-[19px] font-semibold text-[#211A18] md:text-[21px]">
            {title}
          </h1>
        </div>

        <div
          ref={searchWrapRef}
          className="relative ml-auto hidden w-full max-w-[500px] md:block"
        >
          <div className={`flex h-11 items-center gap-2.5 rounded-xl border bg-white/95 px-3.5 shadow-[0_5px_18px_rgba(45,29,23,0.06)] transition ${
            searchOpen
              ? "border-[#8C1839]/30 ring-4 ring-[#8C1839]/[0.05]"
              : "border-black/[0.08] hover:border-black/[0.14]"
          }`}>
            {searching ? (
              <LoaderCircle size={17} className="shrink-0 animate-spin text-[#8C1839]" />
            ) : (
              <Search size={16} className="shrink-0 text-black/35" />
            )}
            <input
              type="search"
              value={query}
              onFocus={() => setSearchOpen(true)}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products, orders, customers, categories..."
              className="min-w-0 flex-1 bg-transparent text-[11px] outline-none placeholder:text-black/30"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setGroups([]);
                }}
                className="grid h-7 w-7 place-items-center rounded-lg text-black/30 transition hover:bg-black/[0.05] hover:text-black/65"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            ) : (
              <span className="rounded-md bg-[#F4F0ED] px-2 py-1 text-[8px] font-semibold text-black/35">2+ chars</span>
            )}
          </div>

          {searchOpen && query.trim().length >= 2 && (
            <div className="absolute left-0 right-0 top-[calc(100%+10px)] max-h-[70vh] overflow-y-auto rounded-[22px] border border-black/[0.08] bg-white p-2 shadow-[0_25px_80px_rgba(45,29,23,0.2)]">
              {searchError ? (
                <div className="rounded-2xl bg-red-50 px-4 py-5 text-[11px] font-semibold text-red-700">
                  {searchError}
                </div>
              ) : searching && resultCount === 0 ? (
                <div className="px-4 py-8 text-center text-[11px] text-black/40">Searching admin data...</div>
              ) : groups.length === 0 ? (
                <div className="px-4 py-8 text-center text-[11px] text-black/40">No matching admin records found.</div>
              ) : (
                <div className="space-y-2">
                  {groups.map((group) => (
                    <section key={group.key} className="rounded-2xl bg-[#FAF8F6] p-2">
                      <div className="flex items-center justify-between px-2 py-1.5">
                        <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-black/35">{group.label}</p>
                        <span className="text-[9px] text-black/30">{group.items.length}</span>
                      </div>
                      <div className="space-y-1">
                        {group.items.map((item) => (
                          <button
                            key={`${group.key}-${item._id}`}
                            type="button"
                            onClick={() => {
                              setSearchOpen(false);
                              router.push(item.adminUrl);
                            }}
                            className="flex w-full items-center gap-3 rounded-xl bg-white px-3 py-3 text-left transition hover:bg-[#FFF3F7]"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[11px] font-semibold text-[#211A18]">{item.name}</p>
                              {item.subtitle ? <p className="mt-1 truncate text-[9px] text-black/40">{item.subtitle}</p> : null}
                            </div>
                            <ChevronRight size={15} className="shrink-0 text-black/25" />
                          </button>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden text-right xl:block">
            <p className="text-[11px] font-semibold text-[#211A18]">Administrator</p>
            <p className="mt-0.5 text-[9px] text-[#211A18]/45">HivraSoft Management</p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8C1839] text-[13px] font-semibold text-white">
            A
          </div>
          <button
            type="button"
            onClick={signOut}
            disabled={loggingOut}
            aria-label="Sign out"
            title="Sign out"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[#8C1839] hover:bg-[#8C1839]/10 disabled:opacity-50"
          >
            <LogOut size={18} />
          </button>
          {logoutError && <span role="alert" className="hidden text-xs text-red-700 xl:inline">Sign out failed.</span>}
        </div>
      </div>

      <div ref={mobileSearchWrapRef} className="relative px-5 pb-3 md:hidden">
        <div className={`flex h-11 items-center gap-3 rounded-xl border bg-white px-3 ${searchOpen ? "border-[#8C1839]/25" : "border-black/[0.08]"}`}>
          {searching ? <LoaderCircle size={15} className="animate-spin text-[#8C1839]" /> : <Search size={15} className="text-black/35" />}
          <input
            type="search"
            value={query}
            onFocus={() => setSearchOpen(true)}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search admin..."
            className="min-w-0 flex-1 bg-transparent text-[11px] outline-none placeholder:text-black/30"
          />
          {query ? <button type="button" onClick={() => { setQuery(""); setGroups([]); }} className="text-black/30" aria-label="Clear search"><X size={14} /></button> : null}
        </div>

        {searchOpen && query.trim().length >= 2 && (
          <div className="absolute left-5 right-5 top-[calc(100%-2px)] z-50 max-h-[62vh] overflow-y-auto rounded-[18px] border border-black/[0.08] bg-white p-2 shadow-[0_25px_80px_rgba(45,29,23,0.2)]">
            {searchError ? <div className="rounded-xl bg-red-50 px-3 py-4 text-[10px] font-semibold text-red-700">{searchError}</div> : groups.length === 0 ? <div className="px-3 py-6 text-center text-[10px] text-black/40">{searching ? "Searching..." : "No results found."}</div> : (
              <div className="space-y-2">
                {groups.map((group) => (
                  <section key={`mobile-${group.key}`} className="rounded-xl bg-[#FAF8F6] p-2">
                    <p className="px-2 py-1 text-[8px] font-bold uppercase tracking-[0.14em] text-black/35">{group.label}</p>
                    {group.items.map((item) => (
                      <button key={`mobile-${group.key}-${item._id}`} type="button" onClick={() => { setSearchOpen(false); router.push(item.adminUrl); }} className="flex w-full items-center gap-2 rounded-lg bg-white px-3 py-2.5 text-left">
                        <div className="min-w-0 flex-1"><p className="truncate text-[10px] font-semibold">{item.name}</p>{item.subtitle ? <p className="mt-0.5 truncate text-[8px] text-black/35">{item.subtitle}</p> : null}</div><ChevronRight size={13} className="text-black/25" />
                      </button>
                    ))}
                  </section>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
