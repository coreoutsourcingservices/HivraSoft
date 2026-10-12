"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Heart,
  Loader2,
  PackagePlus,
  ShoppingBag,
  Sparkles,
  Trash2,
} from "lucide-react";

import Header from "@/src/components/Header/Header";
import AccountSidebar from "@/app/account/components/AccountSidebar";
import { catalogProductsFromResponse } from "@/lib/product-catalog";

/* =========================================================
   API
========================================================= */

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

/* =========================================================
   API HELPERS
   No import from @/lib/api is used in this page.
========================================================= */

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
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
    const error = new Error(
      data?.message || `Request failed with status ${response.status}.`
    );

    error.status = response.status;
    error.payload = data;

    throw error;
  }

  return data;
}

function openLogin() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new Event("hivrasoft-auth-required")
    );
  }
}

function notifyWishlistUpdated(count) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("hivrasoft-wishlist-updated", {
        detail: { count },
      })
    );
  }
}

function notifyCartUpdated(cart) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("hivrasoft-cart-updated", {
        detail: {
          count: Number(cart?.totalItems || cart?.items?.length || 0),
        },
      })
    );
  }
}

/* =========================================================
   PRODUCT HELPERS
========================================================= */

function money(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function getProductImage(product) {
  if (!product) return "";

  const mainImage = product.mainImages?.[0]?.url;
  if (mainImage) return mainImage;

  const colors = Array.isArray(product.colors)
    ? product.colors
    : [];

  for (const color of colors) {
    const image = color?.images?.[0]?.url;
    if (image) return image;
  }

  return "";
}

function getDefaultVariant(product) {
  if (!product) return null;

  const productStock = Number(product.stock || 0);
  if (productStock <= 0) return null;

  const colors = Array.isArray(product.colors)
    ? [...product.colors]
    : [];

  colors.sort(
    (a, b) => Number(a?.sortOrder || 0) - Number(b?.sortOrder || 0)
  );

  for (const color of colors) {
    if (color?.isActive === false) continue;

    const sizes = Array.isArray(color?.sizes)
      ? color.sizes
      : [];

    const size = sizes.find(
      (item) =>
        item?.isActive !== false &&
        Number(item?.stock || 0) > 0
    );

    if (size) {
      return { color, size };
    }
  }

  return null;
}

function getDiscount(product) {
  const price = Number(product?.price || 0);
  const compareAt = Number(product?.compareAtPrice || 0);

  if (price <= 0 || compareAt <= price) {
    return 0;
  }

  return Math.round(
    ((compareAt - price) / compareAt) * 100
  );
}

function isOnSale(product) {
  return getDiscount(product) > 0;
}

function isLowStock(product) {
  const stock = Number(product?.stock || 0);
  return stock > 0 && stock <= 2;
}

function getAddedAtValue(item) {
  if (!item?.addedAt) return 0;

  const time = new Date(item.addedAt).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function getWishlistFromResponse(data) {
  return data?.wishlist && Array.isArray(data.wishlist.items)
    ? data.wishlist
    : { items: [] };
}

function getProductsFromResponse(data) {
  return catalogProductsFromResponse(data);
}

/* =========================================================
   INLINE ADD TO CART
========================================================= */

function AddToCartButton({ product, onMessage }) {
  const [busy, setBusy] = useState(false);
  const variant = getDefaultVariant(product);

  const handleAdd = async () => {
    if (!variant || busy) return;

    try {
      setBusy(true);

      const data = await apiRequest("/api/cart", {
        method: "POST",
        body: JSON.stringify({
          productId: product._id,
          colorId: variant.color._id,
          sizeId: variant.size._id,
          quantity: 1,
        }),
      });

      notifyCartUpdated(data?.cart);
      onMessage?.("Added to cart.", "success");
    } catch (error) {
      if (error?.status === 401) {
        openLogin();
        onMessage?.("Please login to add items to cart.", "error");
        return;
      }

      onMessage?.(
        error instanceof Error
          ? error.message
          : "Unable to add product to cart.",
        "error"
      );
    } finally {
      setBusy(false);
    }
  };

  if (!variant || !variant.color?._id || !variant.size?._id) {
    return (
      <Link
        href={`/product/${product.slug}`}
        className="flex min-h-10 w-full items-center justify-center rounded-lg border border-[#a31340]/30 bg-white px-3 text-[10px] font-semibold text-[#a31340] transition hover:bg-[#fff7f8]"
      >
        Choose Options
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void handleAdd()}
      className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#a31340] px-3 text-[10px] font-semibold text-white transition hover:bg-[#861033] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {busy ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <ShoppingBag size={14} />
      )}

      {busy ? "Adding..." : "Add to Cart"}
    </button>
  );
}

