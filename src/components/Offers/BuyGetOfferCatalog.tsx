"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import StorefrontProductCard from "@/src/components/Storefront/StorefrontProductCard";

import type {
  StorefrontOffer,
} from "@/src/services/offers";

import type {
  CartOfferContext,
} from "@/lib/cart";

import type {
  CatalogBanner,
  CatalogProduct,
} from "@/types/catalog";

/* =========================================================
   TYPES
========================================================= */

type SortValue =
  | "featured"
  | "low"
  | "high";

type OfferSection =
  | "all"
  | "men"
  | "women"
  | "accessories";

type ProductGroups = {
  all: CatalogProduct[];

  men: CatalogProduct[];

  women: CatalogProduct[];

  accessories: CatalogProduct[];
};

type Props = {
  offer:
    StorefrontOffer;

  productGroups:
    ProductGroups;

  banners:
    CatalogBanner[];
};

/* =========================================================
   CATEGORY TABS
========================================================= */

const categoryTabs: Array<{
  key: OfferSection;
  label: string;
}> = [
  {
    key: "all",
    label: "All",
  },

  {
    key: "men",
    label: "Men",
  },

  {
    key: "women",
    label: "Women",
  },

  {
    key: "accessories",
    label: "Accessories",
  },
];

/* =========================================================
   DESKTOP HEADER OFFSET

   Desktop:
   Scroll Down → Tabs Hide
   Scroll Up   → Tabs Show

   Mobile:
   Tabs stay visible.
========================================================= */

const DESKTOP_STICKY_TOP =
  154;

/* =========================================================
   OFFER BANNER SLIDER
========================================================= */

