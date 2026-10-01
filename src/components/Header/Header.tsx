"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  useState,
  type ReactNode,
} from "react";

import Account from "../Auth/Account";

/* =========================================================
   WOMEN MENU DATA
========================================================= */

const braLinks = [
  {
    name: "Sports Bra",
    href: "/women/bra/sports-bra/",
  },
  {
    name: "Maternity Bra",
    href: "/women/bra/maternity-bra/",
  },
  {
    name: "T-Shirt Bra",
    href: "/women/bra/t-shirt-bra/",
  },
  {
    name: "Padded Bra",
    href: "/women/bra/padded-bra/",
  },
  {
    name: "Non Padded Bra",
    href: "/women/bra/non-padded-bra/",
  },
];

const pantyLinks = [
  {
    name: "Seamless Panty",
    href: "/women/panty/seamless-panty/",
  },
  {
    name: "Hipster",
    href: "/women/panty/hipster/",
  },
  {
    name: "Thongs",
    href: "/women/panty/thongs/",
  },
  {
    name: "G-String",
    href: "/women/panty/g-string/",
  },
];

const discoverLinks = [
  {
    name: "Lingerie",
    href: "/women/lingerie/",
  },
  {
    name: "Shop By Body Shape",
    href: "/women/shop-by-body-shape/",
  },
  {
    name: "Women Offers",
    href: "/women/offers/",
  },
  {
    name: "View All",
    href: "/women/",
  },
];

/* =========================================================
   MEN MENU DATA
========================================================= */

const menLinks = [
  {
    name: "Trunks",
    href: "/men/trunks/",
  },
  {
    name: "Briefs",
    href: "/men/briefs/",
  },
  {
    name: "Men Thongs",
    href: "/men/thongs/",
  },
  {
    name: "G-Strings",
    href: "/men/g-strings/",
  },
  {
    name: "Men Offers",
    href: "/men/offers/",
  },
];

/* =========================================================
   HEADER
========================================================= */

