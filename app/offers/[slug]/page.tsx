import {
  notFound,
} from "next/navigation";

import Header from "@/src/components/Header/Header";

import BuyGetOfferCatalog from "@/src/components/Offers/BuyGetOfferCatalog";

import {
  getActiveCategoryTree,
} from "@/src/services/categories";

import {
  getActiveProducts,
} from "@/src/services/products";

import {
  findCategoryAnywhere,
  mapProductToColorCards,
  productBelongsToCategory,
} from "@/src/services/storefront-catalog";

import {
  getOfferBanners,
  getOfferBySlug,
  getOfferEligibleProducts,
} from "@/src/services/offers";

/* =========================================================
   ALWAYS LOAD FRESH OFFER DATA
========================================================= */

export const dynamic =
  "force-dynamic";

export const revalidate =
  0;

/* =========================================================
   TYPES
========================================================= */

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

/* =========================================================
   BUY / GET OFFER PAGE

   FLOW:

   Offer eligible products
          ↓
   All
   Men
   Women
   Accessories

   IMPORTANT:

   All = current offer ke saare eligible products.

   Men/Women/Accessories bhi sirf current
   offer ke eligible products me se filter honge.
========================================================= */

export default async function BuyGetOfferPage({
  params,
}: Props) {
  /* =======================================================
     GET SLUG
  ======================================================= */

  const {
    slug: rawSlug,
  } =
    await params;

  const slug =
    decodeURIComponent(
      String(
        rawSlug || "",
      ),
    )
      .trim()
      .toLowerCase()
      .replace(
        /^\/+|\/+$/g,
        "",
      );

  if (
    !slug
  ) {
    notFound();
  }

  /* =======================================================
     GET OFFER
  ======================================================= */

  const offer =
    await getOfferBySlug(
      slug,
    );

  /* =======================================================
     VALIDATE OFFER
  ======================================================= */

  if (
    !offer
  ) {
    console.error(
      "BUY GET OFFER NOT FOUND:",
      slug,
    );

    notFound();
  }

  if (
    offer.offerType !==
    "buy_get"
  ) {
    console.error(
      "INVALID OFFER TYPE:",
      offer.offerType,
    );

    notFound();
  }

  if (
    offer.isActive ===
    false
  ) {
    console.error(
      "BUY GET OFFER INACTIVE:",
      slug,
    );

    notFound();
  }

  /* =======================================================
     LOAD CATEGORY TREE + ACTIVE PRODUCTS
  ======================================================= */

  const [
    categoryTree,
    allProducts,
  ] =
    await Promise.all([
      getActiveCategoryTree(),

      getActiveProducts(),
    ]);

  /* =======================================================
     OFFER ELIGIBLE PRODUCTS

     All Products ON:
     → all active eligible products

     All Products OFF:
     → selected products/categories only
  ======================================================= */

  const eligibleProducts =
    getOfferEligibleProducts(
      offer,
      allProducts,
      categoryTree,
    );

  /* =======================================================
     ALL OFFER PRODUCTS

     IMPORTANT:

     Ye store ke saare products nahi hain.

     Ye sirf current Buy/Get offer ke
     eligible products hain.
  ======================================================= */

  const allOfferProducts =
    eligibleProducts.flatMap(
      mapProductToColorCards,
    );

  /* =======================================================
     FIND MEN CATEGORY
  ======================================================= */

  const menCategory =
    findCategoryAnywhere(
      categoryTree,
      [
        "men",
        "mens",
        "menswear",
        "male",
      ],
    ) ||
    null;

  /* =======================================================
     FIND WOMEN CATEGORY
  ======================================================= */

  const womenCategory =
    findCategoryAnywhere(
      categoryTree,
      [
        "women",
        "womens",
        "womenswear",
        "female",
      ],
    ) ||
    null;

  /* =======================================================
     FIND ACCESSORIES CATEGORY
  ======================================================= */

  const accessoriesCategory =
    findCategoryAnywhere(
      categoryTree,
      [
        "accessories",
        "accessory",
      ],
    ) ||
    null;

  /* =======================================================
     MEN ELIGIBLE PRODUCTS
  ======================================================= */

  const menApiProducts =
    menCategory
      ? eligibleProducts.filter(
          (
            product,
          ) =>
            productBelongsToCategory(
              product,
              menCategory,
            ),
        )
      : [];

  const menProducts =
    menApiProducts.flatMap(
      mapProductToColorCards,
    );

  /* =======================================================
     WOMEN ELIGIBLE PRODUCTS
  ======================================================= */

  const womenApiProducts =
    womenCategory
      ? eligibleProducts.filter(
          (
            product,
          ) =>
            productBelongsToCategory(
              product,
              womenCategory,
            ),
        )
      : [];

  const womenProducts =
    womenApiProducts.flatMap(
      mapProductToColorCards,
    );

  /* =======================================================
     ACCESSORIES ELIGIBLE PRODUCTS
  ======================================================= */

  const accessoriesApiProducts =
    accessoriesCategory
      ? eligibleProducts.filter(
          (
            product,
          ) =>
            productBelongsToCategory(
              product,
              accessoriesCategory,
            ),
        )
      : [];

  const accessoriesProducts =
    accessoriesApiProducts.flatMap(
      mapProductToColorCards,
    );

  /* =======================================================
     PUBLIC URL
  ======================================================= */

  const publicUrl =
    `/${encodeURIComponent(
      offer.slug,
    )}`;

  /* =======================================================
     OFFER BANNERS
  ======================================================= */

  const banners =
    getOfferBanners(
      offer,
      categoryTree,
      publicUrl,
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <Header />

      <BuyGetOfferCatalog
        offer={
          offer
        }
        productGroups={{
          all:
            allOfferProducts,

          men:
            menProducts,

          women:
            womenProducts,

          accessories:
            accessoriesProducts,
        }}
        banners={
          banners
        }
      />
    </>
  );
}