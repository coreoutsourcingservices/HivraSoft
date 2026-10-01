import { Types } from "mongoose";
import Category from "../models/Category.model";
import Product from "../models/Product.model";

/* =========================================================
   GLOBAL STOREFRONT SEARCH

   Searches product color content + categories and returns a
   frontend-friendly result. No login is required.
========================================================= */

type GlobalSearchInput = {
  q?: string;
  category?: string;
  page?: number;
  limit?: number;
};

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeText = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const sizeStock = (sizes: any[]) =>
  (Array.isArray(sizes) ? sizes : []).reduce(
    (total, size) =>
      total +
      (size?.isActive === false
        ? 0
        : Math.max(0, Number(size?.stock || 0))),
    0
  );

const productStock = (colors: any[]) =>
  (Array.isArray(colors) ? colors : []).reduce(
    (total, color) => total + sizeStock(color?.sizes || []),
    0
  );

const getDefaultImage = (images: any[]) => {
  const list = Array.isArray(images) ? images : [];
  return list.find((image) => image?.isDefault) || list[0] || null;
};

const colorMatchesQuery = (color: any, query: string) => {
  if (!query) return false;

  const haystack = [
    color?.nameProduct,
    color?.slugProduct,
    color?.nameColor,
    color?.slugColor,
    color?.shortDescription,
    color?.seoTitle,
    color?.seoDescription,
    ...(Array.isArray(color?.tags) ? color.tags : []),
  ]
    .map(normalizeText)
    .join(" ");

  return haystack.includes(query);
};

const selectBestColor = (product: any, query: string) => {
  const colors = Array.isArray(product?.colors) ? product.colors : [];

  if (query) {
    const exactName = colors.find(
      (color: any) => normalizeText(color?.nameProduct) === query
    );
    if (exactName) return exactName;

    const matched = colors.find((color: any) =>
      colorMatchesQuery(color, query)
    );
    if (matched) return matched;
  }

  return (
    colors.find((color: any) => color?.isDefault === true) ||
    colors[0] ||
    null
  );
};

const toSearchProduct = (product: any, query: string) => {
  const color = selectBestColor(product, query);
  const images = Array.isArray(color?.images) ? color.images : [];
  const image = getDefaultImage(images);

  return {
    _id: String(product?._id || ""),
    name: String(color?.nameProduct || "Product"),
    slug: String(color?.slugProduct || ""),
    isColor: product?.isColor === true,
    colorName: String(color?.nameColor || ""),
    colorSlug: String(color?.slugColor || ""),
    hex: String(color?.hex || ""),
    originalPrice: Number(color?.originalPrice || 0),
    showPrice: Number(color?.showPrice || 0),
    discountPrice: Number(color?.discountPrice || 0),
    stock: sizeStock(color?.sizes || []),
    totalStock: productStock(product?.colors || []),
    shortDescription: String(color?.shortDescription || ""),
    tags: Array.isArray(color?.tags) ? color.tags : [],
    image: image
      ? {
          url: String(image?.url || ""),
          publicId: String(image?.publicId || ""),
          isDefault: image?.isDefault === true,
        }
      : null,
    images: images.map((item: any) => ({
      url: String(item?.url || ""),
      publicId: String(item?.publicId || ""),
      isDefault: item?.isDefault === true,
    })),
    sizes: (Array.isArray(color?.sizes) ? color.sizes : []).map(
      (size: any) => ({
        _id: size?._id ? String(size._id) : undefined,
        size: String(size?.size || ""),
        stock: Number(size?.stock || 0),
        originalPrice: Number(size?.originalPrice || 0),
        showPrice: Number(size?.showPrice || 0),
        discountPrice: Number(size?.discountPrice || 0),
        isActive: size?.isActive !== false,
      })
    ),
    categories: (Array.isArray(product?.categories)
      ? product.categories
      : []
    )
      .filter(Boolean)
      .map((category: any) => ({
        _id: String(category?._id || ""),
        name: String(category?.name || ""),
        slug: String(category?.slug || ""),
        level: Number(category?.level || 0),
      })),
    ratings: {
      average: Number(product?.ratings?.average || 0),
      count: Number(product?.ratings?.count || 0),
    },
    isFeatured: product?.isFeatured === true,
    isNewLaunch: product?.isNewLaunch === true,
  };
};

