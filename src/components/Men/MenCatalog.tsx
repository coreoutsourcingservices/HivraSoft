"use client";

import Link from "next/link";

import {
<<<<<<< HEAD
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  gsap,
} from "gsap";

import {
  ScrollTrigger,
} from "gsap/ScrollTrigger";

import {
  menMenu,
  type MenBanner,
  type MenProduct,
} from "@/src/data/men";

/* =========================================================
   PROPS
========================================================= */

type MenCatalogProps = {
  products: MenProduct[];

  banners: MenBanner[];

  title: string;
  description: string;

  category?: string;
  subcategory?: string;
};

/* =========================================================
   BANNER
========================================================= */

function MenBannerSlider({
  banners,
}: {
  banners: MenBanner[];
}) {
  const [
    active,
    setActive,
  ] =
    useState(0);

  const validBanners =
    useMemo(
      () =>
        banners.filter(
          (banner) =>
            Boolean(
              banner?.image
            )
        ),
      [
        banners,
      ]
    );

  useEffect(() => {
    setActive(0);

    if (
      validBanners.length <=
      1
    ) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          setActive(
            (current) =>
              (current + 1) %
              validBanners.length
          );
        },
        4000
      );

    return () =>
      window.clearInterval(
        timer
      );
  }, [
    validBanners.length,
  ]);

  if (
    validBanners.length ===
    0
  ) {
    return null;
  }

  return (
    <section
      className="
        relative
        w-full
        overflow-hidden
        bg-[#EFE6DC]
      "
      style={{
        aspectRatio:
          "1600 / 558",
      }}
    >
      {validBanners.map(
        (
          banner,
          index
        ) => (
          <Link
            key={`${banner.image}-${index}`}
            href={
              banner.redirect ||
              banner.href ||
              "#"
            }
            className={`
              absolute
              inset-0
              block
              h-full
              w-full

              transition-all
              duration-700

              ${
                active === index
                  ? "translate-x-0 opacity-100"
                  : index <
                      active
                    ? "-translate-x-full opacity-0"
                    : "translate-x-full opacity-0"
              }
            `}
          >
            <img
              src={
                banner.image
              }
              alt={
                banner.alt ||
                banner.title ||
                "Men Banner"
              }
              className="
                h-full
                w-full
                object-cover
                object-center
              "
            />
          </Link>
        )
      )}

      {validBanners.length >
        1 && (
        <>
          <button
            type="button"
            onClick={() =>
              setActive(
                (
                  current
                ) =>
                  current ===
                  0
                    ? validBanners.length -
                      1
                    : current -
                      1
              )
            }
            className="
              absolute
              left-4
              top-1/2
              z-20

              flex
              h-10
              w-10
              -translate-y-1/2
              items-center
              justify-center

              rounded-full
              bg-white/90

              text-[22px]

              shadow
            "
          >
            ‹
          </button>

          <button
            type="button"
            onClick={() =>
              setActive(
                (
                  current
                ) =>
                  (current +
                    1) %
                  validBanners.length
              )
            }
            className="
              absolute
              right-4
              top-1/2
              z-20

              flex
              h-10
              w-10
              -translate-y-1/2
              items-center
              justify-center

              rounded-full
              bg-white/90

              text-[22px]

              shadow
            "
          >
            ›
          </button>
        </>
      )}
    </section>
  );
=======
  useMemo,
  useState,
} from "react";

import CategoryBannerSlider from "@/src/components/Storefront/CategoryBannerSlider";

import StorefrontProductCard from "@/src/components/Storefront/StorefrontProductCard";

import type {
  StorefrontCategoryNode,
} from "@/src/services/categories";

import type {
  CatalogBanner,
  CatalogProduct,
} from "@/types/catalog";

type Props = {
  products: CatalogProduct[];

  banners: CatalogBanner[];

  title: string;

  description: string;

  categoryRoot:
    StorefrontCategoryNode;

  categoryPath:
    string[];
};

type SortValue =
  | "featured"
  | "newest"
  | "price-low"
  | "price-high";

/* =========================================================
   URL
========================================================= */

function categoryHref(
  slugs: string[]
) {
  return slugs.length ===
    0
    ? "/men"
    : `/men/${slugs
        .map(
          encodeURIComponent
        )
        .join("/")}`;
}

function sortNodes(
  nodes: StorefrontCategoryNode[]
) {
  return [
    ...nodes,
  ].sort(
    (
      a,
      b
    ) => {
      if (
        a.sortOrder !==
        b.sortOrder
      ) {
        return (
          a.sortOrder -
          b.sortOrder
        );
      }

      return a.name.localeCompare(
        b.name
      );
    }
  );
}

