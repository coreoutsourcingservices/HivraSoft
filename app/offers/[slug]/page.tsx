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
  mapProductToColorCards,
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
========================================================= */

export default async function BuyGetOfferPage({
  params,
}: Props) {
  /* =======================================================
     URL SLUG

     Public:
     /buy-3-get-1-free

     Internal rewrite:
     /offers/buy-3-get-1-free

     params.slug:
     buy-3-get-1-free
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
     GET OFFER BY DYNAMIC SLUG

     No buy-3 hardcoding.

     Tomorrow:

     buy-4-get-1-free
     buy-6-get-3-free

     automatically same page.
  ======================================================= */

  const offer =
    await getOfferBySlug(
      slug,
    );

  /* =======================================================
     VALID BUY GET OFFER ONLY
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
    tree,
    allProducts,
  ] =
    await Promise.all([
      getActiveCategoryTree(),

      getActiveProducts(),
    ]);

  /* =======================================================
     OFFER ELIGIBLE PRODUCTS

     All Products ON:
     => all active products

     All Products OFF:
     => offer me selected products/categories only
  ======================================================= */

  const eligibleProducts =
    getOfferEligibleProducts(
      offer,
      allProducts,
      tree,
    );

  /* =======================================================
     STOREFRONT PRODUCT CARDS
  ======================================================= */

  const products =
    eligibleProducts.flatMap(
      mapProductToColorCards,
    );

  /* =======================================================
     CLEAN PUBLIC OFFER URL

     IMPORTANT:

     Browser:
     /buy-3-get-1-free

     NOT:
     /offers/buy-3-get-1-free
  ======================================================= */

  const publicUrl =
    `/${encodeURIComponent(
      offer.slug,
    )}`;

  /* =======================================================
     BANNERS

     Offer eligible category/category tree
     ke according existing service decide karegi.
  ======================================================= */

  const banners =
    getOfferBanners(
      offer,
      tree,
      publicUrl,
    );

  /* =======================================================
     PAGE

     Mobile / desktop layout yahan change nahi kiya.
  ======================================================= */

  return (
    <>
      <Header />

      <BuyGetOfferCatalog
        offer={
          offer
        }
        products={
          products
        }
        banners={
          banners
        }
      />
    </>
  );
}