export default function Header() {
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [
    mobileWomenOpen,
    setMobileWomenOpen,
  ] = useState(false);

  const [
    mobileMenOpen,
    setMobileMenOpen,
  ] = useState(false);

  /* =========================================================
     HIDE NAVBAR ON LANDING
  ========================================================= */

  if (pathname === "/landing") {
    return null;
  }

  return (
    <>
      {/* =====================================================
          TOP ANNOUNCEMENT BAR
      ===================================================== */}

      <div
        className="
          relative
          z-[110]
          bg-[#211A18]
          px-4
          py-[7px]
          text-center
        "
      >
        <p
          className="
            text-[8px]
            font-medium
            uppercase
            tracking-[0.2em]
            text-[#F7F3EF]
            md:text-[9px]
          "
        >
          Free Shipping

          <span
            className="
              mx-3
              text-[#B9915C]
            "
          >
            •
          </span>

          Discreet Packaging

          <span
            className="
              mx-3
              text-[#B9915C]
            "
          >
            •
          </span>

          Easy Returns
        </p>
      </div>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header
        className="
          sticky
          top-0
          z-[100]
          w-full
          border-b
          border-[#211A18]/10
          bg-[#F7F3EF]
        "
      >
        <div
          className="
            mx-auto
            flex
            h-[74px]
            max-w-[1600px]
            items-center
            justify-between
            px-4
            md:px-6
            xl:px-8
          "
        >
          {/* LOGO */}

          <Link
            href="/"
            aria-label="HivraSoft Home"
            className="
              flex
              shrink-0
              items-center
            "
          >
            <Image
              src="/images/logos/hivra-soft-logo.png"
              alt="HivraSoft"
              width={150}
              height={58}
              priority
              className="
                h-auto
                w-[120px]
                object-contain
                xl:w-[145px]
              "
            />
          </Link>

          {/* =================================================
              DESKTOP NAVIGATION
          ================================================= */}

          <nav
            className="
              hidden
              h-full
              items-center
              gap-[22px]
              xl:flex
            "
          >
            <NavLink href="/bundle-pricing/">
              Bundle Pricing
            </NavLink>

            <NavLink href="/new-launch/">
              New Launch
            </NavLink>

            <NavLink href="/buy-3-get-1-free/">
              Buy 3 Get 1 Free
            </NavLink>

            {/* WOMEN */}

            <div
              className="
                group
                relative
                flex
                h-full
                items-center
              "
            >
              <Link
                href="/women/"
                className="
                  flex
                  h-full
                  items-center
                  gap-[5px]
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.1em]
                  text-[#8C1839]
                  transition-colors
                  duration-300
                "
              >
                Women

                <ChevronDown />
              </Link>

              <div
                className="
                  invisible
                  absolute
                  left-1/2
                  top-full
                  w-[650px]
                  -translate-x-1/2
                  translate-y-[8px]
                  border
                  border-[#211A18]/5
                  bg-[#F7F3EF]
                  opacity-0
                  shadow-[0_24px_60px_rgba(33,26,24,0.16)]
                  transition-all
                  duration-300

                  group-hover:visible
                  group-hover:translate-y-0
                  group-hover:opacity-100
                "
              >
                <div
                  className="
                    grid
                    grid-cols-3
                    gap-10
                    px-9
                    pb-9
                    pt-9
                  "
                >
                  {/* BRAS */}

                  <div>
                    <Link
                      href="/women/bra/"
                      className="
                        mb-5
                        inline-block
                        text-[9px]
                        font-semibold
                        uppercase
                        tracking-[0.35em]
                        text-[#8C1839]
                        transition
                        hover:text-[#211A18]
                      "
                    >
                      Bras
                    </Link>

                    <div
                      className="
                        space-y-[17px]
                      "
                    >
                      {braLinks.map(
                        (item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="
                              block
                              text-[12px]
                              font-normal
                              text-[#211A18]/60
                              transition-all
                              duration-200
                              hover:translate-x-1
                              hover:text-[#8C1839]
                            "
                          >
                            {item.name}
                          </Link>
                        )
                      )}
                    </div>
                  </div>

                  {/* PANTIES */}

                  <div>
                    <Link
                      href="/women/panty/"
                      className="
                        mb-5
                        inline-block
                        text-[9px]
                        font-semibold
                        uppercase
                        tracking-[0.35em]
                        text-[#8C1839]
                        transition
                        hover:text-[#211A18]
                      "
                    >
                      Panties
                    </Link>

                    <div
                      className="
                        space-y-[17px]
                      "
                    >
                      {pantyLinks.map(
                        (item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="
                              block
                              text-[12px]
                              font-normal
                              text-[#211A18]/60
                              transition-all
                              duration-200
                              hover:translate-x-1
                              hover:text-[#8C1839]
                            "
                          >
                            {item.name}
                          </Link>
                        )
                      )}
                    </div>
                  </div>

                  {/* DISCOVER */}

                  <div>
                    <p
                      className="
                        mb-5
                        text-[9px]
                        font-semibold
                        uppercase
                        tracking-[0.35em]
                        text-[#8C1839]
                      "
                    >
                      Discover
                    </p>

                    <div
                      className="
                        space-y-[17px]
                      "
                    >
                      {discoverLinks.map(
                        (item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="
                              block
                              text-[12px]
                              font-normal
                              text-[#211A18]/60
                              transition-all
                              duration-200
                              hover:translate-x-1
                              hover:text-[#8C1839]
                            "
                          >
                            {item.name}
                          </Link>
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className="
                    border-t
                    border-[#211A18]/10
                    px-9
                    py-5
                  "
                >
                  <Link
                    href="/women/"
                    className="
                      inline-flex
                      items-center
                      gap-3
                      text-[9px]
                      font-semibold
                      uppercase
                      tracking-[0.32em]
                      text-[#8C1839]
                      transition
                      hover:gap-5
                      hover:text-[#211A18]
                    "
                  >
                    Explore all Women&apos;s Collection

                    <span>→</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* MEN */}

            <div
              className="
                group
                relative
                flex
                h-full
                items-center
              "
            >
              <Link
                href="/men/"
                className="
                  flex
                  h-full
                  items-center
                  gap-[5px]
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.1em]
                  text-[#211A18]
                  transition
                  hover:text-[#8C1839]
                "
              >
                Men

                <ChevronDown />
              </Link>

              <div
                className="
                  invisible
                  absolute
                  left-1/2
                  top-full
                  w-[230px]
                  -translate-x-1/2
                  translate-y-2
                  border
                  border-[#211A18]/10
                  bg-[#F7F3EF]
                  p-4
                  opacity-0
                  shadow-[0_20px_50px_rgba(33,26,24,0.12)]
                  transition-all
                  duration-300

                  group-hover:visible
                  group-hover:translate-y-0
                  group-hover:opacity-100
                "
              >
                {menLinks.map(
                  (item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="
                        block
                        px-4
                        py-3
                        text-[11px]
                        text-[#211A18]/65
                        transition
                        hover:bg-[#EFE6DC]
                        hover:text-[#8C1839]
                      "
                    >
                      {item.name}
                    </Link>
                  )
                )}
              </div>
            </div>

            <NavLink href="/accessories/">
              Accessories
            </NavLink>

            {/* MORE */}

            <div
              className="
                group
                relative
                flex
                h-full
                items-center
              "
            >
              <button
                type="button"
                className="
                  flex
                  h-full
                  items-center
                  gap-[5px]
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.1em]
                  text-[#211A18]
                  transition
                  hover:text-[#8C1839]
                "
              >
                More

                <ChevronDown />
              </button>

              <div
                className="
                  invisible
                  absolute
                  right-0
                  top-full
                  w-[240px]
                  translate-y-2
                  border
                  border-[#211A18]/10
                  bg-[#F7F3EF]
                  p-4
                  opacity-0
                  shadow-[0_20px_50px_rgba(33,26,24,0.12)]
                  transition-all
                  duration-300

                  group-hover:visible
                  group-hover:translate-y-0
                  group-hover:opacity-100
                "
              >
                <Link
                  href="/send-your-bra/"
                  className="
                    block
                    px-4
                    py-3
                    text-[11px]
                    text-[#211A18]/65
                    transition
                    hover:bg-[#EFE6DC]
                    hover:text-[#8C1839]
                  "
                >
                  Send Your Bra
                </Link>

                <Link
                  href="/reseller-registration/"
                  className="
                    block
                    px-4
                    py-3
                    text-[11px]
                    text-[#211A18]/65
                    transition
                    hover:bg-[#EFE6DC]
                    hover:text-[#8C1839]
                  "
                >
                  Reseller Registration
                </Link>
              </div>
            </div>
          </nav>

          {/* =================================================
              DESKTOP RIGHT ICONS
          ================================================= */}

          <div
            className="
              hidden
              items-center
              gap-1
              text-[#211A18]
              md:flex
            "
          >
            <IconLink
              href="/search/"
              label="Search"
            >
              <SearchIcon />
            </IconLink>

            <IconLink
              href="/wishlist/"
              label="Wishlist"
            >
              <HeartIcon />
            </IconLink>

            {/* ACCOUNT */}

            <Account />

            {/* CART */}

            <Link
              href="/cart/"
              aria-label="Cart"
              className="
                relative
                ml-1
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-[#211A18]
                text-white
                shadow-sm
                transition-all
                duration-300

                hover:bg-[#8C1839]
              "
            >
              <BagIcon />

              <span
                className="
                  absolute
                  -right-1
                  -top-1
                  flex
                  h-[17px]
                  min-w-[17px]
                  items-center
                  justify-center
                  rounded-full
                  bg-[#8C1839]
                  px-1
                  text-[8px]
                  font-bold
                  text-white
                "
              >
                0
              </span>
            </Link>
          </div>

          {/* MOBILE BUTTON */}

          <button
            type="button"
            aria-label="Menu"
            onClick={() => {
              setMobileOpen(
                (value) => !value
              );
            }}
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-full
              border
              border-[#211A18]/20
              text-[#211A18]
              xl:hidden
            "
          >
            {mobileOpen ? (
              <CloseIcon />
            ) : (
              <MenuIcon />
            )}
          </button>
        </div>

        {/* =================================================
            MOBILE MENU
        ================================================= */}

        <div
          className={`
            overflow-visible
            border-t
            border-[#211A18]/10
            bg-[#F7F3EF]
            transition-all
            duration-500
            xl:hidden

            ${
              mobileOpen
                ? "max-h-[1600px] opacity-100"
                : "max-h-0 overflow-hidden opacity-0"
            }
          `}
        >
          <div
            className="
              px-5
              py-5
            "
          >
            {/* QUICK ICONS */}

            <div
              className="
                mb-5
                grid
                grid-cols-4
                gap-2
                border-b
                border-[#211A18]/10
                pb-5
              "
            >
              <MobileIconLink
                href="/search/"
                label="Search"
                close={() =>
                  setMobileOpen(false)
                }
              >
                <SearchIcon />
              </MobileIconLink>

              <MobileIconLink
                href="/wishlist/"
                label="Wishlist"
                close={() =>
                  setMobileOpen(false)
                }
              >
                <HeartIcon />
              </MobileIconLink>

              {/* MOBILE ACCOUNT */}

              <Account
                mobile
                onBeforeOpen={() => {
                  setMobileOpen(false);

                  setMobileWomenOpen(false);

                  setMobileMenOpen(false);
                }}
              />

              <MobileCartLink
                close={() =>
                  setMobileOpen(false)
                }
              />
            </div>

            {/* LINKS */}

            <MobileLink
              href="/bundle-pricing/"
              close={() =>
                setMobileOpen(false)
              }
            >
              Bundle Pricing
            </MobileLink>

            <MobileLink
              href="/new-launch/"
              close={() =>
                setMobileOpen(false)
              }
            >
              New Launch
            </MobileLink>

            <MobileLink
              href="/buy-3-get-1-free/"
              close={() =>
                setMobileOpen(false)
              }
            >
              Buy 3 Get 1 Free
            </MobileLink>

            {/* MOBILE WOMEN */}

            <button
              type="button"
              onClick={() => {
                setMobileWomenOpen(
                  (value) => !value
                );
              }}
              className="
                flex
                w-full
                items-center
                justify-between
                border-b
                border-[#211A18]/10
                py-4
                text-[12px]
                font-semibold
                uppercase
                tracking-[0.1em]
                text-[#211A18]
              "
            >
              Women

              <span>
                {mobileWomenOpen
                  ? "−"
                  : "+"}
              </span>
            </button>

            {mobileWomenOpen && (
              <div
                className="
                  bg-[#EFE6DC]/60
                  px-4
                  py-4
                "
              >
                <Link
                  href="/women/"
                  onClick={() =>
                    setMobileOpen(false)
                  }
                  className="
                    block
                    border-b
                    border-[#211A18]/10
                    pb-4
                    text-[11px]
                    font-bold
                    uppercase
                    tracking-[0.1em]
                    text-[#8C1839]
                  "
                >
                  View All Women
                </Link>

                <Link
                  href="/women/bra/"
                  onClick={() =>
                    setMobileOpen(false)
                  }
                  className="
                    mt-5
                    block
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-[0.2em]
                    text-[#8C1839]
                  "
                >
                  Bras
                </Link>

                <div
                  className="
                    mt-2
                    pl-3
                  "
                >
                  {braLinks.map(
                    (item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() =>
                          setMobileOpen(false)
                        }
                        className="
                          block
                          py-2
                          text-[11px]
                          text-[#6F5A4C]
                        "
                      >
                        {item.name}
                      </Link>
                    )
                  )}
                </div>

                <Link
                  href="/women/panty/"
                  onClick={() =>
                    setMobileOpen(false)
                  }
                  className="
                    mt-5
                    block
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-[0.2em]
                    text-[#8C1839]
                  "
                >
                  Panties
                </Link>

                <div
                  className="
                    mt-2
                    pl-3
                  "
                >
                  {pantyLinks.map(
                    (item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() =>
                          setMobileOpen(false)
                        }
                        className="
                          block
                          py-2
                          text-[11px]
                          text-[#6F5A4C]
                        "
                      >
                        {item.name}
                      </Link>
                    )
                  )}
                </div>

                <p
                  className="
                    mt-5
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-[0.2em]
                    text-[#8C1839]
                  "
                >
                  Discover
                </p>

                <div
                  className="
                    mt-2
                    pl-3
                  "
                >
                  {discoverLinks.map(
                    (item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() =>
                          setMobileOpen(false)
                        }
                        className="
                          block
                          py-2
                          text-[11px]
                          text-[#6F5A4C]
                        "
                      >
                        {item.name}
                      </Link>
                    )
                  )}
                </div>
              </div>
            )}

            {/* MOBILE MEN */}

            <button
              type="button"
              onClick={() => {
                setMobileMenOpen(
                  (value) => !value
                );
              }}
              className="
                flex
                w-full
                items-center
                justify-between
                border-b
                border-[#211A18]/10
                py-4
                text-[12px]
                font-semibold
                uppercase
                tracking-[0.1em]
                text-[#211A18]
              "
            >
              Men

              <span>
                {mobileMenOpen
                  ? "−"
                  : "+"}
              </span>
            </button>

            {mobileMenOpen && (
              <div
                className="
                  bg-[#EFE6DC]/60
                  px-4
                  py-3
                "
              >
                <Link
                  href="/men/"
                  onClick={() =>
                    setMobileOpen(false)
                  }
                  className="
                    block
                    py-3
                    text-[11px]
                    font-bold
                    uppercase
                    text-[#8C1839]
                  "
                >
                  All Men
                </Link>

                {menLinks.map(
                  (item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() =>
                        setMobileOpen(false)
                      }
                      className="
                        block
                        py-3
                        text-[11px]
                        text-[#6F5A4C]
                      "
                    >
                      {item.name}
                    </Link>
                  )
                )}
              </div>
            )}

            <MobileLink
              href="/accessories/"
              close={() =>
                setMobileOpen(false)
              }
            >
              Accessories
            </MobileLink>

            <MobileLink
              href="/send-your-bra/"
              close={() =>
                setMobileOpen(false)
              }
            >
              Send Your Bra
            </MobileLink>

            <MobileLink
              href="/reseller-registration/"
              close={() =>
                setMobileOpen(false)
              }
            >
              Reseller Registration
            </MobileLink>
          </div>
        </div>
      </header>
    </>
  );
}

/* =========================================================
   NAV LINK
========================================================= */

function NavLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="
        flex
        h-full
        items-center
        text-[10px]
        font-semibold
        uppercase
        tracking-[0.1em]
        text-[#211A18]
        transition
        hover:text-[#8C1839]
      "
    >
      {children}
    </Link>
  );
}

/* =========================================================
   MOBILE LINK
========================================================= */

function MobileLink({
  href,
  close,
  children,
}: {
  href: string;
  close: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={close}
      className="
        block
        border-b
        border-[#211A18]/10
        py-4
        text-[12px]
        font-semibold
        uppercase
        tracking-[0.1em]
        text-[#211A18]
      "
    >
      {children}
    </Link>
  );
}

/* =========================================================
   DESKTOP ICON LINK
========================================================= */

function IconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      className="
        flex
        h-11
        w-11
        shrink-0
        items-center
        justify-center
        rounded-full
        text-[#8C1839]
        transition-all
        duration-300

        hover:bg-[#EFE6DC]
        hover:text-[#8C1839]

        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-[#8C1839]
        focus-visible:ring-offset-2
      "
    >
      {children}
    </Link>
  );
}

/* =========================================================
   MOBILE ICON LINK
========================================================= */

function MobileIconLink({
  href,
  label,
  close,
  children,
}: {
  href: string;
  label: string;
  close: () => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={close}
      aria-label={label}
      title={label}
      className="
        flex
        h-12
        items-center
        justify-center
        rounded-md
        border
        border-[#211A18]/15
        bg-[#F7F3EF]
        text-[#211A18]
        transition

        hover:border-[#8C1839]
        hover:text-[#8C1839]
      "
    >
      {children}
    </Link>
  );
}

/* =========================================================
   MOBILE CART
========================================================= */

function MobileCartLink({
  close,
}: {
  close: () => void;
}) {
  return (
    <Link
      href="/cart/"
      onClick={close}
      aria-label="Cart"
      title="Cart"
      className="
        relative
        flex
        h-12
        items-center
        justify-center
        rounded-md
        bg-[#211A18]
        text-white
        transition

        hover:bg-[#8C1839]
      "
    >
      <BagIcon />

      <span
        className="
          absolute
          right-1
          top-1
          flex
          h-[16px]
          min-w-[16px]
          items-center
          justify-center
          rounded-full
          bg-[#8C1839]
          px-1
          text-[8px]
          font-bold
          text-white
        "
      >
        0
      </span>
    </Link>
  );
}

/* =========================================================
   ICONS
========================================================= */

function ChevronDown() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="11"
        r="7"
      />

      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 8h14l-1 13H6L5 8Z" />

      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}