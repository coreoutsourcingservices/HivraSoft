import {
  notFound,
} from "next/navigation";
import { cache } from "react";
import { productSeo, pageMetadata, breadcrumbs } from "@/lib/seo";
import StructuredData from "@/src/components/Storefront/StructuredData";

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
  (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL)
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
          signal: AbortSignal.timeout(8_000),

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
          signal: AbortSignal.timeout(8_000),
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

async function loadProduct(
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
}

/* =========================================================
   PAGE
========================================================= */
const getProduct = cache(loadProduct);

// A colour with its own URL loads its full content on navigation. Do not send
// every other colour's long HTML description in this page's hydration payload.
function productForPage(product: ProductDetailsData, slug: string): ProductDetailsData {
  const colors = product.colors || [];
  const selected = colors.find((color) => color.slugProduct === slug)
    || colors.find((color) => color.isDefault && color.isActive !== false)
    || colors.find((color) => color.isActive !== false);
  return {
    ...product,
    description: selected?.description ? undefined : product.description,
    colors: colors.filter((color) => color.isActive !== false).map((color) => {
      if (color === selected || !color.slugProduct) return color;
      const { description, shortDescription, ...summary } = color;
      return summary;
    }),
  };
}
export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  return pageMetadata(productSeo(product, slug).input);
}

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
      <StructuredData data={[productSeo(product, slug).schema, breadcrumbs([{ name: "Home", path: "/" }, { name: productSeo(product, slug).schema.name, path: `/product/${slug}` }])]} />
      <Header />

      <ProductDetails
        key={slug}
        product={
          productForPage(product, slug)
        }
        currentSlug={
          slug
        }
      />
    </>
  );
}
