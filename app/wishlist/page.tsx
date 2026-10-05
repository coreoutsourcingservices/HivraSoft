"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Header from "@/src/components/Header/Header";

import {
  useStorefrontCommerce,
} from "@/src/components/Storefront/StorefrontCommerceProvider";

import {
  getWishlist,
  removeFromWishlist,
  type WishlistItem,
} from "@/lib/wishlist";

/* =========================================================
   TYPE
========================================================= */

type WishlistDisplayItem = {
  productId: string;

  colorId: string;

  name: string;

  slug: string;

  color: string;

  image1: string;
  image2: string;

  showPrice: number;
  originalPrice: number;
};

/* =========================================================
   OBJECT
========================================================= */

function asObject(
  value: unknown
): Record<
  string,
  unknown
> {
  if (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(value)
  ) {
    return value as Record<
      string,
      unknown
    >;
  }

  return {};
}

/* =========================================================
   ARRAY
========================================================= */

function asArray(
  value: unknown
): unknown[] {
  return Array.isArray(
    value
  )
    ? value
    : [];
}

/* =========================================================
   STRING
========================================================= */

function firstString(
  ...values: unknown[]
): string {
  for (const value of values) {
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

/* =========================================================
   POSITIVE PRICE
========================================================= */

function positiveNumber(
  ...values: unknown[]
): number {
  for (const value of values) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      continue;
    }

    const parsed =
      Number(value);

    if (
      Number.isFinite(
        parsed
      ) &&
      parsed > 0
    ) {
      return parsed;
    }
  }

  return 0;
}

/* =========================================================
   ID
========================================================= */

function getId(
  value: unknown
): string {
  if (
    typeof value ===
    "string"
  ) {
    return value.trim();
  }

  const object =
    asObject(value);

  return firstString(
    object._id,
    object.id
  );
}

/* =========================================================
   IMAGE
========================================================= */

function getImageUrl(
  value: unknown
): string {
  if (
    typeof value ===
    "string"
  ) {
    return value.trim();
  }

  const image =
    asObject(value);

  return firstString(
    image.url,
    image.src,
    image.image,
    image.imageUrl
  );
}

function getImages(
  value: unknown
): string[] {
  const values =
    asArray(value);

  const defaults =
    values.filter(
      (item) =>
        asObject(item)
          .isDefault ===
        true
    );

  const rest =
    values.filter(
      (item) =>
        asObject(item)
          .isDefault !==
        true
    );

  return Array.from(
    new Set(
      [
        ...defaults,
        ...rest,
      ]
        .map(
          getImageUrl
        )
        .filter(Boolean)
    )
  );
}

/* =========================================================
   FIND COLOR
========================================================= */

function findColor(
  product:
    Record<
      string,
      unknown
    >,
  colorId: string
) {
  const colors =
    asArray(
      product.colors
    );

  if (colorId) {
    const exact =
      colors.find(
        (color) =>
          getId(color) ===
          colorId
      );

    if (exact) {
      return asObject(
        exact
      );
    }
  }

  return asObject(
    colors[0]
  );
}

/* =========================================================
   NORMALIZE ITEM
========================================================= */

