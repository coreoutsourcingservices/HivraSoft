"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import Header from "@/src/components/Header/Header";

import {
  useStorefrontCommerce,
} from "@/src/components/Storefront/StorefrontCommerceProvider";

import {
  getProductCategorySlugs,
  type ApiColor,
  type ApiImage,
  type ApiProduct,
} from "@/src/services/products";

import {
  mapProductToColorCards,
} from "@/src/services/storefront-catalog";

import type {
  CatalogProduct,
} from "@/types/catalog";

/* =========================================================
   API
========================================================= */

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000"
).replace(/\/$/, "");

/* =========================================================
   TYPES
========================================================= */

type Category = {
  _id?: string;
  id?: string;
  name?: string;
  slug?: string;
  level?: number;
};

type BannerItem = {
  url?: string;
  publicId?: string;
  alt?: string;

  title?: string;
  subtitle?: string;
  description?: string;
  buttonText?: string;

  linkType?:
    | "none"
    | "custom"
    | "category"
    | "product";

  customLink?: string;

  category?:
    | Category
    | string
    | null;

  product?:
    | ApiProduct
    | string
    | null;

  openInNewTab?: boolean;
};

type BannerGroup = {
  _id?: string;

  title?: string;
  slug?: string;
  description?: string;

  mediaType?:
    | "image"
    | "video";

  images?: BannerItem[];

  position?: string;
  device?: string;

  sortOrder?: number;

  isActive?: boolean;
};

type OnTrendItem = {
  _id?: string;

  image?: ApiImage;

  link?: string;

  productId?:
    | ApiProduct
    | string
    | null;

  categoryId?:
    | Category
    | string
    | null;

  order?: number;
};

type AlwaysInItItem = {
  _id?: string;

  gender?:
    | "men"
    | "women";

  mainImage?: ApiImage;

  productIds?: ApiProduct[];

  isActive?: boolean;
};

/* =========================================================
   HELPERS
========================================================= */

const asArray = <T,>(
  value: unknown,
): T[] =>
  Array.isArray(value)
    ? (value as T[])
    : [];

function firstString(
  ...values: unknown[]
) {
  for (
    const value of values
  ) {
    if (
      typeof value ===
        "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return "";
}

function numberValue(
  value: unknown,
  fallback = 0,
) {
  const parsed =
    Number(value);

  return Number.isFinite(
    parsed,
  )
    ? parsed
    : fallback;
}

function money(
  value: number,
) {
  return `₹${Math.max(
    0,
    Number(value || 0),
  ).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits:
        2,
    },
  )}`;
}

function readId(
  value: unknown,
) {
  if (
    typeof value ===
    "string"
  ) {
    return value.trim();
  }

  if (
    !value ||
    typeof value !==
      "object"
  ) {
    return "";
  }

  const row =
    value as Record<
      string,
      unknown
    >;

  return firstString(
    row._id,
    row.id,
  );
}

function normalizeHex(
  value: unknown,
) {
  const hex =
    firstString(
      value,
    ).toLowerCase();

  if (
    /^#[0-9a-f]{6}$/.test(
      hex,
    )
  ) {
    return hex;
  }

  if (
    /^#[0-9a-f]{3}$/.test(
      hex,
    )
  ) {
    return `#${hex
      .slice(1)
      .split("")
      .map(
        (item) =>
          item + item,
      )
      .join("")}`;
  }

  return "";
}

/* =========================================================
   STRICT GENDER
========================================================= */

function belongsToGender(
  product: ApiProduct,
  gender:
    | "men"
    | "women",
) {
  return getProductCategorySlugs(
    product,
  ).includes(gender);
}

/* =========================================================
   DEFAULT PRODUCT COLOR CARD
========================================================= */

function defaultCatalogCard(
  product: ApiProduct,
): CatalogProduct | null {
  const cards =
    mapProductToColorCards(
      product,
    );

  if (!cards.length) {
    return null;
  }

  const colors =
    asArray<ApiColor>(
      product.colors,
    );

  const defaultColor =
    colors.find(
      (color) =>
        color.isDefault ===
        true,
    ) ||
    colors[0];

  const defaultId =
    readId(
      defaultColor,
    );

  if (defaultId) {
    const exact =
      cards.find(
        (card) =>
          card.colorId ===
          defaultId,
      );

    if (exact) {
      return exact;
    }
  }

  return cards[0];
}

function strictGenderCards(
  products: ApiProduct[],
  gender:
    | "men"
    | "women",
  limit: number,
) {
  return products
    .filter(
      (product) =>
        belongsToGender(
          product,
          gender,
        ),
    )
    .slice(
      0,
      limit,
    )
    .map(
      defaultCatalogCard,
    )
    .filter(
      (
        product,
      ): product is CatalogProduct =>
        Boolean(product),
    );
}

/* =========================================================
   ROUTES
========================================================= */

function categoryHref(
  category?:
    | Category
    | string
    | null,
) {
  if (
    !category ||
    typeof category ===
      "string"
  ) {
    return "/";
  }

  const slug =
    firstString(
      category.slug,
    );

  if (!slug) {
    return "/";
  }

  const all =
    `${category.name || ""} ${slug}`
      .toLowerCase();

  if (
    slug === "women"
  ) {
    return "/women";
  }

  if (
    slug === "men"
  ) {
    return "/men";
  }

  if (
    /\b(women|woman|female|ladies)\b/.test(
      all,
    )
  ) {
    return `/women/${slug}`;
  }

  if (
    /\b(men|man|male|mens)\b/.test(
      all,
    )
  ) {
    return `/men/${slug}`;
  }

  return `/search?q=${encodeURIComponent(
    slug,
  )}`;
}

function rawProductHref(
  product?:
    | ApiProduct
    | string
    | null,
) {
  if (
    !product ||
    typeof product ===
      "string"
  ) {
    return "/";
  }

  const card =
    defaultCatalogCard(
      product,
    );

  return card
    ? `/product/${card.slug}`
    : "/";
}

function bannerHref(
  item: BannerItem,
) {
  if (
    item.linkType ===
      "custom" &&
    item.customLink
  ) {
    return item.customLink;
  }

  if (
    item.linkType ===
    "category"
  ) {
    return categoryHref(
      item.category,
    );
  }

  if (
    item.linkType ===
    "product"
  ) {
    return rawProductHref(
      item.product,
    );
  }

  return "/";
}

function trendHref(
  item: OnTrendItem,
) {
  if (
    item.link?.trim()
  ) {
    return item.link.trim();
  }

  if (
    item.productId &&
    typeof item.productId !==
      "string"
  ) {
    return rawProductHref(
      item.productId,
    );
  }

  if (
    item.categoryId &&
    typeof item.categoryId !==
      "string"
  ) {
    return categoryHref(
      item.categoryId,
    );
  }

  return "/";
}

/* =========================================================
   API FETCH
========================================================= */

