import {
  API_URL,
} from "@/lib/api";

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
} from "@/types/catalog";

/* =========================================================
   SAFE FIELD
========================================================= */

function field(
  source: unknown,
  key: string
): unknown {
  if (
    !source ||
    typeof source !==
      "object"
  ) {
    return undefined;
  }

  return (
    source as Record<
      string,
      unknown
    >
  )[key];
}

/* =========================================================
   POSITIVE NUMBER
========================================================= */

function positiveNumber(
  ...values: unknown[]
): number | undefined {
  for (const value of values) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      continue;
    }

    const number =
      Number(value);

    if (
      Number.isFinite(
        number
      ) &&
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
  source: unknown
): string {
  return String(
    field(
      source,
      "_id"
    ) ||
      field(
        source,
        "id"
      ) ||
      ""
  ).trim();
}

/* =========================================================
   ACTIVE COLORS
========================================================= */

function getActiveColors(
  product: ApiProduct
): ApiColor[] {
  const colors =
    field(
      product,
      "colors"
    );

  if (
    !Array.isArray(colors)
  ) {
    return [];
  }

  return (
    colors as ApiColor[]
  ).filter(
    (color) =>
      field(
        color,
        "isActive"
      ) !== false
  );
}

/* =========================================================
   ACTIVE SIZES
========================================================= */

function getActiveSizes(
  color: ApiColor
): ApiSize[] {
  const sizes =
    field(
      color,
      "sizes"
    );

  if (
    !Array.isArray(sizes)
  ) {
    return [];
  }

  return (
    sizes as ApiSize[]
  ).filter(
    (size) =>
      field(
        size,
        "isActive"
      ) !== false
  );
}

/* =========================================================
   IMAGES
========================================================= */

function getImages(
  product: ApiProduct,
  color: ApiColor
): string[] {
  const colorImages =
    Array.isArray(
      field(
        color,
        "images"
      )
    )
      ? (
          field(
            color,
            "images"
          ) as Array<
            Record<
              string,
              unknown
            >
          >
        )
      : [];

  const defaultImage =
    colorImages.find(
      (image) =>
        image.isDefault ===
          true &&
        Boolean(
          image.url
        )
    );

  const rest =
    colorImages.filter(
      (image) =>
        image !==
          defaultImage &&
        Boolean(
          image.url
        )
    );

  const mainImagesRaw =
    field(
      product,
      "mainImages"
    );

  const mainImages =
    Array.isArray(
      mainImagesRaw
    )
      ? (
          mainImagesRaw as Array<
            Record<
              string,
              unknown
            >
          >
        ).filter(
          (image) =>
            Boolean(
              image.url
            )
        )
      : [];

  const all = [
    ...(defaultImage
      ? [defaultImage]
      : []),

    ...rest,

    ...mainImages,
  ];

  return Array.from(
    new Set(
      all
        .map((image) =>
          String(
            image.url ||
              ""
          ).trim()
        )
        .filter(Boolean)
    )
  );
}

/* =========================================================
   PRICE
========================================================= */

function getPrices(
  product: ApiProduct,
  color: ApiColor
) {
  const sizes =
    getActiveSizes(
      color
    );

  const pricedSize =
    sizes.find(
      (size) =>
        Boolean(
          positiveNumber(
            field(
              size,
              "showPrice"
            ),

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
      field(
        color,
        "showPrice"
      ),

      field(
        color,
        "sellingPrice"
      ),

      field(
        color,
        "salePrice"
      ),

      field(
        color,
        "price"
      ),

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

  const originalPrice =
    Math.max(
      showPrice,

      positiveNumber(
        field(
          color,
          "originalPrice"
        ),

        field(
          color,
          "compareAtPrice"
        ),

        field(
          color,
          "mrp"
        ),

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
      ) ?? showPrice
    );

  const discountAmount =
    originalPrice >
    showPrice
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
   SIZE MAP
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

  const colorPrices =
    getPrices(
      product,
      color
    );

  const showPrice =
    positiveNumber(
      field(
        size,
        "showPrice"
      ),

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
      ),

      colorPrices.showPrice
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

        field(
          size,
          "mrp"
        ),

        colorPrices.originalPrice
      ) ?? showPrice
    );

  return {
    id,

    label:
      String(
        field(
          size,
          "size"
        ) ||
          field(
            size,
            "name"
          ) ||
          "Size"
      ),

    stock:
      Math.max(
        0,
        Number(
          field(
            size,
            "stock"
          ) ||
            0
        )
      ),

    showPrice,

    originalPrice,
  };
}

/* =========================================================
   COLOR -> PRODUCT CARD
========================================================= */

function mapColor(
  product: ApiProduct,
  color: ApiColor
): CatalogProduct | null {
  const productId =
    getId(product);

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
      field(
        color,
        "slugProduct"
      ) ||
        field(
          product,
          "slug"
        ) ||
        ""
    )
      .trim()
      .toLowerCase();

  if (!slug) {
    return null;
  }

  const images =
    getImages(
      product,
      color
    );

  const prices =
    getPrices(
      product,
      color
    );

  const sizes =
    getActiveSizes(
      color
    )
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

    name:
      String(
        field(
          color,
          "nameProduct"
        ) ||
          field(
            product,
            "name"
          ) ||
          "Product"
      ).trim(),

    slug,

    colorName:
      String(
        field(
          color,
          "nameColor"
        ) ||
          ""
      ).trim(),

    image1:
      images[0] || "",

    image2:
      images[1] ||
      images[0] ||
      "",

    showPrice:
      prices.showPrice,

    originalPrice:
      prices.originalPrice,

    discountAmount:
      prices.discountAmount,

    discountPercent:
      prices.discountPercent,

    categorySlugs:
      getProductCategorySlugs(
        product
      ),

    sizes,

    isFeatured:
      Boolean(
        field(
          product,
          "isFeatured"
        )
      ),

    isNewLaunch:
      Boolean(
        field(
          product,
          "isNewLaunch"
        )
      ),
  };
}

