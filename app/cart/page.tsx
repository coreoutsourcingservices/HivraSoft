"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Header from "@/src/components/Header/Header";

import {
  useStorefrontCommerce,
} from "@/src/components/Storefront/StorefrontCommerceProvider";

import {
  getCart,
  removeCartItem,
  updateCartItem,
} from "@/lib/cart";

/* =========================================================
   TYPES
========================================================= */

type CartDisplayItem = {
  id: string;

  productId: string;
  colorId: string;
  sizeId: string;

  name: string;

  slug: string;

  color: string;
  size: string;

  image1: string;
  image2: string;

  showPrice: number;
  originalPrice: number;

  quantity: number;
};

/* =========================================================
   SAFE OBJECT
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
   SAFE ARRAY
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
   POSITIVE NUMBER

   IMPORTANT:
   0 ko valid selling price nahi maante,
   warna color.showPrice tak fallback nahi hoga.
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
   IMAGE URL
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

/* =========================================================
   IMAGES
========================================================= */

function getImageUrls(
  value: unknown
): string[] {
  const raw =
    asArray(value);

  const defaultImages =
    raw.filter(
      (item) =>
        asObject(item)
          .isDefault ===
        true
    );

  const otherImages =
    raw.filter(
      (item) =>
        asObject(item)
          .isDefault !==
        true
    );

  const result = [
    ...defaultImages,
    ...otherImages,
  ]
    .map(
      getImageUrl
    )
    .filter(Boolean);

  return Array.from(
    new Set(result)
  );
}

/* =========================================================
   FIND BY ID
========================================================= */

function findById(
  list: unknown,
  targetId: string
): Record<
  string,
  unknown
> {
  if (!targetId) {
    return {};
  }

  for (
    const value of asArray(
      list
    )
  ) {
    const object =
      asObject(value);

    if (
      getId(object) ===
      targetId
    ) {
      return object;
    }
  }

  return {};
}

/* =========================================================
   NORMALIZE ONE CART ITEM
========================================================= */

function normalizeCartItem(
  rawValue: unknown
): CartDisplayItem | null {
  const item =
    asObject(rawValue);

  const product =
    asObject(
      item.product
    );

  const productId =
    firstString(
      getId(
        item.product
      ),
      item.productId
    );

  /* =======================================================
     COLOR
  ======================================================= */

  const directColor =
    asObject(
      item.color ||
        item.selectedColor
    );

  const colorId =
    firstString(
      getId(
        item.colorId
      ),

      getId(
        directColor
      )
    );

  const productColor =
    findById(
      product.colors,
      colorId
    );

  const color =
    Object.keys(
      directColor
    ).length >
    0
      ? directColor
      : productColor;

  /* =======================================================
     SIZE
  ======================================================= */

  const directSize =
    asObject(
      item.size ||
        item.selectedSize
    );

  const sizeId =
    firstString(
      getId(
        item.sizeId
      ),

      getId(
        directSize
      )
    );

  const colorSize =
    findById(
      color.sizes,
      sizeId
    );

  const size =
    Object.keys(
      directSize
    ).length >
    0
      ? directSize
      : colorSize;

  /* =======================================================
     PRICE

     Correct priority:
     selected size showPrice
     → selected color showPrice
     → cart snapshot
     → product fallback
  ======================================================= */

  const showPrice =
    positiveNumber(
      size.showPrice,

      size.sellingPrice,

      color.showPrice,

      color.sellingPrice,

      item.showPrice,

      item.sellingPrice,

      item.unitPrice,

      item.priceAtAdd,

      item.price,

      product.showPrice
    );

  const originalPrice =
    positiveNumber(
      size.originalPrice,

      size.mrp,

      color.originalPrice,

      color.mrp,

      item.originalPrice,

      item.mrp,

      product.originalPrice,

      showPrice
    );

  /* =======================================================
     IMAGES
  ======================================================= */

  const colorImages =
    getImageUrls(
      color.images
    );

  const productImages =
    getImageUrls(
      product.mainImages ||
        product.images
    );

  const directImage =
    firstString(
      item.image,
      item.imageUrl
    );

  const images =
    Array.from(
      new Set(
        [
          directImage,

          ...colorImages,

          ...productImages,
        ].filter(Boolean)
      )
    );

  /* =======================================================
     NAME / SLUG
  ======================================================= */

  const name =
    firstString(
      color.nameProduct,

      item.nameProduct,

      item.productName,

      product.nameProduct,

      product.name,

      "Product"
    );

  const slug =
    firstString(
      color.slugProduct,

      item.slugProduct,

      item.slug,

      product.slugProduct,

      product.slug
    );

  const colorName =
    firstString(
      color.nameColor,

      item.colorName
    );

  const sizeName =
    firstString(
      size.size,

      size.name,

      item.sizeLabel,

      item.sizeName
    );

  const quantity =
    Math.max(
      1,
      Math.floor(
        positiveNumber(
          item.quantity,
          1
        )
      )
    );

  const id =
    firstString(
      getId(item)
    );

  if (!id) {
    return null;
  }

  return {
    id,

    productId,

    colorId,

    sizeId,

    name,

    slug,

    color:
      colorName,

    size:
      sizeName,

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

    quantity,
  };
}

