"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import Account from "../Auth/Account";

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
  },
];

/* =========================================================
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
  value: unknown
) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "");
}

/* =========================================================
   HEADER
========================================================= */

type HeaderOffer = {

  _id: string;



  name: string;



  slug: string;



  offerType:

    | "buy_get"

    | "fixed_price_bundle";



  buyQuantity: number;



  getQuantity: number;



  isActive: boolean;

};

type HeaderOfferResponse = {

  success?: boolean;



  offer?:

    HeaderOffer;



  message?: string;

};

type HeaderSearchItem = {
  id: string;
  label: string;
  type: string;
  subtitle: string;
  href: string | null;
};

function toRecord(
  value: unknown,
): Record<string, unknown> | null {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as Record<string, unknown>;
}

function getSearchHref(
  item: Record<string, unknown>,
  type: string,
) {
  const directHref =
    String(
      item.href ||
        item.url ||
        item.path ||
        item.redirect ||
        "",
    ).trim();

  if (directHref) {
    return directHref;
  }

  const slug =
    cleanSlug(
      item.slug,
    );

  if (
    type === "category" &&
    slug
  ) {
    return `/${encodeURIComponent(slug)}`;
  }

  return null;
}

function normalizeSearchItems(
  response: unknown,
): HeaderSearchItem[] {
  const collected: Array<{
    value: unknown;
    fallbackType: string;
  }> = [];

  const pushArray = (
    value: unknown,
    fallbackType = "",
  ) => {
    if (!Array.isArray(value)) {
      return;
    }

    value.forEach((entry) => {
      collected.push({
        value: entry,
        fallbackType,
      });
    });
  };

  if (Array.isArray(response)) {
    pushArray(response);
  }

  const root =
    toRecord(response);

  if (root) {
    pushArray(
      root.results,
    );

    pushArray(
      root.suggestions,
    );

    pushArray(
      root.items,
    );

    pushArray(
      root.products,
      "product",
    );

    pushArray(
      root.categories,
      "category",
    );

    pushArray(
      root.blogs,
      "blog",
    );

    if (
      Array.isArray(
        root.data,
      )
    ) {
      pushArray(
        root.data,
      );
    }

    const data =
      toRecord(
        root.data,
      );

    if (data) {
      pushArray(
        data.results,
      );

      pushArray(
        data.suggestions,
      );

      pushArray(
        data.items,
      );

      pushArray(
        data.products,
        "product",
      );

      pushArray(
        data.categories,
        "category",
      );

      pushArray(
        data.blogs,
        "blog",
      );
    }
  }

  const normalized =
    collected
      .map(
        (
          entry,
          index,
        ): HeaderSearchItem | null => {
          if (
            typeof entry.value ===
            "string"
          ) {
            const label =
              entry.value.trim();

            if (!label) {
              return null;
            }

            return {
              id:
                `search-${label}-${index}`,
              label,
              type:
                entry.fallbackType ||
                "suggestion",
              subtitle: "",
              href: null,
            };
          }

          const item =
            toRecord(
              entry.value,
            );

          if (!item) {
            return null;
          }

          const label =
            String(
              item.title ||
                item.name ||
                item.label ||
                item.query ||
                "",
            ).trim();

          if (!label) {
            return null;
          }

          const type =
            String(
              item.type ||
                item.kind ||
                item.searchType ||
                entry.fallbackType ||
                "result",
            )
              .trim()
              .toLowerCase();

          const subtitle =
            String(
              item.subtitle ||
                item.description ||
                item.categoryName ||
                "",
            ).trim();

          const id =
            String(
              item.id ||
                item._id ||
                item.slug ||
                `${type}-${label}-${index}`,
            );

          return {
            id,
            label,
            type,
            subtitle,
            href:
              getSearchHref(
                item,
                type,
              ),
          };
        },
      )
      .filter(
        (
          item,
        ): item is HeaderSearchItem =>
          Boolean(item),
      );

  const unique =
    new Map<
      string,
      HeaderSearchItem
    >();

  normalized.forEach(
    (
      item,
    ) => {
      const key =
        `${item.type}:${item.id}:${item.label}`;

      if (
        !unique.has(
          key,
        )
      ) {
        unique.set(
          key,
          item,
        );
      }
    },
  );

  return Array.from(
    unique.values(),
  ).slice(
    0,
    8,
  );
}

