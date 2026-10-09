"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import Account from "../Auth/Account";

import {
  apiFetch,
} from "@/lib/api";

import {
  useStorefrontCommerce,
} from "@/src/components/Storefront/StorefrontCommerceProvider";

/* =========================================================
   LOGOS
========================================================= */

const DESKTOP_LOGO_SRC =
  "/images/logos/hivra-desktop.png.png";

const MOBILE_LOGO_SRC =
  "/images/logos/hivramobile.png.png";

/* =========================================================
   MEN / WOMEN MEGA MENU IMAGES

   IMPORTANT:

   public/
   └── images/
       └── header-menu/
           ├── men-1.jpeg
           ├── men-2.jpeg
           ├── men-3.jpeg
           ├── men-4.jpeg
           ├── women-1.jpeg
           ├── women-2.jpeg
           ├── women-3.jpeg
           └── women-4.jpeg
========================================================= */

const MEN_MEGA_IMAGES = [
  "/images/header-menu/men-1.jpeg",
  "/images/header-menu/men-2.jpeg",
  "/images/header-menu/men-3.jpeg",
  "/images/header-menu/men-4.jpeg",
];

const WOMEN_MEGA_IMAGES = [
  "/images/header-menu/women-1.jpeg",
  "/images/header-menu/women-2.jpeg",
  "/images/header-menu/women-3.jpeg",
  "/images/header-menu/women-4.jpeg",
];


/* =========================================================
   HEADER CATEGORY CACHE

   Cache ka purpose:
   - refresh par purana tree turant dikhe
   - blank/flicker kam ho
   - background me latest tree hamesha fetch ho
   - admin se new category add ho to next refresh par aa jaye
========================================================= */

const HEADER_CATEGORY_CACHE_KEY =
  "hivra:header-categories:v3";

type HeaderCategoryCache = {
  savedAt: number;
  categories: HeaderCategory[];
};

/* =========================================================
   TYPES
========================================================= */

type HeaderCategory = {
  id: string;

  name: string;

  slug: string;

  parent:
    | string
    | null;

  ancestors:
    string[];

  level: number;

  isActive: boolean;

  sortOrder: number;

  children:
    HeaderCategory[];
};

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

type HeaderNavItem =
  | {
      type:
        "category";

      key:
        string;

      category:
        HeaderCategory;
    }
  | {
      type:
        "offer";

      key:
        string;

      name:
        string;

      href:
        string;
    };

type HeaderSearchItem = {
  id: string;

  label: string;

  type: string;

  subtitle: string;

  href:
    string | null;
};

/* =========================================================
   CLEAN SLUG
========================================================= */

function cleanSlug(
  value:
    unknown
) {
  return String(
    value ||
      ""
  )
    .trim()
    .toLowerCase()
    .replace(
      /^\/+|\/+$/g,
      ""
    );
}

/* =========================================================
   CATEGORY URL
========================================================= */

function categoryHref(
  slugs:
    string[]
) {
  const cleaned =
    slugs
      .filter(
        Boolean
      )
      .map(
        cleanSlug
      );

  /*
   * Existing new-launch route support.
   */
  if (
    cleaned.length ===
      1 &&
    (
      cleaned[0] ===
        "new-launch" ||
      cleaned[0] ===
        "new-launches" ||
      cleaned[0] ===
        "new-arrival" ||
      cleaned[0] ===
        "new-arrivals"
    )
  ) {
    return "/new-innerwear-online";
  }

  return `/${cleaned
    .map(
      encodeURIComponent
    )
    .join("/")}`;
}

/* =========================================================
   MEGA MENU IMAGES
========================================================= */

function getMegaMenuImages(
  slug:
    string
) {
  const value =
    cleanSlug(
      slug
    );

  if (
    value ===
      "men" ||
    value ===
      "mens" ||
    value ===
      "man"
  ) {
    return MEN_MEGA_IMAGES;
  }

  if (
    value ===
      "women" ||
    value ===
      "womens" ||
    value ===
      "woman"
  ) {
    return WOMEN_MEGA_IMAGES;
  }

  return null;
}

/* =========================================================
   NORMALIZE CATEGORY
========================================================= */

function normalizeCategory(
  value:
    unknown
):
  HeaderCategory |
  null {
  if (
    !value ||
    typeof value !==
      "object"
  ) {
    return null;
  }

  const raw =
    value as Record<
      string,
      unknown
    >;

  const id =
    String(
      raw.id ||
        raw._id ||
        ""
    ).trim();

  const name =
    String(
      raw.name ||
        ""
    ).trim();

  const slug =
    cleanSlug(
      raw.slug
    );

  const isActive =
    raw.isActive !==
    false;

  if (
    !id ||
    !name ||
    !slug ||
    !isActive
  ) {
    return null;
  }

  const parent =
    raw.parent ===
      null ||
    raw.parent ===
      undefined ||
    raw.parent ===
      ""
      ? null
      : String(
          raw.parent
        );

  const ancestors =
    Array.isArray(
      raw.ancestors
    )
      ? raw.ancestors.map(
          (
            ancestor
          ) =>
            String(
              ancestor
            )
        )
      : [];

  const rawChildren =
    Array.isArray(
      raw.children
    )
      ? raw.children
      : [];

  const children =
    rawChildren
      .map(
        normalizeCategory
      )
      .filter(
        (
          child
        ): child is HeaderCategory =>
          Boolean(
            child
          )
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
    id,

    name,

    slug,

    parent,

    ancestors,

    level:
      Number(
        raw.level ||
          0
      ),

    isActive,

    sortOrder:
      Number(
        raw.sortOrder ||
          0
      ),

    children,
  };
}

/* =========================================================
   NORMALIZE CATEGORY TREE
========================================================= */

