export type ProductImage = {
  url: string;
  publicId: string;
  isDefault?: boolean;
};

export type ProductSize = {
  _id?: string;
  size: string;
  stock: number;
  originalPrice: number;
  showPrice: number;
  discountPrice: number;
  isActive?: boolean;
};

export type ProductCategory = {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  level?: number;
};

export type ProductRatings = {
  average: number;
  count: number;
};

export type ProductColor = {
  nameProduct: string;
  slugProduct: string;
  nameColor: string;
  slugColor: string;
  hex?: string;
  isDefault?: boolean;
  originalPrice: number;
  showPrice: number;
  discountPrice: number;
  shortDescription?: string;
  description?: string;
  tags?: string[];
  seoTitle?: string;
  seoDescription?: string;
  images: ProductImage[];
  sizes: ProductSize[];
};

export type Product = {
  _id: string;
  ratings?: ProductRatings;
  categories?: ProductCategory[];
  isColor?: boolean;
  colors?: ProductColor[];
  isActive?: boolean;
  isFeatured?: boolean;
  isNewLaunch?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductCatalogApiResponse = {
  success: boolean;
  count: number;
  products: Product[];
  message?: string;
};
