import {
  notFound,
} from "next/navigation";

import Header from "@/src/components/Header/Header";

import WomenCatalog from "@/src/components/Women/WomenCatalog";

import {
<<<<<<< HEAD
  getWomenBanners,
  getWomenPageDescription,
  getWomenPageTitle,
  isValidWomenPath,
  type WomenProduct,
} from "@/src/data/women";

import {
  getActiveProducts,
  getProductCategorySlugs,
  getProductId,
  getProductImageUrls,
  isProductOnOffer,
  type ApiProduct,
} from "@/src/services/products";

/* =========================================================
   DYNAMIC PAGE
========================================================= */

export const dynamic =
  "force-dynamic";

/* =========================================================
   PROPS
========================================================= */
=======
  findCategoryRoot,
  getActiveCategoryTree,
  resolveCategoryPath,
} from "@/src/services/categories";

import {
  getActiveProducts,
} from "@/src/services/products";
>>>>>>> aman

import {
  getCategoryBanners,
  mapProductToColorCards,
  productBelongsToCategory,
} from "@/src/services/storefront-catalog";

export const dynamic =
  "force-dynamic";

type Props = {
  params: Promise<{
    slug?: string[];
  }>;
};

<<<<<<< HEAD
/* =========================================================
   WOMEN PRODUCT CHECK
========================================================= */

function isWomenProduct(
  product: ApiProduct
): boolean {
  const categorySlugs =
    getProductCategorySlugs(
      product
    );

  return categorySlugs.includes(
    "women"
  );
}

/* =========================================================
   CHECK ROUTE EXISTS
========================================================= */

function womenRouteExists(
  products: ApiProduct[],
  category?: string,
  subcategory?: string
): boolean {
  if (!category) {
    return true;
  }

  if (category === "offers") {
    return true;
  }

  return products.some(
    (product) => {
      const slugs =
        getProductCategorySlugs(
          product
        );

      if (
        !slugs.includes("women")
      ) {
        return false;
      }

      if (
        !slugs.includes(category)
      ) {
        return false;
      }

      if (
        subcategory &&
        !slugs.includes(
          subcategory
        )
      ) {
        return false;
      }

      return true;
    }
  );
}

/* =========================================================
   WOMEN ROUTE FILTER
========================================================= */

function matchesWomenRoute(
  product: ApiProduct,
  category?: string,
  subcategory?: string
): boolean {
  const categorySlugs =
    getProductCategorySlugs(
      product
    );

  /* Product must belong to Women */

  if (
    !categorySlugs.includes(
      "women"
    )
  ) {
    return false;
  }

  /* /women */

  if (!category) {
    return true;
  }

  /* /women/offers */

  if (category === "offers") {
    return isProductOnOffer(
      product
    );
  }

  /* /women/bra */

  if (
    !categorySlugs.includes(
      category
    )
  ) {
    return false;
  }

  /* No sub category */

  if (!subcategory) {
    return true;
  }

  /* /women/bra/sports-bra */

  return categorySlugs.includes(
    subcategory
  );
}

/* =========================================================
   MAP API -> WOMEN PRODUCT
========================================================= */

function mapProductToWomenProduct(
  product: ApiProduct
): WomenProduct {
  const categorySlugs =
    getProductCategorySlugs(
      product
    );

  const imageUrls =
    getProductImageUrls(
      product
    );

  const image1 =
    imageUrls[0] || "";

  const image2 =
    imageUrls[1] ||
    image1;

  const sellingPrice =
    Number(
      product.price
    ) || 0;

  const compareAtPrice =
    Number(
      product.compareAtPrice ||
        0
    );

  const actualPrice =
    compareAtPrice >
    sellingPrice
      ? compareAtPrice
      : sellingPrice;

  /*
   * Example:
   *
   * women
   * bra
   * sports-bra
   *
   * Main category = bra
   * Sub category = sports-bra
   */

  const hierarchy =
    categorySlugs.filter(
      (slug) =>
        slug !== "women"
    );

  const mainCategory =
    hierarchy[0] ||
    "women";

  const subcategories =
    hierarchy.slice(1);

  return {
    id:
      getProductId(
        product
      ),

    name:
      product.name || "Product",

    slug:
      product.slug || "",

    image1,

    image2,

    actualPrice,

    discountedPrice:
      sellingPrice,

    category:
      mainCategory,

    subcategories,

    onOffer:
      actualPrice >
      sellingPrice,

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
   PAGE
========================================================= */

=======
>>>>>>> aman
export default async function WomenPage({
  params,
}: Props) {
  const resolved =
    await params;

  const slugParts =
<<<<<<< HEAD
    resolvedParams.slug ??
    [];

  /*
   * Supported:
   *
   * /women
   * /women/bra
   * /women/bra/sports-bra
   */

  if (
    slugParts.length > 2
  ) {
    notFound();
  }

  const category =
    slugParts[0];

  const subcategory =
    slugParts[1];

  /* Validate URL syntax */
=======
    (
      resolved.slug ||
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
>>>>>>> aman

  const tree =
    await getActiveCategoryTree();

  const womenRoot =
    findCategoryRoot(
      tree,
      "women"
    );

  if (!womenRoot) {
    notFound();
  }

  /* =======================================================
<<<<<<< HEAD
     FETCH ALL ACTIVE PRODUCTS
  ======================================================= */

  const allProducts =
    await getActiveProducts();
=======
     CURRENT CATEGORY
  ======================================================= */

  const selected =
    resolveCategoryPath(
      womenRoot,
      slugParts
    );

  if (!selected) {
    notFound();
  }

  const currentCategory =
    selected.at(-1) ||
    womenRoot;
>>>>>>> aman

  /* =======================================================
     ALL WOMEN PRODUCTS
  ======================================================= */

  const womenProducts =
    allProducts.filter(
      isWomenProduct
    );

  /* =======================================================
     INVALID CATEGORY -> 404
  ======================================================= */

  if (
    !womenRouteExists(
      womenProducts,
      category,
      subcategory
    )
  ) {
    notFound();
  }

  /* =======================================================
     FILTER CURRENT ROUTE
  ======================================================= */

<<<<<<< HEAD
  const products =
    womenProducts
      .filter((product) =>
        matchesWomenRoute(
          product,
          category,
          subcategory
        )
      )
      .map(
        mapProductToWomenProduct
=======
  const apiProducts =
    await getActiveProducts();

  const products =
    apiProducts
      .filter((product) =>
        productBelongsToCategory(
          product,
          currentCategory
        )
      )
      .flatMap(
        mapProductToColorCards
>>>>>>> aman
      );

  /* =======================================================
     BANNER

     ONLY CURRENT CATEGORY.
     NO WOMEN ROOT FALLBACK.
  ======================================================= */

  const banners =
    getCategoryBanners(
      currentCategory,
      "/women",
      slugParts
    );

<<<<<<< HEAD
  /* =======================================================
     TITLE
  ======================================================= */

  const title =
    getWomenPageTitle(
      category,
      subcategory
    );

  /* =======================================================
     DESCRIPTION
  ======================================================= */

  const description =
    getWomenPageDescription(
      category,
      subcategory
    );

  /* =======================================================
     RENDER
  ======================================================= */

=======
>>>>>>> aman
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
          currentCategory.name
        }
        description={
          currentCategory.description ||
          (
            currentCategory.id ===
            womenRoot.id
              ? "Explore HivraSoft women's collection designed around comfort and confidence."
              : `Shop HivraSoft ${currentCategory.name}.`
          )
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