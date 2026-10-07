import {
  notFound,
} from "next/navigation";

import Header from "@/src/components/Header/Header";

import MenCatalog from "@/src/components/Men/MenCatalog";

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
   MEN PAGE
========================================================= */

export default async function MenPage({
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
     MEN ROOT
  ======================================================= */

  const menRoot =
    findCategoryRoot(
      tree,
      "men",
    );

  if (
    !menRoot
  ) {
    notFound();
  }

  /* =======================================================
     CURRENT CATEGORY
  ======================================================= */

  const selected =
    resolveCategoryPath(
      menRoot,
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
    menRoot;

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
      "/men",
      slugParts,
    );

  /* =======================================================
     DESCRIPTION
  ======================================================= */

  const description =
    currentCategory.description ||
    (
      currentCategory.id ===
      menRoot.id
        ? "Explore HivraSoft men's collection."
        : `Shop HivraSoft ${currentCategory.name}.`
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <Header />

      <MenCatalog
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
          menRoot
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