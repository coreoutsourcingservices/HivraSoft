import {
  unstable_cache,
} from "next/cache";

import {
  getActiveCategoryTree,
} from "@/src/services/categories";

import {
  getActiveProducts,
} from "@/src/services/products";

import {
  getFixedPriceOfferForCategory,
} from "@/src/services/offers";

/* =========================================================
   INTERNAL CACHED FUNCTIONS
========================================================= */

const cachedActiveCategoryTree =
  unstable_cache(
    async () => {
      return getActiveCategoryTree();
    },
    [
      "storefront-active-category-tree-v3",
      process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "default",
    ],
    {
      revalidate: 60,

      tags: [
        "storefront-categories",
      ],
    },
  );

const cachedActiveProducts =
  unstable_cache(
    async () => {
      return getActiveProducts();
    },
    [
      "storefront-active-products-v3",
      process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "default",
    ],
    {
      revalidate: 30,

      tags: [
        "storefront-products",
      ],
    },
  );

const cachedFixedPriceOfferForCategory =
  unstable_cache(
    async (
      categoryId: string,
    ) => {
      return getFixedPriceOfferForCategory(
        categoryId,
      );
    },
    [
      "storefront-fixed-price-offer-category-v3",
      process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "default",
    ],
    {
      revalidate: 15,

      tags: [
        "storefront-offers",
      ],
    },
  );

/* =========================================================
   EXPLICIT EXPORTS
========================================================= */

export async function getCachedActiveCategoryTree() {
  return cachedActiveCategoryTree();
}

export async function getCachedActiveProducts() {
  return cachedActiveProducts();
}

export async function getCachedFixedPriceOfferForCategory(
  categoryId: string,
) {
  return cachedFixedPriceOfferForCategory(
    categoryId,
  );
}