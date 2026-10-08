"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
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

type Props = {
  offer: StorefrontOffer;
  products: CatalogProduct[];
  banners: CatalogBanner[];
};

/* =========================================================
   BANNERS
========================================================= */

function OfferBannerSlider({
  banners,
}: {
  banners: CatalogBanner[];
}) {
  const validBanners =
    useMemo(
      () =>
        banners.filter(
          (banner) =>
            Boolean(
              banner.image
            )
        ),
      [banners]
    );

  const [
    active,
    setActive,
  ] =
    useState(0);

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
              (
                current +
                1
              ) %
              validBanners.length
          );
        },
        4500
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
          index
        ) => (
          <Link
            key={`${banner.image}-${index}`}
            href={
              banner.redirect
            }
            className={`
              absolute
              inset-0
              h-full
              w-full
              transition-opacity
              duration-700

              ${
                active ===
                index
                  ? "opacity-100"
                  : "pointer-events-none opacity-0"
              }
            `}
          >
            <img
              src={
                banner.image
              }
              alt={
                banner.alt
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
      1 ? (
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
              index
            ) => (
              <button
                key={
                  index
                }
                type="button"
                aria-label={`Show banner ${index + 1}`}
                onClick={() =>
                  setActive(
                    index
                  )
                }
                className={`
                  h-[6px]
                  rounded-full

                  ${
                    active ===
                    index
                      ? "w-7 bg-[#B31345]"
                      : "w-[6px] bg-white"
                  }
                `}
              />
            )
          )}
        </div>
      ) : null}
    </section>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function BuyGetOfferCatalog({
  offer,
  products,
  banners,
}: Props) {
  const [
    sort,
    setSort,
  ] =
    useState(
      "featured"
    );

  /*
   * IMPORTANT:
   * Ye context ONLY Buy/Get offer page se pass hota hai.
   *
   * Men / Women / Home / Search ke StorefrontProductCard
   * is prop ko pass nahi karenge.
   */
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
      ]
    );

  const sortedProducts =
    useMemo(() => {
      const result = [
        ...products,
      ];

      if (
        sort ===
        "low"
      ) {
        return result.sort(
          (a, b) =>
            a.showPrice -
            b.showPrice
        );
      }

      if (
        sort ===
        "high"
      ) {
        return result.sort(
          (a, b) =>
            b.showPrice -
            a.showPrice
        );
      }

      return result;
    }, [
      products,
      sort,
    ]);

  return (
    <main
      className="
        min-h-screen
        bg-[#FCFAF8]
        text-[#211A18]
      "
    >
      <OfferBannerSlider
        banners={
          banners
        }
      />

      <section
        className="
          mx-auto
          max-w-[1450px]
          px-3
          py-9
          sm:px-5
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
                font-bold
                uppercase
                tracking-[0.22em]
                text-[#B31345]
              "
            >
              Buy{" "}
              {
                offer.buyQuantity
              }{" "}
              Get{" "}
              {
                offer.getQuantity
              }{" "}
              Free
            </p>

            <h1
              className="
                mt-2
                text-[28px]
                font-semibold
                sm:text-[34px]
                lg:text-[40px]
              "
            >
              {offer.name}
            </h1>

            <p
              className="
                mt-2
                text-[10px]
                text-black/45
              "
            >
              Choose from eligible
              products below.
            </p>
          </div>

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
              h-11
              min-w-[180px]
              rounded-full
              border
              border-black/10
              bg-white
              px-4
              text-[10px]
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
                product
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
              )
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
            No eligible products
            available for this
            offer.
          </div>
        )}
      </section>
    </main>
  );
}