function normalizeTree(
  response:
    unknown
):
  HeaderCategory[] {
  let rawTree:
    unknown[] = [];

  if (
    Array.isArray(
      response
    )
  ) {
    rawTree =
      response;
  } else if (
    response &&
    typeof response ===
      "object"
  ) {
    const object =
      response as Record<
        string,
        unknown
      >;

    if (
      Array.isArray(
        object.categories
      )
    ) {
      rawTree =
        object.categories;
    } else if (
      Array.isArray(
        object.data
      )
    ) {
      rawTree =
        object.data;
    } else if (
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
        rawTree =
          data.categories;
      }
    }
  }

  return rawTree
    .map(
      normalizeCategory
    )
    .filter(
      (
        category
      ): category is HeaderCategory =>
        Boolean(
          category
        )
    )
    .filter(
      (
        category
      ) =>
        category.parent ===
        null
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

/* =========================================================
   HEADER CATEGORY CACHE HELPERS
========================================================= */

function readHeaderCategoryCache():
  HeaderCategoryCache | null {
  if (
    typeof window ===
    "undefined"
  ) {
    return null;
  }

  try {
    const raw =
      window.localStorage.getItem(
        HEADER_CATEGORY_CACHE_KEY
      );

    if (
      !raw
    ) {
      return null;
    }

    const parsed =
      JSON.parse(
        raw
      ) as Partial<HeaderCategoryCache>;

    if (
      !parsed ||
      !Number.isFinite(
        parsed.savedAt
      ) ||
      !Array.isArray(
        parsed.categories
      )
    ) {
      window.localStorage.removeItem(
        HEADER_CATEGORY_CACHE_KEY
      );

      return null;
    }

    return {
      savedAt:
        Number(
          parsed.savedAt
        ),

      categories:
        parsed.categories as HeaderCategory[],
    };
  } catch (
    error
  ) {
    console.error(
      "HEADER CATEGORY CACHE READ ERROR:",
      error
    );

    return null;
  }
}

function writeHeaderCategoryCache(
  categories:
    HeaderCategory[]
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  try {
    const payload:
      HeaderCategoryCache = {
        savedAt:
          Date.now(),

        categories,
      };

    window.localStorage.setItem(
      HEADER_CATEGORY_CACHE_KEY,

      JSON.stringify(
        payload
      )
    );
  } catch (
    error
  ) {
    console.error(
      "HEADER CATEGORY CACHE WRITE ERROR:",
      error
    );
  }
}

/* =========================================================
   RECORD HELPER
========================================================= */

function toRecord(
  value:
    unknown
):
  Record<
    string,
    unknown
  > |
  null {
  if (
    !value ||
    typeof value !==
      "object" ||
    Array.isArray(
      value
    )
  ) {
    return null;
  }

  return value as Record<
    string,
    unknown
  >;
}

/* =========================================================
   SEARCH HREF
========================================================= */

function getSearchHref(
  item:
    Record<
      string,
      unknown
    >,

  type:
    string
) {
  const directHref =
    String(
      item.href ||
        item.url ||
        item.path ||
        item.redirect ||
        ""
    ).trim();

  if (
    directHref
  ) {
    return directHref;
  }

  const slug =
    cleanSlug(
      item.slug
    );

  if (
    type ===
      "product" &&
    slug
  ) {
    return `/product/${encodeURIComponent(
      slug
    )}`;
  }

  if (
    type ===
      "category" &&
    slug
  ) {
    return `/${encodeURIComponent(
      slug
    )}`;
  }

  return null;
}

/* =========================================================
   NORMALIZE SEARCH
========================================================= */

function normalizeSearchItems(
  response:
    unknown
):
  HeaderSearchItem[] {
  const collected:
    Array<{
      value:
        unknown;

      fallbackType:
        string;
    }> = [];

  const pushArray = (
    value:
      unknown,

    fallbackType =
      ""
  ) => {
    if (
      !Array.isArray(
        value
      )
    ) {
      return;
    }

    value.forEach(
      (
        entry
      ) => {
        collected.push({
          value:
            entry,

          fallbackType,
        });
      }
    );
  };

  if (
    Array.isArray(
      response
    )
  ) {
    pushArray(
      response
    );
  }

  const root =
    toRecord(
      response
    );

  if (
    root
  ) {
    pushArray(
      root.results
    );

    pushArray(
      root.suggestions
    );

    pushArray(
      root.items
    );

    pushArray(
      root.products,
      "product"
    );

    pushArray(
      root.categories,
      "category"
    );

    pushArray(
      root.blogs,
      "blog"
    );

    if (
      Array.isArray(
        root.data
      )
    ) {
      pushArray(
        root.data
      );
    }

    const data =
      toRecord(
        root.data
      );

    if (
      data
    ) {
      pushArray(
        data.results
      );

      pushArray(
        data.suggestions
      );

      pushArray(
        data.items
      );

      pushArray(
        data.products,
        "product"
      );

      pushArray(
        data.categories,
        "category"
      );

      pushArray(
        data.blogs,
        "blog"
      );
    }
  }

  const normalized =
    collected
      .map(
        (
          entry,
          index
        ):
          HeaderSearchItem |
          null => {
          if (
            typeof entry.value ===
            "string"
          ) {
            const label =
              entry.value.trim();

            if (
              !label
            ) {
              return null;
            }

            return {
              id:
                `search-${label}-${index}`,

              label,

              type:
                entry.fallbackType ||
                "suggestion",

              subtitle:
                "",

              href:
                null,
            };
          }

          const item =
            toRecord(
              entry.value
            );

          if (
            !item
          ) {
            return null;
          }

          const label =
            String(
              item.title ||
                item.name ||
                item.label ||
                item.query ||
                ""
            ).trim();

          if (
            !label
          ) {
            return null;
          }

          const type =
            String(
              item.type ||
                item.kind ||
                item.searchType ||
                entry.fallbackType ||
                "result"
            )
              .trim()
              .toLowerCase();

          const subtitle =
            String(
              item.subtitle ||
                item.description ||
                item.categoryName ||
                ""
            ).trim();

          const id =
            String(
              item.id ||
                item._id ||
                item.slug ||
                `${type}-${label}-${index}`
            );

          return {
            id,

            label,

            type,

            subtitle,

            href:
              getSearchHref(
                item,
                type
              ),
          };
        }
      )
      .filter(
        (
          item
        ): item is HeaderSearchItem =>
          Boolean(
            item
          )
      );

  const unique =
    new Map<
      string,
      HeaderSearchItem
    >();

  normalized.forEach(
    (
      item
    ) => {
      const key =
        `${item.type}:${item.id}:${item.label}`;

      if (
        !unique.has(
          key
        )
      ) {
        unique.set(
          key,
          item
        );
      }
    }
  );

  return Array.from(
    unique.values()
  ).slice(
    0,
    8
  );
}

/* =========================================================
   SEARCH COMPONENT
========================================================= */

function HeaderSearch() {
  const [
    query,
    setQuery,
  ] =
    useState(
      ""
    );

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
    useState(
      false
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      false
    );

  useEffect(() => {
    const searchText =
      query.trim();

    if (
      searchText.length <
      2
    ) {
      setItems(
        []
      );

      setOpen(
        false
      );

      setLoading(
        false
      );

      return;
    }

    let cancelled =
      false;

    const timer =
      window.setTimeout(
        async () => {
          setLoading(
            true
          );

          try {
            const response =
              await apiFetch<unknown>(
                `/api/search/suggestions?q=${encodeURIComponent(
                  searchText
                )}`,
                {
                  method:
                    "GET",
                }
              );

            if (
              cancelled
            ) {
              return;
            }

            setItems(
              normalizeSearchItems(
                response
              )
            );

            setOpen(
              true
            );
          } catch {
            if (
              !cancelled
            ) {
              setItems(
                []
              );
            }
          } finally {
            if (
              !cancelled
            ) {
              setLoading(
                false
              );
            }
          }
        },
        250
      );

    return () => {
      cancelled =
        true;

      window.clearTimeout(
        timer
      );
    };
  }, [
    query,
  ]);

  function submitSearch() {
    const value =
      query.trim();

    if (
      !value
    ) {
      return;
    }

    window.location.href =
      `/search?q=${encodeURIComponent(
        value
      )}`;
  }

  return (
    <div
      className="
        relative
        min-w-0
        flex-1
      "
    >
      <form
        onSubmit={(
          event
        ) => {
          event.preventDefault();

          submitSearch();
        }}
        className="
          flex
          h-8
          w-full
          items-center
          rounded-full
          border
          border-black/15
          bg-white
          px-3
          shadow-sm
        "
      >
        <SearchIcon />

        <input
          value={
            query
          }
          onChange={(
            event
          ) => {
            setQuery(
              event.target.value
            );
          }}
          onFocus={() => {
            if (
              query.trim().length >=
              2
            ) {
              setOpen(
                true
              );
            }
          }}
          placeholder="Search..."
          className="
            h-full
            min-w-0
            flex-1
            bg-transparent
            px-2
            text-[10px]
            text-black
            outline-none
            placeholder:text-black/40
          "
        />
      </form>

      {open &&
      query.trim().length >=
        2 ? (
        <div
          className="
            absolute
            left-0
            right-0
            top-[38px]
            z-[2200]
            overflow-hidden
            rounded-[12px]
            border
            border-black/10
            bg-white
            shadow-[0_18px_50px_rgba(0,0,0,.16)]
          "
        >
          {loading ? (
            <div
              className="
                px-3
                py-3
                text-[10px]
                text-black/45
              "
            >
              Searching...
            </div>
          ) : items.length >
            0 ? (
            <div
              className="
                py-1
              "
            >
              {items.map(
                (
                  item
                ) => {
                  const href =
                    item.href ||
                    `/search?q=${encodeURIComponent(
                      item.label
                    )}`;

                  return (
                    <Link
                      key={
                        item.id
                      }
                      href={
                        href
                      }
                      onClick={() =>
                        setOpen(
                          false
                        )
                      }
                      className="
                        block
                        border-b
                        border-black/5
                        px-4
                        py-2.5
                        last:border-b-0
                        hover:bg-[#FFF5F7]
                      "
                    >
                      <strong
                        className="
                          block
                          text-[10px]
                          text-[#211817]
                        "
                      >
                        {item.label}
                      </strong>

                      {item.subtitle ? (
                        <span
                          className="
                            mt-0.5
                            block
                            text-[8px]
                            text-black/40
                          "
                        >
                          {item.subtitle}
                        </span>
                      ) : null}
                    </Link>
                  );
                }
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={
                submitSearch
              }
              className="
                block
                w-full
                px-4
                py-3
                text-left
                text-[10px]
                text-[#B31345]
              "
            >
              Search for “{query}”
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

/* =========================================================
   TOP TICKER
========================================================= */

function ResellerTicker() {
  const content = (
    <div
      className="
        flex
        h-full
        shrink-0
        items-center
      "
    >
      <span
        className="
          px-8
          text-[9px]
          font-bold
          text-white
        "
      >
        ◆ &nbsp; BECOME A HIVRASOFT RESELLER
      </span>

      <span
        className="
          px-8
          text-[9px]
          font-semibold
          text-white
        "
      >
        ◆ &nbsp; Sell India&apos;s Most Comfortable
        Innerwear — Zero Stock, High Profit
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

/* =========================================================
   HEADER
========================================================= */

export default function Header() {
  const pathname =
    usePathname();

  const commerce =
    useStorefrontCommerce();

  /* =======================================================
     DESKTOP BLACK HEADER SCROLL BEHAVIOR

     Desktop xl+:
     - scroll down  -> black header hide
     - scroll up    -> black header show
     - top of page  -> black header always show

     Mobile/tablet:
     - auto hide disabled
     - header always visible
  ======================================================= */

  const [
    showMainHeader,
    setShowMainHeader,
  ] =
    useState(
      true
    );

  const lastScrollYRef =
    useRef(
      0
    );

  useEffect(() => {
    const desktopMedia =
      window.matchMedia(
        "(min-width: 1280px)"
      );

    lastScrollYRef.current =
      window.scrollY;

    function syncForViewport() {
      if (
        !desktopMedia.matches
      ) {
        setShowMainHeader(
          true
        );
      }

      lastScrollYRef.current =
        window.scrollY;
    }

    function handleScroll() {
      const currentScrollY =
        window.scrollY;

      if (
        !desktopMedia.matches
      ) {
        setShowMainHeader(
          true
        );

        lastScrollYRef.current =
          currentScrollY;

        return;
      }

      const previousScrollY =
        lastScrollYRef.current;

      if (
        currentScrollY <=
        8
      ) {
        setShowMainHeader(
          true
        );

        lastScrollYRef.current =
          currentScrollY;

        return;
      }

      const difference =
        currentScrollY -
        previousScrollY;

      if (
        Math.abs(
          difference
        ) < 2
      ) {
        return;
      }

      if (
        difference >
        0
      ) {
        setShowMainHeader(
          false
        );
      } else {
        setShowMainHeader(
          true
        );
      }

      lastScrollYRef.current =
        currentScrollY;
    }

    syncForViewport();

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive:
          true,
      }
    );

    desktopMedia.addEventListener(
      "change",
      syncForViewport
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll
      );

      desktopMedia.removeEventListener(
        "change",
        syncForViewport
      );
    };
  }, []);

  const [
    mobileOpen,
    setMobileOpen,
  ] =
    useState(
      false
    );

  /* =======================================================
     MOBILE AUTH SYNC

     IMPORTANT:
     - OTP success par drawer immediately close NAHI hoga.
       Isse success video mounted rahegi aur poori chalegi.
     - Video end ya modal cross/close hone ke baad
       LoginModal "hivrasoft-auth-modal-closed" event bhejega.
       Tab drawer close hoga.
     - Logout par drawer normal close hoga.
  ======================================================= */

  useEffect(() => {
    const handleAuthModalClosed =
      () => {
        setMobileOpen(
          false
        );
      };

    const handleAuthLogout =
      () => {
        setMobileOpen(
          false
        );
      };

    window.addEventListener(
      "hivrasoft-auth-modal-closed",
      handleAuthModalClosed
    );

    window.addEventListener(
      "hivrasoft-auth-logout",
      handleAuthLogout
    );

    return () => {
      window.removeEventListener(
        "hivrasoft-auth-modal-closed",
        handleAuthModalClosed
      );

      window.removeEventListener(
        "hivrasoft-auth-logout",
        handleAuthLogout
      );
    };
  }, []);

  const [
    categories,
    setCategories,
  ] =
    useState<
      HeaderCategory[]
    >([]);

  const [
    buyGetOffer,
    setBuyGetOffer,
  ] =
    useState<
      HeaderOffer | null
    >(
      null
    );

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
     LOAD HEADER DATA

     CATEGORY TREE:
     - cache se turant render
     - har refresh/load par background me latest API fetch
     - new category next refresh par dikh jayegi

     BUY GET OFFER:
     - live API se hi
  ======================================================= */

  useEffect(() => {
    let cancelled =
      false;

    async function loadHeaderData() {
      /* =====================================================
         CATEGORY TREE - CACHE FIRST
      ===================================================== */

      const cachedCategories =
        readHeaderCategoryCache();

      if (
        cachedCategories &&
        !cancelled
      ) {
        setCategories(
          cachedCategories.categories
        );
      }

      /* =====================================================
         CATEGORY TREE - ALWAYS REFRESH IN BACKGROUND
      ===================================================== */

      try {
        const response =
          await apiFetch<unknown>(
            "/api/categories/tree?active=true",
            {
              method:
                "GET",
            }
          );

        if (
          !cancelled
        ) {
          const normalizedCategories =
            normalizeTree(
              response
            );

          setCategories(
            normalizedCategories
          );

          writeHeaderCategoryCache(
            normalizedCategories
          );
        }
      } catch (
        error
      ) {
        console.error(
          "HEADER CATEGORY ERROR:",
          error
        );

        /*
         * API fail ho to old cache ko remove mat karo.
         */
        if (
          !cancelled &&
          !cachedCategories
        ) {
          setCategories(
            []
          );
        }
      }

      /* =====================================================
         BUY GET OFFER - LIVE
      ===================================================== */

      try {
        const response =
          await apiFetch<HeaderOfferResponse>(
            "/api/offers/featured/buy-get",
            {
              method:
                "GET",
            }
          );

        if (
          cancelled
        ) {
          return;
        }

        const offer =
          response?.offer;

        if (
          offer &&
          offer.isActive &&
          offer.name &&
          offer.slug
        ) {
          setBuyGetOffer(
            offer
          );
        } else {
          setBuyGetOffer(
            null
          );
        }
      } catch (
        error
      ) {
        console.error(
          "HEADER BUY GET OFFER ERROR:",
          error
        );

        if (
          !cancelled
        ) {
          setBuyGetOffer(
            null
          );
        }
      }
    }

    void loadHeaderData();

    /* =====================================================
       CACHE SYNC BETWEEN OPEN TABS
    ===================================================== */

    function handleStorage(
      event:
        StorageEvent
    ) {
      if (
        event.key !==
          HEADER_CATEGORY_CACHE_KEY ||
        !event.newValue
      ) {
        return;
      }

      try {
        const parsed =
          JSON.parse(
            event.newValue
          ) as HeaderCategoryCache;

        if (
          Array.isArray(
            parsed.categories
          )
        ) {
          setCategories(
            parsed.categories
          );
        }
      } catch {
        // Invalid cache payload ignore.
      }
    }

    window.addEventListener(
      "storage",
      handleStorage
    );

    return () => {
      cancelled =
        true;

      window.removeEventListener(
        "storage",
        handleStorage
      );
    };
  }, []);

  /* =======================================================
     BODY LOCK FOR MOBILE MENU
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
     NAVIGATION ITEMS
  ======================================================= */

  const navigationItems =
    useMemo(() => {
      const items:
        HeaderNavItem[] =
        [];

      let offerInserted =
        false;

      categories.forEach(
        (
          category
        ) => {
          items.push({
            type:
              "category",

            key:
              `category-${category.id}`,

            category,
          });

          const slug =
            cleanSlug(
              category.slug
            );

          if (
            buyGetOffer &&
            (
              slug ===
                "new-launch" ||
              slug ===
                "new-launches" ||
              slug ===
                "new-arrival" ||
              slug ===
                "new-arrivals"
            )
          ) {
            items.push({
              type:
                "offer",

              key:
                `offer-${buyGetOffer._id}`,

              name:
                buyGetOffer.name,

              href:
                `/${encodeURIComponent(
                  buyGetOffer.slug
                )}`,
            });

            offerInserted =
              true;
          }
        }
      );

      if (
        buyGetOffer &&
        !offerInserted
      ) {
        items.unshift({
          type:
            "offer",

          key:
            `offer-${buyGetOffer._id}`,

          name:
            buyGetOffer.name,

          href:
            `/${encodeURIComponent(
              buyGetOffer.slug
            )}`,
        });
      }

      return items;
    }, [
      categories,
      buyGetOffer,
    ]);

  /* =======================================================
     MOBILE TOGGLE
  ======================================================= */

  function toggleExpanded(
    id:
      string
  ) {
    setExpanded(
      (
        current
      ) => {
        const next =
          new Set(
            current
          );

        if (
          next.has(
            id
          )
        ) {
          next.delete(
            id
          );
        } else {
          next.add(
            id
          );
        }

        return next;
      }
    );
  }

  /* =======================================================
     HIDE HEADER ON LANDING
  ======================================================= */

  if (
    pathname ===
    "/landing"
  ) {
    return null;
  }

  return (
    <>
      {/* =================================================
          STICKY HEADER
      ================================================= */}

      <div
        className="
          sticky
          top-0
          z-[1100]
          w-full
        "
      >
        <ResellerTicker />

        {/* ===============================================
            DESKTOP SERVICE BAR
        =============================================== */}

        <div
          className="
            hidden
            w-full
            border-b
            border-black/10
            bg-white
            xl:block
          "
        >
          <div
            className="
              mx-auto
              flex
              h-[46px]
              w-full
              max-w-[1600px]
              items-center
              gap-5
              px-5
              2xl:px-7
            "
          >
            {/* BENEFITS */}

            <div
              className="
                flex
                w-[470px]
                shrink-0
                items-center
                whitespace-nowrap
                text-[9px]
                font-medium
                text-black
                2xl:w-[500px]
              "
            >
              <span>
                Free Returns
              </span>

              <span
                className="
                  mx-2
                  text-black/25
                "
              >
                |
              </span>

              <span>
                100% Privacy
              </span>

              <span
                className="
                  mx-2
                  text-black/25
                "
              >
                |
              </span>

              <span>
                Cash On Delivery
              </span>

              <span
                className="
                  mx-2
                  text-black/25
                "
              >
                |
              </span>

              <span>
                Free Shipping*
              </span>
            </div>

            {/* SEARCH */}

            <HeaderSearch />

            {/* ACTIONS */}

            <div
              className="
                ml-auto
                flex
                shrink-0
                items-center
                gap-2
              "
            >
              {/* WISHLIST */}

              <button
                type="button"
                aria-label="Wishlist"
                onClick={() => {
                  void commerce.openWishlist();
                }}
                className="
                  relative
                  grid
                  h-9
                  w-9
                  place-items-center
                  rounded-full
                  text-black
                  transition
                  hover:bg-black/5
                  hover:text-[#B31345]
                "
              >
                <HeartIcon />

                {commerce.wishlistCount >
                0 ? (
                  <CountBadge
                    count={
                      commerce.wishlistCount
                    }
                  />
                ) : null}
              </button>

              {/* ACCOUNT */}

              <div
                className="
                  grid
                  h-9
                  min-w-[36px]
                  place-items-center
                  text-black
                  [&_a]:text-black
                  [&_button]:text-black
                  [&_svg]:text-black
                "
              >
                <Account />
              </div>

              {/* CART */}

              <button
                type="button"
                aria-label="Cart"
                onClick={() => {
                  void commerce.openCart();
                }}
                className="
                  relative
                  grid
                  h-9
                  w-9
                  place-items-center
                  rounded-full
                  text-black
                  transition
                  hover:bg-black/5
                  hover:text-[#B31345]
                "
              >
                <BagIcon />

                {commerce.cartCount >
                0 ? (
                  <CountBadge
                    count={
                      commerce.cartCount
                    }
                  />
                ) : null}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ===============================================
          MAIN HEADER

          Desktop:
          scroll down -> hide
          scroll up   -> show

          Mobile/tablet:
          always visible
      =============================================== */}

      <header
        className={`
          sticky
          top-0
          z-[1000]

          md:top-[30px]
          xl:top-[76px]

          w-full

          border-b
          border-black/10

          bg-white

          transition-transform
          duration-300
          ease-out
          will-change-transform

          xl:border-white/10
          xl:bg-black

          ${
            showMainHeader
              ? "translate-y-0"
              : "-translate-y-full"
          }
        `}
      >
          <div
            className="
              relative

              mx-auto

              flex

              h-[68px]

              w-full
              max-w-[1600px]

              min-w-0

              items-center

              overflow-hidden
              xl:overflow-visible

              px-2

              sm:px-4

              md:h-[74px]
              md:px-6

              xl:h-[88px]
              xl:px-5

              2xl:px-7
            "
          >
            {/* ===========================================
                MOBILE MENU
            =========================================== */}

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

            {/* ===========================================
                LOGO
            =========================================== */}

            <Link
              href="/"
              className="
                absolute

                left-1/2
                top-1/2

                z-10

                block

                -translate-x-1/2
                -translate-y-1/2

                xl:static
                xl:ml-0
                xl:translate-x-0
                xl:translate-y-0
              "
            >
              {/* MOBILE / TABLET
                  Desktop logo use kar rahe hain, compact size me.
              */}

              <div
                className="
                  relative

                  h-[44px]
                  w-[126px]

                  sm:h-[46px]
                  sm:w-[138px]

                  md:h-[48px]
                  md:w-[148px]

                  xl:hidden
                "
              >
                <Image
                  src={
                    DESKTOP_LOGO_SRC
                  }
                  alt="HivraSoft"
                  fill
                  priority
                  sizes="148px"
                  className="
                    object-contain
                  "
                />
              </div>

              {/* DESKTOP */}

              <div
                className="
                  relative
                  hidden
                  h-[62px]
                  w-[230px]
                  xl:block
                "
              >
                <Image
                  src={
                    DESKTOP_LOGO_SRC
                  }
                  alt="HivraSoft"
                  fill
                  priority
                  sizes="230px"
                  className="
                    object-contain
                    object-left
                  "
                />
              </div>
            </Link>

            {/* ===========================================
                DESKTOP NAVIGATION
            =========================================== */}

            <nav
              className="
                hidden
                h-full
                min-w-0
                flex-1
                items-center
                justify-center
                gap-[18px]

                xl:flex

                2xl:gap-[22px]
              "
            >
              {navigationItems.map(
                (
                  item
                ) => {
                  if (
                    item.type ===
                    "offer"
                  ) {
                    return (
                      <DesktopOfferLink
                        key={
                          item.key
                        }
                        href={
                          item.href
                        }
                      >
                        {item.name}
                      </DesktopOfferLink>
                    );
                  }

                  return (
                    <DesktopCategory
                      key={
                        item.key
                      }
                      root={
                        item.category
                      }
                    />
                  );
                }
              )}
            </nav>

            {/* ===========================================
                MOBILE / TABLET ACTIONS
            =========================================== */}

            <div
              className="
                relative
                z-20

                ml-auto

                flex
                shrink-0

                items-center

                gap-0.5

                xl:hidden
              "
            >
              {/* WISHLIST */}

              <button
                type="button"
                aria-label="Wishlist"
                onClick={() => {
                  void commerce.openWishlist();
                }}
                className="
                  relative
                  grid
                  h-10
                  w-10
                  place-items-center
                  text-[#8C1839]
                "
              >
                <HeartIcon />

                {commerce.wishlistCount >
                0 ? (
                  <CountBadge
                    count={
                      commerce.wishlistCount
                    }
                  />
                ) : null}
              </button>

              {/* CART */}

              <button
                type="button"
                aria-label="Cart"
                onClick={() => {
                  void commerce.openCart();
                }}
                className="
                  relative
                  grid
                  h-10
                  w-10
                  place-items-center
                  text-black
                "
              >
                <BagIcon />

                {commerce.cartCount >
                0 ? (
                  <CountBadge
                    count={
                      commerce.cartCount
                    }
                  />
                ) : null}
              </button>
            </div>
          </div>
      </header>

      {/* =================================================
          MOBILE DRAWER
      ================================================= */}

      {mobileOpen ? (
        <div
          className="
            fixed
            inset-0
            z-[3000]
            xl:hidden
          "
        >
          {/* BACKDROP */}

          <button
            type="button"
            aria-label="Close menu"
            onClick={() =>
              setMobileOpen(
                false
              )
            }
            className="
              absolute
              inset-0
              bg-black/45
            "
          />

          {/* DRAWER */}

          <aside
            className="
              absolute
              left-0
              top-0

              h-full

              w-[92vw]
              max-w-[420px]

              overflow-x-hidden
              overflow-y-auto

              bg-white

              shadow-2xl
            "
          >
            {/* MOBILE DRAWER HEADER */}

            <div
              className="
                relative

                flex

                h-[82px]

                items-center
                justify-center

                border-b
                border-black/10

                px-14
              "
            >
              <Link
                href="/"
                onClick={() =>
                  setMobileOpen(
                    false
                  )
                }
                className="
                  relative

                  h-[52px]
                  w-[156px]

                  shrink-0
                "
              >
                <Image
                  src={
                    DESKTOP_LOGO_SRC
                  }
                  alt="HivraSoft"
                  fill
                  sizes="156px"
                  className="
                    object-contain
                  "
                />
              </Link>

              <button
                type="button"
                aria-label="Close menu"
                onClick={() =>
                  setMobileOpen(
                    false
                  )
                }
                className="
                  absolute

                  right-4
                  top-1/2

                  grid

                  h-10
                  w-10

                  -translate-y-1/2

                  place-items-center

                  rounded-full

                  bg-black/5

                  text-[24px]
                  text-black
                "
              >
                ×
              </button>
            </div>

            {/* MOBILE ACCOUNT / WISHLIST / CART */}

            <div
              className="
                grid
                grid-cols-3
                gap-1.5

                border-b
                border-black/10

                bg-[#FFFDFC]

                px-4
                py-3
              "
            >
              <button
                type="button"
                aria-label="Wishlist"
                onClick={() => {
                  setMobileOpen(
                    false
                  );

                  void commerce.openWishlist();
                }}
                className="
                  relative

                  flex
                  min-h-[58px]
                  flex-col

                  items-center
                  justify-center

                  gap-1

                  rounded-[10px]

                  border
                  border-black/[0.08]

                  bg-white

                  text-[#8C1839]
                "
              >
                <HeartIcon />

                <span
                  className="
                    text-[7px]
                    font-semibold

                    uppercase

                    tracking-[0.06em]
                  "
                >
                  Wishlist
                </span>

                {commerce.wishlistCount >
                0 ? (
                  <CountBadge
                    count={
                      commerce.wishlistCount
                    }
                  />
                ) : null}
              </button>

              <div
                className="
                  flex
                  min-h-[58px]

                  flex-col

                  items-center
                  justify-center

                  gap-1

                  rounded-[10px]

                  border
                  border-black/[0.08]

                  bg-white
                "
              >
                <Account
                  mobile
                />

                <span
                  className="
                    -mt-1

                    text-[7px]
                    font-semibold

                    uppercase

                    tracking-[0.06em]

                    text-[#211817]
                  "
                >
                  Account
                </span>
              </div>

              <button
                type="button"
                aria-label="Cart"
                onClick={() => {
                  setMobileOpen(
                    false
                  );

                  void commerce.openCart();
                }}
                className="
                  relative

                  flex
                  min-h-[58px]
                  flex-col

                  items-center
                  justify-center

                  gap-1

                  rounded-[10px]

                  border
                  border-black/[0.08]

                  bg-white

                  text-black
                "
              >
                <BagIcon />

                <span
                  className="
                    text-[7px]
                    font-semibold

                    uppercase

                    tracking-[0.06em]
                  "
                >
                  Cart
                </span>

                {commerce.cartCount >
                0 ? (
                  <CountBadge
                    count={
                      commerce.cartCount
                    }
                  />
                ) : null}
              </button>
            </div>

            {/* TITLE */}

            <div
              className="
                border-b
                border-black/10
                px-4
                py-4
              "
            >
              <h2
                className="
                  text-[16px]
                  font-bold
                  text-[#211817]
                "
              >
                Categories
              </h2>
            </div>

            {/* NAV */}

            <div>
              {navigationItems.map(
                (
                  item
                ) => {
                  if (
                    item.type ===
                    "offer"
                  ) {
                    return (
                      <MobileOfferLink
                        key={
                          item.key
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
                        {item.name}
                      </MobileOfferLink>
                    );
                  }

                  return (
                    <MobileCategoryBranch
                      key={
                        item.key
                      }
                      node={
                        item.category
                      }
                      parentSlugs={
                        []
                      }
                      depth={
                        0
                      }
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
                  );
                }
              )}
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}

/* =========================================================
   DESKTOP CATEGORY
========================================================= */

function DesktopCategory({
  root,
}: {
  root:
    HeaderCategory;
}) {
  const href =
    categoryHref([
      root.slug,
    ]);

  const megaImages =
    getMegaMenuImages(
      root.slug
    );

  const isMegaMenu =
    Boolean(
      megaImages
    );

  /* =======================================================
     CATEGORY WITHOUT CHILDREN
  ======================================================= */

  if (
    root.children.length ===
    0
  ) {
    return (
      <DesktopNavLink
        href={
          href
        }
      >
        {root.name}
      </DesktopNavLink>
    );
  }

  /* =======================================================
     MEN / WOMEN SPECIAL MEGA MENU
  ======================================================= */

  if (
    isMegaMenu &&
    megaImages
  ) {
    const visualChildren =
      root.children.slice(
        0,
        4
      );

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
        {/* NAV */}

        <Link
          href={
            href
          }
          className="
            flex
            h-full
            items-center
            gap-1.5
            whitespace-nowrap

            text-[12px]
            font-bold
            tracking-[0.01em]

            text-[#FF7900]

            transition-colors

            hover:text-[#FFAA57]

            2xl:text-[13px]
          "
        >
          {root.name}

          <ChevronDown />
        </Link>

        {/* ===============================================
            MEGA DROPDOWN
        =============================================== */}

        <div
          className="
            invisible

            absolute
            left-1/2
            top-full

            z-[1800]

            w-[920px]
            max-w-[calc(100vw-40px)]

            -translate-x-1/2
            translate-y-2

            overflow-hidden

            rounded-b-[18px]

            border
            border-black/10

            bg-white

            opacity-0

            shadow-[0_24px_70px_rgba(0,0,0,.20)]

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
              grid-cols-[minmax(0,1fr)_320px]
            "
          >
            {/* ===========================================
                LEFT SIDE
            =========================================== */}

            <div
              className="
                min-w-0
                p-5
              "
            >
              {/* TITLE */}

              <div
                className="
                  mb-4

                  flex
                  items-end
                  justify-between
                  gap-4

                  border-b
                  border-[#EEE5E1]

                  pb-4
                "
              >
                <div>
                  <p
                    className="
                      text-[8px]
                      font-extrabold
                      uppercase
                      tracking-[0.16em]

                      text-[#B31345]
                    "
                  >
                    Shop {root.name}
                  </p>

                  <h3
                    className="
                      mt-1

                      font-serif

                      text-[24px]
                      leading-none

                      text-[#211817]
                    "
                  >
                    Explore Categories
                  </h3>
                </div>

                <Link
                  href={
                    href
                  }
                  className="
                    shrink-0

                    rounded-full

                    border
                    border-[#B31345]/15

                    bg-[#FFF4F7]

                    px-3
                    py-1.5

                    text-[8px]
                    font-extrabold
                    uppercase
                    tracking-[0.07em]

                    text-[#B31345]

                    transition

                    hover:border-[#B31345]/40
                    hover:bg-[#FCE8EE]
                  "
                >
                  View All →
                </Link>
              </div>

              {/* ===========================================
                  CATEGORY BOXES
              =========================================== */}

              <div
                className="
                  grid
                  grid-cols-2
                  gap-2.5
                "
              >
                {root.children.map(
                  (
                    child
                  ) => (
                    <div
                      key={
                        child.id
                      }
                      className="
                        min-w-0

                        rounded-[12px]

                        border
                        border-[#EEE5E1]

                        bg-[#FFFCFB]

                        p-3.5

                        transition

                        hover:border-[#B31345]/20
                        hover:bg-[#FFF7F9]
                      "
                    >
                      <DesktopCategoryColumn
                        node={
                          child
                        }
                        path={[
                          root.slug,
                          child.slug,
                        ]}
                      />
                    </div>
                  )
                )}
              </div>
            </div>

            {/* ===========================================
                RIGHT IMAGE GRID
            =========================================== */}

            <div
              className="
                border-l
                border-[#EEE5E1]

                bg-[#FAF6F4]

                p-3
              "
            >
              <div
                className="
                  grid
                  grid-cols-2
                  gap-2.5
                "
              >
                {visualChildren.map(
                  (
                    child,
                    index
                  ) => {
                    const imageSrc =
                      megaImages[
                        index %
                          megaImages.length
                      ];

                    return (
                      <Link
                        key={
                          child.id
                        }
                        href={
                          categoryHref([
                            root.slug,
                            child.slug,
                          ])
                        }
                        className="
                          group/card

                          relative

                          h-[150px]

                          overflow-hidden

                          rounded-[12px]

                          bg-[#E9E1DD]
                        "
                      >
                        {/* =================================
                            IMPORTANT

                            Plain img use kar rahe hain.
                            Isse local public image direct
                            browser se load hogi.
                        ================================= */}

                        <img
                          src={
                            imageSrc
                          }
                          alt={
                            child.name
                          }
                          loading="eager"
                          className="
                            absolute
                            inset-0

                            h-full
                            w-full

                            object-cover

                            transition-transform
                            duration-500

                            group-hover/card:scale-105
                          "
                        />

                        {/* OVERLAY */}

                        <div
                          className="
                            absolute
                            inset-0

                            bg-gradient-to-t

                            from-black/75
                            via-black/10
                            to-transparent
                          "
                        />

                        {/* TEXT */}

                        <div
                          className="
                            absolute

                            inset-x-0
                            bottom-0

                            p-3
                          "
                        >
                          <strong
                            className="
                              block

                              text-[9px]
                              font-extrabold
                              uppercase
                              tracking-[0.05em]

                              text-white
                            "
                          >
                            {child.name}
                          </strong>

                          <span
                            className="
                              mt-1
                              inline-flex

                              text-[7px]
                              font-semibold

                              text-white/80
                            "
                          >
                            Shop now →
                          </span>
                        </div>
                      </Link>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* =======================================================
     NORMAL CATEGORY DROPDOWN
  ======================================================= */

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
        href={
          href
        }
        className="
          flex
          h-full
          items-center
          gap-1.5

          whitespace-nowrap

          text-[12px]
          font-bold
          tracking-[0.01em]

          text-[#FF7900]

          transition-colors

          hover:text-[#FFAA57]

          2xl:text-[13px]
        "
      >
        {root.name}

        <ChevronDown />
      </Link>

      <div
        className="
          invisible

          absolute
          left-1/2
          top-full

          z-[1600]

          max-h-[72vh]

          w-[720px]
          max-w-[calc(100vw-40px)]

          -translate-x-1/2
          translate-y-2

          overflow-y-auto

          rounded-b-[14px]

          border
          border-black/10

          bg-white

          opacity-0

          shadow-[0_22px_55px_rgba(0,0,0,.18)]

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

            gap-x-8
            gap-y-8

            p-7
          "
        >
          {root.children.map(
            (
              child
            ) => (
              <DesktopCategoryColumn
                key={
                  child.id
                }
                node={
                  child
                }
                path={[
                  root.slug,
                  child.slug,
                ]}
              />
            )
          )}
        </div>

        <div
          className="
            border-t
            border-black/10

            px-7
            py-4
          "
        >
          <Link
            href={
              href
            }
            className="
              inline-flex
              items-center
              gap-2

              text-[9px]
              font-bold
              uppercase
              tracking-[0.08em]

              text-[#B31345]

              hover:underline
            "
          >
            View All{" "}
            {root.name} →
          </Link>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   DESKTOP CATEGORY COLUMN
========================================================= */

function DesktopCategoryColumn({
  node,
  path,
}: {
  node:
    HeaderCategory;

  path:
    string[];
}) {
  return (
    <div
      className="
        min-w-0
      "
    >
      {/* MAIN CATEGORY */}

      <Link
        href={
          categoryHref(
            path
          )
        }
        className="
          block

          text-[10px]
          font-extrabold
          uppercase
          tracking-[0.055em]

          text-[#211817]

          transition

          hover:text-[#B31345]
        "
      >
        {node.name}
      </Link>

      {/* CHILDREN */}

      {node.children.length >
      0 ? (
        <div
          className="
            mt-2.5
            space-y-2
          "
        >
          {node.children.map(
            (
              child
            ) => (
              <DesktopNestedCategory
                key={
                  child.id
                }
                node={
                  child
                }
                path={[
                  ...path,
                  child.slug,
                ]}
                depth={
                  0
                }
              />
            )
          )}
        </div>
      ) : null}
    </div>
  );
}

/* =========================================================
   DESKTOP NESTED CATEGORY
========================================================= */

function DesktopNestedCategory({
  node,
  path,
  depth,
}: {
  node:
    HeaderCategory;

  path:
    string[];

  depth:
    number;
}) {
  return (
    <div>
      <Link
        href={
          categoryHref(
            path
          )
        }
        className="
          block

          text-[10px]
          font-medium
          leading-[1.35]

          text-[#6C6265]

          transition

          hover:text-[#D91B58]
        "
        style={{
          paddingLeft:
            `${depth * 9}px`,
        }}
      >
        {node.name}
      </Link>

      {node.children.length >
      0 ? (
        <div
          className="
            mt-2
            space-y-2
          "
        >
          {node.children.map(
            (
              child
            ) => (
              <DesktopNestedCategory
                key={
                  child.id
                }
                node={
                  child
                }
                path={[
                  ...path,
                  child.slug,
                ]}
                depth={
                  depth +
                  1
                }
              />
            )
          )}
        </div>
      ) : null}
    </div>
  );
}

/* =========================================================
   MOBILE CATEGORY
========================================================= */

function MobileCategoryBranch({
  node,
  parentSlugs,
  depth,
  expanded,
  onToggle,
  onNavigate,
}: {
  node:
    HeaderCategory;

  parentSlugs:
    string[];

  depth:
    number;

  expanded:
    Set<string>;

  onToggle: (
    id:
      string
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
          min-h-[47px]
          items-center
        "
      >
        <Link
          href={
            categoryHref(
              currentSlugs
            )
          }
          onClick={
            onNavigate
          }
          className="
            min-w-0
            flex-1

            py-3
            pr-2

            text-[11px]
            font-medium

            text-black
          "
          style={{
            paddingLeft:
              `${
                14 +
                depth *
                  13
              }px`,
          }}
        >
          {node.name}
        </Link>

        {hasChildren ? (
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
              h-[47px]
              w-11
              shrink-0
              items-center
              justify-center
              text-[18px]
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
        ) : null}
      </div>

      {/* CHILDREN */}

      {hasChildren &&
      open ? (
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
                  depth +
                  1
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

          <div
            className="
              border-t
              border-[#EFCFD9]

              px-4
              py-3
            "
          >
            <Link
              href={
                categoryHref(
                  currentSlugs
                )
              }
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
              {node.name}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* =========================================================
   DESKTOP NORMAL LINK
========================================================= */

function DesktopNavLink({
  href,
  children,
}: {
  href:
    string;

  children:
    ReactNode;
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

        whitespace-nowrap

        text-[12px]
        font-bold
        tracking-[0.01em]

        text-[#FF7900]

        transition-colors

        hover:text-[#FFAA57]

        2xl:text-[13px]
      "
    >
      {children}
    </Link>
  );
}

/* =========================================================
   DESKTOP OFFER LINK
========================================================= */

function DesktopOfferLink({
  href,
  children,
}: {
  href:
    string;

  children:
    ReactNode;
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

        whitespace-nowrap

        text-[12px]
        font-bold
        tracking-[0.01em]

        text-[#FF7900]

        transition-colors

        hover:text-[#FFAA57]

        2xl:text-[13px]
      "
    >
      {children}
    </Link>
  );
}

/* =========================================================
   MOBILE OFFER LINK
========================================================= */

function MobileOfferLink({
  href,
  children,
  onNavigate,
}: {
  href:
    string;

  children:
    ReactNode;

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
        min-h-[48px]
        items-center
        justify-between

        border-b
        border-black/10

        bg-[#211A18]

        px-4
        py-3

        text-[11px]
        font-bold
        uppercase
        tracking-[0.07em]

        text-white
      "
    >
      <span>
        {children}
      </span>

      <span>
        →
      </span>
    </Link>
  );
}

/* =========================================================
   COUNT BADGE
========================================================= */

function CountBadge({
  count,
}: {
  count:
    number;
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
      aria-hidden="true"
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
      width="23"
      height="23"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
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
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 8h14l-1 13H6L5 8Z" />

      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
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

function ChevronDown() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}