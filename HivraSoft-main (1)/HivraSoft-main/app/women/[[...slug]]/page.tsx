import {
  notFound,
} from "next/navigation";

import Header from "@/src/components/Header/Header";

import WomenCatalog from "@/src/components/Women/WomenCatalog";

import {
  findCategoryRoot,
  flattenCategorySubtree,
  getActiveCategoryTree,
  resolveCategoryPath,
  type StorefrontCategoryNode,
} from "@/src/services/categories";

import {
  getActiveProducts,
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
   DYNAMIC PAGE
========================================================= */

export const dynamic =
  "force-dynamic";

/* =========================================================
   PROPS
========================================================= */

type WomenPageProps = {
  params: Promise<{
    slug?: string[];
  }>;
};

/* =========================================================
   POSITIVE NUMBER
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
   COLORS
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
      color?.isActive !==
      false
  );
}

/* =========================================================
   SIZES
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
      size?.isActive !==
      false
  );
}

/* =========================================================
   COLOR IMAGES
========================================================= */

function getColorImageUrls(
  color: ApiColor,
  product: ApiProduct
): string[] {
  const colorImages =
    Array.isArray(
      color.images
    )
      ? color.images
      : [];

  const defaultImage =
    colorImages.find(
      (image) =>
        image?.isDefault ===
          true &&
        Boolean(
          image?.url
        )
    );

  const remainingImages =
    colorImages.filter(
      (image) =>
        Boolean(
          image?.url
        ) &&
        image !==
          defaultImage
    );

  const productImages =
    Array.isArray(
      product.mainImages
    )
      ? product.mainImages.filter(
          (image) =>
            Boolean(
              image?.url
            )
        )
      : [];

  const images = [
    ...(defaultImage
      ? [defaultImage]
      : []),

    ...remainingImages,

    ...productImages,
  ];

  const urls =
    images
      .map((image) =>
        String(
          image?.url ||
            ""
        ).trim()
      )
      .filter(Boolean);

  return Array.from(
    new Set(urls)
  );
}

/* =========================================================
   PRICING
========================================================= */

function getColorPrices(
  product: ApiProduct,
  color: ApiColor
) {
  const sizes =
    getActiveSizes(color);

  const firstPricedSize =
    sizes.find(
      (size) =>
        Boolean(
          positiveNumber(
            size.showPrice,
            size.discountedPrice,
            size.salePrice,
            size.sellingPrice,
            size.price
          )
        )
    );

  /* =======================================================
     SHOW PRICE
  ======================================================= */

  const showPrice =
    positiveNumber(
      color.showPrice,

      color.discountedPrice,

      color.salePrice,

      color.sellingPrice,

      color.price,

      firstPricedSize?.showPrice,

      firstPricedSize?.discountedPrice,

      firstPricedSize?.salePrice,

      firstPricedSize?.sellingPrice,

      firstPricedSize?.price,

      product.showPrice,

      product.discountedPrice,

      product.salePrice,

      product.sellingPrice,

      product.price
    ) ?? 0;

  /* =======================================================
     ORIGINAL PRICE
  ======================================================= */

  const rawOriginalPrice =
    positiveNumber(
      color.originalPrice,

      color.compareAtPrice,

      color.actualPrice,

      color.mrp,

      firstPricedSize?.originalPrice,

      firstPricedSize?.compareAtPrice,

      firstPricedSize?.actualPrice,

      firstPricedSize?.mrp,

      product.originalPrice,

      product.compareAtPrice,

      product.actualPrice,

      product.mrp
    ) ??
    showPrice;

  const originalPrice =
    Math.max(
      rawOriginalPrice,
      showPrice
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
  const sizeId =
    getId(size);

  if (!sizeId) {
    return null;
  }

  const colorPrices =
    getColorPrices(
      product,
      color
    );

  const showPrice =
    positiveNumber(
      size.showPrice,

      size.discountedPrice,

      size.salePrice,

      size.sellingPrice,

      size.price,

      colorPrices.showPrice
    ) ?? 0;

  const rawOriginalPrice =
    positiveNumber(
      size.originalPrice,

      size.compareAtPrice,

      size.actualPrice,

      size.mrp,

      colorPrices.originalPrice
    ) ??
    showPrice;

  return {
    id:
      sizeId,

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
          size.stock ||
            0
        )
      ),

    showPrice,

    originalPrice:
      Math.max(
        rawOriginalPrice,
        showPrice
      ),
  };
}

/* =========================================================
   COLOR -> CARD
========================================================= */

function mapColorToCatalogProduct(
  product: ApiProduct,
  color: ApiColor
): CatalogProduct | null {
  const productId =
    getProductId(
      product
    );

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
    getColorImageUrls(
      color,
      product
    );

  const prices =
    getColorPrices(
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
      images[0] ||
      "",

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
        product.isFeatured
      ),

    isNewLaunch:
      Boolean(
        product.isNewLaunch
      ),
  };
}

