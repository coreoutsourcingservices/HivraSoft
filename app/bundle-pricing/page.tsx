import Header from "@/src/components/Header/Header";

import BundlePricingCatalog from "@/src/components/BundlePricing/BundlePricingCatalog";

import {
  getActiveCategoryTree,
} from "@/src/services/categories";

import {
  getActiveProducts,
} from "@/src/services/products";

import {
  findCategoryAnywhere,
  getCategoryBanners,
  mapProductToColorCards,
  productBelongsToCategory,
} from "@/src/services/storefront-catalog";

export const dynamic = "force-dynamic";

/* =========================================================
   BUNDLE PRICING PAGE

   RULE:

   Product MUST first belong to Bundle Pricing.

   Then:

   Bundle Pricing + Men
   → Men tab

   Bundle Pricing + Women
   → Women tab

   Bundle Pricing + Accessories
   → Accessories tab

   Offer-selected products are NOT automatically included.
========================================================= */

export default async function BundlePricingPage() {
  /* =======================================================
     LOAD DATA
  ======================================================= */

  const [
    categoryTree,
    allProducts,
  ] = await Promise.all([
    getActiveCategoryTree(),
    getActiveProducts(),
  ]);

  /* =======================================================
     FIND BUNDLE PRICING CATEGORY
  ======================================================= */

  const bundleCategory =
    findCategoryAnywhere(
      categoryTree,
      [
        "bundle-pricing",
        "bundle-price",
        "bundle-prices",
        "bundle",
      ],
    ) || null;

  /* =======================================================
     FIND MEN CATEGORY
  ======================================================= */

  const menCategory =
    findCategoryAnywhere(
      categoryTree,
      [
        "men",
        "mens",
        "menswear",
        "male",
      ],
    ) || null;

  /* =======================================================
     FIND WOMEN CATEGORY
  ======================================================= */

  const womenCategory =
    findCategoryAnywhere(
      categoryTree,
      [
        "women",
        "womens",
        "womenswear",
        "female",
      ],
    ) || null;

  /* =======================================================
     FIND ACCESSORIES CATEGORY
  ======================================================= */

  const accessoriesCategory =
    findCategoryAnywhere(
      categoryTree,
      [
        "accessories",
        "accessory",
      ],
    ) || null;

  /* =======================================================
     FIRST FILTER:

     ONLY BUNDLE PRICING PRODUCTS
  ======================================================= */

  const bundleApiProducts =
    bundleCategory
      ? allProducts.filter(
          (product) =>
            productBelongsToCategory(
              product,
              bundleCategory,
            ),
        )
      : [];

  /* =======================================================
     MEN PRODUCTS

     Product must belong to BOTH:

     Bundle Pricing
     +
     Men
  ======================================================= */

  const menApiProducts =
    menCategory
      ? bundleApiProducts.filter(
          (product) =>
            productBelongsToCategory(
              product,
              menCategory,
            ),
        )
      : [];

  const menProducts =
    menApiProducts.flatMap(
      mapProductToColorCards,
    );

  /* =======================================================
     WOMEN PRODUCTS

     Product must belong to BOTH:

     Bundle Pricing
     +
     Women
  ======================================================= */

  const womenApiProducts =
    womenCategory
      ? bundleApiProducts.filter(
          (product) =>
            productBelongsToCategory(
              product,
              womenCategory,
            ),
        )
      : [];

  const womenProducts =
    womenApiProducts.flatMap(
      mapProductToColorCards,
    );

  /* =======================================================
     ACCESSORIES PRODUCTS

     Product must belong to BOTH:

     Bundle Pricing
     +
     Accessories
  ======================================================= */

  const accessoriesApiProducts =
    accessoriesCategory
      ? bundleApiProducts.filter(
          (product) =>
            productBelongsToCategory(
              product,
              accessoriesCategory,
            ),
        )
      : [];

  const accessoriesProducts =
    accessoriesApiProducts.flatMap(
      mapProductToColorCards,
    );

  /* =======================================================
     BUNDLE PRICING BANNERS

     Admin:
     Categories
       → Bundle Pricing
       → Images
  ======================================================= */

  const banners =
    bundleCategory
      ? getCategoryBanners(
          bundleCategory,
          "/bundle-pricing",
          [],
        )
      : [];

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <Header />

      <BundlePricingCatalog
        productGroups={{
          men: menProducts,
          women: womenProducts,
          accessories:
            accessoriesProducts,
        }}
        banners={banners}
        categoryName={
          bundleCategory?.name ||
          "Bundle Pricing"
        }
        description={
          bundleCategory?.description?.trim() ||
          "Explore Hivra Soft bundle pricing collection."
        }
      />
    </>
  );
}