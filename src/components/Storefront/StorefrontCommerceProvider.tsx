"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  ApiError,
  apiFetch,
  requestLogin,
} from "@/lib/api";

import {
  addToCart,
  getCartCount,
  type CartOfferContext,
} from "@/lib/cart";

import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
  type WishlistItem,
} from "@/lib/wishlist";

import type {
  CatalogProduct,
  CatalogSize,
} from "@/types/catalog";

/* =========================================================
   TYPES
========================================================= */

type ToastType =
  | "success"
  | "error";

type ToastState =
  | {
      title: string;
      subtitle?: string;
      image?: string;
      type: ToastType;
    }
  | null;

type LoginPromptType =
  | "cart"
  | "wishlist"
  | "bag"
  | null;

export type DirectCartInput = {
  productId: string;
  colorId: string;
  sizeId: string;

  name: string;

  colorName?: string;
  sizeLabel?: string;
  image?: string;

  quantity?: number;

  offerContext?:
    | CartOfferContext
    | null;
};

type ProductReference = {
  productId: string;

  colorId?: string;
};

type CommerceContextValue = {
  isAuthenticated:
    | boolean
    | null;

  cartCount: number;

  wishlistCount: number;

  openCart:
    () => Promise<void>;

  openWishlist:
    () => Promise<void>;

  openLoginPrompt: (
    type:
      | "cart"
      | "wishlist"
      | "bag"
  ) => void;

  openAddToBag: (
    product:
      CatalogProduct,

    offerContext?:
      | CartOfferContext
      | null
  ) => Promise<void>;

  addVariantToCart: (
    input:
      DirectCartInput
  ) => Promise<boolean>;

  toggleWishlist: (
    product:
      CatalogProduct
  ) => Promise<void>;

  isWishlisted: (
    product:
      | CatalogProduct
      | ProductReference
  ) => boolean;

  isWishlistBusy: (
    product:
      | CatalogProduct
      | ProductReference
  ) => boolean;

  refreshCommerce:
    () => Promise<void>;
};

/* =========================================================
   CONTEXT
========================================================= */

const CommerceContext =
  createContext<
    CommerceContextValue | undefined
  >(undefined);

/* =========================================================
   AUTH
========================================================= */

async function checkLoggedIn(): Promise<boolean> {
  try {
    await apiFetch(
      "/api/auth/me",
      {
        method:
          "GET",
      }
    );

    return true;
  } catch {
    return false;
  }
}

/* =========================================================
   GENERIC ID
========================================================= */

function readId(
  value:
    unknown
): string {
  if (
    typeof value ===
    "string"
  ) {
    return value.trim();
  }

  if (
    !value ||
    typeof value !==
      "object"
  ) {
    return "";
  }

  const object =
    value as Record<
      string,
      unknown
    >;

  return String(
    object._id ||
      object.id ||
      ""
  ).trim();
}

/* =========================================================
   WISHLIST PRODUCT ID
========================================================= */

function getWishlistProductId(
  item:
    WishlistItem
): string {
  const object =
    item as unknown as Record<
      string,
      unknown
    >;

  return readId(
    object.product ??
      object.productId
  );
}

/* =========================================================
   WISHLIST COLOR ID
========================================================= */

function getWishlistColorId(
  item:
    WishlistItem
): string {
  const object =
    item as unknown as Record<
      string,
      unknown
    >;

  return readId(
    object.color ??
      object.colorId
  );
}

/* =========================================================
   WISHLIST KEY
========================================================= */

function makeWishlistKey(
  productId:
    string,

  colorId?:
    string
) {
  return `${productId}:${colorId || "default"}`;
}

/* =========================================================
   LOGIN REQUIRED MODAL
========================================================= */

