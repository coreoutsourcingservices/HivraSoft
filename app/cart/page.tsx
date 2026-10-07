"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import Header from "@/src/components/Header/Header";
import AccountSidebar from "@/app/account/components/AccountSidebar";

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
   HELPERS
========================================================= */

function asObject(
  value: unknown,
): Record<string, unknown> {
  if (
    value &&
    typeof value === "object" &&
    !Array.isArray(value)
  ) {
    return value as Record<
      string,
      unknown
    >;
  }

  return {};
}

function asArray(
  value: unknown,
): unknown[] {
  return Array.isArray(value)
    ? value
    : [];
}

function firstString(
  ...values: unknown[]
): string {
  for (const value of values) {
    if (
      typeof value === "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return "";
}

function positiveNumber(
  ...values: unknown[]
) {
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
      Number.isFinite(parsed) &&
      parsed > 0
    ) {
      return parsed;
    }
  }

  return 0;
}

function getId(
  value: unknown,
) {
  if (
    typeof value === "string"
  ) {
    return value.trim();
  }

  const object =
    asObject(value);

  return firstString(
    object._id,
    object.id,
  );
}

function getImageUrl(
  value: unknown,
) {
  if (
    typeof value === "string"
  ) {
    return value.trim();
  }

  const object =
    asObject(value);

  return firstString(
    object.url,
    object.src,
    object.image,
    object.imageUrl,
  );
}

function getImageUrls(
  value: unknown,
) {
  const images =
    asArray(value);

  const sorted = [
    ...images.filter(
      (image) =>
        asObject(image)
          .isDefault === true,
    ),

    ...images.filter(
      (image) =>
        asObject(image)
          .isDefault !== true,
    ),
  ];

  return Array.from(
    new Set(
      sorted
        .map(getImageUrl)
        .filter(Boolean),
    ),
  );
}

function findById(
  list: unknown,
  targetId: string,
) {
  if (!targetId) {
    return {};
  }

  for (
    const value of asArray(list)
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
   NORMALIZE CART ITEM
========================================================= */

function normalizeCartItem(
  rawValue: unknown,
): CartDisplayItem | null {
  const item =
    asObject(rawValue);

  const product =
    asObject(item.product);

  const productId =
    firstString(
      getId(item.product),
      item.productId,
    );

  const directColor =
    asObject(
      item.color ||
        item.selectedColor,
    );

  const colorId =
    firstString(
      getId(item.colorId),
      getId(directColor),
    );

  const productColor =
    findById(
      product.colors,
      colorId,
    );

  const color =
    Object.keys(
      directColor,
    ).length > 0
      ? directColor
      : productColor;

  const directSize =
    asObject(
      item.size ||
        item.selectedSize,
    );

  const sizeId =
    firstString(
      getId(item.sizeId),
      getId(directSize),
    );

  const colorSize =
    findById(
      color.sizes,
      sizeId,
    );

  const size =
    Object.keys(
      directSize,
    ).length > 0
      ? directSize
      : colorSize;

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
      product.showPrice,
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
      showPrice,
    );

  const colorImages =
    getImageUrls(
      color.images,
    );

  const productImages =
    getImageUrls(
      product.mainImages ||
        product.images,
    );

  const directImage =
    firstString(
      item.image,
      item.imageUrl,
    );

  const images =
    Array.from(
      new Set(
        [
          directImage,
          ...colorImages,
          ...productImages,
        ].filter(Boolean),
      ),
    );

  const name =
    firstString(
      color.nameProduct,
      item.nameProduct,
      item.productName,
      product.nameProduct,
      product.name,
      "Product",
    );

  const slug =
    firstString(
      color.slugProduct,
      item.slugProduct,
      item.slug,
      product.slugProduct,
      product.slug,
    );

  const colorName =
    firstString(
      color.nameColor,
      item.colorName,
    );

  const sizeName =
    firstString(
      size.size,
      size.name,
      item.sizeLabel,
      item.sizeName,
    );

  const quantity =
    Math.max(
      1,
      Math.floor(
        positiveNumber(
          item.quantity,
          1,
        ),
      ),
    );

  const id =
    firstString(
      getId(item),
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
        showPrice,
      ),

    quantity,
  };
}

