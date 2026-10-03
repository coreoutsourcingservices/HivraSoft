"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
<<<<<<< HEAD
=======
  useEffect,
  useMemo,
>>>>>>> aman
  useState,
  type ReactNode,
} from "react";

import Account from "../Auth/Account";

<<<<<<< HEAD
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
=======
import {
  apiFetch,
  requestLogin,
} from "@/lib/api";

import {
  useStorefrontCommerce,
} from "@/src/components/Storefront/StorefrontCommerceProvider";

/* =========================================================
   TYPES
========================================================= */

type HeaderCategory = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  children: HeaderCategory[];
};

type UtilityLink = {
  name: string;
  slug: string;
  href: string;
};

/* =========================================================
   UTILITY LINKS

   Dynamic category me same slug aa gaya to duplicate
   automatically remove ho jayega.
========================================================= */

const UTILITY_LINKS: UtilityLink[] = [
  {
    name: "Bundle Pricing",
    slug: "bundle-pricing",
    href: "/bundle-pricing/",
  },
  {
    name: "New Launch",
    slug: "new-launch",
    href: "/new-launch/",
  },
  {
    name: "Buy 3 Get 1 Free",
    slug: "buy-3-get-1-free",
    href: "/buy-3-get-1-free/",
  },
  {
    name: "Accessories",
    slug: "accessories",
    href: "/accessories/",
  },
  {
    name: "Send Your Bra",
    slug: "send-your-bra",
    href: "/send-your-bra/",
>>>>>>> aman
  },
];

/* =========================================================
<<<<<<< HEAD
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
=======
   NORMALIZE CATEGORY
========================================================= */

function normalizeCategory(
  value: unknown
): HeaderCategory | null {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return null;
  }

  const object =
    value as Record<string, unknown>;

  const name =
    String(
      object.name || ""
    ).trim();

  const slug =
    String(
      object.slug || ""
    ).trim();

  if (
    !name ||
    !slug
  ) {
    return null;
  }

  const rawChildren =
    Array.isArray(
      object.children
    )
      ? object.children
      : [];

  const children =
    rawChildren
      .map(normalizeCategory)
      .filter(
        (
          item
        ): item is HeaderCategory =>
          Boolean(item)
      )
      .sort(
        (
          first,
          second
        ) =>
          first.sortOrder -
            second.sortOrder ||
          first.name.localeCompare(
            second.name
          )
      );

  return {
    id:
      String(
        object._id ||
          object.id ||
          slug
      ),

    name,

    slug,

    sortOrder:
      Number(
        object.sortOrder ||
          0
      ),

    children,
  };
}

/* =========================================================
   NORMALIZE TREE RESPONSE
========================================================= */

function normalizeTree(
  response: unknown
): HeaderCategory[] {
  if (
    Array.isArray(response)
  ) {
    return response
      .map(normalizeCategory)
      .filter(
        (
          item
        ): item is HeaderCategory =>
          Boolean(item)
      )
      .sort(
        (
          first,
          second
        ) =>
          first.sortOrder -
            second.sortOrder ||
          first.name.localeCompare(
            second.name
          )
      );
  }

  if (
    !response ||
    typeof response !== "object"
  ) {
    return [];
  }

  const object =
    response as Record<string, unknown>;

  if (
    Array.isArray(
      object.categories
    )
  ) {
    return normalizeTree(
      object.categories
    );
  }

  if (
    Array.isArray(
      object.data
    )
  ) {
    return normalizeTree(
      object.data
    );
  }

  if (
    object.data &&
    typeof object.data ===
      "object"
  ) {
    const data =
      object.data as Record<
        string,
        unknown
      >;

    if (
      Array.isArray(
        data.categories
      )
    ) {
      return normalizeTree(
        data.categories
      );
    }
  }

  return [];
}

/* =========================================================
   CATEGORY URL
========================================================= */

function categoryHref(
  slugs: string[]
) {
  return `/${slugs
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/")}`;
}

/* =========================================================
   NORMALIZED SLUG
========================================================= */

function cleanSlug(
  value: string
) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "");
}
>>>>>>> aman

/* =========================================================
   HEADER
========================================================= */

