"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  Package,
  Percent,
  ReceiptText,
  Tag,
  Star,
  Truck,
  UsersRound,
  ShoppingCart,
  Heart,
  FileText,
  House,
  Trash2,
} from "lucide-react";

export default function AdminSidebar() {
  const pathname = usePathname();
  const [trashCount, setTrashCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/admin/trash?limit=1`, {
      credentials: "include",
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return response.json();
      })
      .then((data) => {
        if (!cancelled) setTrashCount(Number(data?.stats?.total || 0));
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [pathname]);

  const productRoute = pathname.startsWith("/admin/products");
  const userRoute =
    pathname.startsWith("/admin/customers") ||
    pathname.startsWith("/admin/notifications") ||
    pathname.startsWith("/admin/notification-schedules") ||
    pathname.startsWith("/admin/reviews");
  const blogRoute = pathname.startsWith("/admin/blog");
  const offerRoute = pathname.startsWith("/admin/offers");
  const extraRoute = pathname.startsWith("/admin/extra-add");
  const homepageRoute = pathname.startsWith("/admin/homepage");

  const [productsOpen, setProductsOpen] = useState(productRoute);
  const [usersOpen, setUsersOpen] = useState(userRoute);
  const [blogOpen, setBlogOpen] = useState(blogRoute);
  const [offersOpen, setOffersOpen] = useState(offerRoute);
  const [extraOpen, setExtraOpen] = useState(extraRoute);
  const [homepageOpen, setHomepageOpen] = useState(homepageRoute);

  return (
    <aside className="flex max-h-[calc(100dvh-4rem)] w-full flex-col bg-[#211A18] text-white lg:h-dvh lg:max-h-none">
      <div className="flex h-[82px] shrink-0 items-center border-b border-white/10 px-7">
        <Link href="/admin" className="text-[20px] font-semibold tracking-[0.2em]">
          HIVRASOFT
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-7">
        <p className="px-3 text-[8px] font-semibold uppercase tracking-[0.28em] text-white/35">
          Management
        </p>

        <nav className="mt-5 space-y-2">
          <MenuLink href="/admin" active={pathname === "/admin"} icon={<LayoutDashboard size={17} />}>
            Dashboard
          </MenuLink>

          <DropdownMenu
            label="Products"
            active={productRoute}
            open={productsOpen}
            onToggle={() => setProductsOpen((current) => !current)}
            icon={<Package size={17} />}
          >
            <SubMenuLink href="/admin/products" active={pathname === "/admin/products"}>
              All Products
            </SubMenuLink>
            <SubMenuLink href="/admin/products/new" active={pathname === "/admin/products/new"} plus>
              Add Product
            </SubMenuLink>
          </DropdownMenu>

          <MenuLink
            href="/admin/categories"
            active={pathname.startsWith("/admin/categories")}
          >
            Categories
          </MenuLink>

          <DropdownMenu
            label="Offers"
            active={offerRoute}
            open={offersOpen}
            onToggle={() => setOffersOpen((current) => !current)}
            icon={<Tag size={17} />}
          >
            <SubMenuLink
              href="/admin/offers/buy-get"
              active={pathname === "/admin/offers/buy-get"}
            >
              Buy & Get Offer
            </SubMenuLink>
            <SubMenuLink
              href="/admin/offers/fixed-price-bundle"
              active={pathname === "/admin/offers/fixed-price-bundle"}
            >
              Fixed Price Bundle
            </SubMenuLink>
          </DropdownMenu>

          <MenuLink href="/admin/banners" active={pathname.startsWith("/admin/banners")}>
            Banners
          </MenuLink>

          <DropdownMenu
            label="Homepage"
            active={homepageRoute}
            open={homepageOpen}
            onToggle={() => setHomepageOpen((current) => !current)}
            icon={<House size={17} />}
          >
            <SubMenuLink href="/admin/homepage/on-trend-picks" active={pathname === "/admin/homepage/on-trend-picks"}>
              On Trend Picks
            </SubMenuLink>
            <SubMenuLink href="/admin/homepage/always-in-it" active={pathname === "/admin/homepage/always-in-it"}>
              Always In It
            </SubMenuLink>
            <SubMenuLink href="/admin/homepage/prime-selection" active={pathname === "/admin/homepage/prime-selection"}>
              Prime Selection
            </SubMenuLink>
          </DropdownMenu>


          <MenuLink href="/admin/orders" active={pathname.startsWith("/admin/orders")}>
            Orders
          </MenuLink>

          <MenuLink href="/admin/cart" active={pathname.startsWith("/admin/cart")} icon={<ShoppingCart size={17} />}>
            Cart
          </MenuLink>

          <MenuLink href="/admin/wishlist" active={pathname.startsWith("/admin/wishlist")} icon={<Heart size={17} />}>
            Wishlist
          </MenuLink>


          <MenuLink href="/admin/send-your-bra" active={pathname.startsWith("/admin/send-your-bra")} icon={<Heart size={17} />}>
            Send Your Bra
          </MenuLink>

          <MenuLink href="/admin/reseller-registration" active={pathname.startsWith("/admin/reseller-registration")} icon={<UsersRound size={17} />}>
            Reseller Registrations
          </MenuLink>

          <DropdownMenu
            label="Blog"
            active={blogRoute}
            open={blogOpen}
            onToggle={() => setBlogOpen((current) => !current)}
            icon={<FileText size={17} />}
          >
            <SubMenuLink href="/admin/blog" active={pathname === "/admin/blog"}>All Blogs</SubMenuLink>
            <SubMenuLink href="/admin/blog/add" active={pathname === "/admin/blog/add"} plus>Add New Blog</SubMenuLink>
          </DropdownMenu>

          <DropdownMenu
            label="Users"
            active={userRoute}
            open={usersOpen}
            onToggle={() => setUsersOpen((current) => !current)}
            icon={<UsersRound size={17} />}
          >
            <SubMenuLink
              href="/admin/customers"
              active={pathname.startsWith("/admin/customers")}
            >
              Customers
            </SubMenuLink>
            <SubMenuLink href="/admin/reviews" active={pathname.startsWith("/admin/reviews")} icon={<Star size={13} />}>
              Ratings & Reviews
            </SubMenuLink>
            <SubMenuLink
              href="/admin/notifications"
              active={pathname === "/admin/notifications"}
              icon={<Bell size={13} />}
            >
              Notifications
            </SubMenuLink>
            <SubMenuLink
              href="/admin/notification-schedules"
              active={pathname.startsWith("/admin/notification-schedules")}
              icon={<Bell size={13} />}
            >
              Auto Schedules
            </SubMenuLink>
          </DropdownMenu>

          <DropdownMenu
            label="Extra Add"
            active={extraRoute}
            open={extraOpen}
            onToggle={() => setExtraOpen((current) => !current)}
            icon={<Percent size={17} />}
          >
            <SubMenuLink
              href="/admin/extra-add/automatic-discount"
              active={pathname === "/admin/extra-add/automatic-discount"}
              icon={<Percent size={13} />}
            >
              Automatic Discount
            </SubMenuLink>
            <SubMenuLink
              href="/admin/extra-add/discount-code"
              active={pathname === "/admin/extra-add/discount-code"}
              icon={<Tag size={13} />}
            >
              Discount Code
            </SubMenuLink>
            <SubMenuLink
              href="/admin/extra-add/tax"
              active={pathname === "/admin/extra-add/tax"}
              icon={<ReceiptText size={13} />}
            >
              Tax Settings
            </SubMenuLink>
            <SubMenuLink
              href="/admin/extra-add/delivery-charge"
              active={pathname === "/admin/extra-add/delivery-charge"}
              icon={<Truck size={13} />}
            >
              Delivery Charges
            </SubMenuLink>
          </DropdownMenu>

          <MenuLink href="/admin/trash" active={pathname.startsWith("/admin/trash")} icon={<Trash2 size={17} />}>
            <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
              <span>Trash</span>
              {trashCount > 0 && (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[8px] font-bold text-white/75">
                  {trashCount > 99 ? "99+" : trashCount}
                </span>
              )}
            </span>
          </MenuLink>

          <MenuLink href="/admin/settings" active={pathname.startsWith("/admin/settings")}>
            Settings
          </MenuLink>
        </nav>
      </div>

      <div className="shrink-0 border-t border-white/10 p-4">
        <Link
          href="/"
          className="flex h-[48px] items-center justify-center rounded-[13px] border border-white/10 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/70 hover:bg-white hover:text-[#211A18]"
        >
          View Store
        </Link>
      </div>
    </aside>
  );
}

function DropdownMenu({
  label,
  active,
  open,
  onToggle,
  icon,
  children,
}: {
  label: string;
  active: boolean;
  open: boolean;
  onToggle: () => void;
  icon?: ReactNode;
  children: ReactNode;
}) {
  const id = `admin-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-menu`;

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={onToggle}
        className={`flex h-[48px] w-full items-center justify-between rounded-[12px] px-4 text-[11px] transition ${
          active
            ? "bg-[#A51D45] text-white"
            : "text-white/65 hover:bg-white/5 hover:text-white"
        }`}
      >
        <span className="flex items-center gap-3">
          {icon}
          {label}
        </span>
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div id={id} className="mt-2 space-y-2 pl-3">
          {children}
        </div>
      )}
    </div>
  );
}

function SubMenuLink({
  href,
  active,
  children,
  plus = false,
  icon,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
  plus?: boolean;
  icon?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex min-h-[44px] items-center gap-3 rounded-[11px] px-4 py-2 text-[10px] transition ${
        active
          ? "bg-[#A51D45] text-white"
          : "text-white/55 hover:bg-white/5 hover:text-white"
      }`}
    >
      {icon ? (
        <span className="flex h-4 w-4 shrink-0 items-center justify-center">{icon}</span>
      ) : plus ? (
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-current text-[11px]">
          +
        </span>
      ) : (
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      )}
      <span>{children}</span>
    </Link>
  );
}

function MenuLink({
  href,
  active,
  children,
  icon,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex h-[48px] items-center gap-3 rounded-[12px] px-4 text-[11px] transition ${
        active
          ? "bg-[#A51D45] text-white"
          : "text-white/65 hover:bg-white/5 hover:text-white"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}