/* =========================================================
   NORMALIZE CART RESPONSE
========================================================= */

function normalizeCart(
  response: unknown
): CartDisplayItem[] {
  const root =
    asObject(
      response
    );

  const data =
    asObject(
      root.data
    );

  const cart =
    asObject(
      root.cart ||
        data.cart ||
        data
    );

  const rawItems =
    Array.isArray(
      cart.items
    )
      ? cart.items
      : Array.isArray(
            root.items
          )
        ? root.items
        : [];

  return rawItems
    .map(
      normalizeCartItem
    )
    .filter(
      (
        item
      ): item is CartDisplayItem =>
        Boolean(item)
    );
}

/* =========================================================
   LOGIN CARD
========================================================= */

function LoginCartCard({
  onLogin,
}: {
  onLogin: () => void;
}) {
  return (
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

        shadow-sm
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
        <BagIcon />
      </div>

      <h2
        className="
          mt-5

          text-xl
          font-semibold

          text-[#111111]
        "
      >
        Login to check your cart
      </h2>

      <p
        className="
          mx-auto
          mt-2

          max-w-[360px]

          text-sm
          leading-6

          text-[#666666]
        "
      >
        Sign in to view products
        saved in your shopping bag
        and continue checkout.
      </p>

      <button
        type="button"
        onClick={
          onLogin
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
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function CartPage() {
  const commerce =
    useStorefrontCommerce();

  const [
    items,
    setItems,
  ] =
    useState<
      CartDisplayItem[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    busyItemId,
    setBusyItemId,
  ] =
    useState<
      string | null
    >(null);

  /* =======================================================
     LOAD CART
  ======================================================= */

  const loadCart =
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
            await getCart();

          setItems(
            normalizeCart(
              response
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
    void loadCart();
  }, [
    loadCart,
  ]);

  useEffect(() => {
    const handleUpdate =
      () => {
        void loadCart();
      };

    window.addEventListener(
      "hivrasoft-cart-updated",
      handleUpdate
    );

    return () => {
      window.removeEventListener(
        "hivrasoft-cart-updated",
        handleUpdate
      );
    };
  }, [
    loadCart,
  ]);

  /* =======================================================
     TOTALS
  ======================================================= */

  const subtotal =
    useMemo(
      () =>
        items.reduce(
          (
            total,
            item
          ) =>
            total +
            item.showPrice *
              item.quantity,
          0
        ),
      [
        items,
      ]
    );

  /* =======================================================
     QUANTITY
  ======================================================= */

  const changeQuantity =
    async (
      item: CartDisplayItem,
      nextQuantity: number
    ) => {
      if (
        nextQuantity <
        1
      ) {
        return;
      }

      try {
        setBusyItemId(
          item.id
        );

        await updateCartItem(
          item.id,
          nextQuantity
        );

        await loadCart();

        await commerce.refreshCommerce();
      } finally {
        setBusyItemId(
          null
        );
      }
    };

  /* =======================================================
     REMOVE
  ======================================================= */

  const removeItem =
    async (
      itemId: string
    ) => {
      try {
        setBusyItemId(
          itemId
        );

        await removeCartItem(
          itemId
        );

        await loadCart();

        await commerce.refreshCommerce();
      } finally {
        setBusyItemId(
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

            max-w-[1280px]
          "
        >
          <h1
            className="
              text-[30px]
              font-bold

              text-[#111111]
            "
          >
            Shopping Bag
          </h1>

          {/* AUTH LOADING */}

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

          {/* NOT LOGGED IN */}

          {commerce.isAuthenticated ===
            false && (
            <LoginCartCard
              onLogin={() =>
                commerce.openLoginPrompt(
                  "cart"
                )
              }
            />
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
              Loading your cart...
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
                <BagIcon />
              </div>

              <h2
                className="
                  mt-5

                  text-lg
                  font-semibold

                  text-[#111111]
                "
              >
                Your shopping bag
                is empty
              </h2>

              <Link
                href="/"
                className="
                  mt-6

                  inline-flex
                  h-11
                  items-center
                  justify-center

                  rounded-[9px]

                  bg-[#8C1839]

                  px-7

                  text-[10px]
                  font-bold
                  uppercase

                  tracking-[0.12em]

                  text-white
                "
              >
                Continue Shopping
              </Link>
            </div>
          )}

          {/* CART */}

          {commerce.isAuthenticated ===
            true &&
            !loading &&
            items.length >
              0 && (
            <div
              className="
                mt-8

                grid
                gap-7

                lg:grid-cols-[minmax(0,1fr)_360px]
              "
            >
              {/* PRODUCTS */}

              <div
                className="
                  space-y-4
                "
              >
                {items.map(
                  (item) => {
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
                        key={
                          item.id
                        }
                        className="
                          flex

                          gap-5

                          rounded-[18px]

                          border
                          border-black/10

                          bg-white

                          p-5
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

                            h-[140px]
                            w-[110px]

                            flex-none

                            overflow-hidden

                            rounded-[12px]

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

                                  transition-opacity
                                  duration-300

                                  ${
                                    hasSecondImage
                                      ? "group-hover:opacity-0"
                                      : ""
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

                                    transition-opacity
                                    duration-300

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

                                text-[10px]

                                text-black/40
                              "
                            >
                              No image
                            </div>
                          )}
                        </Link>

                        {/* INFO */}

                        <div
                          className="
                            min-w-0
                            flex-1
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

                              text-[14px]
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

                          <div
                            className="
                              mt-2

                              flex
                              flex-wrap

                              gap-x-4
                              gap-y-1

                              text-[11px]

                              text-[#666666]
                            "
                          >
                            {item.color && (
                              <span>
                                Color:{" "}
                                <strong
                                  className="
                                    font-medium

                                    text-[#222222]
                                  "
                                >
                                  {
                                    item.color
                                  }
                                </strong>
                              </span>
                            )}

                            {item.size && (
                              <span>
                                Size:{" "}
                                <strong
                                  className="
                                    font-medium

                                    text-[#222222]
                                  "
                                >
                                  {
                                    item.size
                                  }
                                </strong>
                              </span>
                            )}
                          </div>

                          {/* PRICE */}

                          <div
                            className="
                              mt-4

                              flex
                              flex-wrap
                              items-center
                              gap-2
                            "
                          >
                            <span
                              className="
                                text-[17px]
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
                            </span>

                            {hasDiscount && (
                              <span
                                className="
                                  text-[11px]

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

                          {/* QUANTITY */}

                          <div
                            className="
                              mt-5

                              flex
                              flex-wrap
                              items-center

                              gap-5
                            "
                          >
                            <div
                              className="
                                flex
                                h-10
                                items-center

                                overflow-hidden

                                rounded-[9px]

                                border
                                border-black/15
                              "
                            >
                              <button
                                type="button"
                                disabled={
                                  busyItemId ===
                                    item.id ||
                                  item.quantity <=
                                    1
                                }
                                onClick={() => {
                                  void changeQuantity(
                                    item,
                                    item.quantity -
                                      1
                                  );
                                }}
                                className="
                                  h-full
                                  w-10

                                  text-base
                                  font-medium

                                  text-[#111111]

                                  transition

                                  hover:bg-black/[0.04]

                                  disabled:text-black/20
                                "
                              >
                                −
                              </button>

                              <span
                                className="
                                  flex
                                  h-full
                                  min-w-[42px]
                                  items-center
                                  justify-center

                                  border-x
                                  border-black/10

                                  text-[12px]
                                  font-semibold

                                  text-[#111111]
                                "
                              >
                                {
                                  item.quantity
                                }
                              </span>

                              <button
                                type="button"
                                disabled={
                                  busyItemId ===
                                  item.id
                                }
                                onClick={() => {
                                  void changeQuantity(
                                    item,
                                    item.quantity +
                                      1
                                  );
                                }}
                                className="
                                  h-full
                                  w-10

                                  text-base
                                  font-medium

                                  text-[#111111]

                                  transition

                                  hover:bg-black/[0.04]
                                "
                              >
                                +
                              </button>
                            </div>

                            <button
                              type="button"
                              disabled={
                                busyItemId ===
                                item.id
                              }
                              onClick={() => {
                                void removeItem(
                                  item.id
                                );
                              }}
                              className="
                                text-[10px]
                                font-bold
                                uppercase

                                tracking-[0.1em]

                                text-[#8C1839]

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

              {/* SUMMARY */}

              <aside
                className="
                  h-fit

                  rounded-[18px]

                  border
                  border-black/10

                  bg-white

                  p-6

                  lg:sticky
                  lg:top-[110px]
                "
              >
                <h2
                  className="
                    text-[17px]
                    font-bold

                    text-[#111111]
                  "
                >
                  Order Summary
                </h2>

                <div
                  className="
                    mt-7

                    flex
                    items-center
                    justify-between
                  "
                >
                  <span
                    className="
                      text-[13px]

                      text-[#555555]
                    "
                  >
                    Subtotal
                  </span>

                  <strong
                    className="
                      text-[14px]

                      text-[#000000]
                    "
                  >
                    ₹
                    {subtotal.toLocaleString(
                      "en-IN",
                      {
                        maximumFractionDigits:
                          2,
                      }
                    )}
                  </strong>
                </div>

                <div
                  className="
                    my-6

                    h-px

                    bg-black/10
                  "
                />

                <div
                  className="
                    flex
                    items-center
                    justify-between
                  "
                >
                  <span
                    className="
                      text-[14px]
                      font-semibold

                      text-[#111111]
                    "
                  >
                    Total
                  </span>

                  <strong
                    className="
                      text-xl
                      font-bold

                      text-[#000000]
                    "
                  >
                    ₹
                    {subtotal.toLocaleString(
                      "en-IN",
                      {
                        maximumFractionDigits:
                          2,
                      }
                    )}
                  </strong>
                </div>

                <Link
                  href="/account/checkout"
                  className="
                    mt-7

                    flex
                    h-12
                    w-full
                    items-center
                    justify-center

                    rounded-[9px]

                    bg-[#8C1839]

                    text-[10px]
                    font-bold
                    uppercase

                    tracking-[0.12em]

                    text-white

                    transition

                    hover:bg-[#6E102D]
                  "
                >
                  Proceed to Checkout
                </Link>
              </aside>
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

function BagIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 8h14l-1 13H6L5 8Z" />

      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}