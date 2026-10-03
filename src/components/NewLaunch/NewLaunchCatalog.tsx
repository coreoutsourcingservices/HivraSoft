"use client";

import Link from "next/link";

import {
<<<<<<< HEAD
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
=======
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import StorefrontProductCard from "@/src/components/Storefront/StorefrontProductCard";

import {
  useStorefrontCommerce,
} from "@/src/components/Storefront/StorefrontCommerceProvider";

import type {
  StorefrontCategoryNode,
} from "@/src/services/categories";

import type {
  CatalogProduct,
} from "@/types/catalog";

type Gender =
  | "men"
  | "women";

type Props = {
  menProducts:
    CatalogProduct[];

  womenProducts:
    CatalogProduct[];

  menCategory:
    | StorefrontCategoryNode
    | null;

  womenCategory:
    | StorefrontCategoryNode
    | null;

  backgroundImage:
    string;
};

/* =========================================================
   GENDER TOGGLE
========================================================= */

function GenderToggle({
  gender,
  onChange,
  dark = false,
}: {
  gender: Gender;

  onChange: (
    gender: Gender
  ) => void;

  dark?: boolean;
}) {
  return (
    <div
      className={`
        grid
        grid-cols-2

        rounded-[12px]

        border

        p-2

        ${
          dark
            ? "border-white/50 bg-black/20 backdrop-blur"
            : "border-black/30 bg-white"
        }
      `}
    >
      <button
        type="button"
        onClick={() =>
          onChange("men")
        }
        className={`
          min-w-[125px]

          rounded-[8px]

          px-6
          py-3

          text-sm

          transition

          ${
            gender ===
            "men"
              ? "bg-[#292727] text-white"
              : dark
                ? "text-white"
                : "text-[#292727]"
          }
        `}
      >
        Men
      </button>

      <button
        type="button"
        onClick={() =>
          onChange(
            "women"
          )
        }
        className={`
          min-w-[125px]

          rounded-[8px]

          px-6
          py-3

          text-sm

          transition

          ${
            gender ===
            "women"
              ? "bg-[#292727] text-white"
              : dark
                ? "text-white"
                : "text-[#292727]"
          }
        `}
      >
        Women
      </button>
    </div>
  );
}

/* =========================================================
   DYNAMIC CATEGORY ROW
========================================================= */

function DynamicCategories({
  category,
  gender,
}: {
  category:
    | StorefrontCategoryNode
    | null;

  gender: Gender;
}) {
  if (
    !category ||
    category.children.length ===
      0
  ) {
    return null;
  }

  const children = [
    ...category.children,
  ].sort(
    (
      a,
      b
    ) =>
      a.sortOrder -
      b.sortOrder
  );

  return (
    <section
      className="
        border-y
        border-black/10

        bg-white

        px-6
        py-7
      "
    >
      <div
        className="
          mx-auto

          flex
          max-w-[1280px]
          flex-wrap
          items-center
          justify-center

          gap-3
        "
      >
        <Link
          href={`/${gender}`}
          className="
            rounded-full

            bg-[#B31345]

            px-6
            py-3

            text-[11px]
            font-bold
            uppercase

            tracking-[0.12em]

            text-white
          "
        >
          ALL{" "}
          {gender ===
          "men"
            ? "MEN"
            : "WOMEN"}
        </Link>

        {children.map(
          (
            child
          ) => (
            <Link
              key={
                child.id
              }
              href={`/${gender}/${child.slug}`}
              className="
                rounded-full

                border
                border-black/10

                bg-[#F7F5F3]

                px-6
                py-3

                text-[11px]
                font-semibold
                uppercase

                tracking-[0.1em]

                transition

                hover:border-[#B31345]
                hover:text-[#B31345]
              "
            >
              {
                child.name
              }
            </Link>
          )
        )}
      </div>
    </section>
  );
}

/* =========================================================
   MAIN
========================================================= */

export default function NewLaunchCatalog({
  menProducts,
  womenProducts,
  menCategory,
  womenCategory,
  backgroundImage,
}: Props) {
  const commerce =
    useStorefrontCommerce();

  const defaultGender:
    Gender =
    menProducts.length > 0
      ? "men"
      : "women";

  const [
    gender,
    setGender,
  ] =
    useState<Gender>(
      defaultGender
    );

  const [
    selectedIndex,
    setSelectedIndex,
  ] =
    useState(0);

  const railRef =
    useRef<HTMLDivElement>(
      null
    );

  const products =
    useMemo(
      () =>
        gender ===
        "men"
          ? menProducts
          : womenProducts,
      [
        gender,
        menProducts,
        womenProducts,
      ]
    );

  const category =
    gender === "men"
      ? menCategory
      : womenCategory;

  useEffect(() => {
    setSelectedIndex(0);
  }, [
    gender,
  ]);

  const featured =
    products[
      selectedIndex
    ] ||
    products[0] ||
    null;

  /* =======================================================
     FEATURE PREVIEW IMAGES
  ======================================================= */

  const previewProducts =
    products.slice(
      0,
      4
    );

  const featureImages =
    featured
      ? Array.from(
          new Set(
            [
              featured.image1,
              featured.image2,

              ...previewProducts.map(
                (
                  product
                ) =>
                  product.image1
              ),
            ].filter(Boolean)
          )
        ).slice(
          0,
          4
        )
      : [];

  /* =======================================================
     RAIL
  ======================================================= */

  const scrollRail = (
    direction:
      | "left"
      | "right"
  ) => {
    railRef.current?.scrollBy({
      left:
        direction ===
        "right"
          ? 330
          : -330,

      behavior:
        "smooth",
    });
  };
>>>>>>> aman

  return (
    <main
      className="
        min-h-screen
<<<<<<< HEAD
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
=======

        bg-white

        text-[#292526]
      "
    >
      {/* ===================================================
          NEW ARRIVALS
      =================================================== */}

      <section
        className="
          bg-[#EFEFEF]

          px-6
          py-8

          lg:px-10
          lg:py-10
        "
      >
        <div
          className="
            mx-auto

            max-w-[1280px]
          "
        >
          {/* TOP */}

          <div
            className="
              mb-8

              flex
              flex-col
              gap-5

              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            <h1
              className="
                text-[44px]
                font-black
                uppercase
                leading-none

                tracking-[-0.04em]

                sm:text-[58px]
                lg:text-[68px]
              "
            >
              NEW{" "}
              <span
                className="
                  font-light

                  text-[#555152]
                "
              >
                ARRIVALS
              </span>
            </h1>

            <GenderToggle
              gender={
                gender
              }
              onChange={
                setGender
              }
            />
          </div>

          {featured ? (
            <div
              className="
                grid
                gap-8

                lg:grid-cols-[1.1fr_.9fr]
              "
            >
              {/* =============================================
                  LEFT
              ============================================= */}

              <div
                className="
                  grid
                  gap-5

                  sm:grid-cols-[220px_1fr]
                "
              >
                {/* OTHER IMAGES */}

                <div>
                  <p
                    className="
                      mb-4

                      text-sm
                      font-medium
                    "
                  >
                    Other Images
                  </p>

                  <div
                    className="
                      grid
                      grid-cols-2
                      gap-3
                    "
                  >
                    {featureImages.map(
                      (
                        image,
                        index
                      ) => (
                        <button
                          key={`${image}-${index}`}
                          type="button"
                          className="
                            aspect-[1/1.05]

                            overflow-hidden

                            rounded-[14px]

                            border-2
                            border-white

                            bg-white
                          "
                        >
                          <img
                            src={
                              image
                            }
                            alt=""
                            className="
                              h-full
                              w-full

                              object-cover
                            "
                          />
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* BIG FEATURE */}

                <Link
                  href={`/product/${encodeURIComponent(
                    featured.slug
                  )}`}
                  className="
                    flex
                    min-h-[500px]
                    items-end
                    justify-center

                    overflow-hidden
                  "
                >
                  <img
                    src={
                      featured.image1
                    }
                    alt={
                      featured.name
                    }
                    className="
                      h-full
                      max-h-[590px]
                      w-full

                      object-contain
                    "
                  />
                </Link>
              </div>

              {/* =============================================
                  RIGHT
              ============================================= */}

              <div
                className="
                  flex
                  flex-col
                  justify-center
                "
              >
                <div
                  className="
                    grid
                    grid-cols-3
                    gap-3
                  "
                >
                  {products
                    .slice(
                      0,
                      3
                    )
                    .map(
                      (
                        product,
                        index
                      ) => (
                        <button
                          key={
                            product.variantKey
                          }
                          type="button"
                          onClick={() =>
                            setSelectedIndex(
                              index
                            )
                          }
                          className={`
                            aspect-square

                            overflow-hidden

                            rounded-[14px]

                            border

                            bg-white

                            ${
                              selectedIndex ===
                              index
                                ? "border-[#292526]"
                                : "border-black/20"
                            }
                          `}
                        >
                          <img
                            src={
                              product.image1
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
                        </button>
                      )
                    )}
                </div>

                {/* PRODUCT INFO */}

                <div
                  className="
                    mt-5

                    overflow-hidden

                    rounded-[18px]

                    bg-white
                  "
                >
                  <div
                    className="
                      bg-[#292727]

                      px-6
                      py-5

                      text-white
                    "
                  >
                    <span
                      className="
                        rounded-full

                        bg-white/15

                        px-4
                        py-2

                        text-xs
                      "
                    >
                      New
                    </span>

                    <h2
                      className="
                        mt-4

                        text-xl
                        font-semibold
                      "
                    >
                      {
                        featured.name
                      }
                    </h2>

                    {featured.colorName && (
                      <p
                        className="
                          mt-1

                          text-xs

                          text-white/70
                        "
                      >
                        Color:{" "}
                        {
                          featured.colorName
                        }
                      </p>
                    )}
                  </div>

                  <div
                    className="
                      p-6
                    "
                  >
                    <div
                      className="
                        flex
                        flex-wrap
                        items-center
                        gap-3
                      "
                    >
                      <strong
                        className="
                          text-2xl
                        "
                      >
                        ₹
                        {featured.showPrice.toLocaleString(
                          "en-IN"
                        )}
                      </strong>

                      {featured.originalPrice >
                        featured.showPrice && (
                        <span
                          className="
                            text-sm

                            text-black/35

                            line-through
                          "
                        >
                          ₹
                          {featured.originalPrice.toLocaleString(
                            "en-IN"
                          )}
                        </span>
                      )}

                      {featured.discountPercent >
                        0 && (
                        <span
                          className="
                            rounded-full

                            bg-[#F7E4EA]

                            px-3
                            py-1

                            text-[10px]
                            font-bold

                            text-[#B31345]
                          "
                        >
                          {
                            featured.discountPercent
                          }
                          % OFF
                        </span>
                      )}
                    </div>

                    <div
                      className="
                        mt-6

                        grid
                        grid-cols-2

                        gap-3
                      "
                    >
                      <Link
                        href={`/product/${encodeURIComponent(
                          featured.slug
                        )}`}
                        className="
                          flex
                          h-11
                          items-center
                          justify-center

                          rounded-lg

                          border
                          border-[#292526]

                          text-xs
                          font-semibold
                        "
                      >
                        EXPLORE
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          void commerce.openAddToBag(
                            featured
                          );
                        }}
                        className="
                          h-11

                          rounded-lg

                          bg-[#292526]

                          text-xs
                          font-semibold

                          text-white
                        "
                      >
                        ADD TO BAG
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="
                py-24

                text-center

                text-black/50
              "
            >
              No new launch products
              available.
            </div>
          )}
        </div>
      </section>

      {/* ===================================================
          MEN / WOMEN DYNAMIC CATEGORIES
      =================================================== */}

      <DynamicCategories
        category={
          category
        }
        gender={
          gender
        }
      />

      {/* ===================================================
          BACKGROUND PRODUCT SECTION
      =================================================== */}

      <section
        className="
          relative

          overflow-hidden

          px-5
          py-14

          lg:px-10
          lg:py-20
        "
        style={
          backgroundImage
            ? {
                backgroundImage:
                  `linear-gradient(rgba(0,0,0,.25), rgba(0,0,0,.38)), url("${backgroundImage}")`,

                backgroundSize:
                  "cover",

                backgroundPosition:
                  "center",
              }
            : {
                background:
                  "linear-gradient(135deg,#5C4B43,#171717)",
              }
        }
      >
        <div
          className="
            relative
            z-10

            mx-auto

            max-w-[1280px]
>>>>>>> aman
          "
        >
          <div
            className="
<<<<<<< HEAD
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
=======
              mb-8

              flex
              flex-col
              gap-5

              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            <div
              className="
                text-white
              "
            >
              <p
                className="
                  text-[11px]
                  font-semibold
                  uppercase

                  tracking-[0.22em]
                "
              >
                JUST DROPPED
              </p>

              <h2
                className="
                  mt-2

                  text-4xl
                  font-black
                  uppercase

                  tracking-[-0.03em]
                "
              >
                FRESH STYLES
              </h2>
            </div>

            <GenderToggle
              gender={
                gender
              }
              onChange={
                setGender
              }
              dark
            />
          </div>

          <div
            ref={
              railRef
            }
            className="
              flex
              gap-4

              overflow-x-auto

              pb-5

              [scrollbar-width:none]

              [&::-webkit-scrollbar]:hidden
            "
          >
            {products.map(
              (
                product
              ) => (
                <div
                  key={
                    product.variantKey
                  }
                  className="
                    w-[260px]
                    flex-none

                    md:w-[285px]
                  "
                >
                  <StorefrontProductCard
                    product={
                      product
                    }
                    overlay
                  />
                </div>
              )
            )}
          </div>

          {products.length >
            3 && (
            <div
              className="
                mt-4

                flex
                justify-end

                gap-3
              "
            >
              <button
                type="button"
                aria-label="Previous products"
                onClick={() =>
                  scrollRail(
                    "left"
                  )
                }
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center

                  rounded-full

                  bg-white

                  text-xl
                  text-black
                "
              >
                ‹
              </button>

              <button
                type="button"
                aria-label="Next products"
                onClick={() =>
                  scrollRail(
                    "right"
                  )
                }
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center

                  rounded-full

                  bg-white

                  text-xl
                  text-black
                "
              >
                ›
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
>>>>>>> aman
  );
}