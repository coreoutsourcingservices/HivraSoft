export type CatalogImage = {
  url: string;
  publicId: string;
  isDefault?: boolean;
};

export type CatalogSize = {
  _id?: string;
  size: string;
  stock: number;
  isActive?: boolean;
};

export type CatalogCategory = {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  level?: number;
};

export type CatalogColor = {
  _id?: string;
  nameProduct: string;
  slugProduct: string;
  nameColor: string;
  slugColor: string;
  hex?: string;
  isDefault?: boolean;
  shortDescription?: string;
  description?: string;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  images?: CatalogImage[];
  sizes?: CatalogSize[];
};

export type CatalogProduct = {
  _id: string;
  ratings?: { average: number; count: number };
  categories?: CatalogCategory[];
  isColor?: boolean;
  colors?: CatalogColor[];
  isActive?: boolean;
  isFeatured?: boolean;
  isNewLaunch?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type DisplayProduct = CatalogProduct & {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  mainImages: CatalogImage[];
  stock: number;
  price?: number;
  compareAtPrice?: number;
};

export function getDefaultColor(product: CatalogProduct): CatalogColor | undefined {
  const colors = Array.isArray(product?.colors) ? product.colors : [];
  return colors.find((color) => color?.isDefault) || colors[0];
}

export function getProductTotalStock(product: CatalogProduct): number {
  return (Array.isArray(product?.colors) ? product.colors : []).reduce(
    (total, color) =>
      total +
      (Array.isArray(color?.sizes) ? color.sizes : []).reduce(
        (sum, size) => sum + (size?.isActive === false ? 0 : Math.max(0, Number(size?.stock || 0))),
        0
      ),
    0
  );
}

export function toDisplayProduct(product: CatalogProduct | any): DisplayProduct {
  const safe: CatalogProduct = product || ({ _id: "" } as CatalogProduct);
  const color = getDefaultColor(safe);
  const images = Array.isArray(color?.images) ? color!.images!.filter((image) => Boolean(image?.url)) : [];

  return {
    ...safe,
    _id: String(safe._id || ""),
    name: color?.nameProduct || "Product",
    slug: color?.slugProduct || "",
    shortDescription: color?.shortDescription || "",
    description: color?.description || "",
    tags: Array.isArray(color?.tags) ? color!.tags! : [],
    seoTitle: color?.seoTitle || color?.nameProduct || "",
    seoDescription: color?.seoDescription || color?.shortDescription || "",
    mainImages: images,
    stock: getProductTotalStock(safe),
  };
}

export function catalogProductsFromResponse(data: any): DisplayProduct[] {
  const list: CatalogProduct[] = Array.isArray(data?.products)
    ? data.products
    : Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data)
        ? data
        : [];
  return list.map(toDisplayProduct).filter((product) => Boolean(product._id));
}
