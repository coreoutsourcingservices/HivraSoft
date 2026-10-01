"use client";

import Link from "next/link";

import {
  useMemo,
  useState,
} from "react";

/* =========================================================
   TYPES
========================================================= */

type NewLaunchProduct = {
  id: string;

  name: string;
  slug: string;

  shortDescription: string;

  price: number;
  compareAtPrice: number;

  image: string;
  hoverImage: string;

  colorCount: number;
};

type SortValue =
  | "featured"
  | "low-high"
  | "high-low"
  | "discount";

type NewLaunchCatalogProps = {
  products: NewLaunchProduct[];

  bannerUrl: string;

  categoryName: string;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function NewLaunchCatalog({
  products,
  bannerUrl,
  categoryName,
}: NewLaunchCatalogProps) {
  const [
    sort,
    setSort,
  ] =
    useState<SortValue>(
      "featured"
    );

  /* =======================================================
     SORT PRODUCTS
  ======================================================= */

  const sortedProducts =
    useMemo(() => {
      const items = [
        ...products,
      ];

      switch (sort) {
        case "low-high":
          return items.sort(
            (a, b) =>
              a.price -
              b.price
          );

        case "high-low":
          return items.sort(
            (a, b) =>
              b.price -
              a.price
          );

        case "discount":
          return items.sort(
            (a, b) => {
              const aDiscount =
                a.compareAtPrice >
                a.price
                  ? a.compareAtPrice -
                    a.price
                  : 0;

              const bDiscount =
                b.compareAtPrice >
                b.price
                  ? b.compareAtPrice -
                    b.price
                  : 0;

              return (
                bDiscount -
                aDiscount
              );
            }
          );

        default:
          return items;
      }
    }, [
      products,
      sort,
    ]);

  return (
    <main
      className="
        min-h-screen
        bg-white
        text-[#292526]
      "
    >
      {/* =================================================
          NEW LAUNCH BANNER
      ================================================= */}

      {bannerUrl ? (
        <section
          className="
            relative
            w-full
            overflow-hidden
            bg-[#F4F1EF]
          "
        >
          <div
            className="
              relative
              w-full

              aspect-[16/6]

              sm:aspect-[16/5.5]

              md:aspect-[16/5]

              lg:aspect-[1920/520]
            "
          >
            <img
              src={
                bannerUrl
              }
              alt={
                categoryName
              }
              className="
                absolute
                inset-0
                h-full
                w-full
                object-cover
                object-center
              "
            />
          </div>
        </section>
      ) : null}

      {/* =================================================
          PRODUCTS
      ================================================= */}

      <section
        className="
          mx-auto
          w-full
          max-w-[1350px]
          px-4
          pb-20
          pt-10

          sm:px-6

          md:px-8
          md:pt-12

          lg:px-10
        "
      >
        {/* =================================================
            HEADING
        ================================================= */}

        <div
          className="
            flex
            flex-col
            gap-5
            border-b
            border-black/[0.08]
            pb-6

            sm:flex-row
            sm:items-end
            sm:justify-between
          "
        >
          <div>
            <p
              className="
                text-[9px]
                font-semibold
                uppercase
                tracking-[0.18em]
                text-[#9D173E]
              "
            >
              New Launch
            </p>

            <div
              className="
                mt-2
                flex
                flex-wrap
                items-end
                gap-3
              "
            >
              <h1
                className="
                  text-[24px]
                  font-semibold
                  tracking-[-0.02em]

                  sm:text-[27px]

                  md:text-[30px]
                "
              >
                Freshly Arrived
              </h1>

              <span
                className="
                  mb-1
                  text-[10px]
                  text-black/40
                "
              >
                {
                  products.length
                }{" "}
                {products.length ===
                1
                  ? "product"
                  : "products"}
              </span>
            </div>
          </div>

          {/* =================================================
              SORT
          ================================================= */}

          {products.length >
            0 && (
            <div
              className="
                flex
                items-center
                gap-3
              "
            >
              <span
                className="
                  hidden
                  text-[9px]
                  font-medium
                  uppercase
                  tracking-[0.12em]
                  text-black/45

                  sm:block
                "
              >
                Sort By
              </span>

              <select
                value={
                  sort
                }
                onChange={(
                  event
                ) =>
                  setSort(
                    event.target
                      .value as SortValue
                  )
                }
                className="
                  h-11
                  min-w-[180px]
                  cursor-pointer
                  rounded-full
                  border
                  border-black/10
                  bg-white
                  px-4
                  text-[10px]
                  font-medium
                  outline-none
                  transition

                  hover:border-black/25

                  focus:border-[#9D173E]/50
                "
              >
                <option value="featured">
                  Featured
                </option>

                <option value="low-high">
                  Price: Low to High
                </option>

                <option value="high-low">
                  Price: High to Low
                </option>

                <option value="discount">
                  Best Discount
                </option>
              </select>
            </div>
          )}
        </div>

        {/* =================================================
            EMPTY
        ================================================= */}

        {sortedProducts.length ===
        0 ? (
          <div
            className="
              flex
              min-h-[360px]
              w-full
              flex-col
              items-center
              justify-center
              px-5
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
                bg-[#9D173E]/[0.05]
              "
            >
              <NewIcon />
            </div>

            <h2
              className="
                mt-5
                text-[20px]
                font-semibold
              "
            >
              New launches
              coming soon
            </h2>

            <p
              className="
                mt-2
                max-w-[430px]
                text-[10px]
                leading-5
                text-black/45
              "
            >
              Products marked as
              New Launch or assigned
              to the New Launch
              category will appear
              here automatically.
            </p>
          </div>
        ) : (
          /* =================================================
              GRID
          ================================================= */

          <div
            className="
              mt-8
              grid
              grid-cols-2
              gap-x-3
              gap-y-8

              sm:gap-x-5

              md:grid-cols-3
              md:gap-x-6
              md:gap-y-10

              lg:grid-cols-4
              lg:gap-x-7
              lg:gap-y-12
            "
          >
            {sortedProducts.map(
              (
                product,
                index
              ) => (
                <ProductCard
                  key={
                    product.id
                  }
                  product={
                    product
                  }
                  index={
                    index
                  }
                />
              )
            )}
          </div>
        )}
      </section>
    </main>
  );
}

/* =========================================================
   PRODUCT CARD
========================================================= */

function ProductCard({
  product,
  index,
}: {
  product: NewLaunchProduct;
  index: number;
}) {
  const hasDiscount =
    product.compareAtPrice >
    product.price;

  const discount =
    hasDiscount
      ? Math.round(
          ((product.compareAtPrice -
            product.price) /
            product.compareAtPrice) *
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
        {/* IMAGE */}

        <div
          className="
            relative
            aspect-[4/5]
            overflow-hidden
            rounded-[14px]
            border
            border-black/[0.055]
            bg-[#F2F0EE]
          "
        >
          {/* NEW BADGE */}

          <span
            className="
              absolute
              left-3
              top-3
              z-20
              rounded-full
              bg-white/90
              px-2.5
              py-1.5
              text-[7px]
              font-semibold
              uppercase
              tracking-[0.12em]
              text-[#9D173E]
              backdrop-blur
            "
          >
            New
          </span>

          {/* NUMBER */}

          <span
            className="
              absolute
              bottom-3
              left-3
              z-20
              rounded-full
              bg-white/90
              px-2.5
              py-1.5
              text-[7px]
              font-semibold
              tracking-[0.12em]
              text-black/45
              backdrop-blur
            "
          >
            {String(
              index + 1
            ).padStart(
              2,
              "0"
            )}
          </span>

          {/* DISCOUNT */}

          {hasDiscount && (
            <span
              className="
                absolute
                right-3
                top-3
                z-20
                rounded-full
                bg-[#9D173E]
                px-2.5
                py-1.5
                text-[7px]
                font-semibold
                text-white
              "
            >
              {discount}% OFF
            </span>
          )}

          {/* IMAGE */}

          {product.image ? (
            <>
              <img
                src={
                  product.image
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
                  object-center
                  transition-all
                  duration-500

                  ${
                    product.hoverImage &&
                    product.hoverImage !==
                      product.image
                      ? "group-hover:opacity-0 group-hover:scale-[1.025]"
                      : "group-hover:scale-[1.035]"
                  }
                `}
              />

              {product.hoverImage &&
                product.hoverImage !==
                  product.image && (
                  <img
                    src={
                      product.hoverImage
                    }
                    alt={`${product.name} alternate`}
                    className="
                      absolute
                      inset-0
                      h-full
                      w-full
                      scale-[1.02]
                      object-cover
                      object-center
                      opacity-0
                      transition-all
                      duration-500

                      group-hover:scale-100
                      group-hover:opacity-100
                    "
                  />
                )}
            </>
          ) : (
            <div
              className="
                flex
                h-full
                w-full
                items-center
                justify-center
                text-[10px]
                text-black/30
              "
            >
              No Image
            </div>
          )}

          {/* VIEW PRODUCT */}

          <div
            className="
              absolute
              inset-x-3
              bottom-3
              z-30
              translate-y-2
              opacity-0
              transition-all
              duration-300

              group-hover:translate-y-0
              group-hover:opacity-100
            "
          >
            <div
              className="
                flex
                h-10
                items-center
                justify-center
                rounded-full
                bg-[#292526]/95
                text-[8px]
                font-semibold
                uppercase
                tracking-[0.12em]
                text-white
                shadow-lg
              "
            >
              View Product
            </div>
          </div>
        </div>

        {/* INFO */}

        <div
          className="
            px-1
            pt-4
          "
        >
          <div
            className="
              flex
              items-start
              justify-between
              gap-2
            "
          >
            <h2
              className="
                min-w-0
                flex-1
                text-[11px]
                font-semibold
                leading-[1.45]

                sm:text-[12px]
              "
            >
              {
                product.name
              }
            </h2>

            <span
              className="
                shrink-0
                text-[14px]
                text-black/25
                transition

                group-hover:translate-x-1
                group-hover:text-[#9D173E]
              "
            >
              →
            </span>
          </div>

          {product.shortDescription && (
            <p
              className="
                mt-1.5
                line-clamp-2
                text-[8px]
                leading-4
                text-black/40

                sm:text-[9px]
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
              mt-3
              flex
              flex-wrap
              items-center
              gap-x-2
              gap-y-1
            "
          >
            <strong
              className="
                text-[12px]
                font-semibold

                sm:text-[13px]
              "
            >
              ₹
              {product.price.toLocaleString(
                "en-IN"
              )}
            </strong>

            {hasDiscount && (
              <>
                <span
                  className="
                    text-[8px]
                    text-black/30
                    line-through
                  "
                >
                  ₹
                  {product.compareAtPrice.toLocaleString(
                    "en-IN"
                  )}
                </span>

                <span
                  className="
                    text-[7px]
                    font-semibold
                    text-green-700
                  "
                >
                  SAVE{" "}
                  {
                    discount
                  }%
                </span>
              </>
            )}
          </div>

          {/* COLORS */}

          {product.colorCount >
            0 && (
            <div
              className="
                mt-3
                flex
                items-center
                gap-1.5
              "
            >
              <span
                className="
                  h-1.5
                  w-1.5
                  rounded-full
                  bg-[#9D173E]/60
                "
              />

              <span
                className="
                  text-[7px]
                  uppercase
                  tracking-[0.08em]
                  text-black/40
                "
              >
                {
                  product.colorCount
                }{" "}
                {product.colorCount ===
                1
                  ? "colour"
                  : "colours"}
              </span>
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}

/* =========================================================
   NEW ICON
========================================================= */

function NewIcon() {
  return (
    <svg
      width="23"
      height="23"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#9D173E"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v18" />
      <path d="M3 12h18" />
      <path d="m5.6 5.6 12.8 12.8" />
      <path d="m18.4 5.6-12.8 12.8" />
    </svg>
  );
}