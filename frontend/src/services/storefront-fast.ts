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
      "storefront-active-category-tree-v2",
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
      "storefront-active-products-v2",
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
      "storefront-fixed-price-offer-category-v2",
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