export const globalSearch = async ({
  q = "",
  category = "",
  page = 1,
  limit = 24,
}: GlobalSearchInput) => {
  const query = normalizeText(q);
  const safePage = Math.max(1, Math.floor(Number(page) || 1));
  const safeLimit = Math.min(
    60,
    Math.max(1, Math.floor(Number(limit) || 24))
  );
  const skip = (safePage - 1) * safeLimit;

  const regex = query
    ? new RegExp(escapeRegex(query), "i")
    : null;

  /* All active categories are returned for the frontend filter. */
  const allCategories = await Category.find({ isActive: true })
    .select("_id name slug level parent ancestors sortOrder")
    .sort({ level: 1, sortOrder: 1, name: 1 })
    .lean();

  /* Categories matching the typed text. */
  const directCategoryMatches = regex
    ? allCategories.filter((item: any) =>
        regex.test(
          `${String(item?.name || "")} ${String(
            item?.slug || ""
          )}`
        )
      )
    : [];

  const directMatchIds = directCategoryMatches.map(
    (item: any) => item._id
  );

  /* If "Women" matches, include products assigned to its child categories. */
  const searchCategoryIds = new Set<string>(
    directMatchIds.map((id: any) => String(id))
  );

  if (directMatchIds.length) {
    for (const categoryItem of allCategories as any[]) {
      const ancestors = Array.isArray(categoryItem?.ancestors)
        ? categoryItem.ancestors.map((id: any) => String(id))
        : [];

      if (
        ancestors.some((id: string) => searchCategoryIds.has(id))
      ) {
        searchCategoryIds.add(String(categoryItem._id));
      }
    }
  }

  /* Explicit category filter accepts either ObjectId or category slug. */
  let selectedCategory: any = null;

  if (category) {
    selectedCategory = Types.ObjectId.isValid(category)
      ? (allCategories as any[]).find(
          (item: any) => String(item._id) === String(category)
        )
      : (allCategories as any[]).find(
          (item: any) =>
            normalizeText(item?.slug) === normalizeText(category)
        );
  }

  const selectedCategoryIds = new Set<string>();

  if (selectedCategory) {
    selectedCategoryIds.add(String(selectedCategory._id));

    for (const categoryItem of allCategories as any[]) {
      const ancestors = Array.isArray(categoryItem?.ancestors)
        ? categoryItem.ancestors.map((id: any) => String(id))
        : [];

      if (ancestors.includes(String(selectedCategory._id))) {
        selectedCategoryIds.add(String(categoryItem._id));
      }
    }
  }

  const andFilters: any[] = [];

  if (regex) {
    const orFilters: any[] = [
      { "colors.nameProduct": regex },
      { "colors.slugProduct": regex },
      { "colors.nameColor": regex },
      { "colors.slugColor": regex },
      { "colors.tags": regex },
      { "colors.shortDescription": regex },
      { "colors.seoTitle": regex },
      { "colors.seoDescription": regex },
    ];

    if (searchCategoryIds.size) {
      orFilters.push({
        categories: {
          $in: Array.from(searchCategoryIds).map(
            (id) => new Types.ObjectId(id)
          ),
        },
      });
    }

    andFilters.push({ $or: orFilters });
  }

  if (selectedCategoryIds.size) {
    andFilters.push({
      categories: {
        $in: Array.from(selectedCategoryIds).map(
          (id) => new Types.ObjectId(id)
        ),
      },
    });
  }

  const productFilter: any = {
    isActive: true,
    ...(andFilters.length ? { $and: andFilters } : {}),
  };

  const [products, total] = await Promise.all([
    Product.find(productFilter)
      .populate("categories", "_id name slug level")
      .sort({ isFeatured: -1, createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Product.countDocuments(productFilter),
  ]);

  const productResults = products.map((product: any) =>
    toSearchProduct(product, query)
  );

  return {
    query: q.trim(),
    selectedCategory: selectedCategory
      ? {
          _id: String(selectedCategory._id),
          name: String(selectedCategory.name || ""),
          slug: String(selectedCategory.slug || ""),
          level: Number(selectedCategory.level || 0),
        }
      : null,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
      hasNextPage: skip + productResults.length < total,
      hasPreviousPage: safePage > 1,
    },
    count: productResults.length,
    products: productResults,
    categoryMatches: directCategoryMatches.slice(0, 12).map((item: any) => ({
      _id: String(item._id),
      name: String(item.name || ""),
      slug: String(item.slug || ""),
      level: Number(item.level || 0),
    })),
    filters: {
      categories: (allCategories as any[]).map((item: any) => ({
        _id: String(item._id),
        name: String(item.name || ""),
        slug: String(item.slug || ""),
        level: Number(item.level || 0),
        parent: item.parent ? String(item.parent) : null,
      })),
    },
  };
};
