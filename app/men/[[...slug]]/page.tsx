import {
  notFound,
} from "next/navigation";

import Header from "@/src/components/Header/Header";

import MenCatalog from "@/src/components/Men/MenCatalog";

import {
<<<<<<< HEAD
  getMenBanners,
  getMenPageDescription,
  getMenPageTitle,
  isValidMenPath,
  type MenProduct,
} from "@/src/data/men";

import {
  getActiveProducts,
  normalizeStoreProduct,
  type ApiProduct,
} from "@/src/services/products";

/* =========================================================
   DYNAMIC
========================================================= */
=======
  findCategoryRoot,
  getActiveCategoryTree,
  resolveCategoryPath,
} from "@/src/services/categories";

import {
  getActiveProducts,
} from "@/src/services/products";

import {
  getCategoryBanners,
  mapProductToColorCards,
  productBelongsToCategory,
} from "@/src/services/storefront-catalog";
>>>>>>> aman

export const dynamic =
  "force-dynamic";

<<<<<<< HEAD
/* =========================================================
   TYPES
========================================================= */

type MenPageProps = {
=======
type Props = {
>>>>>>> aman
  params: Promise<{
    slug?: string[];
  }>;
};

<<<<<<< HEAD
/* =========================================================
   MEN ROOT CATEGORY ALIASES
========================================================= */

const MEN_ROOT_SLUGS =
  new Set([
    "men",
    "mens",
    "menswear",
    "male",
  ]);

/* =========================================================
   IS MEN PRODUCT
========================================================= */

function isMenProduct(
  product: ApiProduct
): boolean {
  const normalized =
    normalizeStoreProduct(
      product
    );

  return normalized
    .categorySlugs
    .some(
      (slug) =>
        MEN_ROOT_SLUGS.has(
          slug
        )
    );
}

/* =========================================================
   MATCH CURRENT ROUTE
========================================================= */

function matchesMenRoute(
  product: ApiProduct,
  category?: string,
  subcategory?: string
): boolean {
  const normalized =
    normalizeStoreProduct(
      product
    );

  const categorySlugs =
    normalized.categorySlugs;

  /* =======================================================
     MUST BELONG TO MEN
  ======================================================= */

  const belongsToMen =
    categorySlugs.some(
      (slug) =>
        MEN_ROOT_SLUGS.has(
          slug
        )
    );

  if (!belongsToMen) {
    return false;
  }

  /* =======================================================
     /men
  ======================================================= */

  if (!category) {
    return true;
  }

  /* =======================================================
     /men/offers
  ======================================================= */

  if (
    category === "offers"
  ) {
    return (
      normalized.actualPrice >
      normalized.sellingPrice
    );
  }

  /* =======================================================
     CATEGORY
  ======================================================= */

  if (
    !categorySlugs.includes(
      category
    )
  ) {
    return false;
  }

  /* =======================================================
     NO SUBCATEGORY
  ======================================================= */

  if (!subcategory) {
    return true;
  }

  /* =======================================================
     SUBCATEGORY
  ======================================================= */

  return categorySlugs.includes(
    subcategory
  );
}

/* =========================================================
   API PRODUCT -> MEN PRODUCT
========================================================= */

function mapProductToMenProduct(
  product: ApiProduct
): MenProduct {
  const normalized =
    normalizeStoreProduct(
      product
    );

  const hierarchy =
    normalized
      .categorySlugs
      .filter(
        (slug) =>
          !MEN_ROOT_SLUGS.has(
            slug
          )
      );

  const mainCategory =
    hierarchy[0] ||
    "men";

  const subcategories =
    hierarchy.slice(1);

  return {
    id:
      normalized.id,

    name:
      normalized.name,

    slug:
      normalized.slug,

    image1:
      normalized.image1,

    image2:
      normalized.image2,

    actualPrice:
      normalized.actualPrice,

    discountedPrice:
      normalized.sellingPrice,

    category:
      mainCategory,

    subcategories,

    onOffer:
      normalized.actualPrice >
      normalized.sellingPrice,

    isFeatured:
      normalized.isFeatured,

    isNewLaunch:
      normalized.isNewLaunch,
  };
}

/* =========================================================
   MEN PAGE
========================================================= */

export default async function MenPage({
  params,
}: MenPageProps) {
  const resolvedParams =
    await params;

  const slugParts =
    resolvedParams.slug ??
    [];

  /* =======================================================
     MAX:

     /men
     /men/underwear
     /men/underwear/trunks
  ======================================================= */

  if (
    slugParts.length >
    2
  ) {
    notFound();
  }

  const category =
    slugParts[0];

  const subcategory =
    slugParts[1];

  /* =======================================================
     URL VALIDATION
  ======================================================= */

  if (
    !isValidMenPath(
      category,
      subcategory
    )
  ) {
    notFound();
  }

  /* =======================================================
     FETCH ACTIVE PRODUCTS
  ======================================================= */
=======
export default async function MenPage({
  params,
}: Props) {
  const resolved =
    await params;

  const slugParts =
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

  const tree =
    await getActiveCategoryTree();

  const menRoot =
    findCategoryRoot(
      tree,
      "men"
    );

  if (!menRoot) {
    notFound();
  }

  const selected =
    resolveCategoryPath(
      menRoot,
      slugParts
    );

  if (!selected) {
    notFound();
  }

  const currentCategory =
    selected.at(-1) ||
    menRoot;
>>>>>>> aman

  const apiProducts =
    await getActiveProducts();

<<<<<<< HEAD
  /* =======================================================
     DEBUG

     Terminal me count show hoga.
     Isse pata chalega API data aa raha hai ya nahi.
  ======================================================= */

  console.log(
    "[MEN PAGE] Active products:",
    apiProducts.length
  );

  /* =======================================================
     ONLY MEN PRODUCTS
  ======================================================= */

  const menApiProducts =
    apiProducts.filter(
      isMenProduct
    );

  console.log(
    "[MEN PAGE] Men products:",
    menApiProducts.length
  );

  /* =======================================================
     CURRENT CATEGORY PRODUCTS
  ======================================================= */

  const products =
    menApiProducts
      .filter(
        (product) =>
          matchesMenRoute(
            product,
            category,
            subcategory
          )
      )
      .map(
        mapProductToMenProduct
      )
      .filter(
        (product) =>
          Boolean(
            product.id
          ) &&
          Boolean(
            product.slug
          )
      );

  console.log(
    "[MEN PAGE] Visible products:",
    products.length
  );

  /* =======================================================
     BANNER
  ======================================================= */

  const banners =
    getMenBanners(
      category,
      subcategory
    );

  /* =======================================================
     TEXT
  ======================================================= */

  const title =
    getMenPageTitle(
      category,
      subcategory
    );

  const description =
    getMenPageDescription(
      category,
      subcategory
    );

  /* =======================================================
     RENDER
  ======================================================= */

=======
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
      );

  const banners =
    getCategoryBanners(
      currentCategory,
      "/men",
      slugParts
    );

>>>>>>> aman
  return (
    <>
      <Header />

      <MenCatalog
        products={
          products
        }
        banners={
          banners
        }
        title={
<<<<<<< HEAD
          title
        }
        description={
          description
        }
        category={
          category
        }
        subcategory={
          subcategory
=======
          currentCategory.name
        }
        description={
          currentCategory.description ||
          (
            currentCategory.id ===
            menRoot.id
              ? "Explore HivraSoft men's collection."
              : `Shop HivraSoft ${currentCategory.name}.`
          )
        }
        categoryRoot={
          menRoot
        }
        categoryPath={
          slugParts
>>>>>>> aman
        }
      />
    </>
  );
}