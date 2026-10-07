"use client";

import Link from "next/link";
import {
  useRouter,
} from "next/navigation";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  Heart,
  Mail,
  Package,
  Phone,
  ShoppingBag,
  Sparkles,
  UserRound,
} from "lucide-react";

import Header from "@/src/components/Header/Header";
import AccountSidebar from "./components/AccountSidebar";

import {
  getMyOrders,
} from "@/lib/orders";

import {
  getWishlist,
} from "@/lib/wishlist";

import {
  getCart,
} from "@/lib/cart";

import type {
  Order,
} from "@/types/order";

/* =========================================================
   API
========================================================= */

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000"
).replace(/\/$/, "");

/* =========================================================
   WELCOME
========================================================= */

const WELCOME_BANNER =
  "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=85";

/* =========================================================
   TYPES
========================================================= */

type AccountData = {
  id: string;
  name: string;
  email: string;
  phone: string;

  avatar?: {
    url: string;
    publicId?: string;
  } | null;

  memberSince: string;
};

type AccountApiResponse = {
  success: boolean;
  message?: string;
  account?: AccountData;
};

type AddressType =
  | "home"
  | "work"
  | "other";

type AddressData = {
  id: string;
  userId?: string;
  fullName: string;
  phone: string;
  alternatePhone?: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  district?: string;
  state: string;
  postalCode: string;
  country: string;
  countryCode?: string;
  addressType: AddressType;
  isDefault: boolean;
  isShippingAddress?: boolean;
  isBillingAddress?: boolean;
  instructions?: string;
  createdAt?: string;
  updatedAt?: string;
};

type AddressesApiResponse = {
  success: boolean;
  message?: string;
  count?: number;
  addresses?: AddressData[];
};

type WishlistPreviewItem = {
  productId: string;
  name: string;
  slug: string;
  image: string;
  price: number;
};

type CartPreview = {
  itemCount: number;
  subtotal: number;
  image: string;
  name: string;
};

/* =========================================================
   HELPERS
========================================================= */