/* =========================================================
   PUBLIC PRODUCT MAPPER
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
        item
      ): item is CatalogProduct =>
        Boolean(item)
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

  const categories =
    field(
      product,
      "categories"
    );

  if (
    Array.isArray(
      categories
    )
  ) {
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
            result.push(
              category
            );
          }

          return;
        }

        const id =
          getId(
            category
          );

        if (id) {
          result.push(id);
        }
      }
    );
  }

  const category =
    field(
      product,
      "category"
    );

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
        result.push(
          category
        );
      }
    } else {
      const id =
        getId(
          category
        );

      if (id) {
        result.push(id);
      }
    }
  }

  return Array.from(
    new Set(result)
  );
}

/* =========================================================
   PRODUCT BELONGS TO CATEGORY
========================================================= */

export function productBelongsToCategory(
  product: ApiProduct,
  category: StorefrontCategoryNode
): boolean {
  const subtree =
    flattenCategorySubtree(
      category
    );

  const categoryIds =
    new Set(
      subtree.map(
        (node) =>
          node.id
      )
    );

  const categorySlugs =
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
        categoryIds.has(id)
    )
  ) {
    return true;
  }

  return getProductCategorySlugs(
    product
  ).some(
    (slug) =>
      categorySlugs.has(
        slug
      )
  );
}

/* =========================================================
   CURRENT CATEGORY BANNERS

   NO PARENT FALLBACK.
========================================================= */

export function getCategoryBanners(
  category: StorefrontCategoryNode,
  basePath: string,
  slugParts: string[]
): CatalogBanner[] {
  const images =
    Array.isArray(
      category.images
    )
      ? category.images.filter(
          (image) =>
            Boolean(
              image?.url
            )
        )
      : [];

  if (
    images.length ===
    0
  ) {
    return [];
  }

  const redirect =
    slugParts.length ===
    0
      ? basePath
      : `${basePath}/${slugParts.join(
          "/"
        )}`;

  return images.map(
    (
      image,
      index
    ) => ({
      image:
        String(
          image.url
        ),

      alt:
        image.alt ||
        `${category.name} banner ${
          index + 1
        }`,

      redirect,
    })
  );
}

/* =========================================================
   FIND CATEGORY ANYWHERE
========================================================= */

export function findCategoryAnywhere(
  nodes: StorefrontCategoryNode[],
  slugs: string[]
):
  | StorefrontCategoryNode
  | undefined {
  const accepted =
    new Set(
      slugs.map(
        (slug) =>
          slug.toLowerCase()
      )
    );

  for (
    const node of nodes
  ) {
    if (
      accepted.has(
        node.slug.toLowerCase()
      )
    ) {
      return node;
    }

    const nested =
      findCategoryAnywhere(
        node.children,
        slugs
      );

    if (nested) {
      return nested;
    }
  }

  return undefined;
}

/* =========================================================
   NEW LAUNCH PRODUCTS API
========================================================= */

function normalizeProductsResponse(
  payload: unknown
): ApiProduct[] {
  if (
    Array.isArray(
      payload
    )
  ) {
    return payload as ApiProduct[];
  }

  if (
    !payload ||
    typeof payload !==
      "object"
  ) {
    return [];
  }

  const object =
    payload as Record<
      string,
      unknown
    >;

  if (
    Array.isArray(
      object.products
    )
  ) {
    return object
      .products as ApiProduct[];
  }

  if (
    Array.isArray(
      object.data
    )
  ) {
    return object
      .data as ApiProduct[];
  }

  if (
    object.data &&
    typeof object.data ===
      "object"
  ) {
    const data =
      object.data as Record<
        string,
        unknown
      >;

    if (
      Array.isArray(
        data.products
      )
    ) {
      return data
        .products as ApiProduct[];
    }
  }

  return [];
}

export async function getNewLaunchProducts(): Promise<ApiProduct[]> {
  const response =
    await fetch(
      `${API_URL}/api/products/new-launches`,
      {
        method: "GET",

        cache:
          "no-store",

        headers: {
          Accept:
            "application/json",
        },
      }
    );

  if (!response.ok) {
    throw new Error(
      `Unable to load new launch products (${response.status})`
    );
  }

  const payload =
    await response.json();

  return normalizeProductsResponse(
    payload
  );
}