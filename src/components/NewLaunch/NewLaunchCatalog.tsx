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

/* =========================================================
   TYPES
========================================================= */

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

  /* MULTIPLE ADMIN CATEGORY BANNERS */

  bannerImages:
    string[];
};

/* =========================================================
   MONEY
========================================================= */

function money(
  value: number,
) {
  return `₹${Number(
    value || 0,
  ).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits:
        2,
    },
  )}`;
}

/* =========================================================
   GENDER TOGGLE
========================================================= */

function GenderToggle({
  gender,
  onChange,
}: {
  gender: Gender;

  onChange: (
    gender: Gender,
  ) => void;
}) {
  return (
    <div
      className="
        inline-grid
        grid-cols-2

        rounded-[11px]

        border
        border-black/20

        bg-white

        p-1
      "
    >
      <button
        type="button"
        onClick={() =>
          onChange(
            "men",
          )
        }
        className={`
          min-w-[76px]

          rounded-[8px]

          px-3
          py-2

          text-[10px]
          font-medium

          transition

          sm:min-w-[100px]
          sm:px-5
          sm:py-2.5
          sm:text-[12px]

          lg:min-w-[125px]

          ${
            gender ===
            "men"
              ? `
                bg-[#292727]
                text-white
              `
              : `
                text-[#292727]
              `
          }
        `}
      >
        Men
      </button>

      <button
        type="button"
        onClick={() =>
          onChange(
            "women",
          )
        }
        className={`
          min-w-[76px]

          rounded-[8px]

          px-3
          py-2

          text-[10px]
          font-medium

          transition

          sm:min-w-[100px]
          sm:px-5
          sm:py-2.5
          sm:text-[12px]

          lg:min-w-[125px]

          ${
            gender ===
            "women"
              ? `
                bg-[#292727]
                text-white
              `
              : `
                text-[#292727]
              `
          }
        `}
      >
        Women
      </button>
    </div>
  );
}

/* =========================================================
   MULTIPLE NEW LAUNCH BANNERS

   Admin Category:
   images[0]
   images[1]
   images[2]
   images[3]
   ...

   Sab banner me available honge.

   Mobile ratio ko existing style ke close rakha hai.
========================================================= */

function NewLaunchBanner({
  images,
}: {
  images: string[];
}) {
  const validImages =
    useMemo(
      () =>
        Array.from(
          new Set(
            images
              .map(
                (
                  image,
                ) =>
                  String(
                    image ||
                      "",
                  ).trim(),
              )
              .filter(
                Boolean,
              ),
          ),
        ),
      [
        images,
      ],
    );

  const [
    activeIndex,
    setActiveIndex,
  ] =
    useState(0);

  /* =======================================================
     RESET IF ADMIN BANNERS CHANGE
  ======================================================= */

  useEffect(() => {
    if (
      validImages.length ===
      0
    ) {
      setActiveIndex(
        0,
      );

      return;
    }

    setActiveIndex(
      (
        current,
      ) =>
        current >=
        validImages.length
          ? 0
          : current,
    );
  }, [
    validImages.length,
  ]);

  if (
    validImages.length ===
    0
  ) {
    return null;
  }

  function previousBanner() {
    setActiveIndex(
      (
        current,
      ) =>
        current === 0
          ? validImages.length -
            1
          : current - 1,
    );
  }

  function nextBanner() {
    setActiveIndex(
      (
        current,
      ) =>
        (
          current +
          1
        ) %
        validImages.length,
    );
  }

  return (
    <section
      className="
        relative

        w-full

        overflow-hidden

        bg-[#F8F2EF]
      "
    >
      <div
        className="
          relative

          w-full

          aspect-[1537/536]
        "
      >
        {/* ===============================================
            ALL BANNERS
        =============================================== */}

        {validImages.map(
          (
            image,
            index,
          ) => (
            <img
              key={`${image}-${index}`}
              src={image}
              alt={`Hivra Soft New Launch Banner ${
                index + 1
              }`}
              className={`
                absolute
                inset-0

                h-full
                w-full

                object-cover
                object-center

                transition-opacity
                duration-500

                ${
                  activeIndex ===
                  index
                    ? `
                      z-10
                      opacity-100
                    `
                    : `
                      z-0
                      opacity-0
                    `
                }
              `}
            />
          ),
        )}

        {/* ===============================================
            ARROWS

            Mobile par hidden rakhe hain taaki
            existing mobile look disturb na ho.
        =============================================== */}

        {validImages.length >
        1 ? (
          <>
            <button
              type="button"
              aria-label="Previous banner"
              onClick={
                previousBanner
              }
              className="
                absolute

                left-4
                top-1/2
                z-30

                hidden

                h-10
                w-10

                -translate-y-1/2

                place-items-center

                rounded-full

                bg-white/90

                text-[22px]
                text-[#292526]

                shadow-[0_5px_18px_rgba(0,0,0,0.15)]

                backdrop-blur

                transition

                hover:bg-white

                sm:grid

                lg:left-8
                lg:h-11
                lg:w-11
              "
            >
              ‹
            </button>

            <button
              type="button"
              aria-label="Next banner"
              onClick={
                nextBanner
              }
              className="
                absolute

                right-4
                top-1/2
                z-30

                hidden

                h-10
                w-10

                -translate-y-1/2

                place-items-center

                rounded-full

                bg-white/90

                text-[22px]
                text-[#292526]

                shadow-[0_5px_18px_rgba(0,0,0,0.15)]

                backdrop-blur

                transition

                hover:bg-white

                sm:grid

                lg:right-8
                lg:h-11
                lg:w-11
              "
            >
              ›
            </button>

            {/* ===========================================
                DOTS
            =========================================== */}

            <div
              className="
                absolute

                bottom-3
                left-1/2
                z-30

                flex

                -translate-x-1/2

                items-center

                gap-1.5

                rounded-full

                bg-white/80

                px-2.5
                py-1.5

                shadow-sm

                backdrop-blur

                sm:bottom-4
                sm:gap-2
                sm:px-3
                sm:py-2
              "
            >
              {validImages.map(
                (
                  _,
                  index,
                ) => (
                  <button
                    key={`banner-dot-${index}`}
                    type="button"
                    aria-label={`Open banner ${
                      index +
                      1
                    }`}
                    onClick={() =>
                      setActiveIndex(
                        index,
                      )
                    }
                    className={`
                      h-[6px]

                      rounded-full

                      transition-all
                      duration-300

                      ${
                        activeIndex ===
                        index
                          ? `
                            w-5
                            bg-[#B31345]

                            sm:w-6
                          `
                          : `
                            w-[6px]
                            bg-black/30
                          `
                      }
                    `}
                  />
                ),
              )}
            </div>
          </>
        ) : null}
      </div>
    </section>
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
    !Array.isArray(
      category.children,
    ) ||
    category.children.length ===
      0
  ) {
    return null;
  }

  const children = [
    ...category.children,
  ].sort(
    (
      first,
      second,
    ) =>
      first.sortOrder -
      second.sortOrder,
  );

  return (
    <section
      className="
        border-y
        border-black/10

        bg-white

        px-3
        py-4

        sm:px-5
        sm:py-5

        lg:px-6
        lg:py-7
      "
    >
      <div
        className="
          mx-auto

          flex
          max-w-[1380px]

          gap-2

          overflow-x-auto

          pb-1

          [scrollbar-width:none]

          [&::-webkit-scrollbar]:hidden

          lg:flex-wrap
          lg:justify-center
          lg:gap-3
          lg:overflow-visible
          lg:pb-0
        "
      >
        <Link
          href={`/${gender}`}
          className="
            shrink-0

            rounded-full

            bg-[#B31345]

            px-5
            py-2.5

            text-[9px]
            font-bold
            uppercase

            tracking-[0.1em]

            text-white

            lg:px-6
            lg:py-3
            lg:text-[11px]
          "
        >
          All{" "}

          {gender ===
          "men"
            ? "Men"
            : "Women"}
        </Link>

        {children.map(
          (
            child,
          ) => (
            <Link
              key={
                child.id
              }
              href={`/${gender}/${child.slug}`}
              className="
                shrink-0

                rounded-full

                border
                border-black/10

                bg-[#F7F5F3]

                px-5
                py-2.5

                text-[9px]
                font-semibold
                uppercase

                tracking-[0.08em]

                transition

                hover:border-[#B31345]
                hover:text-[#B31345]

                lg:px-6
                lg:py-3
                lg:text-[11px]
              "
            >
              {
                child.name
              }
            </Link>
          ),
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
  bannerImages,
}: Props) {
  const commerce =
    useStorefrontCommerce();

  /* =======================================================
     DEFAULT GENDER
  ======================================================= */

  const defaultGender:
    Gender =
    menProducts.length >
    0
      ? "men"
      : "women";

  const [
    gender,
    setGender,
  ] =
    useState<Gender>(
      defaultGender,
    );

  const [
    selectedIndex,
    setSelectedIndex,
  ] =
    useState(0);

  const [
    selectedImage,
    setSelectedImage,
  ] =
    useState("");

  const railRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  /* =======================================================
     CURRENT PRODUCTS
  ======================================================= */

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
      ],
    );

  const category =
    gender ===
    "men"
      ? menCategory
      : womenCategory;

  /* =======================================================
     RESET ON GENDER CHANGE
  ======================================================= */

  useEffect(() => {
    setSelectedIndex(
      0,
    );
  }, [
    gender,
  ]);

  useEffect(() => {
    if (
      products.length ===
      0
    ) {
      setSelectedIndex(
        0,
      );

      setSelectedImage(
        "",
      );

      return;
    }

    if (
      selectedIndex >=
      products.length
    ) {
      setSelectedIndex(
        0,
      );
    }
  }, [
    products.length,
    selectedIndex,
  ]);

  /* =======================================================
     FEATURED PRODUCT
  ======================================================= */

  const featured =
    products[
      selectedIndex
    ] ||
    products[0] ||
    null;

  /* =======================================================
     OTHER IMAGES

     IMPORTANT:

     ONLY CURRENT SELECTED PRODUCT.

     Dusre product/color ki image mix nahi hogi.
  ======================================================= */

  const featureImages =
    useMemo(() => {
      if (
        !featured
      ) {
        return [];
      }

      return Array.from(
        new Set(
          [
            featured.image1,
            featured.image2,
          ].filter(
            Boolean,
          ),
        ),
      );
    }, [
      featured,
    ]);

  /* =======================================================
     DEFAULT FEATURE IMAGE
  ======================================================= */

  useEffect(() => {
    setSelectedImage(
      featured?.image1 ||
        featureImages[0] ||
        "",
    );
  }, [
    featured?.variantKey,
    featureImages,
  ]);

  /* =======================================================
     SELECT PRODUCT
  ======================================================= */

  function selectProduct(
    index: number,
  ) {
    const nextProduct =
      products[index];

    if (
      !nextProduct
    ) {
      return;
    }

    setSelectedIndex(
      index,
    );

    setSelectedImage(
      nextProduct.image1 ||
        "",
    );
  }

  /* =======================================================
     PREVIOUS FEATURED PRODUCT
  ======================================================= */

  function previousFeaturedProduct() {
    if (
      products.length <=
      1
    ) {
      return;
    }

    setSelectedIndex(
      (
        current,
      ) => {
        const nextIndex =
          current === 0
            ? products.length -
              1
            : current - 1;

        const nextProduct =
          products[
            nextIndex
          ];

        setSelectedImage(
          nextProduct?.image1 ||
            "",
        );

        return nextIndex;
      },
    );
  }

  /* =======================================================
     NEXT FEATURED PRODUCT
  ======================================================= */

  function nextFeaturedProduct() {
    if (
      products.length <=
      1
    ) {
      return;
    }

    setSelectedIndex(
      (
        current,
      ) => {
        const nextIndex =
          (
            current +
            1
          ) %
          products.length;

        const nextProduct =
          products[
            nextIndex
          ];

        setSelectedImage(
          nextProduct?.image1 ||
            "",
        );

        return nextIndex;
      },
    );
  }

  /* =======================================================
     FRESH STYLE RAIL
  ======================================================= */

  function scrollRail(
    direction:
      | "left"
      | "right",
  ) {
    railRef.current?.scrollBy(
      {
        left:
          direction ===
          "right"
            ? 330
            : -330,

        behavior:
          "smooth",
      },
    );
  }

  return (
    <main
      className="
        min-h-screen

        overflow-x-hidden

        bg-white

        text-[#292526]
      "
    >
      {/* ===================================================
          1. MULTIPLE NEW LAUNCH BANNERS
      =================================================== */}

      <NewLaunchBanner
        images={
          bannerImages
        }
      />

      {/* ===================================================
          2. NEW ARRIVALS
      =================================================== */}

      <section
        className="
          bg-[#EFEFEF]

          px-3
          py-8

          sm:px-5
          sm:py-10

          lg:px-10
          lg:py-12
        "
      >
        <div
          className="
            mx-auto

            max-w-[1380px]
          "
        >
          {/* =================================================
              TITLE + GENDER
          ================================================= */}

          <div
            className="
              mb-7

              flex
              flex-col
              items-center

              gap-5

              text-center

              sm:mb-8

              lg:flex-row
              lg:items-center
              lg:justify-between
              lg:text-left
            "
          >
            <div>
              <p
                className="
                  mb-2

                  text-[7px]

                  uppercase

                  tracking-[0.35em]

                  text-[#8B7468]
                "
              >
                Just Dropped
              </p>

              <h1
                className="
                  text-[40px]

                  font-black
                  uppercase

                  leading-none

                  tracking-[-0.04em]

                  sm:text-[54px]

                  lg:text-[68px]
                "
              >
                New{" "}

                <span
                  className="
                    font-light

                    text-[#555152]
                  "
                >
                  Arrivals
                </span>
              </h1>
            </div>

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
            <>
              {/* =============================================
                  MOBILE / TABLET

                  ORIGINAL STRUCTURE SAME
              ============================================= */}

              <div
                className="
                  lg:hidden
                "
              >
                <div
                  className="
                    grid

                    grid-cols-[78px_minmax(0,1fr)]

                    gap-3

                    sm:grid-cols-[110px_minmax(0,1fr)]
                    sm:gap-5
                  "
                >
                  {/* OTHER IMAGES */}

                  <div
                    className="
                      flex
                      flex-col
                      justify-center
                    "
                  >
                    <p
                      className="
                        mb-3

                        text-[10px]
                        font-medium

                        sm:text-[13px]
                      "
                    >
                      Other Images
                    </p>

                    <div
                      className="
                        flex
                        flex-col
                        gap-2
                      "
                    >
                      {featureImages.map(
                        (
                          image,
                          index,
                        ) => (
                          <button
                            key={`${image}-${index}`}
                            type="button"
                            onClick={() =>
                              setSelectedImage(
                                image,
                              )
                            }
                            className={`
                              aspect-[3/4]

                              w-full

                              overflow-hidden

                              rounded-[10px]

                              border-2

                              bg-white

                              ${
                                selectedImage ===
                                image
                                  ? `
                                    border-[#B31345]
                                  `
                                  : `
                                    border-white
                                  `
                              }
                            `}
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
                        ),
                      )}
                    </div>
                  </div>

                  {/* BIG IMAGE */}

                  <Link
                    href={`/product/${encodeURIComponent(
                      featured.slug,
                    )}`}
                    className="
                      flex

                      h-[430px]

                      items-end
                      justify-center

                      overflow-hidden

                      sm:h-[540px]
                    "
                  >
                    {selectedImage ? (
                      <img
                        src={
                          selectedImage
                        }
                        alt={
                          featured.name
                        }
                        className="
                          h-full
                          w-full

                          object-contain
                          object-bottom
                        "
                      />
                    ) : (
                      <div
                        className="
                          flex

                          h-full
                          w-full

                          items-center
                          justify-center

                          text-xs

                          text-black/40
                        "
                      >
                        No image
                      </div>
                    )}
                  </Link>
                </div>

                {/* PRODUCT SELECTORS */}

                <div
                  className="
                    -mx-3
                    mt-3

                    flex

                    snap-x
                    snap-mandatory

                    gap-2

                    overflow-x-auto

                    px-3
                    pb-2

                    [scrollbar-width:none]

                    [&::-webkit-scrollbar]:hidden
                  "
                >
                  {products
                    .slice(
                      0,
                      5,
                    )
                    .map(
                      (
                        product,
                        index,
                      ) => (
                        <button
                          key={
                            product.variantKey
                          }
                          type="button"
                          onClick={() =>
                            selectProduct(
                              index,
                            )
                          }
                          className={`
                            aspect-square

                            w-[30vw]
                            max-w-[130px]

                            shrink-0

                            snap-center

                            overflow-hidden

                            rounded-[12px]

                            border-2

                            bg-white

                            ${
                              selectedIndex ===
                              index
                                ? `
                                  border-[#292526]
                                `
                                : `
                                  border-black/10
                                `
                            }
                          `}
                        >
                          {product.image1 ? (
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
                          ) : null}
                        </button>
                      ),
                    )}
                </div>

                {/* MOBILE PRODUCT INFO */}

                <div
                  className="
                    mt-4

                    overflow-hidden

                    rounded-[15px]

                    bg-white

                    shadow-sm
                  "
                >
                  <div
                    className="
                      bg-[#292727]

                      px-4
                      py-4

                      text-white
                    "
                  >
                    <span
                      className="
                        inline-flex

                        rounded-full

                        bg-white/15

                        px-3
                        py-1

                        text-[8px]
                      "
                    >
                      New
                    </span>

                    <h2
                      className="
                        mt-2

                        line-clamp-2

                        text-[13px]
                        font-semibold
                      "
                    >
                      {
                        featured.name
                      }
                    </h2>

                    {featured.colorName ? (
                      <p
                        className="
                          mt-1

                          text-[9px]

                          text-white/65
                        "
                      >
                        Color:{" "}

                        {
                          featured.colorName
                        }
                      </p>
                    ) : null}
                  </div>

                  <div
                    className="
                      p-4
                    "
                  >
                    {/* PRICE */}

                    <div
                      className="
                        flex
                        flex-wrap
                        items-center

                        gap-2
                      "
                    >
                      <strong
                        className="
                          text-[18px]
                        "
                      >
                        {money(
                          featured.showPrice,
                        )}
                      </strong>

                      {featured.originalPrice >
                      featured.showPrice ? (
                        <span
                          className="
                            text-[10px]

                            text-black/35

                            line-through
                          "
                        >
                          {money(
                            featured.originalPrice,
                          )}
                        </span>
                      ) : null}

                      {featured.discountPercent >
                      0 ? (
                        <span
                          className="
                            rounded-full

                            bg-[#F7E4EA]

                            px-2.5
                            py-1

                            text-[8px]
                            font-bold

                            text-[#B31345]
                          "
                        >
                          {
                            featured.discountPercent
                          }
                          % OFF
                        </span>
                      ) : null}
                    </div>

                    {/* ACTIONS */}

                    <div
                      className="
                        mt-4

                        grid

                        grid-cols-[1fr_auto_auto]

                        gap-2
                      "
                    >
                      <Link
                        href={`/product/${encodeURIComponent(
                          featured.slug,
                        )}`}
                        className="
                          flex
                          h-10

                          items-center
                          justify-center

                          rounded-[7px]

                          border
                          border-[#292526]

                          px-3

                          text-[8px]
                          font-bold
                          uppercase
                        "
                      >
                        Explore
                      </Link>

                      <button
                        type="button"
                        disabled={
                          commerce.isWishlistBusy(
                            featured,
                          )
                        }
                        onClick={() => {
                          void commerce.toggleWishlist(
                            featured,
                          );
                        }}
                        className="
                          grid

                          h-10
                          w-10

                          place-items-center

                          rounded-[7px]

                          bg-[#292526]

                          text-[17px]

                          text-white
                        "
                      >
                        {commerce.isWishlisted(
                          featured,
                        )
                          ? "♥"
                          : "♡"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          void commerce.openAddToBag(
                            featured,
                          );
                        }}
                        className="
                          h-10

                          rounded-[7px]

                          bg-[#EC477C]

                          px-4

                          text-[8px]
                          font-bold
                          uppercase

                          text-white
                        "
                      >
                        Add to Bag
                      </button>
                    </div>
                  </div>
                </div>

                {/* MOBILE PREV NEXT */}

                {products.length >
                1 ? (
                  <div
                    className="
                      mt-4

                      flex

                      justify-end

                      gap-2
                    "
                  >
                    <button
                      type="button"
                      aria-label="Previous new launch product"
                      onClick={
                        previousFeaturedProduct
                      }
                      className="
                        grid

                        h-9
                        w-9

                        place-items-center

                        rounded-[5px]

                        bg-[#292727]

                        text-[19px]

                        text-white
                      "
                    >
                      ‹
                    </button>

                    <button
                      type="button"
                      aria-label="Next new launch product"
                      onClick={
                        nextFeaturedProduct
                      }
                      className="
                        grid

                        h-9
                        w-9

                        place-items-center

                        rounded-[5px]

                        bg-[#292727]

                        text-[19px]

                        text-white
                      "
                    >
                      ›
                    </button>
                  </div>
                ) : null}
              </div>

              {/* =============================================
                  DESKTOP
              ============================================= */}

              <div
                className="
                  hidden

                  gap-8

                  lg:grid
                  lg:grid-cols-[1.08fr_.92fr]
                "
              >
                {/* ===========================================
                    LEFT
                =========================================== */}

                <div
                  className="
                    grid

                    grid-cols-[175px_minmax(0,1fr)]

                    gap-5

                    xl:grid-cols-[190px_minmax(0,1fr)]
                  "
                >
                  {/* OTHER IMAGES */}

                  <div
                    className="
                      flex
                      flex-col
                      justify-center
                    "
                  >
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
                          index,
                        ) => (
                          <button
                            key={`${image}-${index}`}
                            type="button"
                            onClick={() =>
                              setSelectedImage(
                                image,
                              )
                            }
                            className={`
                              aspect-[3/4]

                              overflow-hidden

                              rounded-[12px]

                              border-2

                              bg-white

                              ${
                                selectedImage ===
                                image
                                  ? `
                                    border-[#292526]
                                  `
                                  : `
                                    border-white
                                  `
                              }
                            `}
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
                        ),
                      )}
                    </div>
                  </div>

                  {/* MAIN PRODUCT */}

                  <Link
                    href={`/product/${encodeURIComponent(
                      featured.slug,
                    )}`}
                    className="
                      flex

                      h-[560px]

                      items-end
                      justify-center

                      overflow-hidden
                    "
                  >
                    {selectedImage ? (
                      <img
                        src={
                          selectedImage
                        }
                        alt={
                          featured.name
                        }
                        className="
                          h-full
                          w-full

                          object-contain
                          object-bottom
                        "
                      />
                    ) : (
                      <div
                        className="
                          flex

                          h-full
                          w-full

                          items-center
                          justify-center

                          text-xs

                          text-black/40
                        "
                      >
                        No image
                      </div>
                    )}
                  </Link>
                </div>

                {/* ===========================================
                    RIGHT
                =========================================== */}

                <div
                  className="
                    flex
                    min-w-0
                    flex-col
                    justify-center
                  "
                >
                  {/* PRODUCT VARIANTS */}

                  <div
                    className="
                      flex

                      gap-3

                      overflow-x-auto

                      pb-2

                      [scrollbar-width:none]

                      [&::-webkit-scrollbar]:hidden
                    "
                  >
                    {products
                      .slice(
                        0,
                        5,
                      )
                      .map(
                        (
                          product,
                          index,
                        ) => (
                          <button
                            key={
                              product.variantKey
                            }
                            type="button"
                            onClick={() =>
                              selectProduct(
                                index,
                              )
                            }
                            className={`
                              aspect-square

                              w-[145px]

                              shrink-0

                              overflow-hidden

                              rounded-[14px]

                              border

                              bg-white

                              ${
                                selectedIndex ===
                                index
                                  ? `
                                    border-[#292526]
                                  `
                                  : `
                                    border-black/20
                                  `
                              }
                            `}
                          >
                            {product.image1 ? (
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
                            ) : null}
                          </button>
                        ),
                      )}
                  </div>

                  {/* PRODUCT INFO */}

                  <div
                    className="
                      mt-4

                      overflow-hidden

                      rounded-[18px]

                      bg-white
                    "
                  >
                    {/* DARK HEADER */}

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

                          line-clamp-2

                          text-xl
                          font-semibold
                        "
                      >
                        {
                          featured.name
                        }
                      </h2>

                      {featured.colorName ? (
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
                      ) : null}
                    </div>

                    {/* WHITE AREA */}

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
                          {money(
                            featured.showPrice,
                          )}
                        </strong>

                        {featured.originalPrice >
                        featured.showPrice ? (
                          <span
                            className="
                              text-sm

                              text-black/35

                              line-through
                            "
                          >
                            {money(
                              featured.originalPrice,
                            )}
                          </span>
                        ) : null}

                        {featured.discountPercent >
                        0 ? (
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
                        ) : null}
                      </div>

                      {/* BUTTONS */}

                      <div
                        className="
                          mt-6

                          grid

                          grid-cols-[1fr_auto_1fr]

                          gap-3
                        "
                      >
                        <Link
                          href={`/product/${encodeURIComponent(
                            featured.slug,
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
                          disabled={
                            commerce.isWishlistBusy(
                              featured,
                            )
                          }
                          onClick={() => {
                            void commerce.toggleWishlist(
                              featured,
                            );
                          }}
                          className="
                            grid

                            h-11
                            w-11

                            place-items-center

                            rounded-lg

                            bg-[#292526]

                            text-lg

                            text-white
                          "
                        >
                          {commerce.isWishlisted(
                            featured,
                          )
                            ? "♥"
                            : "♡"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            void commerce.openAddToBag(
                              featured,
                            );
                          }}
                          className="
                            h-11

                            rounded-lg

                            bg-[#292526]

                            text-xs
                            font-semibold

                            text-white

                            transition

                            hover:bg-[#B31345]
                          "
                        >
                          ADD TO BAG
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* DESKTOP PREVIOUS / NEXT */}

                  {products.length >
                  1 ? (
                    <div
                      className="
                        mt-5

                        flex

                        items-center
                        justify-end

                        gap-2
                      "
                    >
                      <button
                        type="button"
                        aria-label="Previous new launch product"
                        onClick={
                          previousFeaturedProduct
                        }
                        className="
                          grid

                          h-9
                          w-9

                          place-items-center

                          rounded-[5px]

                          bg-[#292727]

                          text-[19px]

                          text-white

                          shadow-sm

                          transition

                          hover:bg-[#B31345]
                        "
                      >
                        ‹
                      </button>

                      <button
                        type="button"
                        aria-label="Next new launch product"
                        onClick={
                          nextFeaturedProduct
                        }
                        className="
                          grid

                          h-9
                          w-9

                          place-items-center

                          rounded-[5px]

                          bg-[#292727]

                          text-[19px]

                          text-white

                          shadow-sm

                          transition

                          hover:bg-[#B31345]
                        "
                      >
                        ›
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          ) : (
            <div
              className="
                py-24

                text-center

                text-black/50
              "
            >
              No new launch
              products available
              for {gender}.
            </div>
          )}
        </div>
      </section>

      {/* ===================================================
          3. CATEGORY ROW
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
          4. FRESH STYLES

          IMPORTANT:

          ❌ NO CATEGORY/BANNER BACKGROUND IMAGE
          ✅ SIMPLE LIGHT BACKGROUND
      =================================================== */}

      <section
        className="
          relative

          overflow-hidden

          bg-[#F3F1EF]

          px-3
          py-10

          sm:px-5
          sm:py-12

          lg:px-10
          lg:py-16
        "
      >
        <div
          className="
            relative
            z-10

            mx-auto

            max-w-[1380px]
          "
        >
          {/* HEADER */}

          <div
            className="
              mb-6

              flex

              items-start
              justify-between

              gap-3

              sm:mb-8
              sm:items-center
            "
          >
            <div
              className="
                text-[#292526]
              "
            >
              <p
                className="
                  text-[8px]

                  font-semibold
                  uppercase

                  tracking-[0.22em]

                  text-[#8B7468]

                  sm:text-[10px]
                "
              >
                Just Dropped
              </p>

              <h2
                className="
                  mt-1

                  text-[27px]
                  font-black
                  uppercase

                  tracking-[-0.03em]

                  sm:text-[34px]

                  lg:text-[44px]
                "
              >
                Fresh Styles
              </h2>
            </div>

            {/* LIGHT TOGGLE */}

            <GenderToggle
              gender={
                gender
              }
              onChange={
                setGender
              }
            />
          </div>

          {/* PRODUCTS */}

          {products.length ? (
            <div
              ref={
                railRef
              }
              className="
                flex

                snap-x
                snap-mandatory

                gap-3

                overflow-x-auto

                pb-4

                [scrollbar-width:none]

                [&::-webkit-scrollbar]:hidden

                sm:gap-4
              "
            >
              {products.map(
                (
                  product,
                ) => (
                  <div
                    key={
                      product.variantKey
                    }
                    className="
                      w-[72vw]
                      max-w-[255px]

                      shrink-0

                      snap-start

                      sm:w-[300px]
                      sm:max-w-none

                      lg:w-[260px]

                      xl:w-[285px]
                    "
                  >
                    <StorefrontProductCard
                      product={
                        product
                      }
                      overlay
                    />
                  </div>
                ),
              )}
            </div>
          ) : (
            <div
              className="
                rounded-[15px]

                border
                border-black/5

                bg-white

                px-5
                py-12

                text-center

                text-sm

                text-black/50
              "
            >
              No {gender} new
              launch products
              available.
            </div>
          )}

          {/* FRESH STYLE ARROWS */}

          {products.length >
          1 ? (
            <div
              className="
                mt-3

                flex

                justify-center

                gap-3

                sm:justify-end
              "
            >
              <button
                type="button"
                aria-label="Previous products"
                onClick={() =>
                  scrollRail(
                    "left",
                  )
                }
                className="
                  grid

                  h-10
                  w-10

                  place-items-center

                  rounded-full

                  bg-[#292727]

                  text-xl

                  text-white

                  shadow-md

                  transition

                  hover:bg-[#B31345]

                  lg:h-11
                  lg:w-11
                "
              >
                ‹
              </button>

              <button
                type="button"
                aria-label="Next products"
                onClick={() =>
                  scrollRail(
                    "right",
                  )
                }
                className="
                  grid

                  h-10
                  w-10

                  place-items-center

                  rounded-full

                  bg-[#292727]

                  text-xl

                  text-white

                  shadow-md

                  transition

                  hover:bg-[#B31345]

                  lg:h-11
                  lg:w-11
                "
              >
                ›
              </button>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}