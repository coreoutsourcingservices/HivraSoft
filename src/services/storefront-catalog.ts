import {
  flattenCategorySubtree,
  type StorefrontCategoryNode,
} from "@/src/services/categories";

import {
  getProductCategorySlugs,
  type ApiColor,
  type ApiProduct,
  type ApiSize,
} from "@/src/services/products";

import type {
  CatalogBanner,
  CatalogProduct,
  CatalogSize,
} from "@/src/types/catalog";

/* =========================================================
   GENERIC FIELD READER

   Current backend has:
   showPrice
   originalPrice
   discountPrice

   Older TS types may not yet contain every field.
========================================================= */

function field(
  source: unknown,
  key: string
): unknown {
  if (
    !source ||
    typeof source !== "object"
  ) {
    return undefined;
  }

  return (
    source as Record<string, unknown>
  )[key];
}

/* =========================================================
   POSITIVE NUMBER

   Price 0 ko storefront valid price nahi maanenge.
========================================================= */

function positiveNumber(
  ...values: unknown[]
): number | undefined {
  for (const value of values) {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      continue;
    }

    const number =
      Number(value);

    if (
      Number.isFinite(number) &&
      number > 0
    ) {
      return number;
    }
  }

  return undefined;
}

/* =========================================================
   ID
========================================================= */

function getId(
  value:
    | {
        _id?: string;
        id?: string;
      }
    | null
    | undefined
): string {
  return String(
    value?._id ||
      value?.id ||
      ""
  ).trim();
}

function getProductId(
  product: ApiProduct
): string {
  return String(
    product._id ||
      product.id ||
      ""
  ).trim();
}

/* =========================================================
   ACTIVE COLORS
========================================================= */

function getActiveColors(
  product: ApiProduct
): ApiColor[] {
  if (
    !Array.isArray(
      product.colors
    )
  ) {
    return [];
  }

  return product.colors.filter(
    (color) =>
      color?.isActive !== false
  );
}

/* =========================================================
   ACTIVE SIZES
========================================================= */

function getActiveSizes(
  color: ApiColor
): ApiSize[] {
  if (
    !Array.isArray(
      color.sizes
    )
  ) {
    return [];
  }

  return color.sizes.filter(
    (size) =>
      size?.isActive !== false
  );
}

/* =========================================================
   COLOR IMAGES
========================================================= */

function getColorImages(
  color: ApiColor,
  product: ApiProduct
): string[] {
  const colorImages =
    Array.isArray(color.images)
      ? color.images
      : [];

  const defaultImage =
    colorImages.find(
      (image) =>
        image?.isDefault === true &&
        Boolean(image?.url)
    );

  const remaining =
    colorImages.filter(
      (image) =>
        Boolean(image?.url) &&
        image !== defaultImage
    );

  const mainImages =
    Array.isArray(
      product.mainImages
    )
      ? product.mainImages.filter(
          (image) =>
            Boolean(image?.url)
        )
      : [];

  const urls = [
    ...(defaultImage
      ? [defaultImage]
      : []),

    ...remaining,

    ...mainImages,
  ]
    .map((image) =>
      String(
        image?.url || ""
      ).trim()
    )
    .filter(Boolean);

  return Array.from(
    new Set(urls)
  );
}

/* =========================================================
   PRICE

   originalPrice = MRP
   showPrice     = selling price
   discountPrice = saving amount
========================================================= */

