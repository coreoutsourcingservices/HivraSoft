import Header from "@/src/components/Header/Header";

import NewLaunchCatalog from "@/src/components/NewLaunch/NewLaunchCatalog";

import {
  getActiveCategoryTree,
  type StorefrontCategoryNode,
} from "@/src/services/categories";

import {
  findCategoryAnywhere,
  getNewLaunchProducts,
  mapProductToColorCards,
  productBelongsToCategory,
} from "@/src/services/storefront-catalog";

import {
  getProductCategorySlugs,
} from "@/src/services/products";

export const dynamic =
  "force-dynamic";

/* =========================================================
   FIND NEW LAUNCH CATEGORY
========================================================= */

function findNewLaunchCategory(
  categories: StorefrontCategoryNode[],
): StorefrontCategoryNode | undefined {
  for (const category of categories) {
    const slug =
      String(
        category.slug || "",
      )
        .trim()
        .toLowerCase();

    const name =
      String(
        category.name || "",
      )
        .trim()
        .toLowerCase();

    const matched =
      slug === "new-launch" ||
      slug === "new-launches" ||
      slug === "new-arrival" ||
      slug === "new-arrivals" ||
      slug.includes(
        "new-launch",
      ) ||
      name.includes(
        "new launch",
      ) ||
      name.includes(
        "new arrival",
      );

    if (matched) {
      return category;
    }

    if (
      Array.isArray(
        category.children,
      ) &&
      category.children.length > 0
    ) {
      const nested =
        findNewLaunchCategory(
          category.children,
        );

      if (nested) {
        return nested;
      }
    }
  }

  return undefined;
}

/* =========================================================
   PRODUCT GENDER CHECK
========================================================= */

function productIsGender(
  product: Parameters<
    typeof getProductCategorySlugs
  >[0],

  gender:
    | "men"
    | "women",
) {
  const slugs =
    getProductCategorySlugs(
      product,
    );

  return slugs.includes(
    gender,
  );
}

/* =========================================================
   PAGE
========================================================= */

export default async function NewLaunchPage() {
  const [
    categoryTree,
    newLaunchApiProducts,
  ] =
    await Promise.all([
      getActiveCategoryTree(),
      getNewLaunchProducts(),
    ]);

  /* =======================================================
     MEN
  ======================================================= */

  const menRoot =
    findCategoryAnywhere(
      categoryTree,
      [
        "men",
        "mens",
      ],
    );

  /* =======================================================
     WOMEN
  ======================================================= */

  const womenRoot =
    findCategoryAnywhere(
      categoryTree,
      [
        "women",
        "womens",
      ],
    );

  /* =======================================================
     NEW LAUNCH CATEGORY
  ======================================================= */

  const newLaunchCategory =
    findNewLaunchCategory(
      categoryTree,
    );

  /* =======================================================
     MEN PRODUCTS
  ======================================================= */

  const menApiProducts =
    newLaunchApiProducts.filter(
      (product) => {
        const categoryMatch =
          menRoot
            ? productBelongsToCategory(
                product,
                menRoot,
              )
            : false;

        const genderMatch =
          productIsGender(
            product,
            "men",
          );

        return (
          categoryMatch ||
          genderMatch
        );
      },
    );

  const menProducts =
    menApiProducts.flatMap(
      mapProductToColorCards,
    );

  /* =======================================================
     WOMEN PRODUCTS
  ======================================================= */

  const womenApiProducts =
    newLaunchApiProducts.filter(
      (product) => {
        const categoryMatch =
          womenRoot
            ? productBelongsToCategory(
                product,
                womenRoot,
              )
            : false;

        const genderMatch =
          productIsGender(
            product,
            "women",
          );

        return (
          categoryMatch ||
          genderMatch
        );
      },
    );

  const womenProducts =
    womenApiProducts.flatMap(
      mapProductToColorCards,
    );

  /* =======================================================
     MULTIPLE BANNER IMAGES

     Admin category me jitni valid images hongi,
     SAB frontend ko jayengi.

     Pehle:
     .find(...) = only ONE image

     Ab:
     .filter(...).map(...) = ALL images
  ======================================================= */

  const bannerImages =
    newLaunchCategory
      ?.images
      ?.filter(
        (image) =>
          Boolean(
            image?.url?.trim(),
          ),
      )
      .map(
        (image) =>
          image.url.trim(),
      ) || [];

  /* REMOVE DUPLICATE IMAGES */

  const uniqueBannerImages =
    Array.from(
      new Set(
        bannerImages,
      ),
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <Header />

      <NewLaunchCatalog
        menProducts={
          menProducts
        }
        womenProducts={
          womenProducts
        }
        menCategory={
          menRoot || null
        }
        womenCategory={
          womenRoot || null
        }
        bannerImages={
          uniqueBannerImages
        }
      />
    </>
  );
}