function asObject(
  value: unknown,
): Record<string, unknown> {
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

function asArray(
  value: unknown,
): unknown[] {
  return Array.isArray(
    value,
  )
    ? value
    : [];
}

function firstString(
  ...values: unknown[]
): string {
  for (
    const value of values
  ) {
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

function positiveNumber(
  ...values: unknown[]
): number {
  for (
    const value of values
  ) {
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
        parsed,
      ) &&
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
    typeof value ===
    "string"
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
    image.imageUrl,
  );
}

function getImages(
  value: unknown,
): string[] {
  const list =
    asArray(value);

  const defaultImages =
    list.filter(
      (item) =>
        asObject(item)
          .isDefault === true,
    );

  const normalImages =
    list.filter(
      (item) =>
        asObject(item)
          .isDefault !== true,
    );

  return Array.from(
    new Set(
      [
        ...defaultImages,
        ...normalImages,
      ]
        .map(getImageUrl)
        .filter(Boolean),
    ),
  );
}

function findById(
  value: unknown,
  id: string,
): Record<string, unknown> {
  if (!id) {
    return {};
  }

  for (
    const item of asArray(
      value,
    )
  ) {
    const object =
      asObject(item);

    if (
      getId(object) === id
    ) {
      return object;
    }
  }

  return {};
}

function capitalizeName(
  name: string,
) {
  const value =
    String(name || "").trim();

  if (!value) {
    return "User";
  }

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}

function formatPhone(
  phone: string,
) {
  if (!phone) {
    return "-";
  }

  const digits =
    phone.replace(
      /\D/g,
      "",
    );

  if (
    digits.length === 10
  ) {
    return `+91 ${digits.slice(
      0,
      5,
    )} ${digits.slice(5)}`;
  }

  if (
    digits.length === 12 &&
    digits.startsWith("91")
  ) {
    const number =
      digits.slice(2);

    return `+91 ${number.slice(
      0,
      5,
    )} ${number.slice(5)}`;
  }

  return phone;
}

function money(
  value:
    | number
    | undefined,
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

function formatDate(
  value?: string,
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

/* =========================================================
   ORDER STATUS
========================================================= */

function normalizeStatus(
  value?: string,
) {
  return String(
    value || "confirmed",
  )
    .trim()
    .toLowerCase()
    .replace(
      /\s+/g,
      "_",
    );
}

function formatStatus(
  value?: string,
) {
  const status =
    normalizeStatus(value);

  const map: Record<
    string,
    string
  > = {
    pending:
      "Pending",

    pending_payment:
      "Payment Pending",

    confirmed:
      "Confirmed",

    processing:
      "Processing",

    shipped:
      "Shipped",

    out_for_delivery:
      "Out for Delivery",

    delivered:
      "Delivered",

    cancelled:
      "Cancelled",

    canceled:
      "Cancelled",

    returned:
      "Returned",

    refunded:
      "Refunded",
  };

  return (
    map[status] ||
    status
      .replace(
        /_/g,
        " ",
      )
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase(),
      )
  );
}

function statusClasses(
  value?: string,
) {
  const status =
    normalizeStatus(value);

  if (
    status === "delivered"
  ) {
    return `
      bg-[#DDF0DF]
      text-[#31703A]
    `;
  }

  if (
    status === "cancelled" ||
    status === "canceled"
  ) {
    return `
      bg-[#FDE7E7]
      text-[#A12B2B]
    `;
  }

  if (
    status === "shipped" ||
    status ===
      "out_for_delivery"
  ) {
    return `
      bg-[#E8F1FE]
      text-[#315B92]
    `;
  }

  if (
    status === "processing"
  ) {
    return `
      bg-[#FFF2D9]
      text-[#80601B]
    `;
  }

  return `
    bg-[#F8E1E2]
    text-[#8C1839]
  `;
}

/* =========================================================
   WISHLIST
========================================================= */

function normalizeWishlistItem(
  value: unknown,
): WishlistPreviewItem | null {
  const raw =
    asObject(value);

  const product =
    asObject(
      raw.product,
    );

  const productId =
    firstString(
      getId(raw.product),
      raw.productId,
    );

  const colorId =
    firstString(
      getId(raw.colorId),
      getId(raw.color),
    );

  const directColor =
    asObject(
      raw.color ||
        raw.selectedColor,
    );

  const matchedColor =
    findById(
      product.colors,
      colorId,
    );

  const firstColor =
    asObject(
      asArray(
        product.colors,
      )[0],
    );

  const color =
    Object.keys(
      directColor,
    ).length > 0
      ? directColor
      : Object.keys(
            matchedColor,
          ).length > 0
        ? matchedColor
        : firstColor;

  const images =
    Array.from(
      new Set(
        [
          ...getImages(
            color.images,
          ),

          ...getImages(
            product.mainImages ||
              product.images,
          ),
        ].filter(Boolean),
      ),
    );

  const name =
    firstString(
      color.nameProduct,
      raw.nameProduct,
      product.nameProduct,
      product.name,
      "Saved product",
    );

  const slug =
    firstString(
      color.slugProduct,
      raw.slugProduct,
      product.slugProduct,
      product.slug,
    );

  const price =
    positiveNumber(
      color.showPrice,
      color.sellingPrice,
      raw.showPrice,
      raw.price,
      product.showPrice,
    );

  if (
    !productId &&
    !name
  ) {
    return null;
  }

  return {
    productId,
    name,
    slug,
    image:
      images[0] || "",
    price,
  };
}

/* =========================================================
   CART
========================================================= */

function normalizeCart(
  response: unknown,
): CartPreview {
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

  let itemCount = 0;
  let calculatedSubtotal = 0;
  let firstImage = "";
  let firstName = "";

  rawItems.forEach(
    (rawValue) => {
      const item =
        asObject(rawValue);

      const product =
        asObject(
          item.product,
        );

      const colorId =
        firstString(
          getId(item.colorId),
          getId(item.color),
        );

      const directColor =
        asObject(
          item.color ||
            item.selectedColor,
        );

      const color =
        Object.keys(
          directColor,
        ).length > 0
          ? directColor
          : findById(
              product.colors,
              colorId,
            );

      const sizeId =
        firstString(
          getId(item.sizeId),
          getId(item.size),
        );

      const directSize =
        asObject(
          item.size ||
            item.selectedSize,
        );

      const size =
        Object.keys(
          directSize,
        ).length > 0
          ? directSize
          : findById(
              color.sizes,
              sizeId,
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

      const price =
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

      itemCount += quantity;

      calculatedSubtotal +=
        price * quantity;

      if (!firstImage) {
        const images =
          Array.from(
            new Set(
              [
                firstString(
                  item.image,
                  item.imageUrl,
                ),

                ...getImages(
                  color.images,
                ),

                ...getImages(
                  product.mainImages ||
                    product.images,
                ),
              ].filter(Boolean),
            ),
          );

        firstImage =
          images[0] || "";
      }

      if (!firstName) {
        firstName =
          firstString(
            color.nameProduct,
            item.nameProduct,
            item.productName,
            product.nameProduct,
            product.name,
            "Cart Product",
          );
      }
    },
  );

  const apiSubtotal =
    Number(
      cart.subtotal ??
        root.subtotal ??
        data.subtotal,
    );

  return {
    itemCount,

    subtotal:
      Number.isFinite(
        apiSubtotal,
      ) &&
      apiSubtotal >= 0
        ? apiSubtotal
        : calculatedSubtotal,

    image:
      firstImage,

    name:
      firstName,
  };
}

/* =========================================================
   PAGE
========================================================= */

export default function AccountPage() {
  const router =
    useRouter();

  const [
    account,
    setAccount,
  ] =
    useState<AccountData | null>(
      null,
    );

  const [
    accountLoading,
    setAccountLoading,
  ] =
    useState(true);

  const [
    accountError,
    setAccountError,
  ] =
    useState("");

  const [
    showLoginMessage,
    setShowLoginMessage,
  ] =
    useState(false);

  const [
    defaultAddress,
    setDefaultAddress,
  ] =
    useState<AddressData | null>(
      null,
    );

  const [
    addressLoading,
    setAddressLoading,
  ] =
    useState(true);

  const [
    addressError,
    setAddressError,
  ] =
    useState("");

  const [
    orders,
    setOrders,
  ] =
    useState<Order[]>([]);

  const [
    ordersLoading,
    setOrdersLoading,
  ] =
    useState(true);

  const [
    wishlist,
    setWishlist,
  ] =
    useState<
      WishlistPreviewItem[]
    >([]);

  const [
    wishlistLoading,
    setWishlistLoading,
  ] =
    useState(true);

  const [
    cart,
    setCart,
  ] =
    useState<CartPreview>({
      itemCount: 0,
      subtotal: 0,
      image: "",
      name: "",
    });

  const [
    cartLoading,
    setCartLoading,
  ] =
    useState(true);

  /* =======================================================
     FETCH ACCOUNT
  ======================================================= */

  useEffect(() => {
    let redirectTimer:
      | ReturnType<
          typeof setTimeout
        >
      | undefined;

    async function loadAccount() {
      try {
        setAccountLoading(
          true,
        );

        setAccountError("");

        const response =
          await fetch(
            `${API_URL}/api/auth/account`,
            {
              method: "GET",
              credentials:
                "include",
              cache:
                "no-store",
              headers: {
                Accept:
                  "application/json",
              },
            },
          );

        if (
          response.status ===
          401
        ) {
          setAccount(null);

          setShowLoginMessage(
            true,
          );

          setAccountLoading(
            false,
          );

          redirectTimer =
            setTimeout(
              () => {
                router.replace(
                  "/",
                );
              },
              1000,
            );

          return;
        }

        const data =
          (await response.json()) as AccountApiResponse;

        if (
          !response.ok ||
          !data.success ||
          !data.account
        ) {
          throw new Error(
            data.message ||
              "Unable to load account.",
          );
        }

        setAccount(
          data.account,
        );
      } catch (error) {
        console.error(
          "ACCOUNT API ERROR:",
          error,
        );

        setAccountError(
          error instanceof Error
            ? error.message
            : "Unable to load account.",
        );
      } finally {
        setAccountLoading(
          false,
        );
      }
    }

    void loadAccount();

    return () => {
      if (redirectTimer) {
        clearTimeout(
          redirectTimer,
        );
      }
    };
  }, [router]);

  /* =======================================================
     ADDRESS
  ======================================================= */

  useEffect(() => {
    let cancelled =
      false;

    async function loadAddress() {
      try {
        setAddressLoading(
          true,
        );

        setAddressError("");

        const response =
          await fetch(
            `${API_URL}/api/address/`,
            {
              method: "GET",
              credentials:
                "include",
              cache:
                "no-store",
              headers: {
                Accept:
                  "application/json",
              },
            },
          );

        const data =
          (await response.json()) as AddressesApiResponse;

        if (cancelled) {
          return;
        }

        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.message ||
              "Unable to load address.",
          );
        }

        const addresses =
          Array.isArray(
            data.addresses,
          )
            ? data.addresses
            : [];

        const selected =
          addresses.find(
            (address) =>
              address.isDefault ===
              true,
          ) ||
          addresses[0] ||
          null;

        setDefaultAddress(
          selected,
        );
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error(
          "ADDRESS API ERROR:",
          error,
        );

        setDefaultAddress(
          null,
        );

        setAddressError(
          error instanceof Error
            ? error.message
            : "Unable to load address.",
        );
      } finally {
        if (!cancelled) {
          setAddressLoading(
            false,
          );
        }
      }
    }

    void loadAddress();

    return () => {
      cancelled = true;
    };
  }, []);

  /* =======================================================
     ORDERS
  ======================================================= */

  const loadOrders =
    useCallback(
      async () => {
        try {
          setOrdersLoading(
            true,
          );

          const rows =
            await getMyOrders();

          const sorted =
            [...rows].sort(
              (a, b) =>
                new Date(
                  b.createdAt ||
                    0,
                ).getTime() -
                new Date(
                  a.createdAt ||
                    0,
                ).getTime(),
            );

          setOrders(sorted);
        } catch (error) {
          console.error(
            "ACCOUNT ORDERS ERROR:",
            error,
          );

          setOrders([]);
        } finally {
          setOrdersLoading(
            false,
          );
        }
      },
      [],
    );

  /* =======================================================
     WISHLIST
  ======================================================= */

  const loadWishlist =
    useCallback(
      async () => {
        try {
          setWishlistLoading(
            true,
          );

          const response =
            await getWishlist();

          const rows =
            response.items
              .map(
                (item) =>
                  normalizeWishlistItem(
                    item,
                  ),
              )
              .filter(
                (
                  item,
                ): item is WishlistPreviewItem =>
                  Boolean(item),
              )
              .slice(0, 2);

          setWishlist(rows);
        } catch (error) {
          console.error(
            "ACCOUNT WISHLIST ERROR:",
            error,
          );

          setWishlist([]);
        } finally {
          setWishlistLoading(
            false,
          );
        }
      },
      [],
    );

  /* =======================================================
     CART
  ======================================================= */

  const loadCart =
    useCallback(
      async () => {
        try {
          setCartLoading(true);

          const response =
            await getCart();

          setCart(
            normalizeCart(
              response,
            ),
          );
        } catch (error) {
          console.error(
            "ACCOUNT CART ERROR:",
            error,
          );

          setCart({
            itemCount: 0,
            subtotal: 0,
            image: "",
            name: "",
          });
        } finally {
          setCartLoading(false);
        }
      },
      [],
    );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    void Promise.all([
      loadOrders(),
      loadWishlist(),
      loadCart(),
    ]);
  }, [
    loadOrders,
    loadWishlist,
    loadCart,
  ]);

  /* =======================================================
     EVENTS
  ======================================================= */

  useEffect(() => {
    function handleWishlistUpdate() {
      void loadWishlist();
    }

    function handleCartUpdate() {
      void loadCart();
    }

    window.addEventListener(
      "hivrasoft-wishlist-updated",
      handleWishlistUpdate,
    );

    window.addEventListener(
      "hivrasoft-cart-updated",
      handleCartUpdate,
    );

    return () => {
      window.removeEventListener(
        "hivrasoft-wishlist-updated",
        handleWishlistUpdate,
      );

      window.removeEventListener(
        "hivrasoft-cart-updated",
        handleCartUpdate,
      );
    };
  }, [
    loadWishlist,
    loadCart,
  ]);

  /* =======================================================
     VALUES
  ======================================================= */

  const accountName =
    account
      ? capitalizeName(
          account.name,
        )
      : "";

  const latestOrder =
    useMemo(
      () =>
        orders[0] || null,
      [orders],
    );

  const latestOrderItem =
    latestOrder
      ?.items?.[0] ||
    null;

  const defaultAddressLine1 =
    defaultAddress
      ? [
          defaultAddress
            .addressLine1,

          defaultAddress
            .addressLine2,

          defaultAddress
            .landmark,
        ]
          .filter(Boolean)
          .join(", ")
      : "";

  const defaultAddressLine2 =
    defaultAddress
      ? [
          defaultAddress.city,
          defaultAddress
            .postalCode,
          defaultAddress.state,
          defaultAddress.country,
        ]
          .filter(Boolean)
          .join(", ")
      : "";

  const defaultAddressPhone =
    defaultAddress
      ? formatPhone(
          defaultAddress.phone,
        )
      : "";

  const defaultAddressType =
    defaultAddress
      ? defaultAddress
          .addressType
          .charAt(0)
          .toUpperCase() +
        defaultAddress
          .addressType
          .slice(1)
      : "";

  /* =======================================================
     UI

     IMPORTANT:
     - main par overflow-hidden NAHI.
     - 50px height calculation NAHI.
     - AccountSidebar direct flex child hai.
     - Isi se mobile + desktop sticky properly chalega.
  ======================================================= */

  return (
    <>
      <Header />

      <main
        className="
          min-h-screen
          bg-[#FCFAF8]
          text-[#211A18]
        "
      >
        {/* LOGIN TOAST */}

        {showLoginMessage && (
          <div
            className="
              fixed
              right-5
              top-5
              z-[9999]
              flex
              min-w-[260px]
              items-center
              gap-3
              rounded-[14px]
              border
              border-[#8C1839]/15
              bg-white
              px-5
              py-4
              shadow-[0_20px_60px_rgba(33,26,24,0.20)]
            "
          >
            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-[#F8E1E2]
                text-[18px]
                font-bold
                text-[#8C1839]
              "
            >
              !
            </div>

            <div>
              <p
                className="
                  text-[13px]
                  font-semibold
                "
              >
                Please login
              </p>

              <p
                className="
                  mt-1
                  text-[10px]
                  text-[#211A18]/55
                "
              >
                Redirecting to
                home...
              </p>
            </div>
          </div>
        )}

        {/* =================================================
            IMPORTANT LAYOUT

            AccountSidebar direct child hai.
            Iske aas paas koi same-height wrapper nahi hai.
        ================================================= */}

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
          {/* LEFT STICKY */}

          <AccountSidebar />

          {/* RIGHT CONTENT */}

          <section
            className="
              min-w-0
              flex-1
              p-4

              md:p-6

              lg:p-7
            "
          >
            {/* ===============================================
                WELCOME
            =============================================== */}

            <div
              className="
                relative
                min-h-[280px]
                overflow-hidden
                rounded-[22px]
                bg-[#F7E6E1]
              "
            >
              <div
                className="
                  absolute
                  inset-y-0
                  right-0
                  hidden
                  w-[48%]

                  md:block
                "
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}

                <img
                  src={
                    WELCOME_BANNER
                  }
                  alt="Hivra Soft lifestyle"
                  className="
                    h-full
                    w-full
                    object-cover
                    object-center
                  "
                />

                <div
                  className="
                    absolute
                    inset-0
                    bg-gradient-to-r
                    from-[#F7E6E1]
                    via-[#F7E6E1]/35
                    to-transparent
                  "
                />
              </div>

              <div
                className="
                  relative
                  z-10
                  flex
                  min-h-[280px]
                  items-center
                  px-7
                  py-10

                  md:px-12

                  xl:px-14
                "
              >
                <div
                  className="
                    max-w-[720px]

                    md:max-w-[58%]
                  "
                >
                  <p
                    className="
                      mb-5
                      text-[11px]
                      font-medium
                      uppercase
                      tracking-[0.38em]
                      text-[#211A18]/50
                    "
                  >
                    My Account
                  </p>

                  <h1
                    className="
                      font-serif
                      text-[42px]
                      leading-[1.05]
                      tracking-[-0.02em]

                      md:text-[54px]

                      xl:text-[64px]
                    "
                  >
                    Welcome back,{" "}

                    {accountLoading
                      ? "..."
                      : accountName ||
                        "there"}{" "}

                    <span
                      className="
                        font-normal
                        text-[#B94A62]
                      "
                    >
                      ♡
                    </span>
                  </h1>

                  <p
                    className="
                      mt-6
                      text-[15px]
                      leading-7
                      text-[#211A18]/65

                      md:text-[16px]
                    "
                  >
                    So glad to have
                    you here.
                    Let&apos;s make
                    today stylish!
                  </p>
                </div>
              </div>
            </div>

            {/* ===============================================
                ROW ONE
            =============================================== */}

            <div
              className="
                mt-5
                grid
                gap-4

                xl:grid-cols-3
              "
            >
              <AccountProfileCard
                account={account}
                loading={
                  accountLoading
                }
                error={
                  accountError
                }
              />

              {/* ORDERS */}

              <DashboardCard>
                <CardHeader
                  icon="◇"
                  title="Orders"
                  subtitle="Track, return or buy again"
                  action="View All"
                  href="/account/orders"
                />

                {ordersLoading ? (
                  <DashboardLoading />
                ) : latestOrder ? (
                  <div
                    className="
                      mt-5
                      rounded-[14px]
                      bg-[#F8F5F2]
                      p-4
                    "
                  >
                    <div
                      className="
                        mb-3
                        flex
                        items-center
                        justify-between
                        gap-3
                      "
                    >
                      <span
                        className="
                          text-[13px]
                          font-semibold
                        "
                      >
                        Latest Order
                      </span>

                      <span
                        className={`
                          rounded-full
                          px-3
                          py-1
                          text-[9px]
                          font-medium

                          ${statusClasses(
                            latestOrder.status,
                          )}
                        `}
                      >
                        {formatStatus(
                          latestOrder.status,
                        )}
                      </span>
                    </div>

                    <div
                      className="
                        flex
                        gap-4
                      "
                    >
                      <div
                        className="
                          h-[76px]
                          w-[68px]
                          shrink-0
                          overflow-hidden
                          rounded-[10px]
                          bg-[#E9DFD8]
                        "
                      >
                        {latestOrderItem?.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={
                              latestOrderItem.image
                            }
                            alt={
                              latestOrderItem.name
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
                              flex
                              h-full
                              w-full
                              items-center
                              justify-center
                              text-[#8C1839]
                            "
                          >
                            <Package
                              size={22}
                            />
                          </div>
                        )}
                      </div>

                      <div
                        className="
                          min-w-0
                          flex-1
                        "
                      >
                        <p
                          className="
                            line-clamp-2
                            text-[13px]
                            font-medium
                          "
                        >
                          {latestOrderItem?.name ||
                            `Order #${latestOrder.orderNumber}`}
                        </p>

                        <p
                          className="
                            mt-1
                            text-[11px]
                            text-[#211A18]/50
                          "
                        >
                          {
                            latestOrder
                              .items
                              .length
                          }{" "}
                          item
                          {latestOrder
                            .items
                            .length ===
                          1
                            ? ""
                            : "s"}

                          {latestOrderItem?.size
                            ? ` • Size ${latestOrderItem.size}`
                            : ""}
                        </p>

                        <div
                          className="
                            mt-3
                            flex
                            items-center
                            justify-between
                            gap-2
                          "
                        >
                          <span
                            className="
                              text-[14px]
                              font-bold
                            "
                          >
                            {money(
                              latestOrder.total,
                            )}
                          </span>

                          <span
                            className="
                              text-[10px]
                              text-[#211A18]/50
                            "
                          >
                            {formatDate(
                              latestOrder.createdAt,
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <DashboardEmpty
                    icon="◇"
                    title="No orders yet"
                    description="Your latest order will appear here after checkout."
                    href="/"
                    action="Start Shopping"
                  />
                )}
              </DashboardCard>

              {/* WISHLIST */}

              <DashboardCard>
                <CardHeader
                  icon="♡"
                  title="Wishlist"
                  subtitle="Your saved favorites"
                  action="View All"
                  href="/wishlist"
                />

                {wishlistLoading ? (
                  <DashboardLoading />
                ) : wishlist.length >
                  0 ? (
                  <div
                    className="
                      mt-5
                      grid
                      grid-cols-2
                      gap-3
                    "
                  >
                    {wishlist.map(
                      (
                        item,
                        index,
                      ) => (
                        <Link
                          key={`${item.productId}-${index}`}
                          href={
                            item.slug
                              ? `/product/${encodeURIComponent(
                                  item.slug,
                                )}`
                              : "/wishlist"
                          }
                          className="
                            group
                            min-w-0
                          "
                        >
                          <div
                            className="
                              relative
                              aspect-[1.35/1]
                              overflow-hidden
                              rounded-[11px]
                              bg-[#F3ECE7]
                            "
                          >
                            {item.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={
                                  item.image
                                }
                                alt={
                                  item.name
                                }
                                className="
                                  h-full
                                  w-full
                                  object-cover
                                  transition
                                  duration-300

                                  group-hover:scale-105
                                "
                              />
                            ) : (
                              <div
                                className="
                                  flex
                                  h-full
                                  w-full
                                  items-center
                                  justify-center
                                  text-[#8C1839]
                                "
                              >
                                <Heart
                                  size={22}
                                />
                              </div>
                            )}

                            <span
                              className="
                                absolute
                                right-2
                                top-2
                                flex
                                h-7
                                w-7
                                items-center
                                justify-center
                                rounded-full
                                bg-white
                                text-[#C75C70]
                                shadow-sm
                              "
                            >
                              ♥
                            </span>
                          </div>

                          <p
                            className="
                              mt-2
                              text-[12px]
                              font-semibold
                            "
                          >
                            {money(
                              item.price,
                            )}
                          </p>

                          <p
                            className="
                              truncate
                              text-[10px]
                              text-[#211A18]/60
                            "
                          >
                            {
                              item.name
                            }
                          </p>
                        </Link>
                      ),
                    )}
                  </div>
                ) : (
                  <DashboardEmpty
                    icon="♡"
                    title="Wishlist is empty"
                    description="Save something you love and it will appear here."
                    href="/"
                    action="Explore Products"
                  />
                )}
              </DashboardCard>
            </div>

            {/* ===============================================
                ROW TWO
            =============================================== */}

            <div
              className="
                mt-4
                grid
                gap-4

                xl:grid-cols-[1fr_1.1fr_0.6fr]
              "
            >
              {/* CART */}

              <DashboardCard>
                <CardHeader
                  icon="♧"
                  title="Cart"
                  subtitle="Items ready for checkout"
                  action="View Cart"
                  href="/cart"
                />

                {cartLoading ? (
                  <DashboardLoading />
                ) : cart.itemCount >
                  0 ? (
                  <>
                    <div
                      className="
                        mt-5
                        flex
                        gap-4
                      "
                    >
                      <div
                        className="
                          h-[72px]
                          w-[88px]
                          shrink-0
                          overflow-hidden
                          rounded-[10px]
                          bg-[#EFE7E1]
                        "
                      >
                        {cart.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={
                              cart.image
                            }
                            alt={
                              cart.name ||
                              "Cart Product"
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
                              flex
                              h-full
                              w-full
                              items-center
                              justify-center
                              text-[#8C1839]
                            "
                          >
                            <ShoppingBag
                              size={22}
                            />
                          </div>
                        )}
                      </div>

                      <div>
                        <p
                          className="
                            text-[13px]
                          "
                        >
                          {
                            cart.itemCount
                          }{" "}
                          item
                          {cart.itemCount ===
                          1
                            ? ""
                            : "s"}{" "}
                          in your cart
                        </p>

                        <p
                          className="
                            mt-2
                            text-[11px]
                            text-[#211A18]/50
                          "
                        >
                          Subtotal
                        </p>

                        <p
                          className="
                            text-[15px]
                            font-bold
                          "
                        >
                          {money(
                            cart.subtotal,
                          )}
                        </p>
                      </div>
                    </div>

                    <Link
                      href="/account/checkout"
                      className="
                        mt-4
                        flex
                        h-11
                        w-full
                        items-center
                        justify-center
                        gap-3
                        rounded-[10px]
                        bg-[#D97887]
                        text-[12px]
                        font-medium
                        text-white
                        transition
                        duration-300

                        hover:bg-[#8C1839]
                      "
                    >
                      Proceed to
                      Checkout

                      <span>
                        →
                      </span>
                    </Link>
                  </>
                ) : (
                  <DashboardEmpty
                    icon="♧"
                    title="Your cart is empty"
                    description="Add something to your bag and it will appear here."
                    href="/"
                    action="Continue Shopping"
                  />
                )}
              </DashboardCard>

              {/* ADDRESS */}

              <DashboardCard>
                <CardHeader
                  icon="⌖"
                  title="Addresses"
                  subtitle="Manage your delivery addresses"
                  action="Add"
                  href="/account/addresses"
                />

                {addressLoading ? (
                  <DashboardLoading />
                ) : addressError ? (
                  <div
                    className="
                      mt-5
                      rounded-[14px]
                      border
                      border-red-100
                      bg-red-50
                      p-5
                    "
                  >
                    <p
                      className="
                        text-[11px]
                        text-red-700
                      "
                    >
                      {
                        addressError
                      }
                    </p>
                  </div>
                ) : defaultAddress ? (
                  <div
                    className="
                      mt-5
                      rounded-[14px]
                      bg-[#F8F5F2]
                      p-5
                    "
                  >
                    <div
                      className="
                        flex
                        items-start
                        gap-4
                      "
                    >
                      <span
                        className="
                          mt-1
                          text-[22px]
                        "
                      >
                        {defaultAddress.addressType ===
                        "home"
                          ? "⌂"
                          : defaultAddress.addressType ===
                              "work"
                            ? "▣"
                            : "⌖"}
                      </span>

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
                            className="
                              inline-flex
                              rounded-full
                              bg-[#F7DEE1]
                              px-3
                              py-1
                              text-[10px]
                              font-medium
                              text-[#B04B5C]
                            "
                          >
                            Default
                          </span>

                          <span
                            className="
                              inline-flex
                              rounded-full
                              bg-white
                              px-3
                              py-1
                              text-[10px]
                              font-medium
                              text-[#211A18]/60
                            "
                          >
                            {
                              defaultAddressType
                            }
                          </span>
                        </div>

                        <div
                          className="
                            mt-2
                            flex
                            justify-between
                            gap-3
                          "
                        >
                          <div
                            className="
                              min-w-0
                            "
                          >
                            <p
                              className="
                                text-[12px]
                                font-semibold
                              "
                            >
                              {
                                defaultAddress.fullName
                              }
                            </p>

                            <p
                              className="
                                mt-1
                                text-[11px]
                                leading-5
                                text-[#211A18]/60
                              "
                            >
                              {
                                defaultAddressLine1
                              }

                              {defaultAddressLine1 && (
                                <br />
                              )}

                              {
                                defaultAddressLine2
                              }

                              {defaultAddressLine2 && (
                                <br />
                              )}

                              {
                                defaultAddressPhone
                              }
                            </p>
                          </div>

                          <Link
                            href="/account/addresses"
                            className="
                              shrink-0
                              text-[11px]
                              font-medium
                              text-[#B04B5C]

                              hover:underline
                            "
                          >
                            Edit
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <DashboardEmpty
                    icon="⌖"
                    title="No saved address"
                    description="Add an address for faster checkout."
                    href="/account/addresses"
                    action="Add Address"
                  />
                )}
              </DashboardCard>

              {/* QUOTE */}

              <div
                className="
                  relative
                  flex
                  min-h-[250px]
                  flex-col
                  items-center
                  justify-center
                  overflow-hidden
                  rounded-[16px]
                  bg-gradient-to-br
                  from-[#F6E2DE]
                  to-[#F2E9E3]
                  p-6
                  text-center
                "
              >
                <Sparkles
                  size={19}
                  className="
                    mb-2
                    text-[#B94A62]
                  "
                />

                <p
                  className="
                    font-serif
                    text-[29px]
                    italic
                    leading-tight
                  "
                >
                  Same girl...
                  <br />
                  bigger dreams
                </p>

                <span
                  className="
                    mt-3
                    text-[25px]
                    text-[#8C1839]
                  "
                >
                  ♡
                </span>

                <p
                  className="
                    mt-6
                    font-serif
                    text-[19px]
                  "
                >
                  Hivra Soft
                </p>

                <p
                  className="
                    mt-1
                    text-[7px]
                    uppercase
                    tracking-[0.35em]
                    text-[#211A18]/50
                  "
                >
                  Fashion lives in
                  kindness
                </p>
              </div>
            </div>

            <div
              className="
                h-5
              "
            />
          </section>
        </div>
      </main>
    </>
  );
}

/* =========================================================
   ACCOUNT CARD
========================================================= */

function AccountProfileCard({
  account,
  loading,
  error,
}: {
  account:
    | AccountData
    | null;

  loading: boolean;

  error: string;
}) {
  const name =
    account
      ? capitalizeName(
          account.name,
        )
      : "";

  const avatar =
    account?.avatar?.url?.trim() ||
    "";

  return (
    <DashboardCard>
      <CardHeader
        icon="👤"
        title="Account"
        subtitle="Manage your personal information"
        action="Edit"
        href="/account"
      />

      {loading ? (
        <DashboardLoading />
      ) : error ? (
        <p
          className="
            mt-5
            text-[11px]
            text-red-600
          "
        >
          {error}
        </p>
      ) : account ? (
        <div
          className="
            mt-5
            space-y-3
          "
        >
          <InfoRow
            icon={
              avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatar}
                  alt={name}
                  className="
                    h-6
                    w-6
                    rounded-full
                    object-cover
                  "
                />
              ) : (
                <UserRound
                  size={18}
                />
              )
            }
          >
            {name}
          </InfoRow>

          <InfoRow
            icon={
              <Mail size={18} />
            }
          >
            {account.email}
          </InfoRow>

          <InfoRow
            icon={
              <Phone size={18} />
            }
          >
            {formatPhone(
              account.phone,
            )}
          </InfoRow>
        </div>
      ) : (
        <p
          className="
            mt-5
            text-[11px]
            text-[#211A18]/55
          "
        >
          Please login to view
          your account.
        </p>
      )}
    </DashboardCard>
  );
}

/* =========================================================
   DASHBOARD CARD
========================================================= */

function DashboardCard({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      className="
        min-w-0
        rounded-[16px]
        border
        border-[#211A18]/10
        bg-white
        p-5
        shadow-[0_4px_20px_rgba(33,26,24,0.03)]
      "
    >
      {children}
    </div>
  );
}

/* =========================================================
   CARD HEADER
========================================================= */

function CardHeader({
  icon,
  title,
  subtitle,
  action,
  href,
}: {
  icon: string;
  title: string;
  subtitle: string;
  action: string;
  href: string;
}) {
  return (
    <div
      className="
        flex
        items-start
        justify-between
        gap-3
      "
    >
      <div
        className="
          flex
          min-w-0
          items-center
          gap-4
        "
      >
        <div
          className="
            flex
            h-14
            w-14
            shrink-0
            items-center
            justify-center
            rounded-full
            bg-[#F8E1E2]
            text-[25px]
            text-[#8C1839]
          "
        >
          {icon}
        </div>

        <div
          className="
            min-w-0
          "
        >
          <h2
            className="
              font-serif
              text-[23px]
              leading-none
            "
          >
            {title}
          </h2>

          <p
            className="
              mt-2
              text-[11px]
              text-[#211A18]/50
            "
          >
            {subtitle}
          </p>
        </div>
      </div>

      <Link
        href={href}
        className="
          shrink-0
          rounded-[10px]
          bg-[#F6F1ED]
          px-4
          py-3
          text-[10px]
          font-medium
          transition
          duration-300

          hover:bg-[#EFE3DC]
          hover:text-[#8C1839]
        "
      >
        {action}
      </Link>
    </div>
  );
}

/* =========================================================
   INFO ROW
========================================================= */

function InfoRow({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className="
        flex
        items-center
        gap-4
      "
    >
      <span
        className="
          flex
          w-6
          shrink-0
          justify-center
        "
      >
        {icon}
      </span>

      <p
        className="
          min-w-0
          truncate
          text-[13px]
        "
      >
        {children}
      </p>
    </div>
  );
}

/* =========================================================
   LOADING
========================================================= */

function DashboardLoading() {
  return (
    <div
      className="
        mt-5
        animate-pulse
        rounded-[14px]
        bg-[#F8F5F2]
        p-4
      "
    >
      <div
        className="
          h-3
          w-[90px]
          rounded
          bg-[#E8DDD7]
        "
      />

      <div
        className="
          mt-4
          flex
          gap-3
        "
      >
        <div
          className="
            h-[72px]
            w-[70px]
            rounded-[10px]
            bg-[#E8DDD7]
          "
        />

        <div
          className="
            flex-1
            space-y-3
          "
        >
          <div
            className="
              h-3
              w-[75%]
              rounded
              bg-[#E8DDD7]
            "
          />

          <div
            className="
              h-3
              w-[55%]
              rounded
              bg-[#E8DDD7]
            "
          />

          <div
            className="
              h-4
              w-[35%]
              rounded
              bg-[#E8DDD7]
            "
          />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   EMPTY
========================================================= */

function DashboardEmpty({
  icon,
  title,
  description,
  href,
  action,
}: {
  icon: string;
  title: string;
  description: string;
  href: string;
  action: string;
}) {
  return (
    <div
      className="
        mt-5
        flex
        min-h-[150px]
        flex-col
        items-center
        justify-center
        rounded-[14px]
        border
        border-dashed
        border-[#DCCFCC]
        bg-[#FCF9F7]
        p-5
        text-center
      "
    >
      <div
        className="
          flex
          h-11
          w-11
          items-center
          justify-center
          rounded-full
          bg-[#F8E1E2]
          text-[20px]
          text-[#8C1839]
        "
      >
        {icon}
      </div>

      <p
        className="
          mt-3
          text-[12px]
          font-semibold
        "
      >
        {title}
      </p>

      <p
        className="
          mt-1
          max-w-[240px]
          text-[10px]
          leading-4
          text-[#211A18]/50
        "
      >
        {description}
      </p>

      <Link
        href={href}
        className="
          mt-3
          rounded-[8px]
          bg-[#8C1839]
          px-4
          py-2
          text-[9px]
          font-semibold
          text-white
          transition

          hover:bg-[#6E102D]
        "
      >
        {action}
      </Link>
    </div>
  );
}