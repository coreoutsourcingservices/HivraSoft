
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

import {
  getDefaultColor,
  getProductCategorySlugs,
  getProductImageUrls,
  getProductName,
  type ApiColor,
  type ApiProduct,
  type ApiSize,
} from "@/src/services/products";

import { useStorefrontCommerce } from "@/src/components/Storefront/StorefrontCommerceProvider";

import ProductReviews from "@/src/components/Product/ProductReviews/ProductReviews";

import SizeChartModal, {
  type SizeChartKind,
} from "@/src/components/Product/ProductDetails/SizeChartModal";

import type { CatalogProduct, CatalogSize } from "@/types/catalog";

/* =========================================================
   TYPES
========================================================= */

export type ProductDetailsData = ApiProduct;

type Props = {
  product: ProductDetailsData;
  currentSlug: string;
};

type GalleryImage = {
  url: string;
  publicId?: string;
  isDefault?: boolean;
};

type ProductGalleryProps = {
  images: GalleryImage[];
  name: string;
  wished: boolean;
  wishlistBusy: boolean;
  onBack: () => void;
  onToggleWishlist: () => void;
};

/* =========================================================
   HELPERS
========================================================= */

function field(source: unknown, key: string): unknown {
  return source && typeof source === "object"
    ? (source as Record<string, unknown>)[key]
    : undefined;
}

function getId(source: unknown): string {
  return String(field(source, "_id") || field(source, "id") || "").trim();
}

function positiveNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (value === null || value === undefined || value === "") continue;
    const number = Number(value);
    if (Number.isFinite(number) && number > 0) return number;
  }
  return undefined;
}

