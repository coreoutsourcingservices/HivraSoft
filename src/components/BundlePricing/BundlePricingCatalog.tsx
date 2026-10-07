"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import StorefrontProductCard from "@/src/components/Storefront/StorefrontProductCard";

import type {
  CatalogBanner,
  CatalogProduct,
} from "@/types/catalog";

/* =========================================================
   TYPES
========================================================= */

type SortValue =
  | "featured"
  | "low-high"
  | "high-low"
  | "discount";

type Props = {
  products:
    CatalogProduct[];

  banners:
    CatalogBanner[];

  categoryName:
    string;

  description:
    string;
};

/* =========================================================
   BANNER
========================================================= */

function BannerSlider({
  banners,
}: {
  banners:
    CatalogBanner[];
}) {
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

  const [
    active,
    setActive,
  ] =
    useState(0);

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

  if (
    validBanners.length ===
    0
  ) {
    return null;
  }

  const previous =
    () => {
      setActive(
        (
          current,
        ) =>
          current === 0
            ? validBanners.length -
              1
            : current -
              1,
      );
    };

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
              "/bundle-pricing"
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
                "Bundle Pricing"
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

      {validBanners.length >
      1 ? (
        <>
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
                  aria-label={`Banner ${index + 1}`}
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
   PAGE
========================================================= */

export default function BundlePricingCatalog({
  products,
  banners,
  categoryName,
  description,
}: Props) {
  const [
    sort,
    setSort,
  ] =
    useState<SortValue>(
      "featured",
    );

  const sortedProducts =
    useMemo(() => {
      const result = [
        ...products,
      ];

      switch (
        sort
      ) {
        case "low-high":
          return result.sort(
            (
              a,
              b,
            ) =>
              a.showPrice -
              b.showPrice,
          );

        case "high-low":
          return result.sort(
            (
              a,
              b,
            ) =>
              b.showPrice -
              a.showPrice,
          );

        case "discount":
          return result.sort(
            (
              a,
              b,
            ) =>
              b.discountPercent -
              a.discountPercent,
          );

        default:
          return result;
      }
    }, [
      products,
      sort,
    ]);

  return (
    <main
      className="
        min-h-screen
        bg-[#FCFAF8]
        text-[#292526]
      "
    >
      {/* NORMAL BANNER */}

      <BannerSlider
        banners={
          banners
        }
      />

      {/* PRODUCTS */}

      <section
        className="
          mx-auto
          max-w-[1450px]

          px-3
          py-9

          sm:px-5
          sm:py-11

          lg:px-8
          lg:py-14
        "
      >
        <div
          className="
            flex
            flex-col

            gap-5

            border-b
            border-black/[0.07]

            pb-6

            sm:flex-row
            sm:items-end
            sm:justify-between
          "
        >
          <div>
            <p
              className="
                text-[8px]
                font-semibold
                uppercase

                tracking-[0.24em]

                text-[#B31345]
              "
            >
              Shop Collection
            </p>

            <h1
              className="
                mt-2

                text-[28px]
                font-semibold

                tracking-[-0.03em]

                sm:text-[34px]

                lg:text-[40px]
              "
            >
              {categoryName}
            </h1>

            <p
              className="
                mt-2
                max-w-[600px]

                text-[10px]
                leading-5

                text-black/45

                sm:text-[11px]
              "
            >
              {description}
            </p>

            <p
              className="
                mt-2

                text-[9px]

                text-black/35
              "
            >
              {
                products.length
              }{" "}
              styles
            </p>
          </div>

          {products.length >
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
                h-11
                min-w-[180px]

                rounded-full

                border
                border-black/10

                bg-white

                px-4

                text-[10px]

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

              <option value="discount">
                Best Discount
              </option>
            </select>
          ) : null}
        </div>

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
                />
              ),
            )}
          </div>
        ) : (
          <div
            className="
              py-20

              text-center

              text-[11px]
              text-black/45
            "
          >
            Bundle Pricing
            category me abhi koi
            active product nahi hai.
          </div>
        )}
      </section>
    </main>
  );
}