/* =========================================================
   PRODUCT -> ALL COLORS
========================================================= */

function mapProductToAllColorCards(
  product: ApiProduct
): CatalogProduct[] {
  return getActiveColors(
    product
  )
    .map((color) =>
      mapColorToCatalogProduct(
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
   PRODUCT CATEGORY IDS
========================================================= */

function getProductCategoryIds(
  product: ApiProduct
): string[] {
  const ids:
    string[] = [];

  const push = (
    value: unknown
  ) => {
    const id =
      String(
        value ||
          ""
      ).trim();

    if (id) {
      ids.push(id);
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
    new Set(ids)
  );
}

/* =========================================================
   CATEGORY FILTER
========================================================= */

function productBelongsToCategory(
  product: ApiProduct,
  category: StorefrontCategoryNode
): boolean {
  const subtree =
    flattenCategorySubtree(
      category
    );

  const allowedIds =
    new Set(
      subtree.map(
        (node) =>
          node.id
      )
    );

  const allowedSlugs =
    new Set(
      subtree.map(
        (node) =>
          node.slug
      )
    );

  const productIds =
    getProductCategoryIds(
      product
    );

  if (
    productIds.some(
      (id) =>
        allowedIds.has(id)
    )
  ) {
    return true;
  }

  const slugs =
    getProductCategorySlugs(
      product
    );

  return slugs.some(
    (slug) =>
      allowedSlugs.has(
        slug
      )
  );
}

/* =========================================================
   CATEGORY BANNER

   IMPORTANT:

   NO PARENT FALLBACK.

   /women
   => Women images only

   /women/bra
   => Bra images only

   /women/bra/maternity-bra
   => Maternity images only

   Agar current category me image nahi:
   => []
   => banner component render nahi hoga.
========================================================= */

function getCategoryBanners(
  currentCategory: StorefrontCategoryNode,
  slugParts: string[]
): CatalogBanner[] {
  const images =
    Array.isArray(
      currentCategory.images
    )
      ? currentCategory.images.filter(
          (image) =>
            Boolean(
              image?.url
            )
        )
      : [];

  /*
   * NO IMAGE = NO BANNER
   */

  if (
    images.length ===
    0
  ) {
    return [];
  }

  const redirect =
    slugParts.length >
    0
      ? `/women/${slugParts.join(
          "/"
        )}`
      : "/women";

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
        `${currentCategory.name} banner ${
          index + 1
        }`,

      redirect,
    })
  );
}

/* =========================================================
   PAGE
========================================================= */

export default async function WomenPage({
  params,
}: WomenPageProps) {
  const resolvedParams =
    await params;

  const slugParts =
    (
      resolvedParams.slug ??
      []
    )
      .map((slug) =>
        String(slug)
          .trim()
          .toLowerCase()
      )
      .filter(Boolean);

  /* =======================================================
     CATEGORY TREE
  ======================================================= */

  const categoryTree =
    await getActiveCategoryTree();

  const womenRoot =
    findCategoryRoot(
      categoryTree,
      "women"
    );

  if (!womenRoot) {
    notFound();
  }

  /* =======================================================
     CATEGORY PATH
  ======================================================= */

  const selectedNodes =
    resolveCategoryPath(
      womenRoot,
      slugParts
    );

  if (!selectedNodes) {
    notFound();
  }

  const currentCategory =
    selectedNodes.at(-1) ||
    womenRoot;

  /* =======================================================
     PRODUCTS
  ======================================================= */

  const allProducts =
    await getActiveProducts();

  const products =
    allProducts
      .filter((product) =>
        productBelongsToCategory(
          product,
          currentCategory
        )
      )
      .flatMap(
        mapProductToAllColorCards
      )
      .filter(
        (product) =>
          Boolean(
            product.productId
          ) &&
          Boolean(
            product.colorId
          ) &&
          Boolean(
            product.slug
          )
      );

  /* =======================================================
     CURRENT CATEGORY BANNER ONLY
  ======================================================= */

  const banners =
    getCategoryBanners(
      currentCategory,
      slugParts
    );

  /* =======================================================
     TEXT
  ======================================================= */

  const title =
    currentCategory.name;

  const description =
    currentCategory.description ||
    (
      currentCategory.id ===
      womenRoot.id
        ? "Explore Hivra Soft women's collection designed around comfort, confidence and effortless everyday wear."
        : `Shop Hivra Soft ${currentCategory.name} from our women's collection.`
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <Header />

      <WomenCatalog
        products={
          products
        }
        banners={
          banners
        }
        title={
          title
        }
        description={
          description
        }
        categoryRoot={
          womenRoot
        }
        categoryPath={
          slugParts
        }
      />
    </>
  );
}