function getPrices(
  product: ApiProduct,
  color: ApiColor
) {
  const sizes =
    getActiveSizes(color);

  const pricedSize =
    sizes.find((size) =>
      Boolean(
        positiveNumber(
          field(size, "showPrice"),

          field(
            size,
            "sellingPrice"
          ),

          field(
            size,
            "salePrice"
          ),

          field(
            size,
            "price"
          )
        )
      )
    );

  const showPrice =
    positiveNumber(
      field(color, "showPrice"),

      field(
        color,
        "sellingPrice"
      ),

      field(
        color,
        "salePrice"
      ),

      field(color, "price"),

      field(
        pricedSize,
        "showPrice"
      ),

      field(
        pricedSize,
        "sellingPrice"
      ),

      field(
        pricedSize,
        "salePrice"
      ),

      field(
        pricedSize,
        "price"
      ),

      field(
        product,
        "showPrice"
      ),

      field(
        product,
        "sellingPrice"
      ),

      field(
        product,
        "salePrice"
      ),

      field(
        product,
        "price"
      )
    ) ?? 0;

  const rawOriginal =
    positiveNumber(
      field(
        color,
        "originalPrice"
      ),

      field(
        color,
        "compareAtPrice"
      ),

      field(color, "mrp"),

      field(
        pricedSize,
        "originalPrice"
      ),

      field(
        pricedSize,
        "compareAtPrice"
      ),

      field(
        pricedSize,
        "mrp"
      ),

      field(
        product,
        "originalPrice"
      ),

      field(
        product,
        "compareAtPrice"
      ),

      field(
        product,
        "mrp"
      )
    ) ?? showPrice;

  const originalPrice =
    Math.max(
      showPrice,
      rawOriginal
    );

  const discountAmount =
    originalPrice > showPrice
      ? originalPrice -
        showPrice
      : 0;

  const discountPercent =
    originalPrice > 0 &&
    discountAmount > 0
      ? Math.round(
          (discountAmount /
            originalPrice) *
            100
        )
      : 0;

  return {
    showPrice,
    originalPrice,
    discountAmount,
    discountPercent,
  };
}

/* =========================================================
   SIZE MAPPING
========================================================= */

function mapSize(
  product: ApiProduct,
  color: ApiColor,
  size: ApiSize
): CatalogSize | null {
  const id =
    getId(size);

  if (!id) {
    return null;
  }

  const colorPrice =
    getPrices(
      product,
      color
    );

  const showPrice =
    positiveNumber(
      field(size, "showPrice"),

      field(
        size,
        "sellingPrice"
      ),

      field(
        size,
        "salePrice"
      ),

      field(size, "price"),

      colorPrice.showPrice
    ) ?? 0;

  const originalPrice =
    Math.max(
      showPrice,

      positiveNumber(
        field(
          size,
          "originalPrice"
        ),

        field(
          size,
          "compareAtPrice"
        ),

        field(size, "mrp"),

        colorPrice.originalPrice
      ) ?? showPrice
    );

  return {
    id,

    label:
      String(
        size.size ||
          size.name ||
          "Size"
      ),

    stock:
      Math.max(
        0,
        Number(
          size.stock || 0
        )
      ),

    showPrice,

    originalPrice,
  };
}

/* =========================================================
   ONE COLOR = ONE PRODUCT CARD
========================================================= */

function mapColor(
  product: ApiProduct,
  color: ApiColor
): CatalogProduct | null {
  const productId =
    getProductId(product);

  const colorId =
    getId(color);

  if (
    !productId ||
    !colorId
  ) {
    return null;
  }

  const slug =
    String(
      color.slugProduct ||
        product.slug ||
        ""
    )
      .trim()
      .toLowerCase();

  if (!slug) {
    return null;
  }

  const images =
    getColorImages(
      color,
      product
    );

  const price =
    getPrices(
      product,
      color
    );

  const sizes =
    getActiveSizes(color)
      .map((size) =>
        mapSize(
          product,
          color,
          size
        )
      )
      .filter(
        (
          size
        ): size is CatalogSize =>
          Boolean(size)
      );

  return {
    variantKey:
      `${productId}:${colorId}`,

    productId,

    colorId,

    colorName:
      String(
        color.nameColor ||
          ""
      ).trim(),

    name:
      String(
        color.nameProduct ||
          product.name ||
          "Product"
      ).trim(),

    slug,

    image1:
      images[0] || "",

    image2:
      images[1] ||
      images[0] ||
      "",

    showPrice:
      price.showPrice,

    originalPrice:
      price.originalPrice,

    discountAmount:
      price.discountAmount,

    discountPercent:
      price.discountPercent,

    categorySlugs:
      getProductCategorySlugs(
        product
      ),

    sizes,

    isFeatured:
      Boolean(
        product.isFeatured
      ),

    isNewLaunch:
      Boolean(
        product.isNewLaunch
      ),
  };
}

/* =========================================================
   PUBLIC MAPPER
========================================================= */