export default function Header() {
<<<<<<< HEAD
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
=======
  const pathname =
    usePathname();

  const commerce =
    useStorefrontCommerce();

  const [
    mobileOpen,
    setMobileOpen,
  ] =
    useState(false);

  const [
    categories,
    setCategories,
  ] =
    useState<
      HeaderCategory[]
    >([]);

  const [
    expanded,
    setExpanded,
  ] =
    useState<
      Set<string>
    >(
      () =>
        new Set()
    );

  /* =======================================================
     LOAD CATEGORY TREE
  ======================================================= */

  useEffect(() => {
    let cancelled =
      false;

    const loadCategories =
      async () => {
        try {
          const response =
            await apiFetch<unknown>(
              "/api/categories/tree?active=true",
              {
                method: "GET",
              }
            );

          if (
            cancelled
          ) {
            return;
          }

          setCategories(
            normalizeTree(
              response
            )
          );
        } catch {
          if (
            !cancelled
          ) {
            setCategories([]);
          }
        }
      };

    void loadCategories();

    return () => {
      cancelled =
        true;
    };
  }, []);

  /* =======================================================
     BODY LOCK
  ======================================================= */

  useEffect(() => {
    if (
      !mobileOpen
    ) {
      return;
    }

    const previous =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previous;
    };
  }, [
    mobileOpen,
  ]);

  /* =======================================================
     ROOTS
  ======================================================= */

  const womenRoot =
    useMemo(
      () =>
        categories.find(
          (
            category
          ) =>
            cleanSlug(
              category.slug
            ) === "women"
        ),
      [categories]
    );

  const menRoot =
    useMemo(
      () =>
        categories.find(
          (
            category
          ) =>
            cleanSlug(
              category.slug
            ) === "men"
        ),
      [categories]
    );

  /* =======================================================
     NO DUPLICATE UTILITY LINKS
  ======================================================= */

  const additionalLinks =
    useMemo(() => {
      const dynamicSlugs =
        new Set(
          categories.map(
            (
              category
            ) =>
              cleanSlug(
                category.slug
              )
          )
        );

      return UTILITY_LINKS.filter(
        (
          item
        ) =>
          !dynamicSlugs.has(
            cleanSlug(
              item.slug
            )
          )
      );
    }, [
      categories,
    ]);

  /* =======================================================
     TOGGLE TREE NODE
  ======================================================= */

  const toggleExpanded =
    (
      id: string
    ) => {
      setExpanded(
        (
          current
        ) => {
          const next =
            new Set(
              current
            );

          if (
            next.has(id)
          ) {
            next.delete(id);
          } else {
            next.add(id);
          }

          return next;
        }
      );
    };

  if (
    pathname ===
    "/landing"
  ) {
>>>>>>> aman
    return null;
  }

  return (
    <>
<<<<<<< HEAD
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
=======
      {/* ===================================================
          ANNOUNCEMENT DESKTOP
      =================================================== */}

      <div
        className="
          hidden

          bg-[#211A18]

          px-4
          py-[7px]

          text-center

          md:block
>>>>>>> aman
        "
      >
        <p
          className="
            text-[8px]
<<<<<<< HEAD
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
=======
            font-semibold
            uppercase

            tracking-[0.20em]

            text-white
          "
        >
          FREE SHIPPING

          <span className="mx-3">
            •
          </span>

          DISCREET PACKAGING

          <span className="mx-3">
            •
          </span>

          EASY RETURNS
        </p>
      </div>

      {/* ===================================================
          MAIN HEADER
      =================================================== */}
>>>>>>> aman

      <header
        className="
          sticky
          top-0
<<<<<<< HEAD
          z-[100]
          w-full
          border-b
          border-[#211A18]/10
          bg-[#F7F3EF]
=======
          z-[1000]

          w-full

          border-b
          border-black/10

          bg-white

          md:bg-[#F8F4F0]
>>>>>>> aman
        "
      >
        <div
          className="
            mx-auto
<<<<<<< HEAD
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
=======

            flex
            h-[68px]
            max-w-[1600px]
            items-center

            px-2

            sm:px-4

            md:h-[74px]
            md:px-6

            xl:px-8
          "
        >
          {/* =================================================
              MOBILE HAMBURGER
          ================================================= */}

          <button
            type="button"
            aria-label="Open menu"
            onClick={() =>
              setMobileOpen(
                true
              )
            }
            className="
              flex
              h-11
              w-10
              shrink-0
              items-center
              justify-center

              text-black

              xl:hidden
            "
          >
            <MenuIcon />
          </button>

          {/* =================================================
              LOGO

              Hamburger ke baad thoda gap.
          ================================================= */}
>>>>>>> aman

          <Link
            href="/"
            aria-label="HivraSoft Home"
            className="
<<<<<<< HEAD
              flex
              shrink-0
              items-center
=======
              ml-2

              flex
              shrink-0
              items-center

              sm:ml-3

              xl:ml-0
>>>>>>> aman
            "
          >
            <Image
              src="/images/logos/hivra-soft-logo.png"
              alt="HivraSoft"
<<<<<<< HEAD
              width={150}
              height={58}
              priority
              className="
                h-auto
                w-[120px]
                object-contain
=======
              width={165}
              height={65}
              priority
              className="
                h-auto

                w-[116px]

                sm:w-[128px]

>>>>>>> aman
                xl:w-[145px]
              "
            />
          </Link>

          {/* =================================================
<<<<<<< HEAD
              DESKTOP NAVIGATION
=======
              DESKTOP NAV
>>>>>>> aman
          ================================================= */}

          <nav
            className="
<<<<<<< HEAD
              hidden
              h-full
              items-center
              gap-[22px]
=======
              mx-auto

              hidden
              h-full
              items-center

              gap-[24px]

>>>>>>> aman
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

<<<<<<< HEAD
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
=======
            <DesktopCategoryMenu
              label="Women"
              root={
                womenRoot
              }
              fallbackHref="/women/"
            />

            <DesktopCategoryMenu
              label="Men"
              root={
                menRoot
              }
              fallbackHref="/men/"
            />
>>>>>>> aman

            <NavLink href="/accessories/">
              Accessories
            </NavLink>

<<<<<<< HEAD
            {/* MORE */}

=======
>>>>>>> aman
            <div
              className="
                group
                relative
<<<<<<< HEAD
=======

>>>>>>> aman
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
<<<<<<< HEAD
                  gap-[5px]
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.1em]
                  text-[#211A18]
                  transition
                  hover:text-[#8C1839]
=======

                  gap-1.5

                  text-[10px]
                  font-bold
                  uppercase

                  tracking-[0.10em]

                  text-[#111111]
>>>>>>> aman
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
<<<<<<< HEAD
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
=======

                  w-[230px]

                  translate-y-2

                  border
                  border-[#F0CCD7]

                  bg-[#FFF7F9]

                  p-3

                  opacity-0

                  shadow-[0_18px_45px_rgba(0,0,0,.13)]

                  transition-all
>>>>>>> aman

                  group-hover:visible
                  group-hover:translate-y-0
                  group-hover:opacity-100
                "
              >
<<<<<<< HEAD
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
=======
                <DropdownLink href="/send-your-bra/">
                  Send Your Bra
                </DropdownLink>

                <DropdownLink href="/reseller-registration/">
                  Reseller Registration
                </DropdownLink>
>>>>>>> aman
              </div>
            </div>
          </nav>

          {/* =================================================
<<<<<<< HEAD
              DESKTOP RIGHT ICONS
=======
              RIGHT ICONS

              Search intentionally REMOVED.
>>>>>>> aman
          ================================================= */}

          <div
            className="
<<<<<<< HEAD
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
=======
              ml-auto

              flex
              items-center

              gap-0
            "
          >
            <button
              type="button"
              aria-label="Wishlist"
              onClick={() => {
                void commerce.openWishlist();
              }}
              className="
                relative

                flex
                h-10
                w-10
                items-center
                justify-center

                text-[#8C1839]
              "
            >
              <HeartIcon />

              {commerce.wishlistCount >
                0 && (
                <CountBadge
                  count={
                    commerce.wishlistCount
                  }
                />
              )}
            </button>

            <div
              className="
                hidden
                md:block
              "
            >
              <Account />
            </div>

            <button
              type="button"
              aria-label="Cart"
              onClick={() => {
                void commerce.openCart();
              }}
              className="
                relative

                flex
                h-10
                w-10
                items-center
                justify-center

                text-[#111111]

                md:ml-1
                md:rounded-full
                md:bg-[#211A18]
                md:text-white
>>>>>>> aman
              "
            >
              <BagIcon />

<<<<<<< HEAD
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
=======
              {commerce.cartCount >
                0 && (
                <CountBadge
                  count={
                    commerce.cartCount
                  }
                />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ===================================================
          MOBILE DRAWER
      =================================================== */}

      <div
        className={`
          fixed
          inset-0
          z-[10000]

          xl:hidden

          ${
            mobileOpen
              ? "pointer-events-auto"
              : "pointer-events-none"
          }
        `}
      >
        {/* OVERLAY */}

        <button
          type="button"
          aria-label="Close menu"
          onClick={() =>
            setMobileOpen(
              false
            )
          }
          className={`
            absolute
            inset-0

            bg-black/55

            transition-opacity
            duration-300

            ${
              mobileOpen
                ? "opacity-100"
                : "opacity-0"
            }
          `}
        />

        {/* =================================================
            DRAWER

            Around half screen, not full screen.
        ================================================= */}

        <aside
          className={`
            absolute
            bottom-0
            left-0
            top-0

            w-[60vw]
            max-w-[330px]

            overflow-y-auto
            overscroll-contain

            bg-white

            text-black

            shadow-[18px_0_45px_rgba(0,0,0,.25)]

            transition-transform
            duration-300

            ${
              mobileOpen
                ? "translate-x-0"
                : "-translate-x-full"
            }
          `}
        >
          {/* USER */}

          <div
            className="
              relative

              border-b
              border-black/10

              px-4
              pb-5
              pt-5
            "
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() =>
                setMobileOpen(
                  false
                )
              }
              className="
                absolute
                right-2
                top-2

                flex
                h-9
                w-9
                items-center
                justify-center

                text-[27px]

                text-black
              "
            >
              ×
            </button>

            <div
              className="
                flex
                items-center

                gap-3
              "
            >
              <div
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center

                  rounded-full

                  bg-[#48B2C4]

                  text-white
                "
              >
                <UserIcon />
              </div>

              <div
                className="
                  min-w-0
                "
              >
                <p
                  className="
                    truncate

                    text-[16px]
                    font-semibold

                    text-black
                  "
                >
                  Hi Dear
                </p>

                {commerce.isAuthenticated ===
                true ? (
                  <Link
                    href="/account/"
                    onClick={() =>
                      setMobileOpen(
                        false
                      )
                    }
                    className="
                      mt-1
                      block

                      text-[10px]
                      font-medium

                      text-[#D34A74]

                      underline
                    "
                  >
                    My Account
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(
                        false
                      );

                      requestLogin();
                    }}
                    className="
                      mt-1

                      text-[10px]
                      font-medium

                      text-[#D34A74]

                      underline
                    "
                  >
                    Login / Register
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* CATEGORY HEADING */}

          <div
            className="
              flex
              items-center
              justify-between

              border-b
              border-black/10

              px-3
              py-4
            "
          >
            <h2
              className="
                text-[16px]
                font-bold

                text-black
              "
            >
              Categories
            </h2>

            <Link
              href="/new-launch/"
              onClick={() =>
                setMobileOpen(
                  false
                )
              }
              className="
                text-[9px]
                font-semibold

                text-[#3DAFC0]

                underline
              "
            >
              Quick Links
            </Link>
          </div>

          {/* =================================================
              DYNAMIC ROOT CATEGORIES
          ================================================= */}

          <div>
            {categories.map(
              (
                category
              ) => (
                <MobileCategoryBranch
                  key={
                    category.id
                  }
                  node={
                    category
                  }
                  parentSlugs={[]}
                  depth={0}
                  expanded={
                    expanded
                  }
                  onToggle={
                    toggleExpanded
                  }
                  onNavigate={() =>
                    setMobileOpen(
                      false
                    )
                  }
                />
              )
            )}

            {/* ===============================================
                STATIC ROUTES ONLY IF NOT ALREADY DYNAMIC

                This fixes duplicate New Launch etc.
            =============================================== */}

            {additionalLinks.map(
              (
                item
              ) => (
                <MobileSimpleLink
                  key={
                    item.href
                  }
                  href={
                    item.href
                  }
                  onNavigate={() =>
                    setMobileOpen(
                      false
                    )
                  }
                >
                  {
                    item.name
                  }
                </MobileSimpleLink>
              )
            )}
          </div>
        </aside>
      </div>
>>>>>>> aman
    </>
  );
}

/* =========================================================
<<<<<<< HEAD
=======
   MOBILE CATEGORY TREE

   Arrow only when children exist.
========================================================= */

function MobileCategoryBranch({
  node,
  parentSlugs,
  depth,
  expanded,
  onToggle,
  onNavigate,
}: {
  node: HeaderCategory;

  parentSlugs: string[];

  depth: number;

  expanded:
    Set<string>;

  onToggle: (
    id: string
  ) => void;

  onNavigate:
    () => void;
}) {
  const currentSlugs = [
    ...parentSlugs,
    node.slug,
  ];

  const hasChildren =
    node.children.length >
    0;

  const open =
    expanded.has(
      node.id
    );

  return (
    <div
      className="
        border-b
        border-black/10
      "
    >
      <div
        className="
          flex
          min-h-[46px]
          items-center
        "
      >
        <Link
          href={categoryHref(
            currentSlugs
          )}
          onClick={
            onNavigate
          }
          className="
            min-w-0
            flex-1

            py-3

            pr-1

            text-[11px]
            font-medium

            text-black
          "
          style={{
            paddingLeft:
              `${14 + depth * 12}px`,
          }}
        >
          {
            node.name
          }
        </Link>

        {/* ONLY WHEN CHILDREN */}

        {hasChildren && (
          <button
            type="button"
            aria-label={`Open ${node.name}`}
            onClick={() =>
              onToggle(
                node.id
              )
            }
            className="
              flex
              h-[46px]
              w-10
              shrink-0
              items-center
              justify-center

              text-[17px]

              text-black
            "
          >
            <span
              className={`
                transition-transform
                duration-200

                ${
                  open
                    ? "rotate-90"
                    : ""
                }
              `}
            >
              ›
            </span>
          </button>
        )}
      </div>

      {/* ===================================================
          OPENED CATEGORY AREA = LIGHT PINK
      =================================================== */}

      {hasChildren &&
        open && (
        <div
          className="
            border-t
            border-[#F2DDE4]

            bg-[#FFF4F7]
          "
        >
          {node.children.map(
            (
              child
            ) => (
              <MobileCategoryBranch
                key={
                  child.id
                }
                node={
                  child
                }
                parentSlugs={
                  currentSlugs
                }
                depth={
                  depth + 1
                }
                expanded={
                  expanded
                }
                onToggle={
                  onToggle
                }
                onNavigate={
                  onNavigate
                }
              />
            )
          )}

          {/* VIEW ALL */}

          <div
            className="
              border-t
              border-[#EFCFD9]

              px-3
              py-3
            "
          >
            <Link
              href={categoryHref(
                currentSlugs
              )}
              onClick={
                onNavigate
              }
              className="
                text-[10px]
                font-bold

                text-[#A31543]

                underline
                underline-offset-2
              "
            >
              View All{" "}
              {
                node.name
              }
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   MOBILE SIMPLE LINK
========================================================= */

function MobileSimpleLink({
  href,
  children,
  onNavigate,
}: {
  href: string;

  children: ReactNode;

  onNavigate:
    () => void;
}) {
  return (
    <Link
      href={
        href
      }
      onClick={
        onNavigate
      }
      className="
        flex
        min-h-[46px]
        items-center

        border-b
        border-black/10

        px-3
        py-3

        text-[11px]
        font-medium

        text-black
      "
    >
      {
        children
      }
    </Link>
  );
}

/* =========================================================
   DESKTOP DYNAMIC CATEGORY MENU
========================================================= */

function DesktopCategoryMenu({
  label,
  root,
  fallbackHref,
}: {
  label: string;

  root?:
    HeaderCategory;

  fallbackHref: string;
}) {
  /*
   * No children = no dropdown arrow/menu.
   */

  if (
    !root ||
    root.children.length ===
      0
  ) {
    return (
      <NavLink
        href={
          root
            ? categoryHref(
                [
                  root.slug,
                ]
              )
            : fallbackHref
        }
      >
        {
          label
        }
      </NavLink>
    );
  }

  return (
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
        href={categoryHref(
          [
            root.slug,
          ]
        )}
        className="
          flex
          h-full
          items-center

          gap-1.5

          text-[10px]
          font-bold
          uppercase

          tracking-[0.10em]

          text-[#111111]

          transition

          hover:text-[#8C1839]
        "
      >
        {
          label
        }

        <ChevronDown />
      </Link>

      {/* ===================================================
          LIGHT PINK DYNAMIC DROPDOWN
      =================================================== */}

      <div
        className="
          invisible

          absolute
          left-1/2
          top-full

          w-[590px]

          -translate-x-1/2
          translate-y-2

          border
          border-[#F0CFD9]

          bg-[#FFF7F9]

          opacity-0

          shadow-[0_22px_55px_rgba(0,0,0,.14)]

          transition-all
          duration-200

          group-hover:visible
          group-hover:translate-y-0
          group-hover:opacity-100
        "
      >
        <div
          className="
            grid
            grid-cols-3

            gap-x-7
            gap-y-7

            p-6
          "
        >
          {root.children.map(
            (
              category
            ) => (
              <div
                key={
                  category.id
                }
              >
                <Link
                  href={categoryHref(
                    [
                      root.slug,
                      category.slug,
                    ]
                  )}
                  className="
                    text-[11px]
                    font-bold
                    uppercase

                    tracking-[0.08em]

                    text-[#111111]

                    transition

                    hover:text-[#A31543]
                  "
                >
                  {
                    category.name
                  }
                </Link>

                {/* ONLY SHOW CHILDREN IF PRESENT */}

                {category.children
                  .length >
                  0 && (
                  <div
                    className="
                      mt-3

                      space-y-2.5
                    "
                  >
                    {category.children.map(
                      (
                        child
                      ) => (
                        <Link
                          key={
                            child.id
                          }
                          href={categoryHref(
                            [
                              root.slug,
                              category.slug,
                              child.slug,
                            ]
                          )}
                          className="
                            block

                            text-[11px]
                            font-medium

                            text-[#6C6265]

                            transition

                            hover:text-[#A31543]
                          "
                        >
                          {
                            child.name
                          }
                        </Link>
                      )
                    )}
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {/* =================================================
            BOTTOM VIEW ALL
        ================================================= */}

        <div
          className="
            border-t
            border-[#EBCED7]

            px-6
            py-4
          "
        >
          <Link
            href={categoryHref(
              [
                root.slug,
              ]
            )}
            className="
              inline-flex
              items-center

              gap-2

              text-[10px]
              font-bold
              uppercase

              tracking-[0.1em]

              text-[#A31543]

              transition

              hover:underline
            "
          >
            View All{" "}
            {
              root.name
            }

            <span>
              →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
>>>>>>> aman
   NAV LINK
========================================================= */

function NavLink({
  href,
  children,
}: {
  href: string;
<<<<<<< HEAD
=======

>>>>>>> aman
  children: ReactNode;
}) {
  return (
    <Link
<<<<<<< HEAD
      href={href}
=======
      href={
        href
      }
>>>>>>> aman
      className="
        flex
        h-full
        items-center
<<<<<<< HEAD
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
=======

        text-[10px]
        font-bold
        uppercase

        tracking-[0.10em]

        text-[#111111]

        transition

        hover:text-[#8C1839]
      "
    >
      {
        children
      }
>>>>>>> aman
    </Link>
  );
}

/* =========================================================
<<<<<<< HEAD
   MOBILE LINK
========================================================= */

function MobileLink({
  href,
  close,
  children,
}: {
  href: string;
  close: () => void;
=======
   DROPDOWN LINK
========================================================= */

function DropdownLink({
  href,
  children,
}: {
  href: string;

>>>>>>> aman
  children: ReactNode;
}) {
  return (
    <Link
<<<<<<< HEAD
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
=======
      href={
        href
      }
      className="
        block

        rounded-[6px]

        px-3
        py-2.5

        text-[11px]
        font-medium

        text-[#111111]

        transition

        hover:bg-[#FBE9EF]
        hover:text-[#A31543]
      "
    >
      {
        children
      }
>>>>>>> aman
    </Link>
  );
}

/* =========================================================
<<<<<<< HEAD
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
=======
   BADGE
========================================================= */

function CountBadge({
  count,
}: {
  count: number;
}) {
  return (
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

        bg-[#D91B58]

        px-1

        text-[8px]
        font-bold

        text-white
      "
    >
      {count >
      99
        ? "99+"
        : count}
    </span>
>>>>>>> aman
  );
}

/* =========================================================
   ICONS
========================================================= */

<<<<<<< HEAD
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
=======
function MenuIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <path d="M3 6h18" />
      <path d="M3 12h13" />
      <path d="M3 18h18" />
>>>>>>> aman
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg
<<<<<<< HEAD
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
=======
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
>>>>>>> aman
    >
      <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg
<<<<<<< HEAD
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

=======
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 8h14l-1 13H6L5 8Z" />
>>>>>>> aman
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

<<<<<<< HEAD
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
=======
function UserIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle
        cx="12"
        cy="8"
        r="4"
      />

      <path d="M5 21c0-4 3-7 7-7s7 3 7 7" />
>>>>>>> aman
    </svg>
  );
}

<<<<<<< HEAD
function CloseIcon() {
  return (
    <svg
      width="21"
      height="21"
=======
function ChevronDown() {
  return (
    <svg
      width="10"
      height="10"
>>>>>>> aman
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
<<<<<<< HEAD
      aria-hidden="true"
    >
      <path d="m6 6 12 12M18 6 6 18" />
=======
    >
      <path d="m6 9 6 6 6-6" />
>>>>>>> aman
    </svg>
  );
}