function selectedNodesFromPath(
  root: StorefrontCategoryNode,
  path: string[]
) {
  const result:
    StorefrontCategoryNode[] =
    [];

  let children =
    root.children;

  for (
    const slug of path
  ) {
    const found =
      children.find(
        (child) =>
          child.slug ===
          slug
      );

    if (!found) {
      break;
    }

    result.push(
      found
    );

    children =
      found.children;
  }

  return result;
>>>>>>> aman
}

/* =========================================================
   CATEGORY NAVIGATION
========================================================= */

<<<<<<< HEAD
function MenNavigation({
  category,
  subcategory,
}: {
  category?: string;
  subcategory?: string;
}) {
  const activeParent =
    useMemo(
      () =>
        menMenu.find(
          (item) =>
            item.slug ===
            category
        ),
      [
        category,
=======
function CategoryNavigation({
  root,
  path,
}: {
  root:
    StorefrontCategoryNode;

  path: string[];
}) {
  const selectedNodes =
    useMemo(
      () =>
        selectedNodesFromPath(
          root,
          path
        ),
      [
        root,
        path,
      ]
    );

  const rootChildren =
    useMemo(
      () =>
        sortNodes(
          root.children
        ),
      [
        root.children,
>>>>>>> aman
      ]
    );

  return (
<<<<<<< HEAD
    <div
      className="
        w-full
        overflow-hidden
=======
    <section
      className="
        mx-auto
        mt-12

        w-[calc(100%-64px)]
>>>>>>> aman

        rounded-[20px]

        border
<<<<<<< HEAD
        border-[#211A18]/10

        bg-[#EFE5DB]

        px-4
        py-5

        md:px-6
      "
    >
      {/* MAIN */}

      <div
        className="
          w-full
          overflow-x-auto
        "
      >
        <div
          className="
            mx-auto

            flex
            min-w-max
            items-center
            justify-center
            gap-3
          "
        >
          <Link
            href="/men"
            className={`
              shrink-0

              rounded-full

              px-6
              py-3

              text-[9px]
              font-semibold
              uppercase
              tracking-[0.13em]

              transition-all

              ${
                !category
                  ? "bg-[#A91543] text-white"
                  : "bg-white text-[#211A18] hover:bg-[#A91543] hover:text-white"
              }
            `}
          >
            All Men
          </Link>

          {menMenu.map(
            (item) => (
              <Link
                key={
                  item.slug
                }
                href={
                  item.href
                }
                className={`
                  shrink-0

                  rounded-full

                  px-6
                  py-3

                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.13em]

                  transition-all

                  ${
                    category ===
                    item.slug
                      ? "bg-[#A91543] text-white"
                      : "bg-white text-[#211A18] hover:bg-[#A91543] hover:text-white"
                  }
                `}
              >
                {
                  item.name
                }
              </Link>
            )
          )}
        </div>
      </div>

      {/* CHILDREN */}

      {activeParent &&
        activeParent.children
          .length >
          0 && (
        <div
          className="
            mt-5
            overflow-x-auto

            border-t
            border-[#211A18]/10

            pt-4
          "
        >
          <div
            className="
              mx-auto

              flex
              min-w-max
              items-center
              justify-center
              gap-8
            "
          >
            <Link
              href={
                activeParent.href
              }
              className={`
                border-b-2
                pb-2

                text-[8px]
                font-semibold
                uppercase
                tracking-[0.12em]

                ${
                  !subcategory
                    ? "border-[#A91543] text-[#A91543]"
                    : "border-transparent text-[#6F5A4C]"
                }
              `}
            >
              All{" "}
              {
                activeParent.name
              }
            </Link>

            {activeParent.children.map(
              (child) => (
                <Link
                  key={
                    child.slug
                  }
                  href={
                    child.href
                  }
                  className={`
                    border-b-2
                    pb-2

                    text-[8px]
                    font-semibold
                    uppercase
                    tracking-[0.12em]

                    ${
                      subcategory ===
                      child.slug
                        ? "border-[#A91543] text-[#A91543]"
                        : "border-transparent text-[#6F5A4C] hover:text-[#A91543]"
                    }
                  `}
                >
                  {
                    child.name
                  }
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   PRODUCT CARD
========================================================= */

function ProductCard({
  product,
}: {
  product: MenProduct;
}) {
  const productUrl =
    `/product/${product.slug}`;

  const discount =
    product.actualPrice >
      product.discountedPrice &&
    product.actualPrice >
      0
      ? Math.round(
          ((product.actualPrice -
            product.discountedPrice) /
            product.actualPrice) *
            100
        )
      : 0;

  return (
    <article
      data-product-card
      className="
        group
        min-w-0
      "
    >
      <Link
        href={
          productUrl
        }
        className="
          relative
          block

          aspect-[4/5]

          overflow-hidden

          rounded-[14px]

          bg-[#F2ECE7]
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
              className="
                absolute
                inset-0

                h-full
                w-full

                object-cover
                object-center

                transition-all
                duration-500

                group-hover:scale-[1.02]
                group-hover:opacity-0
              "
            />

            <img
              src={
                product.image2 ||
                product.image1
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
          </>
        ) : (
          <div
            className="
              flex
              h-full
              items-center
              justify-center

              text-[10px]
              text-black/30
            "
          >
            No Image
          </div>
        )}

        {discount >
          0 && (
          <span
            className="
              absolute
              left-3
              top-3
              z-20

              rounded-full

              bg-[#A91543]

              px-3
              py-1.5

              text-[8px]
              font-semibold
              text-white
            "
          >
            {discount}% OFF
          </span>
        )}

        <span
          className="
            absolute
            right-3
            top-3
            z-20

            flex
            h-9
            w-9
            items-center
            justify-center

            rounded-full

            bg-white/90

            text-[18px]
            text-[#A91543]

            shadow-sm
          "
        >
          ♡
        </span>
      </Link>

      <div
        className="
          px-1
          pt-4
        "
      >
        <Link
          href={
            productUrl
          }
          className="
            block
            truncate

            text-[12px]
            font-medium
            text-[#211A18]

            hover:text-[#A91543]
          "
        >
          {
            product.name
          }
        </Link>

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
            {Number(
              product.discountedPrice
            ).toLocaleString(
              "en-IN"
            )}
          </span>

          {product.actualPrice >
            product.discountedPrice && (
            <span
              className="
                text-[10px]
                text-black/35
                line-through
              "
            >
              ₹
              {Number(
                product.actualPrice
              ).toLocaleString(
                "en-IN"
              )}
            </span>
          )}
        </div>
      </div>
    </article>
=======
        border-[#DDD2C5]

        bg-[#F0E6DA]

        px-6
        py-5
      "
    >
      <div
        className="
          flex
          flex-wrap
          items-center
          justify-center
          gap-3

          border-b
          border-[#DDD2C5]

          pb-5
        "
      >
        <Link
          href="/men"
          className={`
            rounded-full

            px-6
            py-3

            text-[11px]
            font-semibold

            tracking-[0.12em]

            ${
              path.length ===
              0
                ? "bg-[#B31345] text-white"
                : "bg-white text-[#211A18]"
            }
          `}
        >
          ALL MEN
        </Link>

        {rootChildren.map(
          (node) => (
            <Link
              key={
                node.id
              }
              href={categoryHref(
                [
                  node.slug,
                ]
              )}
              className={`
                rounded-full

                px-6
                py-3

                text-[11px]
                font-semibold
                uppercase

                tracking-[0.12em]

                ${
                  path[0] ===
                  node.slug
                    ? "bg-[#B31345] text-white"
                    : "bg-white text-[#211A18]"
                }
              `}
            >
              {
                node.name
              }
            </Link>
          )
        )}
      </div>

      {selectedNodes.map(
        (
          node,
          index
        ) => {
          const children =
            sortNodes(
              node.children
            );

          if (
            children.length ===
            0
          ) {
            return null;
          }

          const base =
            path.slice(
              0,
              index + 1
            );

          const activeChild =
            path[
              index +
                1
            ];

          return (
            <div
              key={
                node.id
              }
              className="
                flex
                flex-wrap
                items-center
                justify-center

                gap-x-8
                gap-y-3

                border-b
                border-[#DDD2C5]

                py-5

                last:border-b-0
              "
            >
              <Link
                href={categoryHref(
                  base
                )}
                className={`
                  border-b-2

                  px-1
                  pb-2

                  text-[10px]
                  font-semibold
                  uppercase

                  ${
                    !activeChild
                      ? "border-[#B31345] text-[#B31345]"
                      : "border-transparent"
                  }
                `}
              >
                ALL{" "}
                {
                  node.name
                }
              </Link>

              {children.map(
                (
                  child
                ) => (
                  <Link
                    key={
                      child.id
                    }
                    href={categoryHref(
                      [
                        ...base,

                        child.slug,
                      ]
                    )}
                    className={`
                      border-b-2

                      px-1
                      pb-2

                      text-[10px]
                      font-semibold
                      uppercase

                      ${
                        activeChild ===
                        child.slug
                          ? "border-[#B31345] text-[#B31345]"
                          : "border-transparent"
                      }
                    `}
                  >
                    {
                      child.name
                    }
                  </Link>
                )
              )}
            </div>
          );
        }
      )}
    </section>
>>>>>>> aman
  );
}

/* =========================================================
<<<<<<< HEAD
   CATALOG
=======
   MAIN
>>>>>>> aman
========================================================= */

export default function MenCatalog({
  products,
  banners,
<<<<<<< HEAD
  category,
  subcategory,
}: MenCatalogProps) {
  const rootRef =
    useRef<HTMLElement>(
      null
    );

=======
  title,
  description,
  categoryRoot,
  categoryPath,
}: Props) {
>>>>>>> aman
  const [
    sort,
    setSort,
  ] =
<<<<<<< HEAD
    useState(
      "featured"
    );

  /* =======================================================
     SORT
  ======================================================= */

  const sortedProducts =
    useMemo(() => {
      const result = [
        ...products,
      ];

      if (
        sort ===
        "low-high"
      ) {
        return result.sort(
          (
            a,
            b
          ) =>
            a.discountedPrice -
            b.discountedPrice
        );
      }

      if (
        sort ===
        "high-low"
      ) {
        return result.sort(
          (
            a,
            b
          ) =>
            b.discountedPrice -
            a.discountedPrice
        );
      }

      return result.sort(
        (
          a,
          b
        ) =>
          Number(
            b.isFeatured
          ) -
          Number(
            a.isFeatured
          )
      );
=======
    useState<SortValue>(
      "featured"
    );

  const sortedProducts =
    useMemo(() => {
      const list = [
        ...products,
      ];

      switch (sort) {
        case "price-low":
          return list.sort(
            (
              a,
              b
            ) =>
              a.showPrice -
              b.showPrice
          );

        case "price-high":
          return list.sort(
            (
              a,
              b
            ) =>
              b.showPrice -
              a.showPrice
          );

        case "newest":
          return list.sort(
            (
              a,
              b
            ) =>
              Number(
                b.isNewLaunch
              ) -
              Number(
                a.isNewLaunch
              )
          );

        default:
          return list.sort(
            (
              a,
              b
            ) =>
              Number(
                b.isFeatured
              ) -
              Number(
                a.isFeatured
              )
          );
      }
>>>>>>> aman
    }, [
      products,
      sort,
    ]);

<<<<<<< HEAD
  /* =======================================================
     ANIMATION
  ======================================================= */

  useEffect(() => {
    gsap.registerPlugin(
      ScrollTrigger
    );

    const root =
      rootRef.current;

    if (!root) {
      return;
    }

    const context =
      gsap.context(
        () => {
          ScrollTrigger.batch(
            "[data-product-card]",
            {
              start:
                "top 92%",

              once: true,

              onEnter:
                (
                  cards
                ) => {
                  gsap.fromTo(
                    cards,
                    {
                      y: 24,
                      opacity: 0,
                    },
                    {
                      y: 0,
                      opacity: 1,

                      duration:
                        0.55,

                      stagger:
                        0.05,

                      ease:
                        "power3.out",
                    }
                  );
                },
            }
          );
        },
        root
      );

    return () =>
      context.revert();
  }, [
    sortedProducts,
  ]);

  return (
    <main
      ref={
        rootRef
      }
      className="
        min-h-screen

        bg-[#F8F5F2]
=======
  return (
    <main
      className="
        min-h-screen

        bg-[#FAF8F6]
>>>>>>> aman

        text-[#211A18]
      "
    >
<<<<<<< HEAD
      <MenBannerSlider
=======
      <CategoryBannerSlider
>>>>>>> aman
        banners={
          banners
        }
      />

<<<<<<< HEAD
      <section
        className="
          px-4
          py-12

          md:px-8
=======
      <CategoryNavigation
        root={
          categoryRoot
        }
        path={
          categoryPath
        }
      />

      <section
        className="
          px-8
          pb-20
          pt-10
>>>>>>> aman
        "
      >
        <div
          className="
            mx-auto
<<<<<<< HEAD
            max-w-[1450px]
          "
        >
          {/* NAVIGATION */}

          <MenNavigation
            category={
              category
            }
            subcategory={
              subcategory
            }
          />

          {/* TOOLBAR */}

          <div
            className="
              mb-8
              mt-9

              flex
              items-center
              justify-between

              border-b
              border-[#211A18]/10

              pb-5
            "
          >
            <p
              className="
                text-[9px]
                font-semibold
                uppercase
                tracking-[0.18em]
                text-[#8C6A52]
              "
            >
              {
                sortedProducts.length
              }{" "}
              {sortedProducts.length ===
              1
                ? "Product"
                : "Products"}
            </p>
=======

            max-w-[1500px]
          "
        >
          <div
            className="
              mb-8

              flex
              flex-col
              gap-5

              border-b
              border-black/10

              pb-5

              md:flex-row
              md:items-end
              md:justify-between
            "
          >
            <div>
              <p
                className="
                  text-[10px]
                  font-semibold
                  uppercase

                  tracking-[0.22em]

                  text-[#B31345]
                "
              >
                {
                  products.length
                } PRODUCTS
              </p>

              <h1
                className="
                  mt-2

                  text-3xl
                  font-semibold
                "
              >
                {
                  title
                }
              </h1>

              <p
                className="
                  mt-2

                  max-w-2xl

                  text-sm
                  leading-6

                  text-black/55
                "
              >
                {
                  description
                }
              </p>
            </div>
>>>>>>> aman

            <select
              value={
                sort
              }
              onChange={(
                event
              ) =>
                setSort(
                  event.target
<<<<<<< HEAD
                    .value
                )
              }
              className="
                min-w-[160px]

                rounded-[8px]

                border
                border-[#211A18]/15
=======
                    .value as SortValue
                )
              }
              className="
                h-10
                min-w-[165px]

                rounded-lg

                border
                border-black/15
>>>>>>> aman

                bg-white

                px-4
<<<<<<< HEAD
                py-3

                text-[9px]
                font-medium
                uppercase
                tracking-[0.1em]

                outline-none
=======

                text-[11px]
>>>>>>> aman
              "
            >
              <option value="featured">
                Featured
              </option>

<<<<<<< HEAD
              <option value="low-high">
                Price Low to High
              </option>

              <option value="high-low">
=======
              <option value="newest">
                New Launch
              </option>

              <option value="price-low">
                Price Low to High
              </option>

              <option value="price-high">
>>>>>>> aman
                Price High to Low
              </option>
            </select>
          </div>

<<<<<<< HEAD
          {/* PRODUCTS */}

=======
>>>>>>> aman
          {sortedProducts.length >
          0 ? (
            <div
              className="
                grid
<<<<<<< HEAD

                grid-cols-2

                gap-x-4
                gap-y-9

                md:grid-cols-3
                md:gap-x-6

                lg:grid-cols-4
=======
                grid-cols-1

                gap-x-6
                gap-y-10

                sm:grid-cols-2
                lg:grid-cols-3
                xl:grid-cols-4
>>>>>>> aman
              "
            >
              {sortedProducts.map(
                (
<<<<<<< HEAD
                  product,
                  index
                ) => (
                  <ProductCard
                    key={
                      product.id ||
                      product.slug ||
                      index
=======
                  product
                ) => (
                  <StorefrontProductCard
                    key={
                      product.variantKey
>>>>>>> aman
                    }
                    product={
                      product
                    }
                  />
                )
              )}
            </div>
          ) : (
            <div
              className="
<<<<<<< HEAD
                flex
                min-h-[330px]
                items-center
                justify-center

                rounded-[18px]

                border
                border-[#211A18]/8

                bg-white

                text-center
              "
            >
              <div>
                <p
                  className="
                    text-[8px]
                    uppercase
                    tracking-[0.3em]
                    text-[#9C765D]
                  "
                >
                  Hivra Soft
                </p>

                <h2
                  className="
                    mt-4

                    text-[25px]
                    font-medium
                  "
                >
                  No products found.
                </h2>

                <p
                  className="
                    mt-2

                    text-[10px]
                    text-[#211A18]/45
                  "
                >
                  Is category me abhi
                  koi active product
                  available nahi hai.
                </p>

                <Link
                  href="/men"
                  className="
                    mt-6

                    inline-flex

                    rounded-full

                    bg-[#211A18]

                    px-7
                    py-3

                    text-[8px]
                    font-semibold
                    uppercase
                    tracking-[0.14em]
                    text-white
                  "
                >
                  View All Men
                </Link>
              </div>
=======
                rounded-2xl

                border
                border-black/10

                bg-white

                py-16

                text-center
              "
            >
              No products found.
>>>>>>> aman
            </div>
          )}
        </div>
      </section>
    </main>
  );
}