function OfferBannerSlider({
  banners,
}: {
  banners:
    CatalogBanner[];
}) {
  /* =======================================================
     VALID BANNERS
  ======================================================= */

  const validBanners =
    useMemo(
      () =>
        banners.filter(
          (
            banner,
          ) =>
            Boolean(
              banner.image,
            ),
        ),
      [
        banners,
      ],
    );

  /* =======================================================
     ACTIVE BANNER
  ======================================================= */

  const [
    active,
    setActive,
  ] =
    useState(
      0,
    );

  /* =======================================================
     AUTO SLIDE
  ======================================================= */

  useEffect(() => {
    setActive(
      0,
    );

    if (
      validBanners.length <=
      1
    ) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          setActive(
            (
              current,
            ) =>
              (
                current +
                1
              ) %
              validBanners.length,
          );
        },
        4500,
      );

    return () => {
      window.clearInterval(
        timer,
      );
    };
  }, [
    validBanners.length,
  ]);

  /* =======================================================
     NO BANNERS
  ======================================================= */

  if (
    validBanners.length ===
    0
  ) {
    return null;
  }

  /* =======================================================
     PREVIOUS
  ======================================================= */

  const previous =
    () => {
      setActive(
        (
          current,
        ) =>
          current ===
          0
            ? validBanners.length -
              1
            : current -
              1,
      );
    };

  /* =======================================================
     NEXT
  ======================================================= */

  const next =
    () => {
      setActive(
        (
          current,
        ) =>
          (
            current +
            1
          ) %
          validBanners.length,
      );
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <section
      className="
        relative

        w-full

        overflow-hidden

        bg-[#F3ECE7]
      "
      style={{
        aspectRatio:
          "1600 / 558",
      }}
    >
      {validBanners.map(
        (
          banner,
          index,
        ) => (
          <Link
            key={`${banner.image}-${index}`}
            href={
              banner.redirect ||
              "#"
            }
            className={`
              absolute
              inset-0

              block

              h-full
              w-full

              transition-all

              duration-700

              ${
                active ===
                index
                  ? `
                    translate-x-0
                    opacity-100
                  `
                  : index <
                      active
                    ? `
                      -translate-x-full
                      opacity-0
                    `
                    : `
                      translate-x-full
                      opacity-0
                    `
              }
            `}
          >
            <img
              src={
                banner.image
              }
              alt={
                banner.alt ||
                "Offer Banner"
              }
              className="
                block

                h-full
                w-full

                object-cover
                object-center
              "
            />
          </Link>
        ),
      )}

      {/* ===================================================
          BANNER CONTROLS
      =================================================== */}

      {validBanners.length >
      1 ? (
        <>
          {/* PREVIOUS */}

          <button
            type="button"
            aria-label="Previous banner"
            onClick={
              previous
            }
            className="
              absolute

              left-3
              top-1/2

              z-30

              flex

              h-9
              w-9

              -translate-y-1/2

              items-center
              justify-center

              rounded-full

              bg-white/90

              text-[22px]
              text-[#211A18]

              shadow-md

              sm:left-5
              sm:h-10
              sm:w-10
            "
          >
            ‹
          </button>

          {/* NEXT */}

          <button
            type="button"
            aria-label="Next banner"
            onClick={
              next
            }
            className="
              absolute

              right-3
              top-1/2

              z-30

              flex

              h-9
              w-9

              -translate-y-1/2

              items-center
              justify-center

              rounded-full

              bg-white/90

              text-[22px]
              text-[#211A18]

              shadow-md

              sm:right-5
              sm:h-10
              sm:w-10
            "
          >
            ›
          </button>

          {/* DOTS */}

          <div
            className="
              absolute

              bottom-4
              left-1/2

              z-30

              flex

              -translate-x-1/2

              gap-2
            "
          >
            {validBanners.map(
              (
                _,
                index,
              ) => (
                <button
                  key={
                    index
                  }
                  type="button"
                  aria-label={`Show banner ${index + 1}`}
                  onClick={() =>
                    setActive(
                      index,
                    )
                  }
                  className={`
                    h-[6px]

                    rounded-full

                    transition-all

                    ${
                      active ===
                      index
                        ? `
                          w-7

                          bg-[#B31345]
                        `
                        : `
                          w-[6px]

                          bg-white
                        `
                    }
                  `}
                />
              ),
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}

/* =========================================================
   BUY GET OFFER CATALOG
========================================================= */

export default function BuyGetOfferCatalog({
  offer,
  productGroups,
  banners,
}: Props) {
  /* =======================================================
     ACTIVE TAB

     DEFAULT = ALL
  ======================================================= */

  const [
    activeSection,
    setActiveSection,
  ] =
    useState<OfferSection>(
      "all",
    );

  /* =======================================================
     SORT
  ======================================================= */

  const [
    sort,
    setSort,
  ] =
    useState<SortValue>(
      "featured",
    );

  /* =======================================================
     DESKTOP STATE
  ======================================================= */

  const [
    isDesktop,
    setIsDesktop,
  ] =
    useState(
      false,
    );

  /* =======================================================
     TAB VISIBILITY
  ======================================================= */

  const [
    tabsVisible,
    setTabsVisible,
  ] =
    useState(
      true,
    );

  const [
    tabsReachedSticky,
    setTabsReachedSticky,
  ] =
    useState(
      false,
    );

  /* =======================================================
     REFS
  ======================================================= */

  const tabsRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const tabsOriginalTopRef =
    useRef(
      0,
    );

  const lastScrollYRef =
    useRef(
      0,
    );

  const tickingRef =
    useRef(
      false,
    );

  /* =======================================================
     OFFER CONTEXT

     IMPORTANT:

     Add to Bag ke time Buy/Get offer
     context preserve rahega.
  ======================================================= */

  const offerContext =
    useMemo<CartOfferContext>(
      () => ({
        offerId:
          offer._id,

        offerType:
          "buy_get",

        source:
          "buy_get_page",
      }),
      [
        offer._id,
      ],
    );

  /* =======================================================
     ACTIVE PRODUCTS

     All:
     → all eligible offer products

     Men:
     → eligible men

     Women:
     → eligible women

     Accessories:
     → eligible accessories
  ======================================================= */

  const activeProducts =
    useMemo<CatalogProduct[]>(
      () => {
        if (
          !productGroups
        ) {
          return [];
        }

        const selectedProducts =
          productGroups[
            activeSection
          ];

        if (
          !Array.isArray(
            selectedProducts,
          )
        ) {
          return [];
        }

        return selectedProducts;
      },
      [
        productGroups,
        activeSection,
      ],
    );

  /* =======================================================
     ACTIVE LABEL
  ======================================================= */

  const activeLabel =
    useMemo(
      () =>
        categoryTabs.find(
          (
            tab,
          ) =>
            tab.key ===
            activeSection,
        )?.label ||
        "All",
      [
        activeSection,
      ],
    );

  /* =======================================================
     SORT ACTIVE PRODUCTS

     IMPORTANT:

     No old `products` prop here.
  ======================================================= */

  const sortedProducts =
    useMemo(() => {
      const result =
        Array.isArray(
          activeProducts,
        )
          ? [
              ...activeProducts,
            ]
          : [];

      /* -----------------------------------------------
         PRICE LOW TO HIGH
      ----------------------------------------------- */

      if (
        sort ===
        "low"
      ) {
        return result.sort(
          (
            a,
            b,
          ) =>
            a.showPrice -
            b.showPrice,
        );
      }

      /* -----------------------------------------------
         PRICE HIGH TO LOW
      ----------------------------------------------- */

      if (
        sort ===
        "high"
      ) {
        return result.sort(
          (
            a,
            b,
          ) =>
            b.showPrice -
            a.showPrice,
        );
      }

      return result;
    }, [
      activeProducts,
      sort,
    ]);

  /* =======================================================
     DETECT DESKTOP

     1024px+
     → Desktop

     Under 1024px
     → Mobile / Tablet
  ======================================================= */

  useEffect(() => {
    const mediaQuery =
      window.matchMedia(
        "(min-width: 1024px)",
      );

    const updateDevice =
      () => {
        const desktop =
          mediaQuery.matches;

        setIsDesktop(
          desktop,
        );

        /* -----------------------------------------------
           MOBILE RESET

           Mobile par tabs kabhi scroll direction
           ki wajah se hide nahi honge.
        ----------------------------------------------- */

        if (
          !desktop
        ) {
          setTabsVisible(
            true,
          );

          setTabsReachedSticky(
            false,
          );
        }
      };

    updateDevice();

    mediaQuery.addEventListener(
      "change",
      updateDevice,
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        updateDevice,
      );
    };
  }, []);

  /* =======================================================
     GET ORIGINAL TAB POSITION
  ======================================================= */

  useEffect(() => {
    const calculatePosition =
      () => {
        if (
          !tabsRef.current
        ) {
          return;
        }

        tabsOriginalTopRef.current =
          tabsRef.current
            .getBoundingClientRect()
            .top +
          window.scrollY;
      };

    const frame =
      window.requestAnimationFrame(
        calculatePosition,
      );

    window.addEventListener(
      "resize",
      calculatePosition,
    );

    return () => {
      window.cancelAnimationFrame(
        frame,
      );

      window.removeEventListener(
        "resize",
        calculatePosition,
      );
    };
  }, [
    banners.length,
  ]);

  /* =======================================================
     DESKTOP SCROLL BEHAVIOUR

     ONLY DESKTOP:

     ↓ Scroll Down
     Tabs hide.

     ↑ Scroll Up
     Tabs show.

     Mobile:
     Always visible.
  ======================================================= */

  useEffect(() => {
    /* -----------------------------------------------------
       MOBILE
    ----------------------------------------------------- */

    if (
      !isDesktop
    ) {
      setTabsVisible(
        true,
      );

      setTabsReachedSticky(
        false,
      );

      return;
    }

    /* -----------------------------------------------------
       CURRENT SCROLL POSITION
    ----------------------------------------------------- */

    lastScrollYRef.current =
      Math.max(
        window.scrollY,
        0,
      );

    /* -----------------------------------------------------
       PROCESS SCROLL
    ----------------------------------------------------- */

    const processScroll =
      () => {
        const currentScrollY =
          Math.max(
            window.scrollY,
            0,
          );

        const previousScrollY =
          lastScrollYRef.current;

        const difference =
          currentScrollY -
          previousScrollY;

        /* -----------------------------------------------
           TABS REACHED STICKY AREA?
        ----------------------------------------------- */

        const stickyReached =
          currentScrollY +
            DESKTOP_STICKY_TOP >=
          tabsOriginalTopRef.current;

        setTabsReachedSticky(
          stickyReached,
        );

        /* -----------------------------------------------
           BEFORE STICKY AREA

           Always visible.
        ----------------------------------------------- */

        if (
          !stickyReached
        ) {
          setTabsVisible(
            true,
          );

          lastScrollYRef.current =
            currentScrollY;

          tickingRef.current =
            false;

          return;
        }

        /* -----------------------------------------------
           IGNORE VERY SMALL SCROLL
        ----------------------------------------------- */

        if (
          Math.abs(
            difference,
          ) <
          4
        ) {
          tickingRef.current =
            false;

          return;
        }

        /* -----------------------------------------------
           SCROLL DOWN
        ----------------------------------------------- */

        if (
          difference >
          0
        ) {
          setTabsVisible(
            false,
          );
        }

        /* -----------------------------------------------
           SCROLL UP
        ----------------------------------------------- */

        if (
          difference <
          0
        ) {
          setTabsVisible(
            true,
          );
        }

        lastScrollYRef.current =
          currentScrollY;

        tickingRef.current =
          false;
      };

    /* -----------------------------------------------------
       SCROLL LISTENER
    ----------------------------------------------------- */

    const handleScroll =
      () => {
        if (
          tickingRef.current
        ) {
          return;
        }

        tickingRef.current =
          true;

        window.requestAnimationFrame(
          processScroll,
        );
      };

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      },
    );

    return () => {
      window.removeEventListener(
        "scroll",
        handleScroll,
      );
    };
  }, [
    isDesktop,
  ]);

  /* =======================================================
     CHANGE CATEGORY
  ======================================================= */

  const handleCategoryChange =
    (
      section:
        OfferSection,
    ) => {
      setActiveSection(
        section,
      );

      /*
       * Reset sorting.
       */

      setSort(
        "featured",
      );

      /*
       * User tab click kare to tabs visible.
       */

      setTabsVisible(
        true,
      );
    };

  /* =======================================================
     DESKTOP HIDE STATE

     Mobile par always false.
  ======================================================= */

  const hideDesktopTabs =
    isDesktop &&
    tabsReachedSticky &&
    !tabsVisible;

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main
      className="
        min-h-screen

        bg-[#FCFAF8]

        text-[#211A18]
      "
    >
      {/* ===================================================
          OFFER BANNER

          Banner remains visible.
      =================================================== */}

      <OfferBannerSlider
        banners={
          banners
        }
      />

      {/* ===================================================
          CONTENT
      =================================================== */}

      <section
        className="
          mx-auto

          max-w-[1450px]

          px-3

          pb-12
          pt-6

          sm:px-5

          lg:px-8
          lg:pb-14
          lg:pt-8
        "
      >
        {/* =================================================
            ALL / MEN / WOMEN / ACCESSORIES

            NO NUMBERS

            NO OFFER TITLE

            MOBILE:
            Always visible

            DESKTOP:
            Scroll down = hide
            Scroll up   = show
        ================================================= */}

        <div
          ref={
            tabsRef
          }
          className="
            sticky

            top-[50px]

            z-40

            -mx-3

            border-y
            border-black/[0.07]

            bg-[#FCFAF8]/95

            px-3
            py-2.5

            shadow-[0_4px_12px_rgba(0,0,0,0.03)]

            backdrop-blur-md

            transition-transform

            duration-300

            ease-out

            sm:-mx-5
            sm:px-5

            lg:-mx-8

            lg:top-[154px]

            lg:px-8
            lg:py-3
          "
          style={{
            transform:
              hideDesktopTabs
                ? `translateY(calc(-100% - ${DESKTOP_STICKY_TOP}px))`
                : "translateY(0)",
          }}
        >
          <div
            className="
              mx-auto

              flex

              w-full

              items-center
              justify-center

              gap-2

              overflow-x-auto

              scrollbar-hide
            "
          >
            {categoryTabs.map(
              (
                tab,
              ) => {
                const isActive =
                  activeSection ===
                  tab.key;

                return (
                  <button
                    key={
                      tab.key
                    }
                    type="button"
                    onClick={() =>
                      handleCategoryChange(
                        tab.key,
                      )
                    }
                    className={`
                      shrink-0

                      rounded-full

                      border

                      px-4
                      py-2

                      text-[10px]

                      font-semibold

                      transition-all

                      duration-200

                      sm:px-6

                      lg:min-w-[100px]

                      lg:px-7
                      lg:py-2.5

                      lg:text-[12px]

                      ${
                        isActive
                          ? `
                            border-[#B31345]

                            bg-[#B31345]

                            text-white

                            shadow-sm
                          `
                          : `
                            border-black/10

                            bg-white

                            text-black/60

                            hover:border-[#B31345]/30

                            hover:text-[#B31345]
                          `
                      }
                    `}
                  >
                    {tab.label}
                  </button>
                );
              },
            )}
          </div>
        </div>

        {/* =================================================
            ACTIVE CATEGORY + SORT

            Example:
            All                       Featured
        ================================================= */}

        <div
          className="
            mt-5

            flex

            items-center
            justify-between

            gap-4

            border-b
            border-black/[0.07]

            pb-5
          "
        >
          <h2
            className="
              text-[15px]

              font-semibold

              text-[#292526]

              sm:text-[17px]
            "
          >
            {activeLabel}
          </h2>

          {activeProducts.length >
          0 ? (
            <select
              value={
                sort
              }
              onChange={(
                event,
              ) =>
                setSort(
                  event.target
                    .value as SortValue,
                )
              }
              className="
                h-9

                min-w-[130px]

                rounded-full

                border
                border-black/10

                bg-white

                px-3

                text-[9px]

                outline-none

                sm:h-10
                sm:min-w-[165px]
                sm:px-4
                sm:text-[10px]
              "
            >
              <option value="featured">
                Featured
              </option>

              <option value="low">
                Price Low to High
              </option>

              <option value="high">
                Price High to Low
              </option>
            </select>
          ) : null}
        </div>

        {/* =================================================
            PRODUCTS

            Offer context remains attached.
        ================================================= */}

        {sortedProducts.length >
        0 ? (
          <div
            className="
              mt-8

              grid

              grid-cols-2

              gap-x-3
              gap-y-9

              sm:gap-x-5

              md:grid-cols-3

              lg:grid-cols-4
              lg:gap-x-6
            "
          >
            {sortedProducts.map(
              (
                product,
              ) => (
                <StorefrontProductCard
                  key={
                    product.variantKey
                  }
                  product={
                    product
                  }
                  offerContext={
                    offerContext
                  }
                />
              ),
            )}
          </div>
        ) : (
          /* ===============================================
             EMPTY STATE
          =============================================== */

          <div
            className="
              py-20

              text-center
            "
          >
            <p
              className="
                text-[14px]

                font-semibold

                text-[#292526]
              "
            >
              No {activeLabel} products
            </p>

            <p
              className="
                mx-auto

                mt-2

                max-w-[420px]

                text-[10px]

                leading-5

                text-black/45
              "
            >
              Is offer me abhi koi
              eligible{" "}
              {activeLabel} product
              available nahi hai.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}