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
   WOMEN CATALOG
========================================================= */

export default function WomenCatalog({
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

          Sirf selected category page par aayega.
          Products ko change/filter nahi karta.
      =================================================== */}

      <CategoryOfferStrip
        offer={
          fixedPriceOffer ||
          null
        }
      />

      {/* ===================================================
          NORMAL CATALOG

          Existing cards / mobile / filters same.
      =================================================== */}

      <ResponsiveCatalog
        basePath="/women"
        allLabel="All Women"
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