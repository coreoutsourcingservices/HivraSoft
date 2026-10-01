"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  gsap,
} from "gsap";

import {
  ScrollTrigger,
} from "gsap/ScrollTrigger";

import {
  menMenu,
  type MenBanner,
  type MenProduct,
} from "@/src/data/men";

/* =========================================================
   PROPS
========================================================= */

type MenCatalogProps = {
  products: MenProduct[];

  banners: MenBanner[];

  title: string;
  description: string;

  category?: string;
  subcategory?: string;
};

/* =========================================================
   BANNER
========================================================= */

function MenBannerSlider({
  banners,
}: {
  banners: MenBanner[];
}) {
  const [
    active,
    setActive,
  ] =
    useState(0);

  const validBanners =
    useMemo(
      () =>
        banners.filter(
          (banner) =>
            Boolean(
              banner?.image
            )
        ),
      [
        banners,
      ]
    );

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

    return () =>
      window.clearInterval(
        timer
      );
  }, [
    validBanners.length,
  ]);

  if (
    validBanners.length ===
    0
  ) {
    return null;
  }

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
      {validBanners.map(
        (
          banner,
          index
        ) => (
          <Link
            key={`${banner.image}-${index}`}
            href={
              banner.redirect ||
              banner.href ||
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
                banner.title ||
                "Men Banner"
              }
              className="
                h-full
                w-full
                object-cover
                object-center
              "
            />
          </Link>
        )
      )}

      {validBanners.length >
        1 && (
        <>
          <button
            type="button"
            onClick={() =>
              setActive(
                (
                  current
                ) =>
                  current ===
                  0
                    ? validBanners.length -
                      1
                    : current -
                      1
              )
            }
            className="
              absolute
              left-4
              top-1/2
              z-20

              flex
              h-10
              w-10
              -translate-y-1/2
              items-center
              justify-center

              rounded-full
              bg-white/90

              text-[22px]

              shadow
            "
          >
            ‹
          </button>

          <button
            type="button"
            onClick={() =>
              setActive(
                (
                  current
                ) =>
                  (current +
                    1) %
                  validBanners.length
              )
            }
            className="
              absolute
              right-4
              top-1/2
              z-20

              flex
              h-10
              w-10
              -translate-y-1/2
              items-center
              justify-center

              rounded-full
              bg-white/90

              text-[22px]

              shadow
            "
          >
            ›
          </button>
        </>
      )}
    </section>
  );
}

/* =========================================================
   CATEGORY NAVIGATION
========================================================= */

