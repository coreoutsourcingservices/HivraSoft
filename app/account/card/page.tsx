// @ts-nocheck
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Heart,
  Loader2,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Trash2,
  Truck,
} from "lucide-react";

import Header from "@/src/components/Header/Header";
import AccountSidebar from "@/app/account/components/AccountSidebar";
import { catalogProductsFromResponse } from "@/lib/product-catalog";

/* =========================================================
   API
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:5000";

const EMPTY_CART = {
  items: [],
  totalItems: 0,
  subtotal: 0,
  automaticDiscount: 0,
  codeDiscount: 0,
  discount: 0,
  appliedDiscountCode: "",
  taxableAmount: 0,
  tax: 0,
  taxSummary: null,
  total: 0,
};

async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");

  let body = options.body;

  if (
    body !== undefined &&
    body !== null &&
    !(body instanceof FormData) &&
    typeof body !== "string"
  ) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body,
    credentials: "include",
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") || "";
  let data = null;

  if (contentType.includes("application/json")) {
    data = await response.json().catch(() => null);
  } else {
    const text = await response.text().catch(() => "");
    data = text ? { message: text } : null;
  }

  if (!response.ok) {
    throw {
      status: response.status,
      message:
        data?.message ||
        `Request failed with status ${response.status}.`,
    };
  }

  return data;
}

function getErrorMessage(error, fallback) {
  if (
    error &&
    typeof error === "object" &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return fallback;
}

function isUnauthorized(error) {
  return (
    error &&
    typeof error === "object" &&
    error.status === 401
  );
}

function requestLogin() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new Event("hivrasoft-auth-required")
    );
  }
}

function notifyCartUpdated(cart) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent("hivrasoft-cart-updated", {
      detail: {
        count: Number(cart?.totalItems || 0),
      },
    })
  );
}

/* =========================================================
   API FUNCTIONS
========================================================= */

async function getCartApi() {
  const data = await apiRequest("/api/cart", {
    method: "GET",
  });

  return data?.cart || EMPTY_CART;
}

async function updateCartItemApi(cartItemId, quantity) {
  const data = await apiRequest(
    `/api/cart/${encodeURIComponent(cartItemId)}`,
    {
      method: "PATCH",
      body: { quantity },
    }
  );

  return data?.cart || EMPTY_CART;
}

async function removeCartItemApi(cartItemId) {
  const data = await apiRequest(
    `/api/cart/${encodeURIComponent(cartItemId)}`,
    {
      method: "DELETE",
    }
  );

  return data?.cart || EMPTY_CART;
}

async function clearCartApi() {
  const data = await apiRequest("/api/cart", {
    method: "DELETE",
  });

  return data?.cart || EMPTY_CART;
}

async function applyDiscountCodeApi(code) {
  const data = await apiRequest("/api/cart/discount-code", {
    method: "POST",
    body: { code },
  });
  return data?.cart || EMPTY_CART;
}

async function removeDiscountCodeApi() {
  const data = await apiRequest("/api/cart/discount-code", {
    method: "DELETE",
  });
  return data?.cart || EMPTY_CART;
}

async function addWishlistApi(productId) {
  return apiRequest("/api/wishlist", {
    method: "POST",
    body: { productId },
  });
}

async function getActiveProductsApi() {
  const data = await apiRequest("/api/products/catalog", {
    method: "GET",
  });

  return catalogProductsFromResponse(data);
}

/* =========================================================
   HELPERS
========================================================= */

function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function itemImage(item) {
  return (
    item?.selectedColor?.images?.[0]?.url ||
    item?.product?.mainImages?.[0]?.url ||
    ""
  );
}

function productImage(product) {
  return (
    product?.mainImages?.[0]?.url ||
    product?.colors?.[0]?.images?.[0]?.url ||
    ""
  );
}