export function mapProductToColorCards(
  product: ApiProduct
): CatalogProduct[] {
  return getActiveColors(
    product
  )
    .map((color) =>
      mapColor(
        product,
        color
      )
    )
    .filter(
      (
        card
      ): card is CatalogProduct =>
        Boolean(card)
    );
}

/* =========================================================
   CATEGORY IDS
========================================================= */

function getProductCategoryIds(
  product: ApiProduct
): string[] {
  const result:
    string[] = [];

  const push = (
    value: unknown
  ) => {
    const id =
      String(
        value || ""
      ).trim();

    if (id) {
      result.push(id);
    }
  };

  const categories =
    Array.isArray(
      product.categories
    )
      ? product.categories
      : [];

  categories.forEach(
    (category) => {
      if (
        typeof category ===
        "string"
      ) {
        if (
          /^[a-f0-9]{24}$/i.test(
            category
          )
        ) {
          push(category);
        }

        return;
      }

      push(
        category?._id ||
          category?.id
      );
    }
  );

  const category =
    product.category;

  if (category) {
    if (
      typeof category ===
      "string"
    ) {
      if (
        /^[a-f0-9]{24}$/i.test(
          category
        )
      ) {
        push(category);
      }
    } else {
      push(
        category._id ||
          category.id
      );
    }
  }

  return Array.from(
    new Set(result)
  );
}

/* =========================================================
   BELONGS TO CATEGORY/SUBTREE
========================================================= */

export function productBelongsToCategory(
  product: ApiProduct,
  category: StorefrontCategoryNode
): boolean {
  const subtree =
    flattenCategorySubtree(
      category
    );

  const ids =
    new Set(
      subtree.map(
        (node) =>
          node.id
      )
    );

  const slugs =
    new Set(
      subtree.map(
        (node) =>
          node.slug
      )
    );

  if (
    getProductCategoryIds(
      product
    ).some(
      (id) =>
        ids.has(id)
    )
  ) {
    return true;
  }

  return getProductCategorySlugs(
    product
  ).some(
    (slug) =>
      slugs.has(slug)
  );
}

/* =========================================================
   NEW LAUNCH CHECK
========================================================= */

export function isNewLaunchProduct(
  product: ApiProduct,
  newLaunchCategory?:
    StorefrontCategoryNode
): boolean {
  if (
    product.isNewLaunch === true
  ) {
    return true;
  }

  if (
    newLaunchCategory &&
    productBelongsToCategory(
      product,
      newLaunchCategory
    )
  ) {
    return true;
  }

  return getProductCategorySlugs(
    product
  ).some(
    (slug) =>
      slug ===
        "new-launch" ||
      slug ===
        "new-launches"
  );
}

/* =========================================================
   CATEGORY BANNERS

   NO PARENT FALLBACK.
========================================================= */

export function getCategoryBanners(
  category: StorefrontCategoryNode,
  basePath: string,
  slugs: string[]
): CatalogBanner[] {
  if (
    !Array.isArray(
      category.images
    ) ||
    category.images.length ===
      0
  ) {
    return [];
  }

  const href =
    slugs.length > 0
      ? `${basePath}/${slugs.join(
          "/"
        )}`
      : basePath;

  return category.images.map(
    (
      image,
      index
    ) => ({
      image:
        image.url,

      alt:
        image.alt ||
        `${category.name} banner ${
          index + 1
        }`,

      redirect:
        href,
    })
  );
}

/* =========================================================
   FIND CATEGORY RECURSIVELY
========================================================= */

export function findCategoryAnywhere(
  tree: StorefrontCategoryNode[],
  slugs: string[]
):
  | StorefrontCategoryNode
  | undefined {
  const wanted =
    new Set(
      slugs.map(
        (slug) =>
          slug.toLowerCase()
      )
    );

  const visit = (
    nodes: StorefrontCategoryNode[]
  ):
    | StorefrontCategoryNode
    | undefined => {
    for (
      const node of nodes
    ) {
      if (
        wanted.has(
          node.slug.toLowerCase()
        )
      ) {
        return node;
      }

      const found =
        visit(
          node.children
        );

      if (found) {
        return found;
      }
    }

    return undefined;
  };

  return visit(tree);
}