function normalizeWishlistItem(
  wishlistItem: WishlistItem
): WishlistDisplayItem {
  const rawItem =
    asObject(
      wishlistItem
    );

  /* =======================================================
     PRODUCT
  ======================================================= */

  const product =
    typeof wishlistItem.product ===
    "string"
      ? {}
      : asObject(
          wishlistItem.product
        );

  const productId =
    firstString(
      getId(
        wishlistItem.product
      ),

      rawItem.productId
    );

  /* =======================================================
     COLOR
  ======================================================= */

  const colorId =
    firstString(
      getId(
        rawItem.colorId
      ),

      getId(
        rawItem.color
      )
    );

  const directColor =
    asObject(
      rawItem.color ||
        rawItem.selectedColor
    );

  const color =
    Object.keys(
      directColor
    ).length >
    0
      ? directColor
      : findColor(
          product,
          colorId
        );

  /* =======================================================
     IMAGES
  ======================================================= */

  const colorImages =
    getImages(
      color.images
    );

  const productImages =
    getImages(
      product.mainImages ||
        product.images
    );

  const images =
    Array.from(
      new Set(
        [
          ...colorImages,
          ...productImages,
        ].filter(Boolean)
      )
    );

  /* =======================================================
     PRICE

     Wishlist price always selected color showPrice.
  ======================================================= */

  const showPrice =
    positiveNumber(
      color.showPrice,

      color.sellingPrice,

      rawItem.showPrice,

      rawItem.price,

      product.showPrice
    );

  const originalPrice =
    positiveNumber(
      color.originalPrice,

      color.mrp,

      rawItem.originalPrice,

      product.originalPrice,

      showPrice
    );

  return {
    productId,

    colorId,

    name:
      firstString(
        color.nameProduct,

        rawItem.nameProduct,

        product.nameProduct,

        product.name,

        "Saved product"
      ),

    slug:
      firstString(
        color.slugProduct,

        rawItem.slugProduct,

        product.slugProduct,

        product.slug
      ),

    color:
      firstString(
        color.nameColor,

        rawItem.colorName
      ),

    image1:
      images[0] || "",

    image2:
      images[1] ||
      images[0] ||
      "",

    showPrice,

    originalPrice:
      Math.max(
        originalPrice,
        showPrice
      ),
  };
}

/* =========================================================
   PAGE
========================================================= */

