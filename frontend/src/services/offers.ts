import {
  getProductId,
  type ApiProduct,
} from "@/src/services/products";

import {
  productBelongsToCategory,
} from "@/src/services/storefront-catalog";

import type {
  StorefrontCategoryNode,
} from "@/src/services/categories";

import type {
  CatalogBanner,
} from "@/types/catalog";

/* =========================================================
   API
========================================================= */

const RAW_API_URL =
  process.env
    .NEXT_PUBLIC_API_URL
    ?.replace(
      /\/+$/,
      "",
    ) ||
  "http://localhost:5000";

const API_URL =
  RAW_API_URL.replace(
    /\/api$/i,
    "",
  );

/* =========================================================
   TYPES
========================================================= */

export type StorefrontOfferType =
  | "buy_get"
  | "fixed_price_bundle";

export type StorefrontOffer = {
  _id: string;

  name: string;
  slug: string;

  offerType:
    StorefrontOfferType;

  buyQuantity: number;
  getQuantity: number;
  getPrice?: number;

  fixedPrice: number;

  appliesToAllProducts:
    boolean;

  productIds:
    string[];

  categoryIds:
    string[];

  image?: { url: string; publicId: string } | null;

  isActive:
    boolean;

  updatedAt?:
    string;
};

type OfferListResponse = {
  success?: boolean;

  offers?:
    StorefrontOffer[];
};

/* =========================================================
   ACTIVE OFFERS
========================================================= */

export async function getActiveOffers(): Promise<
  StorefrontOffer[]
> {
  try {
    const response =
      await fetch(
        `${API_URL}/api/offers`,
        {
          cache:
            "no-store",

          headers: {
            Accept:
              "application/json",
          },
        },
      );

    if (!response.ok) {
      return [];
    }

    const result =
      (await response.json()) as OfferListResponse;

    return Array.isArray(
      result.offers,
    )
      ? result.offers.filter(
          (
            offer,
          ) =>
            offer.isActive !==
            false,
        )
      : [];
  } catch {
    return [];
  }
}

/* =========================================================
   BUY GET FOR HEADER
========================================================= */

export async function getFeaturedBuyGetOffer(): Promise<
  StorefrontOffer | null
> {
  const offers =
    await getActiveOffers();

  return (
    offers.find(
      (
        offer,
      ) =>
        offer.offerType ===
        "buy_get",
    ) ||
    null
  );
}

/* =========================================================
   OFFER BY SLUG
========================================================= */

export async function getOfferBySlug(
  slug: string,
): Promise<
  StorefrontOffer | null
> {
  const target =
    String(
      slug || "",
    )
      .trim()
      .toLowerCase();

  const offers =
    await getActiveOffers();

  return (
    offers.find(
      (
        offer,
      ) =>
        offer.slug
          .trim()
          .toLowerCase() ===
        target,
    ) ||
    null
  );
}

/* =========================================================
   FLATTEN CATEGORY TREE
========================================================= */

function flattenTree(
  tree:
    StorefrontCategoryNode[],
) {
  const result:
    StorefrontCategoryNode[] =
    [];

  function visit(
    node:
      StorefrontCategoryNode,
  ) {
    result.push(
      node,
    );

    node.children.forEach(
      visit,
    );
  }

  tree.forEach(
    visit,
  );

  return result;
}

/* =========================================================
   SELECTED OFFER CATEGORIES
========================================================= */

function getSelectedCategories(
  offer:
    StorefrontOffer,

  tree:
    StorefrontCategoryNode[],
) {
  const selectedIds =
    new Set(
      offer.categoryIds.map(
        String,
      ),
    );

  return flattenTree(
    tree,
  ).filter(
    (
      category,
    ) =>
      selectedIds.has(
        String(
          category.id,
        ),
      ),
  );
}

/* =========================================================
   ELIGIBLE PRODUCTS

   Used ONLY for actual offer page.

   Bundle Pricing normal page does NOT call this.
========================================================= */

export function getOfferEligibleProducts(
  offer:
    StorefrontOffer,

  products:
    ApiProduct[],

  tree:
    StorefrontCategoryNode[],
) {
  if (
    offer.appliesToAllProducts
  ) {
    return products;
  }

  const productIds =
    new Set(
      offer.productIds.map(
        String,
      ),
    );

  const categories =
    getSelectedCategories(
      offer,
      tree,
    );

  return products.filter(
    (
      product,
    ) => {
      const id =
        String(
          getProductId(
            product,
          ),
        );

      if (
        productIds.has(
          id,
        )
      ) {
        return true;
      }

      return categories.some(
        (
          category,
        ) =>
          productBelongsToCategory(
            product,
            category,
          ),
      );
    },
  );
}

/* =========================================================
   OFFER PAGE BANNERS

   Selected category images.
========================================================= */

export function getOfferBanners(
  offer:
    StorefrontOffer,

  tree:
    StorefrontCategoryNode[],

  redirect:
    string,
): CatalogBanner[] {
  const categories =
    getSelectedCategories(
      offer,
      tree,
    );

  const result:
    CatalogBanner[] =
    [];

  const used =
    new Set<string>();

  // Admin-uploaded Cloudinary artwork is the primary offer banner.
  if (offer.image?.url) {
    used.add(offer.image.url);
    result.push({ image: offer.image.url, alt: `${offer.name} Offer`, redirect });
  }

  categories.forEach(
    (
      category,
    ) => {
      category.images.forEach(
        (
          image,
          index,
        ) => {
          const url =
            String(
              image.url ||
                "",
            ).trim();

          if (
            !url ||
            used.has(
              url,
            )
          ) {
            return;
          }

          used.add(
            url,
          );

          result.push({
            image:
              url,

            alt:
              image.alt ||
              `${category.name} Banner ${index + 1}`,

            redirect,
          });
        },
      );
    },
  );

  return result;
}

/* =========================================================
   FIXED PRICE OFFER FOR EXACT CATEGORY

   Example admin selects:

   Hipster
   Thongs

   Hipster page -> OFFER ✅
   Thongs page -> OFFER ✅
   Panties parent -> NO ❌
   Women root -> NO ❌
   Header -> NO ❌
========================================================= */

export async function getFixedPriceOfferForCategory(
  categoryId:
    string,
): Promise<
  StorefrontOffer | null
> {
  const offers =
    await getActiveOffers();

  return (
    offers.find(
      (
        offer,
      ) => {
        if (
          offer.offerType !==
          "fixed_price_bundle"
        ) {
          return false;
        }

        if (
          offer.appliesToAllProducts
        ) {
          return true;
        }

        return offer.categoryIds
          .map(
            String,
          )
          .includes(
            String(
              categoryId,
            ),
          );
      },
    ) ||
    null
  );
}