function productDiscount(product) {
  const price = Number(product?.price || 0);
  const compareAt = Number(product?.compareAtPrice || 0);

  if (!price || compareAt <= price) {
    return 0;
  }

  return Math.round(
    ((compareAt - price) / compareAt) * 100
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function CartPage() {
  const [cart, setCart] = useState(EMPTY_CART);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loginRequired, setLoginRequired] = useState(false);
  const [error, setError] = useState("");
  const [busyItemId, setBusyItemId] = useState("");
  const [clearing, setClearing] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [applyingCode, setApplyingCode] = useState(false);

  /* =======================================================
     LOAD REAL CART FROM API
  ======================================================= */

  const loadCart = async () => {
    try {
      setLoading(true);
      setError("");
      setLoginRequired(false);

      const [cartResult, productResult] = await Promise.all([
        getCartApi(),
        getActiveProductsApi().catch(() => []),
      ]);

      setCart(cartResult);
      notifyCartUpdated(cartResult);

      const cartProductIds = new Set(
        (cartResult?.items || [])
          .map((item) => item?.product?._id)
          .filter(Boolean)
      );

      setRecommendations(
        productResult
          .filter(
            (product) =>
              product?._id &&
              !cartProductIds.has(product._id)
          )
          .slice(0, 4)
      );
    } catch (error) {
      if (isUnauthorized(error)) {
        setLoginRequired(true);
        setCart(EMPTY_CART);
        notifyCartUpdated(EMPTY_CART);

        const products = await getActiveProductsApi()
          .then((items) => items.slice(0, 4))
          .catch(() => []);

        setRecommendations(products);
      } else {
        setError(
          getErrorMessage(
            error,
            "Unable to load your cart."
          )
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCart();
  }, []);

  /* =======================================================
     VALUES ONLY FROM CART API
  ======================================================= */

  const items = useMemo(
    () => (Array.isArray(cart?.items) ? cart.items : []),
    [cart]
  );

  const totalItems = Number(cart?.totalItems || 0);
  const subtotal = Number(cart?.subtotal || 0);
  const automaticDiscount = Number(cart?.automaticDiscount || 0);
  const codeDiscount = Number(cart?.codeDiscount || 0);
  const totalDiscount = Number(cart?.discount || 0);
  const tax = Number(cart?.tax || 0);
  const shipping = 0;
  const estimatedTotal = Number(cart?.total ?? (subtotal - totalDiscount + tax + shipping));

  async function handleApplyDiscountCode() {
    if (!discountCode.trim() || applyingCode) return;
    try {
      setApplyingCode(true); setError("");
      const nextCart = await applyDiscountCodeApi(discountCode);
      setCart(nextCart); setDiscountCode("");
      notifyCartUpdated(nextCart);
    } catch (error) {
      setError(getErrorMessage(error, "Unable to apply discount code."));
    } finally { setApplyingCode(false); }
  }

  async function handleRemoveDiscountCode() {
    if (applyingCode) return;
    try {
      setApplyingCode(true); setError("");
      const nextCart = await removeDiscountCodeApi();
      setCart(nextCart); notifyCartUpdated(nextCart);
    } catch (error) {
      setError(getErrorMessage(error, "Unable to remove discount code."));
    } finally { setApplyingCode(false); }
  }

  /* =======================================================
     UPDATE QUANTITY
  ======================================================= */

  const handleQuantity = async (item, nextQuantity) => {
    if (
      busyItemId ||
      nextQuantity < 1 ||
      nextQuantity > 99
    ) {
      return;
    }

    const availableStock = Number(
      item?.availableStock || 0
    );

    if (
      availableStock > 0 &&
      nextQuantity > availableStock
    ) {
      setError(
        `Only ${availableStock} item(s) available in stock.`
      );
      return;
    }

    try {
      setBusyItemId(item._id);
      setError("");

      const nextCart = await updateCartItemApi(
        item._id,
        nextQuantity
      );

      setCart(nextCart);
      notifyCartUpdated(nextCart);
    } catch (error) {
      if (isUnauthorized(error)) {
        requestLogin();
        return;
      }

      setError(
        getErrorMessage(
          error,
          "Unable to update quantity."
        )
      );
    } finally {
      setBusyItemId("");
    }
  };

  /* =======================================================
     REMOVE CART ITEM
  ======================================================= */

  const handleRemove = async (cartItemId) => {
    if (busyItemId) {
      return;
    }

    try {
      setBusyItemId(cartItemId);
      setError("");

      const nextCart = await removeCartItemApi(
        cartItemId
      );

      setCart(nextCart);
      notifyCartUpdated(nextCart);
    } catch (error) {
      if (isUnauthorized(error)) {
        requestLogin();
        return;
      }

      setError(
        getErrorMessage(
          error,
          "Unable to remove this item."
        )
      );
    } finally {
      setBusyItemId("");
    }
  };

  /* =======================================================
     SAVE TO WISHLIST + REMOVE FROM CART
  ======================================================= */

  const handleSaveForLater = async (item) => {
    if (!item?.product?._id || busyItemId) {
      return;
    }

    try {
      setBusyItemId(item._id);
      setError("");

      await addWishlistApi(item.product._id);

      const nextCart = await removeCartItemApi(
        item._id
      );

      setCart(nextCart);
      notifyCartUpdated(nextCart);
    } catch (error) {
      if (isUnauthorized(error)) {
        requestLogin();
        return;
      }

      setError(
        getErrorMessage(
          error,
          "Unable to save this product to wishlist."
        )
      );
    } finally {
      setBusyItemId("");
    }
  };

  /* =======================================================
     CLEAR CART
  ======================================================= */

  const handleClearCart = async () => {
    if (clearing || items.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      "Remove all products from your cart?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setClearing(true);
      setError("");

      const nextCart = await clearCartApi();

      setCart(nextCart);
      notifyCartUpdated(nextCart);
    } catch (error) {
      if (isUnauthorized(error)) {
        requestLogin();
        return;
      }

      setError(
        getErrorMessage(
          error,
          "Unable to clear cart."
        )
      );
    } finally {
      setClearing(false);
    }
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      <Header />

      <main className="bg-[#fbf8f5]">
        <div className="mx-auto flex min-h-[calc(100vh-103px)] max-w-[1600px] bg-white">
          <AccountSidebar />

          <div className="min-w-0 flex-1 bg-[#fffdfb] p-4 md:p-6 lg:p-7">
            {/* =============================================
                HERO
            ============================================= */}

            <section className="relative overflow-hidden rounded-[18px] border border-[#f1dedf] bg-gradient-to-r from-[#fff0ef] via-[#fff7f5] to-[#fbe4e7] px-6 py-7 md:min-h-[166px] md:px-8 md:py-7">
              <div className="pointer-events-none absolute -right-12 -top-14 h-52 w-52 rounded-full border-[38px] border-[#d66b7c]/[0.07]" />
              <div className="pointer-events-none absolute bottom-[-90px] right-[20%] h-44 w-44 rounded-full bg-[#e8a8b2]/10" />

              <div className="relative z-10 flex flex-wrap items-center justify-between gap-5">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.3em] text-[#876f6b]">
                    My Cart
                  </p>

                  <h1 className="mt-3 font-serif text-[40px] font-normal leading-none text-[#211A18] md:text-[48px]">
                    My Cart
                    <span className="ml-3 text-[#bf3158]">
                      ♡
                    </span>
                  </h1>

                  <p className="mt-3 max-w-[520px] text-[12px] leading-[1.6] text-[#756965] md:text-[13px]">
                    Handpicked styles, just for you.
                    You&apos;re one step closer to a more
                    stylish you.
                  </p>
                </div>

                <div className="flex min-w-[165px] items-center gap-3 rounded-2xl border border-white/80 bg-white/75 px-4 py-3 shadow-sm backdrop-blur-sm">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-[#fde9ec] text-[#ad1743]">
                    <ShoppingBag
                      size={22}
                      strokeWidth={1.7}
                    />
                  </div>

                  <div>
                    <div className="font-serif text-[22px] leading-none text-[#211A18]">
                      {totalItems}
                    </div>

                    <div className="mt-1 text-[9px] text-[#857873]">
                      Items in Cart
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* =============================================
                ERROR
            ============================================= */}

            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[11px] leading-5 text-red-700">
                <AlertCircle
                  className="mt-0.5 shrink-0"
                  size={16}
                />

                <span>{error}</span>
              </div>
            )}

            {/* =============================================
                LOADING
            ============================================= */}

            {loading ? (
              <section className="mt-5 flex min-h-[430px] items-center justify-center rounded-2xl border border-[#eee5e1] bg-white">
                <div className="text-center">
                  <Loader2 className="mx-auto animate-spin text-[#a31340]" />

                  <p className="mt-3 text-[12px] text-[#746965]">
                    Loading your cart...
                  </p>
                </div>
              </section>
            ) : items.length === 0 ? (
              /* ===========================================
                 EMPTY CART
              =========================================== */

              <section className="relative mt-5 overflow-hidden rounded-[18px] border border-[#eee5e1] bg-white px-5 py-12 text-center md:py-14">
                <div className="pointer-events-none absolute -left-20 bottom-[-95px] h-52 w-52 rounded-full bg-[#f8e4e1]/60" />
                <div className="pointer-events-none absolute -right-16 top-[-80px] h-48 w-48 rounded-full bg-[#fde9eb]/70" />

                <div className="relative z-10 mx-auto max-w-[600px]">
                  <div className="relative mx-auto h-[190px] w-[240px]">
                    <div className="absolute left-1/2 top-1/2 h-[155px] w-[155px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[#fff1f3] to-[#fbe0e5]" />

                    <div className="absolute left-1/2 top-1/2 grid h-[118px] w-[118px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#eea9b7] bg-white text-[#c72f59] shadow-[0_20px_45px_rgba(166,19,64,0.12)]">
                      <ShoppingCart
                        size={64}
                        strokeWidth={1.2}
                      />
                    </div>

                    <Heart
                      className="absolute left-4 top-6 text-[#eb8799]"
                      size={25}
                      strokeWidth={1.5}
                    />

                    <Sparkles
                      className="absolute right-3 top-5 text-[#e09a5c]"
                      size={25}
                      strokeWidth={1.4}
                    />

                    <Heart
                      className="absolute bottom-7 right-6 text-[#d45f78]"
                      size={19}
                      strokeWidth={1.5}
                    />
                  </div>

                  <h2 className="font-serif text-[30px] font-normal text-[#211A18] md:text-[34px]">
                    {loginRequired
                      ? "Your cart is waiting"
                      : "Your cart is empty"}
                  </h2>

                  <p className="mx-auto mt-3 max-w-[440px] text-[12px] leading-6 text-[#716762]">
                    {loginRequired
                      ? "Login to load your saved cart and continue shopping from where you left off."
                      : "Looks like you haven’t added anything yet. Start shopping and your selected products will appear here automatically."}
                  </p>

                  {loginRequired ? (
                    <button
                      type="button"
                      onClick={requestLogin}
                      className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#a31340] px-8 text-[11px] font-semibold text-white shadow-[0_10px_25px_rgba(163,19,64,0.18)] transition hover:bg-[#861033]"
                    >
                      <ShoppingBag size={17} />
                      Login to Continue
                    </button>
                  ) : (
                    <Link
                      href="/women"
                      className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#a31340] px-8 text-[11px] font-semibold text-white shadow-[0_10px_25px_rgba(163,19,64,0.18)] transition hover:bg-[#861033]"
                    >
                      <ShoppingBag size={17} />
                      Explore Products
                      <ArrowRight size={15} />
                    </Link>
                  )}

                  <div className="mx-auto mt-7 flex max-w-[470px] flex-wrap items-center justify-center gap-4 text-[9px] text-[#9b8d88]">
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheck size={13} />
                      Secure Checkout
                    </span>

                    <span className="h-1 w-1 rounded-full bg-[#d8b1ad]" />

                    <span className="inline-flex items-center gap-1.5">
                      <Truck size={13} />
                      Free Shipping
                    </span>

                    <span className="h-1 w-1 rounded-full bg-[#d8b1ad]" />

                    <span className="inline-flex items-center gap-1.5">
                      <Heart size={13} />
                      Save Favorites
                    </span>
                  </div>
                </div>
              </section>
            ) : (
              /* ===========================================
                 CART WITH REAL API ITEMS
              =========================================== */

              <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                {/* CART ITEMS */}

                <section className="min-w-0 overflow-hidden rounded-2xl border border-[#211A18]/10 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#211A18]/10 px-4 py-4 md:px-5">
                    <h2 className="font-serif text-[21px] text-[#211A18]">
                      Cart Items ({items.length})
                    </h2>

                    <button
                      type="button"
                      onClick={() =>
                        void handleClearCart()
                      }
                      disabled={clearing}
                      className="inline-flex items-center gap-2 text-[10px] font-semibold text-[#c64558] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {clearing ? (
                        <Loader2
                          size={14}
                          className="animate-spin"
                        />
                      ) : (
                        <Trash2 size={14} />
                      )}
                      Clear Cart
                    </button>
                  </div>

                  <div className="divide-y divide-[#211A18]/10">
                    {items.map((item) => {
                      const image = itemImage(item);
                      const availableStock = Number(
                        item?.availableStock || 0
                      );
                      const busy = busyItemId === item._id;

                      return (
                        <article
                          key={item._id}
                          className="grid gap-4 px-4 py-5 md:grid-cols-[96px_minmax(0,1fr)_120px_145px] md:items-center md:px-5"
                        >
                          {/* IMAGE */}

                          <Link
                            href={
                              item?.product?.slug
                                ? `/product/${item.product.slug}`
                                : "#"
                            }
                            className="h-[112px] overflow-hidden rounded-xl bg-[#f5eeea] md:h-[96px]"
                          >
                            {image ? (
                              <img
                                src={image}
                                alt={
                                  item?.product?.name ||
                                  "Cart product"
                                }
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="grid h-full w-full place-items-center text-[#c9a8aa]">
                                <ShoppingBag
                                  size={31}
                                  strokeWidth={1.2}
                                />
                              </div>
                            )}
                          </Link>

                          {/* PRODUCT */}

                          <div className="min-w-0">
                            {item?.product ? (
                              <Link
                                href={`/product/${item.product.slug}`}
                                className="block truncate font-serif text-[16px] text-[#211A18] transition hover:text-[#a31340]"
                              >
                                {item.product.name}
                              </Link>
                            ) : (
                              <div className="font-serif text-[16px] text-[#211A18]">
                                Product unavailable
                              </div>
                            )}

                            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-[#847873]">
                              {item?.selectedSize?.size && (
                                <span>
                                  Size: {item.selectedSize.size}
                                </span>
                              )}

                              {item?.selectedColor?.name && (
                                <>
                                  <span>•</span>
                                  <span className="inline-flex items-center gap-1.5">
                                    {item.selectedColor.hex && (
                                      <span
                                        className="h-2.5 w-2.5 rounded-full border border-black/10"
                                        style={{
                                          backgroundColor:
                                            item.selectedColor.hex,
                                        }}
                                      />
                                    )}
                                    Color: {item.selectedColor.name}
                                  </span>
                                </>
                              )}
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <strong className="font-serif text-[16px] text-[#211A18]">
                                {money(item?.unitPrice)}
                              </strong>

                              {item?.available ? (
                                availableStock <= 2 ? (
                                  <span className="text-[9px] font-medium text-[#c64b62]">
                                    Only {availableStock} left
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-medium text-[#348754]">
                                    In Stock
                                  </span>
                                )
                              ) : (
                                <span className="text-[9px] font-medium text-red-600">
                                  {item?.unavailableReason ||
                                    "Unavailable"}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* QUANTITY */}

                          <div className="inline-flex h-10 w-max items-center overflow-hidden rounded-lg border border-[#211A18]/15 bg-white">
                            <button
                              type="button"
                              disabled={busy || item.quantity <= 1}
                              onClick={() =>
                                void handleQuantity(
                                  item,
                                  Number(item.quantity) - 1
                                )
                              }
                              className="flex h-full w-9 items-center justify-center text-[#5e5551] transition hover:bg-[#fbf5f3] disabled:cursor-not-allowed disabled:opacity-30"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={14} />
                            </button>

                            <span className="flex h-full min-w-9 items-center justify-center border-x border-[#211A18]/10 px-2 text-[11px] font-semibold">
                              {busy ? (
                                <Loader2
                                  size={13}
                                  className="animate-spin"
                                />
                              ) : (
                                item.quantity
                              )}
                            </span>

                            <button
                              type="button"
                              disabled={
                                busy ||
                                !item?.available ||
                                (availableStock > 0 &&
                                  Number(item.quantity) >=
                                    availableStock)
                              }
                              onClick={() =>
                                void handleQuantity(
                                  item,
                                  Number(item.quantity) + 1
                                )
                              }
                              className="flex h-full w-9 items-center justify-center text-[#5e5551] transition hover:bg-[#fbf5f3] disabled:cursor-not-allowed disabled:opacity-30"
                              aria-label="Increase quantity"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          {/* PRICE + ACTIONS */}

                          <div className="md:text-right">
                            <div className="font-serif text-[18px] text-[#211A18]">
                              {money(item?.discount?.finalLineTotal ?? item?.subtotal)}
                            </div>
                            {Number(item?.discount?.totalDiscount || 0) > 0 && (
                              <div className="mt-1 text-[8px] text-[#2f8a53]">
                                You save {money(item.discount.totalDiscount)}
                              </div>
                            )}

                            <div className="mt-3 flex flex-wrap gap-3 md:justify-end">
                              <button
                                type="button"
                                disabled={busy || !item?.product?._id}
                                onClick={() =>
                                  void handleSaveForLater(item)
                                }
                                className="inline-flex items-center gap-1 text-[9px] text-[#6d625d] transition hover:text-[#a31340] disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Heart size={13} />
                                Save for Later
                              </button>

                              <button
                                type="button"
                                disabled={busy}
                                onClick={() =>
                                  void handleRemove(item._id)
                                }
                                className="inline-flex items-center gap-1 text-[9px] text-[#c64558] disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Trash2 size={13} />
                                Remove
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>

                {/* ORDER SUMMARY */}

                <aside className="h-max rounded-2xl border border-[#211A18]/10 bg-white p-5 xl:sticky xl:top-28">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-[#fff0f2] text-[#a31340]">
                      <ShoppingBag size={18} />
                    </div>

                    <h2 className="font-serif text-[20px] text-[#211A18]">
                      Order Summary
                    </h2>
                  </div>

                  <div className="mt-5 space-y-3 text-[11px] text-[#6e625e]">
                    <div className="flex items-center justify-between gap-4">
                      <span>
                        Subtotal ({totalItems} item
                        {totalItems === 1 ? "" : "s"})
                      </span>

                      <strong className="text-[#211A18]">
                        {money(subtotal)}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span>Shipping</span>

                      <strong className="text-[#2f8a53]">
                        FREE
                      </strong>
                    </div>

                    {automaticDiscount > 0 && (
                      <div className="flex items-center justify-between gap-4 text-[#2f8a53]">
                        <span>Automatic discount {cart?.discountSummary?.automatic?.percentage ? `(${cart.discountSummary.automatic.percentage}%)` : ""}</span>
                        <strong>-{money(automaticDiscount)}</strong>
                      </div>
                    )}

                    {codeDiscount > 0 && (
                      <div className="flex items-center justify-between gap-4 text-[#a31340]">
                        <span>Code {cart?.appliedDiscountCode}</span>
                        <strong>-{money(codeDiscount)}</strong>
                      </div>
                    )}

                    {tax > 0 && (
                      <div className="flex items-center justify-between gap-4">
                        <span>{cart?.taxSummary?.name || "Tax"} {cart?.taxSummary?.percentage ? `(${cart.taxSummary.percentage}%)` : ""}</span>
                        <strong className="text-[#211A18]">+{money(tax)}</strong>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 rounded-xl bg-[#fbf6f4] p-3">
                    <div className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#7c6d68]">Discount Code</div>
                    {cart?.appliedDiscountCode ? (
                      <div className="mt-2 flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2">
                        <div><strong className="text-[11px] text-[#a31340]">{cart.appliedDiscountCode}</strong><div className="text-[8px] text-[#8c817b]">Applied successfully</div></div>
                        <button type="button" disabled={applyingCode} onClick={() => void handleRemoveDiscountCode()} className="text-[9px] font-semibold text-[#a31340]">Remove</button>
                      </div>
                    ) : (
                      <div className="mt-2 flex gap-2">
                        <input value={discountCode} onChange={(e) => setDiscountCode(e.target.value.toUpperCase())} onKeyDown={(e) => { if (e.key === "Enter") void handleApplyDiscountCode(); }} placeholder="ENTER CODE" className="h-10 min-w-0 flex-1 rounded-lg border border-[#211A18]/10 bg-white px-3 text-[10px] uppercase outline-none focus:border-[#a31340]/40" />
                        <button type="button" disabled={applyingCode || !discountCode.trim()} onClick={() => void handleApplyDiscountCode()} className="rounded-lg bg-[#211A18] px-4 text-[9px] font-semibold uppercase text-white disabled:opacity-40">{applyingCode ? "..." : "Apply"}</button>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex items-end justify-between gap-4 border-t border-[#211A18]/10 pt-4">
                    <div>
                      <div className="text-[12px] font-semibold text-[#211A18]">
                        Estimated Total
                      </div>

                      <div className="mt-1 text-[8px] text-[#8c817b]">
                        Including applicable taxes
                      </div>
                    </div>

                    <strong className="font-serif text-[22px] text-[#211A18]">
                      {money(estimatedTotal)}
                    </strong>
                  </div>

                  <Link
                    href="/checkout"
                    className="mt-5 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#a31340] px-5 text-[11px] font-semibold text-white shadow-[0_10px_24px_rgba(163,19,64,0.16)] transition hover:bg-[#861033]"
                  >
                    <ShieldCheck size={16} />
                    Proceed to Checkout
                    <ArrowRight size={15} />
                  </Link>

                  <div className="mt-4 space-y-3">
                    <div className="flex items-center gap-3 rounded-xl bg-[#fff3f4] p-3 text-[10px] text-[#725f5e]">
                      <Truck
                        size={17}
                        className="shrink-0 text-[#a31340]"
                      />

                      <div>
                        <div className="font-semibold text-[#5d4d4b]">
                          Free shipping
                        </div>
                        <div className="mt-0.5 text-[8px] text-[#9b8884]">
                          No minimum order value
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl bg-[#f2fbf6] p-3 text-[10px] text-[#5f6e63]">
                      <ShieldCheck
                        size={17}
                        className="shrink-0 text-[#2f8a53]"
                      />

                      <div>
                        <div className="font-semibold text-[#4d6153]">
                          Secure payments
                        </div>
                        <div className="mt-0.5 text-[8px] text-[#819086]">
                          Your information stays protected
                        </div>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            )}

            {/* =============================================
                PRODUCT RECOMMENDATIONS FROM ACTIVE PRODUCTS API
            ============================================= */}

            {!loading && recommendations.length > 0 && (
              <section className="mt-9">
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-[#a31340]">
                      Popular Picks
                    </p>

                    <h2 className="mt-1 font-serif text-2xl text-[#211A18]">
                      You might also like
                    </h2>
                  </div>

                  <Link
                    href="/women"
                    className="shrink-0 text-[10px] font-semibold text-[#a31340]"
                  >
                    View all →
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
                  {recommendations.map((product) => {
                    const image = productImage(product);
                    const discount = productDiscount(product);

                    return (
                      <Link
                        key={product._id}
                        href={`/product/${product.slug}`}
                        className="group overflow-hidden rounded-2xl border border-[#211A18]/10 bg-white transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(64,40,35,0.08)]"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden bg-[#f5eeea]">
                          {image ? (
                            <img
                              src={image}
                              alt={product.name}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                            />
                          ) : (
                            <div className="grid h-full w-full place-items-center text-[#c9a8aa]">
                              <ShoppingBag
                                size={35}
                                strokeWidth={1.2}
                              />
                            </div>
                          )}

                          {discount > 0 && (
                            <span className="absolute left-2 top-2 rounded-md bg-[#d84e65] px-2 py-1 text-[8px] font-semibold text-white">
                              {discount}% OFF
                            </span>
                          )}

                          <span className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-[#b11b46] shadow-sm">
                            <Heart size={15} />
                          </span>
                        </div>

                        <div className="p-3">
                          <div className="truncate font-serif text-[14px] text-[#211A18]">
                            {product.name}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <strong className="text-[13px] text-[#211A18]">
                              {money(product.price)}
                            </strong>

                            {Number(product.compareAtPrice || 0) >
                              Number(product.price || 0) && (
                              <span className="text-[9px] text-[#aaa09b] line-through">
                                {money(product.compareAtPrice)}
                              </span>
                            )}
                          </div>

                          <div className="mt-2 text-[9px]">
                            {Number(product.stock || 0) > 0 ? (
                              <span className="text-[#39885a]">
                                In Stock
                              </span>
                            ) : (
                              <span className="text-[#c34a59]">
                                Out of Stock
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