function MenNavigation({
  category,
  subcategory,
}: {
  category?: string;
  subcategory?: string;
}) {
  const activeParent =
    useMemo(
      () =>
        menMenu.find(
          (item) =>
            item.slug ===
            category
        ),
      [
        category,
      ]
    );

  return (
    <div
      className="
        w-full
        overflow-hidden

        rounded-[20px]

        border
        border-[#211A18]/10

        bg-[#EFE5DB]

        px-4
        py-5

        md:px-6
      "
    >
      {/* MAIN */}

      <div
        className="
          w-full
          overflow-x-auto
        "
      >
        <div
          className="
            mx-auto

            flex
            min-w-max
            items-center
            justify-center
            gap-3
          "
        >
          <Link
            href="/men"
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
                  ? "bg-[#A91543] text-white"
                  : "bg-white text-[#211A18] hover:bg-[#A91543] hover:text-white"
              }
            `}
          >
            All Men
          </Link>

          {menMenu.map(
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
                      ? "bg-[#A91543] text-white"
                      : "bg-white text-[#211A18] hover:bg-[#A91543] hover:text-white"
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

      {/* CHILDREN */}

      {activeParent &&
        activeParent.children
          .length >
          0 && (
        <div
          className="
            mt-5
            overflow-x-auto

            border-t
            border-[#211A18]/10

            pt-4
          "
        >
          <div
            className="
              mx-auto

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
                border-b-2
                pb-2

                text-[8px]
                font-semibold
                uppercase
                tracking-[0.12em]

                ${
                  !subcategory
                    ? "border-[#A91543] text-[#A91543]"
                    : "border-transparent text-[#6F5A4C]"
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
                    border-b-2
                    pb-2

                    text-[8px]
                    font-semibold
                    uppercase
                    tracking-[0.12em]

                    ${
                      subcategory ===
                      child.slug
                        ? "border-[#A91543] text-[#A91543]"
                        : "border-transparent text-[#6F5A4C] hover:text-[#A91543]"
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
  product: MenProduct;
}) {
  const productUrl =
    `/product/${product.slug}`;

  const discount =
    product.actualPrice >
      product.discountedPrice &&
    product.actualPrice >
      0
      ? Math.round(
          ((product.actualPrice -
            product.discountedPrice) /
            product.actualPrice) *
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
                object-center

                transition-all
                duration-500

                group-hover:scale-[1.02]
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
              items-center
              justify-center

              text-[10px]
              text-black/30
            "
          >
            No Image
          </div>
        )}

        {discount >
          0 && (
          <span
            className="
              absolute
              left-3
              top-3
              z-20

              rounded-full

              bg-[#A91543]

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
            text-[#A91543]

            shadow-sm
          "
        >
          ♡
        </span>
      </Link>

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

            hover:text-[#A91543]
          "
        >
          {
            product.name
          }
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
            {Number(
              product.discountedPrice
            ).toLocaleString(
              "en-IN"
            )}
          </span>

          {product.actualPrice >
            product.discountedPrice && (
            <span
              className="
                text-[10px]
                text-black/35
                line-through
              "
            >
              ₹
              {Number(
                product.actualPrice
              ).toLocaleString(
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
   CATALOG
========================================================= */

export default function MenCatalog({
  products,
  banners,
  category,
  subcategory,
}: MenCatalogProps) {
  const rootRef =
    useRef<HTMLElement>(
      null
    );

  const [
    sort,
    setSort,
  ] =
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
            a.discountedPrice -
            b.discountedPrice
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
            b.discountedPrice -
            a.discountedPrice
        );
      }

      return result.sort(
        (
          a,
          b
        ) =>
          Number(
            b.isFeatured
          ) -
          Number(
            a.isFeatured
          )
      );
    }, [
      products,
      sort,
    ]);

  /* =======================================================
     ANIMATION
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

              onEnter:
                (
                  cards
                ) => {
                  gsap.fromTo(
                    cards,
                    {
                      y: 24,
                      opacity: 0,
                    },
                    {
                      y: 0,
                      opacity: 1,

                      duration:
                        0.55,

                      stagger:
                        0.05,

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

    return () =>
      context.revert();
  }, [
    sortedProducts,
  ]);

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
      <MenBannerSlider
        banners={
          banners
        }
      />

      <section
        className="
          px-4
          py-12

          md:px-8
        "
      >
        <div
          className="
            mx-auto
            max-w-[1450px]
          "
        >
          {/* NAVIGATION */}

          <MenNavigation
            category={
              category
            }
            subcategory={
              subcategory
            }
          />

          {/* TOOLBAR */}

          <div
            className="
              mb-8
              mt-9

              flex
              items-center
              justify-between

              border-b
              border-[#211A18]/10

              pb-5
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
                min-w-[160px]

                rounded-[8px]

                border
                border-[#211A18]/15

                bg-white

                px-4
                py-3

                text-[9px]
                font-medium
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

                md:grid-cols-3
                md:gap-x-6

                lg:grid-cols-4
              "
            >
              {sortedProducts.map(
                (
                  product,
                  index
                ) => (
                  <ProductCard
                    key={
                      product.id ||
                      product.slug ||
                      index
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

                <p
                  className="
                    mt-2

                    text-[10px]
                    text-[#211A18]/45
                  "
                >
                  Is category me abhi
                  koi active product
                  available nahi hai.
                </p>

                <Link
                  href="/men"
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
                  View All Men
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}