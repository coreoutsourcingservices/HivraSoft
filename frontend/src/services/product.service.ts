/* =========================================================
   API URL
========================================================= */

const RAW_API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(
    /\/+$/,
    ""
  ) || "http://localhost:5000";

const API_URL =
  RAW_API_URL.replace(
    /\/api$/i,
    ""
  );

/* =========================================================
   TYPES
========================================================= */

export type ApiImage = {
  url?: string;
  publicId?: string;
  isDefault?: boolean;
};

export type ApiSize = {
  _id?: string;
  id?: string;

  size?: string;
  name?: string;

  stock?: number;
  isActive?: boolean;
  isDefault?: boolean;

  price?: number;
  sellingPrice?: number;
  discountedPrice?: number;
  salePrice?: number;
  showPrice?: number;
  discountPrice?: number;

  compareAtPrice?: number;
  actualPrice?: number;
  originalPrice?: number;
  mrp?: number;
};

export type ApiColor = {
  _id?: string;
  id?: string;

  nameColor?: string;
  slugColor?: string;

  nameProduct?: string;
  slugProduct?: string;

  shortDescription?: string;
  description?: string;

  isDefault?: boolean;
  isActive?: boolean;

  images?: ApiImage[];
  sizes?: ApiSize[];

  price?: number;
  sellingPrice?: number;
  discountedPrice?: number;
  salePrice?: number;
  showPrice?: number;
  discountPrice?: number;

  compareAtPrice?: number;
  actualPrice?: number;
  originalPrice?: number;
  mrp?: number;
};

export type ApiCategory = {
  _id?: string;
  id?: string;

  name?: string;
  slug?: string;

  level?: number;
};

export type ApiProduct = {
  _id?: string;
  id?: string;

  /* OLD / SIMPLE PRODUCT STRUCTURE */

  name?: string;
  slug?: string;

  shortDescription?: string;
  description?: string;

  price?: number;
  sellingPrice?: number;
  discountedPrice?: number;
  salePrice?: number;
  showPrice?: number;
  discountPrice?: number;

  compareAtPrice?: number;
  actualPrice?: number;
  originalPrice?: number;
  mrp?: number;

  mainImages?: ApiImage[];

  /* CURRENT PRODUCT STRUCTURE */

  colors?: ApiColor[];

  categories?: Array<
    ApiCategory | string
  >;

  category?:
    | ApiCategory
    | string;

  categorySlugs?: string[];

  gender?: string;
  department?: string;
  audience?: string;

  isActive?: boolean;

  isFeatured?: boolean;
  isNewLaunch?: boolean;

  status?: string;

  ratings?: {
    average?: number;
    count?: number;
  };
};

/* =========================================================
   STOREFRONT PRODUCT
========================================================= */

export type StoreProductData = {
  id: string;

  name: string;
  slug: string;

  shortDescription: string;

  image1: string;
  image2: string;

  sellingPrice: number;
  actualPrice: number;

  categorySlugs: string[];

  isActive: boolean;

  isFeatured: boolean;
  isNewLaunch: boolean;
};

/* =========================================================
   API RESPONSE TYPE
========================================================= */

type ProductsApiResponse =
  | ApiProduct[]
  | {
      products?: ApiProduct[];

      data?:
        | ApiProduct[]
        | {
            products?: ApiProduct[];
          };
    };

/* =========================================================
   NORMALIZE SLUG
========================================================= */

