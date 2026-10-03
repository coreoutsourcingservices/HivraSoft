"use client";

import {
  useEffect,
  useMemo,
<<<<<<< HEAD
=======
  useRef,
>>>>>>> aman
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  getDefaultColor,
<<<<<<< HEAD
  getProductImageUrls,
  getProductName,
  getProductPrices,
  type ApiColor,
  type ApiProduct,
} from "@/src/services/products";

/* =========================================================
   TYPE
=======
  getProductCategorySlugs,
  getProductImageUrls,
  getProductName,
  type ApiColor,
  type ApiProduct,
  type ApiSize,
} from "@/src/services/products";

import {
  useStorefrontCommerce,
} from "@/src/components/Storefront/StorefrontCommerceProvider";

import ProductReviews from "@/src/components/Product/ProductReviews/ProductReviews";

import type {
  CatalogProduct,
  CatalogSize,
} from "@/types/catalog";

/* =========================================================
   TYPES
>>>>>>> aman
========================================================= */

export type ProductDetailsData =
  ApiProduct;

<<<<<<< HEAD
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

=======
type Props = {
  product: ProductDetailsData;
  currentSlug: string;
};

type GalleryImage = {
  url: string;
  publicId?: string;
  isDefault?: boolean;
};

type ProductGalleryProps = {
  images: GalleryImage[];
  name: string;
  wished: boolean;
  wishlistBusy: boolean;
  onBack: () => void;
  onToggleWishlist: () => void;
};

/* =========================================================
   FIELD
========================================================= */

function field(
  source: unknown,
  key: string
): unknown {
  if (
    !source ||
    typeof source !== "object"
  ) {
    return undefined;
  }

  return (
    source as Record<
      string,
      unknown
    >
  )[key];
}

/* =========================================================
   ID
========================================================= */

function getId(
  source: unknown
): string {
  return String(
    field(
      source,
      "_id"
    ) ||
      field(
        source,
        "id"
      ) ||
      ""
  ).trim();
}

/* =========================================================
   POSITIVE NUMBER
========================================================= */

function positiveNumber(
  ...values: unknown[]
): number | undefined {
  for (
    const value of values
  ) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      continue;
    }

    const number =
      Number(value);

    if (
      Number.isFinite(
        number
      ) &&
      number > 0
    ) {
      return number;
    }
  }

  return undefined;
}

>>>>>>> aman
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
<<<<<<< HEAD
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
=======
   GALLERY
========================================================= */

