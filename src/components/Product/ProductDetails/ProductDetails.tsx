"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  getDefaultColor,
  getProductImageUrls,
  getProductName,
  getProductPrices,
  type ApiColor,
  type ApiProduct,
} from "@/src/services/products";

/* =========================================================
   TYPE
========================================================= */

export type ProductDetailsData =
  ApiProduct;

type ProductDetailsProps = {
  product: ProductDetailsData;

  /*
   * Current URL slug:
   *
   * mens-light-green-cotton-brief
   * mens-dark-green-cotton-brief
   */
  currentSlug: string;
};

/* =========================================================
   CLEAN HTML
========================================================= */

function cleanDescriptionHtml(
  html?: string
) {
  if (
    typeof html !==
    "string"
  ) {
    return "";
  }

  return html
    .replace(
      /<script\b[^>]*>[\s\S]*?<\/script>/gi,
      ""
    )
    .replace(
      /<(iframe|object|embed)\b[^>]*>[\s\S]*?<\/\1>/gi,
      ""
    )
    .replace(
      /\son\w+\s*=\s*"[^"]*"/gi,
      ""
    )
    .replace(
      /\son\w+\s*=\s*'[^']*'/gi,
      ""
    )
    .replace(
      /javascript:/gi,
      ""
    );
}

/* =========================================================
   GET FIRST NUMBER
========================================================= */

function firstNumber(
  ...values: unknown[]
) {
  for (
    const value of values
  ) {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      continue;
    }

    const number =
      Number(value);

    if (
      Number.isFinite(
        number
      )
    ) {
      return number;
    }
  }

  return undefined;
}

/* =========================================================
   COMPONENT
========================================================= */

