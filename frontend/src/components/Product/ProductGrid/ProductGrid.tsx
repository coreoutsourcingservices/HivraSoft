"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  normalizeStoreProduct,
  type ApiProduct,
  type StoreProductData,
} from "@/src/services/products";

/* =========================================================
   API
========================================================= */

const RAW_API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(
    /\/+$/,
    ""
  ) ||
  "http://localhost:5000";

const API_URL =
  RAW_API_URL.replace(
    /\/api$/i,
    ""
  );

/* =========================================================
   API RESPONSE
========================================================= */

type ProductApiResponse =
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
   RESPONSE -> PRODUCTS
========================================================= */

function getProductsFromResponse(
  data: ProductApiResponse
): ApiProduct[] {
  if (
    Array.isArray(
      data
    )
  ) {
    return data;
  }

  if (
    data &&
    Array.isArray(
      data.products
    )
  ) {
    return data.products;
  }

  if (
    data &&
    Array.isArray(
      data.data
    )
  ) {
    return data.data;
  }

  if (
    data &&
    data.data &&
    !Array.isArray(
      data.data
    ) &&
    Array.isArray(
      data.data.products
    )
  ) {
    return data.data.products;
  }

  return [];
}

/* =========================================================
   PRODUCT GRID
========================================================= */

export default function ProductGrid() {
  const [
    products,
    setProducts,
  ] =
    useState<
      StoreProductData[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  /* =======================================================
     LOAD PRODUCTS
  ======================================================= */

  useEffect(() => {
    let cancelled =
      false;

    const loadProducts =
      async () => {
        try {
          setLoading(
            true
          );

          setError("");

          /* ===============================================
             CORRECT PUBLIC API
          =============================================== */

          const response =
            await fetch(
              `${API_URL}/api/products/active`,
              {
                method:
                  "GET",

                cache:
                  "no-store",

                headers: {
                  Accept:
                    "application/json",
                },
              }
            );

          const data =
            (await response.json()) as ProductApiResponse & {
              message?: string;
            };

          if (
            !response.ok
          ) {
            throw new Error(
              data?.message ||
                "Unable to load products."
            );
          }

          /* ===============================================
             GET RAW PRODUCTS
          =============================================== */

          const rawProducts =
            getProductsFromResponse(
              data
            );

          console.log(
            "[PRODUCT GRID] Raw:",
            rawProducts.length
          );

          /* ===============================================
             NORMALIZE

             colors[].nameProduct
             colors[].slugProduct
             colors[].images
             prices
             categories
          =============================================== */

          const normalizedProducts =
            rawProducts
              .map(
                (
                  product
                ) =>
                  normalizeStoreProduct(
                    product
                  )
              )
              .filter(
                (
                  product
                ) =>
                  Boolean(
                    product.id
                  ) &&
                  Boolean(
                    product.slug
                  )
              );

          console.log(
            "[PRODUCT GRID] Visible:",
            normalizedProducts.length
          );

          if (
            !cancelled
          ) {
            setProducts(
              normalizedProducts
            );
          }
        } catch (
          loadError
        ) {
          console.error(
            "Product grid error:",
            loadError
          );

          if (
            !cancelled
          ) {
            setError(
              loadError instanceof
                Error
                ? loadError.message
                : "Unable to load products."
            );
          }
        } finally {
          if (
            !cancelled
          ) {
            setLoading(
              false
            );
          }
        }
      };

    void loadProducts();

    return () => {
      cancelled =
        true;
    };
  }, []);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <section
        className="
          min-h-[500px]
          bg-[#F8F5F2]

          px-5
          py-16
        "
      >
        <div
          className="
            mx-auto

            flex
            max-w-[1500px]
            justify-center

            py-24

            text-xs
            text-[#211A18]/50
          "
        >
          Loading products...
        </div>
      </section>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (error) {
    return (
      <section
        className="
          min-h-[500px]
          bg-[#F8F5F2]

          px-5
          py-16
        "
      >
        <div
          className="
            mx-auto
            max-w-[1500px]

            rounded-2xl

            border
            border-red-200

            bg-red-50

            px-5
            py-4

            text-xs
            text-red-600
          "
        >
          {error}
        </div>
      </section>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <section
      className="
        min-h-screen

        bg-[#F8F5F2]

        px-4
        pb-20
        pt-12

        sm:px-6
        md:px-10
        lg:px-16
      "
    >
      <div
        className="
          mx-auto
          max-w-[1500px]
        "
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className="
            mb-10

            flex
            flex-col
            gap-3

            md:flex-row
            md:items-end
            md:justify-between
          "
        >
          <div>
            <p
              className="
                text-[9px]
                font-semibold
                uppercase
                tracking-[0.25em]
                text-[#8C1839]
              "
            >
              Shop Collection
            </p>

            <h1
              className="
                mt-2

                text-[28px]
                font-semibold
                text-[#211A18]

                md:text-[36px]
              "
            >
              All Products
            </h1>

            <p
              className="
                mt-2

                text-[11px]
                text-[#211A18]/50
              "
            >
              Explore our complete
              collection.
            </p>
          </div>

          <p
            className="
              text-[10px]
              uppercase
              tracking-[0.12em]
              text-[#211A18]/40
            "
          >
            {products.length}{" "}
            {products.length ===
            1
              ? "Product"
              : "Products"}
          </p>
        </div>

        {/* =================================================
            PRODUCTS
        ================================================= */}

        {products.length ===
        0 ? (
          <div
            className="
              grid
              min-h-[400px]
              place-items-center

              rounded-2xl

              border
              border-[#211A18]/10

              bg-white

              text-sm
              text-[#211A18]/50
            "
          >
            No products found.
          </div>
        ) : (
          <div
            className="
              grid
              grid-cols-2

              gap-x-3
              gap-y-8

              sm:gap-x-5

              md:grid-cols-3

              lg:grid-cols-4
              lg:gap-x-6
            "
          >
            {products.map(
              (
                product
              ) => (
                <ProductItem
                  key={
                    product.id
                  }
                  product={
                    product
                  }
                />
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* =========================================================
   PRODUCT ITEM
========================================================= */

function ProductItem({
  product,
}: {
  product: StoreProductData;
}) {
  const discount =
    product.actualPrice >
      product.sellingPrice &&
    product.actualPrice >
      0
      ? Math.round(
          ((product.actualPrice -
            product.sellingPrice) /
            product.actualPrice) *
            100
        )
      : 0;

  return (
    <article
      className="
        group
        min-w-0
      "
    >
      <Link
        href={`/product/${product.slug}`}
        className="
          block
        "
      >
        {/* =================================================
            IMAGE
        ================================================= */}

        <div
          className="
            relative

            aspect-[3/4]

            overflow-hidden

            rounded-[14px]

            bg-[#EEE9E4]

            md:rounded-[18px]
          "
        >
          {product.image1 ? (
            <>
              <img
                src={
                  product.image1
                }
                alt={
                  product.name
                }
                className={`
                  absolute
                  inset-0

                  h-full
                  w-full

                  object-cover

                  transition
                  duration-500

                  ${
                    product.image2 &&
                    product.image2 !==
                      product.image1
                      ? "group-hover:opacity-0"
                      : "group-hover:scale-[1.02]"
                  }
                `}
              />

              {product.image2 &&
                product.image2 !==
                  product.image1 && (
                <img
                  src={
                    product.image2
                  }
                  alt={`${product.name} alternate`}
                  className="
                    absolute
                    inset-0

                    h-full
                    w-full

                    object-cover

                    opacity-0

                    transition
                    duration-500

                    group-hover:opacity-100
                  "
                />
              )}
            </>
          ) : (
            <div
              className="
                grid
                h-full
                place-items-center

                text-xs
                text-[#211A18]/25
              "
            >
              No image
            </div>
          )}

          {/* BADGES */}

          <div
            className="
              absolute
              left-3
              top-3

              flex
              flex-col
              gap-1.5
            "
          >
            {product.isNewLaunch && (
              <span
                className="
                  rounded-full
                  bg-white

                  px-2.5
                  py-1

                  text-[7px]
                  font-semibold
                  uppercase
                  text-[#8C1839]
                "
              >
                New
              </span>
            )}

            {product.isFeatured && (
              <span
                className="
                  rounded-full

                  bg-[#211A18]

                  px-2.5
                  py-1

                  text-[7px]
                  font-semibold
                  uppercase
                  text-white
                "
              >
                Featured
              </span>
            )}

            {discount >
              0 && (
              <span
                className="
                  rounded-full

                  bg-[#8C1839]

                  px-2.5
                  py-1

                  text-[7px]
                  font-semibold
                  uppercase
                  text-white
                "
              >
                {discount}% Off
              </span>
            )}
          </div>
        </div>

        {/* =================================================
            INFO
        ================================================= */}

        <div
          className="
            pt-3
          "
        >
          <h2
            className="
              line-clamp-2

              text-[13px]
              font-semibold
              text-[#211A18]

              md:text-[14px]
            "
          >
            {product.name}
          </h2>

          {product.shortDescription && (
            <p
              className="
                mt-1

                line-clamp-2

                text-[10px]
                leading-4
                text-[#211A18]/45
              "
            >
              {
                product.shortDescription
              }
            </p>
          )}

          {/* PRICE */}

          <div
            className="
              mt-2

              flex
              flex-wrap
              items-center
              gap-2
            "
          >
            <span
              className="
                text-[13px]
                font-semibold
                text-[#211A18]
              "
            >
              ₹
              {product.sellingPrice.toLocaleString(
                "en-IN"
              )}
            </span>

            {product.actualPrice >
              product.sellingPrice && (
              <span
                className="
                  text-[10px]
                  text-[#211A18]/35
                  line-through
                "
              >
                ₹
                {product.actualPrice.toLocaleString(
                  "en-IN"
                )}
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}