// The API sanitizes new descriptions before saving, but old DB records may
// predate the sanitizer. Never render those records using regex-only cleaning.
// DOMPurify removes active HTML/URL payloads, and the CSS guard blocks remote
// fetches and layout-breaking styles while preserving decorative gradients.
const descriptionTags = [
  "div", "section", "article", "p", "br", "span", "h1", "h2", "h3",
  "h4", "h5", "h6", "strong", "b", "em", "i", "u", "s", "del",
  "ul", "ol", "li", "blockquote", "hr", "a", "img", "figure",
  "figcaption", "table", "thead", "tbody", "tfoot", "tr", "th", "td",
];
const descriptionAttributes = [
  "style", "href", "target", "rel", "title", "src", "alt", "width",
  "height", "loading", "cellpadding", "cellspacing", "colspan", "rowspan", "scope",
];
const decorativeProperties = new Set([
  "color", "background", "background-color", "background-image", "box-shadow",
  "font-size", "font-family", "font-weight", "font-style", "text-align",
  "text-decoration", "text-transform", "list-style-type", "line-height",
  "letter-spacing", "margin", "margin-top", "margin-bottom", "margin-left",
  "margin-right", "padding", "padding-top", "padding-bottom", "padding-left",
  "padding-right", "border", "border-top", "border-bottom", "border-left",
  "border-right", "border-radius", "border-collapse", "border-spacing", "width",
  "max-width", "min-width", "height", "max-height", "min-height", "display",
  "vertical-align", "flex-wrap", "flex-direction", "justify-content", "align-items",
  "gap", "row-gap", "column-gap", "overflow", "overflow-x", "overflow-y",
]);
function cleanDescriptionHtml(html?: string): string {
  if (!html || typeof html !== "string") return "";
  const root = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: descriptionTags,
    ALLOWED_ATTR: descriptionAttributes,
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    RETURN_DOM: true,
  }) as HTMLElement;
  for (const element of Array.from(root.querySelectorAll("[style]"))) {
    const original = element.getAttribute("style") || "";
    const safe = original.split(";").map((entry) => {
      const separator = entry.indexOf(":");
      if (separator < 0) return "";
      const property = entry.slice(0, separator).trim().toLowerCase();
      const value = entry.slice(separator + 1).trim();
      if (!decorativeProperties.has(property) || !value || value.length > 300) return "";
      if (/(?:url|expression|var|attr|image-set|paint)\s*\(|@import|\\|[{}<>;!]/i.test(value)) return "";
      if (!/^[a-z0-9#(),.%\s+\-\/'"]+$/i.test(value)) return "";
      return `${property}:${value}`;
    }).filter(Boolean).join(";");
    if (safe) element.setAttribute("style", safe);
    else element.removeAttribute("style");
  }
  // DOMPurify normalizes attribute quotes and encodes unsafe characters.
  return root.innerHTML;
}

/* =========================================================
   GALLERY ICONS
========================================================= */

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

function GalleryHeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={filled ? "#B31345" : "transparent"}
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

/* =========================================================
   PRODUCT GALLERY
========================================================= */

function ProductGallery({
  images,
  name,
  wished,
  wishlistBusy,
  onBack,
  onToggleWishlist,
}: ProductGalleryProps) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);

  const thumbnailContainerRef = useRef<HTMLDivElement | null>(null);
  const thumbnailRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    setActive(0);
    thumbnailContainerRef.current?.scrollTo({
      left: 0,
      top: 0,
      behavior: "auto",
    });
  }, [images]);

  useEffect(() => {
    if (images.length <= 1 || paused || zoomOpen) return;

    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % images.length);
    }, 3500);

    return () => window.clearInterval(timer);
  }, [images.length, paused, zoomOpen]);

  useEffect(() => {
    const container = thumbnailContainerRef.current;
    const target = thumbnailRefs.current[active];

    if (!container || !target) return;

    const desktop = window.matchMedia("(min-width: 1024px)").matches;

    if (desktop) {
      const top =
        target.offsetTop -
        container.clientHeight / 2 +
        target.clientHeight / 2;

      container.scrollTo({
        top: Math.max(0, top),
        behavior: "smooth",
      });
    } else {
      const left =
        target.offsetLeft -
        container.clientWidth / 2 +
        target.clientWidth / 2;

      container.scrollTo({
        left: Math.max(0, left),
        behavior: "smooth",
      });
    }
  }, [active]);

  useEffect(() => {
    if (!zoomOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [zoomOpen]);

  const previous = () => {
    if (images.length) {
      setActive((current) =>
        current === 0 ? images.length - 1 : current - 1
      );
    }
  };

  const next = () => {
    if (images.length) {
      setActive((current) => (current + 1) % images.length);
    }
  };

  const current = images[Math.min(active, Math.max(0, images.length - 1))];

  return (
    <>
      <div
        className="grid gap-3 lg:grid-cols-[78px_minmax(0,1fr)]"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* THUMBNAILS */}

        {images.length > 1 && (
          <div
            ref={thumbnailContainerRef}
            className="order-2 flex gap-2 overflow-x-auto overflow-y-hidden overscroll-contain pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:order-1 lg:max-h-[680px] lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto lg:pr-1"
          >
            {images.map((image, index) => (
              <button
                key={`${image.publicId || image.url}-${index}`}
                ref={(element) => {
                  thumbnailRefs.current[index] = element;
                }}
                type="button"
                onClick={() => setActive(index)}
                onMouseEnter={() => {
                  // Image thumbnail hover stays unchanged.
                  if (window.matchMedia("(min-width: 1024px)").matches) {
                    setActive(index);
                  }
                }}
                className={`h-[72px] w-[58px] flex-none cursor-pointer overflow-hidden rounded-[8px] border-2 bg-[#F4F1EF] transition sm:h-[82px] sm:w-[66px] lg:h-[94px] lg:w-[74px] ${
                  active === index
                    ? "border-[#B31345]"
                    : "border-transparent hover:border-black/20"
                }`}
              >
                <img
                  src={image.url}
                  alt={`${name} ${index + 1}`}
                  draggable={false}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* MAIN IMAGE */}

        <div className="order-1 min-w-0 lg:order-2">
          <div
            className="group relative aspect-[4/5] w-full overflow-hidden rounded-[14px] bg-[#F4F1EF]"
            onTouchStart={(event) => {
              touchStart.current = event.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              if (touchStart.current === null) return;

              const end =
                event.changedTouches[0]?.clientX ?? touchStart.current;
              const difference = end - touchStart.current;

              if (Math.abs(difference) > 45) {
                difference > 0 ? previous() : next();
              }

              touchStart.current = null;
            }}
          >
            {/* MOBILE BACK AND WISHLIST */}

            <div className="pointer-events-none absolute left-3 right-3 top-3 z-40 flex items-center justify-between lg:hidden">
              <button
                type="button"
                aria-label="Go back"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onBack();
                }}
                className="pointer-events-auto flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-black/[0.06] bg-white/95 text-[#211A18] shadow-[0_3px_14px_rgba(0,0,0,.14)] backdrop-blur transition-transform active:scale-95"
              >
                <BackIcon />
              </button>

              <button
                type="button"
                aria-label={
                  wished ? "Remove from wishlist" : "Add to wishlist"
                }
                disabled={wishlistBusy}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onToggleWishlist();
                }}
                className="pointer-events-auto flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-black/[0.06] bg-white/95 shadow-[0_3px_14px_rgba(0,0,0,.14)] backdrop-blur transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <GalleryHeartIcon filled={wished} />
              </button>
            </div>

            {/* CURRENT IMAGE */}

            {current ? (
              <img
                src={current.url}
                alt={name}
                draggable={false}
                onDoubleClick={() => setZoomOpen(true)}
                className="h-full w-full cursor-zoom-in object-cover transition-transform duration-500 group-hover:scale-[1.015]"
              />
            ) : (
              <div className="grid h-full place-items-center text-sm text-black/30">
                No Image
              </div>
            )}

            {/* IMAGE NAVIGATION */}

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    previous();
                  }}
                  className="absolute left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-2xl shadow opacity-0 transition hover:bg-white md:flex md:opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                >
                  ‹
                </button>

                <button
                  type="button"
                  aria-label="Next image"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    next();
                  }}
                  className="absolute right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-2xl shadow opacity-0 transition hover:bg-white md:flex md:opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                >
                  ›
                </button>
              </>
            )}

            {current && (
              <button
                type="button"
                aria-label="Zoom image"
                onClick={() => setZoomOpen(true)}
                className="absolute right-3 top-3 z-30 hidden h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/90 text-lg shadow lg:flex"
              >
                ⛶
              </button>
            )}

            {/* IMAGE DOTS */}

            {images.length > 1 && (
              <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 gap-1.5">
                {images.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={`Show image ${index + 1}`}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setActive(index);
                    }}
                    className={`h-2 cursor-pointer rounded-full transition-all ${
                      active === index
                        ? "w-5 bg-[#EC4F83]"
                        : "w-2 bg-white/75"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FULLSCREEN IMAGE ZOOM */}

      {zoomOpen && current && (
        <div
          className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/90 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setZoomOpen(false);
            }
          }}
        >
          <button
            type="button"
            aria-label="Close zoom"
            onClick={() => setZoomOpen(false)}
            className="absolute right-4 top-4 z-30 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white text-2xl"
          >
            ×
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={previous}
                className="absolute left-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-2xl sm:left-5"
              >
                ‹
              </button>

              <button
                type="button"
                aria-label="Next image"
                onClick={next}
                className="absolute right-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-white/90 text-2xl sm:right-5"
              >
                ›
              </button>
            </>
          )}

          <img
            src={current.url}
            alt={name}
            draggable={false}
            className="max-h-[92vh] max-w-[92vw] select-none object-contain"
          />
        </div>
      )}
    </>
  );
}

/* =========================================================
   RELATED PRODUCTS
========================================================= */

function normalizeRelatedProducts(response: unknown): ApiProduct[] {
  const readArray = (value: unknown): ApiProduct[] =>
    Array.isArray(value)
      ? value.filter(
          (item): item is ApiProduct =>
            Boolean(item && typeof item === "object")
        )
      : [];

  if (Array.isArray(response)) return readArray(response);
  if (!response || typeof response !== "object") return [];

  const root = response as Record<string, unknown>;

  for (const candidate of [
    root.products,
    root.relatedProducts,
    root.related,
    root.items,
  ]) {
    const items = readArray(candidate);
    if (items.length) return items;
  }

  const direct = readArray(root.data);
  if (direct.length) return direct;

  if (root.data && typeof root.data === "object") {
    const nested = root.data as Record<string, unknown>;

    for (const candidate of [
      nested.products,
      nested.relatedProducts,
      nested.related,
      nested.items,
    ]) {
      const items = readArray(candidate);
      if (items.length) return items;
    }
  }

  return [];
}

/* =========================================================
   RELATED PRODUCT CARD
========================================================= */

function RelatedProductCard({ product }: { product: ApiProduct }) {
  const commerce = useStorefrontCommerce();

  const selectedColor = useMemo(() => {
    const colors = Array.isArray(product.colors)
      ? product.colors.filter((color) => color.isActive !== false)
      : [];

    return (
      colors.find((color) => color.isDefault === true) ||
      colors[0] ||
      getDefaultColor(product)
    );
  }, [product]);

  const productId = getId(product);
  const colorId = getId(selectedColor);

  const name = String(
    selectedColor?.nameProduct || getProductName(product)
  ).trim();

  const slug = String(
    selectedColor?.slugProduct || field(product, "slug") || ""
  ).trim();

  const colorName = String(selectedColor?.nameColor || "").trim();

  const colorImages = Array.isArray(selectedColor?.images)
    ? selectedColor.images.filter((item) => Boolean(item?.url))
    : [];

  const defaultImage =
    colorImages.find((item) => item.isDefault === true) ||
    colorImages[0];

  const fallbacks = getProductImageUrls(product);
  const image = String(defaultImage?.url || fallbacks[0] || "");

  const secondImage = String(
    colorImages.find((item) => Boolean(item.url) && item.url !== image)
      ?.url ||
      fallbacks[1] ||
      image
  );

  const hasSecondImage = Boolean(secondImage && secondImage !== image);

  const activeSizes = Array.isArray(selectedColor?.sizes)
    ? selectedColor.sizes.filter((size) => size.isActive !== false)
    : [];

  const firstSize =
    activeSizes.find((size) => Number(size.stock || 0) > 0) ||
    activeSizes[0];

  const showPrice =
    positiveNumber(
      field(firstSize, "showPrice"),
      field(firstSize, "sellingPrice"),
      field(firstSize, "salePrice"),
      field(firstSize, "price"),
      field(selectedColor, "showPrice"),
      field(selectedColor, "sellingPrice"),
      field(selectedColor, "salePrice"),
      field(selectedColor, "price"),
      field(product, "showPrice"),
      field(product, "sellingPrice"),
      field(product, "salePrice"),
      field(product, "price")
    ) ?? 0;

  const originalPrice = Math.max(
    showPrice,
    positiveNumber(
      field(firstSize, "originalPrice"),
      field(firstSize, "mrp"),
      field(selectedColor, "originalPrice"),
      field(selectedColor, "mrp"),
      field(product, "originalPrice"),
      field(product, "mrp"),
      showPrice
    ) ?? showPrice
  );

  const discountAmount = Math.max(0, originalPrice - showPrice);

  const discountPercent =
    originalPrice > 0
      ? Math.round((discountAmount / originalPrice) * 100)
      : 0;

  const normalizedSizes: CatalogSize[] = activeSizes
    .map((size): CatalogSize | null => {
      const id = getId(size);
      if (!id) return null;

      const sizePrice =
        positiveNumber(
          field(size, "showPrice"),
          field(size, "sellingPrice"),
          field(size, "salePrice"),
          field(size, "price"),
          showPrice
        ) ?? showPrice;

      const sizeOriginal = Math.max(
        sizePrice,
        positiveNumber(
          field(size, "originalPrice"),
          field(size, "mrp"),
          originalPrice
        ) ?? sizePrice
      );

      return {
        id,
        label: String(size.size || size.name || "Size"),
        stock: Math.max(0, Number(size.stock || 0)),
        showPrice: sizePrice,
        originalPrice: sizeOriginal,
      };
    })
    .filter((size): size is CatalogSize => Boolean(size));

  const catalogProduct: CatalogProduct = {
    variantKey: `${productId}:${colorId}`,
    productId,
    colorId,
    name,
    slug,
    colorName,
    image1: image,
    image2: secondImage,
    showPrice,
    originalPrice,
    discountAmount,
    discountPercent,
    categorySlugs: getProductCategorySlugs(product),
    sizes: normalizedSizes,
    isFeatured: product.isFeatured === true,
    isNewLaunch: product.isNewLaunch === true,
  };

  const href = slug ? `/product/${encodeURIComponent(slug)}` : "#";

  return (
    <article className="group/card flex h-full min-w-0 flex-col overflow-hidden rounded-[14px] border border-black/10 bg-white shadow-[0_8px_24px_rgba(0,0,0,.04)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(0,0,0,.08)]">
      <Link
        href={href}
        className="group/image relative block aspect-[0.78] w-full overflow-hidden bg-[#F4F1EF]"
      >
        {image ? (
          <>
            <img
              src={image}
              alt={name}
              className={`absolute inset-0 h-full w-full object-cover transition-all duration-500 ${
                hasSecondImage
                  ? "md:group-hover/image:opacity-0"
                  : "md:group-hover/image:scale-[1.02]"
              }`}
            />

            {hasSecondImage && (
              <img
                src={secondImage}
                alt={`${name} alternate`}
                className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 md:group-hover/image:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="grid h-full place-items-center text-[10px] text-black/35">
            No Image
          </div>
        )}

        {discountPercent > 0 && (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-[#B31345] px-2 py-1 text-[7px] font-bold text-white sm:left-3 sm:top-3 sm:px-2.5 sm:text-[8px]">
            {discountPercent}% OFF
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <Link
          href={href}
          className="line-clamp-2 min-h-[34px] text-[10px] font-semibold leading-[1.45] text-[#211A18] transition hover:text-[#B31345] sm:min-h-[40px] sm:text-[13px]"
        >
          {name}
        </Link>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <strong className="whitespace-nowrap text-[12px] font-bold text-black sm:text-[15px]">
                ₹{showPrice.toLocaleString("en-IN")}
              </strong>

              {originalPrice > showPrice && (
                <span className="whitespace-nowrap text-[8px] text-black/35 line-through sm:text-[9px]">
                  ₹{originalPrice.toLocaleString("en-IN")}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => void commerce.openAddToBag(catalogProduct)}
            className="inline-flex h-[31px] shrink-0 items-center justify-center rounded-[7px] bg-[#B31345] px-3 text-[7px] font-bold uppercase tracking-[0.06em] text-white transition hover:bg-[#8C1839] active:scale-[0.97] sm:h-[34px] sm:px-4 sm:text-[8px]"
          >
            Add To Bag
          </button>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   RELATED PRODUCTS SECTION
========================================================= */

function RelatedProducts({ productId }: { productId: string }) {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) {
      setProducts([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadRelatedProducts() {
      try {
        setLoading(true);

        const response = await apiFetch<unknown>(
          `/api/products/${encodeURIComponent(
            productId
          )}/related?limit=4`,
          { method: "GET" }
        );

        if (cancelled) return;

        setProducts(
          normalizeRelatedProducts(response)
            .filter((item) => getId(item) !== productId)
            .slice(0, 4)
        );
      } catch (error) {
        console.error("RELATED PRODUCTS ERROR:", error);
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadRelatedProducts();

    return () => {
      cancelled = true;
    };
  }, [productId]);

  return (
    <section className="border-t border-black/10 bg-[#FBF8F6] px-3 py-10 sm:px-5 sm:py-14 lg:px-6 lg:py-16">
      <div className="mx-auto w-full max-w-[1260px]">
        <div className="mb-6 text-center sm:mb-8">
          <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#B31345] sm:text-[9px]">
            You May Also Like
          </p>

          <h2 className="mt-2 text-[24px] font-semibold tracking-[-0.02em] text-[#211A18] sm:text-[30px]">
            Related Products
          </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-[14px] border border-black/10 bg-white"
              >
                <div className="aspect-[0.78] animate-pulse bg-black/[0.06]" />

                <div className="space-y-2 p-4">
                  <div className="h-3 w-3/4 animate-pulse rounded bg-black/[0.07]" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-black/[0.07]" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
            {products.map((relatedProduct) => (
              <RelatedProductCard
                key={getId(relatedProduct)}
                product={relatedProduct}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[14px] border border-dashed border-black/15 bg-white px-5 py-10 text-center text-[12px] text-black/45">
            No related products found.
          </div>
        )}
      </div>
    </section>
  );
}

/* =========================================================
   MEN / WOMEN SIZE CHART DETECTION
========================================================= */

function resolveSizeChartKind(
  product: ApiProduct,
  displayName: string
): SizeChartKind | null {
  const categories = getProductCategorySlugs(product).join(" ");

  const otherFields = [
    field(product, "gender"),
    field(product, "department"),
    field(product, "categoryName"),
    field(product, "subCategoryName"),
  ].filter((value): value is string => typeof value === "string");

  const text = [categories, displayName, ...otherFields]
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ");

  const isWomen = /\b(women|womens|woman|female|ladies|lady|girls)\b/.test(
    text
  );

  const isMen = /\b(men|mens|man|male|boys)\b/.test(text);

  const isBra = /\b(bra|bras|bralette|bralettes|bustier)\b/.test(text);

  const isPanty =
    /\b(panty|panties|hipster|hipsters|lingerie|thong|thongs|gstring|bikini)\b/.test(
      text
    );

  if (isWomen) return isBra ? "women-bra" : "women-panties";
  if (isMen) return "men";
  if (isBra) return "women-bra";
  if (isPanty) return "women-panties";

  return null;
}

/* =========================================================
   MAIN PRODUCT DETAILS
========================================================= */

export default function ProductDetails({ product, currentSlug }: Props) {
  const router = useRouter();
  const commerce = useStorefrontCommerce();
  const productId = getId(product);

  /* =======================================================
     COLORS
  ======================================================= */

  const activeColors = useMemo(
    () =>
      Array.isArray(product.colors)
        ? product.colors.filter((color) => color.isActive !== false)
        : [],
    [product.colors]
  );

  const urlColorIndex = useMemo(
    () =>
      activeColors.findIndex(
        (color) => String(color.slugProduct || "") === currentSlug
      ),
    [activeColors, currentSlug]
  );

  const defaultColorIndex = useMemo(() => {
    if (urlColorIndex >= 0) return urlColorIndex;

    const index = activeColors.findIndex(
      (color) => color.isDefault === true
    );

    return index >= 0 ? index : 0;
  }, [activeColors, urlColorIndex]);

  const [selectedColorIndex, setSelectedColorIndex] = useState(
    defaultColorIndex
  );

  const [selectedSizeIndex, setSelectedSizeIndex] = useState<
    number | null
  >(null);

  const [quantity, setQuantity] = useState(1);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);

  useEffect(() => {
    setSelectedColorIndex(defaultColorIndex);
    setSelectedSizeIndex(null);
    setQuantity(1);
    setSizeChartOpen(false);
  }, [defaultColorIndex, currentSlug]);

  const selectedColor: ApiColor | null =
    activeColors[selectedColorIndex] || getDefaultColor(product);

  const colorId = getId(selectedColor);

  /* =======================================================
     IMAGES
  ======================================================= */

  const images = useMemo<GalleryImage[]>(() => {
    const colorImages = Array.isArray(selectedColor?.images)
      ? selectedColor.images.filter((image) => Boolean(image.url))
      : [];

    if (colorImages.length) {
      const defaultImage = colorImages.find(
        (image) => image.isDefault === true
      );

      return [
        ...(defaultImage ? [defaultImage] : []),
        ...colorImages.filter((image) => image !== defaultImage),
      ].map((image) => ({
        url: String(image.url || ""),
        publicId: image.publicId,
        isDefault: image.isDefault,
      }));
    }

    return getProductImageUrls(product).map((url) => ({ url }));
  }, [selectedColor, product]);

  /* =======================================================
     SIZES
  ======================================================= */

  const sizes: ApiSize[] = useMemo(
    () =>
      Array.isArray(selectedColor?.sizes)
        ? selectedColor.sizes.filter((size) => size.isActive !== false)
        : [],
    [selectedColor]
  );

  const selectedSize =
    selectedSizeIndex !== null ? sizes[selectedSizeIndex] : undefined;

  const name = String(selectedColor?.nameProduct || getProductName(product));

  const sizeChartKind = useMemo(
    () => resolveSizeChartKind(product, name),
    [product, name]
  );

  const colorName = String(selectedColor?.nameColor || "");

  const slug = String(
    selectedColor?.slugProduct || currentSlug || ""
  );

  const shortDescription = String(
    selectedColor?.shortDescription || product.shortDescription || ""
  );

  const description = cleanDescriptionHtml(
    selectedColor?.description || product.description
  );


  const legacyPinkDescription =
    /max-width\s*:\s*900px/i.test(description) &&
    /#a3134f/i.test(description) &&
    /#ffd1e3/i.test(description);
  /* =======================================================
     PRICES
  ======================================================= */

  const showPrice =
    positiveNumber(
      field(selectedSize, "showPrice"),
      field(selectedColor, "showPrice"),
      field(selectedSize, "sellingPrice"),
      field(selectedColor, "sellingPrice"),
      field(selectedSize, "salePrice"),
      field(selectedColor, "salePrice"),
      field(selectedSize, "price"),
      field(selectedColor, "price"),
      field(product, "showPrice"),
      field(product, "sellingPrice"),
      field(product, "price")
    ) ?? 0;

  const originalPrice = Math.max(
    showPrice,
    positiveNumber(
      field(selectedSize, "originalPrice"),
      field(selectedColor, "originalPrice"),
      field(selectedSize, "mrp"),
      field(selectedColor, "mrp"),
      field(product, "originalPrice"),
      field(product, "mrp"),
      showPrice
    ) ?? showPrice
  );

  const discountAmount = Math.max(0, originalPrice - showPrice);

  const discountPercent =
    originalPrice > 0
      ? Math.round((discountAmount / originalPrice) * 100)
      : 0;

  /* =======================================================
     STOCK
  ======================================================= */

  const totalColorStock = sizes.reduce(
    (total, size) => total + Math.max(0, Number(size.stock || 0)),
    0
  );

  const currentStock = selectedSize
    ? Math.max(0, Number(selectedSize.stock || 0))
    : totalColorStock;

  /* =======================================================
     CATALOG PRODUCT
  ======================================================= */

  const catalogProduct: CatalogProduct = useMemo(() => {
    const normalizedSizes = sizes
      .map((size): CatalogSize | null => {
        const id = getId(size);
        if (!id) return null;

        const sizePrice =
          positiveNumber(
            field(size, "showPrice"),
            field(size, "sellingPrice"),
            field(selectedColor, "showPrice"),
            showPrice
          ) ?? showPrice;

        const sizeOriginal = Math.max(
          sizePrice,
          positiveNumber(
            field(size, "originalPrice"),
            field(size, "mrp"),
            field(selectedColor, "originalPrice"),
            originalPrice
          ) ?? sizePrice
        );

        return {
          id,
          label: String(size.size || size.name || "Size"),
          stock: Math.max(0, Number(size.stock || 0)),
          showPrice: sizePrice,
          originalPrice: sizeOriginal,
        };
      })
      .filter((size): size is CatalogSize => Boolean(size));

    return {
      variantKey: `${productId}:${colorId}`,
      productId,
      colorId,
      name,
      slug,
      colorName,
      image1: images[0]?.url || "",
      image2: images[1]?.url || images[0]?.url || "",
      showPrice,
      originalPrice,
      discountAmount,
      discountPercent,
      categorySlugs: getProductCategorySlugs(product),
      sizes: normalizedSizes,
      isFeatured: product.isFeatured === true,
      isNewLaunch: product.isNewLaunch === true,
    };
  }, [
    sizes,
    selectedColor,
    showPrice,
    originalPrice,
    productId,
    colorId,
    name,
    slug,
    colorName,
    images,
    discountAmount,
    discountPercent,
    product,
  ]);

  const wished = commerce.isWishlisted(catalogProduct);
  const wishlistBusy = commerce.isWishlistBusy(catalogProduct);

  /* =======================================================
     SELECT COLOR
  ======================================================= */

  const selectColor = (index: number) => {
    const color = activeColors[index];
    if (!color) return;

    setSelectedColorIndex(index);
    setSelectedSizeIndex(null);
    setQuantity(1);

    const nextSlug = String(color.slugProduct || "").trim();

    if (nextSlug && nextSlug !== currentSlug) {
      router.push(`/product/${encodeURIComponent(nextSlug)}`, {
        scroll: false,
      });
    }
  };

  /* =======================================================
     SELECT SIZE
  ======================================================= */

  const selectSize = (index: number) => {
    const size = sizes[index];

    if (!size || Number(size.stock || 0) <= 0) return;

    setSelectedSizeIndex(index);
    setQuantity(1);
  };

  /* =======================================================
     ADD TO BAG
  ======================================================= */

  const addToBag = async () => {
    if (sizes.length > 0 && !selectedSize) return;

    const sizeId = getId(selectedSize);

    if (!productId || !colorId || !sizeId) return;

    await commerce.addVariantToCart({
      productId,
      colorId,
      sizeId,
      name,
      colorName,
      sizeLabel: String(
        selectedSize?.size || selectedSize?.name || ""
      ),
      image: images[0]?.url,
      quantity,
    });
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-white text-[#211A18]">
      <section className="mx-auto grid w-full max-w-[1260px] grid-cols-1 gap-7 px-3 pb-12 pt-4 sm:px-5 sm:pt-7 lg:grid-cols-[minmax(0,650px)_minmax(350px,1fr)] lg:gap-12 lg:px-6 lg:pb-20 lg:pt-10">
        <ProductGallery
          images={images}
          name={name}
          wished={wished}
          wishlistBusy={wishlistBusy}
          onBack={() => router.back()}
          onToggleWishlist={() =>
            void commerce.toggleWishlist(catalogProduct)
          }
        />

        {/* PRODUCT DETAILS */}

        <div className="min-w-0 px-1 lg:sticky lg:top-[110px] lg:self-start">
          <div className="flex gap-2 text-[9px] font-bold uppercase tracking-[0.15em] text-[#B31345]">
            {product.isNewLaunch && <span>New Launch</span>}
            {product.isFeatured && <span>Featured</span>}
          </div>

          {/* PRODUCT NAME */}

          <h1 className="mt-2 text-[22px] font-semibold leading-tight text-black sm:text-[26px] lg:text-[30px]">
            {name}
          </h1>

          {shortDescription && (
            <p className="mt-3 text-[12px] leading-5 text-black/50">
              {shortDescription}
            </p>
          )}

          {/* PRODUCT PRICE */}

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <strong className="text-[22px] text-black">
              ₹{showPrice.toLocaleString("en-IN")}
            </strong>

            {originalPrice > showPrice && (
              <span className="text-[12px] text-black/35 line-through">
                ₹{originalPrice.toLocaleString("en-IN")}
              </span>
            )}

            {discountPercent > 0 && (
              <span className="rounded-full bg-[#F8E7EC] px-2.5 py-1 text-[9px] font-bold text-[#B31345]">
                {discountPercent}% OFF
              </span>
            )}
          </div>

          {/* COLOR SELECTOR */}

          {activeColors.length > 0 && (
            <div className="mt-7">
              <p className="text-[11px] font-semibold">
                Color:{" "}
                <span className="font-normal text-black/50">
                  {colorName || "Default"}
                </span>
              </p>

              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {activeColors.map((color, index) => {
                  const colorImages = Array.isArray(color.images)
                    ? color.images.filter((image) => Boolean(image.url))
                    : [];

                  const image =
                    colorImages.find((item) => item.isDefault === true) ||
                    colorImages[0];

                  return (
                    <button
                      key={getId(color) || index}
                      type="button"
                      onClick={() => selectColor(index)}
                      className="w-[62px] flex-none cursor-pointer text-left"
                    >
                      <div
                        className={`aspect-[4/5] overflow-hidden rounded-[8px] border-2 ${
                          selectedColorIndex === index
                            ? "border-[#211A18]"
                            : "border-transparent"
                        }`}
                      >
                        {image?.url && (
                          <img
                            src={image.url}
                            alt={color.nameColor || name}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>

                      <span className="mt-1 block truncate text-[8px] text-black/50">
                        {color.nameColor || "Default"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* =================================================
              SIZE SELECTOR + SIZE CHART

              IMPORTANT:
              Hover par Size Chart open nahi hoga.
              Only click / tap opens the modal.
          ================================================= */}

          {sizes.length > 0 && (
            <div className="mt-7">
              <p className="text-[11px] font-semibold">
                Select Size
              </p>

              {/* SIZE CHART — CLICK ONLY */}

              {sizeChartKind && (
                <button
                  type="button"
                  onClick={() => setSizeChartOpen(true)}
                  aria-label="Open size chart"
                  aria-haspopup="dialog"
                  aria-expanded={sizeChartOpen}
                  className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-md border border-[#E8CAD4] bg-[#FFF9FB] px-3 py-2 text-[11px] font-semibold text-[#A71948] transition hover:border-[#B31345] hover:bg-[#FCE7EE]"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m21.3 8.7-6-6a1 1 0 0 0-1.4 0L2.7 13.9a1 1 0 0 0 0 1.4l6 6a1 1 0 0 0 1.4 0L21.3 10a1 1 0 0 0 0-1.4Z" />
                    <path d="m7.5 9.1 2.3 2.3M10.5 6.1l2.3 2.3M4.5 12.1l2.3 2.3" />
                  </svg>

                  Size Chart
                </button>
              )}

              {/* SIZE BUTTONS */}

              <div className="mt-3 flex flex-wrap gap-2">
                {sizes.map((size, index) => {
                  const disabled = Number(size.stock || 0) <= 0;

                  return (
                    <button
                      key={getId(size) || index}
                      type="button"
                      disabled={disabled}
                      onClick={() => selectSize(index)}
                      className={`min-w-[48px] cursor-pointer rounded-[8px] border px-3 py-2.5 text-[11px] font-semibold ${
                        selectedSizeIndex === index
                          ? "border-[#211A18] bg-[#211A18] text-white"
                          : "border-black/20 bg-white text-black"
                      } ${
                        disabled
                          ? "cursor-not-allowed bg-black/5 text-black/20 line-through"
                          : "hover:border-[#B31345] hover:text-[#B31345]"
                      }`}
                    >
                      {size.size || size.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* QUANTITY + ADD TO BAG + WISHLIST */}

          <div className="mt-5 grid grid-cols-[92px_minmax(0,1fr)] gap-2 lg:grid-cols-[92px_minmax(0,1fr)_46px]">
            {/* QUANTITY */}

            <div className="flex h-11 items-center justify-between rounded-[8px] border border-black/20 px-3">
              <button
                type="button"
                onClick={() =>
                  setQuantity((current) => Math.max(1, current - 1))
                }
                className="cursor-pointer"
              >
                −
              </button>

              <strong className="text-[11px]">
                {quantity}
              </strong>

              <button
                type="button"
                disabled={currentStock <= 0 || quantity >= currentStock}
                onClick={() =>
                  setQuantity((current) =>
                    Math.min(currentStock, current + 1)
                  )
                }
                className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
              >
                +
              </button>
            </div>

            {/* ADD TO BAG */}

            <button
              type="button"
              disabled={
                currentStock <= 0 ||
                (sizes.length > 0 && !selectedSize)
              }
              onClick={() => void addToBag()}
              className="h-11 cursor-pointer rounded-[8px] bg-[#2E2A29] text-[10px] font-bold uppercase text-white transition-colors hover:bg-[#B31345] disabled:cursor-not-allowed disabled:bg-black/20"
            >
              {sizes.length > 0 && !selectedSize
                ? "Select Size"
                : "Add To Bag"}
            </button>

            {/* DESKTOP WISHLIST */}

            <button
              type="button"
              disabled={wishlistBusy}
              onClick={() =>
                void commerce.toggleWishlist(catalogProduct)
              }
              className={`hidden h-11 cursor-pointer items-center justify-center rounded-[8px] border text-xl lg:flex ${
                wished
                  ? "border-[#B31345] bg-[#B31345] text-white"
                  : "border-[#B31345]/40 bg-white text-[#B31345]"
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {wished ? "♥" : "♡"}
            </button>
          </div>
        </div>
      </section>

      {/* REVIEWS */}

      {productId && (
        <ProductReviews
          productId={productId}
          productName={name}
        />
      )}

      {/* RELATED PRODUCTS */}

      {productId ? <RelatedProducts productId={productId} /> : null}

      {/* PRODUCT DESCRIPTION */}

      <section className="border-t border-black/10 bg-white px-4 py-12 sm:px-6 lg:py-18">
        <div className="mx-auto max-w-[960px]">
          <div className="text-center">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#B31345]">
              Product Information
            </p>

            <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
              Product Description
            </h2>
          </div>

          {description ? (
            <div
              className={`mx-auto mt-8 max-w-[880px] text-[13px] leading-7 text-[#39322F] sm:text-[14px] [&_h1]:my-5 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:my-5 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[#A91543] [&_h3]:my-4 [&_h3]:text-lg [&_h3]:font-semibold [&_p]:my-4 [&_strong]:font-bold [&_strong]:text-[#A91543] [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-2 [&_img]:mx-auto [&_img]:my-6 [&_img]:max-w-full [&_img]:rounded-xl ${legacyPinkDescription ? "product-description--legacy-pink" : ""}`}
              dangerouslySetInnerHTML={{ __html: description }}
            />
          ) : (
            <p className="mt-8 text-center text-sm text-black/40">
              No product description available.
            </p>
          )}
        </div>
      </section>

      {/* SIZE CHART MODAL */}

      <SizeChartModal
        open={sizeChartOpen && sizeChartKind !== null}
        kind={sizeChartKind || "men"}
        onClose={() => setSizeChartOpen(false)}
      />
    </main>
  );
}
