"use client";

import ResponsiveCatalog from "@/src/components/Storefront/ResponsiveCatalog";

import type {
  StorefrontCategoryNode,
} from "@/src/services/categories";

import type {
  CatalogBanner,
  CatalogProduct,
} from "@/types/catalog";

type Props = {
  products: CatalogProduct[];
  banners: CatalogBanner[];
  title: string;
  description: string;
  categoryRoot: StorefrontCategoryNode;
  categoryPath: string[];
};

export default function WomenCatalog({
  products,
  banners,
  title,
  description,
  categoryRoot,
  categoryPath,
}: Props) {
  return (
    <ResponsiveCatalog
      basePath="/women"
      allLabel="All Women"
      products={products}
      banners={banners}
      title={title}
      description={description}
      categoryRoot={categoryRoot}
      categoryPath={categoryPath}
    />
  );
}