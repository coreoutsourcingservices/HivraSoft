"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  Heart,
  Package,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import Header from "@/src/components/Header/Header";
import AccountSidebar from "@/app/account/components/AccountSidebar";

import {
  useStorefrontCommerce,
} from "@/src/components/Storefront/StorefrontCommerceProvider";

import {
  getWishlist,
  removeFromWishlist,
  type WishlistItem,
} from "@/lib/wishlist";

/* =========================================================
   TYPES
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
): string {
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
): string {
  if (
    typeof value === "string"
  ) {
    return value.trim();
  }

  const image =
    asObject(value);

  return firstString(
    image.url,
    image.src,
    image.image,
    image.imageUrl,
  );
}

function getImages(
  value: unknown,
): string[] {
  const values =
    asArray(value);

  const defaults =
    values.filter(
      (item) =>
        asObject(item)
          .isDefault === true,
    );

  const others =
    values.filter(
      (item) =>
        asObject(item)
          .isDefault !== true,
    );

  return Array.from(
    new Set(
      [
        ...defaults,
        ...others,
      ]
        .map(getImageUrl)
        .filter(Boolean),
    ),
  );
}

function findColor(
  product: Record<
    string,
    unknown
  >,
  colorId: string,
) {
  const colors =
    asArray(
      product.colors,
    );

  if (colorId) {
    const exact =
      colors.find(
        (color) =>
          getId(color) ===
          colorId,
      );

    if (exact) {
      return asObject(
        exact,
      );
    }
  }

  return asObject(
    colors[0],
  );
}

/* =========================================================
   NORMALIZE
========================================================= */

