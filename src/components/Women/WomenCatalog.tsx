"use client";

<<<<<<< HEAD
import Link from "next/link";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import {
  womenMenu,
  getWomenMenuItem,
  type WomenBanner,
  type WomenProduct,
} from "@/src/data/women";

/* =========================================================
   TYPES
========================================================= */

type WomenCatalogProps = {
  products: WomenProduct[];
  banners: WomenBanner[];

  title: string;
  description: string;

  category?: string;
  subcategory?: string;
};

/* =========================================================
   BANNER SLIDER
========================================================= */

function WomenBannerSlider({
  banners,
}: {
  banners: WomenBanner[];
}) {
  const [active, setActive] =
    useState(0);

  const validBanners =
    useMemo(() => {
      return banners.filter(
        (banner) =>
          Boolean(
            banner.image
          )
      );
    }, [banners]);

  /* =======================================================
     RESET + AUTO SLIDE
  ======================================================= */

  useEffect(() => {
    setActive(0);

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
            (current) =>
              (current + 1) %
              validBanners.length
          );
        },
        4000
      );

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, [
    validBanners.length,
  ]);

  if (
    validBanners.length ===
    0
  ) {
    return null;
  }

  const previous = () => {
    setActive(
      (current) =>
        current === 0
          ? validBanners.length -
            1
          : current - 1
    );
  };

  const next = () => {
    setActive(
      (current) =>
        (current + 1) %
        validBanners.length
    );
  };

  return (
    <section
      className="
        relative
        w-full
        overflow-hidden
        bg-[#EFE6DC]
      "
      style={{
        aspectRatio:
          "1600 / 558",
      }}
    >
      {/* ===================================================
          BANNERS
      =================================================== */}

      {validBanners.map(
        (
          banner,
          index
        ) => (
          <Link
            key={`${banner.image}-${index}`}
            href={
              banner.redirect ||
              "#"
            }
            aria-label={
              banner.alt ||
              "Hivra Soft Women Banner"
            }
            className={`
              absolute
              inset-0
              block
              h-full
              w-full
              transition-all
              duration-1000
              ease-[cubic-bezier(.22,1,.36,1)]

              ${
                active === index
                  ? "translate-x-0 opacity-100"
                  : index <
                      active
                    ? "-translate-x-full opacity-0"
                    : "translate-x-full opacity-0"
              }
            `}
          >
            <img
              src={
                banner.image
              }
              alt={
                banner.alt ||
                "Hivra Soft Women Banner"
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
        )
      )}

      {/* ===================================================
          PREVIOUS
      =================================================== */}

      {validBanners.length >
        1 && (
        <button
          type="button"
          aria-label="Previous banner"
          onClick={
            previous
          }
          className="
            absolute
            left-4
            top-1/2
            z-30

            flex
            h-10
            w-10
            -translate-y-1/2
            items-center
            justify-center

            rounded-full
            bg-white/90

            text-[24px]
            text-[#211A18]

            shadow-md
            transition

            hover:scale-110
          "
        >
          ‹
        </button>
      )}

      {/* ===================================================
          NEXT
      =================================================== */}

      {validBanners.length >
        1 && (
        <button
          type="button"
          aria-label="Next banner"
          onClick={
            next
          }
          className="
            absolute
            right-4
            top-1/2
            z-30

            flex
            h-10
            w-10
            -translate-y-1/2
            items-center
            justify-center

            rounded-full
            bg-white/90

            text-[24px]
            text-[#211A18]

            shadow-md
            transition

            hover:scale-110
          "
        >
          ›
        </button>
      )}

      {/* ===================================================
          DOTS
      =================================================== */}

      {validBanners.length >
        1 && (
        <div
          className="
            absolute
            bottom-4
            left-1/2
            z-30

            flex
            -translate-x-1/2
            items-center
            gap-2
          "
        >
          {validBanners.map(
            (
              _,
              index
            ) => (
              <button
                key={
                  index
                }
                type="button"
                aria-label={`Banner ${
                  index + 1
                }`}
                onClick={() =>
                  setActive(
                    index
                  )
                }
                className={`
                  h-[6px]
                  rounded-full
                  transition-all
                  duration-300

                  ${
                    active ===
                    index
                      ? "w-8 bg-[#9D173E]"
                      : "w-[6px] bg-white shadow"
                  }
                `}
              />
            )
          )}
        </div>
      )}
    </section>
  );
}

/* =========================================================
   CATEGORY NAVIGATION
========================================================= */

function CategoryNavigation({
  category,
  subcategory,
}: {
  category?: string;
  subcategory?: string;
}) {
  const activeParent =
    getWomenMenuItem(
      category
    );

  return (
    <div
      className="
        w-full
        overflow-hidden
        rounded-[20px]

        border
        border-[#211A18]/8

        bg-[#EFE5DB]

        px-4
        py-5

        md:px-6
      "
    >
      {/* ===================================================
          MAIN CATEGORY ROW
      =================================================== */}

      <div
        className="
          flex
          w-full
          justify-start
          overflow-x-auto

          md:justify-center
        "
      >
        <div
          className="
            flex
            min-w-max
            items-center
            justify-center
            gap-3
          "
        >
          <Link
            href="/women/"
            className={`
              shrink-0
              rounded-full

              px-6
              py-3

              text-[9px]
              font-semibold
              uppercase
              tracking-[0.13em]

              transition-all

              ${
                !category
                  ? "bg-[#9D173E] text-white"
                  : "bg-white text-[#211A18] hover:bg-[#9D173E] hover:text-white"
              }
            `}
          >
            All Women
          </Link>

          {womenMenu.map(
            (item) => (
              <Link
                key={
                  item.slug
                }
                href={
                  item.href
                }
                className={`
                  shrink-0
                  rounded-full

                  px-6
                  py-3

                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.13em]

                  transition-all

                  ${
                    category ===
                    item.slug
                      ? "bg-[#9D173E] text-white"
                      : "bg-white text-[#211A18] hover:bg-[#9D173E] hover:text-white"
                  }
                `}
              >
                {
                  item.name
                }
              </Link>
            )
          )}
        </div>
      </div>

      {/* ===================================================
          SUBCATEGORY ROW
      =================================================== */}

      {activeParent &&
        activeParent.children
          .length >
          0 && (
        <div
          className="
            mt-5

            flex
            w-full
            justify-start
            overflow-x-auto

            border-t
            border-[#211A18]/8

            pt-4

            md:justify-center
          "
        >
          <div
            className="
              flex
              min-w-max
              items-center
              justify-center
              gap-8
            "
          >
            <Link
              href={
                activeParent.href
              }
              className={`
                shrink-0

                border-b-2

                pb-2

                text-[8px]
                font-semibold
                uppercase
                tracking-[0.12em]

                transition

                ${
                  !subcategory
                    ? "border-[#9D173E] text-[#9D173E]"
                    : "border-transparent text-[#6F5A4C] hover:text-[#9D173E]"
                }
              `}
            >
              All{" "}
              {
                activeParent.name
              }
            </Link>

            {activeParent.children.map(
              (child) => (
                <Link
                  key={
                    child.slug
                  }
                  href={
                    child.href
                  }
                  className={`
                    shrink-0

                    border-b-2

                    pb-2

                    text-[8px]
                    font-semibold
                    uppercase
                    tracking-[0.12em]

                    transition

                    ${
                      subcategory ===
                      child.slug
                        ? "border-[#9D173E] text-[#9D173E]"
                        : "border-transparent text-[#6F5A4C] hover:text-[#9D173E]"
                    }
                  `}
                >
                  {
                    child.name
                  }
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   PRODUCT CARD
========================================================= */

function ProductCard({
  product,
}: {
  product: WomenProduct;
}) {
  const productUrl =
    `/product/${product.slug}`;

  const actualPrice =
    Number(
      product.actualPrice
    ) || 0;

  const discountedPrice =
    Number(
      product.discountedPrice
    ) || 0;

  const discount =
    actualPrice >
      discountedPrice &&
    actualPrice >
      0
      ? Math.round(
          ((actualPrice -
            discountedPrice) /
            actualPrice) *
            100
        )
      : 0;

  return (
    <article
      data-product-card
      className="
        group
        min-w-0
      "
    >
      {/* ===================================================
          IMAGE
      =================================================== */}

      <Link
        href={
          productUrl
        }
        className="
          relative
          block

          aspect-[4/5]

          overflow-hidden

          rounded-[14px]

          bg-[#F2ECE7]
        "
      >
        {product.image1 ? (
          <>
            {/* NORMAL */}

            <img
              src={
                product.image1
              }
              alt={
                product.name
              }
              loading="lazy"
              className="
                absolute
                inset-0

                h-full
                w-full

                object-cover
                object-center

                opacity-100

                transition-all
                duration-500

                group-hover:scale-[1.02]
                group-hover:opacity-0
              "
            />

            {/* HOVER */}

            <img
              src={
                product.image2 ||
                product.image1
              }
              alt={`${product.name} alternate`}
              loading="lazy"
              className="
                absolute
                inset-0

                h-full
                w-full

                scale-[1.02]

                object-cover
                object-center

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
              flex
              h-full
              w-full
              items-center
              justify-center

              text-[10px]
              text-black/30
            "
          >
            No Image
          </div>
        )}

        {/* DISCOUNT */}

        {discount >
          0 && (
          <span
            className="
              absolute
              left-3
              top-3
              z-20

              rounded-full

              bg-[#9D173E]

              px-3
              py-1.5

              text-[8px]
              font-semibold
              text-white
            "
          >
            {discount}% OFF
          </span>
        )}

        {/* WISHLIST DESIGN
            API baad me connect karenge
        */}

        <span
          className="
            absolute
            right-3
            top-3
            z-20

            flex
            h-9
            w-9
            items-center
            justify-center

            rounded-full

            bg-white/90

            text-[18px]
            text-[#9D173E]

            shadow-sm
          "
        >
          ♡
        </span>
      </Link>

      {/* ===================================================
          PRODUCT INFO
      =================================================== */}

      <div
        className="
          px-1
          pt-4
        "
      >
        <Link
          href={
            productUrl
          }
          className="
            block
            truncate

            text-[12px]
            font-medium
            text-[#211A18]

            transition

            hover:text-[#9D173E]
          "
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
          <span
            className="
              text-[13px]
              font-semibold
              text-[#211A18]
            "
          >
            ₹
            {discountedPrice.toLocaleString(
              "en-IN"
            )}
          </span>

          {actualPrice >
            discountedPrice && (
            <span
              className="
                text-[10px]
                text-black/35
                line-through
              "
            >
              ₹
              {actualPrice.toLocaleString(
                "en-IN"
              )}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   WOMEN CATALOG
========================================================= */

export default function WomenCatalog({
  products,
  banners,
  category,
  subcategory,
}: WomenCatalogProps) {
  const rootRef =
    useRef<HTMLElement>(
      null
    );

  const [sort, setSort] =
    useState(
      "featured"
    );

  /* =======================================================
     SORT
  ======================================================= */

  const sortedProducts =
    useMemo(() => {
      const result = [
        ...products,
      ];

      if (
        sort ===
        "low-high"
      ) {
        return result.sort(
          (
            a,
            b
          ) =>
            Number(
              a.discountedPrice
            ) -
            Number(
              b.discountedPrice
            )
        );
      }

      if (
        sort ===
        "high-low"
      ) {
        return result.sort(
          (
            a,
            b
          ) =>
            Number(
              b.discountedPrice
            ) -
            Number(
              a.discountedPrice
            )
        );
      }

      return result;
    }, [
      products,
      sort,
    ]);

  /* =======================================================
     GSAP PRODUCT ANIMATION
  ======================================================= */

  useEffect(() => {
    gsap.registerPlugin(
      ScrollTrigger
    );

    const root =
      rootRef.current;

    if (!root) {
      return;
    }

    const context =
      gsap.context(
        () => {
          ScrollTrigger.batch(
            "[data-product-card]",
            {
              start:
                "top 92%",

              once: true,

              onEnter: (
                elements
              ) => {
                gsap.fromTo(
                  elements,
                  {
                    y: 30,
                    opacity: 0,
                  },
                  {
                    y: 0,
                    opacity: 1,

                    duration:
                      0.6,

                    stagger:
                      0.06,

                    ease:
                      "power3.out",
                  }
                );
              },
            }
          );
        },
        root
      );

    return () => {
      context.revert();
    };
  }, [
    products,
  ]);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main
      ref={
        rootRef
      }
      className="
        min-h-screen
        bg-[#F8F5F2]
        text-[#211A18]
      "
    >
      {/* =================================================
          BANNER
      ================================================= */}

      <WomenBannerSlider
        banners={
          banners
        }
      />

      {/* =================================================
          PRODUCTS
      ================================================= */}

      <section
        className="
          px-4
          py-10

          md:px-8
          md:py-12
        "
      >
        <div
          className="
            mx-auto
            max-w-[1450px]
          "
        >
          {/* CATEGORY */}

          <div
            className="
              mb-9
            "
          >
            <CategoryNavigation
              category={
                category
              }
              subcategory={
                subcategory
              }
            />
          </div>

          {/* TOOLBAR */}

          <div
            className="
              mb-8

              flex
              flex-col
              gap-4

              border-b
              border-[#211A18]/10

              pb-5

              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <p
              className="
                text-[9px]
                font-semibold
                uppercase
                tracking-[0.18em]
                text-[#8C6A52]
              "
            >
              {
                sortedProducts.length
              }{" "}
              {sortedProducts.length ===
              1
                ? "Product"
                : "Products"}
            </p>

            <select
              value={
                sort
              }
              onChange={(
                event
              ) =>
                setSort(
                  event.target
                    .value
                )
              }
              className="
                rounded-[8px]

                border
                border-[#211A18]/15

                bg-white

                px-4
                py-3

                text-[9px]
                uppercase
                tracking-[0.1em]

                outline-none
              "
            >
              <option value="featured">
                Featured
              </option>

              <option value="low-high">
                Price Low to High
              </option>

              <option value="high-low">
                Price High to Low
              </option>
            </select>
          </div>

          {/* PRODUCTS */}

          {sortedProducts.length >
          0 ? (
            <div
              className="
                grid
                grid-cols-2

                gap-x-4
                gap-y-9

                sm:gap-x-5

                md:grid-cols-3
                md:gap-x-6

                lg:grid-cols-4
              "
            >
              {sortedProducts.map(
                (
                  product
                ) => (
                  <ProductCard
                    key={
                      product.slug
                    }
                    product={
                      product
                    }
                  />
                )
              )}
            </div>
          ) : (
            <div
              className="
                flex
                min-h-[330px]
                items-center
                justify-center

                rounded-[18px]

                border
                border-[#211A18]/8

                bg-white

                text-center
              "
            >
              <div>
                <p
                  className="
                    text-[8px]
                    uppercase
                    tracking-[0.3em]
                    text-[#9C765D]
                  "
                >
                  Hivra Soft
                </p>

                <h2
                  className="
                    mt-4
                    text-[25px]
                    font-medium
                  "
                >
                  No products found.
                </h2>

                <Link
                  href="/women/"
                  className="
                    mt-6
                    inline-flex

                    rounded-full

                    bg-[#211A18]

                    px-7
                    py-3

                    text-[8px]
                    font-semibold
                    uppercase
                    tracking-[0.14em]
                    text-white
                  "
                >
                  View All Women
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
=======
import ResponsiveCatalog from "@/src/components/Storefront/ResponsiveCatalog";

import type {
  StorefrontCategoryNode,
} from "@/src/services/categories";

import type {
  CatalogBanner,
  CatalogProduct,
} from "@/types/catalog";

type Props = {
  products: CatalogProduct[];
  banners: CatalogBanner[];
  title: string;
  description: string;
  categoryRoot: StorefrontCategoryNode;
  categoryPath: string[];
};

export default function WomenCatalog({
  products,
  banners,
  title,
  description,
  categoryRoot,
  categoryPath,
}: Props) {
  return (
    <ResponsiveCatalog
      basePath="/women"
      allLabel="All Women"
      products={products}
      banners={banners}
      title={title}
      description={description}
      categoryRoot={categoryRoot}
      categoryPath={categoryPath}
    />
>>>>>>> aman
  );
}