function HeaderSearch() {
  const [
    query,
    setQuery,
  ] =
    useState("");

  const [
    items,
    setItems,
  ] =
    useState<
      HeaderSearchItem[]
    >([]);

  const [
    open,
    setOpen,
  ] =
    useState(false);

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  useEffect(() => {
    const searchText =
      query.trim();

    if (
      searchText.length <
      2
    ) {
      setItems([]);
      setOpen(false);
      setLoading(false);

      return;
    }

    let cancelled =
      false;

    const timer =
      window.setTimeout(
        async () => {
          setLoading(
            true,
          );

          try {
            const response =
              await apiFetch<unknown>(
                `/api/search/suggestions?q=${encodeURIComponent(
                  searchText,
                )}`,
                {
                  method:
                    "GET",
                },
              );

            if (
              cancelled
            ) {
              return;
            }

            setItems(
              normalizeSearchItems(
                response,
              ),
            );

            setOpen(
              true,
            );
          } catch (
            error
          ) {
            if (
              !cancelled
            ) {
              console.error(
                "HEADER SEARCH SUGGESTIONS ERROR:",
                error,
              );

              setItems(
                [],
              );
            }
          } finally {
            if (
              !cancelled
            ) {
              setLoading(
                false,
              );
            }
          }
        },
        250,
      );

    return () => {
      cancelled =
        true;

      window.clearTimeout(
        timer,
      );
    };
  }, [
    query,
  ]);

  async function runGlobalSearch() {
    const searchText =
      query.trim();

    if (
      !searchText
    ) {
      return;
    }

    setLoading(
      true,
    );

    try {
      const response =
        await apiFetch<unknown>(
          `/api/search/global?q=${encodeURIComponent(
            searchText,
          )}&page=1&limit=8`,
          {
            method:
              "GET",
          },
        );

      setItems(
        normalizeSearchItems(
          response,
        ),
      );

      setOpen(
        true,
      );
    } catch (
      error
    ) {
      console.error(
        "HEADER GLOBAL SEARCH ERROR:",
        error,
      );

      setItems(
        [],
      );

      setOpen(
        true,
      );
    } finally {
      setLoading(
        false,
      );
    }
  }

  return (
    <form
      onSubmit={(
        event,
      ) => {
        event.preventDefault();

        void runGlobalSearch();
      }}
      className="
        relative
        min-w-0
        flex-1
        w-full
      "
    >
      <div
        className="
          flex
          h-[28px]
          w-full
          items-center
          gap-2
          rounded-full
          border
          border-black/15
          bg-white
          px-3
          text-black
          shadow-sm
        "
      >
        <span
          className="
            flex
            shrink-0
            items-center
            justify-center
            text-black/65
          "
        >
          <SearchIcon />
        </span>

        <input
          value={
            query
          }
          onChange={(
            event,
          ) => {
            setQuery(
              event.target.value,
            );
          }}
          onFocus={() => {
            if (
              query.trim().length >=
                2
            ) {
              setOpen(
                true,
              );
            }
          }}
          onBlur={() => {
            window.setTimeout(
              () => {
                setOpen(
                  false,
                );
              },
              140,
            );
          }}
          placeholder="Search..."
          aria-label="Search products, categories and blogs"
          className="
            min-w-0
            flex-1
            bg-transparent
            text-[11px]
            font-medium
            text-black
            outline-none
            placeholder:text-black/45
          "
        />

        {loading ? (
          <span
            className="
              h-3
              w-3
              shrink-0
              animate-spin
              rounded-full
              border
              border-black/25
              border-t-black
            "
          />
        ) : null}
      </div>

      {open ? (
        <div
          className="
            absolute
            right-0
            top-[calc(100%+7px)]
            z-[1600]
            w-full
            min-w-[320px]
            overflow-hidden
            rounded-[12px]
            border
            border-black/10
            bg-white
            text-black
            shadow-[0_20px_50px_rgba(0,0,0,.22)]
          "
        >
          {items.length >
          0 ? (
            <div
              className="
                max-h-[360px]
                overflow-y-auto
                p-2
              "
            >
              {items.map(
                (
                  item,
                ) => {
                  const content = (
                    <>
                      <div
                        className="
                          min-w-0
                          flex-1
                        "
                      >
                        <p
                          className="
                            truncate
                            text-[12px]
                            font-semibold
                            text-[#211A18]
                          "
                        >
                          {
                            item.label
                          }
                        </p>

                        <div
                          className="
                            mt-1
                            flex
                            items-center
                            gap-2
                          "
                        >
                          <span
                            className="
                              rounded-full
                              bg-[#F8E9EF]
                              px-2
                              py-0.5
                              text-[8px]
                              font-bold
                              uppercase
                              tracking-[0.08em]
                              text-[#B31345]
                            "
                          >
                            {
                              item.type
                            }
                          </span>

                          {item.subtitle ? (
                            <span
                              className="
                                truncate
                                text-[9px]
                                text-black/50
                              "
                            >
                              {
                                item.subtitle
                              }
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <span
                        className="
                          shrink-0
                          text-black/35
                        "
                      >
                        →
                      </span>
                    </>
                  );

                  if (
                    item.href
                  ) {
                    return (
                      <Link
                        key={
                          item.id
                        }
                        href={
                          item.href
                        }
                        className="
                          flex
                          items-center
                          gap-3
                          rounded-[9px]
                          px-3
                          py-2.5
                          transition
                          hover:bg-[#FFF2F6]
                        "
                      >
                        {
                          content
                        }
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={
                        item.id
                      }
                      type="button"
                      onMouseDown={(
                        event,
                      ) => {
                        event.preventDefault();

                        setQuery(
                          item.label,
                        );
                      }}
                      className="
                        flex
                        w-full
                        items-center
                        gap-3
                        rounded-[9px]
                        px-3
                        py-2.5
                        text-left
                        transition
                        hover:bg-[#FFF2F6]
                      "
                    >
                      {
                        content
                      }
                    </button>
                  );
                },
              )}
            </div>
          ) : (
            <div
              className="
                px-4
                py-4
                text-center
                text-[11px]
                text-black/55
              "
            >
              {loading
                ? "Searching..."
                : "No search results found"}
            </div>
          )}
        </div>
      ) : null}
    </form>
  );
}

function ResellerTicker() {
  const content = (
    <div
      className="
        flex
        shrink-0
        items-center
        whitespace-nowrap
      "
    >
      <span
        className="
          px-8
          text-[10px]
          font-bold
          uppercase
          tracking-[0.035em]
          text-white
        "
      >
        ◆ &nbsp; BECOME A HIVRASOFT RESELLER
      </span>

      <span
        className="
          px-8
          text-[10px]
          font-semibold
          text-white
        "
      >
        ◆ &nbsp; Sell India&apos;s Most Comfortable Innerwear — Zero Stock, High Profit
      </span>

      <span
        className="
          px-8
          text-[10px]
          font-bold
          uppercase
          tracking-[0.035em]
          text-white
        "
      >
        ◆ &nbsp; BECOME A HIVRASOFT RESELLER
      </span>

      <span
        className="
          px-8
          text-[10px]
          font-semibold
          text-white
        "
      >
        ◆ &nbsp; Sell India&apos;s Most Comfortable Innerwear — Zero Stock, High Profit
      </span>
    </div>
  );

  return (
    <>
      <style>
        {`
          @keyframes hivraHeaderTicker {
            from {
              transform: translateX(0);
            }

            to {
              transform: translateX(-50%);
            }
          }
        `}
      </style>

      <div
        className="
          hidden
          h-[30px]
          w-full
          overflow-hidden
          bg-[#B31345]
          md:block
        "
      >
        <div
          className="
            flex
            h-full
            w-max
            items-center
            will-change-transform
          "
          style={{
            animation:
              "hivraHeaderTicker 24s linear infinite",
          }}
        >
          {content}
          {content}
        </div>
      </div>
    </>
  );
}

function SearchIcon() {

  return (

    <svg

      width="22"

      height="22"

      viewBox="0 0 24 24"

      fill="none"

      stroke="currentColor"

      strokeWidth="1.7"

      strokeLinecap="round"

      strokeLinejoin="round"

    >

      <circle

        cx="11"

        cy="11"

        r="7"

      />



      <path d="m20 20-4-4" />

    </svg>

  );

}

export default function Header() {
  const [buyGetOffer, setBuyGetOffer] = useState<HeaderOffer | null>(null);
  useEffect(() => {
    let cancelled = false;
    void apiFetch<HeaderOfferResponse>("/api/offers/featured/buy-get", { method: "GET" })
      .then((response) => {
        const offer = response?.offer;
        if (!cancelled) setBuyGetOffer(offer?.isActive && offer.name && offer.slug ? offer : null);
      }).catch(() => { if (!cancelled) setBuyGetOffer(null); });
    return () => { cancelled = true; };
  }, []);
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

      return UTILITY_LINKS.map((item) => item.slug === "buy-3-get-1-free" && buyGetOffer
        ? { ...item, name: buyGetOffer.name, href: `/offers/${encodeURIComponent(buyGetOffer.slug)}` }
        : item).filter(
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
      categories, buyGetOffer,
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
    return null;
  }

  return (
    <>
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
        "
      >
        <p
          className="
            text-[8px]
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

      <header
        className="
          sticky
          top-0
          z-[1000]

          w-full

          border-b
          border-black/10

          bg-white

          md:bg-[#F8F4F0]
        "
      >
        <div
          className="
            mx-auto

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

          <Link
            href="/"
            aria-label="HivraSoft Home"
            className="
              ml-2

              flex
              shrink-0
              items-center

              sm:ml-3

              xl:ml-0
            "
          >
            <Image
              src="/images/logos/hivra-soft-logo.png"
              alt="HivraSoft"
              width={165}
              height={65}
              priority
              className="
                h-auto

                w-[116px]

                sm:w-[128px]

                xl:w-[145px]
              "
            />
          </Link>

          {/* =================================================
              DESKTOP NAV
          ================================================= */}

          <nav
            className="
              mx-auto

              hidden
              h-full
              items-center

              gap-[24px]

              xl:flex
            "
          >
            <NavLink href="/bundle-pricing/">
              Bundle Pricing
            </NavLink>

            <NavLink href="/new-launch/">
              New Launch
            </NavLink>

            <NavLink href={buyGetOffer ? `/offers/${encodeURIComponent(buyGetOffer.slug)}` : "/buy-3-get-1-free/"}>
              {buyGetOffer?.name || "Buy 3 Get 1 Free"}
            </NavLink>

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

            <NavLink href="/accessories/">
              Accessories
            </NavLink>

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

                  gap-1.5

                  text-[10px]
                  font-bold
                  uppercase

                  tracking-[0.10em]

                  text-[#111111]
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

                  w-[230px]

                  translate-y-2

                  border
                  border-[#F0CCD7]

                  bg-[#FFF7F9]

                  p-3

                  opacity-0

                  shadow-[0_18px_45px_rgba(0,0,0,.13)]

                  transition-all

                  group-hover:visible
                  group-hover:translate-y-0
                  group-hover:opacity-100
                "
              >
                <DropdownLink href="/send-your-bra/">
                  Send Your Bra
                </DropdownLink>

                <DropdownLink href="/reseller-registration/">
                  Reseller Registration
                </DropdownLink>
              </div>
            </div>
          </nav>

          {/* =================================================
              RIGHT ICONS

              Search is shown below the main navigation.
          ================================================= */}

          <div
            className="
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
              "
            >
              <BagIcon />

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
        <div className="mx-auto flex max-w-[1600px] px-4 pb-2"><HeaderSearch /></div>
      </header>
      <ResellerTicker />

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
    </>
  );
}

/* =========================================================
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
      href={
        href
      }
      className="
        flex
        h-full
        items-center

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
    </Link>
  );
}

/* =========================================================
   DROPDOWN LINK
========================================================= */

function DropdownLink({
  href,
  children,
}: {
  href: string;

  children: ReactNode;
}) {
  return (
    <Link
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
    </Link>
  );
}

/* =========================================================
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
  );
}

/* =========================================================
   ICONS
========================================================= */

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
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg
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
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

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
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