function LoginRequiredModal({
  type,
  onClose,
}: {
  type:
    LoginPromptType;

  onClose:
    () => void;
}) {
  if (!type) {
    return null;
  }

  const content =
    type ===
    "cart"
      ? {
          title:
            "Login to check your cart",

          description:
            "Sign in to view the products saved in your shopping bag and continue checkout.",
        }
      : type ===
          "wishlist"
        ? {
            title:
              "Login to check your wishlist",

            description:
              "Sign in to view and manage products saved in your wishlist.",
          }
        : {
            title:
              "Login to add to bag",

            description:
              "Sign in to select a size and add this product to your shopping bag.",
          };

  return (
    <div
      className="
        fixed
        inset-0
        z-[10020]

        flex
        items-center
        justify-center

        bg-black/45

        px-4

        backdrop-blur-[2px]
      "
      onMouseDown={(
        event
      ) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div
        className="
          relative

          w-full
          max-w-[420px]

          overflow-hidden

          rounded-[22px]

          bg-white

          shadow-[0_30px_90px_rgba(0,0,0,0.28)]
        "
      >
        <div
          className="
            h-[5px]
            w-full

            bg-[#8C1839]
          "
        />

        <button
          type="button"
          aria-label="Close"
          onClick={
            onClose
          }
          className="
            absolute
            right-4
            top-5

            flex
            h-8
            w-8

            cursor-pointer

            items-center
            justify-center

            rounded-full

            text-xl
            text-black/40

            transition

            hover:bg-black/5
            hover:text-black
          "
        >
          ×
        </button>

        <div
          className="
            px-7
            pb-7
            pt-8
          "
        >
          <div
            className="
              flex
              h-12
              w-12

              items-center
              justify-center

              rounded-full

              bg-[#F7E8ED]

              text-[#8C1839]
            "
          >
            {type ===
            "wishlist" ? (
              <HeartOutlineIcon />
            ) : (
              <BagIcon />
            )}
          </div>

          <h2
            className="
              mt-5

              text-[20px]
              font-semibold

              text-[#211A18]
            "
          >
            {
              content.title
            }
          </h2>

          <p
            className="
              mt-2

              text-[13px]
              leading-6

              text-black/55
            "
          >
            {
              content.description
            }
          </p>

          <button
            type="button"
            onClick={() => {
              onClose();

              requestLogin();
            }}
            className="
              mt-6

              h-12
              w-full

              cursor-pointer

              rounded-[10px]

              bg-[#8C1839]

              text-[11px]
              font-bold
              uppercase

              tracking-[0.14em]

              text-white

              transition

              hover:bg-[#6E102D]
            "
          >
            Login / Sign Up
          </button>

          <button
            type="button"
            onClick={
              onClose
            }
            className="
              mt-3

              h-11
              w-full

              cursor-pointer

              rounded-[10px]

              border
              border-black/10

              text-[11px]
              font-semibold

              text-[#211A18]

              transition

              hover:bg-black/[0.03]
            "
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   FIXED PRICE BUNDLE PROGRESS
========================================================= */

type BundleProgressResult = {
  selectedQuantity:
    number;

  requiredQuantity:
    number;

  remainingQuantity:
    number;

  unlocked:
    boolean;

  completedBundles:
    number;
};

function getBundleProgress(
  response:
    unknown,

  context:
    | CartOfferContext
    | null
    | undefined
): BundleProgressResult | null {
  if (
    !context ||
    context.offerType !==
      "fixed_price_bundle"
  ) {
    return null;
  }

  const requiredQuantity =
    Math.max(
      1,
      Number(
        context.requiredQuantity ||
          1
      )
    );

  const root =
    response &&
    typeof response ===
      "object"
      ? response as {
          cart?: {
            items?: Array<{
              quantity?:
                number;

              offerContext?:
                | {
                    offerId?:
                      string;

                    offerType?:
                      string;

                    source?:
                      string;
                  }
                | null;
            }>;
          };
        }
      : null;

  const items =
    Array.isArray(
      root?.cart?.items
    )
      ? root!.cart!.items!
      : [];

  const selectedQuantity =
    items.reduce(
      (
        total,
        item
      ) => {
        const itemContext =
          item.offerContext;

        const matches =
          String(
            itemContext?.offerId ||
              ""
          ) ===
            String(
              context.offerId
            ) &&
          itemContext?.offerType ===
            "fixed_price_bundle" &&
          itemContext?.source ===
            "fixed_price_bundle";

        if (!matches) {
          return total;
        }

        return (
          total +
          Math.max(
            0,
            Number(
              item.quantity ||
                0
            )
          )
        );
      },
      0
    );

  const completedBundles =
    Math.floor(
      selectedQuantity /
        requiredQuantity
    );

  const currentGroupQuantity =
    selectedQuantity %
    requiredQuantity;

  const unlocked =
    selectedQuantity >
      0 &&
    currentGroupQuantity ===
      0;

  const remainingQuantity =
    unlocked
      ? 0
      : Math.max(
          0,
          requiredQuantity -
            currentGroupQuantity
        );

  return {
    selectedQuantity,

    requiredQuantity,

    remainingQuantity,

    unlocked,

    completedBundles,
  };
}

/* =========================================================
   GLOBAL TOAST
========================================================= */

function GlobalToast({
  toast,
  onClose,
}: {
  toast:
    ToastState;

  onClose:
    () => void;
}) {
  if (!toast) {
    return null;
  }

  return (
    <div
      className="
        fixed
        right-4
        top-[90px]
        z-[10000]

        flex

        w-[calc(100%-32px)]
        max-w-[390px]

        items-center

        gap-3

        overflow-hidden

        rounded-[14px]

        border
        border-black/10

        bg-white

        px-4
        py-3.5

        shadow-[0_16px_45px_rgba(0,0,0,0.18)]

        sm:right-5
        sm:top-[105px]
        sm:w-[calc(100%-40px)]
        sm:py-4
      "
    >
      <span
        className={`
          absolute
          bottom-0
          left-0
          top-0

          w-[4px]

          ${
            toast.type ===
            "success"
              ? "bg-[#8C1839]"
              : "bg-[#D33F49]"
          }
        `}
      />

      {toast.image ? (
        <img
          src={
            toast.image
          }
          alt=""
          className="
            h-[54px]
            w-[44px]

            flex-none

            rounded-lg

            bg-[#F5F2EF]

            object-cover

            sm:h-[58px]
            sm:w-[48px]
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
                ? "bg-[#8C1839]"
                : "bg-[#D33F49]"
            }
          `}
        >
          {toast.type ===
          "success"
            ? "✓"
            : "!"}
        </div>
      )}

      <div
        className="
          min-w-0
          flex-1
        "
      >
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

        {toast.subtitle && (
          <p
            className="
              mt-1

              line-clamp-2

              text-[11px]
              leading-4

              text-black/50
            "
          >
            {
              toast.subtitle
            }
          </p>
        )}
      </div>

      <button
        type="button"
        aria-label="Close notification"
        onClick={
          onClose
        }
        className="
          cursor-pointer

          self-start

          text-lg
          text-black/35

          hover:text-black
        "
      >
        ×
      </button>
    </div>
  );
}

/* =========================================================
   GLOBAL SIZE MODAL
========================================================= */

function GlobalSizeModal({
  product,
  busy,
  onClose,
  onSelect,
}: {
  product:
    | CatalogProduct
    | null;

  busy:
    boolean;

  onClose:
    () => void;

  onSelect: (
    size:
      CatalogSize
  ) => void;
}) {
  if (!product) {
    return null;
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[9999]

        flex
        items-center
        justify-center

        bg-black/45

        px-3

        backdrop-blur-[1px]

        sm:px-4
      "
      onMouseDown={(
        event
      ) => {
        if (
          event.target ===
            event.currentTarget &&
          !busy
        ) {
          onClose();
        }
      }}
    >
      <div
        className="
          w-full
          max-w-[470px]

          rounded-[20px]

          bg-white

          p-5

          shadow-[0_30px_80px_rgba(0,0,0,0.28)]

          sm:p-6
        "
      >
        <div
          className="
            flex
            items-start
            gap-4
          "
        >
          {product.image1 && (
            <img
              src={
                product.image1
              }
              alt={
                product.name
              }
              className="
                h-[82px]
                w-[64px]

                flex-none

                rounded-[10px]

                bg-[#F5F2EF]

                object-cover
              "
            />
          )}

          <div
            className="
              min-w-0
              flex-1
            "
          >
            <h3
              className="
                line-clamp-2

                text-[14px]
                font-semibold
                leading-5

                text-[#211A18]
              "
            >
              {
                product.name
              }
            </h3>

            {product.colorName && (
              <p
                className="
                  mt-2

                  text-[11px]

                  text-[#6E625D]
                "
              >
                Color:{" "}

                <span
                  className="
                    font-semibold
                    text-[#211A18]
                  "
                >
                  {
                    product.colorName
                  }
                </span>
              </p>
            )}
          </div>

          <button
            type="button"
            aria-label="Close"
            disabled={
              busy
            }
            onClick={
              onClose
            }
            className="
              flex
              h-8
              w-8

              cursor-pointer

              items-center
              justify-center

              rounded-full

              text-xl

              text-black/40

              hover:bg-black/5
              hover:text-black

              disabled:cursor-not-allowed
            "
          >
            ×
          </button>
        </div>

        <div
          className="
            mt-5

            border-b
            border-[#211A18]/20

            pb-3
          "
        >
          <p
            className="
              text-[13px]
              font-semibold

              text-[#211A18]
            "
          >
            Select a Size
          </p>

          <p
            className="
              mt-1

              text-[10px]

              text-black/45
            "
          >
            Choose an available size
            to add this item to your
            bag.
          </p>
        </div>

        <div
          className="
            mt-5

            grid
            grid-cols-4

            gap-2.5

            sm:grid-cols-5
            sm:gap-3
          "
        >
          {product.sizes.map(
            (
              size
            ) => {
              const unavailable =
                size.stock <=
                0;

              return (
                <button
                  key={
                    size.id
                  }
                  type="button"
                  disabled={
                    busy ||
                    unavailable
                  }
                  onClick={() =>
                    onSelect(
                      size
                    )
                  }
                  className={`
                    flex
                    min-h-[48px]

                    cursor-pointer

                    items-center
                    justify-center

                    rounded-[12px]

                    border

                    px-2
                    py-2

                    text-[12px]
                    font-bold

                    transition-all

                    sm:min-h-[52px]
                    sm:px-3
                    sm:py-3

                    ${
                      unavailable
                        ? "cursor-not-allowed border-black/10 bg-[#F3F1F0] text-black/25 line-through"
                        : "border-[#211A18]/25 bg-white text-[#211A18] hover:border-[#8C1839] hover:bg-[#FFF4F7] hover:text-[#8C1839] hover:shadow-sm"
                    }
                  `}
                >
                  {
                    size.label
                  }
                </button>
              );
            }
          )}
        </div>

        {product.sizes.length ===
          0 && (
          <p
            className="
              mt-5

              rounded-xl

              bg-[#FFF4F7]

              px-4
              py-4

              text-[12px]

              text-[#8C1839]
            "
          >
            No sizes available for
            this product.
          </p>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   PROVIDER
========================================================= */

export function StorefrontCommerceProvider({
  children,
}: {
  children:
    ReactNode;
}) {
  const router =
    useRouter();

  const [
    isAuthenticated,
    setIsAuthenticated,
  ] =
    useState<
      boolean | null
    >(null);

  const [
    loginPrompt,
    setLoginPrompt,
  ] =
    useState<LoginPromptType>(
      null
    );

  const [
    toast,
    setToast,
  ] =
    useState<ToastState>(
      null
    );

  const toastTimer =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(null);

  const [
    selectedProduct,
    setSelectedProduct,
  ] =
    useState<
      CatalogProduct | null
    >(null);

  const [
    selectedOfferContext,
    setSelectedOfferContext,
  ] =
    useState<
      CartOfferContext | null
    >(null);

  const [
    cartBusy,
    setCartBusy,
  ] =
    useState(
      false
    );

  const [
    wishlistBusyKey,
    setWishlistBusyKey,
  ] =
    useState<
      string | null
    >(null);

  const [
    cartCount,
    setCartCount,
  ] =
    useState(
      0
    );

  const [
    wishlistCount,
    setWishlistCount,
  ] =
    useState(
      0
    );

  const [
    wishlistVariantKeys,
    setWishlistVariantKeys,
  ] =
    useState<
      Set<string>
    >(
      () =>
        new Set()
    );

  const [
    wishlistProductIds,
    setWishlistProductIds,
  ] =
    useState<
      Set<string>
    >(
      () =>
        new Set()
    );

  /* =======================================================
     TOAST
  ======================================================= */

  const showToast =
    useCallback(
      (
        title:
          string,

        type:
          ToastType,

        subtitle?:
          string,

        image?:
          string
      ) => {
        if (
          toastTimer.current
        ) {
          clearTimeout(
            toastTimer.current
          );
        }

        setToast({
          title,
          type,
          subtitle,
          image,
        });

        toastTimer.current =
          setTimeout(
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

  useEffect(() => {
    return () => {
      if (
        toastTimer.current
      ) {
        clearTimeout(
          toastTimer.current
        );
      }
    };
  }, []);

  /* =======================================================
     CART COUNT
  ======================================================= */

  const loadCartCount =
    useCallback(
      async () => {
        try {
          const count =
            await getCartCount();

          setCartCount(
            count
          );
        } catch {
          setCartCount(
            0
          );
        }
      },
      []
    );

  /* =======================================================
     LOAD WISHLIST
  ======================================================= */

  const loadWishlist =
    useCallback(
      async () => {
        try {
          const wishlist =
            await getWishlist();

          const productIds =
            new Set<string>();

          const variantKeys =
            new Set<string>();

          wishlist.items.forEach(
            (
              item
            ) => {
              const productId =
                getWishlistProductId(
                  item
                );

              const colorId =
                getWishlistColorId(
                  item
                );

              if (
                !productId
              ) {
                return;
              }

              productIds.add(
                productId
              );

              if (
                colorId
              ) {
                variantKeys.add(
                  makeWishlistKey(
                    productId,
                    colorId
                  )
                );
              } else {
                variantKeys.add(
                  makeWishlistKey(
                    productId,
                    "default"
                  )
                );
              }
            }
          );

          setWishlistProductIds(
            productIds
          );

          setWishlistVariantKeys(
            variantKeys
          );

          setWishlistCount(
            wishlist.items.length
          );
        } catch {
          setWishlistProductIds(
            new Set()
          );

          setWishlistVariantKeys(
            new Set()
          );

          setWishlistCount(
            0
          );
        }
      },
      []
    );

  /* =======================================================
     REFRESH COMMERCE
  ======================================================= */

  const refreshCommerce =
    useCallback(
      async () => {
        const loggedIn =
          await checkLoggedIn();

        setIsAuthenticated(
          loggedIn
        );

        if (!loggedIn) {
          setCartCount(
            0
          );

          setWishlistCount(
            0
          );

          setWishlistProductIds(
            new Set()
          );

          setWishlistVariantKeys(
            new Set()
          );

          return;
        }

        await Promise.all([
          loadCartCount(),
          loadWishlist(),
        ]);
      },
      [
        loadCartCount,
        loadWishlist,
      ]
    );

  /* =======================================================
     INITIAL / AUTH CHANGE
  ======================================================= */

  useEffect(() => {
    void refreshCommerce();

    const authChanged =
      () => {
        void refreshCommerce();
      };

    window.addEventListener(
      "hivrasoft-auth-changed",
      authChanged
    );

    return () => {
      window.removeEventListener(
        "hivrasoft-auth-changed",
        authChanged
      );
    };
  }, [
    refreshCommerce,
  ]);

  /* =======================================================
     CART / WISHLIST EVENTS
  ======================================================= */

  useEffect(() => {
    const cartUpdated =
      () => {
        void loadCartCount();
      };

    const wishlistUpdated =
      () => {
        void loadWishlist();
      };

    window.addEventListener(
      "hivrasoft-cart-updated",
      cartUpdated
    );

    window.addEventListener(
      "hivrasoft-wishlist-updated",
      wishlistUpdated
    );

    return () => {
      window.removeEventListener(
        "hivrasoft-cart-updated",
        cartUpdated
      );

      window.removeEventListener(
        "hivrasoft-wishlist-updated",
        wishlistUpdated
      );
    };
  }, [
    loadCartCount,
    loadWishlist,
  ]);

  /* =======================================================
     HEADER CART
  ======================================================= */

  const openCart =
    useCallback(
      async () => {
        const loggedIn =
          await checkLoggedIn();

        setIsAuthenticated(
          loggedIn
        );

        if (!loggedIn) {
          setLoginPrompt(
            "cart"
          );

          return;
        }

        router.push(
          "/cart/"
        );
      },
      [
        router,
      ]
    );

  /* =======================================================
     HEADER WISHLIST
  ======================================================= */

  const openWishlist =
    useCallback(
      async () => {
        const loggedIn =
          await checkLoggedIn();

        setIsAuthenticated(
          loggedIn
        );

        if (!loggedIn) {
          setLoginPrompt(
            "wishlist"
          );

          return;
        }

        router.push(
          "/wishlist/"
        );
      },
      [
        router,
      ]
    );

  /* =======================================================
     DIRECT ADD TO CART
  ======================================================= */

  const addVariantToCart =
    useCallback(
      async (
        input:
          DirectCartInput
      ): Promise<boolean> => {
        let loggedIn =
          isAuthenticated;

        if (
          loggedIn !==
          true
        ) {
          loggedIn =
            await checkLoggedIn();

          setIsAuthenticated(
            loggedIn
          );
        }

        if (!loggedIn) {
          setLoginPrompt(
            "bag"
          );

          return false;
        }

        const quantity =
          Math.max(
            1,
            Number(
              input.quantity ??
                1
            )
          );

        setCartCount(
          (
            current
          ) =>
            current +
            quantity
        );

        showToast(
          "Added to bag",
          "success",
          [
            input.name,

            input.colorName,

            input.sizeLabel
              ? `Size ${input.sizeLabel}`
              : "",
          ]
            .filter(
              Boolean
            )
            .join(
              " • "
            ),
          input.image
        );

        setCartBusy(
          true
        );

        try {
          const response =
            await addToCart({
              productId:
                input.productId,

              colorId:
                input.colorId,

              sizeId:
                input.sizeId,

              quantity,

              offerContext:
                input.offerContext ??
                null,
            });

          /* =================================================
             FIXED PRICE BUNDLE PROGRESS
          ================================================= */

          if (
            input.offerContext
              ?.offerType ===
              "fixed_price_bundle"
          ) {
            const progress =
              getBundleProgress(
                response,
                input.offerContext
              );

            if (progress) {
              const offerName =
                input.offerContext
                  .offerName ||
                "Bundle offer";

              const fixedPrice =
                Math.max(
                  0,
                  Number(
                    input.offerContext
                      .fixedPrice ||
                      0
                  )
                );

              if (
                progress.unlocked
              ) {
                showToast(
                  "Offer unlocked! 🎉",
                  "success",
                  [
                    `${progress.requiredQuantity}/${progress.requiredQuantity} selected`,

                    fixedPrice >
                    0
                      ? `${offerName} • ₹${fixedPrice.toLocaleString(
                          "en-IN",
                          {
                            maximumFractionDigits:
                              2,
                          }
                        )}`
                      : offerName,
                  ]
                    .filter(
                      Boolean
                    )
                    .join(
                      " • "
                    ),
                  input.image
                );
              } else {
                const nextSelected =
                  progress.selectedQuantity %
                  progress.requiredQuantity;

                showToast(
                  `Add ${progress.remainingQuantity} more to unlock offer`,
                  "success",
                  `${nextSelected}/${progress.requiredQuantity} selected • ${offerName}`,
                  input.image
                );
              }
            }
          }

          void loadCartCount();

          return true;
        } catch (
          error
        ) {
          setCartCount(
            (
              current
            ) =>
              Math.max(
                0,
                current -
                  quantity
              )
          );

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
            setIsAuthenticated(
              false
            );

            setLoginPrompt(
              "bag"
            );

            return false;
          }

          showToast(
            "Unable to add product",
            "error",
            error instanceof
              Error
              ? error.message
              : "Please try again.",
            input.image
          );

          return false;
        } finally {
          setCartBusy(
            false
          );
        }
      },
      [
        isAuthenticated,
        loadCartCount,
        showToast,
      ]
    );

  /* =======================================================
     ADD TO BAG FROM PRODUCT CARD
  ======================================================= */

  const openAddToBag =
    useCallback(
      async (
        product:
          CatalogProduct,

        offerContext:
          CartOfferContext | null =
          null
      ) => {
        let loggedIn =
          isAuthenticated;

        if (
          loggedIn !==
          true
        ) {
          loggedIn =
            await checkLoggedIn();

          setIsAuthenticated(
            loggedIn
          );
        }

        if (!loggedIn) {
          setLoginPrompt(
            "bag"
          );

          return;
        }

        if (
          product.sizes.length ===
          0
        ) {
          showToast(
            "Size unavailable",
            "error",
            "No size information is available for this product.",
            product.image1
          );

          return;
        }

        const hasStock =
          product.sizes.some(
            (
              size
            ) =>
              size.stock >
              0
          );

        if (!hasStock) {
          showToast(
            "Out of stock",
            "error",
            `${product.name} is currently unavailable.`,
            product.image1
          );

          return;
        }

        setSelectedOfferContext(
          offerContext
        );

        setSelectedProduct(
          product
        );
      },
      [
        isAuthenticated,
        showToast,
      ]
    );

  /* =======================================================
     SIZE SELECTED
  ======================================================= */

  const handleSizeSelected =
    useCallback(
      (
        size:
          CatalogSize
      ) => {
        if (
          !selectedProduct ||
          size.stock <=
            0
        ) {
          return;
        }

        const product =
          selectedProduct;

        const offerContext =
          selectedOfferContext;

        setSelectedProduct(
          null
        );

        setSelectedOfferContext(
          null
        );

        void addVariantToCart({
          productId:
            product.productId,

          colorId:
            product.colorId,

          sizeId:
            size.id,

          name:
            product.name,

          colorName:
            product.colorName,

          sizeLabel:
            size.label,

          image:
            product.image1,

          quantity:
            1,

          offerContext,
        });
      },
      [
        selectedProduct,
        selectedOfferContext,
        addVariantToCart,
      ]
    );

  /* =======================================================
     WISHLIST STATUS
  ======================================================= */

  const isWishlisted =
    useCallback(
      (
        product:
          | CatalogProduct
          | ProductReference
      ) => {
        const colorId =
          product.colorId ||
          "default";

        return wishlistVariantKeys.has(
          makeWishlistKey(
            product.productId,
            colorId
          )
        );
      },
      [
        wishlistVariantKeys,
      ]
    );

  const isWishlistBusy =
    useCallback(
      (
        product:
          | CatalogProduct
          | ProductReference
      ) => {
        return (
          wishlistBusyKey ===
          makeWishlistKey(
            product.productId,
            product.colorId ||
              "default"
          )
        );
      },
      [
        wishlistBusyKey,
      ]
    );

  /* =======================================================
     TOGGLE WISHLIST
  ======================================================= */

  const toggleWishlist =
    useCallback(
      async (
        product:
          CatalogProduct
      ) => {
        let loggedIn =
          isAuthenticated;

        if (
          loggedIn !==
          true
        ) {
          loggedIn =
            await checkLoggedIn();

          setIsAuthenticated(
            loggedIn
          );
        }

        if (!loggedIn) {
          setLoginPrompt(
            "wishlist"
          );

          return;
        }

        const key =
          makeWishlistKey(
            product.productId,
            product.colorId ||
              "default"
          );

        if (
          wishlistBusyKey
        ) {
          return;
        }

        const exactExists =
          wishlistVariantKeys.has(
            key
          );

        const productAlreadyExists =
          wishlistProductIds.has(
            product.productId
          );

        const previousVariantKeys =
          new Set(
            wishlistVariantKeys
          );

        const previousProductIds =
          new Set(
            wishlistProductIds
          );

        const previousCount =
          wishlistCount;

        setWishlistBusyKey(
          key
        );

        if (
          exactExists
        ) {
          setWishlistVariantKeys(
            (
              current
            ) => {
              const next =
                new Set(
                  current
                );

              for (
                const itemKey of
                  next
              ) {
                if (
                  itemKey.startsWith(
                    `${product.productId}:`
                  )
                ) {
                  next.delete(
                    itemKey
                  );
                }
              }

              return next;
            }
          );

          setWishlistProductIds(
            (
              current
            ) => {
              const next =
                new Set(
                  current
                );

              next.delete(
                product.productId
              );

              return next;
            }
          );

          setWishlistCount(
            (
              current
            ) =>
              Math.max(
                0,
                current -
                  1
              )
          );

          showToast(
            "Removed from wishlist",
            "success",
            product.name,
            product.image1
          );
        } else {
          setWishlistVariantKeys(
            (
              current
            ) => {
              const next =
                new Set(
                  current
                );

              for (
                const itemKey of
                  next
              ) {
                if (
                  itemKey.startsWith(
                    `${product.productId}:`
                  )
                ) {
                  next.delete(
                    itemKey
                  );
                }
              }

              next.add(
                key
              );

              return next;
            }
          );

          setWishlistProductIds(
            (
              current
            ) => {
              const next =
                new Set(
                  current
                );

              next.add(
                product.productId
              );

              return next;
            }
          );

          if (
            !productAlreadyExists
          ) {
            setWishlistCount(
              (
                current
              ) =>
                current +
                1
            );
          }

          showToast(
            "Added to wishlist",
            "success",
            product.name,
            product.image1
          );
        }

        try {
          if (
            exactExists
          ) {
            await removeFromWishlist(
              product.productId
            );
          } else {
            if (
              productAlreadyExists
            ) {
              await removeFromWishlist(
                product.productId
              );
            }

            await addToWishlist(
              product.productId,
              {
                colorId:
                  product.colorId ||
                  null,
              }
            );
          }

          void loadWishlist();
        } catch (
          error
        ) {
          setWishlistVariantKeys(
            previousVariantKeys
          );

          setWishlistProductIds(
            previousProductIds
          );

          setWishlistCount(
            previousCount
          );

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
            setIsAuthenticated(
              false
            );

            setLoginPrompt(
              "wishlist"
            );

            return;
          }

          showToast(
            "Wishlist update failed",
            "error",
            error instanceof
              Error
              ? error.message
              : "Please try again.",
            product.image1
          );
        } finally {
          setWishlistBusyKey(
            null
          );
        }
      },
      [
        isAuthenticated,
        wishlistBusyKey,
        wishlistVariantKeys,
        wishlistProductIds,
        wishlistCount,
        loadWishlist,
        showToast,
      ]
    );

  /* =======================================================
     CONTEXT
  ======================================================= */

  const value =
    useMemo<
      CommerceContextValue
    >(
      () => ({
        isAuthenticated,

        cartCount,

        wishlistCount,

        openCart,

        openWishlist,

        openLoginPrompt: (
          type
        ) => {
          setLoginPrompt(
            type
          );
        },

        openAddToBag,

        addVariantToCart,

        toggleWishlist,

        isWishlisted,

        isWishlistBusy,

        refreshCommerce,
      }),
      [
        isAuthenticated,
        cartCount,
        wishlistCount,
        openCart,
        openWishlist,
        openAddToBag,
        addVariantToCart,
        toggleWishlist,
        isWishlisted,
        isWishlistBusy,
        refreshCommerce,
      ]
    );

  return (
    <CommerceContext.Provider
      value={
        value
      }
    >
      {
        children
      }

      <GlobalSizeModal
        product={
          selectedProduct
        }
        busy={
          cartBusy
        }
        onClose={() => {
          if (!cartBusy) {
            setSelectedProduct(
              null
            );

            setSelectedOfferContext(
              null
            );
          }
        }}
        onSelect={(
          size
        ) => {
          void handleSizeSelected(
            size
          );
        }}
      />

      <GlobalToast
        toast={
          toast
        }
        onClose={() =>
          setToast(
            null
          )
        }
      />

      <LoginRequiredModal
        type={
          loginPrompt
        }
        onClose={() =>
          setLoginPrompt(
            null
          )
        }
      />
    </CommerceContext.Provider>
  );
}

/* =========================================================
   HOOK
========================================================= */

export function useStorefrontCommerce() {
  const context =
    useContext(
      CommerceContext
    );

  if (!context) {
    throw new Error(
      "useStorefrontCommerce must be used inside StorefrontCommerceProvider."
    );
  }

  return context;
}

/* =========================================================
   ICONS
========================================================= */

function HeartOutlineIcon() {
  return (
    <svg
      width="21"
      height="21"
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

function BagIcon() {
  return (
    <svg
      width="20"
      height="20"
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