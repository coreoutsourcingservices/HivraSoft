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
  /*
   * Unique card key.
   *
   * Same product ke multiple colors honge,
   * isliye sirf productId unique nahi hai.
   */
  variantKey: string;

  productId: string;

  colorId: string;
  colorName: string;

  name: string;

  /*
   * IMPORTANT:
   * Har color ka apna slugProduct.
   *
   * Example:
   * beige-maternity-feeding-bra
   * black-maternity-feeding-bra
   */
  slug: string;

  image1: string;
  image2: string;

  /*
   * showPrice = storefront price
   *
   * originalPrice = MRP / strike-through price
   */
  showPrice: number;
  originalPrice: number;

  discountAmount: number;
  discountPercent: number;

  categorySlugs: string[];

  sizes: CatalogSize[];

  isFeatured: boolean;
  isNewLaunch: boolean;
};