/* =========================================================
   RECOMMENDATION CARD
========================================================= */

function RecommendationCard({ product, onMessage, onAddedToWishlist }) {
  const [wishlistBusy, setWishlistBusy] = useState(false);
  const image = getProductImage(product);
  const compareAt = Number(product?.compareAtPrice || 0);
  const price = Number(product?.price || 0);
  const discount = getDiscount(product);

  const handleAddToWishlist = async () => {
    if (!product?._id || wishlistBusy) return;

    try {
      setWishlistBusy(true);

      const data = await apiRequest("/api/wishlist", {
        method: "POST",
        body: JSON.stringify({
          productId: product._id,
        }),
      });

      const nextWishlist = getWishlistFromResponse(data);
      notifyWishlistUpdated(nextWishlist.items.length);
      onAddedToWishlist?.(nextWishlist);
      onMessage?.("Product saved to wishlist.", "success");
    } catch (error) {
      if (error?.status === 401) {
        openLogin();
        onMessage?.("Please login to use wishlist.", "error");
        return;
      }

      onMessage?.(
        error instanceof Error
          ? error.message
          : "Unable to add product to wishlist.",
        "error"
      );
    } finally {
      setWishlistBusy(false);
    }
  };

  return (
    <article className="group overflow-hidden rounded-2xl border border-[#211A18]/10 bg-white shadow-[0_8px_28px_rgba(33,26,24,0.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(33,26,24,0.12)]">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#f6efeb]">
        <Link
          href={`/product/${product.slug}`}
          className="block h-full w-full"
        >
          {image ? (
            <img
              src={image}
              alt={product.name || "Product"}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-[#8d8079]">
              No image
            </div>
          )}
        </Link>

        {discount > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-[#99133b] px-2.5 py-1 text-[8px] font-bold text-white">
            {discount}% OFF
          </span>
        )}

        <button
          type="button"
          disabled={wishlistBusy}
          onClick={() => void handleAddToWishlist()}
          aria-label="Add to wishlist"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-[#99133b] shadow-sm transition hover:bg-white disabled:opacity-60"
        >
          {wishlistBusy ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Heart size={17} />
          )}
        </button>
      </div>

      <div className="p-4">
        <Link
          href={`/product/${product.slug}`}
          className="line-clamp-2 min-h-10 font-serif text-[15px] text-[#211A18] hover:text-[#99133b]"
        >
          {product.name || "Product"}
        </Link>

        <div className="mt-3 flex items-baseline gap-2">
          <strong className="text-[16px] text-[#211A18]">
            {money(price)}
          </strong>

          {compareAt > price && (
            <span className="text-[11px] text-[#9c918c] line-through">
              {money(compareAt)}
            </span>
          )}
        </div>

        <div className="mt-4">
          <AddToCartButton
            product={product}
            onMessage={onMessage}
          />
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState({ items: [] });
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("success");
  const [loginRequired, setLoginRequired] = useState(false);
  const [busyProduct, setBusyProduct] = useState("");
  const [clearing, setClearing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("recent");

  /* =======================================================
     MESSAGE
  ======================================================= */

  const showMessage = (message, type = "success") => {
    setNotice(message);
    setNoticeType(type);

    window.setTimeout(() => {
      setNotice("");
    }, 3000);
  };

  /* =======================================================
     LOAD WISHLIST + ACTIVE PRODUCTS
  ======================================================= */

  const loadWishlist = async () => {
    try {
      setLoading(true);
      setError("");
      setLoginRequired(false);

      const productPromise = apiRequest("/api/products/catalog")
        .then(getProductsFromResponse)
        .catch(() => []);

      try {
        const [wishlistData, activeProducts] = await Promise.all([
          apiRequest("/api/wishlist"),
          productPromise,
        ]);

        const nextWishlist = getWishlistFromResponse(wishlistData);
        setWishlist(nextWishlist);

        const savedIds = new Set(
          nextWishlist.items
            .map((item) => item?.product?._id)
            .filter(Boolean)
        );

        setRecommendations(
          activeProducts
            .filter((product) => !savedIds.has(product?._id))
            .slice(0, 4)
        );
      } catch (wishlistError) {
        if (wishlistError?.status === 401) {
          setLoginRequired(true);
          setWishlist({ items: [] });

          const activeProducts = await productPromise;
          setRecommendations(activeProducts.slice(0, 4));
        } else {
          throw wishlistError;
        }
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load wishlist."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWishlist();
  }, []);

  /* =======================================================
     WISHLIST PRODUCTS
  ======================================================= */

  const validItems = useMemo(() => {
    return wishlist.items.filter(
      (item) => item && item.product && item.product._id
    );
  }, [wishlist.items]);

  const products = useMemo(() => {
    return validItems.map((item) => item.product);
  }, [validItems]);

  const featured = products[0] || null;

  const lowStockCount = products.filter(isLowStock).length;
  const onSaleCount = products.filter(isOnSale).length;

  /* =======================================================
     FILTER + SORT
  ======================================================= */

  const visibleItems = useMemo(() => {
    let result = [...validItems];

    if (filter === "in-stock") {
      result = result.filter(
        (item) => Number(item.product?.stock || 0) > 0
      );
    }

    if (filter === "on-sale") {
      result = result.filter((item) => isOnSale(item.product));
    }

    if (sort === "price-low") {
      result.sort(
        (a, b) =>
          Number(a.product?.price || 0) -
          Number(b.product?.price || 0)
      );
    }

    if (sort === "price-high") {
      result.sort(
        (a, b) =>
          Number(b.product?.price || 0) -
          Number(a.product?.price || 0)
      );
    }

    if (sort === "recent") {
      result.sort(
        (a, b) => getAddedAtValue(b) - getAddedAtValue(a)
      );
    }

    return result;
  }, [filter, sort, validItems]);

  /* =======================================================
     REMOVE ONE PRODUCT
  ======================================================= */

  const handleRemove = async (productId) => {
    if (!productId || busyProduct) return;

    try {
      setBusyProduct(productId);
      setError("");

      const data = await apiRequest(
        `/api/wishlist/${encodeURIComponent(productId)}`,
        { method: "DELETE" }
      );

      const nextWishlist = getWishlistFromResponse(data);
      setWishlist(nextWishlist);
      notifyWishlistUpdated(nextWishlist.items.length);

      showMessage("Product removed from wishlist.");

      const activeProducts = await apiRequest("/api/products/catalog")
        .then(getProductsFromResponse)
        .catch(() => []);

      const savedIds = new Set(
        nextWishlist.items
          .map((item) => item?.product?._id)
          .filter(Boolean)
      );

      setRecommendations(
        activeProducts
          .filter((product) => !savedIds.has(product?._id))
          .slice(0, 4)
      );
    } catch (removeError) {
      if (removeError?.status === 401) {
        openLogin();
        return;
      }

      setError(
        removeError instanceof Error
          ? removeError.message
          : "Unable to remove wishlist item."
      );
    } finally {
      setBusyProduct("");
    }
  };

  /* =======================================================
     CLEAR WISHLIST
  ======================================================= */

  const handleClearWishlist = async () => {
    if (clearing || products.length === 0) return;

    const confirmed = window.confirm(
      "Remove all products from your wishlist?"
    );

    if (!confirmed) return;

    try {
      setClearing(true);
      setError("");

      const data = await apiRequest("/api/wishlist", {
        method: "DELETE",
      });

      const nextWishlist = getWishlistFromResponse(data);
      setWishlist(nextWishlist);
      notifyWishlistUpdated(0);
      showMessage("Wishlist cleared.");

      const activeProducts = await apiRequest("/api/products/catalog")
        .then(getProductsFromResponse)
        .catch(() => []);

      setRecommendations(activeProducts.slice(0, 4));
    } catch (clearError) {
      if (clearError?.status === 401) {
        openLogin();
        return;
      }

      setError(
        clearError instanceof Error
          ? clearError.message
          : "Unable to clear wishlist."
      );
    } finally {
      setClearing(false);
    }
  };

  /* =======================================================
     AFTER RECOMMENDATION ADDED TO WISHLIST
  ======================================================= */

  const handleRecommendationAdded = (nextWishlist) => {
    setWishlist(nextWishlist);

    const savedIds = new Set(
      nextWishlist.items
        .map((item) => item?.product?._id)
        .filter(Boolean)
    );

    setRecommendations((current) =>
      current.filter((product) => !savedIds.has(product?._id))
    );
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
            {/* HERO */}
            <section className="relative overflow-hidden rounded-[18px] border border-[#f1dedf] bg-gradient-to-r from-[#fff0ef] via-[#fff7f5] to-[#fbe4e7] px-6 py-7 md:min-h-[166px] md:px-8 md:py-7">
              <div className="pointer-events-none absolute -right-12 -top-14 h-52 w-52 rounded-full border-[38px] border-[#d66b7c]/[0.07]" />
              <div className="pointer-events-none absolute bottom-[-90px] right-[20%] h-44 w-44 rounded-full bg-[#e8a8b2]/10" />

              <div className="relative z-10 flex flex-wrap items-center justify-between gap-5">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.3em] text-[#876f6b]">
                    My Account
                  </p>

                  <h1 className="mt-3 font-serif text-[40px] font-normal leading-none text-[#211A18] md:text-[48px]">
                    My Wishlist
                    <span className="ml-3 text-[#bf3158]">♡</span>
                  </h1>

                  <p className="mt-3 max-w-[520px] text-[12px] leading-[1.6] text-[#756965] md:text-[13px]">
                    Your saved styles, always within reach. Because great
                    style is worth waiting for.
                  </p>
                </div>

                <div className="flex min-w-[165px] items-center gap-3 rounded-2xl border border-white/80 bg-white/75 px-4 py-3 shadow-sm backdrop-blur-sm">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-[#fde9ec] text-[#ad1743]">
                    <Heart size={22} strokeWidth={1.7} />
                  </div>

                  <div>
                    <div className="font-serif text-[22px] leading-none text-[#211A18]">
                      {products.length}
                    </div>
                    <div className="mt-1 text-[9px] text-[#857873]">
                      Saved Items
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* NOTICE */}
            {notice && (
              <div
                className={`mt-4 rounded-xl border px-4 py-3 text-[11px] ${
                  noticeType === "error"
                    ? "border-red-100 bg-red-50 text-red-700"
                    : "border-emerald-100 bg-emerald-50 text-emerald-700"
                }`}
              >
                {notice}
              </div>
            )}

            {/* ERROR */}
            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[11px] leading-5 text-red-700">
                <AlertCircle className="mt-0.5 shrink-0" size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* LOADING / EMPTY / DATA */}
            {loading ? (
              <section className="mt-5 flex min-h-[430px] items-center justify-center rounded-2xl border border-[#eee5e1] bg-white">
                <div className="text-center">
                  <Loader2 className="mx-auto animate-spin text-[#a31340]" />
                  <p className="mt-3 text-[12px] text-[#746965]">
                    Loading your wishlist...
                  </p>
                </div>
              </section>
            ) : products.length === 0 ? (
              <section className="relative mt-5 overflow-hidden rounded-[18px] border border-[#eee5e1] bg-white px-5 py-12 text-center md:py-14">
                <div className="pointer-events-none absolute -left-20 bottom-[-95px] h-52 w-52 rounded-full bg-[#f8e4e1]/60" />
                <div className="pointer-events-none absolute -right-16 top-[-80px] h-48 w-48 rounded-full bg-[#fde9eb]/70" />

                <div className="relative z-10 mx-auto max-w-[600px]">
                  <div className="relative mx-auto h-[185px] w-[230px]">
                    <div className="absolute left-1/2 top-1/2 h-[155px] w-[155px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-[#fff1f3] to-[#fbe0e5]" />

                    <div className="absolute left-1/2 top-1/2 grid h-[114px] w-[114px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-[#eea9b7] bg-white text-[#c72f59] shadow-[0_20px_45px_rgba(166,19,64,0.12)]">
                      <Heart size={62} strokeWidth={1.25} />
                    </div>

                    <Sparkles className="absolute right-3 top-6 text-[#e09a5c]" size={24} strokeWidth={1.4} />
                    <Sparkles className="absolute bottom-7 left-2 text-[#d45f78]" size={19} strokeWidth={1.4} />
                    <Heart className="absolute left-5 top-5 text-[#eb8799]" size={24} strokeWidth={1.5} />
                  </div>

                  <h2 className="font-serif text-[30px] font-normal text-[#211A18] md:text-[34px]">
                    {loginRequired
                      ? "Save what you love"
                      : "Your wishlist is empty"}
                  </h2>

                  <p className="mx-auto mt-3 max-w-[430px] text-[12px] leading-6 text-[#716762]">
                    {loginRequired
                      ? "Login to see your saved products and keep all your favorites in one place."
                      : "Save your favorite products and find them here anytime. Products will appear here automatically from your wishlist API."}
                  </p>

                  {loginRequired ? (
                    <button
                      type="button"
                      onClick={openLogin}
                      className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#a31340] px-8 text-[11px] font-semibold text-white shadow-[0_10px_25px_rgba(163,19,64,0.18)] transition hover:bg-[#861033]"
                    >
                      <Heart size={17} />
                      Login to Continue
                    </button>
                  ) : (
                    <Link
                      href="/women"
                      className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#a31340] px-8 text-[11px] font-semibold text-white shadow-[0_10px_25px_rgba(163,19,64,0.18)] transition hover:bg-[#861033]"
                    >
                      <ShoppingBag size={17} />
                      Browse Products
                      <ArrowRight size={15} />
                    </Link>
                  )}

                  {!loginRequired && (
                    <div className="mx-auto mt-7 flex max-w-[430px] items-center justify-center gap-3 text-[9px] text-[#9b8d88]">
                      <span className="h-px flex-1 bg-[#ead9d6]" />
                      <span>Find something you love</span>
                      <span className="h-px flex-1 bg-[#ead9d6]" />
                    </div>
                  )}
                </div>
              </section>
            ) : (
              <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="min-w-0 space-y-5">
                  {/* FEATURED */}
                  {featured && (
                    <section className="grid gap-5 overflow-hidden rounded-2xl border border-[#f1dedf] bg-gradient-to-r from-[#fff0ef] to-[#fff8f7] p-4 md:grid-cols-[220px_minmax(0,1fr)_190px] md:items-center">
                      <Link
                        href={`/product/${featured.slug}`}
                        className="relative aspect-[4/3] overflow-hidden rounded-xl bg-[#f4ece8]"
                      >
                        {getProductImage(featured) ? (
                          <img
                            src={getProductImage(featured)}
                            alt={featured.name || "Product"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-[#c59ca4]">
                            <ShoppingBag size={40} strokeWidth={1.2} />
                          </div>
                        )}

                        <span className="absolute left-3 top-3 rounded-full bg-[#d55d77] px-3 py-1 text-[9px] font-semibold text-white">
                          ♡ Most Loved
                        </span>
                      </Link>

                      <div className="min-w-0">
                        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#a31340]">
                          Featured Pick
                        </p>

                        <Link
                          href={`/product/${featured.slug}`}
                          className="mt-1 block truncate font-serif text-xl text-[#211A18] hover:text-[#a31340]"
                        >
                          {featured.name}
                        </Link>

                        <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-[#746964]">
                          {featured.shortDescription ||
                            "A saved favorite from your wishlist."}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <strong className="font-serif text-xl text-[#211A18]">
                            {money(featured.price)}
                          </strong>

                          {Number(featured?.ratings?.count || 0) > 0 && (
                            <span className="text-[10px] text-[#a31340]">
                              ★ {Number(featured.ratings.average || 0).toFixed(1)} ({featured.ratings.count})
                            </span>
                          )}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 text-[9px]">
                          <span className="rounded-full bg-white px-3 py-1.5 text-[#70635f]">
                            {Number(featured.stock || 0) > 0
                              ? "In Stock"
                              : "Out of Stock"}
                          </span>

                          {isOnSale(featured) && (
                            <span className="rounded-full bg-[#ffe5e8] px-3 py-1.5 font-semibold text-[#c43d59]">
                              {getDiscount(featured)}% OFF
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <AddToCartButton
                          product={featured}
                          onMessage={showMessage}
                        />

                        <button
                          type="button"
                          disabled={busyProduct === featured._id}
                          onClick={() => void handleRemove(featured._id)}
                          className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#a31340]/25 bg-white text-[10px] text-[#a31340] transition hover:bg-[#fff7f8] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {busyProduct === featured._id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                          Remove
                        </button>
                      </div>
                    </section>
                  )}

                  {/* FILTER / SORT */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="font-serif text-[22px] text-[#211A18]">
                      Your Saved Items ({products.length})
                    </h2>

                    <div className="flex flex-wrap gap-2">
                      <select
                        value={filter}
                        onChange={(event) => setFilter(event.target.value)}
                        className="h-10 min-w-[130px] rounded-lg border border-[#e8ded9] bg-white px-3 text-[10px] text-[#4f4642] outline-none"
                      >
                        <option value="all">All Items</option>
                        <option value="in-stock">In Stock</option>
                        <option value="on-sale">On Sale</option>
                      </select>

                      <select
                        value={sort}
                        onChange={(event) => setSort(event.target.value)}
                        className="h-10 min-w-[165px] rounded-lg border border-[#e8ded9] bg-white px-3 text-[10px] text-[#4f4642] outline-none"
                      >
                        <option value="recent">Sort by: Most Recent</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                      </select>
                    </div>
                  </div>

                  {/* SAVED ITEMS */}
                  <section className="overflow-hidden rounded-2xl border border-[#211A18]/10 bg-white">
                    <div className="flex items-center justify-between border-b border-[#211A18]/10 px-4 py-3 md:px-5">
                      <span className="text-[10px] text-[#8b7d78]">
                        Showing {visibleItems.length} item
                        {visibleItems.length === 1 ? "" : "s"}
                      </span>

                      <button
                        type="button"
                        disabled={clearing}
                        onClick={() => void handleClearWishlist()}
                        className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#c64558] disabled:opacity-50"
                      >
                        {clearing ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                        Clear Wishlist
                      </button>
                    </div>

                    {visibleItems.length > 0 ? (
                      <div className="divide-y divide-[#211A18]/10">
                        {visibleItems.map(({ product }) => {
                          const variant = getDefaultVariant(product);
                          const image = getProductImage(product);
                          const compareAt = Number(product.compareAtPrice || 0);
                          const discount = getDiscount(product);
                          const stock = Number(product.stock || 0);

                          return (
                            <article
                              key={product._id}
                              className="grid gap-4 px-4 py-4 md:grid-cols-[92px_minmax(0,1fr)_150px_185px] md:items-center md:px-5"
                            >
                              <Link
                                href={`/product/${product.slug}`}
                                className="h-[100px] overflow-hidden rounded-xl bg-[#f5eeea]"
                              >
                                {image ? (
                                  <img
                                    src={image}
                                    alt={product.name || "Product"}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="grid h-full w-full place-items-center text-[#c8aaa8]">
                                    <ShoppingBag size={28} strokeWidth={1.2} />
                                  </div>
                                )}
                              </Link>

                              <div className="min-w-0">
                                <Link
                                  href={`/product/${product.slug}`}
                                  className="block truncate font-serif text-[16px] text-[#211A18] hover:text-[#a31340]"
                                >
                                  {product.name}
                                </Link>

                                {variant && (
                                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[9px] text-[#847873]">
                                    <span>Size: {variant.size?.size || "-"}</span>
                                    <span>•</span>
                                    <span>Color: {variant.color?.name || "-"}</span>
                                  </div>
                                )}

                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  <strong className="font-serif text-[16px] text-[#211A18]">
                                    {money(product.price)}
                                  </strong>

                                  {compareAt > Number(product.price || 0) && (
                                    <span className="text-[10px] text-[#a69c98] line-through">
                                      {money(compareAt)}
                                    </span>
                                  )}

                                  {discount > 0 && (
                                    <span className="rounded bg-[#ffe3e6] px-2 py-1 text-[9px] font-semibold text-[#cf425b]">
                                      {discount}% OFF
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="text-[10px]">
                                {stock <= 0 ? (
                                  <span className="inline-flex items-center gap-2 font-medium text-[#b75b5b]">
                                    <span className="h-2 w-2 rounded-full bg-[#d85b69]" />
                                    Out of Stock
                                  </span>
                                ) : isLowStock(product) ? (
                                  <span className="inline-flex items-center gap-2 font-medium text-[#c64b62]">
                                    <span className="h-2 w-2 rounded-full bg-[#e04a62]" />
                                    Only {stock} left
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-2 font-medium text-[#348754]">
                                    <span className="h-2 w-2 rounded-full bg-[#58bd73]" />
                                    In Stock
                                  </span>
                                )}
                              </div>

                              <div className="space-y-2">
                                <AddToCartButton
                                  product={product}
                                  onMessage={showMessage}
                                />

                                <button
                                  type="button"
                                  disabled={busyProduct === product._id}
                                  onClick={() => void handleRemove(product._id)}
                                  className="flex min-h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#a31340]/25 text-[10px] text-[#a31340] transition hover:bg-[#fff7f8] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {busyProduct === product._id ? (
                                    <Loader2 size={13} className="animate-spin" />
                                  ) : (
                                    <Trash2 size={13} />
                                  )}
                                  Remove
                                </button>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="px-5 py-14 text-center">
                        <Heart
                          size={40}
                          className="mx-auto text-[#d89aa6]"
                          strokeWidth={1.2}
                        />
                        <h3 className="mt-3 font-serif text-xl text-[#302825]">
                          No matching items
                        </h3>
                        <p className="mt-2 text-[10px] text-[#8a7d78]">
                          Try another wishlist filter.
                        </p>
                      </div>
                    )}
                  </section>
                </div>

                {/* INSIGHTS */}
                <aside className="h-max space-y-4 xl:sticky xl:top-28">
                  <section className="rounded-2xl border border-[#211A18]/10 bg-white p-5">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-[#fff0f2] text-[#a31340]">
                        <Sparkles size={18} />
                      </div>

                      <h2 className="font-serif text-lg text-[#211A18]">
                        Wishlist Insights
                      </h2>
                    </div>

                    <div className="mt-5 grid grid-cols-3 divide-x divide-[#211A18]/10 text-center">
                      <div>
                        <div className="font-serif text-xl">
                          {products.length}
                        </div>
                        <div className="mt-1 text-[8px] text-[#897d77]">
                          Total Saved
                        </div>
                      </div>

                      <div>
                        <div className="font-serif text-xl text-[#c64558]">
                          {lowStockCount}
                        </div>
                        <div className="mt-1 text-[8px] text-[#897d77]">
                          Low Stock
                        </div>
                      </div>

                      <div>
                        <div className="font-serif text-xl text-[#2f8a53]">
                          {onSaleCount}
                        </div>
                        <div className="mt-1 text-[8px] text-[#897d77]">
                          On Sale
                        </div>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-2xl bg-gradient-to-br from-[#fff0f1] to-[#fae2e5] p-5">
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/75 text-[#a31340]">
                        <PackagePlus size={20} />
                      </div>

                      <div>
                        <h3 className="text-[12px] font-semibold text-[#302825]">
                          Your wishlist is live
                        </h3>

                        <p className="mt-1 text-[10px] leading-4 text-[#766965]">
                          Saved products, prices and stock are loaded directly
                          from your backend wishlist API.
                        </p>
                      </div>
                    </div>
                  </section>
                </aside>
              </div>
            )}

            {/* RECOMMENDATIONS */}
            {!loading && recommendations.length > 0 && (
              <section className="mt-9">
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-[#a31340]">
                      Popular Picks for You
                    </p>
                    <h2 className="mt-1 font-serif text-2xl text-[#211A18]">
                      Discover more styles
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
                  {recommendations.map((product) => (
                    <RecommendationCard
                      key={product._id}
                      product={product}
                      onMessage={showMessage}
                      onAddedToWishlist={handleRecommendationAdded}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