function normalizeCart(
  response: unknown,
): CartDisplayItem[] {
  const root =
    asObject(response);

  const data =
    asObject(root.data);

  const cart =
    asObject(
      root.cart ||
        data.cart ||
        data,
    );

  const rawItems =
    Array.isArray(
      cart.items,
    )
      ? cart.items
      : Array.isArray(
            root.items,
          )
        ? root.items
        : [];

  return rawItems
    .map(
      normalizeCartItem,
    )
    .filter(
      (
        item,
      ): item is CartDisplayItem =>
        Boolean(item),
    );
}

/* =========================================================
   MONEY
========================================================= */

function money(
  value: number,
) {
  return `₹${Number(
    value || 0,
  ).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits:
        2,
    },
  )}`;
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

  const loadCart =
    useCallback(
      async () => {
        if (
          commerce.isAuthenticated !==
          true
        ) {
          setItems([]);
          setLoading(false);
          return;
        }

        try {
          setLoading(true);

          const response =
            await getCart();

          setItems(
            normalizeCart(
              response,
            ),
          );
        } catch (error) {
          console.error(
            "LOAD CART ERROR:",
            error,
          );

          setItems([]);
        } finally {
          setLoading(false);
        }
      },
      [
        commerce.isAuthenticated,
      ],
    );

  useEffect(() => {
    void loadCart();
  }, [loadCart]);

  useEffect(() => {
    const handleUpdate =
      () => {
        void loadCart();
      };

    window.addEventListener(
      "hivrasoft-cart-updated",
      handleUpdate,
    );

    return () => {
      window.removeEventListener(
        "hivrasoft-cart-updated",
        handleUpdate,
      );
    };
  }, [loadCart]);

  const totalItems =
    useMemo(
      () =>
        items.reduce(
          (
            total,
            item,
          ) =>
            total +
            item.quantity,
          0,
        ),
      [items],
    );

  const subtotal =
    useMemo(
      () =>
        items.reduce(
          (
            total,
            item,
          ) =>
            total +
            item.showPrice *
              item.quantity,
          0,
        ),
      [items],
    );

  async function changeQuantity(
    item: CartDisplayItem,
    nextQuantity: number,
  ) {
    if (
      nextQuantity < 1
    ) {
      return;
    }

    try {
      setBusyItemId(
        item.id,
      );

      await updateCartItem(
        item.id,
        nextQuantity,
      );

      await loadCart();

      await commerce.refreshCommerce();
    } finally {
      setBusyItemId(null);
    }
  }

  async function removeItem(
    itemId: string,
  ) {
    try {
      setBusyItemId(
        itemId,
      );

      await removeCartItem(
        itemId,
      );

      await loadCart();

      await commerce.refreshCommerce();
    } finally {
      setBusyItemId(null);
    }
  }

  return (
    <>
      <Header />

      <div
        className="
          min-h-screen
          bg-[#FDFCFB]
        "
      >
        <div
          className="
            mx-auto
            flex
            w-full
            max-w-[1600px]
            flex-col

            lg:flex-row
            lg:items-start
          "
        >
          <AccountSidebar />

          <main
            className="
              min-w-0
              w-full
              max-w-full
              flex-1
              overflow-x-hidden
              px-3
              pb-10
              pt-4

              sm:px-5

              lg:px-7
            "
          >
            {/* HERO */}

            <div
              className="
                grid
                grid-cols-1
                gap-[18px]

                xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)]
              "
            >
              <section
                className="
                  relative
                  min-h-[165px]
                  overflow-hidden
                  rounded-[12px]
                  px-5
                  py-6

                  sm:px-[30px]
                "
                style={{
                  background: `
                    radial-gradient(circle at 84% 28%, rgba(255,255,255,.90) 0 7%, rgba(255,255,255,0) 22%),
                    radial-gradient(circle at 94% 80%, rgba(223,154,165,.22) 0 7%, rgba(223,154,165,0) 20%),
                    linear-gradient(90deg, #FAEDEB 0%, #FBEFED 54%, #F7E4E5 100%)
                  `,
                }}
              >
                <div
                  className="
                    text-[10px]
                    font-semibold
                    tracking-[0.5px]
                    text-[#282221]
                  "
                >
                  MY ACCOUNT &gt; Cart
                </div>

                <h1
                  className="
                    mt-[14px]
                    font-serif
                    text-[37px]
                    font-normal
                    leading-none
                    text-[#171313]

                    sm:text-[44px]
                  "
                >
                  My Cart
                </h1>

                <p
                  className="
                    mt-3
                    max-w-[470px]
                    text-[12px]
                    font-medium
                    leading-[1.6]
                    text-[#332E2C]
                  "
                >
                  Your selected
                  styles are waiting
                  for you. Review your
                  items and continue
                  when you&apos;re
                  ready.
                </p>
              </section>

              <section
                className="
                  min-h-[165px]
                  rounded-[12px]
                  border
                  border-[#E7DEDA]
                  bg-white
                  p-5
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-3
                  "
                >
                  <div
                    className="
                      grid
                      h-12
                      w-12
                      place-items-center
                      rounded-full
                      bg-[#FCEAEA]
                      text-[#AD2348]
                    "
                  >
                    <ShoppingBag
                      size={22}
                    />
                  </div>

                  <div>
                    <div
                      className="
                        font-serif
                        text-[17px]
                        text-[#171313]
                      "
                    >
                      Cart Summary
                    </div>

                    <div
                      className="
                        mt-1
                        text-[10px]
                        font-semibold
                        text-[#625753]
                      "
                    >
                      {totalItems}{" "}
                      {totalItems ===
                      1
                        ? "item"
                        : "items"}
                    </div>
                  </div>
                </div>

                <div
                  className="
                    mt-6
                    grid
                    grid-cols-2
                    divide-x
                    divide-[#ECE7E4]
                  "
                >
                  <div
                    className="
                      text-center
                    "
                  >
                    <strong
                      className="
                        block
                        font-serif
                        text-[18px]
                        text-[#111111]
                      "
                    >
                      {totalItems}
                    </strong>

                    <span
                      className="
                        mt-1
                        block
                        text-[9px]
                        font-semibold
                        text-[#443A37]
                      "
                    >
                      Items
                    </span>
                  </div>

                  <div
                    className="
                      text-center
                    "
                  >
                    <strong
                      className="
                        block
                        font-serif
                        text-[18px]
                        text-[#111111]
                      "
                    >
                      {money(
                        subtotal,
                      )}
                    </strong>

                    <span
                      className="
                        mt-1
                        block
                        text-[9px]
                        font-semibold
                        text-[#443A37]
                      "
                    >
                      Subtotal
                    </span>
                  </div>
                </div>
              </section>
            </div>

            {commerce.isAuthenticated ===
              null && (
              <StateBox>
                Checking your
                account...
              </StateBox>
            )}

            {commerce.isAuthenticated ===
              false && (
              <div
                className="
                  mt-[18px]
                  rounded-[12px]
                  border
                  border-[#E7DEDA]
                  bg-white
                  px-6
                  py-16
                  text-center
                "
              >
                <div
                  className="
                    mx-auto
                    grid
                    h-16
                    w-16
                    place-items-center
                    rounded-full
                    bg-[#FCEAEA]
                    text-[#A90D3B]
                  "
                >
                  <ShoppingBag />
                </div>

                <h2
                  className="
                    mt-5
                    font-serif
                    text-[27px]
                    text-[#171313]
                  "
                >
                  Login to check
                  your cart
                </h2>

                <p
                  className="
                    mx-auto
                    mt-3
                    max-w-[420px]
                    text-[12px]
                    leading-6
                    text-[#443A37]
                  "
                >
                  Sign in to view
                  products in your
                  shopping bag.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    commerce.openLoginPrompt(
                      "cart",
                    )
                  }
                  className="
                    mt-6
                    h-11
                    rounded-[8px]
                    bg-[#A90D3B]
                    px-8
                    text-[11px]
                    font-bold
                    text-white
                  "
                >
                  Login / Sign Up
                </button>
              </div>
            )}

            {commerce.isAuthenticated ===
              true &&
              loading && (
              <StateBox>
                Loading your
                cart...
              </StateBox>
            )}

            {commerce.isAuthenticated ===
              true &&
              !loading &&
              items.length ===
                0 && (
              <div
                className="
                  mt-[18px]
                  rounded-[12px]
                  border
                  border-[#E7DEDA]
                  bg-white
                  px-5
                  py-20
                  text-center
                "
              >
                <div
                  className="
                    mx-auto
                    grid
                    h-20
                    w-20
                    place-items-center
                    rounded-full
                    bg-[#FCEAEA]
                    text-[#A90D3B]
                  "
                >
                  <ShoppingBag
                    size={32}
                  />
                </div>

                <h2
                  className="
                    mt-5
                    font-serif
                    text-[28px]
                    text-[#171313]
                  "
                >
                  Your cart is empty
                </h2>

                <p
                  className="
                    mt-2
                    text-[12px]
                    font-medium
                    text-[#4A403D]
                  "
                >
                  Add something you
                  love and it will
                  appear here.
                </p>

                <Link
                  href="/"
                  className="
                    mt-6
                    inline-flex
                    h-11
                    items-center
                    justify-center
                    rounded-[8px]
                    bg-[#A90D3B]
                    px-7
                    text-[11px]
                    font-bold
                    text-white
                    no-underline
                  "
                >
                  Continue Shopping
                </Link>
              </div>
            )}

            {commerce.isAuthenticated ===
              true &&
              !loading &&
              items.length >
                0 && (
              <div
                className="
                  mt-[18px]
                  grid
                  min-w-0
                  gap-5

                  xl:grid-cols-[minmax(0,1fr)_330px]
                "
              >
                <section
                  className="
                    min-w-0
                    overflow-hidden
                    rounded-[12px]
                    border
                    border-[#E9DFDB]
                    bg-white
                  "
                >
                  {items.map(
                    (
                      item,
                      index,
                    ) => {
                      const hasDiscount =
                        item.originalPrice >
                        item.showPrice;

                      return (
                        <article
                          key={
                            item.id
                          }
                          className={`
                            grid
                            min-w-0
                            grid-cols-[82px_minmax(0,1fr)]
                            gap-4
                            px-4
                            py-5

                            sm:grid-cols-[105px_minmax(0,1fr)_auto]
                            sm:px-5

                            ${
                              index !==
                              items.length -
                                1
                                ? "border-b border-[#EEE5E1]"
                                : ""
                            }
                          `}
                        >
                          <Link
                            href={
                              item.slug
                                ? `/product/${encodeURIComponent(
                                    item.slug,
                                  )}`
                                : "#"
                            }
                            className="
                              relative
                              h-[100px]
                              w-[82px]
                              overflow-hidden
                              rounded-[10px]
                              border
                              border-[#EEE4E0]
                              bg-[#F5F1EF]

                              sm:h-[125px]
                              sm:w-[105px]
                            "
                          >
                            {item.image1 ? (
                              <img
                                src={
                                  item.image1
                                }
                                alt={
                                  item.name
                                }
                                className="
                                  h-full
                                  w-full
                                  object-cover
                                "
                              />
                            ) : (
                              <div
                                className="
                                  grid
                                  h-full
                                  w-full
                                  place-items-center
                                  text-[#A90D3B]
                                "
                              >
                                <ShoppingBag
                                  size={25}
                                />
                              </div>
                            )}
                          </Link>

                          <div
                            className="
                              min-w-0
                            "
                          >
                            <Link
                              href={
                                item.slug
                                  ? `/product/${encodeURIComponent(
                                      item.slug,
                                    )}`
                                  : "#"
                              }
                              className="
                                line-clamp-2
                                font-serif
                                text-[15px]
                                font-medium
                                leading-5
                                text-[#171313]
                                no-underline

                                sm:text-[16px]
                              "
                            >
                              {
                                item.name
                              }
                            </Link>

                            <p
                              className="
                                mt-2
                                text-[11px]
                                font-medium
                                text-[#403734]
                              "
                            >
                              {item.color &&
                                `Color: ${item.color}`}

                              {item.color &&
                                item.size &&
                                " • "}

                              {item.size &&
                                `Size: ${item.size}`}
                            </p>

                            <div
                              className="
                                mt-3
                                flex
                                items-center
                                gap-2

                                sm:hidden
                              "
                            >
                              <strong
                                className="
                                  text-[15px]
                                  text-black
                                "
                              >
                                {money(
                                  item.showPrice,
                                )}
                              </strong>

                              {hasDiscount && (
                                <span
                                  className="
                                    text-[10px]
                                    text-[#716763]
                                    line-through
                                  "
                                >
                                  {money(
                                    item.originalPrice,
                                  )}
                                </span>
                              )}
                            </div>

                            <div
                              className="
                                mt-4
                                flex
                                flex-wrap
                                items-center
                                gap-3
                              "
                            >
                              <div
                                className="
                                  flex
                                  h-9
                                  overflow-hidden
                                  rounded-[8px]
                                  border
                                  border-[#DDD1CD]
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
                                  onClick={() =>
                                    void changeQuantity(
                                      item,
                                      item.quantity -
                                        1,
                                    )
                                  }
                                  className="
                                    grid
                                    w-9
                                    place-items-center
                                    bg-white
                                    text-[#171313]

                                    disabled:opacity-30
                                  "
                                >
                                  <Minus
                                    size={14}
                                  />
                                </button>

                                <span
                                  className="
                                    grid
                                    min-w-[38px]
                                    place-items-center
                                    border-x
                                    border-[#DDD1CD]
                                    text-[11px]
                                    font-bold
                                    text-[#171313]
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
                                  onClick={() =>
                                    void changeQuantity(
                                      item,
                                      item.quantity +
                                        1,
                                    )
                                  }
                                  className="
                                    grid
                                    w-9
                                    place-items-center
                                    bg-white
                                    text-[#171313]

                                    disabled:opacity-30
                                  "
                                >
                                  <Plus
                                    size={14}
                                  />
                                </button>
                              </div>

                              <button
                                type="button"
                                disabled={
                                  busyItemId ===
                                  item.id
                                }
                                onClick={() =>
                                  void removeItem(
                                    item.id,
                                  )
                                }
                                className="
                                  inline-flex
                                  h-9
                                  items-center
                                  gap-1.5
                                  rounded-[8px]
                                  border
                                  border-[#E5C8CE]
                                  bg-[#FFF7F8]
                                  px-3
                                  text-[10px]
                                  font-bold
                                  text-[#A90D3B]

                                  disabled:opacity-40
                                "
                              >
                                <Trash2
                                  size={13}
                                />
                                Remove
                              </button>
                            </div>
                          </div>

                          <div
                            className="
                              hidden
                              min-w-[110px]
                              text-right

                              sm:block
                            "
                          >
                            <strong
                              className="
                                block
                                font-serif
                                text-[17px]
                                text-black
                              "
                            >
                              {money(
                                item.showPrice *
                                  item.quantity,
                              )}
                            </strong>

                            {hasDiscount && (
                              <span
                                className="
                                  mt-1
                                  block
                                  text-[10px]
                                  text-[#716763]
                                  line-through
                                "
                              >
                                {money(
                                  item.originalPrice *
                                    item.quantity,
                                )}
                              </span>
                            )}
                          </div>
                        </article>
                      );
                    },
                  )}
                </section>

                <aside
                  className="
                    h-fit
                    min-w-0
                    rounded-[12px]
                    border
                    border-[#E9DFDB]
                    bg-white
                    p-5

                    xl:sticky
                    xl:top-[105px]
                  "
                >
                  <h2
                    className="
                      font-serif
                      text-[20px]
                      text-[#171313]
                    "
                  >
                    Price Details
                  </h2>

                  <div
                    className="
                      mt-5
                      space-y-4
                      text-[12px]
                    "
                  >
                    <SummaryRow
                      label={`Items (${totalItems})`}
                      value={money(
                        subtotal,
                      )}
                    />

                    <SummaryRow
                      label="Delivery"
                      value="Calculated at checkout"
                    />
                  </div>

                  <div
                    className="
                      my-5
                      border-t
                      border-dashed
                      border-[#DCCFCC]
                    "
                  />

                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      gap-4
                    "
                  >
                    <span
                      className="
                        text-[13px]
                        font-bold
                        text-[#171313]
                      "
                    >
                      Total
                    </span>

                    <strong
                      className="
                        font-serif
                        text-[21px]
                        text-black
                      "
                    >
                      {money(
                        subtotal,
                      )}
                    </strong>
                  </div>

                  <Link
                    href="/account/checkout"
                    className="
                      mt-6
                      flex
                      h-12
                      w-full
                      items-center
                      justify-center
                      rounded-[8px]
                      bg-[#A90D3B]
                      text-[11px]
                      font-bold
                      text-white
                      no-underline
                      transition

                      hover:bg-[#851033]
                    "
                  >
                    Proceed to Checkout
                  </Link>
                </aside>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function StateBox({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <div
      className="
        mt-[18px]
        flex
        min-h-[180px]
        items-center
        justify-center
        rounded-[12px]
        border
        border-[#E7DEDA]
        bg-white
        px-5
        text-center
        text-[13px]
        font-semibold
        text-[#171313]
      "
    >
      {children}
    </div>
  );
}

function SummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        flex
        items-start
        justify-between
        gap-5
      "
    >
      <span
        className="
          font-medium
          text-[#4D4340]
        "
      >
        {label}
      </span>

      <strong
        className="
          text-right
          text-[#171313]
        "
      >
        {value}
      </strong>
    </div>
  );
}