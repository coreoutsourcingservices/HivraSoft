import {
  notFound,
} from "next/navigation";

import Header from "@/src/components/Header/Header";

import WomenCatalog from "@/src/components/Women/WomenCatalog";

import {
  findCategoryRoot,
  resolveCategoryPath,
} from "@/src/services/categories";

import {
  getCategoryBanners,
  mapProductToColorCards,
  productBelongsToCategory,
} from "@/src/services/storefront-catalog";

import {
  getCachedActiveCategoryTree,
  getCachedActiveProducts,
  getCachedFixedPriceOfferForCategory,
} from "@/src/services/storefront-fast";

/* =========================================================
   REVALIDATE

   force-dynamic hata diya.
========================================================= */

export const revalidate =
  30;

/* =========================================================
   TYPES
========================================================= */

type Props = {
  params: Promise<{
    slug?: string[];
  }>;
};

/* =========================================================
   WOMEN PAGE
========================================================= */

export default async function WomenPage({
  params,
}: Props) {
  const resolved =
    await params;

  const slugParts =
    (
      resolved.slug ||
      []
    )
      .map(
        (
          slug,
        ) =>
          String(
            slug,
          )
            .trim()
            .toLowerCase(),
      )
      .filter(
        Boolean,
      );

  /* =======================================================
     CATEGORY TREE + PRODUCTS PARALLEL
  ======================================================= */

  const [
    tree,
    apiProducts,
  ] =
    await Promise.all([
      getCachedActiveCategoryTree(),

      getCachedActiveProducts(),
    ]);

  /* =======================================================
     WOMEN ROOT
  ======================================================= */

  const womenRoot =
    findCategoryRoot(
      tree,
      "women",
    );

  if (
    !womenRoot
  ) {
    notFound();
  }

  /* =======================================================
     CURRENT CATEGORY
  ======================================================= */

  const selected =
    resolveCategoryPath(
      womenRoot,
      slugParts,
    );

  if (
    !selected
  ) {
    notFound();
  }

  const currentCategory =
    selected.at(
      -1,
    ) ||
    womenRoot;

  /* =======================================================
     FIXED PRICE OFFER
  ======================================================= */

  const fixedPriceOffer =
    await getCachedFixedPriceOfferForCategory(
      currentCategory.id,
    );

  /* =======================================================
     PRODUCTS
  ======================================================= */

  const products =
    apiProducts
      .filter(
        (
          product,
        ) =>
          productBelongsToCategory(
            product,
            currentCategory,
          ),
      )
      .flatMap(
        mapProductToColorCards,
      );

  /* =======================================================
     BANNERS
  ======================================================= */

  const banners =
    getCategoryBanners(
      currentCategory,
      "/women",
      slugParts,
    );

  /* =======================================================
     DESCRIPTION
  ======================================================= */

  const description =
    currentCategory.description ||
    (
      currentCategory.id ===
      womenRoot.id
        ? "Explore HivraSoft women's collection designed around comfort and confidence."
        : `Shop HivraSoft ${currentCategory.name}.`
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <Header />

      <WomenCatalog
        products={
          products
        }
        banners={
          banners
        }
        title={
          currentCategory.name
        }
        description={
          description
        }
        categoryRoot={
          womenRoot
        }
        categoryPath={
          slugParts
        }
        fixedPriceOffer={
          fixedPriceOffer
        }
      />
    </>
  );
}