export function normalizeSlug(
  value?: string
): string {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/['"]/g, "")
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}

/* =========================================================
   NORMALIZE API RESPONSE
========================================================= */

function normalizeProductsResponse(
  response: ProductsApiResponse
): ApiProduct[] {
  /* RESPONSE = [] */

  if (
    Array.isArray(
      response
    )
  ) {
    return response;
  }

  /* { products: [] } */

  if (
    response &&
    Array.isArray(
      response.products
    )
  ) {
    return response.products;
  }

  /* { data: [] } */

  if (
    response &&
    Array.isArray(
      response.data
    )
  ) {
    return response.data;
  }

  /* { data: { products: [] } } */

  if (
    response &&
    response.data &&
    !Array.isArray(
      response.data
    ) &&
    Array.isArray(
      response.data.products
    )
  ) {
    return response.data.products;
  }

  return [];
}

/* =========================================================
   GET ACTIVE PRODUCTS

   PUBLIC STOREFRONT API
========================================================= */

export async function getActiveProducts(): Promise<
  ApiProduct[]
> {
  try {
    const response =
      await fetch(
        `${API_URL}/api/products/active`,
        {
          method: "GET",

          cache: "no-store",

          headers: {
            Accept:
              "application/json",
          },
        }
      );

    if (!response.ok) {
      console.error(
        "Active products API failed:",
        response.status
      );

      return [];
    }

    const data =
      (await response.json()) as ProductsApiResponse;

    const products =
      normalizeProductsResponse(
        data
      );

    return products;
  } catch (error) {
    console.error(
      "Active products fetch failed:",
      error
    );

    return [];
  }
}

/* =========================================================
   DEFAULT COLOR

   Backend product:
   colors[]
========================================================= */

export function getDefaultColor(
  product: ApiProduct
): ApiColor | null {
  const colors =
    Array.isArray(
      product.colors
    )
      ? product.colors.filter(
          (color) =>
            color?.isActive !== false
        )
      : [];

  if (
    colors.length === 0
  ) {
    return null;
  }

  return (
    colors.find(
      (color) =>
        color?.isDefault ===
        true
    ) ||
    colors[0] ||
    null
  );
}

/* =========================================================
   DEFAULT SIZE
========================================================= */

function getDefaultSize(
  color: ApiColor | null
): ApiSize | null {
  if (!color) {
    return null;
  }

  const sizes =
    Array.isArray(
      color.sizes
    )
      ? color.sizes.filter(
          (size) =>
            size?.isActive !==
            false
        )
      : [];

  if (
    sizes.length === 0
  ) {
    return null;
  }

  return (
    sizes.find(
      (size) =>
        size?.isDefault ===
        true
    ) ||
    sizes[0] ||
    null
  );
}

/* =========================================================
   FIRST VALID NUMBER
========================================================= */

function firstNumber(
  ...values: unknown[]
): number | undefined {
  for (
    const value of values
  ) {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      continue;
    }

    const numericValue =
      Number(value);

    if (
      Number.isFinite(
        numericValue
      ) &&
      numericValue >= 0
    ) {
      return numericValue;
    }
  }

  return undefined;
}

/* =========================================================
   PRODUCT ID
========================================================= */

export function getProductId(
  product: ApiProduct
): string {
  return String(
    product._id ||
      product.id ||
      ""
  );
}

/* =========================================================
   PRODUCT NAME
========================================================= */

export function getProductName(
  product: ApiProduct
): string {
  const defaultColor =
    getDefaultColor(
      product
    );

  return String(
    defaultColor
      ?.nameProduct ||
      product.name ||
      "Unnamed Product"
  );
}

/* =========================================================
   PRODUCT SLUG
========================================================= */

export function getProductSlug(
  product: ApiProduct
): string {
  const defaultColor =
    getDefaultColor(
      product
    );

  return String(
    defaultColor
      ?.slugProduct ||
      product.slug ||
      ""
  );
}

/* =========================================================
   SHORT DESCRIPTION
========================================================= */

export function getProductShortDescription(
  product: ApiProduct
): string {
  const defaultColor =
    getDefaultColor(
      product
    );

  return String(
    defaultColor
      ?.shortDescription ||
      product.shortDescription ||
      ""
  );
}

/* =========================================================
   CATEGORY SLUGS
========================================================= */

