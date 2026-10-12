"use client";

import {
  useRouter,
} from "next/navigation";

import {
  useStorefrontCommerce,
} from "@/src/components/Storefront/StorefrontCommerceProvider";

import type {
  CatalogProduct,
} from "@/types/catalog";

type Props = {
  product:
    CatalogProduct;
};

export default function ProductMobileActions({
  product,
}: Props) {
  const router =
    useRouter();

  const commerce =
    useStorefrontCommerce();

  const wished =
    commerce.isWishlisted(
      product
    );

  const busy =
    commerce.isWishlistBusy(
      product
    );

  return (
    <div
      className="
        pointer-events-none

        absolute
        left-0
        right-0
        top-0
        z-30

        flex
        items-center
        justify-between

        p-3

        md:hidden
      "
    >
      {/* BACK */}

      <button
        type="button"
        aria-label="Go back"
        onClick={() =>
          router.back()
        }
        className="
          pointer-events-auto

          flex
          h-10
          w-10

          cursor-pointer

          items-center
          justify-center

          rounded-full

          border
          border-black/[0.06]

          bg-white/95

          text-[#211A18]

          shadow-[0_3px_14px_rgba(0,0,0,.14)]

          backdrop-blur
        "
      >
        <BackIcon />
      </button>

      {/* WISHLIST */}

      <button
        type="button"
        aria-label={
          wished
            ? "Remove from wishlist"
            : "Add to wishlist"
        }
        disabled={
          busy
        }
        onClick={() => {
          void commerce.toggleWishlist(
            product
          );
        }}
        className="
          pointer-events-auto

          flex
          h-10
          w-10

          cursor-pointer

          items-center
          justify-center

          rounded-full

          border
          border-black/[0.06]

          bg-white/95

          shadow-[0_3px_14px_rgba(0,0,0,.14)]

          backdrop-blur

          disabled:cursor-not-allowed
          disabled:opacity-50
        "
      >
        <HeartIcon
          filled={
            wished
          }
        />
      </button>
    </div>
  );
}

function BackIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function HeartIcon({
  filled,
}: {
  filled: boolean;
}) {
  return (
    <svg
      width="20"
      height="20"
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
    >
      <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" />
    </svg>
  );
}