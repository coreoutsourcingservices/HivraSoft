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

export const dynamic =
  "force-dynamic";

/* =========================================================
   BUNDLE PRICING PAGE

   IMPORTANT:
   This is NORMAL CATEGORY behavior.

   NO OFFER PRODUCTS HERE.
========================================================= */

export default async function BundlePricingPage() {
  const [
    categoryTree,
    allProducts,
  ] =
    await Promise.all([
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
        "bundle",
      ],
    );

  /* =======================================================
     PRODUCTS

     ONLY products assigned to Bundle Pricing category.

     Fixed Price Offer ke selected products yahan
     automatically add NAHI honge.
  ======================================================= */

  const bundleApiProducts =
    bundleCategory
      ? allProducts.filter(
          (
            product,
          ) =>
            productBelongsToCategory(
              product,
              bundleCategory,
            ),
        )
      : [];

  /* =======================================================
     NORMAL STOREFRONT PRODUCT CARDS

     Same mapper used by Men/Women/New Launch.
  ======================================================= */

  const products =
    bundleApiProducts.flatMap(
      mapProductToColorCards,
    );

  /* =======================================================
     NORMAL CATEGORY BANNERS

     Admin:
     Categories
       -> Bundle Pricing
       -> Images

     Multiple images supported.
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
        products={
          products
        }
        banners={
          banners
        }
        categoryName={
          bundleCategory?.name ||
          "Bundle Pricing"
        }
        description={
          bundleCategory
            ?.description ||
          "Explore Hivra Soft bundle pricing collection."
        }
      />
    </>
  );
}