function normalizeWishlistItem(
  wishlistItem: WishlistItem,
): WishlistDisplayItem {
  const rawItem =
    asObject(
      wishlistItem,
    );

  const product =
    typeof wishlistItem.product ===
    "string"
      ? {}
      : asObject(
          wishlistItem.product,
        );

  const productId =
    firstString(
      getId(
        wishlistItem.product,
      ),
      rawItem.productId,
    );

  const colorId =
    firstString(
      getId(
        rawItem.colorId,
      ),
      getId(
        rawItem.color,
      ),
    );

  const directColor =
    asObject(
      rawItem.color ||
        rawItem.selectedColor,
    );

  const color =
    Object.keys(
      directColor,
    ).length > 0
      ? directColor
      : findColor(
          product,
          colorId,
        );

  const colorImages =
    getImages(
      color.images,
    );

  const productImages =
    getImages(
      product.mainImages ||
        product.images,
    );

  const images =
    Array.from(
      new Set(
        [
          ...colorImages,
          ...productImages,
        ].filter(Boolean),
      ),
    );

  const showPrice =
    positiveNumber(
      color.showPrice,
      color.sellingPrice,
      rawItem.showPrice,
      rawItem.price,
      product.showPrice,
    );

  const originalPrice =
    positiveNumber(
      color.originalPrice,
      color.mrp,
      rawItem.originalPrice,
      product.originalPrice,
      showPrice,
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
        "Saved product",
      ),

    slug:
      firstString(
        color.slugProduct,
        rawItem.slugProduct,
        product.slugProduct,
        product.slug,
      ),

    color:
      firstString(
        color.nameColor,
        rawItem.colorName,
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
        showPrice,
      ),
  };
}

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
          setLoading(false);
          return;
        }

        try {
          setLoading(true);

          const response =
            await getWishlist();

          setItems(
            response.items.map(
              normalizeWishlistItem,
            ),
          );
        } catch (error) {
          console.error(
            "LOAD WISHLIST ERROR:",
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
    void loadWishlist();
  }, [loadWishlist]);

  useEffect(() => {
    const handleUpdate =
      () => {
        void loadWishlist();
      };

    window.addEventListener(
      "hivrasoft-wishlist-updated",
      handleUpdate,
    );

    return () => {
      window.removeEventListener(
        "hivrasoft-wishlist-updated",
        handleUpdate,
      );
    };
  }, [loadWishlist]);

  /* =======================================================
     REMOVE
  ======================================================= */

  async function handleRemove(
    productId: string,
  ) {
    if (
      !productId ||
      busyProductId
    ) {
      return;
    }

    try {
      setBusyProductId(
        productId,
      );

      await removeFromWishlist(
        productId,
      );

      await loadWishlist();

      await commerce.refreshCommerce();
    } catch (error) {
      console.error(
        "REMOVE WISHLIST ERROR:",
        error,
      );
    } finally {
      setBusyProductId(null);
    }
  }

  return (
    <>
      <Header />

      <div
        className="
          min-h-screen
          w-full
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
              px-2
              pb-10
              pt-3

              sm:px-5

              lg:px-7
              lg:pt-4
            "
          >
            {/* HERO */}

            <div
              className="
                grid
                w-full
                min-w-0
                grid-cols-1
                gap-3

                xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)]
                xl:gap-[18px]
              "
            >
              <section
                className="
                  relative
                  min-w-0
                  overflow-hidden
                  rounded-[12px]
                  px-4
                  py-5

                  sm:min-h-[165px]
                  sm:px-[30px]
                  sm:py-6
                "
                style={{
                  background: `
                    radial-gradient(
                      circle at 84% 28%,
                      rgba(255,255,255,.90) 0 7%,
                      rgba(255,255,255,0) 22%
                    ),
                    linear-gradient(
                      90deg,
                      #FAEDEB 0%,
                      #FBEFED 54%,
                      #F7E4E5 100%
                    )
                  `,
                }}
              >
                <p
                  className="
                    text-[8px]
                    font-semibold
                    uppercase
                    text-[#282221]

                    sm:text-[10px]
                  "
                >
                  MY ACCOUNT &gt;
                  WISHLIST
                </p>

                <h1
                  className="
                    mt-3
                    font-serif
                    text-[30px]
                    leading-none
                    text-[#171313]

                    sm:text-[44px]
                  "
                >
                  My Wishlist
                </h1>

                <p
                  className="
                    mt-3
                    max-w-[470px]
                    text-[9px]
                    font-medium
                    leading-[1.6]
                    text-[#332E2C]

                    sm:text-[12px]
                  "
                >
                  Save your favorite
                  finds and keep
                  everything you love
                  together in one
                  place.
                </p>
              </section>

              {/* SUMMARY */}

              <section
                className="
                  min-w-0
                  rounded-[12px]
                  border
                  border-[#E7DEDA]
                  bg-white
                  p-4

                  sm:min-h-[165px]
                  sm:p-5
                "
              >
                <div
                  className="
                    flex
                    min-w-0
                    items-center
                    justify-between
                    gap-2
                  "
                >
                  <div
                    className="
                      flex
                      min-w-0
                      items-center
                      gap-2
                    "
                  >
                    <div
                      className="
                        grid
                        h-10
                        w-10
                        shrink-0
                        place-items-center
                        rounded-full
                        bg-[#FCEAEA]
                        text-[#AD2348]

                        sm:h-12
                        sm:w-12
                      "
                    >
                      <Heart
                        size={19}
                      />
                    </div>

                    <span
                      className="
                        truncate
                        font-serif
                        text-[14px]
                        text-[#171313]

                        sm:text-[17px]
                      "
                    >
                      Wishlist Summary
                    </span>
                  </div>

                  <span
                    className="
                      shrink-0
                      rounded-[7px]
                      bg-[#F7F2F0]
                      px-2
                      py-1.5
                      text-[7px]
                      font-bold

                      sm:text-[9px]
                    "
                  >
                    {items.length}{" "}
                    {items.length ===
                    1
                      ? "Item"
                      : "Items"}
                  </span>
                </div>

                <div
                  className="
                    mt-5
                    grid
                    grid-cols-2
                    divide-x
                    divide-[#ECE7E4]
                  "
                >
                  <SummaryStat
                    value={
                      loading
                        ? "—"
                        : String(
                            items.length,
                          )
                    }
                    label="Saved Products"
                  />

                  <SummaryStat
                    value={
                      items.length >
                      0
                        ? "Ready"
                        : "Empty"
                    }
                    label="Wishlist Status"
                  />
                </div>
              </section>
            </div>

            {/* AUTH */}

            {commerce.isAuthenticated ===
              null && (
              <StateBox>
                Checking your
                account...
              </StateBox>
            )}

            {commerce.isAuthenticated ===
              false && (
              <StateBox>
                <div>
                  <Heart
                    className="
                      mx-auto
                      text-[#A90D3B]
                    "
                    size={29}
                  />

                  <h2
                    className="
                      mt-4
                      font-serif
                      text-[23px]
                    "
                  >
                    Login to check
                    your wishlist
                  </h2>

                  <button
                    type="button"
                    onClick={() =>
                      commerce.openLoginPrompt(
                        "wishlist",
                      )
                    }
                    className="
                      mt-5
                      rounded-[8px]
                      bg-[#A90D3B]
                      px-6
                      py-3
                      text-[10px]
                      font-bold
                      text-white
                    "
                  >
                    Login / Sign Up
                  </button>
                </div>
              </StateBox>
            )}

            {commerce.isAuthenticated ===
              true &&
              loading && (
              <StateBox>
                Loading wishlist...
              </StateBox>
            )}

            {/* EMPTY */}

            {commerce.isAuthenticated ===
              true &&
              !loading &&
              items.length ===
                0 && (
              <section
                className="
                  mt-3
                  rounded-[12px]
                  border
                  border-[#E7DEDA]
                  bg-white
                  px-5
                  py-16
                  text-center
                "
              >
                <Heart
                  className="
                    mx-auto
                    text-[#A90D3B]
                  "
                  size={34}
                />

                <h2
                  className="
                    mt-4
                    font-serif
                    text-[26px]
                  "
                >
                  Your wishlist is
                  empty
                </h2>

                <Link
                  href="/"
                  className="
                    mt-5
                    inline-flex
                    items-center
                    gap-2
                    rounded-[8px]
                    bg-[#A90D3B]
                    px-6
                    py-3
                    text-[10px]
                    font-bold
                    text-white
                  "
                >
                  <ShoppingBag
                    size={14}
                  />
                  Start Shopping
                </Link>
              </section>
            )}

            {/* PRODUCTS */}

            {commerce.isAuthenticated ===
              true &&
              !loading &&
              items.length >
                0 && (
              <section
                className="
                  mt-3
                  grid
                  w-full
                  min-w-0
                  grid-cols-2
                  gap-[6px]

                  sm:mt-[18px]
                  sm:gap-4

                  lg:grid-cols-3

                  2xl:grid-cols-4
                "
              >
                {items.map(
                  (
                    item,
                    index,
                  ) => {
                    const hasSecondImage =
                      Boolean(
                        item.image2 &&
                          item.image2 !==
                            item.image1,
                      );

                    const hasDiscount =
                      item.originalPrice >
                      item.showPrice;

                    const removing =
                      busyProductId ===
                      item.productId;

                    return (
                      <article
                        key={`${item.productId}-${item.colorId}-${index}`}
                        className="
                          min-w-0
                          max-w-full
                          overflow-hidden
                          rounded-[8px]
                          border
                          border-[#E9DFDB]
                          bg-white

                          sm:rounded-[12px]
                        "
                      >
                        <div
                          className="
                            relative
                            w-full
                            min-w-0
                            overflow-hidden
                            bg-[#F5F1EF]
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
                              group
                              relative
                              block
                              aspect-[0.77]
                              w-full
                              overflow-hidden
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
                                        ? "group-hover:opacity-0"
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

                                      group-hover:opacity-100
                                    "
                                  />
                                )}
                              </>
                            ) : (
                              <div
                                className="
                                  grid
                                  h-full
                                  place-items-center
                                "
                              >
                                <Package
                                  size={28}
                                />
                              </div>
                            )}
                          </Link>

                          <div
                            className="
                              absolute
                              right-1.5
                              top-1.5
                              grid
                              h-7
                              w-7
                              place-items-center
                              rounded-full
                              bg-white
                              text-[#A90D3B]
                              shadow
                            "
                          >
                            <Heart
                              size={13}
                              fill="currentColor"
                            />
                          </div>
                        </div>

                        <div
                          className="
                            min-w-0
                            p-2

                            sm:p-4
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
                              block
                              min-h-[30px]
                              break-words
                              font-serif
                              text-[9px]
                              font-medium
                              leading-[14px]
                              text-[#171313]

                              sm:min-h-[42px]
                              sm:text-[15px]
                              sm:leading-5
                            "
                          >
                            {item.name}
                          </Link>

                          {item.color && (
                            <p
                              className="
                                mt-1
                                truncate
                                text-[7px]
                                text-[#5B504C]

                                sm:text-[10px]
                              "
                            >
                              Color:{" "}
                              <strong>
                                {
                                  item.color
                                }
                              </strong>
                            </p>
                          )}

                          <div
                            className="
                              mt-1.5
                              flex
                              min-w-0
                              flex-wrap
                              items-center
                              gap-1

                              sm:mt-4
                              sm:gap-2
                            "
                          >
                            <strong
                              className="
                                whitespace-nowrap
                                font-serif
                                text-[13px]
                                text-black

                                sm:text-[18px]
                              "
                            >
                              {money(
                                item.showPrice,
                              )}
                            </strong>

                            {hasDiscount && (
                              <span
                                className="
                                  text-[6px]
                                  text-[#766B67]
                                  line-through

                                  sm:text-[10px]
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
                              mt-2
                              grid
                              grid-cols-1
                              gap-1

                              sm:mt-5
                              sm:grid-cols-2
                              sm:gap-2
                            "
                          >
                            {item.slug && (
                              <Link
                                href={`/product/${encodeURIComponent(
                                  item.slug,
                                )}`}
                                className="
                                  flex
                                  h-7
                                  items-center
                                  justify-center
                                  rounded-[5px]
                                  border
                                  border-[#DCCFCC]
                                  bg-white
                                  px-1
                                  text-[6px]
                                  font-bold
                                  text-[#171313]

                                  sm:h-10
                                  sm:text-[10px]
                                "
                              >
                                View Product
                              </Link>
                            )}

                            <button
                              type="button"
                              disabled={
                                removing
                              }
                              onClick={() =>
                                void handleRemove(
                                  item.productId,
                                )
                              }
                              className="
                                flex
                                h-7
                                items-center
                                justify-center
                                gap-1
                                rounded-[5px]
                                border
                                border-[#E5C8CE]
                                bg-[#FFF7F8]
                                text-[6px]
                                font-bold
                                text-[#A90D3B]

                                disabled:opacity-40

                                sm:h-10
                                sm:text-[10px]
                              "
                            >
                              <Trash2
                                size={9}
                              />

                              {removing
                                ? "Removing"
                                : "Remove"}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  },
                )}
              </section>
            )}
          </main>
        </div>
      </div>
    </>
  );
}

/* =========================================================
   STATE
========================================================= */

function StateBox({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      className="
        mt-3
        flex
        min-h-[180px]
        items-center
        justify-center
        rounded-[12px]
        border
        border-[#E7DEDA]
        bg-white
        px-4
        text-center
        text-[12px]
        text-[#171313]
      "
    >
      {children}
    </div>
  );
}

/* =========================================================
   SUMMARY
========================================================= */

function SummaryStat({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div
      className="
        min-w-0
        px-1
        text-center
      "
    >
      <strong
        className="
          block
          truncate
          font-serif
          text-[14px]
          text-black

          sm:text-[18px]
        "
      >
        {value}
      </strong>

      <span
        className="
          mt-1
          block
          text-[6px]
          font-semibold
          text-[#403633]

          sm:text-[9px]
        "
      >
        {label}
      </span>
    </div>
  );
}