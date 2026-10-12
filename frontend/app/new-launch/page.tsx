import Header from "@/src/components/Header/Header";

import NewLaunchCatalog from "@/src/components/NewLaunch/NewLaunchCatalog";

import {
  getActiveCategoryTree,
} from "@/src/services/categories";

import {
  findCategoryAnywhere,
  getNewLaunchProducts,
  mapProductToColorCards,
  productBelongsToCategory,
} from "@/src/services/storefront-catalog";

export const dynamic =
  "force-dynamic";

export default async function NewLaunchPage() {
  const [
    categoryTree,
    newLaunchApiProducts,
  ] =
    await Promise.all([
      getActiveCategoryTree(),

      getNewLaunchProducts(),
    ]);

  const menRoot =
    findCategoryAnywhere(
      categoryTree,
      [
        "men",
        "mens",
      ]
    );

  const womenRoot =
    findCategoryAnywhere(
      categoryTree,
      [
        "women",
        "womens",
      ]
    );

  const newLaunchCategory =
    findCategoryAnywhere(
      categoryTree,
      [
        "new-launch",
        "new-launches",
      ]
    );

  /* =======================================================
     MEN
  ======================================================= */

  const menProducts =
    menRoot
      ? newLaunchApiProducts
          .filter((product) =>
            productBelongsToCategory(
              product,
              menRoot
            )
          )
          .flatMap(
            mapProductToColorCards
          )
      : [];

  /* =======================================================
     WOMEN
  ======================================================= */

  const womenProducts =
    womenRoot
      ? newLaunchApiProducts
          .filter((product) =>
            productBelongsToCategory(
              product,
              womenRoot
            )
          )
          .flatMap(
            mapProductToColorCards
          )
      : [];

  /* =======================================================
     BACKGROUND

     New Launch category first image.
  ======================================================= */

  const backgroundImage =
    newLaunchCategory
      ?.images?.[0]?.url ||
    "";

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
          womenRoot ||
          null
        }
        backgroundImage={
          backgroundImage
        }
      />
    </>
  );
}