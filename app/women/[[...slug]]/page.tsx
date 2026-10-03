import {
  notFound,
} from "next/navigation";

import Header from "@/src/components/Header/Header";

import WomenCatalog from "@/src/components/Women/WomenCatalog";

import {
  findCategoryRoot,
  getActiveCategoryTree,
  resolveCategoryPath,
} from "@/src/services/categories";

import {
  getActiveProducts,
} from "@/src/services/products";

import {
  getCategoryBanners,
  mapProductToColorCards,
  productBelongsToCategory,
} from "@/src/services/storefront-catalog";

export const dynamic =
  "force-dynamic";

type Props = {
  params: Promise<{
    slug?: string[];
  }>;
};

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
      .map((slug) =>
        String(slug)
          .trim()
          .toLowerCase()
      )
      .filter(Boolean);

  /* =======================================================
     CATEGORY TREE
  ======================================================= */

  const tree =
    await getActiveCategoryTree();

  const womenRoot =
    findCategoryRoot(
      tree,
      "women"
    );

  if (!womenRoot) {
    notFound();
  }

  /* =======================================================
     CURRENT CATEGORY
  ======================================================= */

  const selected =
    resolveCategoryPath(
      womenRoot,
      slugParts
    );

  if (!selected) {
    notFound();
  }

  const currentCategory =
    selected.at(-1) ||
    womenRoot;

  /* =======================================================
     PRODUCTS
  ======================================================= */

  const apiProducts =
    await getActiveProducts();

  const products =
    apiProducts
      .filter((product) =>
        productBelongsToCategory(
          product,
          currentCategory
        )
      )
      .flatMap(
        mapProductToColorCards
      );

  /* =======================================================
     BANNER

     ONLY CURRENT CATEGORY.
     NO WOMEN ROOT FALLBACK.
  ======================================================= */

  const banners =
    getCategoryBanners(
      currentCategory,
      "/women",
      slugParts
    );

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
          currentCategory.description ||
          (
            currentCategory.id ===
            womenRoot.id
              ? "Explore HivraSoft women's collection designed around comfort and confidence."
              : `Shop HivraSoft ${currentCategory.name}.`
          )
        }
        categoryRoot={
          womenRoot
        }
        categoryPath={
          slugParts
        }
      />
    </>
  );
}