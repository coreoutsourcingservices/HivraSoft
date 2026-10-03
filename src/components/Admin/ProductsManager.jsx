"use client";

import { confirmAdminAction } from "@/src/components/Admin/AdminConfirmProvider";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  apiFetch,
  ApiError,
} from "@/lib/api";

/* =========================================================
   GET PRODUCTS FROM API RESPONSE
========================================================= */

function getProductsFromResponse(
  response
) {
  if (
    Array.isArray(
      response
    )
  ) {
    return response;
  }

  if (
    response &&
    Array.isArray(
      response.products
    )
  ) {
    return response.products;
  }

  if (
    response &&
    Array.isArray(
      response.data
    )
  ) {
    return response.data;
  }

  if (
    response &&
    response.data &&
    !Array.isArray(
      response.data
    ) &&
    Array.isArray(
      response.data.products
    )
  ) {
    return response.data.products;
  }

  return [];
}

/* =========================================================
   PRODUCTS MANAGER
========================================================= */

export default function ProductsManager() {
  const [
    products,
    setProducts,
  ] = useState([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState("all");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    actionId,
    setActionId,
  ] = useState(null);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  /* =======================================================
     LOAD PRODUCTS

     ADMIN:
     GET /api/products
  ======================================================= */

  const loadProducts =
    useCallback(
      async () => {
        try {
          setLoading(
            true
          );

          setError("");
          setSuccess("");

          const response =
            await apiFetch(
              "/api/products",
              {
                method:
                  "GET",
              }
            );

          const productList =
            getProductsFromResponse(
              response
            );

          const normalizedProducts =
            productList
              .map(
                normalizeProduct
              )
              .filter(
                (
                  product
                ) =>
                  Boolean(
                    product.id
                  )
              );

          setProducts(
            normalizedProducts
          );
        } catch (
          loadError
        ) {
          console.error(
            "Products loading failed:",
            loadError
          );

          setError(
            getErrorMessage(
              loadError,
              "Unable to load products."
            )
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      []
    );

  /* =======================================================
     LOAD ON PAGE OPEN
  ======================================================= */

  useEffect(() => {
    void loadProducts();
  }, [
    loadProducts,
  ]);

  /* =======================================================
     SEARCH + FILTER
  ======================================================= */

  const filteredProducts =
    useMemo(
      () => {
        const text =
          search
            .trim()
            .toLowerCase();

        return products.filter(
          (
            product
          ) => {
            const searchMatch =
              !text ||
              product.name
                .toLowerCase()
                .includes(
                  text
                ) ||
              product.slug
                .toLowerCase()
                .includes(
                  text
                ) ||
              product.id
                .toLowerCase()
                .includes(
                  text
                ) ||
              product.defaultColorName
                .toLowerCase()
                .includes(
                  text
                ) ||
              product.categoriesText
                .toLowerCase()
                .includes(
                  text
                );

            const statusMatch =
              status ===
                "all" ||
              product.status ===
                status;

            return (
              searchMatch &&
              statusMatch
            );
          }
        );
      },
      [
        products,
        search,
        status,
      ]
    );

  /* =======================================================
     PUBLISH / UNPUBLISH

     PATCH /api/products/:id
  ======================================================= */

  const updateActiveStatus =
    async (
      id,
      nextActive
    ) => {
      if (
        actionId
      ) {
        return;
      }

      try {
        setActionId(
          id
        );

        setError("");
        setSuccess("");

        const response =
          await apiFetch(
            `/api/products/${id}`,
            {
              method:
                "PATCH",

              body: {
                isActive:
                  nextActive,
              },
            }
          );

        setProducts(
          (
            current
          ) =>
            current.map(
              (
                product
              ) =>
                product.id ===
                id
                  ? {
                      ...product,

                      isActive:
                        nextActive,

                      status:
                        nextActive
                          ? "active"
                          : "inactive",
                    }
                  : product
            )
        );

        setSuccess(
          response?.message ||
            (
              nextActive
                ? "Product published successfully."
                : "Product unpublished successfully."
            )
        );
      } catch (
        updateError
      ) {
        console.error(
          "Product update failed:",
          updateError
        );

        setError(
          getErrorMessage(
            updateError,
            "Unable to update product status."
          )
        );
      } finally {
        setActionId(
          null
        );
      }
    };

  /* =======================================================
     DELETE PRODUCT

     DELETE /api/products/:id
  ======================================================= */

  const deleteProduct =
    async (
      id,
      name
    ) => {
      if (
        actionId
      ) {
        return;
      }

      const confirmed = await confirmAdminAction({
        title: "Delete Product?",
        itemName: name,
        description: "The product will move to Trash for 30 days. Cloudinary images will be preserved until permanent deletion.",
        confirmLabel: "Move to Trash",
      });

      if (
        !confirmed
      ) {
        return;
      }

      try {
        setActionId(
          id
        );

        setError("");
        setSuccess("");

        const response =
          await apiFetch(
            `/api/products/${id}`,
            {
              method:
                "DELETE",
            }
          );

        setProducts(
          (
            current
          ) =>
            current.filter(
              (
                product
              ) =>
                product.id !==
                id
            )
        );

        const deletedImages =
          typeof response
            ?.deletedImages ===
          "number"
            ? response
                .deletedImages
            : null;

        setSuccess(
          `${
            response?.message ||
            "Product deleted successfully."
          }${
            deletedImages !==
            null
              ? ` Deleted images: ${deletedImages}.`
              : ""
          }`
        );
      } catch (
        deleteError
      ) {
        console.error(
          "Product deletion failed:",
          deleteError
        );

        setError(
          getErrorMessage(
            deleteError,
            "Unable to delete product."
          )
        );
      } finally {
        setActionId(
          null
        );
      }
    };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div
      className="
        mx-auto
        w-full
        max-w-[1500px]
      "
    >
      {/* ===================================================
          HEADER
      =================================================== */}

      <div
        className="
          flex
          flex-col
          gap-5

          lg:flex-row
          lg:items-end
          lg:justify-between
        "
      >
        <div>
          <p
            className="
              text-[9px]
              font-semibold
              uppercase
              tracking-[0.24em]
              text-[#8C1839]
            "
          >
            Catalog Management
          </p>

          <h1
            className="
              mt-2

              text-[30px]
              font-semibold
              tracking-tight
              text-[#211A18]
            "
          >
            All Products
          </h1>

          <p
            className="
              mt-1

              text-[11px]
              leading-5
              text-[#211A18]/45
            "
          >
            Manage product
            information, stock,
            ratings and publishing
            status.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="
            inline-flex
            h-12
            items-center
            justify-center

            rounded-xl

            bg-[#8C1839]

            px-6

            text-[9px]
            font-semibold
            uppercase
            tracking-[0.1em]
            text-white

            transition

            hover:bg-[#211A18]
          "
        >
          + Add Product
        </Link>
      </div>

      {/* ===================================================
          MESSAGES
      =================================================== */}

      {error && (
        <Message
          tone="error"
        >
          {error}
        </Message>
      )}

      {success && (
        <Message
          tone="success"
        >
          {success}
        </Message>
      )}

      {/* ===================================================
          FILTERS
      =================================================== */}

      <section
        className="
          mt-6

          grid
          grid-cols-1
          gap-3

          rounded-2xl

          border
          border-[#211A18]/10

          bg-white

          p-4

          md:grid-cols-[minmax(0,1fr)_220px_auto]
        "
      >
        {/* SEARCH */}

        <div
          className="
            flex
            h-12
            items-center
            gap-3

            rounded-xl

            border
            border-[#211A18]/10

            bg-[#FAF8F6]

            px-4

            focus-within:border-[#8C1839]
          "
        >
          <SearchIcon />

          <input
            type="search"
            value={
              search
            }
            onChange={(
              event
            ) =>
              setSearch(
                event.target
                  .value
              )
            }
            placeholder="Search by name, ID, slug, color or category..."
            className="
              min-w-0
              flex-1

              bg-transparent

              text-[11px]

              outline-none

              placeholder:text-[#211A18]/30
            "
          />

          {search && (
            <button
              type="button"
              onClick={() =>
                setSearch("")
              }
              aria-label="Clear search"
              className="
                flex
                h-7
                w-7
                items-center
                justify-center

                rounded-full

                text-[17px]
                text-[#211A18]/35

                hover:bg-[#211A18]/5
                hover:text-[#8C1839]
              "
            >
              ×
            </button>
          )}
        </div>

        {/* STATUS */}

        <select
          value={
            status
          }
          onChange={(
            event
          ) =>
            setStatus(
              event.target
                .value
            )
          }
          className="
            h-12

            rounded-xl

            border
            border-[#211A18]/10

            bg-[#FAF8F6]

            px-4

            text-[11px]

            outline-none

            focus:border-[#8C1839]
          "
        >
          <option value="all">
            All Status
          </option>

          <option value="active">
            Published
          </option>

          <option value="inactive">
            Unpublished
          </option>
        </select>

        {/* REFRESH */}

        <button
          type="button"
          disabled={
            loading
          }
          onClick={() =>
            void loadProducts()
          }
          className="
            h-12

            rounded-xl

            border
            border-[#211A18]/10

            bg-white

            px-4

            text-[8px]
            font-semibold
            uppercase
            tracking-[0.1em]
            text-[#211A18]/65

            transition

            hover:border-[#8C1839]/20
            hover:text-[#8C1839]

            disabled:opacity-50
          "
        >
          Refresh
        </button>
      </section>

      {/* ===================================================
          PRODUCT COUNT
      =================================================== */}

      <div
        className="
          mt-4

          flex
          flex-wrap
          items-center
          justify-between
          gap-3
        "
      >
        <p
          className="
            text-[9px]
            text-[#211A18]/40
          "
        >
          Showing{" "}

          <strong
            className="
              text-[#211A18]
            "
          >
            {
              filteredProducts.length
            }
          </strong>{" "}

          of{" "}

          <strong
            className="
              text-[#211A18]
            "
          >
            {
              products.length
            }
          </strong>{" "}

          products
        </p>

        {(search ||
          status !==
            "all") && (
          <button
            type="button"
            onClick={() => {
              setSearch("");

              setStatus(
                "all"
              );
            }}
            className="
              text-[8px]
              font-semibold
              uppercase
              tracking-[0.08em]
              text-[#8C1839]

              hover:underline
            "
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* ===================================================
          PRODUCTS TABLE
      =================================================== */}

      <section
        className="
          mt-3
          overflow-hidden

          rounded-2xl

          border
          border-[#211A18]/10

          bg-white
        "
      >
        {/* HEADER */}

        <div
          className="
            hidden

            grid-cols-[minmax(330px,1.8fr)_120px_100px_110px_120px_360px]

            gap-4

            border-b
            border-[#211A18]/10

            bg-[#FAF8F6]

            px-5
            py-4

            xl:grid
          "
        >
          <ColumnTitle>
            Product
          </ColumnTitle>

          <ColumnTitle>
            Type
          </ColumnTitle>

          <ColumnTitle>
            Stock
          </ColumnTitle>

          <ColumnTitle>
            Rating
          </ColumnTitle>

          <ColumnTitle>
            Status
          </ColumnTitle>

          <ColumnTitle>
            Actions
          </ColumnTitle>
        </div>

        {/* LOADING */}

        {loading ? (
          <div
            className="
              flex
              min-h-[300px]
              items-center
              justify-center
            "
          >
            <div
              className="
                text-center
              "
            >
              <span
                className="
                  mx-auto
                  block

                  h-7
                  w-7

                  animate-spin

                  rounded-full

                  border-2
                  border-[#211A18]/10
                  border-t-[#8C1839]
                "
              />

              <p
                className="
                  mt-3

                  text-[8px]
                  font-semibold
                  uppercase
                  tracking-[0.1em]
                  text-[#211A18]/35
                "
              >
                Loading products...
              </p>
            </div>
          </div>
        ) : filteredProducts
            .length ===
          0 ? (
          /* EMPTY */

          <div
            className="
              flex
              min-h-[300px]
              flex-col
              items-center
              justify-center

              px-6

              text-center
            "
          >
            <div
              className="
                flex
                h-14
                w-14
                items-center
                justify-center

                rounded-full

                bg-[#F8E5E8]

                text-[#8C1839]
              "
            >
              <BoxIcon />
            </div>

            <p
              className="
                mt-4

                text-[12px]
                font-semibold
                text-[#211A18]
              "
            >
              No products found.
            </p>

            <p
              className="
                mt-1

                text-[9px]
                text-[#211A18]/40
              "
            >
              Add a product or
              change the current
              filters.
            </p>
          </div>
        ) : (
          /* PRODUCT ROWS */

          filteredProducts.map(
            (
              product
            ) => (
              <ProductRow
                key={
                  product.id
                }
                product={
                  product
                }
                busy={
                  actionId ===
                  product.id
                }
                updateActiveStatus={
                  updateActiveStatus
                }
                deleteProduct={
                  deleteProduct
                }
              />
            )
          )
        )}
      </section>
    </div>
  );
}

/* =========================================================
   PRODUCT ROW
========================================================= */

function ProductRow({
  product,
  busy,
  updateActiveStatus,
  deleteProduct,
}) {
  const stock =
    product.totalStock;

  return (
    <div
      className="
        grid
        grid-cols-1
        gap-5

        border-b
        border-[#211A18]/8

        px-5
        py-5

        transition

        last:border-0

        hover:bg-[#FFFCFB]

        xl:grid-cols-[minmax(330px,1.8fr)_120px_100px_110px_120px_360px]
        xl:items-center
        xl:gap-4
      "
    >
      {/* ===================================================
          PRODUCT
      =================================================== */}

      <div
        className="
          flex
          min-w-0
          items-center
          gap-4
        "
      >
        {/* IMAGE */}

        <div
          className="
            h-20
            w-16
            shrink-0

            overflow-hidden

            rounded-xl

            border
            border-[#211A18]/8

            bg-[#F3EEE8]
          "
        >
          {product.image ? (
            <img
              src={
                product.image
              }
              alt={
                product.name
              }
              className="
                h-full
                w-full
                object-cover
              "
            />
          ) : (
            <div
              className="
                flex
                h-full
                items-center
                justify-center

                px-2

                text-center
                text-[7px]
                font-semibold
                uppercase
                text-[#211A18]/25
              "
            >
              No Image
            </div>
          )}
        </div>

        {/* INFO */}

        <div
          className="
            min-w-0
          "
        >
          <div
            className="
              flex
              min-w-0
              flex-wrap
              items-center
              gap-2
            "
          >
            <p
              className="
                max-w-full
                truncate

                text-[12px]
                font-semibold
                text-[#211A18]
              "
            >
              {
                product.name
              }
            </p>

            {product.isColor &&
              product.defaultColorName && (
              <span
                className="
                  shrink-0

                  rounded-full

                  bg-[#F8E5E8]

                  px-2
                  py-1

                  text-[7px]
                  font-semibold
                  uppercase
                  text-[#8C1839]
                "
              >
                {
                  product.defaultColorName
                }
              </span>
            )}
          </div>

          <p
            className="
              mt-1

              line-clamp-2

              text-[9px]
              leading-4
              text-[#211A18]/40
            "
          >
            {
              product.shortDescription ||
              "No description"
            }
          </p>

          <div
            className="
              mt-2

              flex
              flex-wrap

              gap-x-3
              gap-y-1
            "
          >
            <p
              className="
                truncate

                text-[7px]
                text-[#211A18]/30
              "
            >
              {
                product.id
              }
            </p>

            {product.categoryName && (
              <p
                className="
                  text-[7px]
                  text-[#8C1839]/60
                "
              >
                {
                  product.categoryName
                }
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ===================================================
          TYPE
      =================================================== */}

      <Cell
        label="Type"
      >
        <span
          className={`
            inline-flex

            rounded-full

            px-3
            py-2

            text-[7px]
            font-semibold
            uppercase

            ${
              product.isColor
                ? "bg-[#F8E5E8] text-[#8C1839]"
                : "bg-[#F4F0ED] text-[#211A18]/60"
            }
          `}
        >
          {product.isColor
            ? "Color"
            : "No Color"}
        </span>
      </Cell>

      {/* ===================================================
          STOCK
      =================================================== */}

      <Cell
        label="Stock"
      >
        <p
          className="
            text-[12px]
            font-semibold
            text-[#211A18]
          "
        >
          {stock}
        </p>

        <p
          className={`
            mt-1

            text-[7px]
            font-medium

            ${
              stock <= 0
                ? "text-red-500"
                : stock <=
                    5
                  ? "text-orange-500"
                  : "text-green-600"
            }
          `}
        >
          {stock <= 0
            ? "Out of stock"
            : stock <= 5
              ? "Low stock"
              : "In stock"}
        </p>
      </Cell>

      {/* ===================================================
          RATING
      =================================================== */}

      <Cell
        label="Rating"
      >
        <p
          className="
            text-[10px]
            font-semibold
            text-[#211A18]
          "
        >
          <span
            className="
              text-[#8C1839]
            "
          >
            ★
          </span>{" "}

          {
            product.ratings.average.toFixed(
              1
            )
          }
        </p>

        <p
          className="
            mt-1

            text-[7px]
            text-[#211A18]/30
          "
        >
          {
            product.ratings.count
          }{" "}

          review

          {product.ratings.count ===
          1
            ? ""
            : "s"}
        </p>
      </Cell>

      {/* ===================================================
          STATUS
      =================================================== */}

      <Cell
        label="Status"
      >
        <StatusBadge
          status={
            product.status
          }
        />
      </Cell>

      {/* ===================================================
          ACTIONS
      =================================================== */}

      <Cell
        label="Actions"
      >
        <div
          className="
            flex
            flex-wrap
            gap-2
          "
        >
          {/* EDIT */}

          <Link
            href={`/admin/products/${product.id}/edit`}
            className="
              inline-flex
              h-9
              items-center
              justify-center

              rounded-lg

              border
              border-[#211A18]/10

              px-3

              text-[8px]
              font-semibold
              uppercase
              tracking-[0.06em]
              text-[#211A18]

              transition

              hover:border-[#8C1839]/20
              hover:bg-[#FFF7F8]
              hover:text-[#8C1839]
            "
          >
            Edit
          </Link>

          {/* VIEW SITE */}

          {product.slug && (
            <Link
              href={`/product/${product.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="
                inline-flex
                h-9
                items-center
                justify-center

                rounded-lg

                border
                border-[#8C1839]/15

                bg-[#FFF7F8]

                px-3

                text-[8px]
                font-semibold
                uppercase
                tracking-[0.06em]
                text-[#8C1839]

                transition

                hover:bg-[#8C1839]
                hover:text-white
              "
            >
              View Site
            </Link>
          )}

          {/* PUBLISH / UNPUBLISH */}

          {product.isActive ? (
            <button
              type="button"
              disabled={
                busy
              }
              onClick={() =>
                void updateActiveStatus(
                  product.id,
                  false
                )
              }
              className="
                h-9

                rounded-lg

                bg-[#F5F1EE]

                px-3

                text-[8px]
                font-semibold
                uppercase
                text-[#211A18]/65

                transition

                hover:bg-[#211A18]
                hover:text-white

                disabled:opacity-50
              "
            >
              {busy
                ? "..."
                : "Unpublish"}
            </button>
          ) : (
            <button
              type="button"
              disabled={
                busy
              }
              onClick={() =>
                void updateActiveStatus(
                  product.id,
                  true
                )
              }
              className="
                h-9

                rounded-lg

                bg-green-50

                px-3

                text-[8px]
                font-semibold
                uppercase
                text-green-700

                transition

                hover:bg-green-600
                hover:text-white

                disabled:opacity-50
              "
            >
              {busy
                ? "..."
                : "Publish"}
            </button>
          )}

          {/* DELETE */}

          <button
            type="button"
            disabled={
              busy
            }
            onClick={() =>
              void deleteProduct(
                product.id,
                product.name
              )
            }
            className="
              h-9

              rounded-lg

              bg-red-50

              px-3

              text-[8px]
              font-semibold
              uppercase
              text-red-600

              transition

              hover:bg-red-600
              hover:text-white

              disabled:opacity-50
            "
          >
            {busy
              ? "..."
              : "Delete"}
          </button>
        </div>
      </Cell>
    </div>
  );
}

/* =========================================================
   NORMALIZE PRODUCT

   BACKEND MODEL:

   product
      ↓
   colors[]
      ↓
   default color
      ↓
   nameProduct
   slugProduct
   shortDescription
   images[]
   sizes[]
========================================================= */

function normalizeProduct(
  product
) {
  /* =======================================================
     ID
  ======================================================= */

  const id =
    String(
      product?._id ||
        product?.id ||
        ""
    );

  /* =======================================================
     COLORS
  ======================================================= */

  const colors =
    Array.isArray(
      product?.colors
    )
      ? product.colors
      : [];

  /* =======================================================
     DEFAULT COLOR

     Priority:
     isDefault === true
     otherwise colors[0]
  ======================================================= */

  const defaultColor =
    colors.find(
      (
        color
      ) =>
        color?.isDefault ===
        true
    ) ||
    colors[0] ||
    null;

  /* =======================================================
     DEFAULT COLOR IMAGES
  ======================================================= */

  const defaultColorImages =
    Array.isArray(
      defaultColor?.images
    )
      ? defaultColor.images
      : [];

  /* Priority 1 */

  const defaultImage =
    defaultColorImages.find(
      (
        image
      ) =>
        image?.isDefault ===
          true &&
        Boolean(
          image?.url
        )
    );

  /* Priority 2 */

  const firstDefaultColorImage =
    defaultColorImages.find(
      (
        image
      ) =>
        Boolean(
          image?.url
        )
    );

  /* Priority 3 */

  const anyColorImage =
    colors
      .flatMap(
        (
          color
        ) =>
          Array.isArray(
            color?.images
          )
            ? color.images
            : []
      )
      .find(
        (
          image
        ) =>
          Boolean(
            image?.url
          )
      );

  /* =======================================================
     STOCK
  ======================================================= */

  const totalStock =
    colors.reduce(
      (
        productTotal,
        color
      ) => {
        const sizes =
          Array.isArray(
            color?.sizes
          )
            ? color.sizes
            : [];

        const colorStock =
          sizes.reduce(
            (
              sizeTotal,
              size
            ) => {
              if (
                size?.isActive ===
                false
              ) {
                return sizeTotal;
              }

              return (
                sizeTotal +
                Math.max(
                  0,
                  Number(
                    size?.stock
                  ) || 0
                )
              );
            },
            0
          );

        return (
          productTotal +
          colorStock
        );
      },
      0
    );

  /* =======================================================
     RATINGS
  ======================================================= */

  const average =
    Math.max(
      0,
      Math.min(
        5,
        Number(
          product?.ratings
            ?.average ||
            0
        )
      )
    );

  const count =
    Math.max(
      0,
      Math.floor(
        Number(
          product?.ratings
            ?.count ||
            0
        )
      )
    );

  /* =======================================================
     CATEGORIES
  ======================================================= */

  const categories =
    Array.isArray(
      product?.categories
    )
      ? product.categories
      : [];

  const categoryName =
    categories.length
      ? String(
          categories[
            categories.length -
              1
          ]?.name ||
            ""
        )
      : "";

  const categoriesText =
    categories
      .map(
        (
          category
        ) =>
          String(
            category?.name ||
              category?.slug ||
              ""
          )
      )
      .filter(
        Boolean
      )
      .join(" ");

  /* =======================================================
     FINAL FRONTEND PRODUCT
  ======================================================= */

  return {
    id,

    name:
      String(
        defaultColor
          ?.nameProduct ||
          "Unnamed Product"
      ),

    slug:
      String(
        defaultColor
          ?.slugProduct ||
          ""
      ),

    shortDescription:
      String(
        defaultColor
          ?.shortDescription ||
          ""
      ),

    defaultColorName:
      String(
        defaultColor
          ?.nameColor ||
          ""
      ),

    defaultColorSlug:
      String(
        defaultColor
          ?.slugColor ||
          ""
      ),

    image:
      defaultImage?.url ||
      firstDefaultColorImage
        ?.url ||
      anyColorImage?.url ||
      "",

    totalStock,

    ratings: {
      average,
      count,
    },

    isColor:
      product?.isColor ===
      true,

    isActive:
      product?.isActive ===
      true,

    status:
      product?.isActive ===
      true
        ? "active"
        : "inactive",

    isFeatured:
      product?.isFeatured ===
      true,

    isNewLaunch:
      product?.isNewLaunch ===
      true,

    categoryName,

    categoriesText,
  };
}

/* =========================================================
   ERROR MESSAGE
========================================================= */

function getErrorMessage(
  error,
  fallback
) {
  if (
    error instanceof
    ApiError
  ) {
    return error.message;
  }

  if (
    error instanceof
    Error
  ) {
    return error.message;
  }

  return fallback;
}

/* =========================================================
   CELL
========================================================= */

function Cell({
  label,
  children,
}) {
  return (
    <div>
      <p
        className="
          mb-2

          text-[7px]
          font-semibold
          uppercase
          tracking-[0.1em]
          text-[#211A18]/30

          xl:hidden
        "
      >
        {label}
      </p>

      {children}
    </div>
  );
}

/* =========================================================
   COLUMN TITLE
========================================================= */

function ColumnTitle({
  children,
}) {
  return (
    <span
      className="
        text-[8px]
        font-semibold
        uppercase
        tracking-[0.1em]
        text-[#211A18]/40
      "
    >
      {children}
    </span>
  );
}

/* =========================================================
   STATUS
========================================================= */

function StatusBadge({
  status,
}) {
  const active =
    status ===
    "active";

  return (
    <span
      className={`
        inline-flex
        items-center

        rounded-full

        px-3
        py-2

        text-[7px]
        font-semibold
        uppercase

        ${
          active
            ? "bg-green-50 text-green-700"
            : "bg-[#F4F0ED] text-[#211A18]/60"
        }
      `}
    >
      {active
        ? "Published"
        : "Unpublished"}
    </span>
  );
}

/* =========================================================
   MESSAGE
========================================================= */

function Message({
  tone,
  children,
}) {
  return (
    <div
      className={`
        mt-5

        rounded-xl

        border

        px-4
        py-3

        text-[10px]

        ${
          tone ===
          "error"
            ? "border-red-200 bg-red-50 text-red-600"
            : "border-green-200 bg-green-50 text-green-700"
        }
      `}
    >
      {children}
    </div>
  );
}

/* =========================================================
   SEARCH ICON
========================================================= */

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="
        shrink-0
        text-[#211A18]/35
      "
    >
      <circle
        cx="11"
        cy="11"
        r="7"
      />

      <path
        d="m20 20-3.5-3.5"
      />
    </svg>
  );
}

/* =========================================================
   BOX ICON
========================================================= */

function BoxIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M4 7 12 3l8 4-8 4-8-4Z"
      />

      <path
        d="M4 7v10l8 4 8-4V7"
      />

      <path
        d="M12 11v10"
      />
    </svg>
  );
}