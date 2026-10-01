"use client";

import Link from "next/link";

import {
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

  return (
    <main
      className="
        min-h-screen

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
          "
        >
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
  );
}