function ProductGallery({
  images,
  name,
  wished,
  wishlistBusy,
  onBack,
  onToggleWishlist,
}: ProductGalleryProps) {
  const [
    active,
    setActive,
  ] =
    useState(0);

  const [
    paused,
    setPaused,
  ] =
    useState(false);

  const [
    zoomOpen,
    setZoomOpen,
  ] =
    useState(false);

  /*
   * IMPORTANT:
   *
   * Pehle scrollIntoView() use ho raha tha.
   * Usse mobile page khud scroll/jump ho raha tha.
   *
   * Ab sirf thumbnail container internally scroll karega.
   */
  const thumbnailContainerRef =
    useRef<
      HTMLDivElement | null
    >(null);

  const thumbnailRefs =
    useRef<
      Array<
        HTMLButtonElement | null
      >
    >([]);

  const touchStart =
    useRef<
      number | null
    >(null);

  /* =======================================================
     RESET WHEN IMAGE SET CHANGES
  ======================================================= */

  useEffect(() => {
    setActive(0);

    const container =
      thumbnailContainerRef.current;

    if (container) {
      container.scrollTo({
        left: 0,
        top: 0,
        behavior: "auto",
      });
    }
  }, [
    images,
  ]);

  /* =======================================================
     AUTO SLIDE
  ======================================================= */

  useEffect(() => {
    if (
      images.length <= 1 ||
      paused ||
      zoomOpen
    ) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          setActive(
            (
              current
            ) =>
              (
                current +
                1
              ) %
              images.length
          );
        },
        3500
      );

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, [
    images.length,
    paused,
    zoomOpen,
  ]);

  /* =======================================================
     ACTIVE THUMB SCROLL

     ONLY THUMBNAIL CONTAINER SCROLLS
  ======================================================= */

  useEffect(() => {
    const container =
      thumbnailContainerRef.current;

    const target =
      thumbnailRefs.current[
        active
      ];

    if (
      !container ||
      !target
    ) {
      return;
    }

    const desktop =
      window.matchMedia(
        "(min-width: 1024px)"
      ).matches;

    if (desktop) {
      const centeredTop =
        target.offsetTop -
        container.clientHeight /
          2 +
        target.clientHeight /
          2;

      container.scrollTo({
        top:
          Math.max(
            0,
            centeredTop
          ),

        behavior:
          "smooth",
      });

      return;
    }

    const centeredLeft =
      target.offsetLeft -
      container.clientWidth /
        2 +
      target.clientWidth /
        2;

    container.scrollTo({
      left:
        Math.max(
          0,
          centeredLeft
        ),

      behavior:
        "smooth",
    });
  }, [
    active,
  ]);

  /* =======================================================
     BODY LOCK FOR ZOOM
  ======================================================= */

  useEffect(() => {
    if (!zoomOpen) {
      return;
    }

    const previous =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previous;
    };
  }, [
    zoomOpen,
  ]);

  /* =======================================================
     PREVIOUS
  ======================================================= */

  const previous =
    () => {
      if (
        images.length ===
        0
      ) {
        return;
      }

      setActive(
        (
          current
        ) =>
          current === 0
            ? images.length -
              1
            : current -
              1
      );
    };

  /* =======================================================
     NEXT
  ======================================================= */

  const next =
    () => {
      if (
        images.length ===
        0
      ) {
        return;
      }

      setActive(
        (
          current
        ) =>
          (
            current +
            1
          ) %
          images.length
      );
    };

  /* =======================================================
     CURRENT
  ======================================================= */

  const current =
    images[
      Math.min(
        active,

        Math.max(
          0,
          images.length -
            1
        )
      )
    ];

  return (
    <>
      <div
        className="
          grid
          gap-3

          lg:grid-cols-[78px_minmax(0,1fr)]
        "
        onMouseEnter={() =>
          setPaused(
            true
          )
        }
        onMouseLeave={() =>
          setPaused(
            false
          )
        }
      >
        {/* =================================================
            THUMBNAILS

            Mobile / Tablet = horizontal below image
            Desktop = vertical left side
        ================================================= */}

        {images.length >
          1 && (
          <div
            ref={
              thumbnailContainerRef
            }
            className="
              order-2

              flex
              gap-2

              overflow-x-auto
              overflow-y-hidden

              overscroll-contain

              pb-1

              [scrollbar-width:none]

              [&::-webkit-scrollbar]:hidden

              lg:order-1
              lg:max-h-[680px]
              lg:flex-col
              lg:overflow-x-hidden
              lg:overflow-y-auto
              lg:pr-1
            "
          >
            {images.map(
              (
                image,
                index
              ) => (
                <button
                  key={`${image.publicId || image.url}-${index}`}
                  ref={(
                    element
                  ) => {
                    thumbnailRefs.current[
                      index
                    ] =
                      element;
                  }}
                  type="button"
                  onClick={() =>
                    setActive(
                      index
                    )
                  }
                  onMouseEnter={() => {
                    /*
                     * Desktop hover only.
                     * Mobile touch par unwanted hover switching nahi.
                     */
                    if (
                      window.matchMedia(
                        "(min-width: 1024px)"
                      ).matches
                    ) {
                      setActive(
                        index
                      );
                    }
                  }}
                  className={`
                    h-[72px]
                    w-[58px]

                    flex-none

                    cursor-pointer

                    overflow-hidden

                    rounded-[8px]

                    border-2

                    bg-[#F4F1EF]

                    transition

                    sm:h-[82px]
                    sm:w-[66px]

                    lg:h-[94px]
                    lg:w-[74px]

                    ${
                      active ===
                      index
                        ? "border-[#B31345]"
                        : "border-transparent hover:border-black/20"
                    }
                  `}
                >
                  <img
                    src={
                      image.url
                    }
                    alt={`${name} ${
                      index +
                      1
                    }`}
                    draggable={
                      false
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
        )}

        {/* =================================================
            MAIN IMAGE
        ================================================= */}

        <div
          className="
            order-1
            min-w-0

            lg:order-2
          "
        >
          <div
            className="
              group

              relative

              aspect-[4/5]

              w-full

              overflow-hidden

              rounded-[14px]

              bg-[#F4F1EF]
            "
            onTouchStart={(
              event
            ) => {
              touchStart.current =
                event.touches[0]
                  ?.clientX ??
                null;
            }}
            onTouchEnd={(
              event
            ) => {
              if (
                touchStart.current ===
                null
              ) {
                return;
              }

              const end =
                event.changedTouches[0]
                  ?.clientX ??
                touchStart.current;

              const difference =
                end -
                touchStart.current;

              if (
                Math.abs(
                  difference
                ) >
                45
              ) {
                if (
                  difference >
                  0
                ) {
                  previous();
                } else {
                  next();
                }
              }

              touchStart.current =
                null;
            }}
          >
            {/* =============================================
                MOBILE / TABLET ACTIONS

                Back + Wishlist SAME image wrapper ke andar.
                Image next/refresh hone par position change nahi hogi.
            ============================================= */}

            <div
              className="
                pointer-events-none

                absolute
                left-3
                right-3
                top-3
                z-40

                flex
                items-center
                justify-between

                lg:hidden
              "
            >
              {/* BACK */}

              <button
                type="button"
                aria-label="Go back"
                onClick={(
                  event
                ) => {
                  event.preventDefault();

                  event.stopPropagation();

                  onBack();
                }}
                className="
                  pointer-events-auto

                  flex
                  h-10
                  w-10

                  cursor-pointer

                  items-center
                  justify-center

                  rounded-full

                  border
                  border-black/[0.06]

                  bg-white/95

                  text-[#211A18]

                  shadow-[0_3px_14px_rgba(0,0,0,.14)]

                  backdrop-blur

                  transition-transform

                  active:scale-95
                "
              >
                <BackIcon />
              </button>

              {/* WISHLIST */}

              <button
                type="button"
                aria-label={
                  wished
                    ? "Remove from wishlist"
                    : "Add to wishlist"
                }
                disabled={
                  wishlistBusy
                }
                onClick={(
                  event
                ) => {
                  event.preventDefault();

                  event.stopPropagation();

                  onToggleWishlist();
                }}
                className="
                  pointer-events-auto

                  flex
                  h-10
                  w-10

                  cursor-pointer

                  items-center
                  justify-center

                  rounded-full

                  border
                  border-black/[0.06]

                  bg-white/95

                  shadow-[0_3px_14px_rgba(0,0,0,.14)]

                  backdrop-blur

                  transition-transform

                  active:scale-95

                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <GalleryHeartIcon
                  filled={
                    wished
                  }
                />
              </button>
            </div>

            {/* =============================================
                CURRENT IMAGE
            ============================================= */}

            {current ? (
              <img
                src={
                  current.url
                }
                alt={
                  name
                }
                draggable={
                  false
                }
                onDoubleClick={() =>
                  setZoomOpen(
                    true
                  )
                }
                className="
                  h-full
                  w-full

                  cursor-zoom-in

                  object-cover

                  transition-transform
                  duration-500

                  group-hover:scale-[1.015]
                "
              />
            ) : (
              <div
                className="
                  grid
                  h-full
                  place-items-center

                  text-sm

                  text-black/30
                "
              >
                No Image
              </div>
            )}

            {/* =============================================
                PREVIOUS / NEXT

                Mobile = Swipe
                Tablet/Desktop = buttons
            ============================================= */}

            {images.length >
              1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={(
                    event
                  ) => {
                    event.preventDefault();

                    event.stopPropagation();

                    previous();
                  }}
                  className="
                    absolute
                    left-3
                    top-1/2
                    z-20

                    hidden
                    h-10
                    w-10

                    -translate-y-1/2

                    cursor-pointer

                    items-center
                    justify-center

                    rounded-full

                    bg-white/90

                    text-2xl

                    shadow

                    opacity-0

                    transition

                    hover:bg-white

                    md:flex
                    md:opacity-100

                    lg:opacity-0
                    lg:group-hover:opacity-100
                  "
                >
                  ‹
                </button>

                <button
                  type="button"
                  aria-label="Next image"
                  onClick={(
                    event
                  ) => {
                    event.preventDefault();

                    event.stopPropagation();

                    next();
                  }}
                  className="
                    absolute
                    right-3
                    top-1/2
                    z-20

                    hidden
                    h-10
                    w-10

                    -translate-y-1/2

                    cursor-pointer

                    items-center
                    justify-center

                    rounded-full

                    bg-white/90

                    text-2xl

                    shadow

                    opacity-0

                    transition

                    hover:bg-white

                    md:flex
                    md:opacity-100

                    lg:opacity-0
                    lg:group-hover:opacity-100
                  "
                >
                  ›
                </button>
              </>
            )}

            {/* =============================================
                DESKTOP ZOOM BUTTON
            ============================================= */}

            {current && (
              <button
                type="button"
                aria-label="Zoom image"
                onClick={() =>
                  setZoomOpen(
                    true
                  )
                }
                className="
                  absolute
                  right-3
                  top-3
                  z-30

                  hidden
                  h-10
                  w-10

                  cursor-pointer

                  items-center
                  justify-center

                  rounded-full

                  bg-white/90

                  text-lg

                  shadow

                  lg:flex
                "
              >
                ⛶
              </button>
            )}

            {/* =============================================
                DOTS
            ============================================= */}

            {images.length >
              1 && (
              <div
                className="
                  absolute
                  bottom-3
                  left-1/2
                  z-30

                  flex
                  -translate-x-1/2

                  gap-1.5
                "
              >
                {images.map(
                  (
                    _,
                    index
                  ) => (
                    <button
                      key={
                        index
                      }
                      type="button"
                      aria-label={`Show image ${
                        index +
                        1
                      }`}
                      onClick={(
                        event
                      ) => {
                        event.preventDefault();

                        event.stopPropagation();

                        setActive(
                          index
                        );
                      }}
                      className={`
                        h-2

                        cursor-pointer

                        rounded-full

                        transition-all

                        ${
                          active ===
                          index
                            ? "w-5 bg-[#EC4F83]"
                            : "w-2 bg-white/75"
                        }
                      `}
                    />
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===================================================
          FULLSCREEN ZOOM
      =================================================== */}

      {zoomOpen &&
        current && (
        <div
          className="
            fixed
            inset-0
            z-[20000]

            flex
            items-center
            justify-center

            bg-black/90

            p-4
          "
          onMouseDown={(
            event
          ) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setZoomOpen(
                false
              );
            }
          }}
        >
          {/* CLOSE */}

          <button
            type="button"
            aria-label="Close zoom"
            onClick={() =>
              setZoomOpen(
                false
              )
            }
            className="
              absolute
              right-4
              top-4
              z-30

              flex
              h-11
              w-11

              cursor-pointer

              items-center
              justify-center

              rounded-full

              bg-white

              text-2xl
            "
          >
            ×
          </button>

          {/* FULLSCREEN ARROWS */}

          {images.length >
            1 && (
            <>
              <button
                type="button"
                aria-label="Previous image"
                onClick={
                  previous
                }
                className="
                  absolute
                  left-3
                  top-1/2
                  z-30

                  flex
                  h-11
                  w-11

                  -translate-y-1/2

                  cursor-pointer

                  items-center
                  justify-center

                  rounded-full

                  bg-white/90

                  text-2xl

                  sm:left-5
                "
              >
                ‹
              </button>

              <button
                type="button"
                aria-label="Next image"
                onClick={
                  next
                }
                className="
                  absolute
                  right-3
                  top-1/2
                  z-30

                  flex
                  h-11
                  w-11

                  -translate-y-1/2

                  cursor-pointer

                  items-center
                  justify-center

                  rounded-full

                  bg-white/90

                  text-2xl

                  sm:right-5
                "
              >
                ›
              </button>
            </>
          )}

          <img
            src={
              current.url
            }
            alt={
              name
            }
            draggable={
              false
            }
            className="
              max-h-[92vh]
              max-w-[92vw]

              select-none

              object-contain
            "
          />
        </div>
      )}
    </>
  );
}

/* =========================================================
   GALLERY ICONS
========================================================= */

function BackIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function GalleryHeartIcon({
  filled,
}: {
  filled: boolean;
}) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={
        filled
          ? "#B31345"
          : "transparent"
      }
      stroke="#B31345"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z" />
    </svg>
  );
}

/* =========================================================
   MAIN
>>>>>>> aman
========================================================= */

export default function ProductDetails({
  product,
  currentSlug,
<<<<<<< HEAD
}: ProductDetailsProps) {
  const router =
    useRouter();

=======
}: Props) {
  const router =
    useRouter();

  const commerce =
    useStorefrontCommerce();

  const productId =
    getId(product);

>>>>>>> aman
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
<<<<<<< HEAD
        (color) =>
          color?.isActive !==
=======
        (
          color
        ) =>
          color.isActive !==
>>>>>>> aman
          false
      );
    }, [
      product.colors,
    ]);

<<<<<<< HEAD
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
=======
  const urlColorIndex =
    useMemo(
      () =>
        activeColors.findIndex(
          (
            color
          ) =>
            String(
              color.slugProduct ||
                ""
            ) ===
            currentSlug
        ),
      [
        activeColors,
        currentSlug,
      ]
    );

  const defaultColorIndex =
    useMemo(() => {
      if (
        urlColorIndex >=
        0
>>>>>>> aman
      ) {
        return urlColorIndex;
      }

<<<<<<< HEAD
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
=======
      const backendDefault =
        activeColors.findIndex(
          (
            color
          ) =>
            color.isDefault ===
            true
        );

      return backendDefault >=
        0
        ? backendDefault
        : 0;
>>>>>>> aman
    }, [
      activeColors,
      urlColorIndex,
    ]);

<<<<<<< HEAD
  /* =======================================================
     STATE
  ======================================================= */

=======
>>>>>>> aman
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
<<<<<<< HEAD
    activeImageIndex,
    setActiveImageIndex,
  ] =
    useState(0);

  const [
=======
>>>>>>> aman
    quantity,
    setQuantity,
  ] =
    useState(1);

