"use client";

import ResponsiveCatalog from "@/src/components/Storefront/ResponsiveCatalog";

import type {
  StorefrontCategoryNode,
} from "@/src/services/categories";

import type {
  CatalogBanner,
  CatalogProduct,
} from "@/types/catalog";

/* =========================================================
   TYPES
========================================================= */

type Props = {
  products: CatalogProduct[];

  banners: CatalogBanner[];

  title: string;

  description: string;

  categoryRoot: StorefrontCategoryNode;

  categoryPath: string[];
};

/* =========================================================
   ACCESSORIES CATALOG
========================================================= */

export default function AccessoriesCatalog({
  products,
  banners,
  title,
  description,
  categoryRoot,
  categoryPath,
}: Props) {
  return (
    <ResponsiveCatalog
      basePath="/accessories"
      allLabel="All Accessories"
      products={products}
      banners={banners}
      title={title}
      description={description}
      categoryRoot={categoryRoot}
      categoryPath={categoryPath}
    />
  );
}