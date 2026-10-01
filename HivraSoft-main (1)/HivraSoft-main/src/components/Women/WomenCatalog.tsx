"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ApiError,
  apiFetch,
  requestLogin,
} from "@/lib/api";

import {
  addToCart,
} from "@/lib/cart";

import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
} from "@/lib/wishlist";

import type {
  StorefrontCategoryNode,
} from "@/src/services/categories";

import type {
  CatalogBanner,
  CatalogProduct,
  CatalogSize,
} from "@/src/types/catalog";

/* =========================================================
   PROPS
========================================================= */

type WomenCatalogProps = {
  products: CatalogProduct[];

  banners: CatalogBanner[];

  title: string;

  description: string;

  categoryRoot: StorefrontCategoryNode;

  categoryPath: string[];
};

/* =========================================================
   SORT
========================================================= */

type SortValue =
  | "featured"
  | "newest"
  | "price-low"
  | "price-high";

/* =========================================================
   PREMIUM NOTIFICATION
========================================================= */

type ToastState =
  | {
      title: string;

      subtitle?: string;

      image?: string;

      type:
        | "success"
        | "error";
    }
  | null;

/* =========================================================
   WISHLIST
========================================================= */

type WishlistVariantState = {
  itemId: string;
};

/* =========================================================
   CATEGORY URL
========================================================= */

function categoryHref(
  slugs: string[]
): string {
  if (
    slugs.length ===
    0
  ) {
    return "/women";
  }

  return `/women/${slugs
    .map(
      encodeURIComponent
    )
    .join("/")}`;
}

/* =========================================================
   CATEGORY SORT
========================================================= */

function sortCategoryNodes(
  nodes: StorefrontCategoryNode[]
) {
  return [
    ...nodes,
  ].sort(
    (
      first,
      second
    ) => {
      if (
        first.sortOrder !==
        second.sortOrder
      ) {
        return (
          first.sortOrder -
          second.sortOrder
        );
      }

      return first.name.localeCompare(
        second.name
      );
    }
  );
}

/* =========================================================
   RESOLVE CATEGORY
========================================================= */

function resolveSelectedNodes(
  root: StorefrontCategoryNode,
  path: string[]
): StorefrontCategoryNode[] {
  const result:
    StorefrontCategoryNode[] = [];

  let children =
    root.children;

  for (
    const slug of path
  ) {
    const match =
      children.find(
        (child) =>
          child.slug ===
          slug
      );

    if (!match) {
      break;
    }

    result.push(
      match
    );

    children =
      match.children;
  }

  return result;
}

/* =========================================================
   AUTH
========================================================= */

async function checkCustomerLoggedIn(): Promise<boolean> {
  try {
    await apiFetch(
      "/api/auth/me",
      {
        method: "GET",
      }
    );

    return true;
  } catch {
    return false;
  }
}

/* =========================================================
   VARIANT KEY
========================================================= */

function productVariantKey(
  productId: string,
  colorId: string
) {
  return `${productId}:${colorId}`;
}

/* =========================================================
   WISHLIST PRODUCT ID
========================================================= */

function extractWishlistProductId(
  product: unknown
): string {
  if (!product) {
    return "";
  }

  if (
    typeof product ===
    "string"
  ) {
    return product;
  }

  if (
    typeof product !==
    "object"
  ) {
    return "";
  }

  const value =
    product as {
      _id?: string;

      id?: string;
    };

  return String(
    value._id ||
      value.id ||
      ""
  ).trim();
}

/* =========================================================
   WISHLIST MAP
========================================================= */

function wishlistVariantMap(
  wishlist: unknown
) {
  const map =
    new Map<
      string,
      WishlistVariantState
    >();

  if (
    !wishlist ||
    typeof wishlist !==
      "object"
  ) {
    return map;
  }

  const items =
    (
      wishlist as {
        items?: unknown;
      }
    ).items;

  if (
    !Array.isArray(
      items
    )
  ) {
    return map;
  }

  items.forEach(
    (rawItem) => {
      if (
        !rawItem ||
        typeof rawItem !==
          "object"
      ) {
        return;
      }

      const item =
        rawItem as {
          _id?: string;

          product?: unknown;

          colorId?:
            | string
            | null;
        };

      const productId =
        extractWishlistProductId(
          item.product
        );

      const colorId =
        String(
          item.colorId ||
            ""
        ).trim();

      const itemId =
        String(
          item._id ||
            ""
        ).trim();

      if (
        !productId ||
        !colorId ||
        !itemId
      ) {
        return;
      }

      map.set(
        productVariantKey(
          productId,
          colorId
        ),
        {
          itemId,
        }
      );
    }
  );

  return map;
}