export default function ProductDetails({
  product,
  currentSlug,
}: ProductDetailsProps) {
  const router =
    useRouter();

  /* =======================================================
     COLORS
  ======================================================= */

  const activeColors =
    useMemo(() => {
      if (
        !Array.isArray(
          product.colors
        )
      ) {
        return [];
      }

      return product.colors.filter(
        (color) =>
          color?.isActive !==
          false
      );
    }, [
      product.colors,
    ]);

  /* =======================================================
     FIND COLOR FROM CURRENT URL SLUG

     Example:

     URL:
     mens-dark-green-cotton-brief

     colors[].slugProduct:
     mens-dark-green-cotton-brief

     => Dark Green selected
  ======================================================= */

  const urlColorIndex =
    useMemo(() => {
      if (
        !currentSlug
      ) {
        return -1;
      }

      return activeColors.findIndex(
        (color) =>
          String(
            color?.slugProduct ||
              ""
          ) === currentSlug
      );
    }, [
      activeColors,
      currentSlug,
    ]);

  /* =======================================================
     DEFAULT COLOR
  ======================================================= */

  const defaultColorIndex =
    useMemo(() => {
      /*
       * URL slug has highest priority.
       */

      if (
        urlColorIndex >= 0
      ) {
        return urlColorIndex;
      }

      /*
       * Otherwise backend default color.
       */

      const backendDefaultIndex =
        activeColors.findIndex(
          (color) =>
            color?.isDefault ===
            true
        );

      if (
        backendDefaultIndex >=
        0
      ) {
        return backendDefaultIndex;
      }

      return 0;
    }, [
      activeColors,
      urlColorIndex,
    ]);

  /* =======================================================
     STATE
  ======================================================= */

  const [
    selectedColorIndex,
    setSelectedColorIndex,
  ] =
    useState(
      defaultColorIndex
    );

  const [
    selectedSizeIndex,
    setSelectedSizeIndex,
  ] =
    useState<
      number | null
    >(null);

  const [
    activeImageIndex,
    setActiveImageIndex,
  ] =
    useState(0);

  const [
    quantity,
    setQuantity,
  ] =
    useState(1);

  /* =======================================================
     SYNC COLOR WHEN URL CHANGES

     /light-green
           ↓ click Dark Green
     /dark-green
           ↓
     selectedColorIndex = dark green
  ======================================================= */

  useEffect(() => {
    setSelectedColorIndex(
      defaultColorIndex
    );

    setSelectedSizeIndex(
      null
    );

    setActiveImageIndex(
      0
    );

    setQuantity(
      1
    );
  }, [
    defaultColorIndex,
    currentSlug,
  ]);

  /* =======================================================
     SELECTED COLOR
  ======================================================= */

  const selectedColor =
    activeColors[
      selectedColorIndex
    ] ||
    getDefaultColor(
      product
    );

  /* =======================================================
     IMAGES
  ======================================================= */

  const images =
    useMemo(() => {
      const colorImages =
        Array.isArray(
          selectedColor?.images
        )
          ? selectedColor.images.filter(
              (image) =>
                Boolean(
                  image?.url
                )
            )
          : [];

      if (
        colorImages.length >
        0
      ) {
        const defaultImage =
          colorImages.find(
            (image) =>
              image?.isDefault ===
              true
          );

        return [
          ...(defaultImage
            ? [defaultImage]
            : []),

          ...colorImages.filter(
            (image) =>
              image !==
              defaultImage
          ),
        ];
      }

      /*
       * Fallback
       */

      return getProductImageUrls(
        product
      ).map(
        (url) => ({
          url,
        })
      );
    }, [
      product,
      selectedColor,
    ]);

  /* =======================================================
     SIZES
  ======================================================= */

  const sizes =
    useMemo(() => {
      if (
        !Array.isArray(
          selectedColor?.sizes
        )
      ) {
        return [];
      }

      return selectedColor.sizes.filter(
        (size) =>
          size?.isActive !==
          false
      );
    }, [
      selectedColor,
    ]);

  const selectedSize =
    selectedSizeIndex !==
    null
      ? sizes[
          selectedSizeIndex
        ]
      : undefined;

  /* =======================================================
     TOTAL STOCK
  ======================================================= */

  const totalStock =
    activeColors.reduce(
      (
        total,
        color
      ) => {
        const colorSizes =
          Array.isArray(
            color?.sizes
          )
            ? color.sizes
            : [];

        return (
          total +
          colorSizes.reduce(
            (
              sum,
              size
            ) => {
              if (
                size
                  ?.isActive ===
                false
              ) {
                return sum;
              }

              return (
                sum +
                Math.max(
                  0,
                  Number(
                    size
                      ?.stock ||
                      0
                  )
                )
              );
            },
            0
          )
        );
      },
      0
    );

  /* =======================================================
     CURRENT COLOR STOCK
  ======================================================= */

  const selectedColorStock =
    sizes.reduce(
      (
        total,
        size
      ) =>
        total +
        Math.max(
          0,
          Number(
            size?.stock ||
              0
          )
        ),
      0
    );

  /* =======================================================
     CURRENT STOCK
  ======================================================= */

  const currentStock =
    selectedSize
      ? Math.max(
          0,
          Number(
            selectedSize
              ?.stock ||
              0
          )
        )
      : selectedColor
        ? selectedColorStock
        : totalStock;

  /* =======================================================
     NAME

     Name automatically selected color se badlega.
  ======================================================= */

  const name =
    selectedColor
      ?.nameProduct ||
    getProductName(
      product
    );

  /* =======================================================
     DESCRIPTION
  ======================================================= */

  const shortDescription =
    selectedColor
      ?.shortDescription ||
    product.shortDescription ||
    "";

  const descriptionHtml =
    cleanDescriptionHtml(
      selectedColor
        ?.description ||
        product.description
    );

  /* =======================================================
     PRICES
  ======================================================= */

  const basePrices =
    getProductPrices(
      product
    );

  const sellingPrice =
    firstNumber(
      selectedSize
        ?.discountedPrice,

      selectedSize
        ?.salePrice,

      selectedSize
        ?.sellingPrice,

      selectedSize?.price,

      selectedColor
        ?.discountedPrice,

      selectedColor
        ?.salePrice,

      selectedColor
        ?.sellingPrice,

      selectedColor?.price,

      basePrices.sellingPrice
    ) ?? 0;

  const comparePrice =
    firstNumber(
      selectedSize
        ?.compareAtPrice,

      selectedSize
        ?.actualPrice,

      selectedSize
        ?.originalPrice,

      selectedSize?.mrp,

      selectedColor
        ?.compareAtPrice,

      selectedColor
        ?.actualPrice,

      selectedColor
        ?.originalPrice,

      selectedColor?.mrp,

      basePrices.actualPrice
    ) ??
    sellingPrice;

  const actualPrice =
    comparePrice >
    sellingPrice
      ? comparePrice
      : sellingPrice;

  const discount =
    actualPrice >
      sellingPrice &&
    actualPrice >
      0
      ? Math.round(
          ((actualPrice -
            sellingPrice) /
            actualPrice) *
            100
        )
      : 0;

  /* =======================================================
     SELECT COLOR

     ⭐ MAIN FIX

     Color select
       ↓
     local state update
       ↓
     color.slugProduct
       ↓
     router.push()
       ↓
     browser URL changes
  ======================================================= */

  const selectColor = (
    index: number
  ) => {
    const color =
      activeColors[
        index
      ];

    if (!color) {
      return;
    }

    /* LOCAL UI UPDATE */

    setSelectedColorIndex(
      index
    );

    setSelectedSizeIndex(
      null
    );

    setActiveImageIndex(
      0
    );

    setQuantity(
      1
    );

    /* =====================================================
       URL SLUG UPDATE
    ===================================================== */

    const nextSlug =
      String(
        color.slugProduct ||
          ""
      ).trim();

    if (
      nextSlug &&
      nextSlug !==
        currentSlug
    ) {
      router.push(
        `/product/${encodeURIComponent(
          nextSlug
        )}`,
        {
          scroll: false,
        }
      );
    }
  };

  /* =======================================================
     SELECT SIZE
  ======================================================= */

  const selectSize = (
    index: number
  ) => {
    const size =
      sizes[index];

    if (
      !size ||
      size.isActive ===
        false ||
      Number(
        size.stock ||
          0
      ) <= 0
    ) {
      return;
    }

    setSelectedSizeIndex(
      index
    );

    setQuantity(
      1
    );
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main
      className="
        min-h-screen
        bg-white
        text-[#292526]
      "
    >
      <section
        className="
          mx-auto

          grid
          w-full
          max-w-[1180px]

          grid-cols-1
          gap-8

          px-4
          pb-12
          pt-8

          md:px-6

          lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)]
          lg:gap-12
        "
      >
        {/* =================================================
            PRODUCT IMAGE
        ================================================= */}

        <div>
          <div
            className="
              relative

              aspect-[4/5]

              overflow-hidden

              rounded-xl

              bg-[#f3f3f3]
            "
          >
            {images.length >
            0 ? (
              <img
                src={
                  images[
                    Math.min(
                      activeImageIndex,
                      images.length -
                        1
                    )
                  ]?.url
                }
                alt={
                  name
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
                  grid
                  h-full
                  place-items-center

                  text-sm
                  text-black/35
                "
              >
                No Product Image
              </div>
            )}
          </div>

          {/* IMAGE THUMBNAILS */}

          {images.length >
            1 && (
            <div
              className="
                mt-3

                flex
                gap-3

                overflow-x-auto

                pb-1
              "
            >
              {images.map(
                (
                  image,
                  index
                ) => (
                  <button
                    key={`${("publicId" in image && image.publicId) || image.url}-${index}`}
                    type="button"
                    onClick={() =>
                      setActiveImageIndex(
                        index
                      )
                    }
                    className={`
                      h-20
                      w-16
                      shrink-0

                      overflow-hidden

                      rounded-lg

                      border-2

                      ${
                        activeImageIndex ===
                        index
                          ? "border-[#8C1839]"
                          : "border-transparent"
                      }
                    `}
                  >
                    <img
                      src={
                        image.url
                      }
                      alt={`${name} ${
                        index + 1
                      }`}
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
          )}
        </div>

        {/* =================================================
            RIGHT DETAILS
        ================================================= */}

        <div
          className="
            pt-2
          "
        >
          {/* BADGES */}

          <div
            className="
              flex
              flex-wrap
              gap-2

              text-[9px]
              font-semibold
              uppercase
              tracking-[0.14em]
              text-[#8C1839]
            "
          >
            {product.isNewLaunch && (
              <span>
                New Launch
              </span>
            )}

            {product.isFeatured && (
              <span>
                Featured
              </span>
            )}
          </div>

          {/* NAME */}

          <h1
            className="
              mt-3

              text-2xl
              font-semibold
              leading-tight
              text-[#211A18]

              md:text-3xl
            "
          >
            {name}
          </h1>

          {shortDescription && (
            <p
              className="
                mt-4
                max-w-xl

                text-sm
                leading-6
                text-[#211A18]/60
              "
            >
              {
                shortDescription
              }
            </p>
          )}

          {/* =================================================
              PRICE
          ================================================= */}

          <div
            className="
              mt-6

              flex
              flex-wrap
              items-center
              gap-3
            "
          >
            <span
              className="
                text-[24px]
                font-semibold
                text-[#211A18]
              "
            >
              ₹
              {sellingPrice.toLocaleString(
                "en-IN"
              )}
            </span>

            {actualPrice >
              sellingPrice && (
              <>
                <span
                  className="
                    text-[14px]
                    text-[#211A18]/35
                    line-through
                  "
                >
                  ₹
                  {actualPrice.toLocaleString(
                    "en-IN"
                  )}
                </span>

                <span
                  className="
                    rounded-full

                    bg-[#F8E5E8]

                    px-3
                    py-1.5

                    text-[9px]
                    font-semibold
                    text-[#8C1839]
                  "
                >
                  {discount}% OFF
                </span>
              </>
            )}
          </div>

          {/* =================================================
              COLORS
          ================================================= */}

          {activeColors.length >
            0 && (
            <div
              className="
                mt-8
              "
            >
              <div
                className="
                  text-sm
                  font-semibold
                "
              >
                Color:{" "}

                <span
                  className="
                    font-normal
                    text-black/55
                  "
                >
                  {
                    selectedColor
                      ?.nameColor
                  }
                </span>
              </div>

              <div
                className="
                  mt-4

                  flex
                  flex-wrap
                  gap-3
                "
              >
                {activeColors.map(
                  (
                    color,
                    index
                  ) => {
                    const image =
                      color.images?.find(
                        (
                          item
                        ) =>
                          item.isDefault
                      )?.url ||
                      color.images?.[0]
                        ?.url;

                    const hex =
                      (
                        color as ApiColor & {
                          hex?: string;
                        }
                      ).hex;

                    return (
                      <button
                        key={
                          color._id ||
                          color.slugProduct ||
                          color.slugColor ||
                          index
                        }
                        type="button"
                        onClick={() =>
                          selectColor(
                            index
                          )
                        }
                        title={
                          color.nameProduct ||
                          color.nameColor
                        }
                        className="
                          w-[76px]
                          text-center
                        "
                      >
                        <div
                          className={`
                            aspect-[4/5]

                            overflow-hidden

                            rounded-lg

                            border-2

                            transition

                            ${
                              selectedColorIndex ===
                              index
                                ? "border-[#211A18]"
                                : "border-transparent hover:border-black/20"
                            }
                          `}
                        >
                          {image ? (
                            <img
                              src={
                                image
                              }
                              alt={
                                color.nameProduct ||
                                color.nameColor ||
                                name
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
                                grid
                                h-full
                                place-items-center

                                bg-[#f5f2ef]
                              "
                            >
                              <span
                                className="
                                  h-8
                                  w-8

                                  rounded-full
                                  border
                                "
                                style={{
                                  backgroundColor:
                                    hex ||
                                    "#ddd",
                                }}
                              />
                            </div>
                          )}
                        </div>

                        <span
                          className="
                            mt-1
                            block
                            truncate

                            text-[10px]
                          "
                        >
                          {
                            color.nameColor
                          }
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {/* =================================================
              SIZE
          ================================================= */}

          {sizes.length >
            0 && (
            <div
              className="
                mt-8
              "
            >
              <div
                className="
                  text-sm
                  font-semibold
                "
              >
                Select Size
              </div>

              <div
                className="
                  mt-3

                  flex
                  flex-wrap
                  gap-3
                "
              >
                {sizes.map(
                  (
                    size,
                    index
                  ) => {
                    const disabled =
                      Number(
                        size.stock ||
                          0
                      ) <= 0;

                    return (
                      <button
                        key={
                          size._id ||
                          `${size.size || size.name}-${index}`
                        }
                        type="button"
                        disabled={
                          disabled
                        }
                        onClick={() =>
                          selectSize(
                            index
                          )
                        }
                        className={`
                          min-w-12

                          rounded-lg

                          border

                          px-4
                          py-3

                          text-xs
                          font-semibold

                          ${
                            selectedSizeIndex ===
                            index
                              ? "border-[#211A18] bg-[#211A18] text-white"
                              : "border-black/20"
                          }

                          ${
                            disabled
                              ? "cursor-not-allowed opacity-30 line-through"
                              : ""
                          }
                        `}
                      >
                        {
                          size.size ||
                          size.name
                        }
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {/* STOCK */}

          <div
            className="
              mt-7
              text-sm
            "
          >
            {currentStock >
            0 ? (
              <span
                className="
                  text-green-700
                "
              >
                In Stock (
                {currentStock})
              </span>
            ) : (
              <span
                className="
                  text-red-600
                "
              >
                Out of Stock
              </span>
            )}
          </div>

          {/* QUANTITY */}

          <div
            className="
              mt-6

              grid
              grid-cols-[130px_1fr]

              gap-3
            "
          >
            <div
              className="
                flex
                h-12
                items-center
                justify-between

                rounded-lg

                border
                border-black/40

                px-4
              "
            >
              <button
                type="button"
                onClick={() =>
                  setQuantity(
                    (
                      value
                    ) =>
                      Math.max(
                        1,
                        value -
                          1
                      )
                  )
                }
              >
                −
              </button>

              <strong>
                {quantity}
              </strong>

              <button
                type="button"
                disabled={
                  quantity >=
                    currentStock ||
                  currentStock <=
                    0
                }
                onClick={() =>
                  setQuantity(
                    (
                      value
                    ) =>
                      Math.min(
                        currentStock,
                        value +
                          1
                      )
                  )
                }
              >
                +
              </button>
            </div>

            <button
              type="button"
              disabled={
                currentStock <=
                  0 ||
                (sizes.length >
                  0 &&
                  !selectedSize)
              }
              className="
                h-12

                rounded-lg

                bg-[#2F2D2D]

                px-5

                text-xs
                font-semibold
                uppercase
                text-white

                transition

                hover:bg-[#9D173E]

                disabled:cursor-not-allowed
                disabled:bg-[#aaa]
              "
            >
              {currentStock <=
              0
                ? "Out Of Stock"
                : sizes.length >
                      0 &&
                    !selectedSize
                  ? "Select Size"
                  : "Add To Bag"}
            </button>
          </div>
        </div>
      </section>

      {/* ===================================================
          DESCRIPTION
      =================================================== */}

      <section
        className="
          border-t
          border-black/10

          px-4
          py-12

          md:px-6
        "
      >
        <div
          className="
            mx-auto
            max-w-[1180px]
          "
        >
          <p
            className="
              text-[9px]
              font-semibold
              uppercase
              tracking-[0.18em]
              text-[#9D173E]
            "
          >
            Product Information
          </p>

          <h2
            className="
              mt-2

              text-2xl
              font-semibold
              text-[#211A18]
            "
          >
            Product Description
          </h2>

          {descriptionHtml ? (
            <div
              className="
                prose

                mt-6

                max-w-4xl

                text-sm
                leading-7
                text-[#554A45]
              "
              dangerouslySetInnerHTML={{
                __html:
                  descriptionHtml,
              }}
            />
          ) : (
            <p
              className="
                mt-5

                text-sm
                text-black/45
              "
            >
              No description
              available.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}   