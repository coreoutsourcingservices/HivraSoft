export type CatalogBanner = {
  image: string;
  alt: string;
  redirect: string;
};

export type CatalogSize = {
  id: string;
  label: string;
  stock: number;

  showPrice: number;
  originalPrice: number;
};

export type CatalogProduct = {
  variantKey: string;

  productId: string;
  colorId: string;

  name: string;
  slug: string;

  colorName: string;

  image1: string;
  image2: string;

  showPrice: number;
  originalPrice: number;

  discountAmount: number;
  discountPercent: number;

  categorySlugs: string[];

  sizes: CatalogSize[];

  isFeatured: boolean;
  isNewLaunch: boolean;
};