/* =========================================================
   PREMIUM TOAST

   White card
   Maroon accent
   Product image
========================================================= */

function Toast({
  toast,
  onClose,
}: {
  toast: ToastState;

  onClose: () => void;
}) {
  if (!toast) {
    return null;
  }

  return (
    <div
      className="
        fixed
        right-5
        top-[110px]
        z-[150]

        w-[calc(100%-40px)]
        max-w-[390px]

        overflow-hidden

        rounded-[14px]

        border
        border-black/10

        bg-white

        shadow-[0_12px_40px_rgba(0,0,0,0.18)]
      "
    >
      {/* ACCENT */}

      <div
        className={`
          absolute
          bottom-0
          left-0
          top-0

          w-[4px]

          ${
            toast.type ===
            "success"
              ? "bg-[#B31345]"
              : "bg-[#D64545]"
          }
        `}
      />

      <div
        className="
          flex
          items-center
          gap-3

          px-4
          py-4
        "
      >
        {/* IMAGE */}

        {toast.image ? (
          <img
            src={
              toast.image
            }
            alt=""
            className="
              h-[58px]
              w-[48px]

              flex-none

              rounded-[8px]

              object-cover

              bg-[#F6F2EF]
            "
          />
        ) : (
          <div
            className={`
              flex
              h-10
              w-10
              flex-none
              items-center
              justify-center

              rounded-full

              text-sm
              font-bold
              text-white

              ${
                toast.type ===
                "success"
                  ? "bg-[#B31345]"
                  : "bg-[#D64545]"
              }
            `}
          >
            {toast.type ===
            "success"
              ? "✓"
              : "!"}
          </div>
        )}

        {/* TEXT */}

        <div
          className="
            min-w-0
            flex-1
          "
        >
          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <span
              className={`
                flex
                h-[18px]
                w-[18px]
                items-center
                justify-center

                rounded-full

                text-[10px]
                font-bold
                text-white

                ${
                  toast.type ===
                  "success"
                    ? "bg-[#B31345]"
                    : "bg-[#D64545]"
                }
              `}
            >
              {toast.type ===
              "success"
                ? "✓"
                : "!"}
            </span>

            <p
              className="
                truncate

                text-[13px]
                font-bold

                text-[#211A18]
              "
            >
              {
                toast.title
              }
            </p>
          </div>

          {toast.subtitle && (
            <p
              className="
                mt-1

                line-clamp-2

                text-[11px]
                leading-4

                text-black/55
              "
            >
              {
                toast.subtitle
              }
            </p>
          )}
        </div>

        {/* CLOSE */}

        <button
          type="button"
          aria-label="Close notification"
          onClick={
            onClose
          }
          className="
            self-start

            px-1

            text-lg

            text-black/35

            transition

            hover:text-black
          "
        >
          ×
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   BANNER

   Empty banners => completely hidden.
========================================================= */

function WomenBannerSlider({
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
    activeIndex,
    setActiveIndex,
  ] =
    useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [
    validBanners.length,
  ]);

  useEffect(() => {
    if (
      validBanners.length <=
      1
    ) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          setActiveIndex(
            (current) =>
              (current + 1) %
              validBanners.length
          );
        },
        4500
      );

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, [
    validBanners.length,
  ]);

  /*
   * IMPORTANT:
   *
   * Current category image nahi hai:
   * kuch bhi render nahi hoga.
   */

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
    >
      <div
        className="
          relative

          aspect-[1600/558]

          w-full
        "
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
                "#"
              }
              className={`
                absolute
                inset-0
                block

                transition-opacity
                duration-700

                ${
                  activeIndex ===
                  index
                    ? "pointer-events-auto opacity-100"
                    : "pointer-events-none opacity-0"
                }
              `}
            >
              <img
                src={
                  banner.image
                }
                alt={
                  banner.alt ||
                  "Category banner"
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

        {/* CONTROLS */}

        {validBanners.length >
          1 && (
          <>
            <button
              type="button"
              aria-label="Previous banner"
              onClick={() =>
                setActiveIndex(
                  (current) =>
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

                text-2xl

                shadow
              "
            >
              ‹
            </button>

            <button
              type="button"
              aria-label="Next banner"
              onClick={() =>
                setActiveIndex(
                  (current) =>
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

                text-2xl

                shadow
              "
            >
              ›
            </button>

            <div
              className="
                absolute
                bottom-4
                left-1/2
                z-20

                flex
                -translate-x-1/2
                items-center
                gap-2
              "
            >
              {validBanners.map(
                (
                  banner,
                  index
                ) => (
                  <button
                    key={`${banner.image}-dot-${index}`}
                    type="button"
                    aria-label={`Banner ${
                      index +
                      1
                    }`}
                    onClick={() =>
                      setActiveIndex(
                        index
                      )
                    }
                    className={`
                      h-2
                      rounded-full

                      transition-all

                      ${
                        activeIndex ===
                        index
                          ? "w-8 bg-[#B31345]"
                          : "w-2 bg-white"
                      }
                    `}
                  />
                )
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/* =========================================================
   CATEGORY NAVIGATION

   SAME DESIGN.
   HEADER PART ABHI CHANGE NAHI KIYA.
========================================================= */

function CategoryNavigation({
  categoryRoot,
  categoryPath,
}: {
  categoryRoot: StorefrontCategoryNode;

  categoryPath: string[];
}) {
  const selectedNodes =
    useMemo(
      () =>
        resolveSelectedNodes(
          categoryRoot,
          categoryPath
        ),
      [
        categoryRoot,
        categoryPath,
      ]
    );

  const rootChildren =
    useMemo(
      () =>
        sortCategoryNodes(
          categoryRoot.children
        ),
      [
        categoryRoot.children,
      ]
    );

  return (
    <section
      className="
        mx-auto
        mt-12

        w-[calc(100%-64px)]

        rounded-[20px]

        border
        border-[#DDD2C5]

        bg-[#F0E6DA]

        px-6
        py-5
      "
    >
      {/* FIRST ROW */}

      <div
        className="
          flex
          flex-wrap
          items-center
          justify-center
          gap-3

          border-b
          border-[#DDD2C5]

          pb-5
        "
      >
        <Link
          href="/women"
          className={`
            rounded-full

            px-6
            py-3

            text-[11px]
            font-semibold
            tracking-[0.12em]

            transition

            ${
              categoryPath.length ===
              0
                ? "bg-[#B31345] text-white"
                : "bg-white text-[#211A18] hover:bg-[#B31345] hover:text-white"
            }
          `}
        >
          ALL WOMEN
        </Link>

        {rootChildren.map(
          (node) => {
            const active =
              categoryPath[0] ===
              node.slug;

            return (
              <Link
                key={
                  node.id
                }
                href={categoryHref(
                  [
                    node.slug,
                  ]
                )}
                className={`
                  rounded-full

                  px-6
                  py-3

                  text-[11px]
                  font-semibold
                  uppercase
                  tracking-[0.12em]

                  transition

                  ${
                    active
                      ? "bg-[#B31345] text-white"
                      : "bg-white text-[#211A18] hover:bg-[#B31345] hover:text-white"
                  }
                `}
              >
                {
                  node.name
                }
              </Link>
            );
          }
        )}
      </div>

      {/* CHILD LEVEL */}

      {selectedNodes.map(
        (
          node,
          nodeIndex
        ) => {
          const children =
            sortCategoryNodes(
              node.children
            );

          if (
            children.length ===
            0
          ) {
            return null;
          }

          const basePath =
            categoryPath.slice(
              0,
              nodeIndex +
                1
            );

          const nextSelectedSlug =
            categoryPath[
              nodeIndex +
                1
            ];

          return (
            <div
              key={
                node.id
              }
              className="
                flex
                flex-wrap
                items-center
                justify-center

                gap-x-8
                gap-y-3

                border-b
                border-[#DDD2C5]

                py-5

                last:border-b-0
                last:pb-0
              "
            >
              <Link
                href={categoryHref(
                  basePath
                )}
                className={`
                  border-b-2

                  px-1
                  pb-2

                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.13em]

                  transition

                  ${
                    !nextSelectedSlug
                      ? "border-[#B31345] text-[#B31345]"
                      : "border-transparent text-[#5A4A43] hover:text-[#B31345]"
                  }
                `}
              >
                ALL{" "}
                {
                  node.name
                }
              </Link>

              {children.map(
                (
                  child
                ) => {
                  const href =
                    categoryHref(
                      [
                        ...basePath,

                        child.slug,
                      ]
                    );

                  const active =
                    nextSelectedSlug ===
                    child.slug;

                  return (
                    <Link
                      key={
                        child.id
                      }
                      href={
                        href
                      }
                      className={`
                        border-b-2

                        px-1
                        pb-2

                        text-[10px]
                        font-semibold
                        uppercase
                        tracking-[0.13em]

                        transition

                        ${
                          active
                            ? "border-[#B31345] text-[#B31345]"
                            : "border-transparent text-[#5A4A43] hover:text-[#B31345]"
                        }
                      `}
                    >
                      {
                        child.name
                      }
                    </Link>
                  );
                }
              )}
            </div>
          );
        }
      )}
    </section>
  );
}

/* =========================================================
   SIZE MODAL
========================================================= */

function SizeModal({
  product,
  busy,
  onClose,
  onSelect,
}: {
  product:
    | CatalogProduct
    | null;

  busy: boolean;

  onClose: () => void;

  onSelect: (
    size: CatalogSize
  ) => void;
}) {
  if (!product) {
    return null;
  }

  const sizes =
    product.sizes.filter(
      (size) =>
        size.stock >
        0
    );

  return (
    <div
      className="
        fixed
        inset-0
        z-[120]

        flex
        items-center
        justify-center

        bg-black/35

        px-4
      "
    >
      <div
        className="
          w-full
          max-w-[430px]

          rounded-2xl

          bg-white

          p-5

          shadow-2xl
        "
      >
        <div
          className="
            flex
            items-start
            gap-4
          "
        >
          <img
            src={
              product.image1
            }
            alt={
              product.name
            }
            className="
              h-[72px]
              w-[58px]

              rounded-lg

              object-cover
            "
          />

          <div
            className="
              min-w-0
              flex-1
            "
          >
            <h3
              className="
                line-clamp-2

                text-sm
                font-semibold
              "
            >
              {
                product.name
              }
            </h3>

            <p
              className="
                mt-1

                text-[11px]
                text-black/50
              "
            >
              Color:{" "}
              {product.colorName ||
                "Default"}
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              busy
            }
            className="
              text-xl
              text-black/45
            "
          >
            ×
          </button>
        </div>

        <p
          className="
            mt-5

            border-b
            border-black/70

            pb-3

            text-[12px]
            font-medium
          "
        >
          Select a Size
        </p>

        <div
          className="
            mt-4

            flex
            flex-wrap
            gap-3
          "
        >
          {sizes.map(
            (size) => (
              <button
                key={
                  size.id
                }
                type="button"
                disabled={
                  busy
                }
                onClick={() =>
                  onSelect(
                    size
                  )
                }
                className="
                  min-w-[48px]

                  rounded-full

                  border
                  border-black/15

                  px-4
                  py-2.5

                  text-[12px]

                  transition

                  hover:border-[#B31345]
                  hover:text-[#B31345]

                  disabled:opacity-50
                "
              >
                {
                  size.label
                }
              </button>
            )
          )}
        </div>

        {sizes.length ===
          0 && (
          <p
            className="
              mt-4

              text-sm
              text-[#B31345]
            "
          >
            No size is
            currently in stock.
          </p>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   PRODUCT CARD
========================================================= */

function ProductCard({
  product,
  wished,
  wishlistBusy,
  onWishlist,
  onAddToBag,
}: {
  product: CatalogProduct;

  wished: boolean;

  wishlistBusy: boolean;

  onWishlist: () => void;

  onAddToBag: () => void;
}) {
  const hasDiscount =
    product.originalPrice >
      product.showPrice &&
    product.showPrice >
      0;

  return (
    <article
      className="
        min-w-0
      "
    >
      {/* IMAGE */}

      <div
        className="
          group
          relative

          overflow-hidden

          rounded-[14px]

          bg-white
        "
      >
        <Link
          href={`/product/${encodeURIComponent(
            product.slug
          )}`}
        >
          <div
            className="
              relative

              aspect-[0.79]

              overflow-hidden

              bg-[#F5F2EF]
            "
          >
            {product.image1 ? (
              <>
                <img
                  src={
                    product.image1
                  }
                  alt={`${product.name} - ${product.colorName}`}
                  className={`
                    absolute
                    inset-0

                    h-full
                    w-full

                    object-cover

                    transition
                    duration-500

                    ${
                      product.image2 &&
                      product.image2 !==
                        product.image1
                        ? "group-hover:opacity-0"
                        : ""
                    }
                  `}
                />

                {product.image2 &&
                  product.image2 !==
                    product.image1 && (
                    <img
                      src={
                        product.image2
                      }
                      alt=""
                      className="
                        absolute
                        inset-0

                        h-full
                        w-full

                        object-cover

                        opacity-0

                        transition
                        duration-500

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

                  text-sm
                  text-black/35
                "
              >
                No image
              </div>
            )}
          </div>
        </Link>

        {/* DISCOUNT */}

        {product.discountPercent >
          0 && (
          <span
            className="
              absolute
              left-3
              top-3
              z-20

              rounded-full

              bg-[#B31345]

              px-3
              py-1.5

              text-[9px]
              font-bold
              text-white
            "
          >
            {
              product.discountPercent
            }
            % OFF
          </span>
        )}

        {/* HEART */}

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
          onClick={
            onWishlist
          }
          className={`
            absolute
            right-3
            top-3
            z-30

            flex
            h-10
            w-10
            items-center
            justify-center

            rounded-full

            border
            border-[#B31345]/20

            text-[20px]

            shadow-sm

            transition

            disabled:opacity-60

            ${
              wished
                ? "bg-[#B31345] text-white"
                : "bg-white/95 text-[#B31345] hover:bg-[#B31345] hover:text-white"
            }
          `}
        >
          {wished
            ? "♥"
            : "♡"}
        </button>
      </div>

      {/* ADD TO BAG */}

      <button
        type="button"
        onClick={
          onAddToBag
        }
        className="
          mt-2

          h-10
          w-full

          rounded-[8px]

          bg-[#B31345]

          text-[10px]
          font-bold
          tracking-[0.14em]
          text-white

          transition

          hover:bg-[#8F1037]
        "
      >
        ADD TO BAG
      </button>

      {/* NAME */}

      <Link
        href={`/product/${encodeURIComponent(
          product.slug
        )}`}
        className="
          mt-3
          block

          truncate

          px-1

          text-[12px]
          font-medium
        "
      >
        {
          product.name
        }
      </Link>

      {/* COLOR */}

      {product.colorName && (
        <p
          className="
            mt-1
            px-1

            text-[10px]
            text-black/45
          "
        >
          Color:{" "}
          {
            product.colorName
          }
        </p>
      )}

      {/* PRICE */}

      <div
        className="
          mt-2

          flex
          flex-wrap
          items-center

          gap-x-2
          gap-y-1

          px-1
        "
      >
        {product.showPrice >
        0 ? (
          <span
            className="
              text-[14px]
              font-bold
            "
          >
            ₹
            {product.showPrice.toLocaleString(
              "en-IN"
            )}
          </span>
        ) : (
          <span
            className="
              text-[12px]
              text-[#B31345]
            "
          >
            Price unavailable
          </span>
        )}

        {hasDiscount && (
          <span
            className="
              text-[10px]
              text-black/35
              line-through
            "
          >
            ₹
            {product.originalPrice.toLocaleString(
              "en-IN"
            )}
          </span>
        )}

        {product.discountPercent >
          0 && (
          <span
            className="
              rounded-full

              bg-[#F7E4EA]

              px-2
              py-1

              text-[8px]
              font-bold

              text-[#B31345]
            "
          >
            {
              product.discountPercent
            }
            % OFF
          </span>
        )}

        {product.discountAmount >
          0 && (
          <span
            className="
              w-full

              text-[9px]
              font-medium

              text-[#18834B]
            "
          >
            Save ₹
            {product.discountAmount.toLocaleString(
              "en-IN"
            )}
          </span>
        )}
      </div>
    </article>
  );
}

/* =========================================================
   MAIN
========================================================= */

export default function WomenCatalog({
  products,
  banners,
  title,
  description,
  categoryRoot,
  categoryPath,
}: WomenCatalogProps) {
  const [
    sort,
    setSort,
  ] =
    useState<SortValue>(
      "featured"
    );

  const [
    toast,
    setToast,
  ] =
    useState<ToastState>(
      null
    );

  const [
    sizeProduct,
    setSizeProduct,
  ] =
    useState<
      CatalogProduct | null
    >(null);

  const [
    cartBusy,
    setCartBusy,
  ] =
    useState(false);

  const [
    wishlistBusyKey,
    setWishlistBusyKey,
  ] =
    useState<
      string | null
    >(null);

  const [
    wishlistMap,
    setWishlistMap,
  ] =
    useState<
      Map<
        string,
        WishlistVariantState
      >
    >(
      () =>
        new Map()
    );

  /* =======================================================
     PREMIUM NOTIFICATION HELPER
  ======================================================= */

  const showMessage =
    useCallback(
      (
        title: string,

        type:
          | "success"
          | "error" =
          "success",

        subtitle?: string,

        image?: string
      ) => {
        setToast({
          title,

          type,

          subtitle,

          image,
        });

        window.setTimeout(
          () => {
            setToast(
              null
            );
          },
          3000
        );
      },
      []
    );

  /* =======================================================
     WISHLIST LOAD
  ======================================================= */

  const loadWishlist =
    useCallback(
      async () => {
        try {
          const wishlist =
            await getWishlist();

          setWishlistMap(
            wishlistVariantMap(
              wishlist
            )
          );
        } catch (
          error
        ) {
          if (
            error instanceof
              ApiError &&
            (
              error.status ===
                401 ||
              error.status ===
                403
            )
          ) {
            setWishlistMap(
              new Map()
            );

            return;
          }

          setWishlistMap(
            new Map()
          );
        }
      },
      []
    );

  useEffect(() => {
    void loadWishlist();

    const update =
      () => {
        void loadWishlist();
      };

    window.addEventListener(
      "hivrasoft-auth-changed",
      update
    );

    window.addEventListener(
      "hivrasoft-wishlist-updated",
      update
    );

    return () => {
      window.removeEventListener(
        "hivrasoft-auth-changed",
        update
      );

      window.removeEventListener(
        "hivrasoft-wishlist-updated",
        update
      );
    };
  }, [
    loadWishlist,
  ]);

  /* =======================================================
     SORT
  ======================================================= */

  const sortedProducts =
    useMemo(() => {
      const copy = [
        ...products,
      ];

      if (
        sort ===
        "price-low"
      ) {
        return copy.sort(
          (
            first,
            second
          ) =>
            first.showPrice -
            second.showPrice
        );
      }

      if (
        sort ===
        "price-high"
      ) {
        return copy.sort(
          (
            first,
            second
          ) =>
            second.showPrice -
            first.showPrice
        );
      }

      if (
        sort ===
        "newest"
      ) {
        return copy.sort(
          (
            first,
            second
          ) =>
            Number(
              second.isNewLaunch
            ) -
            Number(
              first.isNewLaunch
            )
        );
      }

      return copy.sort(
        (
          first,
          second
        ) =>
          Number(
            second.isFeatured
          ) -
          Number(
            first.isFeatured
          )
      );
    }, [
      products,
      sort,
    ]);

  /* =======================================================
     ADD TO BAG
  ======================================================= */

  const handleAddToBag =
    useCallback(
      async (
        product: CatalogProduct
      ) => {
        const loggedIn =
          await checkCustomerLoggedIn();

        if (!loggedIn) {
          requestLogin();

          showMessage(
            "Login required",
            "error",
            "Please login to add products to your bag."
          );

          return;
        }

        if (
          !product.productId ||
          !product.colorId
        ) {
          showMessage(
            "Product unavailable",
            "error"
          );

          return;
        }

        const hasStock =
          product.sizes.some(
            (size) =>
              size.stock >
              0
          );

        if (!hasStock) {
          showMessage(
            "Out of stock",
            "error",
            `${product.name} is currently unavailable.`
          );

          return;
        }

        setSizeProduct(
          product
        );
      },
      [
        showMessage,
      ]
    );

  /* =======================================================
     SIZE -> CART
  ======================================================= */

  const handleSizeSelect =
    useCallback(
      async (
        size: CatalogSize
      ) => {
        if (
          !sizeProduct ||
          cartBusy
        ) {
          return;
        }

        try {
          setCartBusy(
            true
          );

          await addToCart({
            productId:
              sizeProduct.productId,

            colorId:
              sizeProduct.colorId,

            sizeId:
              size.id,

            quantity:
              1,
          });

          /* =================================================
             PREMIUM CART NOTIFICATION
          ================================================= */

          showMessage(
            "Added to bag",
            "success",
            `${sizeProduct.name} • ${sizeProduct.colorName} • Size ${size.label}`,
            sizeProduct.image1
          );

          setSizeProduct(
            null
          );
        } catch (
          error
        ) {
          if (
            error instanceof
              ApiError &&
            (
              error.status ===
                401 ||
              error.status ===
                403
            )
          ) {
            requestLogin();

            setSizeProduct(
              null
            );

            showMessage(
              "Login required",
              "error",
              "Please login to add products to your bag."
            );

            return;
          }

          showMessage(
            "Unable to add product",
            "error",
            error instanceof
              Error
              ? error.message
              : undefined
          );
        } finally {
          setCartBusy(
            false
          );
        }
      },
      [
        cartBusy,
        showMessage,
        sizeProduct,
      ]
    );

  /* =======================================================
     WISHLIST
  ======================================================= */

  const handleWishlist =
    useCallback(
      async (
        product: CatalogProduct
      ) => {
        const key =
          productVariantKey(
            product.productId,
            product.colorId
          );

        if (
          wishlistBusyKey ===
          key
        ) {
          return;
        }

        const loggedIn =
          await checkCustomerLoggedIn();

        if (!loggedIn) {
          requestLogin();

          showMessage(
            "Login required",
            "error",
            "Please login to use your wishlist."
          );

          return;
        }

        try {
          setWishlistBusyKey(
            key
          );

          const existing =
            wishlistMap.get(
              key
            );

          /* REMOVE */

          if (
            existing?.itemId
          ) {
            const wishlist =
              await removeFromWishlist(
                existing.itemId
              );

            setWishlistMap(
              wishlistVariantMap(
                wishlist
              )
            );

            showMessage(
              "Removed from wishlist",
              "success",
              `${product.name} • ${product.colorName}`,
              product.image1
            );

            return;
          }

          /* ADD */

          const wishlist =
            await addToWishlist(
              product.productId,
              {
                colorId:
                  product.colorId,
              }
            );

          setWishlistMap(
            wishlistVariantMap(
              wishlist
            )
          );

          showMessage(
            "Added to wishlist",
            "success",
            `${product.name} • ${product.colorName}`,
            product.image1
          );
        } catch (
          error
        ) {
          if (
            error instanceof
              ApiError &&
            (
              error.status ===
                401 ||
              error.status ===
                403
            )
          ) {
            requestLogin();

            showMessage(
              "Login required",
              "error",
              "Please login to use your wishlist."
            );

            return;
          }

          showMessage(
            "Wishlist update failed",
            "error",
            error instanceof
              Error
              ? error.message
              : undefined
          );
        } finally {
          setWishlistBusyKey(
            null
          );
        }
      },
      [
        showMessage,
        wishlistBusyKey,
        wishlistMap,
      ]
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main
      className="
        min-h-screen

        bg-[#FAF8F6]

        text-[#211A18]
      "
    >
      {/* NOTIFICATION */}

      <Toast
        toast={
          toast
        }
        onClose={() =>
          setToast(
            null
          )
        }
      />

      {/* SIZE MODAL */}

      <SizeModal
        product={
          sizeProduct
        }
        busy={
          cartBusy
        }
        onClose={() => {
          if (
            !cartBusy
          ) {
            setSizeProduct(
              null
            );
          }
        }}
        onSelect={(
          size
        ) => {
          void handleSizeSelect(
            size
          );
        }}
      />

      {/* CURRENT CATEGORY BANNER */}

      <WomenBannerSlider
        banners={
          banners
        }
      />

      {/* CATEGORY HEADER - UNCHANGED */}

      <CategoryNavigation
        categoryRoot={
          categoryRoot
        }
        categoryPath={
          categoryPath
        }
      />

      {/* PRODUCTS */}

      <section
        className="
          px-8
          pb-20
          pt-10
        "
      >
        <div
          className="
            mx-auto
            w-full
            max-w-[1500px]
          "
        >
          {/* TOP */}

          <div
            className="
              mb-8

              flex
              flex-col
              gap-5

              border-b
              border-black/10

              pb-5

              md:flex-row
              md:items-end
              md:justify-between
            "
          >
            <div>
              <p
                className="
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.22em]

                  text-[#9D173E]
                "
              >
                {
                  products.length
                }{" "}
                {products.length ===
                1
                  ? "product"
                  : "products"}
              </p>

              <h1
                className="
                  mt-2

                  text-2xl
                  font-semibold

                  md:text-3xl
                "
              >
                {
                  title
                }
              </h1>

              {description && (
                <p
                  className="
                    mt-2

                    max-w-2xl

                    text-sm
                    leading-6
                    text-black/55
                  "
                >
                  {
                    description
                  }
                </p>
              )}
            </div>

            <select
              value={
                sort
              }
              onChange={(
                event
              ) =>
                setSort(
                  event
                    .target
                    .value as SortValue
                )
              }
              className="
                h-10
                min-w-[160px]

                rounded-lg

                border
                border-black/15

                bg-white

                px-4

                text-[11px]
                font-semibold
                uppercase

                outline-none
              "
            >
              <option value="featured">
                Featured
              </option>

              <option value="newest">
                New Launch
              </option>

              <option value="price-low">
                Price Low to
                High
              </option>

              <option value="price-high">
                Price High to
                Low
              </option>
            </select>
          </div>

          {/* GRID */}

          {sortedProducts.length >
          0 ? (
            <div
              className="
                grid
                grid-cols-1

                gap-x-6
                gap-y-10

                sm:grid-cols-2

                lg:grid-cols-3

                xl:grid-cols-4
              "
            >
              {sortedProducts.map(
                (
                  product
                ) => {
                  const key =
                    productVariantKey(
                      product.productId,
                      product.colorId
                    );

                  const wished =
                    wishlistMap.has(
                      key
                    );

                  return (
                    <ProductCard
                      key={
                        product.variantKey
                      }
                      product={
                        product
                      }
                      wished={
                        wished
                      }
                      wishlistBusy={
                        wishlistBusyKey ===
                        key
                      }
                      onWishlist={() => {
                        void handleWishlist(
                          product
                        );
                      }}
                      onAddToBag={() => {
                        void handleAddToBag(
                          product
                        );
                      }}
                    />
                  );
                }
              )}
            </div>
          ) : (
            <div
              className="
                rounded-2xl

                border
                border-black/10

                bg-white

                px-6
                py-16

                text-center
              "
            >
              <h2
                className="
                  text-lg
                  font-semibold
                "
              >
                No products found
              </h2>

              <p
                className="
                  mt-2

                  text-sm
                  text-black/50
                "
              >
                No active product is
                assigned to this category.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}