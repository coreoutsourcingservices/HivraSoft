"use client";

import type { ReactNode } from "react";

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
  children?: ReactNode;
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
  children,
  products,
  banners,
  title,
  description,
  categoryRoot,
  categoryPath,
}: Props) {
  return (
    <ResponsiveCatalog
          children={children}
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