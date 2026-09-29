"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
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
} from "lucide-react";

export default function AdminSidebar() {
  const pathname = usePathname();

  const productRoute = pathname.startsWith("/admin/products");
  const userRoute =
    pathname.startsWith("/admin/customers") ||
    pathname.startsWith("/admin/notifications") ||
    pathname.startsWith("/admin/reviews");
  const blogRoute = pathname.startsWith("/admin/blog");
  const extraRoute = pathname.startsWith("/admin/extra-add");

  const [productsOpen, setProductsOpen] = useState(productRoute);
  const [usersOpen, setUsersOpen] = useState(userRoute);
  const [blogOpen, setBlogOpen] = useState(blogRoute);
  const [extraOpen, setExtraOpen] = useState(extraRoute);

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

          <MenuLink href="/admin/banners" active={pathname.startsWith("/admin/banners")}>
            Banners
          </MenuLink>

          <MenuLink href="/admin/orders" active={pathname.startsWith("/admin/orders")}>
            Orders
          </MenuLink>

          <MenuLink href="/admin/cart" active={pathname.startsWith("/admin/cart")} icon={<ShoppingCart size={17} />}>
            Cart
          </MenuLink>

          <MenuLink href="/admin/wishlist" active={pathname.startsWith("/admin/wishlist")} icon={<Heart size={17} />}>
            Wishlist
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
            <SubMenuLink href="/admin/blog/categories" active={pathname === "/admin/blog/categories"}>Categories</SubMenuLink>
            <SubMenuLink href="/admin/blog/tags" active={pathname === "/admin/blog/tags"}>Tags</SubMenuLink>
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
              active={pathname.startsWith("/admin/notifications")}
              icon={<Bell size={13} />}
            >
              Notifications
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