async function safeJson(
  path: string,
) {
  try {
    const response =
      await fetch(
        `${API_URL}${path}`,
        {
          method:
            "GET",

          credentials:
            "include",

          cache:
            "no-store",

          headers: {
            Accept:
              "application/json",
          },
        },
      );

    if (!response.ok) {
      throw new Error(
        `${path} failed (${response.status})`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error(
      "HOME API ERROR:",
      path,
      error,
    );

    return null;
  }
}

/* =========================================================
   SMART LINK
========================================================= */

function SmartLink({
  href,
  newTab = false,
  className = "",
  children,
}: {
  href: string;
  newTab?: boolean;
  className?: string;
  children: ReactNode;
}) {
  if (
    /^https?:\/\//i.test(
      href,
    )
  ) {
    return (
      <a
        href={href}
        target={
          newTab
            ? "_blank"
            : undefined
        }
        rel={
          newTab
            ? "noreferrer"
            : undefined
        }
        className={
          className
        }
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={
        href || "/"
      }
      target={
        newTab
          ? "_blank"
          : undefined
      }
      className={
        className
      }
    >
      {children}
    </Link>
  );
}

/* =========================================================
   BANNER HELPERS
========================================================= */

function usableBanners(
  banners: BannerGroup[],
  mobile: boolean,
) {
  return banners
    .filter(
      (banner) =>
        banner.isActive !==
        false,
    )
    .filter(
      (banner) => {
        const device =
          firstString(
            banner.device,
            "all",
          ).toLowerCase();

        if (
          !device ||
          device === "all"
        ) {
          return true;
        }

        return mobile
          ? device ===
              "mobile"
          : device ===
              "desktop";
      },
    )
    .sort(
      (first, second) =>
        numberValue(
          first.sortOrder,
        ) -
        numberValue(
          second.sortOrder,
        ),
    );
}

function bannerImages(
  groups: BannerGroup[],
) {
  return groups.flatMap(
    (group) =>
      group.mediaType ===
        "video"
        ? []
        : asArray<BannerItem>(
            group.images,
          ),
  );
}

function purposeBannerImages(
  groups: BannerGroup[],
  words: string[],
  fallbackPosition: string,
) {
  const named =
    groups.filter(
      (group) => {
        const search =
          `${group.title || ""} ${group.slug || ""} ${group.description || ""}`
            .toLowerCase();

        return words.some(
          (word) =>
            search.includes(
              word,
            ),
        );
      },
    );

  if (named.length) {
    return bannerImages(
      named,
    );
  }

  return bannerImages(
    groups.filter(
      (group) =>
        group.position ===
        fallbackPosition,
    ),
  );
}

/* =========================================================
   HERO BANNER

   TABLET/MOBILE 1537 x 536
   DESKTOP       1600 x 386
========================================================= */

function HeroBanner({
  items,
}: {
  items: BannerItem[];
}) {
  const [
    active,
    setActive,
  ] =
    useState(0);

  useEffect(() => {
    if (
      items.length <= 1
    ) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          setActive(
            (current) =>
              (
                current +
                1
              ) %
              items.length,
          );
        },
        4500,
      );

    return () =>
      window.clearInterval(
        timer,
      );
  }, [
    items.length,
  ]);

  useEffect(() => {
    if (
      active >=
      items.length
    ) {
      setActive(0);
    }
  }, [
    active,
    items.length,
  ]);

  if (
    !items.length
  ) {
    return null;
  }

  return (
    <section
      className="
        relative
        w-full
        overflow-hidden
        bg-[#EFE7E1]
      "
    >
      <div
        className="
          relative
          w-full
          aspect-[1537/536]

          lg:aspect-[1537/536]
        "
      >
        {items.map(
          (
            item,
            index,
          ) => (
            <SmartLink
              key={`${item.publicId || item.url}-${index}`}
              href={
                bannerHref(
                  item,
                )
              }
              newTab={
                item.openInNewTab
              }
              className={`
                absolute
                inset-0
                block
                transition-all
                duration-700

                ${
                  index ===
                  active
                    ? `
                      z-10
                      translate-x-0
                      opacity-100
                    `
                    : `
                      translate-x-full
                      opacity-0
                    `
                }
              `}
            >
              {item.url ? (
                <img
                  src={
                    item.url
                  }
                  alt={
                    item.alt ||
                    "Hivra Soft Banner"
                  }
                  className="
                    h-full
                    w-full
                    object-fill
                  "
                />
              ) : null}
            </SmartLink>
          ),
        )}

        {items.length >
        1 ? (
          <>
            <button
              type="button"
              aria-label="Previous banner"
              onClick={() =>
                setActive(
                  (
                    current,
                  ) =>
                    current ===
                    0
                      ? items.length -
                        1
                      : current -
                        1,
                )
              }
              className="
                absolute
                left-2
                top-1/2
                z-30
                grid
                h-8
                w-8
                -translate-y-1/2
                place-items-center
                rounded-full
                bg-white/95
                text-[19px]
                shadow-md

                sm:left-4
                sm:h-10
                sm:w-10
              "
            >
              ‹
            </button>

            <button
              type="button"
              aria-label="Next banner"
              onClick={() =>
                setActive(
                  (
                    current,
                  ) =>
                    (
                      current +
                      1
                    ) %
                    items.length,
                )
              }
              className="
                absolute
                right-2
                top-1/2
                z-30
                grid
                h-8
                w-8
                -translate-y-1/2
                place-items-center
                rounded-full
                bg-white/95
                text-[19px]
                shadow-md

                sm:right-4
                sm:h-10
                sm:w-10
              "
            >
              ›
            </button>

            <div
              className="
                absolute
                bottom-2
                left-1/2
                z-30
                flex
                -translate-x-1/2
                gap-1.5

                sm:bottom-3
              "
            >
              {items.map(
                (
                  _,
                  index,
                ) => (
                  <button
                    key={
                      index
                    }
                    type="button"
                    aria-label={`Banner ${
                      index +
                      1
                    }`}
                    onClick={() =>
                      setActive(
                        index,
                      )
                    }
                    className={`
                      h-1.5
                      rounded-full
                      transition-all

                      ${
                        index ===
                        active
                          ? `
                            w-6
                            bg-[#B5194B]
                          `
                          : `
                            w-1.5
                            bg-white/80
                          `
                      }
                    `}
                  />
                ),
              )}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

/* =========================================================
   ON TREND PICKS
========================================================= */

function OnTrendPicks({
  items,
}: {
  items: OnTrendItem[];
}) {
  const [
    active,
    setActive,
  ] = useState(0);

  const [
    paused,
    setPaused,
  ] = useState(false);

  const [
    animating,
    setAnimating,
  ] = useState(false);

  /* =========================================================
     NORMALIZE INDEX

     Example:
     -1 => last image
     4  => first image
  ========================================================= */

  function normalizeIndex(
    index: number,
  ) {
    if (!items.length) {
      return 0;
    }

    return (
      (
        index %
        items.length
      ) +
      items.length
    ) % items.length;
  }

  /* =========================================================
     CARD POSITION

     -1 = LEFT
      0 = CENTER
      1 = RIGHT

     Remaining cards stay hidden outside.
  ========================================================= */

  function getCardPosition(
    index: number,
  ) {
    if (!items.length) {
      return 0;
    }

    const previousIndex =
      normalizeIndex(
        active - 1,
      );

    const nextIndex =
      normalizeIndex(
        active + 1,
      );

    if (
      index === active
    ) {
      return 0;
    }

    if (
      index ===
      previousIndex
    ) {
      return -1;
    }

    if (
      index === nextIndex
    ) {
      return 1;
    }

    /*
     * Remaining image kis side
     * wait karegi.
     */

    let difference =
      index - active;

    if (
      difference >
      items.length / 2
    ) {
      difference -=
        items.length;
    }

    if (
      difference <
      -items.length / 2
    ) {
      difference +=
        items.length;
    }

    return difference < 0
      ? -2
      : 2;
  }

  /* =========================================================
     NEXT
  ========================================================= */

  function next() {
    if (
      animating ||
      items.length <= 1
    ) {
      return;
    }

    setAnimating(true);

    setActive(
      (current) =>
        normalizeIndex(
          current + 1,
        ),
    );

    window.setTimeout(
      () => {
        setAnimating(false);
      },
      850,
    );
  }

  /* =========================================================
     PREVIOUS
  ========================================================= */

  function previous() {
    if (
      animating ||
      items.length <= 1
    ) {
      return;
    }

    setAnimating(true);

    setActive(
      (current) =>
        normalizeIndex(
          current - 1,
        ),
    );

    window.setTimeout(
      () => {
        setAnimating(false);
      },
      850,
    );
  }

  /* =========================================================
     DOT CLICK
  ========================================================= */

  function goTo(
    index: number,
  ) {
    if (
      animating ||
      index === active
    ) {
      return;
    }

    setAnimating(true);

    setActive(
      normalizeIndex(
        index,
      ),
    );

    window.setTimeout(
      () => {
        setAnimating(false);
      },
      850,
    );
  }

  /* =========================================================
     AUTO SLIDE
  ========================================================= */

  useEffect(() => {
    if (
      items.length <= 1 ||
      paused ||
      animating
    ) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          setActive(
            (current) =>
              normalizeIndex(
                current + 1,
              ),
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
    items.length,
    paused,
    animating,
  ]);

  /* =========================================================
     INDEX SAFETY
  ========================================================= */

  useEffect(() => {
    if (
      active >=
      items.length
    ) {
      setActive(0);
    }
  }, [
    active,
    items.length,
  ]);

  /* =========================================================
     EMPTY
  ========================================================= */

  if (!items.length) {
    return null;
  }

  return (
    <section
      className="
        w-full
        overflow-hidden
        bg-white

        px-3
        py-8

        sm:px-5
        sm:py-10

        lg:px-6
        lg:py-14
      "
      onMouseEnter={() =>
        setPaused(true)
      }
      onMouseLeave={() =>
        setPaused(false)
      }
    >
      <div
        className="
          mx-auto
          w-full
          max-w-[1450px]
        "
      >
        {/* ===================================================
            TITLE
        =================================================== */}

        <div
          className="
            mb-8
            text-center

            lg:mb-10
          "
        >
          <h2
            className="
              text-[26px]
              font-bold
              uppercase
              leading-none
              tracking-[-0.02em]

              sm:text-[32px]

              lg:text-[48px]
            "
          >
            <span
              className="
                font-light
                text-[#5C5957]
              "
            >
              On-Trend
            </span>{" "}
            Picks
          </h2>

          <p
            className="
              mt-2

              text-[9px]
              tracking-[0.03em]
              text-black/55

              sm:text-[11px]

              lg:text-[14px]
            "
          >
            Explore Our Promising
            Line-up
          </p>
        </div>

        {/* ===================================================
            DESKTOP / TABLET

            IMPORTANT:
            Container NEVER MOVES.

            Only individual cards move.
        =================================================== */}

        <div
          className="
            relative

            hidden

            h-[390px]
            w-full

            overflow-hidden

            md:block

            [--side-x:280px]

            lg:[--side-x:350px]

            xl:[--side-x:390px]
          "
        >
          {items.map(
            (
              item,
              index,
            ) => {
              const position =
                getCardPosition(
                  index,
                );

              const isCenter =
                position === 0;

              const isLeft =
                position === -1;

              const isRight =
                position === 1;

              const isVisible =
                isCenter ||
                isLeft ||
                isRight;

              /* =============================================
                 X POSITION

                 CENTER = 0
                 LEFT   = -side
                 RIGHT  = +side

                 Hidden cards stay outside.
              ============================================= */

              let translateX =
                "0px";

              if (position === -1) {
                translateX =
                  "calc(-1 * var(--side-x))";
              }

              if (position === 1) {
                translateX =
                  "var(--side-x)";
              }

              if (position <= -2) {
                translateX =
                  "calc(-2 * var(--side-x))";
              }

              if (position >= 2) {
                translateX =
                  "calc(2 * var(--side-x))";
              }

              return (
                <div
                  key={
                    item._id ||
                    `${index}`
                  }
                  className="
                    absolute

                    left-1/2
                    top-1/2

                    transition-all
                    duration-[850ms]

                    ease-[cubic-bezier(0.22,1,0.36,1)]

                    will-change-transform
                  "
                  style={{
                    transform: `
                      translate(-50%, -50%)
                      translateX(${translateX})
                      scale(${
                        isCenter
                          ? 1
                          : isVisible
                            ? 0.82
                            : 0.7
                      })
                    `,

                    opacity:
                      isVisible
                        ? 1
                        : 0,

                    zIndex:
                      isCenter
                        ? 30
                        : isVisible
                          ? 20
                          : 1,

                    pointerEvents:
                      isVisible
                        ? "auto"
                        : "none",
                  }}
                >
                  <SmartLink
                    href={
                      trendHref(
                        item,
                      )
                    }
                    className="
                      group

                      relative
                      block

                      h-[290px]
                      w-[390px]

                      overflow-hidden

                      rounded-[20px]

                      bg-[#EFECE9]

                      shadow-[0_15px_35px_rgba(0,0,0,0.12)]

                      lg:h-[338px]
                      lg:w-[455px]
                    "
                  >
                    {item
                      ?.image
                      ?.url ? (
                      <img
                        src={
                          item
                            .image
                            .url
                        }
                        alt="On Trend"
                        className="
                          h-full
                          w-full

                          object-cover

                          transition-transform
                          duration-[850ms]

                          ease-[cubic-bezier(0.22,1,0.36,1)]

                          group-hover:scale-[1.01]
                        "
                      />
                    ) : (
                      <div
                        className="
                          grid
                          h-full
                          w-full

                          place-items-center

                          bg-[#EFECE9]

                          text-[11px]
                          text-black/30
                        "
                      >
                        Hivra Soft
                      </div>
                    )}
                  </SmartLink>
                </div>
              );
            },
          )}

          {/* =================================================
              LEFT ARROW
          ================================================= */}

          {items.length >
          1 ? (
            <button
              type="button"
              aria-label="Previous On Trend"
              onClick={
                previous
              }
              disabled={
                animating
              }
              className="
                absolute

                left-3
                top-1/2
                z-[80]

                grid

                h-10
                w-10

                -translate-y-1/2

                cursor-pointer

                place-items-center

                rounded-full

                border
                border-[#211A18]/70

                bg-white/95

                text-[22px]
                leading-none
                text-[#211A18]

                shadow-sm

                transition-all
                duration-300

                hover:scale-105
                hover:bg-[#292725]
                hover:text-white

                active:scale-95

                disabled:cursor-default
                disabled:opacity-70

                lg:h-11
                lg:w-11
              "
            >
              ‹
            </button>
          ) : null}

          {/* =================================================
              RIGHT ARROW
          ================================================= */}

          {items.length >
          1 ? (
            <button
              type="button"
              aria-label="Next On Trend"
              onClick={next}
              disabled={
                animating
              }
              className="
                absolute

                right-3
                top-1/2
                z-[80]

                grid

                h-10
                w-10

                -translate-y-1/2

                cursor-pointer

                place-items-center

                rounded-full

                border
                border-[#211A18]/70

                bg-white/95

                text-[22px]
                leading-none
                text-[#211A18]

                shadow-sm

                transition-all
                duration-300

                hover:scale-105
                hover:bg-[#292725]
                hover:text-white

                active:scale-95

                disabled:cursor-default
                disabled:opacity-70

                lg:h-11
                lg:w-11
              "
            >
              ›
            </button>
          ) : null}
        </div>

        {/* ===================================================
            MOBILE

            Same concept:
            center never moves from middle.
        =================================================== */}

        <div
          className="
            relative

            mx-auto

            h-[245px]
            w-full
            max-w-[350px]

            overflow-hidden

            md:hidden
          "
        >
          {items.map(
            (
              item,
              index,
            ) => {
              const position =
                getCardPosition(
                  index,
                );

              const isCenter =
                position === 0;

              const isVisible =
                Math.abs(
                  position,
                ) <= 1;

              let x = 0;

              if (position === -1) {
                x = -92;
              }

              if (position === 1) {
                x = 92;
              }

              if (position <= -2) {
                x = -190;
              }

              if (position >= 2) {
                x = 190;
              }

              return (
                <div
                  key={
                    item._id ||
                    `${index}`
                  }
                  className="
                    absolute

                    left-1/2
                    top-1/2

                    w-[86%]

                    transition-all
                    duration-[750ms]

                    ease-[cubic-bezier(0.22,1,0.36,1)]

                    will-change-transform
                  "
                  style={{
                    transform: `
                      translate(-50%, -50%)
                      translateX(${x}%)
                      scale(${
                        isCenter
                          ? 1
                          : 0.86
                      })
                    `,

                    opacity:
                      isVisible
                        ? 1
                        : 0,

                    zIndex:
                      isCenter
                        ? 30
                        : isVisible
                          ? 20
                          : 1,

                    pointerEvents:
                      isVisible
                        ? "auto"
                        : "none",
                  }}
                >
                  <SmartLink
                    href={
                      trendHref(
                        item,
                      )
                    }
                    className="
                      block

                      aspect-[1.28/1]

                      w-full

                      overflow-hidden

                      rounded-[13px]

                      bg-[#EFECE9]

                      shadow-[0_10px_25px_rgba(0,0,0,0.12)]
                    "
                  >
                    {item
                      ?.image
                      ?.url ? (
                      <img
                        src={
                          item
                            .image
                            .url
                        }
                        alt="On Trend"
                        className="
                          h-full
                          w-full
                          object-cover
                        "
                      />
                    ) : null}
                  </SmartLink>
                </div>
              );
            },
          )}

          {items.length >
          1 ? (
            <>
              <button
                type="button"
                aria-label="Previous On Trend"
                onClick={
                  previous
                }
                disabled={
                  animating
                }
                className="
                  absolute

                  left-1
                  top-1/2
                  z-[80]

                  grid

                  h-8
                  w-8

                  -translate-y-1/2

                  place-items-center

                  rounded-full

                  border
                  border-black/25

                  bg-white/95

                  text-[18px]

                  shadow-md

                  active:scale-95
                "
              >
                ‹
              </button>

              <button
                type="button"
                aria-label="Next On Trend"
                onClick={next}
                disabled={
                  animating
                }
                className="
                  absolute

                  right-1
                  top-1/2
                  z-[80]

                  grid

                  h-8
                  w-8

                  -translate-y-1/2

                  place-items-center

                  rounded-full

                  border
                  border-black/25

                  bg-white/95

                  text-[18px]

                  shadow-md

                  active:scale-95
                "
              >
                ›
              </button>
            </>
          ) : null}
        </div>

        {/* ===================================================
            DOTS
        =================================================== */}

        {items.length >
        1 ? (
          <div
            className="
              mt-5

              flex

              items-center
              justify-center

              gap-2
            "
          >
            {items.map(
              (
                _,
                index,
              ) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Go to item ${
                    index +
                    1
                  }`}
                  onClick={() =>
                    goTo(
                      index,
                    )
                  }
                  className={`
                    cursor-pointer

                    rounded-full

                    transition-all
                    duration-300

                    ${
                      active ===
                      index
                        ? `
                          h-2.5
                          w-2.5

                          bg-black

                          ring-1
                          ring-black
                          ring-offset-2
                        `
                        : `
                          h-1.5
                          w-1.5

                          bg-black/15
                        `
                    }
                  `}
                />
              ),
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* =========================================================
   GENDER TOGGLE
========================================================= */

function GenderToggle({
  value,
  onChange,
  dark = false,
  compact = false,
}: {
  value:
    | "men"
    | "women";

  onChange: (
    value:
      | "men"
      | "women",
  ) => void;

  dark?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={`
        inline-flex
        rounded-[12px]
        border
        p-1

        ${
          dark
            ? `
              border-white/40
              bg-white/5
            `
            : `
              border-black/20
              bg-white
            `
        }
      `}
    >
      {(
        [
          "men",
          "women",
        ] as const
      ).map(
        (gender) => (
          <button
            key={
              gender
            }
            type="button"
            onClick={() =>
              onChange(
                gender,
              )
            }
            className={`
              rounded-[9px]
              font-semibold
              capitalize
              transition

              ${
                compact
                  ? `
                    min-w-[72px]
                    px-3
                    py-2
                    text-[10px]

                    sm:min-w-[80px]
                    sm:px-4
                    sm:text-[11px]
                  `
                  : `
                    min-w-[95px]
                    px-4
                    py-2.5
                    text-[12px]

                    sm:min-w-[105px]
                    sm:px-5
                    sm:py-3
                    sm:text-[13px]
                  `
              }

              ${
                value ===
                gender
                  ? `
                    bg-[#292725]
                    text-white
                  `
                  : dark
                    ? `
                      text-white
                    `
                    : `
                      text-[#211A18]
                    `
              }
            `}
          >
            {gender}
          </button>
        ),
      )}
    </div>
  );
}

/* =========================================================
   PRODUCT CARD
========================================================= */

function CommerceProductCard({
  product,
  compact = false,
}: {
  product: CatalogProduct;
  compact?: boolean;
}) {
  const {
    openAddToBag,
    toggleWishlist,
    isWishlisted,
    isWishlistBusy,
  } =
    useStorefrontCommerce();

  const liked =
    isWishlisted(
      product,
    );

  const busy =
    isWishlistBusy(
      product,
    );

  return (
    <article
      className="
        group
        min-w-0
        overflow-hidden
        rounded-[15px]
        border
        border-[#211A18]/10
        bg-white
        text-[#211A18]
        transition-all
        duration-300

        hover:-translate-y-0.5
        hover:shadow-[0_16px_40px_rgba(33,26,24,0.10)]
      "
    >
      <div
        className="
          relative
        "
      >
        <Link
          href={`/product/${product.slug}`}
          className="
            relative
            block
            aspect-[4/5]
            overflow-hidden
            bg-[#F0EEEC]
          "
        >
          {product.image1 ? (
            <>
              <img
                src={
                  product.image1
                }
                alt={
                  product.name
                }
                className="
                  absolute
                  inset-0
                  h-full
                  w-full
                  object-cover
                  transition-all
                  duration-500

                  group-hover:scale-[1.025]
                  group-hover:opacity-0
                "
              />

              <img
                src={
                  product.image2 ||
                  product.image1
                }
                alt={`${product.name} alternate`}
                className="
                  absolute
                  inset-0
                  h-full
                  w-full
                  scale-[1.02]
                  object-cover
                  opacity-0
                  transition-all
                  duration-500

                  group-hover:scale-100
                  group-hover:opacity-100
                "
              />
            </>
          ) : (
            <div
              className="
                grid
                h-full
                place-items-center
                text-[11px]
                text-black/40
              "
            >
              Hivra Soft
            </div>
          )}
        </Link>

        {product.discountPercent >
        0 ? (
          <span
            className="
              absolute
              left-0
              top-3
              z-10
              rounded-r-[7px]
              bg-[#FF704D]
              px-2.5
              py-1.5
              text-[9px]
              font-bold
              text-white
              shadow-sm
            "
          >
            {
              product.discountPercent
            }
            % off
          </span>
        ) : null}

        <button
          type="button"
          aria-label={
            liked
              ? "Remove from wishlist"
              : "Add to wishlist"
          }
          disabled={
            busy
          }
          onClick={() => {
            void toggleWishlist(
              product,
            );
          }}
          className={`
            absolute
            right-2.5
            top-2.5
            z-10
            grid
            h-8
            w-8
            place-items-center
            rounded-full
            bg-white/95
            text-[17px]
            shadow-[0_3px_12px_rgba(0,0,0,0.10)]
            transition

            disabled:cursor-wait
            disabled:opacity-50

            ${
              liked
                ? `
                  text-[#EC477C]
                `
                : `
                  text-[#C51F52]
                  hover:bg-[#FFF3F7]
                `
            }
          `}
        >
          {liked
            ? "♥"
            : "♡"}
        </button>
      </div>

      <div
        className={
          compact
            ? "p-3"
            : "p-3.5"
        }
      >
        <p
          className="
            truncate
            text-[8px]
            uppercase
            tracking-[0.14em]
            text-[#8B7468]
          "
        >
          {product.colorName ||
            "Default"}
        </p>

        <Link
          href={`/product/${product.slug}`}
          className={`
            mt-1.5
            block
            line-clamp-2
            font-medium
            leading-[1.35]

            ${
              compact
                ? `
                  min-h-[31px]
                  text-[10.5px]
                `
                : `
                  min-h-[38px]
                  text-[12px]
                `
            }
          `}
        >
          {product.name}
        </Link>

        <div
          className="
            mt-2
            flex
            flex-wrap
            items-center
            gap-2
          "
        >
          <strong
            className="
              text-[13px]
              text-[#111]
            "
          >
            {money(
              product.showPrice,
            )}
          </strong>

          {product.originalPrice >
            product.showPrice ? (
            <span
              className="
                text-[9px]
                text-black/35
                line-through
              "
            >
              {money(
                product.originalPrice,
              )}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => {
            void openAddToBag(
              product,
            );
          }}
          className="
            mt-3
            flex
            h-10
            w-full
            items-center
            justify-center
            rounded-[6px]
            bg-[#EC477C]
            px-3
            text-[9px]
            font-bold
            uppercase
            tracking-[0.08em]
            text-white
            transition

            hover:bg-[#D8396D]
          "
        >
          Add to Bag
        </button>
      </div>
    </article>
  );
}

/* =========================================================
   ALWAYS IN IT

   DESKTOP:
   FULL BACKGROUND IMAGE
   PRODUCTS HALF SCREEN SE START
   NEXT PAR LEFT SIDE TAK SLIDE

   MOBILE:
   BACKGROUND + ONE LARGE CARD
========================================================= */

function AlwaysInItSection({
  records,
}: {
  records: AlwaysInItItem[];
}) {
  const [gender, setGender] =
    useState<"men" | "women">("women");

  /* =========================================================
     DESKTOP STATE
  ========================================================= */

  const [slideIndex, setSlideIndex] =
    useState(0);

  const [cardStep, setCardStep] =
    useState(230);

  const firstCardRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  /* =========================================================
     MOBILE STATE
  ========================================================= */

  const [
    mobileIndex,
    setMobileIndex,
  ] = useState(0);

  const [
    mobileCardStep,
    setMobileCardStep,
  ] = useState(220);

  const mobileFirstCardRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  /* =========================================================
     CURRENT GENDER RECORD
  ========================================================= */

  const current =
    records.find(
      (record) =>
        record.gender === gender,
    ) || records[0];

  /* =========================================================
     PRODUCTS
  ========================================================= */

  const products =
    asArray<ApiProduct>(
      current?.productIds,
    )
      .map(defaultCatalogCard)
      .filter(
        (
          product,
        ): product is CatalogProduct =>
          Boolean(product),
      )
      .slice(0, 5);

  /* =========================================================
     RESET ON GENDER CHANGE
  ========================================================= */

  useEffect(() => {
    setSlideIndex(0);
    setMobileIndex(0);
  }, [gender]);

  /* =========================================================
     DESKTOP CARD MEASURE
  ========================================================= */

  useEffect(() => {
    function measureDesktopCard() {
      if (
        !firstCardRef.current
      ) {
        return;
      }

      setCardStep(
        firstCardRef.current
          .offsetWidth + 14,
      );
    }

    const timer =
      window.setTimeout(
        measureDesktopCard,
        100,
      );

    window.addEventListener(
      "resize",
      measureDesktopCard,
    );

    return () => {
      window.clearTimeout(
        timer,
      );

      window.removeEventListener(
        "resize",
        measureDesktopCard,
      );
    };
  }, [
    gender,
    products.length,
  ]);

  /* =========================================================
     MOBILE CARD MEASURE
  ========================================================= */

  useEffect(() => {
    function measureMobileCard() {
      if (
        !mobileFirstCardRef.current
      ) {
        return;
      }

      setMobileCardStep(
        mobileFirstCardRef.current
          .offsetWidth + 10,
      );
    }

    const timer =
      window.setTimeout(
        measureMobileCard,
        120,
      );

    window.addEventListener(
      "resize",
      measureMobileCard,
    );

    return () => {
      window.clearTimeout(
        timer,
      );

      window.removeEventListener(
        "resize",
        measureMobileCard,
      );
    };
  }, [
    gender,
    products.length,
  ]);

  if (!records.length) {
    return null;
  }

  /* =========================================================
     DESKTOP PREVIOUS / NEXT
  ========================================================= */

  function previous() {
    if (
      products.length <= 1
    ) {
      return;
    }

    setSlideIndex(
      (currentIndex) =>
        Math.max(
          0,
          currentIndex - 1,
        ),
    );
  }

  function next() {
    if (
      products.length <= 1
    ) {
      return;
    }

    setSlideIndex(
      (currentIndex) =>
        Math.min(
          products.length - 1,
          currentIndex + 1,
        ),
    );
  }

  /* =========================================================
     MOBILE PREVIOUS / NEXT
  ========================================================= */

  function mobilePrevious() {
    if (
      products.length <= 1
    ) {
      return;
    }

    setMobileIndex(
      (currentIndex) =>
        Math.max(
          0,
          currentIndex - 1,
        ),
    );
  }

  function mobileNext() {
    if (
      products.length <= 1
    ) {
      return;
    }

    setMobileIndex(
      (currentIndex) =>
        Math.min(
          products.length - 1,
          currentIndex + 1,
        ),
    );
  }

  return (
    <section
      className="
        relative
        w-full
        overflow-hidden
        bg-[#BDA681]

        h-[620px]

        sm:h-[670px]

        lg:h-[calc(100svh-112px)]
        lg:min-h-[555px]
        lg:max-h-[720px]
      "
    >
      {/* ===================================================
          BACKGROUND
      =================================================== */}

      <div
        className="
          absolute
          inset-0
          z-0
          h-full
          w-full
          overflow-hidden
        "
      >
        {current
          ?.mainImage?.url ? (
          <img
            src={
              current.mainImage.url
            }
            alt={`Always in it ${gender}`}
            className="
              h-full
              w-full
              object-cover

              object-[30%_center]
              sm:object-[32%_center]
              lg:object-center
            "
          />
        ) : (
          <div
            className="
              h-full
              w-full
              bg-[#A88E65]
            "
          />
        )}

        <div
          className="
            absolute
            inset-0
            bg-black/[0.02]
          "
        />
      </div>

      {/* ===================================================
          MEN / WOMEN TOGGLE

          Dedicated top layer.
          Cards iske neeche se start honge.
      =================================================== */}

      <div
        className="
          absolute

          right-3
          top-3

          z-[100]

          sm:right-4
          sm:top-4

          lg:right-8
          lg:top-4
        "
      >
        <div
          className="
            rounded-[12px]

            bg-white/95

            p-1

            shadow-[0_5px_20px_rgba(0,0,0,0.10)]

            backdrop-blur-sm
          "
        >
          <GenderToggle
            value={gender}
            onChange={
              setGender
            }
            compact
          />
        </div>
      </div>

      {/* ===================================================
          MOBILE / TABLET
      =================================================== */}

      <div
        className="
          absolute
          inset-0
          z-20

          lg:hidden
        "
      >
        {products.length >
        0 ? (
          <>
            {/* =============================================
                PRODUCT TRACK

                Toggle ke neeche enough spacing.
            ============================================= */}

            <div
              className="
                absolute

                left-0
                right-0

                top-[175px]

                overflow-hidden

                sm:top-[195px]
              "
            >
              <div
                className="
                  flex
                  w-max

                  gap-2.5

                  pl-3
                  pr-8

                  transition-transform
                  duration-700

                  ease-[cubic-bezier(0.22,1,0.36,1)]

                  will-change-transform
                "
                style={{
                  transform: `translate3d(-${
                    mobileIndex *
                    mobileCardStep
                  }px, 0, 0)`,
                }}
              >
                {products.map(
                  (
                    product,
                    index,
                  ) => (
                    <div
                      key={
                        product.variantKey
                      }
                      ref={
                        index === 0
                          ? mobileFirstCardRef
                          : undefined
                      }
                      className="
                        w-[64vw]
                        max-w-[218px]

                        shrink-0

                        sm:w-[42vw]
                        sm:max-w-[235px]
                      "
                    >
                      <CommerceProductCard
                        product={
                          product
                        }
                        compact
                      />
                    </div>
                  ),
                )}
              </div>
            </div>

            {/* MOBILE ARROWS */}

            {products.length >
            1 ? (
              <>
                <button
                  type="button"
                  aria-label="Previous Always In It product"
                  onClick={
                    mobilePrevious
                  }
                  disabled={
                    mobileIndex === 0
                  }
                  className="
                    absolute

                    left-1.5
                    top-[365px]

                    z-50

                    grid
                    h-8
                    w-8

                    place-items-center

                    rounded-full

                    border
                    border-black/10

                    bg-white/90

                    text-[18px]
                    text-[#211A18]

                    shadow-[0_4px_14px_rgba(0,0,0,0.16)]

                    disabled:opacity-35

                    sm:left-3
                    sm:top-[400px]
                  "
                >
                  ‹
                </button>

                <button
                  type="button"
                  aria-label="Next Always In It product"
                  onClick={
                    mobileNext
                  }
                  disabled={
                    mobileIndex ===
                    products.length -
                      1
                  }
                  className="
                    absolute

                    right-1.5
                    top-[365px]

                    z-50

                    grid
                    h-8
                    w-8

                    place-items-center

                    rounded-full

                    bg-[#292725]

                    text-[18px]
                    text-white

                    shadow-[0_4px_14px_rgba(0,0,0,0.18)]

                    disabled:opacity-35

                    sm:right-3
                    sm:top-[400px]
                  "
                >
                  ›
                </button>
              </>
            ) : null}

            {/* MOBILE DOTS */}

            {products.length >
            1 ? (
              <div
                className="
                  absolute

                  bottom-3
                  left-1/2

                  z-50

                  flex
                  -translate-x-1/2

                  items-center
                  gap-1.5

                  sm:bottom-4
                "
              >
                {products.map(
                  (
                    _,
                    index,
                  ) => (
                    <button
                      key={index}
                      type="button"
                      aria-label={`Go to product ${
                        index + 1
                      }`}
                      onClick={() =>
                        setMobileIndex(
                          index,
                        )
                      }
                      className={`
                        rounded-full

                        transition-all
                        duration-300

                        ${
                          mobileIndex ===
                          index
                            ? `
                              h-2.5
                              w-2.5

                              bg-white

                              ring-1
                              ring-white
                            `
                            : `
                              h-1.5
                              w-1.5

                              bg-white/60
                            `
                        }
                      `}
                    />
                  ),
                )}
              </div>
            ) : null}
          </>
        ) : (
          <div
            className="
              absolute

              left-4
              right-4
              top-1/2

              -translate-y-1/2

              rounded-[16px]

              bg-white/90

              px-5
              py-8

              text-center
              text-[12px]

              text-[#211A18]

              shadow-lg
            "
          >
            No products added
            for{" "}
            <b>{gender}</b>
          </div>
        )}
      </div>

      {/* ===================================================
          DESKTOP
      =================================================== */}

      <div
        className="
          relative

          z-20

          hidden

          h-full
          w-full

          overflow-hidden

          lg:block
        "
      >
        {products.length >
        0 ? (
          <div
            className="
              absolute
              inset-0

              flex

              items-center

              overflow-hidden

              pb-10

              pt-[82px]
            "
          >
            {/* =============================================
                PRODUCT TRACK

                Important:
                top padding increased so toggle ke saath
                overlap nahi hoga.
            ============================================= */}

            <div
              className="
                flex
                w-max

                shrink-0

                gap-[14px]

                pl-[46vw]
                pr-8

                transition-transform
                duration-[950ms]

                ease-[cubic-bezier(0.22,1,0.36,1)]

                will-change-transform
              "
              style={{
                transform: `translate3d(-${
                  slideIndex *
                  cardStep
                }px, 0, 0)`,
              }}
            >
              {products.map(
                (
                  product,
                  index,
                ) => (
                  <div
                    key={
                      product.variantKey
                    }
                    ref={
                      index === 0
                        ? firstCardRef
                        : undefined
                    }
                    className="
                      w-[210px]

                      shrink-0

                      xl:w-[220px]

                      2xl:w-[230px]
                    "
                  >
                    <CommerceProductCard
                      product={
                        product
                      }
                      compact
                    />
                  </div>
                ),
              )}
            </div>
          </div>
        ) : (
          <div
            className="
              absolute

              left-1/2
              top-1/2

              -translate-x-1/2
              -translate-y-1/2

              rounded-[18px]

              bg-white/85

              px-8
              py-10

              text-center
              text-[12px]
            "
          >
            No products added
            for{" "}
            <b>{gender}</b>
          </div>
        )}

        {/* DESKTOP DOTS */}

        {products.length >
        1 ? (
          <div
            className="
              absolute

              bottom-4
              left-[72%]

              z-50

              flex

              -translate-x-1/2

              items-center
              gap-1.5
            "
          >
            {products.map(
              (
                _,
                index,
              ) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Always In It product ${
                    index + 1
                  }`}
                  onClick={() =>
                    setSlideIndex(
                      index,
                    )
                  }
                  className={`
                    rounded-full

                    transition-all
                    duration-300

                    ${
                      slideIndex ===
                      index
                        ? `
                          h-2.5
                          w-2.5

                          bg-white

                          ring-1
                          ring-white
                        `
                        : `
                          h-1.5
                          w-1.5

                          bg-white/60
                        `
                    }
                  `}
                />
              ),
            )}
          </div>
        ) : null}

        {/* DESKTOP ARROWS */}

        {products.length >
        1 ? (
          <div
            className="
              absolute

              bottom-4
              right-5

              z-50

              flex
              gap-2
            "
          >
            <button
              type="button"
              aria-label="Previous product"
              onClick={
                previous
              }
              disabled={
                slideIndex === 0
              }
              className="
                grid

                h-9
                w-9

                place-items-center

                rounded-full

                border
                border-black/10

                bg-white

                text-[19px]
                text-[#211A18]

                shadow-md

                transition

                hover:scale-105

                disabled:opacity-40
              "
            >
              ‹
            </button>

            <button
              type="button"
              aria-label="Next product"
              onClick={next}
              disabled={
                slideIndex ===
                products.length -
                  1
              }
              className="
                grid

                h-9
                w-9

                place-items-center

                rounded-full

                bg-[#292725]

                text-[19px]
                text-white

                shadow-md

                transition

                hover:scale-105

                disabled:opacity-40
              "
            >
              ›
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/* =========================================================
   NEW ARRIVALS
========================================================= */

function NewArrivalsSection({
  products,
}: {
  products: ApiProduct[];
}) {
  const {
    openAddToBag,
    toggleWishlist,
    isWishlisted,
    isWishlistBusy,
  } = useStorefrontCommerce();

  const [gender, setGender] =
    useState<"men" | "women">(
      "men",
    );

  const [
    activeIndex,
    setActiveIndex,
  ] = useState(0);

  const [
    displayImage,
    setDisplayImage,
  ] = useState("");

  /* =========================================================
     PRODUCTS
  ========================================================= */

  const cards =
    useMemo(
      () =>
        strictGenderCards(
          products,
          gender,
          5,
        ),
      [
        products,
        gender,
      ],
    );

  const selected =
    cards[activeIndex] ||
    cards[0] ||
    null;

  /* =========================================================
     RESET ON GENDER CHANGE
  ========================================================= */

  useEffect(() => {
    setActiveIndex(0);
  }, [gender]);

  /* =========================================================
     INDEX SAFETY
  ========================================================= */

  useEffect(() => {
    if (
      cards.length > 0 &&
      activeIndex >=
        cards.length
    ) {
      setActiveIndex(0);
    }
  }, [
    activeIndex,
    cards.length,
  ]);

  /* =========================================================
     RAW PRODUCT
  ========================================================= */

  const selectedRawProduct =
    useMemo(() => {
      if (!selected) {
        return null;
      }

      return (
        products.find(
          (product) =>
            readId(product) ===
            selected.productId,
        ) || null
      );
    }, [
      products,
      selected?.productId,
    ]);

  /* =========================================================
     PRODUCT IMAGES
  ========================================================= */

  const selectedImages =
    useMemo(() => {
      if (!selected) {
        return [];
      }

      const rawColor =
        asArray<ApiColor>(
          selectedRawProduct
            ?.colors,
        ).find(
          (color) =>
            readId(color) ===
            selected.colorId,
        );

      const colorImages =
        asArray<ApiImage>(
          rawColor?.images,
        )
          .sort(
            (
              first,
              second,
            ) =>
              Number(
                Boolean(
                  second.isDefault,
                ),
              ) -
              Number(
                Boolean(
                  first.isDefault,
                ),
              ),
          )
          .map(
            (image) =>
              firstString(
                image.url,
              ),
          )
          .filter(Boolean);

      const mainImages =
        asArray<ApiImage>(
          selectedRawProduct
            ?.mainImages,
        )
          .sort(
            (
              first,
              second,
            ) =>
              Number(
                Boolean(
                  second.isDefault,
                ),
              ) -
              Number(
                Boolean(
                  first.isDefault,
                ),
              ),
          )
          .map(
            (image) =>
              firstString(
                image.url,
              ),
          )
          .filter(Boolean);

      return Array.from(
        new Set(
          [
            ...colorImages,
            ...mainImages,
            selected.image1,
            selected.image2,
          ].filter(Boolean),
        ),
      ).slice(
        0,
        4,
      );
    }, [
      selectedRawProduct,
      selected?.colorId,
      selected?.image1,
      selected?.image2,
    ]);

  /* =========================================================
     DEFAULT MAIN IMAGE
  ========================================================= */

  const primaryImage =
    selectedImages[0] ||
    selected?.image1 ||
    "";

  useEffect(() => {
    setDisplayImage(
      primaryImage,
    );
  }, [
    selected?.variantKey,
    primaryImage,
  ]);

  /* =========================================================
     EMPTY
  ========================================================= */

  if (
    !products.length ||
    !selected
  ) {
    return null;
  }

  const liked =
    isWishlisted(
      selected,
    );

  const busy =
    isWishlistBusy(
      selected,
    );

  /* =========================================================
     PREVIOUS / NEXT
  ========================================================= */

  function previousProduct() {
    if (
      cards.length <= 1
    ) {
      return;
    }

    setActiveIndex(
      (current) =>
        current === 0
          ? cards.length -
            1
          : current - 1,
    );
  }

  function nextProduct() {
    if (
      cards.length <= 1
    ) {
      return;
    }

    setActiveIndex(
      (current) =>
        (
          current + 1
        ) % cards.length,
    );
  }

  /* =========================================================
     DESKTOP THUMBNAIL WINDOW

     Maximum 4 product thumbnails visible.
  ========================================================= */

  const desktopThumbStart =
    useMemo(() => {
      if (
        cards.length <= 4
      ) {
        return 0;
      }

      if (
        activeIndex <= 3
      ) {
        return 0;
      }

      return Math.min(
        activeIndex - 3,
        cards.length - 4,
      );
    }, [
      activeIndex,
      cards.length,
    ]);

  const desktopVisibleCards =
    cards.slice(
      desktopThumbStart,
      desktopThumbStart +
        4,
    );

  return (
    <section
      className="
        w-full
        overflow-hidden

        bg-[#F3F3F3]

        px-3
        py-6

        sm:px-5
        sm:py-8

        lg:h-[100svh]
        lg:min-h-[650px]
        lg:max-h-[780px]

        lg:px-6
        lg:py-5

        xl:px-8
      "
    >
      <div
        className="
          mx-auto

          flex
          h-full
          w-full
          max-w-[1500px]

          flex-col
        "
      >
        {/* ===================================================
            HEADER
        =================================================== */}

        <div
          className="
            mb-5
            shrink-0

            text-center

            lg:flex
            lg:items-start
            lg:justify-between
            lg:text-left
          "
        >
          <div>
            <p
              className="
                mb-1.5

                text-[7px]
                uppercase

                tracking-[0.35em]

                text-[#8B7468]

                sm:text-[8px]
              "
            >
              Just Dropped
            </p>

            <h2
              className="
                text-[38px]
                font-black
                uppercase
                leading-none

                sm:text-[48px]

                lg:text-[58px]

                xl:text-[64px]
              "
            >
              New{" "}

              <span
                className="
                  font-light
                  text-[#595757]
                "
              >
                Arrivals
              </span>
            </h2>
          </div>

          {/* MEN / WOMEN */}

          <div
            className="
              mt-4

              flex
              justify-center

              lg:mt-4
              lg:justify-end
            "
          >
            <GenderToggle
              value={gender}
              onChange={
                setGender
              }
            />
          </div>
        </div>

        {/* ===================================================
            MOBILE
        =================================================== */}

        <div
          className="
            lg:hidden
          "
        >
          <div
            className="
              grid

              grid-cols-[60px_minmax(0,1fr)]

              items-center

              gap-2

              sm:grid-cols-[78px_minmax(0,1fr)]
              sm:gap-3
            "
          >
            {/* OTHER IMAGES */}

            <div
              className="
                flex

                h-[350px]

                flex-col
                justify-center

                sm:h-[410px]
              "
            >
              <h3
                className="
                  mb-2

                  text-[9px]
                  font-medium
                  leading-tight

                  sm:text-[11px]
                "
              >
                Other
                <br />
                Images
              </h3>

              <div
                className="
                  flex
                  flex-col

                  gap-1.5
                "
              >
                {selectedImages.map(
                  (
                    image,
                    index,
                  ) => (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() =>
                        setDisplayImage(
                          image,
                        )
                      }
                      className={`
                        aspect-[3/4]

                        w-full

                        overflow-hidden

                        rounded-[7px]

                        border-2

                        bg-white

                        ${
                          displayImage ===
                          image
                            ? `
                              border-[#292725]
                            `
                            : `
                              border-transparent
                            `
                        }
                      `}
                    >
                      <img
                        src={
                          image
                        }
                        alt=""
                        className="
                          h-full
                          w-full

                          object-contain
                          object-center
                        "
                      />
                    </button>
                  ),
                )}
              </div>
            </div>

            {/* =================================================
                MOBILE MAIN IMAGE

                IMPORTANT:
                object-contain = image kabhi crop nahi hogi
            ================================================= */}

            <Link
              href={`/product/${selected.slug}`}
              className="
                relative

                flex

                h-[350px]
                min-w-0

                items-center
                justify-center

                overflow-hidden

                bg-white

                sm:h-[410px]
              "
            >
              {displayImage ? (
                <img
                  key={
                    displayImage
                  }
                  src={
                    displayImage
                  }
                  alt={
                    selected.name
                  }
                  className="
                    h-full
                    w-full

                    object-contain
                    object-center
                  "
                />
              ) : null}
            </Link>
          </div>

          {/* =================================================
              MOBILE PRODUCTS
          ================================================= */}

          <div
            className="
              -mx-3
              mt-2

              flex

              snap-x
              snap-mandatory

              gap-2

              overflow-x-auto

              px-3
              pb-2

              [scrollbar-width:none]

              [&::-webkit-scrollbar]:hidden
            "
          >
            {cards.map(
              (
                product,
                index,
              ) => (
                <button
                  key={
                    product.variantKey
                  }
                  type="button"
                  onClick={() =>
                    setActiveIndex(
                      index,
                    )
                  }
                  className={`
                    aspect-square

                    w-[26vw]
                    max-w-[95px]

                    shrink-0
                    snap-center

                    overflow-hidden

                    rounded-[9px]

                    border

                    bg-white

                    ${
                      activeIndex ===
                      index
                        ? `
                          border-[#292725]
                        `
                        : `
                          border-black/10
                        `
                    }
                  `}
                >
                  <img
                    src={
                      product.image1
                    }
                    alt={
                      product.name
                    }
                    className="
                      h-full
                      w-full

                      object-contain
                      object-center
                    "
                  />
                </button>
              ),
            )}
          </div>

          {/* =================================================
              MOBILE DETAIL
          ================================================= */}

          <div
            className="
              mt-2

              overflow-hidden

              rounded-[12px]

              bg-white

              shadow-sm
            "
          >
            <div
              className="
                bg-[#292725]

                px-3
                py-3

                text-white
              "
            >
              <h3
                className="
                  line-clamp-2

                  text-[12px]
                  font-semibold
                "
              >
                {selected.name}
              </h3>
            </div>

            <div
              className="
                flex

                items-center
                justify-between

                gap-2

                p-3
              "
            >
              <strong>
                {money(
                  selected.showPrice,
                )}
              </strong>

              <div
                className="
                  flex
                  gap-1.5
                "
              >
                <button
                  type="button"
                  disabled={
                    busy
                  }
                  onClick={() => {
                    void toggleWishlist(
                      selected,
                    );
                  }}
                  className="
                    grid

                    h-9
                    w-9

                    place-items-center

                    rounded-[6px]

                    bg-[#292725]

                    text-white
                  "
                >
                  {liked
                    ? "♥"
                    : "♡"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    void openAddToBag(
                      selected,
                    );
                  }}
                  className="
                    h-9

                    rounded-[6px]

                    bg-[#EC477C]

                    px-3

                    text-[8px]
                    font-bold
                    uppercase

                    text-white
                  "
                >
                  Add to Bag
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================
            DESKTOP
        =================================================== */}

        <div
          className="
            hidden

            min-h-0
            flex-1

            items-center

            gap-5

            lg:grid

            lg:grid-cols-[195px_minmax(430px,520px)_minmax(0,1fr)]

            xl:grid-cols-[210px_minmax(470px,570px)_minmax(0,1fr)]

            xl:gap-6
          "
        >
          {/* =================================================
              OTHER IMAGES
          ================================================= */}

          <div
            className="
              flex

              h-full
              min-h-0

              flex-col
              justify-center
            "
          >
            <div
              className="
                w-full
              "
            >
              <h3
                className="
                  mb-4

                  text-[14px]
                  font-medium
                "
              >
                Other Images
              </h3>

              <div
                className="
                  grid
                  grid-cols-2

                  gap-3
                "
              >
                {selectedImages
                  .slice(0, 2)
                  .map(
                    (
                      image,
                      index,
                    ) => (
                      <button
                        key={`${image}-${index}`}
                        type="button"
                        onClick={() =>
                          setDisplayImage(
                            image,
                          )
                        }
                        className={`
                          aspect-[3/4]

                          overflow-hidden

                          rounded-[11px]

                          border-2

                          bg-white

                          ${
                            displayImage ===
                            image
                              ? `
                                border-[#292725]
                              `
                              : `
                                border-transparent
                              `
                          }
                        `}
                      >
                        <img
                          src={
                            image
                          }
                          alt=""
                          className="
                            h-full
                            w-full

                            object-contain
                            object-center
                          "
                        />
                      </button>
                    ),
                  )}
              </div>
            </div>
          </div>

          {/* =================================================
              LARGE MAIN IMAGE

              MAIN FIX:
              object-contain
              object-center

              Poora product visible hoga.
              Image crop nahi hogi.
          ================================================= */}

          <Link
            href={`/product/${selected.slug}`}
            className="
              relative

              flex

              h-[min(68vh,570px)]

              min-h-[430px]
              min-w-0

              items-center
              justify-center

              overflow-hidden

              bg-white
            "
          >
            {displayImage ? (
              <img
                key={
                  displayImage
                }
                src={
                  displayImage
                }
                alt={
                  selected.name
                }
                className="
                  h-full
                  w-full

                  object-contain
                  object-center
                "
              />
            ) : (
              <div
                className="
                  flex

                  h-full
                  w-full

                  items-center
                  justify-center

                  text-[11px]
                  text-black/40
                "
              >
                Loading image...
              </div>
            )}
          </Link>

          {/* =================================================
              RIGHT SIDE
          ================================================= */}

          <div
            className="
              flex

              min-h-0
              min-w-0

              flex-col
              justify-center
            "
          >
            {/* =================================================
                4 PRODUCT THUMBNAILS
            ================================================= */}

            <div
              className="
                grid

                grid-cols-4

                gap-3
              "
            >
              {desktopVisibleCards.map(
                (
                  product,
                  visibleIndex,
                ) => {
                  const realIndex =
                    desktopThumbStart +
                    visibleIndex;

                  return (
                    <button
                      key={
                        product.variantKey
                      }
                      type="button"
                      onClick={() =>
                        setActiveIndex(
                          realIndex,
                        )
                      }
                      className={`
                        aspect-square

                        min-w-0

                        overflow-hidden

                        rounded-[13px]

                        border

                        bg-white

                        ${
                          activeIndex ===
                          realIndex
                            ? `
                              border-[#292725]
                            `
                            : `
                              border-black/10
                            `
                        }
                      `}
                    >
                      <img
                        src={
                          product.image1
                        }
                        alt={
                          product.name
                        }
                        className="
                          h-full
                          w-full

                          object-contain
                          object-center
                        "
                      />
                    </button>
                  );
                },
              )}
            </div>

            {/* =================================================
                ARROWS
            ================================================= */}

            {cards.length >
            1 ? (
              <div
                className="
                  mt-3

                  flex
                  justify-end

                  gap-2
                "
              >
                <button
                  type="button"
                  aria-label="Previous product"
                  onClick={
                    previousProduct
                  }
                  className="
                    grid

                    h-9
                    w-9

                    place-items-center

                    rounded-[5px]

                    bg-[#292725]

                    text-white

                    transition

                    hover:scale-105
                  "
                >
                  ‹
                </button>

                <button
                  type="button"
                  aria-label="Next product"
                  onClick={
                    nextProduct
                  }
                  className="
                    grid

                    h-9
                    w-9

                    place-items-center

                    rounded-[5px]

                    bg-[#292725]

                    text-white

                    transition

                    hover:scale-105
                  "
                >
                  ›
                </button>
              </div>
            ) : null}

            {/* =================================================
                DETAIL CARD
            ================================================= */}

            <div
              className="
                mt-3

                overflow-hidden

                rounded-t-[17px]

                bg-white

                shadow-sm
              "
            >
              {/* DARK AREA */}

              <div
                className="
                  bg-[#292725]

                  px-6
                  py-4

                  text-white
                "
              >
                {selected.isNewLaunch ? (
                  <span
                    className="
                      inline-flex

                      rounded-full

                      bg-white/15

                      px-4
                      py-2

                      text-[10px]
                      font-semibold
                    "
                  >
                    New
                  </span>
                ) : null}

                <h3
                  className="
                    mt-3

                    line-clamp-2

                    text-[19px]
                    font-bold

                    xl:text-[21px]
                  "
                >
                  {selected.name}
                </h3>

                <p
                  className="
                    mt-1

                    text-[10px]
                    text-white/90

                    xl:text-[11px]
                  "
                >
                  Color:{" "}
                  {
                    selected.colorName
                  }
                </p>
              </div>

              {/* PRICE + ACTIONS */}

              <div
                className="
                  flex

                  items-center
                  justify-between

                  gap-3

                  px-6
                  py-4
                "
              >
                <div
                  className="
                    flex
                    items-center

                    gap-3
                  "
                >
                  <strong
                    className="
                      text-[22px]
                      font-bold
                    "
                  >
                    {money(
                      selected.showPrice,
                    )}
                  </strong>

                  {selected.originalPrice >
                  selected.showPrice ? (
                    <span
                      className="
                        text-[11px]

                        text-black/35

                        line-through
                      "
                    >
                      {money(
                        selected.originalPrice,
                      )}
                    </span>
                  ) : null}

                  {selected.discountPercent >
                  0 ? (
                    <span
                      className="
                        rounded-full

                        bg-[#FBE5ED]

                        px-3
                        py-1.5

                        text-[9px]
                        font-bold

                        text-[#D82462]
                      "
                    >
                      {
                        selected.discountPercent
                      }
                      % OFF
                    </span>
                  ) : null}
                </div>

                <div
                  className="
                    flex
                    gap-2
                  "
                >
                  <Link
                    href={`/product/${selected.slug}`}
                    className="
                      flex

                      h-9

                      items-center

                      rounded-[5px]

                      border

                      px-3

                      text-[8px]
                      font-bold
                      uppercase
                    "
                  >
                    Explore
                  </Link>

                  <button
                    type="button"
                    disabled={
                      busy
                    }
                    onClick={() => {
                      void toggleWishlist(
                        selected,
                      );
                    }}
                    className="
                      grid

                      h-9
                      w-9

                      place-items-center

                      rounded-[5px]

                      bg-[#292725]

                      text-white
                    "
                  >
                    {liked
                      ? "♥"
                      : "♡"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      void openAddToBag(
                        selected,
                      );
                    }}
                    className="
                      h-9

                      rounded-[5px]

                      bg-[#EC477C]

                      px-3

                      text-[8px]
                      font-bold
                      uppercase

                      text-white
                    "
                  >
                    Add to Bag
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   WOMEN / MEN LATEST PRODUCTS
========================================================= */

function LatestProductsSection({
  gender,
  products,
}: {
  gender:
    | "men"
    | "women";

  products: ApiProduct[];
}) {
  const cards =
    strictGenderCards(
      products,
      gender,
      8,
    );

  const women =
    gender ===
    "women";

  if (
    !products.length
  ) {
    return null;
  }

  return (
    <section
      className={`
        px-3
        py-6

        sm:px-5

        lg:px-6
        lg:py-8

        ${
          women
            ? `
              bg-[#F8F3EF]
            `
            : `
              bg-[#EEE3DB]
            `
        }
      `}
    >
      <div
        className="
          mx-auto
          max-w-[1450px]
        "
      >
        <div
          className="
            mb-7
            flex
            items-end
            justify-between
            gap-4

            lg:mb-5
          "
        >
          <div>
            <p
              className="
                mb-2
                text-[7px]
                uppercase
                tracking-[0.35em]
                text-[#9A7463]

                sm:text-[8px]
              "
            >
              Latest Collection
            </p>

            <h2
              className="
                text-[25px]
                font-semibold
                leading-none
                tracking-[-0.035em]

                sm:text-[32px]

                lg:text-[48px]
              "
            >
              New innerwear for{" "}

              <span
                className="
                  font-serif
                  font-normal
                  italic
                  text-[#A41948]
                "
              >
                {women
                  ? "women."
                  : "men."}
              </span>
            </h2>
          </div>

          <Link
            href={
              women
                ? "/women"
                : "/men"
            }
            className="
              hidden
              shrink-0
              rounded-full
              border
              border-black/15
              px-5
              py-2.5
              text-[9px]
              font-bold
              uppercase
              tracking-[0.12em]

              sm:inline-flex
            "
          >
            View all
          </Link>
        </div>

        {cards.length ? (
          <div
            className="
              grid
              grid-cols-2
              gap-2.5

              sm:gap-4

              lg:grid-cols-4
            "
          >
            {cards.map(
              (
                product,
              ) => (
                <CommerceProductCard
                  key={
                    product.variantKey
                  }
                  product={
                    product
                  }
                />
              ),
            )}
          </div>
        ) : (
          <EmptyState
            text={`No ${gender} products found.`}
          />
        )}
      </div>
    </section>
  );
}

/* =========================================================
   COLOR HELPERS
========================================================= */

type ColorCard = {
  product: CatalogProduct;
  hex: string;
};

function hexRgb(
  hex: string,
) {
  const normalized =
    normalizeHex(
      hex,
    );

  if (!normalized) {
    return null;
  }

  return {
    r:
      parseInt(
        normalized.slice(
          1,
          3,
        ),
        16,
      ),

    g:
      parseInt(
        normalized.slice(
          3,
          5,
        ),
        16,
      ),

    b:
      parseInt(
        normalized.slice(
          5,
          7,
        ),
        16,
      ),
  };
}

function colorDistance(
  first: string,
  second: string,
) {
  const a =
    hexRgb(
      first,
    );

  const b =
    hexRgb(
      second,
    );

  if (
    !a ||
    !b
  ) {
    return Number.MAX_VALUE;
  }

  return Math.sqrt(
    (a.r - b.r) ** 2 +
      (a.g - b.g) ** 2 +
      (a.b - b.b) ** 2,
  );
}

/* =========================================================
   COLOR SECTION
========================================================= */

function ColorSection({
  products,
}: {
  products: ApiProduct[];
}) {
  const [
    gender,
    setGender,
  ] =
    useState<
      "men" | "women"
    >("men");

  const [
    colorIndex,
    setColorIndex,
  ] =
    useState(0);

  const [
    productStart,
    setProductStart,
  ] =
    useState(0);

  const variants =
    useMemo(() => {
      const result:
        ColorCard[] = [];

      products
        .filter(
          (product) =>
            belongsToGender(
              product,
              gender,
            ),
        )
        .forEach(
          (product) => {
            const cards =
              mapProductToColorCards(
                product,
              );

            const rawColors =
              asArray<ApiColor>(
                product.colors,
              );

            cards.forEach(
              (card) => {
                const rawColor =
                  rawColors.find(
                    (
                      color,
                    ) =>
                      readId(
                        color,
                      ) ===
                      card.colorId,
                  ) as
                    | (
                        ApiColor & {
                          hex?: string;
                        }
                      )
                    | undefined;

                const hex =
                  normalizeHex(
                    rawColor?.hex,
                  );

                if (hex) {
                  result.push({
                    product:
                      card,
                    hex,
                  });
                }
              },
            );
          },
        );

      return result;
    }, [
      products,
      gender,
    ]);

  const colors =
    useMemo(
      () =>
        Array.from(
          new Set(
            variants.map(
              (
                variant,
              ) =>
                variant.hex,
            ),
          ),
        ).slice(
          0,
          20,
        ),
      [
        variants,
      ],
    );

  useEffect(() => {
    setColorIndex(0);
    setProductStart(0);
  }, [
    gender,
  ]);

  useEffect(() => {
    if (
      colorIndex >=
      colors.length
    ) {
      setColorIndex(0);
    }

    setProductStart(0);
  }, [
    colorIndex,
    colors.length,
  ]);

  if (
    !colors.length
  ) {
    return null;
  }

  const selectedColor =
    colors[
      colorIndex
    ] ||
    colors[0];

  const sorted =
    [...variants].sort(
      (
        first,
        second,
      ) =>
        colorDistance(
          first.hex,
          selectedColor,
        ) -
        colorDistance(
          second.hex,
          selectedColor,
        ),
    );

  const visibleCount =
    Math.min(
      4,
      sorted.length,
    );

  const visible =
    Array.from(
      {
        length:
          visibleCount,
      },
      (
        _,
        index,
      ) =>
        sorted[
          (
            productStart +
            index
          ) %
          sorted.length
        ],
    );

  const gradient =
    colors.length ===
    1
      ? colors[0]
      : `linear-gradient(90deg, ${colors.join(
          ", ",
        )})`;

  function move(
    direction:
      | -1
      | 1,
  ) {
    if (
      sorted.length <=
      visibleCount
    ) {
      return;
    }

    setProductStart(
      (
        current,
      ) =>
        (
          current +
          direction +
          sorted.length
        ) %
        sorted.length,
    );
  }

  return (
    <section
      className="
        w-full
        overflow-hidden
        bg-[#202834]
        px-3
        py-10
        text-white

        sm:px-5

        lg:px-6
        lg:py-12
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-[1240px]
        "
      >
        <div
          className="
            mb-6
            flex
            items-start
            justify-between
            gap-3

            sm:items-center

            lg:mb-5
          "
        >
          <h2
            className="
              max-w-[62%]
              text-[22px]
              font-black
              uppercase
              leading-[0.95]
              tracking-[-0.025em]

              sm:max-w-none
              sm:text-[31px]

              lg:text-[36px]
            "
          >
            Slide into the
            colors of Hivra
          </h2>

          <GenderToggle
            value={
              gender
            }
            onChange={
              setGender
            }
            dark
            compact
          />
        </div>

        <div
          className="
            relative
          "
        >
          <div
            className="
              grid
              grid-cols-2
              gap-2.5

              sm:gap-4

              lg:grid-cols-4
            "
          >
            {visible.map(
              (
                item,
                index,
              ) => (
                <Link
                  key={`${item.product.variantKey}-${index}`}
                  href={`/product/${item.product.slug}`}
                  className="
                    group
                    min-w-0
                    text-center
                    text-white
                  "
                >
                  <div
                    className="
                      aspect-[6/7]
                      overflow-hidden
                      rounded-[11px]
                      border-[2px]
                      border-white
                      bg-[#EFEFEF]

                      sm:rounded-[13px]
                      sm:border-[3px]
                    "
                  >
                    {item.product
                      .image1 ? (
                      <img
                        src={
                          item
                            .product
                            .image1
                        }
                        alt={
                          item
                            .product
                            .name
                        }
                        className="
                          h-full
                          w-full
                          object-cover
                          transition-transform
                          duration-500

                          group-hover:scale-[1.025]
                        "
                      />
                    ) : null}
                  </div>

                  <p
                    className="
                      mx-auto
                      mt-2
                      line-clamp-1
                      max-w-[240px]
                      text-[8px]
                      font-semibold
                      leading-tight

                      sm:text-[10px]
                    "
                  >
                    {
                      item.product
                        .name
                    }
                  </p>

                  <p
                    className="
                      mt-1
                      text-[7px]
                      text-white/65

                      sm:text-[9px]
                    "
                  >
                    Color:{" "}

                    {
                      item.product
                        .colorName
                    }
                  </p>
                </Link>
              ),
            )}
          </div>

          {sorted.length >
          visibleCount ? (
            <>
              <button
                type="button"
                onClick={() =>
                  move(-1)
                }
                className="
                  absolute
                  left-1
                  top-[42%]
                  z-20
                  grid
                  h-8
                  w-8
                  -translate-y-1/2
                  place-items-center
                  rounded-full
                  border
                  border-white/35
                  bg-[#202834]/95
                  text-[18px]
                  text-white
                  shadow-lg

                  sm:left-0
                  sm:h-9
                  sm:w-9
                  sm:-translate-x-1/2
                  sm:text-[20px]
                "
              >
                ‹
              </button>

              <button
                type="button"
                onClick={() =>
                  move(1)
                }
                className="
                  absolute
                  right-1
                  top-[42%]
                  z-20
                  grid
                  h-8
                  w-8
                  -translate-y-1/2
                  place-items-center
                  rounded-full
                  border
                  border-white/35
                  bg-[#202834]/95
                  text-[18px]
                  text-white
                  shadow-lg

                  sm:right-0
                  sm:h-9
                  sm:w-9
                  sm:translate-x-1/2
                  sm:text-[20px]
                "
              >
                ›
              </button>
            </>
          ) : null}
        </div>

        {/* COLOR SLIDER */}

        <div
          className="
            mx-auto
            mt-7
            max-w-[650px]

            lg:mt-8
          "
        >
          <div
            className="
              relative
              h-[6px]
              rounded-full
            "
            style={{
              background:
                gradient,
            }}
          >
            <input
              type="range"
              min={0}
              max={
                Math.max(
                  0,
                  colors.length -
                    1,
                )
              }
              value={
                colorIndex
              }
              onChange={
                (
                  event,
                ) =>
                  setColorIndex(
                    Number(
                      event
                        .target
                        .value,
                    ),
                  )
              }
              className="
                absolute
                inset-x-0
                -top-2
                h-6
                w-full
                cursor-pointer
                opacity-0
              "
            />

            <span
              className="
                pointer-events-none
                absolute
                top-1/2
                h-5
                w-5
                -translate-x-1/2
                -translate-y-1/2
                rounded-full
                border-[4px]
                border-white
                shadow-lg
              "
              style={{
                left:
                  colors.length <=
                  1
                    ? "0%"
                    : `${
                        (
                          colorIndex /
                          (
                            colors.length -
                            1
                          )
                        ) *
                        100
                      }%`,

                background:
                  selectedColor,
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   FAVOURITES / FIND YOUR FIT
========================================================= */

function PromoGrid({
  items,
  type,
}: {
  items: BannerItem[];

  type:
    | "favourites"
    | "fit";
}) {
  if (
    !items.length
  ) {
    return null;
  }

  const fit =
    type === "fit";

  return (
    <section
      className={`
        px-3
        py-12

        sm:px-5

        lg:px-6
        lg:py-20

        ${
          fit
            ? `
              bg-[#1D1311]
              text-white
            `
            : `
              bg-[#F8F3EF]
              text-[#211A18]
            `
        }
      `}
    >
      <div
        className="
          mx-auto
          max-w-[1450px]
        "
      >
        <p
          className={`
            mb-2
            text-[7px]
            uppercase
            tracking-[0.35em]

            sm:text-[8px]

            ${
              fit
                ? `
                  text-white/45
                `
                : `
                  text-[#9A7463]
                `
            }
          `}
        >
          {fit
            ? "Discover"
            : "Curated for you"}
        </p>

        <h2
          className="
            mb-5
            text-[27px]
            font-semibold
            leading-none

            sm:text-[34px]

            lg:mb-9
            lg:text-[48px]
          "
        >
          {fit
            ? "Find your "
            : "Your favourites for a "}

          <span
            className="
              font-serif
              font-normal
              italic
              text-[#A41948]
            "
          >
            {fit
              ? "fit."
              : "limited time!"}
          </span>
        </h2>

        <div
          className={`
            grid
            gap-3

            sm:gap-4

            ${
              fit
                ? `
                  grid-cols-2

                  lg:grid-cols-4
                `
                : `
                  grid-cols-1

                  md:grid-cols-2
                `
            }
          `}
        >
          {items
            .slice(
              0,
              fit
                ? 4
                : 2,
            )
            .map(
              (
                item,
                index,
              ) => (
                <SmartLink
                  key={`${item.publicId || item.url}-${index}`}
                  href={
                    bannerHref(
                      item,
                    )
                  }
                  newTab={
                    item.openInNewTab
                  }
                  className={`
                    group
                    relative
                    overflow-hidden
                    bg-[#E8DED7]

                    ${
                      fit
                        ? `
                          aspect-[3/4]
                          rounded-[14px]

                          sm:rounded-[16px]
                        `
                        : `
                          aspect-[1.25/1]
                          rounded-[16px]

                          md:aspect-[1.35/1]
                          md:rounded-[18px]
                        `
                    }
                  `}
                >
                  {item.url ? (
                    <img
                      src={
                        item.url
                      }
                      alt={
                        item.alt ||
                        item.title ||
                        "Hivra Soft"
                      }
                      className="
                        h-full
                        w-full
                        object-cover
                        transition-transform
                        duration-700

                        group-hover:scale-105
                      "
                    />
                  ) : null}

                  <div
                    className="
                      absolute
                      inset-0
                      bg-gradient-to-t
                      from-black/75
                      via-transparent
                      to-transparent
                    "
                  />

                  <div
                    className="
                      absolute
                      inset-x-0
                      bottom-0
                      p-3
                      text-white

                      sm:p-6
                    "
                  >
                    <h3
                      className={`
                        font-serif
                        leading-tight

                        ${
                          fit
                            ? `
                              text-[18px]

                              sm:text-[26px]
                            `
                            : `
                              text-[24px]

                              sm:text-[34px]
                            `
                        }
                      `}
                    >
                      {item.title ||
                        (
                          fit
                            ? `Collection ${
                                index +
                                1
                              }`
                            : `Hivra Favourite ${
                                index +
                                1
                              }`
                        )}
                    </h3>

                    <span
                      className="
                        mt-2
                        inline-flex
                        text-[7px]
                        font-bold
                        uppercase
                        tracking-[0.15em]

                        sm:mt-3
                        sm:text-[8px]
                      "
                    >
                      {item.buttonText ||
                        "Shop now"}{" "}

                      →
                    </span>
                  </div>
                </SmartLink>
              ),
            )}
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   BOTTOM BANNER
========================================================= */

function BottomBanner({
  item,
}: {
  item?: BannerItem;
}) {
  if (!item) {
    return null;
  }

  return (
    <SmartLink
      href={
        bannerHref(
          item,
        )
      }
      newTab={
        item.openInNewTab
      }
      className="
        relative
        block
        w-full
        overflow-hidden
        bg-[#EADFD7]
        aspect-[1537/536]

        lg:aspect-[1537/536]
      "
    >
      {item.url ? (
        <img
          src={
            item.url
          }
          alt={
            item.alt ||
            "Hivra Soft"
          }
          className="
            h-full
            w-full
            object-fill
          "
        />
      ) : null}
    </SmartLink>
  );
}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div
      className="
        rounded-[16px]
        border
        border-dashed
        border-black/15
        bg-white/50
        px-5
        py-10
        text-center
        text-[11px]
        text-black/50
      "
    >
      {text}
    </div>
  );
}

/* =========================================================
   LOADING
========================================================= */

function LoadingHome() {
  return (
    <main
      className="
        min-h-screen
        bg-[#F8F3EF]
      "
    >
      <div
        className="
          w-full
          animate-pulse
          bg-[#E5DBD4]
          aspect-[1537/536]

          lg:aspect-[1537/536]
        "
      />
    </main>
  );
}

/* =========================================================
   HOME PAGE
========================================================= */

export default function HomePage() {
  const [
    banners,
    setBanners,
  ] =
    useState<BannerGroup[]>(
      [],
    );

  const [
    trendItems,
    setTrendItems,
  ] =
    useState<OnTrendItem[]>(
      [],
    );

  const [
    alwaysItems,
    setAlwaysItems,
  ] =
    useState<AlwaysInItItem[]>(
      [],
    );

  const [
    newLaunchProducts,
    setNewLaunchProducts,
  ] =
    useState<ApiProduct[]>(
      [],
    );

  const [
    activeProducts,
    setActiveProducts,
  ] =
    useState<ApiProduct[]>(
      [],
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    mobile,
    setMobile,
  ] =
    useState(false);

  /* =======================================================
     DEVICE
  ======================================================= */

  useEffect(() => {
    const media =
      window.matchMedia(
        "(max-width: 767px)",
      );

    const update =
      () => {
        setMobile(
          media.matches,
        );
      };

    update();

    media.addEventListener(
      "change",
      update,
    );

    return () =>
      media.removeEventListener(
        "change",
        update,
      );
  }, []);

  /* =======================================================
     LOAD ALL HOME APIs
  ======================================================= */

  useEffect(() => {
    let mounted =
      true;

    async function loadHome() {
      setLoading(true);

      const [
        bannerResponse,
        trendResponse,
        alwaysResponse,
        newLaunchResponse,
        activeResponse,
      ] =
        await Promise.all([
          safeJson(
            "/api/banners/active",
          ),

          safeJson(
            "/api/on-trend-picks",
          ),

          safeJson(
            "/api/always-in-it",
          ),

          safeJson(
            "/api/products/new-launches",
          ),

          safeJson(
            "/api/products/active",
          ),
        ]);

      if (!mounted) {
        return;
      }

      setBanners(
        asArray<BannerGroup>(
          bannerResponse
            ?.data,
        ),
      );

      setTrendItems(
        asArray<OnTrendItem>(
          trendResponse
            ?.items,
        ),
      );

      setAlwaysItems(
        asArray<AlwaysInItItem>(
          alwaysResponse
            ?.items,
        ),
      );

      setNewLaunchProducts(
        asArray<ApiProduct>(
          newLaunchResponse
            ?.products,
        ),
      );

      setActiveProducts(
        asArray<ApiProduct>(
          activeResponse
            ?.products,
        ),
      );

      setLoading(false);
    }

    void loadHome();

    return () => {
      mounted = false;
    };
  }, []);

  /* =======================================================
     BANNER DATA
  ======================================================= */

  const eligible =
    useMemo(
      () =>
        usableBanners(
          banners,
          mobile,
        ),
      [
        banners,
        mobile,
      ],
    );

  const heroItems =
    useMemo(
      () =>
        bannerImages(
          eligible.filter(
            (banner) =>
              banner.position ===
              "home_hero",
          ),
        ),
      [
        eligible,
      ],
    );

  const favourites =
    useMemo(
      () =>
        purposeBannerImages(
          eligible,
          [
            "favourite",
            "favorite",
            "limited",
          ],
          "home_top",
        ),
      [
        eligible,
      ],
    );

  const findYourFit =
    useMemo(
      () =>
        purposeBannerImages(
          eligible,
          [
            "find your fit",
            "find-your-fit",
            "find-fit",
          ],
          "home_middle",
        ),
      [
        eligible,
      ],
    );

  const bottom =
    useMemo(
      () =>
        bannerImages(
          eligible.filter(
            (banner) =>
              banner.position ===
              "home_bottom",
          ),
        ),
      [
        eligible,
      ],
    );

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <>
      <Header />

      {loading ? (
        <LoadingHome />
      ) : (
        <main
          className="
            min-h-screen
            overflow-x-hidden
            bg-[#F8F3EF]
            text-[#211A18]
          "
        >
          {/* HOME BANNER */}

          <HeroBanner
            items={
              heroItems
            }
          />

          {/* ON TREND PICKS */}

          <OnTrendPicks
            items={
              trendItems
            }
          />

          {/* ALWAYS IN IT */}

          <AlwaysInItSection
            records={
              alwaysItems
            }
          />

          {/* NEW ARRIVALS */}

          <NewArrivalsSection
            products={
              newLaunchProducts
            }
          />

          {/* WOMEN 8 LATEST */}

          <LatestProductsSection
            gender="women"
            products={
              activeProducts
            }
          />

          {/* MEN 8 LATEST */}

          <LatestProductsSection
            gender="men"
            products={
              activeProducts
            }
          />

          {/* COLORS */}

          <ColorSection
            products={
              activeProducts
            }
          />

          {/* FAVOURITES */}

          <PromoGrid
            items={
              favourites
            }
            type="favourites"
          />

          {/* FIND YOUR FIT */}

          <PromoGrid
            items={
              findYourFit
            }
            type="fit"
          />

          {/* BOTTOM BANNER */}

          <BottomBanner
            item={
              bottom[0]
            }
          />
        </main>
      )}
    </>
  );
}