export function getProductCategorySlugs(
  product: ApiProduct
): string[] {
  const result: Array<{
    slug: string;
    level: number;
    index: number;
  }> = [];

  const categories =
    Array.isArray(
      product.categories
    )
      ? product.categories
      : [];

  /* =======================================================
     CATEGORIES ARRAY
  ======================================================= */

  categories.forEach(
    (
      category,
      index
    ) => {
      /* CATEGORY STRING */

      if (
        typeof category ===
        "string"
      ) {
        const value =
          category.trim();

        /*
         * MongoDB ObjectId ko
         * category slug nahi maanenge.
         */

        if (
          /^[a-f0-9]{24}$/i.test(
            value
          )
        ) {
          return;
        }

        const slug =
          normalizeSlug(
            value
          );

        if (slug) {
          result.push({
            slug,
            level: 999,
            index,
          });
        }

        return;
      }

      /* CATEGORY OBJECT */

      const slug =
        normalizeSlug(
          category?.slug ||
            category?.name
        );

      if (!slug) {
        return;
      }

      result.push({
        slug,

        level:
          typeof category
            ?.level ===
          "number"
            ? category.level
            : 999,

        index,
      });
    }
  );

  /* =======================================================
     SINGLE CATEGORY FALLBACK
  ======================================================= */

  if (
    product.category
  ) {
    if (
      typeof product.category ===
      "string"
    ) {
      if (
        !/^[a-f0-9]{24}$/i.test(
          product.category
        )
      ) {
        const slug =
          normalizeSlug(
            product.category
          );

        if (slug) {
          result.push({
            slug,
            level: 999,
            index:
              result.length,
          });
        }
      }
    } else {
      const slug =
        normalizeSlug(
          product.category
            ?.slug ||
            product.category
              ?.name
        );

      if (slug) {
        result.push({
          slug,

          level:
            typeof product
              .category
              ?.level ===
            "number"
              ? product
                  .category
                  .level
              : 999,

          index:
            result.length,
        });
      }
    }
  }

  /* =======================================================
     CATEGORY SLUG ARRAY FALLBACK
  ======================================================= */

  if (
    Array.isArray(
      product.categorySlugs
    )
  ) {
    product.categorySlugs.forEach(
      (value) => {
        const slug =
          normalizeSlug(
            value
          );

        if (slug) {
          result.push({
            slug,
            level: 999,
            index:
              result.length,
          });
        }
      }
    );
  }

  /* =======================================================
     GENDER FALLBACK

     Agar backend:
     gender: "Men"
     bhejta hai to "men" add hoga.
  ======================================================= */

  const fallbackGenderValues =
    [
      product.gender,
      product.department,
      product.audience,
    ];

  fallbackGenderValues.forEach(
    (value) => {
      const slug =
        normalizeSlug(
          value
        );

      if (slug) {
        result.push({
          slug,
          level: 0,
          index:
            result.length,
        });
      }
    }
  );

  /* =======================================================
     ORDER
  ======================================================= */

  result.sort(
    (
      first,
      second
    ) => {
      if (
        first.level !==
        second.level
      ) {
        return (
          first.level -
          second.level
        );
      }

      return (
        first.index -
        second.index
      );
    }
  );

  /* REMOVE DUPLICATES */

  return Array.from(
    new Set(
      result.map(
        (item) =>
          item.slug
      )
    )
  );
}

/* =========================================================
   PRODUCT IMAGES
========================================================= */

export function getProductImageUrls(
  product: ApiProduct
): string[] {
  const defaultColor =
    getDefaultColor(
      product
    );

  /* =======================================================
     DEFAULT COLOR IMAGES
  ======================================================= */

  const defaultColorImages =
    Array.isArray(
      defaultColor?.images
    )
      ? defaultColor.images
      : [];

  const defaultImage =
    defaultColorImages.find(
      (image) =>
        image?.isDefault ===
          true &&
        Boolean(
          image?.url
        )
    );

  const remainingDefaultImages =
    defaultColorImages.filter(
      (image) =>
        Boolean(
          image?.url
        ) &&
        image !==
          defaultImage
    );

  /* =======================================================
     OLD mainImages FALLBACK
  ======================================================= */

  const mainImages =
    Array.isArray(
      product.mainImages
    )
      ? product.mainImages
      : [];

  /* =======================================================
     ALL COLOR IMAGES FALLBACK
  ======================================================= */

  const allColorImages =
    Array.isArray(
      product.colors
    )
      ? product.colors.flatMap(
          (color) =>
            Array.isArray(
              color.images
            )
              ? color.images
              : []
        )
      : [];

  const images = [
    ...(defaultImage
      ? [defaultImage]
      : []),

    ...remainingDefaultImages,

    ...mainImages,

    ...allColorImages,
  ];

  const urls =
    images
      .map(
        (image) =>
          String(
            image?.url ||
              ""
          ).trim()
      )
      .filter(Boolean);

  return Array.from(
    new Set(
      urls
    )
  );
}