<<<<<<< HEAD
  /* =======================================================
     SYNC COLOR WHEN URL CHANGES

     /light-green
           ↓ click Dark Green
     /dark-green
           ↓
     selectedColorIndex = dark green
  ======================================================= */

=======
>>>>>>> aman
  useEffect(() => {
    setSelectedColorIndex(
      defaultColorIndex
    );

    setSelectedSizeIndex(
      null
    );

<<<<<<< HEAD
    setActiveImageIndex(
      0
    );

    setQuantity(
      1
    );
=======
    setQuantity(1);
>>>>>>> aman
  }, [
    defaultColorIndex,
    currentSlug,
  ]);

<<<<<<< HEAD
  /* =======================================================
     SELECTED COLOR
  ======================================================= */

  const selectedColor =
=======
  const selectedColor:
    | ApiColor
    | null =
>>>>>>> aman
    activeColors[
      selectedColorIndex
    ] ||
    getDefaultColor(
      product
    );

<<<<<<< HEAD
=======
  const colorId =
    getId(
      selectedColor
    );

>>>>>>> aman
  /* =======================================================
     IMAGES
  ======================================================= */

  const images =
<<<<<<< HEAD
    useMemo(() => {
      const colorImages =
        Array.isArray(
          selectedColor?.images
        )
          ? selectedColor.images.filter(
              (image) =>
                Boolean(
                  image?.url
=======
    useMemo<
      GalleryImage[]
    >(() => {
      const colorImages =
        Array.isArray(
          selectedColor
            ?.images
        )
          ? selectedColor.images.filter(
              (
                image
              ) =>
                Boolean(
                  image.url
>>>>>>> aman
                )
            )
          : [];

      if (
        colorImages.length >
        0
      ) {
        const defaultImage =
          colorImages.find(
<<<<<<< HEAD
            (image) =>
              image?.isDefault ===
=======
            (
              image
            ) =>
              image.isDefault ===
>>>>>>> aman
              true
          );

        return [
          ...(defaultImage
<<<<<<< HEAD
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
=======
            ? [
                defaultImage,
              ]
            : []),

          ...colorImages.filter(
            (
              image
            ) =>
              image !==
              defaultImage
          ),
        ].map(
          (
            image
          ) => ({
            url:
              String(
                image.url ||
                  ""
              ),

            publicId:
              image.publicId,

            isDefault:
              image.isDefault,
          })
        );
      }
>>>>>>> aman

      return getProductImageUrls(
        product
      ).map(
<<<<<<< HEAD
        (url) => ({
=======
        (
          url
        ) => ({
>>>>>>> aman
          url,
        })
      );
    }, [
<<<<<<< HEAD
      product,
      selectedColor,
=======
      selectedColor,
      product,
>>>>>>> aman
    ]);

  /* =======================================================
     SIZES
  ======================================================= */

<<<<<<< HEAD
  const sizes =
    useMemo(() => {
      if (
        !Array.isArray(
          selectedColor?.sizes
=======
  const sizes:
    ApiSize[] =
    useMemo(() => {
      if (
        !Array.isArray(
          selectedColor
            ?.sizes
>>>>>>> aman
        )
      ) {
        return [];
      }

      return selectedColor.sizes.filter(
<<<<<<< HEAD
        (size) =>
          size?.isActive !==
=======
        (
          size
        ) =>
          size.isActive !==
>>>>>>> aman
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
<<<<<<< HEAD
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
=======
     TEXT
  ======================================================= */

  const name =
    String(
      selectedColor
        ?.nameProduct ||
        getProductName(
          product
        )
    );

  const colorName =
    String(
      selectedColor
        ?.nameColor ||
        ""
    );

  const slug =
    String(
      selectedColor
        ?.slugProduct ||
        currentSlug ||
        ""
    );

  const shortDescription =
    String(
      selectedColor
        ?.shortDescription ||
        product.shortDescription ||
        ""
    );

  const description =
>>>>>>> aman
    cleanDescriptionHtml(
      selectedColor
        ?.description ||
        product.description
    );

  /* =======================================================
     PRICES
  ======================================================= */

<<<<<<< HEAD
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
=======
  const showPrice =
    positiveNumber(
      field(
        selectedSize,
        "showPrice"
      ),

      field(
        selectedColor,
        "showPrice"
      ),

      field(
        selectedSize,
        "sellingPrice"
      ),

      field(
        selectedColor,
        "sellingPrice"
      ),

      field(
        selectedSize,
        "salePrice"
      ),

      field(
        selectedColor,
        "salePrice"
      ),

      field(
        selectedSize,
        "price"
      ),

      field(
        selectedColor,
        "price"
      ),

      field(
        product,
        "showPrice"
      ),

      field(
        product,
        "sellingPrice"
      ),

      field(
        product,
        "price"
      )
    ) ?? 0;

  const originalPrice =
    Math.max(
      showPrice,

      positiveNumber(
        field(
          selectedSize,
          "originalPrice"
        ),

        field(
          selectedColor,
          "originalPrice"
        ),

        field(
          selectedSize,
          "mrp"
        ),

        field(
          selectedColor,
          "mrp"
        ),

        field(
          product,
          "originalPrice"
        ),

        field(
          product,
          "mrp"
        ),

        showPrice
      ) ?? showPrice
    );

  const discountAmount =
    originalPrice >
    showPrice
      ? originalPrice -
        showPrice
      : 0;

  const discountPercent =
    originalPrice >
      0 &&
    discountAmount >
      0
      ? Math.round(
          (
            discountAmount /
            originalPrice
          ) *
>>>>>>> aman
            100
        )
      : 0;

  /* =======================================================
<<<<<<< HEAD
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
=======
     STOCK
  ======================================================= */

  const totalColorStock =
    sizes.reduce(
      (
        total,
        size
      ) =>
        total +
        Math.max(
          0,
          Number(
            size.stock ||
              0
          )
        ),
      0
    );

  const currentStock =
    selectedSize
      ? Math.max(
          0,
          Number(
            selectedSize.stock ||
              0
          )
        )
      : totalColorStock;

  /* =======================================================
     CATALOG PRODUCT
  ======================================================= */

  const catalogProduct:
    CatalogProduct =
    useMemo(() => {
      const normalizedSizes =
        sizes
          .map(
            (
              size
            ): CatalogSize | null => {
              const id =
                getId(
                  size
                );

              if (!id) {
                return null;
              }

              const sizePrice =
                positiveNumber(
                  field(
                    size,
                    "showPrice"
                  ),

                  field(
                    size,
                    "sellingPrice"
                  ),

                  field(
                    selectedColor,
                    "showPrice"
                  ),

                  showPrice
                ) ??
                showPrice;

              const sizeOriginal =
                Math.max(
                  sizePrice,

                  positiveNumber(
                    field(
                      size,
                      "originalPrice"
                    ),

                    field(
                      size,
                      "mrp"
                    ),

                    field(
                      selectedColor,
                      "originalPrice"
                    ),

                    originalPrice
                  ) ??
                    sizePrice
                );

              return {
                id,

                label:
                  String(
                    size.size ||
                      size.name ||
                      "Size"
                  ),

                stock:
                  Math.max(
                    0,
                    Number(
                      size.stock ||
                        0
                    )
                  ),

                showPrice:
                  sizePrice,

                originalPrice:
                  sizeOriginal,
              };
            }
          )
          .filter(
            (
              size
            ): size is CatalogSize =>
              Boolean(size)
          );

      return {
        variantKey:
          `${productId}:${colorId}`,

        productId,

        colorId,

        name,

        slug,

        colorName,

        image1:
          images[0]
            ?.url ||
          "",

        image2:
          images[1]
            ?.url ||
          images[0]
            ?.url ||
          "",

        showPrice,

        originalPrice,

        discountAmount,

        discountPercent,

        categorySlugs:
          getProductCategorySlugs(
            product
          ),

        sizes:
          normalizedSizes,

        isFeatured:
          product.isFeatured ===
          true,

        isNewLaunch:
          product.isNewLaunch ===
          true,
      };
    }, [
      sizes,
      selectedColor,
      showPrice,
      originalPrice,
      productId,
      colorId,
      name,
      slug,
      colorName,
      images,
      discountAmount,
      discountPercent,
      product,
    ]);

  const wished =
    commerce.isWishlisted(
      catalogProduct
    );

  const wishlistBusy =
    commerce.isWishlistBusy(
      catalogProduct
    );

  /* =======================================================
     COLOR SELECT
  ======================================================= */

  const selectColor =
    (
      index: number
    ) => {
      const color =
        activeColors[
          index
        ];

      if (!color) {
        return;
      }

      setSelectedColorIndex(
        index
      );

      setSelectedSizeIndex(
        null
      );

      setQuantity(1);

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
            scroll:
              false,
          }
        );
      }
    };

  /* =======================================================
     SIZE SELECT
  ======================================================= */

  const selectSize =
    (
      index: number
    ) => {
      const size =
        sizes[
          index
        ];

      if (
        !size ||
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

      setQuantity(1);
    };

  /* =======================================================
     ADD TO BAG
  ======================================================= */

  const addToBag =
    async () => {
      if (
        sizes.length >
          0 &&
        !selectedSize
      ) {
        return;
      }

      const sizeId =
        getId(
          selectedSize
        );

      if (
        !productId ||
        !colorId ||
        !sizeId
      ) {
        return;
      }

      await commerce.addVariantToCart(
        {
          productId,

          colorId,

          sizeId,

          name,

          colorName,

          sizeLabel:
            String(
              selectedSize
                ?.size ||
                selectedSize
                  ?.name ||
                ""
            ),

          image:
            images[0]
              ?.url,

          quantity,
        }
      );
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
=======

        bg-white

        text-[#211A18]
      "
    >
      {/* ===================================================
          PRODUCT FIRST
      =================================================== */}

>>>>>>> aman
      <section
        className="
          mx-auto

          grid
<<<<<<< HEAD
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
=======

          w-full
          max-w-[1260px]

          grid-cols-1

          gap-7

          px-3
          pb-12
          pt-4

          sm:px-5
          sm:pt-7

          lg:grid-cols-[minmax(0,650px)_minmax(350px,1fr)]
          lg:gap-12
          lg:px-6
          lg:pb-20
          lg:pt-10
        "
      >
        <ProductGallery
          images={
            images
          }
          name={
            name
          }
          wished={
            wished
          }
          wishlistBusy={
            wishlistBusy
          }
          onBack={() => {
            router.back();
          }}
          onToggleWishlist={() => {
            void commerce.toggleWishlist(
              catalogProduct
            );
          }}
        />

        {/* =================================================
            DETAILS
>>>>>>> aman
        ================================================= */}

        <div
          className="
<<<<<<< HEAD
            pt-2
          "
        >
          {/* BADGES */}
=======
            min-w-0

            px-1

            lg:sticky
            lg:top-[110px]
            lg:self-start
          "
        >
          {/* FLAGS */}
>>>>>>> aman

          <div
            className="
              flex
<<<<<<< HEAD
              flex-wrap
              gap-2

              text-[9px]
              font-semibold
              uppercase
              tracking-[0.14em]
              text-[#8C1839]
=======
              gap-2

              text-[9px]
              font-bold
              uppercase

              tracking-[0.15em]

              text-[#B31345]
>>>>>>> aman
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

<<<<<<< HEAD
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
=======
          {/* TITLE */}

          <h1
            className="
              mt-2

              text-[22px]
              font-semibold
              leading-tight

              text-black

              sm:text-[26px]

              lg:text-[30px]
            "
          >
            {
              name
            }
          </h1>

          {/* SHORT DESCRIPTION */}

          {shortDescription && (
            <p
              className="
                mt-3

                text-[12px]
                leading-5

                text-black/50
>>>>>>> aman
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
<<<<<<< HEAD
              mt-6
=======
              mt-5
>>>>>>> aman

              flex
              flex-wrap
              items-center
<<<<<<< HEAD
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
=======

              gap-2.5
            "
          >
            <strong
              className="
                text-[22px]

                text-black
              "
            >
              ₹
              {showPrice.toLocaleString(
                "en-IN"
              )}
            </strong>

            {originalPrice >
              showPrice && (
              <span
                className="
                  text-[12px]

                  text-black/35

                  line-through
                "
              >
                ₹
                {originalPrice.toLocaleString(
                  "en-IN"
                )}
              </span>
            )}

            {discountPercent >
              0 && (
              <span
                className="
                  rounded-full

                  bg-[#F8E7EC]

                  px-2.5
                  py-1

                  text-[9px]
                  font-bold

                  text-[#B31345]
                "
              >
                {
                  discountPercent
                }
                % OFF
              </span>
>>>>>>> aman
            )}
          </div>

          {/* =================================================
              COLORS
          ================================================= */}

          {activeColors.length >
            0 && (
            <div
              className="
<<<<<<< HEAD
                mt-8
              "
            >
              <div
                className="
                  text-sm
=======
                mt-7
              "
            >
              <p
                className="
                  text-[11px]
>>>>>>> aman
                  font-semibold
                "
              >
                Color:{" "}

                <span
                  className="
                    font-normal
<<<<<<< HEAD
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
=======

                    text-black/50
                  "
                >
                  {
                    colorName ||
                    "Default"
                  }
                </span>
              </p>

              <div
                className="
                  mt-3

                  flex
                  gap-2

                  overflow-x-auto

                  pb-1

                  [scrollbar-width:none]

                  [&::-webkit-scrollbar]:hidden
>>>>>>> aman
                "
              >
                {activeColors.map(
                  (
                    color,
                    index
                  ) => {
<<<<<<< HEAD
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
=======
                    const colorImages =
                      Array.isArray(
                        color.images
                      )
                        ? color.images.filter(
                            (
                              image
                            ) =>
                              Boolean(
                                image.url
                              )
                          )
                        : [];

                    const image =
                      colorImages.find(
                        (
                          item
                        ) =>
                          item.isDefault ===
                          true
                      ) ||
                      colorImages[0];
>>>>>>> aman

                    return (
                      <button
                        key={
<<<<<<< HEAD
                          color._id ||
                          color.slugProduct ||
                          color.slugColor ||
=======
                          getId(
                            color
                          ) ||
>>>>>>> aman
                          index
                        }
                        type="button"
                        onClick={() =>
                          selectColor(
                            index
                          )
                        }
<<<<<<< HEAD
                        title={
                          color.nameProduct ||
                          color.nameColor
                        }
                        className="
                          w-[76px]
                          text-center
=======
                        className="
                          w-[62px]

                          flex-none

                          cursor-pointer

                          text-left
>>>>>>> aman
                        "
                      >
                        <div
                          className={`
                            aspect-[4/5]

                            overflow-hidden

<<<<<<< HEAD
                            rounded-lg

                            border-2

                            transition

=======
                            rounded-[8px]

                            border-2

>>>>>>> aman
                            ${
                              selectedColorIndex ===
                              index
                                ? "border-[#211A18]"
<<<<<<< HEAD
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
=======
                                : "border-transparent"
                            }
                          `}
                        >
                          {image
                            ?.url ? (
                            <img
                              src={
                                image.url
                              }
                              alt={
>>>>>>> aman
                                color.nameColor ||
                                name
                              }
                              className="
                                h-full
                                w-full
<<<<<<< HEAD
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
=======

                                object-cover
                              "
                            />
                          ) : null}
>>>>>>> aman
                        </div>

                        <span
                          className="
                            mt-1
<<<<<<< HEAD
                            block
                            truncate

                            text-[10px]
                          "
                        >
                          {
                            color.nameColor
=======

                            block
                            truncate

                            text-[8px]

                            text-black/50
                          "
                        >
                          {
                            color.nameColor ||
                            "Default"
>>>>>>> aman
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
<<<<<<< HEAD
              SIZE
=======
              SIZES
>>>>>>> aman
          ================================================= */}

          {sizes.length >
            0 && (
            <div
              className="
<<<<<<< HEAD
                mt-8
              "
            >
              <div
                className="
                  text-sm
=======
                mt-7
              "
            >
              <p
                className="
                  text-[11px]
>>>>>>> aman
                  font-semibold
                "
              >
                Select Size
<<<<<<< HEAD
              </div>
=======
              </p>
>>>>>>> aman

              <div
                className="
                  mt-3

                  flex
                  flex-wrap
<<<<<<< HEAD
                  gap-3
=======

                  gap-2
>>>>>>> aman
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
<<<<<<< HEAD
                          size._id ||
                          `${size.size || size.name}-${index}`
=======
                          getId(
                            size
                          ) ||
                          index
>>>>>>> aman
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
<<<<<<< HEAD
                          min-w-12

                          rounded-lg

                          border

                          px-4
                          py-3

                          text-xs
=======
                          min-w-[48px]

                          cursor-pointer

                          rounded-[8px]

                          border

                          px-3
                          py-2.5

                          text-[11px]
>>>>>>> aman
                          font-semibold

                          ${
                            selectedSizeIndex ===
                            index
                              ? "border-[#211A18] bg-[#211A18] text-white"
<<<<<<< HEAD
                              : "border-black/20"
=======
                              : "border-black/20 bg-white text-black"
>>>>>>> aman
                          }

                          ${
                            disabled
<<<<<<< HEAD
                              ? "cursor-not-allowed opacity-30 line-through"
                              : ""
                          }
                        `}
                      >
                        {
                          size.size ||
                          size.name
                        }
=======
                              ? "cursor-not-allowed bg-black/5 text-black/20 line-through"
                              : "hover:border-[#B31345] hover:text-[#B31345]"
                          }
                        `}
                      >
                        {size.size ||
                          size.name}
>>>>>>> aman
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {/* STOCK */}

<<<<<<< HEAD
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
=======
          <p
            className={`
              mt-5

              text-[11px]
              font-medium

              ${
                currentStock >
                0
                  ? "text-green-700"
                  : "text-red-600"
              }
            `}
          >
            {currentStock >
            0
              ? `In Stock (${currentStock})`
              : "Out of Stock"}
          </p>

          {/* =================================================
              ACTIONS

              Mobile / Tablet:
              quantity + add to bag

              Wishlist already image top-right.

              Desktop:
              quantity + add to bag + wishlist
          ================================================= */}

          <div
            className="
              mt-5

              grid

              grid-cols-[92px_minmax(0,1fr)]

              gap-2

              lg:grid-cols-[92px_minmax(0,1fr)_46px]
            "
          >
            {/* QUANTITY */}

            <div
              className="
                flex

                h-11

                items-center
                justify-between

                rounded-[8px]

                border
                border-black/20

                px-3
>>>>>>> aman
              "
            >
              <button
                type="button"
                onClick={() =>
                  setQuantity(
                    (
<<<<<<< HEAD
                      value
                    ) =>
                      Math.max(
                        1,
                        value -
=======
                      current
                    ) =>
                      Math.max(
                        1,
                        current -
>>>>>>> aman
                          1
                      )
                  )
                }
<<<<<<< HEAD
=======
                className="
                  cursor-pointer
                "
>>>>>>> aman
              >
                −
              </button>

<<<<<<< HEAD
              <strong>
                {quantity}
=======
              <strong
                className="
                  text-[11px]
                "
              >
                {
                  quantity
                }
>>>>>>> aman
              </strong>

              <button
                type="button"
                disabled={
<<<<<<< HEAD
                  quantity >=
                    currentStock ||
                  currentStock <=
                    0
=======
                  currentStock <=
                    0 ||
                  quantity >=
                    currentStock
>>>>>>> aman
                }
                onClick={() =>
                  setQuantity(
                    (
<<<<<<< HEAD
                      value
                    ) =>
                      Math.min(
                        currentStock,
                        value +
=======
                      current
                    ) =>
                      Math.min(
                        currentStock,
                        current +
>>>>>>> aman
                          1
                      )
                  )
                }
<<<<<<< HEAD
=======
                className="
                  cursor-pointer

                  disabled:cursor-not-allowed
                  disabled:opacity-30
                "
>>>>>>> aman
              >
                +
              </button>
            </div>

<<<<<<< HEAD
=======
            {/* ADD TO BAG */}

>>>>>>> aman
            <button
              type="button"
              disabled={
                currentStock <=
                  0 ||
<<<<<<< HEAD
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
=======
                (
                  sizes.length >
                    0 &&
                  !selectedSize
                )
              }
              onClick={() => {
                void addToBag();
              }}
              className="
                h-11

                cursor-pointer

                rounded-[8px]

                bg-[#2E2A29]

                text-[10px]
                font-bold
                uppercase

                text-white

                transition-colors

                hover:bg-[#B31345]

                disabled:cursor-not-allowed
                disabled:bg-black/20
              "
            >
              {sizes.length >
                  0 &&
                !selectedSize
                ? "Select Size"
                : "Add To Bag"}
            </button>

            {/* DESKTOP WISHLIST */}

            <button
              type="button"
              disabled={
                wishlistBusy
              }
              onClick={() => {
                void commerce.toggleWishlist(
                  catalogProduct
                );
              }}
              className={`
                hidden
                h-11

                cursor-pointer

                items-center
                justify-center

                rounded-[8px]

                border

                text-xl

                lg:flex

                ${
                  wished
                    ? "border-[#B31345] bg-[#B31345] text-white"
                    : "border-[#B31345]/40 bg-white text-[#B31345]"
                }

                disabled:cursor-not-allowed
                disabled:opacity-40
              `}
            >
              {wished
                ? "♥"
                : "♡"}
>>>>>>> aman
            </button>
          </div>
        </div>
      </section>

      {/* ===================================================
<<<<<<< HEAD
          DESCRIPTION
=======
          REVIEWS SECOND
      =================================================== */}

      {productId && (
        <ProductReviews
          productId={
            productId
          }
          productName={
            name
          }
        />
      )}

      {/* ===================================================
          DESCRIPTION THIRD
>>>>>>> aman
      =================================================== */}

      <section
        className="
          border-t
          border-black/10

<<<<<<< HEAD
          px-4
          py-12

          md:px-6
=======
          bg-white

          px-4
          py-12

          sm:px-6

          lg:py-18
>>>>>>> aman
        "
      >
        <div
          className="
            mx-auto
<<<<<<< HEAD
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
=======

            max-w-[960px]
          "
        >
          <div
            className="
              text-center
            "
          >
            <p
              className="
                text-[9px]
                font-bold
                uppercase

                tracking-[0.2em]

                text-[#B31345]
              "
            >
              Product Information
            </p>

            <h2
              className="
                mt-2

                text-2xl
                font-semibold

                sm:text-3xl
              "
            >
              Product Description
            </h2>
          </div>

          {description ? (
            <div
              className="
                mx-auto
                mt-8

                max-w-[880px]

                text-[13px]
                leading-7

                text-[#39322F]

                sm:text-[14px]

                [&_h1]:my-5
                [&_h1]:text-2xl
                [&_h1]:font-bold

                [&_h2]:my-5
                [&_h2]:text-xl
                [&_h2]:font-bold
                [&_h2]:text-[#A91543]

                [&_h3]:my-4
                [&_h3]:text-lg
                [&_h3]:font-semibold

                [&_p]:my-4

                [&_strong]:font-bold
                [&_strong]:text-[#A91543]

                [&_ul]:my-4
                [&_ul]:list-disc
                [&_ul]:pl-6

                [&_ol]:my-4
                [&_ol]:list-decimal
                [&_ol]:pl-6

                [&_li]:my-2

                [&_img]:mx-auto
                [&_img]:my-6
                [&_img]:max-w-full
                [&_img]:rounded-xl
              "
              dangerouslySetInnerHTML={{
                __html:
                  description,
>>>>>>> aman
              }}
            />
          ) : (
            <p
              className="
<<<<<<< HEAD
                mt-5

                text-sm
                text-black/45
              "
            >
              No description
=======
                mt-8

                text-center

                text-sm

                text-black/40
              "
            >
              No product description
>>>>>>> aman
              available.
            </p>
          )}
        </div>
      </section>
    </main>
  );
<<<<<<< HEAD
}   
=======
}
>>>>>>> aman
