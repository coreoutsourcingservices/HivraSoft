"use client";

import ResponsiveCatalog from "@/src/components/Storefront/ResponsiveCatalog";

import CategoryOfferStrip from "@/src/components/Offers/CategoryOfferStrip";

import type {
  StorefrontCategoryNode,
} from "@/src/services/categories";

import type {
  StorefrontOffer,
} from "@/src/services/offers";

import type {
  CatalogBanner,
  CatalogProduct,
} from "@/types/catalog";

/* =========================================================
   TYPES
========================================================= */

type Props = {
  products:
    CatalogProduct[];

  banners:
    CatalogBanner[];

  title:
    string;

  description:
    string;

  categoryRoot:
    StorefrontCategoryNode;

  categoryPath:
    string[];

  fixedPriceOffer?:
    StorefrontOffer | null;
};

/* =========================================================
   MEN CATALOG
========================================================= */

export default function MenCatalog({
  products,
  banners,
  title,
  description,
  categoryRoot,
  categoryPath,
  fixedPriceOffer,
}: Props) {
  return (
    <>
      {/* ===================================================
          FIXED PRICE OFFER

          Sirf selected category page par.
      =================================================== */}

      <CategoryOfferStrip
        offer={
          fixedPriceOffer ||
          null
        }
      />

      {/* ===================================================
          NORMAL CATALOG

          Women ke same:
          banner
          categories
          filters
          sort
          StorefrontProductCard
      =================================================== */}

      <ResponsiveCatalog
        basePath="/men"
        allLabel="All Men"
        products={
          products
        }
        banners={
          banners
        }
        title={
          title
        }
        description={
          description
        }
        categoryRoot={
          categoryRoot
        }
        categoryPath={
          categoryPath
        }
      />
    </>
  );
}