/* =========================================================
   PRICE
========================================================= */

export function getProductPrices(
  product: ApiProduct
): {
  sellingPrice: number;
  actualPrice: number;
} {
  const defaultColor =
    getDefaultColor(
      product
    );

  const defaultSize =
    getDefaultSize(
      defaultColor
    );

  /*
   * Current backend pricing model:
   * originalPrice = MRP
   * showPrice     = storefront selling price
   * discountPrice = originalPrice - showPrice
   *
   * Size pricing has priority over color pricing because a
   * particular size may override the parent color price.
   */
  const sellingPrice =
    firstNumber(
      defaultSize?.showPrice,
      defaultSize?.discountedPrice,
      defaultSize?.salePrice,
      defaultSize?.sellingPrice,
      defaultSize?.price,

      defaultColor?.showPrice,
      defaultColor?.discountedPrice,
      defaultColor?.salePrice,
      defaultColor?.sellingPrice,
      defaultColor?.price,

      product.showPrice,
      product.discountedPrice,
      product.salePrice,
      product.sellingPrice,
      product.price
    ) ?? 0;

  const comparePrice =
    firstNumber(
      defaultSize?.originalPrice,
      defaultSize?.compareAtPrice,
      defaultSize?.actualPrice,
      defaultSize?.mrp,

      defaultColor?.originalPrice,
      defaultColor?.compareAtPrice,
      defaultColor?.actualPrice,
      defaultColor?.mrp,

      product.originalPrice,
      product.compareAtPrice,
      product.actualPrice,
      product.mrp
    ) ?? sellingPrice;

  return {
    sellingPrice,
    actualPrice:
      comparePrice > sellingPrice
        ? comparePrice
        : sellingPrice,
  };
}

/* =========================================================
   OFFER CHECK
========================================================= */

export function isProductOnOffer(
  product: ApiProduct
): boolean {
  const prices =
    getProductPrices(
      product
    );

  return (
    prices.actualPrice >
    prices.sellingPrice
  );
}

/* =========================================================
   NORMALIZE PRODUCT FOR STOREFRONT

   ⭐ THIS WAS MISSING

   Men page imports this:
   normalizeStoreProduct
========================================================= */

export function normalizeStoreProduct(
  product: ApiProduct
): StoreProductData {
  const images =
    getProductImageUrls(
      product
    );

  const prices =
    getProductPrices(
      product
    );

  const categorySlugs =
    getProductCategorySlugs(
      product
    );

  return {
    /* ID */

    id:
      getProductId(
        product
      ),

    /* NAME FROM DEFAULT COLOR */

    name:
      getProductName(
        product
      ),

    /* SLUG FROM DEFAULT COLOR */

    slug:
      getProductSlug(
        product
      ),

    /* DESCRIPTION */

    shortDescription:
      getProductShortDescription(
        product
      ),

    /* NORMAL IMAGE */

    image1:
      images[0] ||
      "",

    /* HOVER IMAGE */

    image2:
      images[1] ||
      images[0] ||
      "",

    /* SELLING PRICE */

    sellingPrice:
      prices.sellingPrice,

    /* MRP / ORIGINAL PRICE */

    actualPrice:
      prices.actualPrice,

    /* MEN / WOMEN / CATEGORY */

    categorySlugs,

    /* FLAGS */

    isActive:
      product.isActive !==
      false,

    isFeatured:
      product.isFeatured ===
      true,

    isNewLaunch:
      product.isNewLaunch ===
      true,
  };
}