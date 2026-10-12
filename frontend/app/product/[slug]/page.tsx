import {
  notFound,
} from "next/navigation";
import { cache } from "react";
import { absoluteUrl, breadcrumbSchema, pageMetadata, plainText } from "@/lib/seo";
import JsonLd from "@/src/components/Seo/JsonLd";
import { getProductName, getProductImageUrls } from "@/src/services/products";

import Header from "@/src/components/Header/Header";

import ProductDetails, {
  type ProductDetailsData,
} from "@/src/components/Product/ProductDetails/ProductDetails";

import {
  getProductSlug,
  type ApiProduct,
} from "@/src/services/products";

/* =========================================================
   API
========================================================= */

const RAW_API_URL =
  process.env.NEXT_PUBLIC_API_URL
    ?.replace(/\/+$/, "") ||
  "http://localhost:5000";

const API_URL =
  RAW_API_URL.replace(
    /\/api$/i,
    ""
  );

export const dynamic =
  "force-dynamic";

/* =========================================================
   PROPS
========================================================= */

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

/* =========================================================
   SINGLE RESPONSE
========================================================= */

function getProductFromResponse(
  data: unknown
): ApiProduct | null {
  if (
    !data ||
    typeof data !==
      "object" ||
    Array.isArray(data)
  ) {
    return null;
  }

  const response =
    data as {
      product?: unknown;
      data?: unknown;
    };

  const product =
    response.product ??
    response.data ??
    data;

  if (
    !product ||
    typeof product !==
      "object" ||
    Array.isArray(product)
  ) {
    return null;
  }

  return product as ApiProduct;
}

/* =========================================================
   LIST RESPONSE
========================================================= */

function getProductsFromResponse(
  data: unknown
): ApiProduct[] {
  if (
    Array.isArray(data)
  ) {
    return data as ApiProduct[];
  }

  if (
    !data ||
    typeof data !==
      "object"
  ) {
    return [];
  }

  const response =
    data as {
      products?: unknown;
      data?: unknown;
    };

  if (
    Array.isArray(
      response.products
    )
  ) {
    return response.products as ApiProduct[];
  }

  if (
    Array.isArray(
      response.data
    )
  ) {
    return response.data as ApiProduct[];
  }

  if (
    response.data &&
    typeof response.data ===
      "object" &&
    !Array.isArray(
      response.data
    )
  ) {
    const nested =
      response.data as {
        products?: unknown;
      };

    if (
      Array.isArray(
        nested.products
      )
    ) {
      return nested.products as ApiProduct[];
    }
  }

  return [];
}

/* =========================================================
   DIRECT SLUG API
========================================================= */

async function getDirectProduct(
  slug: string
): Promise<ApiProduct | null> {
  try {
    const response =
      await fetch(
        `${API_URL}/api/products/slug/${encodeURIComponent(
          slug
        )}`,
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

    if (
      !response.ok
    ) {
      return null;
    }

    const data =
      await response.json();

    return getProductFromResponse(
      data
    );
  } catch {
    return null;
  }
}

/* =========================================================
   ACTIVE PRODUCTS FALLBACK
========================================================= */

async function getFallbackProduct(
  slug: string
): Promise<ApiProduct | null> {
  try {
    const response =
      await fetch(
        `${API_URL}/api/products/active`,
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

    if (
      !response.ok
    ) {
      return null;
    }

    const data =
      await response.json();

    const products =
      getProductsFromResponse(
        data
      );

    /*
     * Check every color slug.
     *
     * This is important because:
     *
     * light green and dark green
     * belong to same product document.
     */

    const colorSlugMatch =
      products.find(
        (product) => {
          const colors =
            Array.isArray(
              product.colors
            )
              ? product.colors
              : [];

          return colors.some(
            (color) =>
              String(
                color
                  ?.slugProduct ||
                  ""
              ) === slug
          );
        }
      );

    if (
      colorSlugMatch
    ) {
      return colorSlugMatch;
    }

    /*
     * Default normalized slug fallback.
     */

    const normalizedMatch =
      products.find(
        (product) =>
          getProductSlug(
            product
          ) === slug
      );

    if (
      normalizedMatch
    ) {
      return normalizedMatch;
    }

    /*
     * Legacy product.slug.
     */

    return (
      products.find(
        (product) =>
          String(
            product.slug ||
              ""
          ) === slug
      ) ||
      null
    );
  } catch {
    return null;
  }
}

/* =========================================================
   GET PRODUCT
========================================================= */

const getProduct = cache(async function getProduct(
  slug: string
): Promise<ProductDetailsData | null> {
  const direct =
    await getDirectProduct(
      slug
    );

  if (direct) {
    return direct as ProductDetailsData;
  }

  const fallback =
    await getFallbackProduct(
      slug
    );

  if (!fallback) {
    return null;
  }

  return fallback as ProductDetailsData;
});

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const color = product.colors?.find(item => item.slugProduct === slug);
  const name = color?.nameProduct || getProductName(product);
  return pageMetadata({ path:`/product/${encodeURIComponent(slug)}`, title:color?.seoTitle || product.seoTitle || `${name} - Shop Online`, description:color?.seoDescription || product.seoDescription || color?.shortDescription || color?.description || product.shortDescription || product.description || `Shop ${name} at HivraSoft. Explore product details, available colours and sizes, and choose comfortable everyday essentials for your wardrobe online.`, image:color?.images?.find(image=>image.isDefault)?.url || color?.images?.[0]?.url || getProductImageUrls(product)[0] });
}

/* =========================================================
   PAGE
========================================================= */

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const {
    slug,
  } = await params;

  if (!slug) {
    notFound();
  }

  const product =
    await getProduct(
      slug
    );

  if (!product) {
    notFound();
  }

  return (
    <>
      <JsonLd data={breadcrumbSchema([{name:"Home",path:"/"},{name:product.colors?.find(item=>item.slugProduct===slug)?.nameProduct || getProductName(product),path:`/product/${encodeURIComponent(slug)}`}])} />
      <JsonLd data={{ "@context":"https://schema.org", "@type":"Product", name:product.colors?.find(item=>item.slugProduct===slug)?.nameProduct || getProductName(product), url:absoluteUrl(`/product/${encodeURIComponent(slug)}`), image:product.colors?.find(item=>item.slugProduct===slug)?.images?.map(image=>image.url).filter(Boolean) || getProductImageUrls(product), description:plainText(product.shortDescription || product.description), brand:{"@type":"Brand",name:"HivraSoft"} }} />
      <Header />

      <ProductDetails
        product={
          product
        }
        currentSlug={
          slug
        }
      />
    </>
  );
}
