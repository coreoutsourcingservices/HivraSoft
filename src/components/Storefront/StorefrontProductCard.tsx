"use client";

import Link from "next/link";

import {
  useStorefrontCommerce,
} from "@/src/components/Storefront/StorefrontCommerceProvider";

import type {
  CatalogProduct,
} from "@/types/catalog";

type Props = {
  product: CatalogProduct;
  overlay?: boolean;
};

export default function StorefrontProductCard({
  product,
  overlay = false,
}: Props) {
  const commerce =
    useStorefrontCommerce();

  const wished =
    commerce.isWishlisted(
      product
    );

  const wishlistBusy =
    commerce.isWishlistBusy(
      product
    );

  const hasSecondImage =
    Boolean(
      product.image2 &&
        product.image2 !==
          product.image1
    );

  const hasDiscount =
    product.originalPrice >
      product.showPrice &&
    product.showPrice > 0;

  return (
    <article
      className={`
        group/card
        w-full
        min-w-0
        max-w-full
        overflow-hidden
        bg-white

        ${
          overlay
            ? "rounded-[14px] shadow-lg"
            : "rounded-[14px] border border-black/10"
        }
      `}
    >
      {/* IMAGE */}

      <div
        className="
          relative
          w-full
          min-w-0
          overflow-hidden
          rounded-t-[13px]
          bg-[#F4F1EF]
        "
      >
        <Link
          href={`/product/${encodeURIComponent(
            product.slug
          )}`}
          className="
            group/image
            relative
            block
            w-full
            cursor-pointer
            aspect-[0.78]
          "
        >
          {product.image1 ? (
            <>
              <img
                src={product.image1}
                alt={product.name}
                className={`
                  absolute
                  inset-0
                  h-full
                  w-full
                  object-cover
                  transition-all
                  duration-500

                  ${
                    hasSecondImage
                      ? "md:group-hover/image:opacity-0"
                      : "md:group-hover/image:scale-[1.02]"
                  }
                `}
              />

              {hasSecondImage && (
                <img
                  src={product.image2}
                  alt={`${product.name} alternate`}
                  className="
                    absolute
                    inset-0
                    h-full
                    w-full
                    object-cover
                    opacity-0
                    transition-opacity
                    duration-500
                    md:group-hover/image:opacity-100
                  "
                />
              )}
            </>
          ) : (
            <div
              className="
                flex
                h-full
                w-full
                items-center
                justify-center
                text-xs
                text-black/35
              "
            >
              No image
            </div>
          )}
        </Link>

        {/* DISCOUNT LEFT */}

        {product.discountPercent >
          0 && (
          <span
            className="
              absolute
              left-0
              top-3
              z-10

              rounded-r-[6px]

              bg-[#FF7545]

              px-2
              py-1.5

              text-[8px]
              font-bold

              whitespace-nowrap

              text-white

              sm:text-[9px]
              lg:px-2.5
              lg:text-[10px]
            "
          >
            {
              product.discountPercent
            }
            % off
          </span>
        )}

        {/* WISHLIST TOP RIGHT */}

        <button
          type="button"
          aria-label={
            wished
              ? "Remove from wishlist"
              : "Add to wishlist"
          }
          disabled={
            wishlistBusy
          }
          onClick={(
            event
          ) => {
            event.preventDefault();
            event.stopPropagation();

            void commerce.toggleWishlist(
              product
            );
          }}
          className="
            absolute
            right-2.5
            top-2.5
            z-20

            flex
            h-[32px]
            w-[32px]

            cursor-pointer

            items-center
            justify-center

            rounded-full

            border
            border-black/[0.06]

            bg-white/95

            p-0

            shadow-[0_2px_10px_rgba(0,0,0,.10)]

            transition-all

            hover:scale-105
            hover:bg-white

            disabled:cursor-not-allowed
            disabled:opacity-50

            sm:right-3
            sm:top-3
            sm:h-[34px]
            sm:w-[34px]
          "
        >
          <HeartIcon
            filled={
              wished
            }
          />
        </button>
      </div>

      {/* DETAILS */}

      <div
        className="
          min-w-0
          px-2.5
          pb-3
          pt-2.5

          sm:px-3
          sm:pt-3
        "
      >
        <Link
          href={`/product/${encodeURIComponent(
            product.slug
          )}`}
          title={product.name}
          className="
            block
            w-full
            min-w-0
            cursor-pointer
            truncate

            text-[10px]
            font-medium

            text-[#111111]

            min-[360px]:text-[11px]
            sm:text-[12px]
            lg:text-[13px]
          "
        >
          {product.name}
        </Link>

        {/* PRICE */}

        <div
          className="
            mt-2
            flex
            min-h-[25px]
            min-w-0
            items-center
            gap-1
          "
        >
          <strong
            className="
              shrink-0

              text-[14px]
              font-bold
              text-black

              min-[360px]:text-[15px]
              sm:text-[16px]
              lg:text-[17px]
            "
          >
            ₹
            {product.showPrice.toLocaleString(
              "en-IN",
              {
                maximumFractionDigits:
                  2,
              }
            )}
          </strong>

          {hasDiscount && (
            <span
              className="
                min-w-0
                truncate

                text-[8px]

                text-black/35

                line-through

                min-[390px]:text-[9px]
                sm:text-[10px]
              "
            >
              ₹
              {product.originalPrice.toLocaleString(
                "en-IN",
                {
                  maximumFractionDigits:
                    2,
                }
              )}
            </span>
          )}
        </div>

        {/* FULL WIDTH ADD TO BAG */}

        <button
          type="button"
          onClick={() => {
            void commerce.openAddToBag(
              product
            );
          }}
          className="
            mt-3

            h-[38px]
            w-full

            cursor-pointer

            rounded-[5px]

            bg-[#EC4F83]

            px-2

            text-[8px]
            font-bold
            uppercase

            tracking-[0.02em]

            whitespace-nowrap

            text-white

            transition-colors

            hover:bg-[#B31345]

            min-[360px]:h-[40px]
            min-[360px]:text-[9px]

            sm:h-[42px]
            sm:text-[10px]

            lg:h-[44px]
            lg:text-[11px]
          "
        >
          Add To Bag
        </button>
      </div>
    </article>
  );
}

function HeartIcon({
  filled,
}: {
  filled: boolean;
}) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill={
        filled
          ? "#B31345"
          : "transparent"
      }
      stroke="#B31345"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="
        block
        transition-all
        duration-200
      "
    >
      <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" />
    </svg>
  );
}