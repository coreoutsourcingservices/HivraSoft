import {
  notFound,
} from "next/navigation";

import Header from "@/src/components/Header/Header";

import MenCatalog from "@/src/components/Men/MenCatalog";

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
      .map((slug) =>
        String(slug)
          .trim()
          .toLowerCase()
      )
      .filter(Boolean);

  const tree =
    await getActiveCategoryTree();

  const menRoot =
    findCategoryRoot(
      tree,
      "men"
    );

  if (!menRoot) {
    notFound();
  }

  const selected =
    resolveCategoryPath(
      menRoot,
      slugParts
    );

  if (!selected) {
    notFound();
  }

  const currentCategory =
    selected.at(-1) ||
    menRoot;

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

  const banners =
    getCategoryBanners(
      currentCategory,
      "/men",
      slugParts
    );

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
          currentCategory.description ||
          (
            currentCategory.id ===
            menRoot.id
              ? "Explore HivraSoft men's collection."
              : `Shop HivraSoft ${currentCategory.name}.`
          )
        }
        categoryRoot={
          menRoot
        }
        categoryPath={
          slugParts
        }
      />
    </>
  );
}