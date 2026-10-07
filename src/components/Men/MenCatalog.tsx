"use client";

import Link from "next/link";
import ResponsiveCatalog from "@/src/components/Storefront/ResponsiveCatalog";
import CategoryOfferStrip from "@/src/components/Offers/CategoryOfferStrip";
import type { StorefrontOffer } from "@/src/services/offers";

import {
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
  fixedPriceOffer?: StorefrontOffer | null;
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
}

/* =========================================================
   CATEGORY NAVIGATION
========================================================= */

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
      ]
    );

  return (
    <section
      className="
        mx-auto
        mt-12

        w-[calc(100%-64px)]

        rounded-[20px]

        border
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
  );
}

/* =========================================================
   MAIN
========================================================= */

export default function MenCatalog({
  products,
  banners,
  title,
  description,
  categoryRoot,
  categoryPath,
  fixedPriceOffer,
}: Props) {
  const [
    sort,
    setSort,
  ] =
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
    }, [
      products,
      sort,
    ]);

  return (
    <>
    <CategoryOfferStrip offer={fixedPriceOffer || null} />
    <div className="lg:hidden">
      <ResponsiveCatalog basePath="/men" allLabel="All Men" products={products} banners={banners} title={title} description={description} categoryRoot={categoryRoot} categoryPath={categoryPath} />
    </div>
    <main
      className="
        hidden lg:block
        min-h-screen

        bg-[#FAF8F6]

        text-[#211A18]
      "
    >
      <CategoryBannerSlider
        banners={
          banners
        }
      />

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
        "
      >
        <div
          className="
            mx-auto

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
                h-10
                min-w-[165px]

                rounded-lg

                border
                border-black/15

                bg-white

                px-4

                text-[11px]
              "
            >
              <option value="featured">
                Featured
              </option>

              <option value="newest">
                New Launch
              </option>

              <option value="price-low">
                Price Low to High
              </option>

              <option value="price-high">
                Price High to Low
              </option>
            </select>
          </div>

          {sortedProducts.length >
          0 ? (
            <div
              className="
                grid
                grid-cols-1

                gap-x-6
                gap-y-10

                sm:grid-cols-2
                lg:grid-cols-3
                xl:grid-cols-4
              "
            >
              {sortedProducts.map(
                (
                  product
                ) => (
                  <StorefrontProductCard
                    key={
                      product.variantKey
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
                rounded-2xl

                border
                border-black/10

                bg-white

                py-16

                text-center
              "
            >
              No products found.
            </div>
          )}
        </div>
      </section>
    </main>
    </>
  );
}