export default function WishlistPage() {
  const commerce =
    useStorefrontCommerce();

  const [
    items,
    setItems,
  ] =
    useState<
      WishlistDisplayItem[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    busyProductId,
    setBusyProductId,
  ] =
    useState<
      string | null
    >(null);

  /* =======================================================
     LOAD
  ======================================================= */

  const loadWishlist =
    useCallback(
      async () => {
        if (
          commerce.isAuthenticated !==
          true
        ) {
          setItems([]);

          setLoading(
            false
          );

          return;
        }

        try {
          setLoading(
            true
          );

          const response =
            await getWishlist();

          setItems(
            response.items.map(
              normalizeWishlistItem
            )
          );
        } catch {
          setItems([]);
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        commerce.isAuthenticated,
      ]
    );

  useEffect(() => {
    void loadWishlist();
  }, [
    loadWishlist,
  ]);

  useEffect(() => {
    const handleUpdate =
      () => {
        void loadWishlist();
      };

    window.addEventListener(
      "hivrasoft-wishlist-updated",
      handleUpdate
    );

    return () => {
      window.removeEventListener(
        "hivrasoft-wishlist-updated",
        handleUpdate
      );
    };
  }, [
    loadWishlist,
  ]);

  /* =======================================================
     REMOVE
  ======================================================= */

  const handleRemove =
    async (
      productId: string
    ) => {
      if (!productId) {
        return;
      }

      try {
        setBusyProductId(
          productId
        );

        await removeFromWishlist(
          productId
        );

        await loadWishlist();

        await commerce.refreshCommerce();
      } finally {
        setBusyProductId(
          null
        );
      }
    };

  return (
    <>
      <Header />

      <main
        className="
          min-h-screen

          bg-[#FAF8F6]

          px-5
          py-10

          md:px-8
        "
      >
        <div
          className="
            mx-auto

            max-w-[1350px]
          "
        >
          <div
            className="
              flex
              items-end
              justify-between

              border-b
              border-black/10

              pb-5
            "
          >
            <div>
              <p
                className="
                  text-[10px]
                  font-bold
                  uppercase

                  tracking-[0.18em]

                  text-[#8C1839]
                "
              >
                Saved Products
              </p>

              <h1
                className="
                  mt-2

                  text-[30px]
                  font-bold

                  text-[#111111]
                "
              >
                My Wishlist
              </h1>
            </div>

            {commerce.isAuthenticated ===
              true && (
              <span
                className="
                  text-[11px]
                  font-semibold

                  text-[#444444]
                "
              >
                {
                  items.length
                }{" "}
                ITEMS
              </span>
            )}
          </div>

          {/* AUTH CHECK */}

          {commerce.isAuthenticated ===
            null && (
            <div
              className="
                py-24

                text-center

                text-sm

                text-[#555555]
              "
            >
              Checking your
              account...
            </div>
          )}

          {/* LOGGED OUT */}

          {commerce.isAuthenticated ===
            false && (
            <div
              className="
                mx-auto
                mt-12

                max-w-[520px]

                rounded-[22px]

                border
                border-black/10

                bg-white

                px-8
                py-12

                text-center
              "
            >
              <div
                className="
                  mx-auto

                  flex
                  h-14
                  w-14
                  items-center
                  justify-center

                  rounded-full

                  bg-[#F7E8ED]

                  text-[#8C1839]
                "
              >
                <HeartIcon />
              </div>

              <h2
                className="
                  mt-5

                  text-xl
                  font-semibold

                  text-[#111111]
                "
              >
                Login to check your
                wishlist
              </h2>

              <p
                className="
                  mt-2

                  text-sm
                  leading-6

                  text-[#666666]
                "
              >
                Sign in to view and
                manage all products
                saved in your
                wishlist.
              </p>

              <button
                type="button"
                onClick={() =>
                  commerce.openLoginPrompt(
                    "wishlist"
                  )
                }
                className="
                  mt-6

                  h-12

                  rounded-[10px]

                  bg-[#8C1839]

                  px-10

                  text-[11px]
                  font-bold
                  uppercase

                  tracking-[0.14em]

                  text-white
                "
              >
                Login / Sign Up
              </button>
            </div>
          )}

          {/* LOADING */}

          {commerce.isAuthenticated ===
            true &&
            loading && (
            <div
              className="
                py-24

                text-center

                text-sm

                text-[#555555]
              "
            >
              Loading wishlist...
            </div>
          )}

          {/* EMPTY */}

          {commerce.isAuthenticated ===
            true &&
            !loading &&
            items.length ===
              0 && (
            <div
              className="
                mt-10

                rounded-[20px]

                border
                border-black/10

                bg-white

                py-20

                text-center
              "
            >
              <h2
                className="
                  text-lg
                  font-semibold

                  text-[#111111]
                "
              >
                Your wishlist is
                empty
              </h2>

              <p
                className="
                  mt-2

                  text-sm

                  text-[#666666]
                "
              >
                Tap the heart on any
                product to save it
                here.
              </p>
            </div>
          )}

          {/* PRODUCTS */}

          {commerce.isAuthenticated ===
            true &&
            !loading &&
            items.length >
              0 && (
            <div
              className="
                mt-8

                grid
                grid-cols-1

                gap-6

                sm:grid-cols-2
                lg:grid-cols-3
                xl:grid-cols-4
              "
            >
              {items.map(
                (
                  item,
                  index
                ) => {
                  const hasSecondImage =
                    Boolean(
                      item.image2 &&
                        item.image2 !==
                          item.image1
                    );

                  const hasDiscount =
                    item.originalPrice >
                    item.showPrice;

                  return (
                    <article
                      key={`${item.productId}-${item.colorId}-${index}`}
                      className="
                        overflow-hidden

                        rounded-[18px]

                        border
                        border-black/10

                        bg-white

                        p-2.5

                        transition

                        hover:shadow-[0_14px_35px_rgba(0,0,0,.08)]
                      "
                    >
                      {/* IMAGE */}

                      <Link
                        href={
                          item.slug
                            ? `/product/${encodeURIComponent(
                                item.slug
                              )}`
                            : "#"
                        }
                        className="
                          group

                          relative

                          block
                          aspect-[0.8]

                          overflow-hidden

                          rounded-[14px]

                          bg-[#F4F1EF]
                        "
                      >
                        {item.image1 ? (
                          <>
                            <img
                              src={
                                item.image1
                              }
                              alt={
                                item.name
                              }
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
                                    ? "group-hover:scale-[1.02] group-hover:opacity-0"
                                    : "group-hover:scale-[1.03]"
                                }
                              `}
                            />

                            {hasSecondImage && (
                              <img
                                src={
                                  item.image2
                                }
                                alt={`${item.name} alternate`}
                                className="
                                  absolute
                                  inset-0

                                  h-full
                                  w-full

                                  object-cover

                                  opacity-0

                                  transition-all
                                  duration-500

                                  group-hover:scale-[1.02]
                                  group-hover:opacity-100
                                "
                              />
                            )}
                          </>
                        ) : (
                          <div
                            className="
                              flex
                              h-full
                              items-center
                              justify-center

                              text-xs

                              text-black/40
                            "
                          >
                            No image
                          </div>
                        )}
                      </Link>

                      {/* DETAILS */}

                      <div
                        className="
                          px-2
                          pb-2
                          pt-4
                        "
                      >
                        <Link
                          href={
                            item.slug
                              ? `/product/${encodeURIComponent(
                                  item.slug
                                )}`
                              : "#"
                          }
                          className="
                            line-clamp-2

                            min-h-[40px]

                            text-[12px]
                            font-semibold
                            leading-5

                            text-[#111111]

                            hover:text-[#8C1839]
                          "
                        >
                          {
                            item.name
                          }
                        </Link>

                        {item.color && (
                          <p
                            className="
                              mt-1

                              text-[10px]

                              text-[#666666]
                            "
                          >
                            Color:{" "}
                            <span
                              className="
                                font-medium

                                text-[#222222]
                              "
                            >
                              {
                                item.color
                              }
                            </span>
                          </p>
                        )}

                        {/* BLACK PRICE */}

                        <div
                          className="
                            mt-3

                            flex
                            flex-wrap
                            items-center

                            gap-2
                          "
                        >
                          <strong
                            className="
                              text-[15px]
                              font-bold

                              text-[#000000]
                            "
                          >
                            ₹
                            {item.showPrice.toLocaleString(
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
                                text-[10px]

                                text-[#666666]

                                line-through
                              "
                            >
                              ₹
                              {item.originalPrice.toLocaleString(
                                "en-IN",
                                {
                                  maximumFractionDigits:
                                    2,
                                }
                              )}
                            </span>
                          )}
                        </div>

                        {/* BUTTONS */}

                        <div
                          className="
                            mt-4

                            grid
                            grid-cols-2

                            gap-2
                          "
                        >
                          {item.slug ? (
                            <Link
                              href={`/product/${encodeURIComponent(
                                item.slug
                              )}`}
                              className="
                                flex
                                h-10
                                items-center
                                justify-center

                                rounded-[8px]

                                border
                                border-[#211A18]/20

                                bg-white

                                text-[9px]
                                font-bold
                                uppercase

                                tracking-[0.08em]

                                text-[#111111]

                                transition

                                hover:border-[#8C1839]
                                hover:text-[#8C1839]
                              "
                            >
                              View
                            </Link>
                          ) : (
                            <div />
                          )}

                          <button
                            type="button"
                            disabled={
                              busyProductId ===
                              item.productId
                            }
                            onClick={() => {
                              void handleRemove(
                                item.productId
                              );
                            }}
                            className="
                              h-10

                              rounded-[8px]

                              bg-[#8C1839]

                              text-[9px]
                              font-bold
                              uppercase

                              tracking-[0.08em]

                              text-white

                              transition

                              hover:bg-[#6E102D]

                              disabled:opacity-40
                            "
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

/* =========================================================
   ICON
========================================================= */

function HeartIcon() {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" />
    </svg>
  );
}