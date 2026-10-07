"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import CategoryBannerSlider from "@/src/components/Storefront/CategoryBannerSlider";
import StorefrontProductCard from "@/src/components/Storefront/StorefrontProductCard";

import type { StorefrontCategoryNode } from "@/src/services/categories";

import type {
  CatalogBanner,
  CatalogProduct,
} from "@/types/catalog";

/* =========================================================
   TYPES
========================================================= */

type SortValue =
  | "featured"
  | "newest"
  | "price-low"
  | "price-high";

type FilterState = {
  inStock: boolean;
  discounted: boolean;
  newLaunch: boolean;
};

type Props = {
  basePath: "/women" | "/men"   | "/accessories";

  allLabel: string;

  products: CatalogProduct[];

  banners: CatalogBanner[];

  title: string;

  description: string;

  categoryRoot: StorefrontCategoryNode;

  categoryPath: string[];
};

/* =========================================================
   CATEGORY URL
========================================================= */

function categoryHref(
  basePath: string,
  slugs: string[]
) {
  if (slugs.length === 0) {
    return basePath;
  }

  return `${basePath}/${slugs
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/")}`;
}

/* =========================================================
   SORT CATEGORY
========================================================= */

function sortNodes(
  nodes: StorefrontCategoryNode[]
) {
  return [...nodes].sort(
    (first, second) =>
      Number(first.sortOrder || 0) -
        Number(second.sortOrder || 0) ||
      first.name.localeCompare(second.name)
  );
}

/* =========================================================
   ACTIVE PATH
========================================================= */

function resolveSelectedNodes(
  root: StorefrontCategoryNode,
  path: string[]
) {
  const result: StorefrontCategoryNode[] = [];

  let children = root.children || [];

  for (const slug of path) {
    const found = children.find(
      (child) => child.slug === slug
    );

    if (!found) {
      break;
    }

    result.push(found);

    children = found.children || [];
  }

  return result;
}

/* =========================================================
   CATEGORY ROW
========================================================= */

function CategoryRow({
  basePath,
  prefix,
  allHref,
  allLabel,
  allActive,
  nodes,
  activeSlug,
}: {
  basePath: string;
  prefix: string[];
  allHref: string;
  allLabel: string;
  allActive: boolean;
  nodes: StorefrontCategoryNode[];
  activeSlug?: string;
}) {
  return (
    <div
      className="
        w-full
        overflow-x-auto
        overflow-y-hidden
        [scrollbar-width:none]
        [&::-webkit-scrollbar]:hidden
      "
    >
      <div
        className="
          mx-auto
          flex
          min-w-max
          flex-nowrap
          items-center
          gap-2.5

          px-3
          py-3

          sm:px-4

          md:justify-center
          md:px-6

          xl:gap-3
        "
      >
        {/* ALL CATEGORY BUTTON */}

        <Link
          href={allHref}
          className={`
            flex
            h-[42px]
            shrink-0
            items-center
            justify-center

            rounded-full
            border

            px-5

            text-[10px]
            font-bold
            uppercase
            tracking-[0.08em]
            whitespace-nowrap

            transition

            ${
              allActive
                ? "border-[#B31345] bg-[#B31345] text-white"
                : "border-[#DDD4CE] bg-white text-[#111111] hover:border-[#B31345] hover:text-[#B31345]"
            }
          `}
        >
          {allLabel}
        </Link>

        {/* CATEGORY BUTTONS */}

        {nodes.map((node) => {
          const active =
            activeSlug === node.slug;

          return (
            <Link
              key={node.id}
              href={categoryHref(
                basePath,
                [...prefix, node.slug]
              )}
              className={`
                flex
                h-[42px]
                shrink-0
                items-center
                justify-center

                rounded-full
                border

                px-5

                text-[10px]
                font-bold
                uppercase
                tracking-[0.08em]
                whitespace-nowrap

                transition

                ${
                  active
                    ? "border-[#B31345] bg-[#FFF3F6] text-[#B31345]"
                    : "border-[#DDD4CE] bg-white text-[#111111] hover:border-[#B31345] hover:text-[#B31345]"
                }
              `}
            >
              {node.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* =========================================================
   CATEGORY NAVIGATION

   MOBILE:
   Header ke neeche sticky rahega.

   DESKTOP:
   Normal/static rahega.
========================================================= */

function CategoryNavigation({
  root,
  path,
  basePath,
  allLabel,
}: {
  root: StorefrontCategoryNode;
  path: string[];
  basePath: string;
  allLabel: string;
}) {
  const rootChildren = useMemo(
    () =>
      sortNodes(
        root.children || []
      ),
    [root.children]
  );

  const selectedNodes = useMemo(
    () =>
      resolveSelectedNodes(
        root,
        path
      ),
    [root, path]
  );

  return (
    <section
      className="
        sticky
        top-[56px]
        z-[900]

        w-full

        border-y
        border-[#EEE5E0]

        bg-white

        shadow-[0_4px_12px_rgba(0,0,0,0.06)]

        md:static
        md:z-auto
        md:shadow-none
      "
    >
      {/* ===================================================
          ROOT CATEGORY ROW

          WOMEN:
          ALL WOMEN / BRA / LINGERIE / PANTY

          MEN:
          ALL MEN / ...
      =================================================== */}

      <CategoryRow
        basePath={basePath}
        prefix={[]}
        allHref={basePath}
        allLabel={allLabel}
        allActive={
          path.length === 0
        }
        nodes={rootChildren}
        activeSlug={path[0]}
      />

      {/* ===================================================
          SUB CATEGORY ROWS

          Example:
          ALL BRA / MATERNITY BRA / NON-PADDED BRA
      =================================================== */}

      {selectedNodes.map(
        (node, index) => {
          if (
            !node.children ||
            node.children.length === 0
          ) {
            return null;
          }

          const parentPath =
            path.slice(
              0,
              index + 1
            );

          return (
            <div
              key={node.id}
              className="
                border-t
                border-[#F0E6E8]
                bg-[#FFF9FA]
              "
            >
              <CategoryRow
                basePath={basePath}
                prefix={parentPath}
                allHref={categoryHref(
                  basePath,
                  parentPath
                )}
                allLabel={`All ${node.name}`}
                allActive={
                  !path[
                    index + 1
                  ]
                }
                nodes={sortNodes(
                  node.children
                )}
                activeSlug={
                  path[
                    index + 1
                  ]
                }
              />
            </div>
          );
        }
      )}
    </section>
  );
}

/* =========================================================
   FILTER ROW
========================================================= */

function FilterRow({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="
        flex
        w-full
        cursor-pointer
        items-center
        justify-between

        border-b
        border-black/10

        py-4

        text-[14px]
        text-black
      "
    >
      {label}

      <span
        className={`
          relative
          h-6
          w-11

          rounded-full

          transition-colors

          ${
            active
              ? "bg-[#B31345]"
              : "bg-black/15"
          }
        `}
      >
        <span
          className={`
            absolute
            top-1

            h-4
            w-4

            rounded-full
            bg-white

            transition-all

            ${
              active
                ? "left-6"
                : "left-1"
            }
          `}
        />
      </span>
    </button>
  );
}

/* =========================================================
   SORT SHEET
========================================================= */

function SortSheet({
  open,
  value,
  onChange,
  onClose,
}: {
  open: boolean;
  value: SortValue;
  onChange: (
    value: SortValue
  ) => void;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  const options: Array<{
    value: SortValue;
    label: string;
  }> = [
    {
      value: "featured",
      label: "Featured",
    },
    {
      value: "newest",
      label: "New Launch",
    },
    {
      value: "price-low",
      label:
        "Price: Low to High",
    },
    {
      value: "price-high",
      label:
        "Price: High to Low",
    },
  ];

  return (
    <div
      className="
        fixed
        inset-0
        z-[10000]

        flex
        items-end

        bg-black/45

        md:hidden
      "
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div
        className="
          w-full

          rounded-t-[22px]

          bg-white

          px-5
          pb-8
          pt-4
        "
      >
        <div
          className="
            mx-auto
            h-1
            w-12

            rounded-full
            bg-black/15
          "
        />

        <div
          className="
            mt-5
            flex
            items-center
            justify-between
          "
        >
          <h3
            className="
              text-lg
              font-semibold
              text-black
            "
          >
            Sort By
          </h3>

          <button
            type="button"
            onClick={onClose}
            className="
              cursor-pointer
              text-2xl
              text-black
            "
          >
            ×
          </button>
        </div>

        <div className="mt-3">
          {options.map(
            (option) => (
              <button
                key={
                  option.value
                }
                type="button"
                onClick={() => {
                  onChange(
                    option.value
                  );

                  onClose();
                }}
                className="
                  flex
                  w-full
                  cursor-pointer
                  items-center
                  justify-between

                  border-b
                  border-black/10

                  py-4

                  text-[14px]
                  text-black
                "
              >
                {option.label}

                <span
                  className={`
                    flex
                    h-5
                    w-5
                    items-center
                    justify-center

                    rounded-full
                    border

                    ${
                      value ===
                      option.value
                        ? "border-[#B31345]"
                        : "border-black/20"
                    }
                  `}
                >
                  {value ===
                    option.value && (
                    <span
                      className="
                        h-2.5
                        w-2.5
                        rounded-full
                        bg-[#B31345]
                      "
                    />
                  )}
                </span>
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   FILTER SHEET
========================================================= */

function FilterSheet({
  open,
  value,
  onChange,
  onClose,
}: {
  open: boolean;
  value: FilterState;
  onChange: (
    value: FilterState
  ) => void;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  const toggle = (
    key: keyof FilterState
  ) => {
    onChange({
      ...value,
      [key]: !value[key],
    });
  };

  return (
    <div
      className="
        fixed
        inset-0
        z-[10000]

        flex
        items-end

        bg-black/45

        md:hidden
      "
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div
        className="
          w-full

          rounded-t-[22px]

          bg-white

          px-5
          pb-8
          pt-4
        "
      >
        <div
          className="
            mx-auto
            h-1
            w-12

            rounded-full
            bg-black/15
          "
        />

        <div
          className="
            mt-5
            flex
            items-center
            justify-between
          "
        >
          <h3
            className="
              text-lg
              font-semibold
              text-black
            "
          >
            Filter
          </h3>

          <button
            type="button"
            onClick={onClose}
            className="
              cursor-pointer
              text-2xl
              text-black
            "
          >
            ×
          </button>
        </div>

        <div className="mt-3">
          <FilterRow
            label="In Stock"
            active={
              value.inStock
            }
            onClick={() =>
              toggle(
                "inStock"
              )
            }
          />

          <FilterRow
            label="Discounted"
            active={
              value.discounted
            }
            onClick={() =>
              toggle(
                "discounted"
              )
            }
          />

          <FilterRow
            label="New Launch"
            active={
              value.newLaunch
            }
            onClick={() =>
              toggle(
                "newLaunch"
              )
            }
          />
        </div>

        <div
          className="
            mt-6
            grid
            grid-cols-2
            gap-3
          "
        >
          <button
            type="button"
            onClick={() =>
              onChange({
                inStock:
                  false,
                discounted:
                  false,
                newLaunch:
                  false,
              })
            }
            className="
              h-12
              cursor-pointer
              rounded-[8px]
              border
              border-black/15
              font-semibold
            "
          >
            Clear
          </button>

          <button
            type="button"
            onClick={onClose}
            className="
              h-12
              cursor-pointer
              rounded-[8px]
              bg-[#B31345]
              font-semibold
              text-white
            "
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN
========================================================= */

export default function ResponsiveCatalog({
  basePath,
  allLabel,
  products,
  banners,
  categoryRoot,
  categoryPath,
}: Props) {
  const [
    sort,
    setSort,
  ] =
    useState<SortValue>(
      "featured"
    );

  const [
    filters,
    setFilters,
  ] =
    useState<FilterState>({
      inStock: false,
      discounted: false,
      newLaunch: false,
    });

  const [
    sortOpen,
    setSortOpen,
  ] = useState(false);

  const [
    filterOpen,
    setFilterOpen,
  ] = useState(false);

  /* =======================================================
     FILTER / SORT
  ======================================================= */

  const visibleProducts =
    useMemo(() => {
      let result = [
        ...products,
      ];

      /* IN STOCK */

      if (
        filters.inStock
      ) {
        result =
          result.filter(
            (product) =>
              product.sizes.some(
                (size) =>
                  size.stock >
                  0
              )
          );
      }

      /* DISCOUNTED */

      if (
        filters.discounted
      ) {
        result =
          result.filter(
            (product) =>
              product.discountPercent >
              0
          );
      }

      /* NEW LAUNCH */

      if (
        filters.newLaunch
      ) {
        result =
          result.filter(
            (product) =>
              product.isNewLaunch
          );
      }

      /* SORT */

      if (
        sort ===
        "price-low"
      ) {
        result.sort(
          (
            first,
            second
          ) =>
            first.showPrice -
            second.showPrice
        );
      } else if (
        sort ===
        "price-high"
      ) {
        result.sort(
          (
            first,
            second
          ) =>
            second.showPrice -
            first.showPrice
        );
      } else if (
        sort ===
        "newest"
      ) {
        result.sort(
          (
            first,
            second
          ) =>
            Number(
              second.isNewLaunch
            ) -
            Number(
              first.isNewLaunch
            )
        );
      } else {
        result.sort(
          (
            first,
            second
          ) =>
            Number(
              second.isFeatured
            ) -
            Number(
              first.isFeatured
            )
        );
      }

      return result;
    }, [
      products,
      filters,
      sort,
    ]);

  return (
    <main
      className="
        min-h-screen

        overflow-x-clip

        bg-[#FAF8F6]

        pb-[68px]

        text-[#211A18]

        md:pb-16
      "
    >
      {/* ===================================================
          BANNER
      =================================================== */}

      {banners.length >
        0 && (
        <CategoryBannerSlider
          banners={banners}
        />
      )}

      {/* ===================================================
          STICKY CATEGORY NAVIGATION

          MOBILE:
          Navbar ke neeche sticky.

          Products iske neeche scroll karenge.

          DESKTOP:
          Normal behavior.
      =================================================== */}

      <CategoryNavigation
        root={categoryRoot}
        path={categoryPath}
        basePath={basePath}
        allLabel={allLabel}
      />

      {/* ===================================================
          DESKTOP SORT
      =================================================== */}

      <section
        className="
          hidden

          px-6
          py-4

          md:block

          xl:px-8
        "
      >
        <div
          className="
            mx-auto
            flex
            max-w-[1500px]
            justify-end
          "
        >
          <select
            value={sort}
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
              min-w-[190px]
              cursor-pointer

              rounded-[8px]

              border
              border-black/15

              bg-white

              px-4

              text-[11px]
              font-semibold

              text-black

              outline-none

              focus:border-[#B31345]
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
      </section>

      {/* ===================================================
          PRODUCT GRID
      =================================================== */}

      <section
        className="
          relative
          z-0

          mx-auto
          w-full
          max-w-[1500px]

          md:px-6
          md:pt-1

          xl:px-8
        "
      >
        {visibleProducts.length >
        0 ? (
          <div
            className="
              grid
              w-full

              grid-cols-2

              gap-x-[2px]
              gap-y-3

              bg-[#EEE8E5]

              sm:gap-x-3
              sm:gap-y-5
              sm:bg-transparent
              sm:px-3

              md:grid-cols-3
              md:gap-x-5
              md:gap-y-8
              md:px-0

              xl:grid-cols-4
            "
          >
            {visibleProducts.map(
              (product) => (
                <div
                  key={
                    product.variantKey
                  }
                  className="
                    w-full
                    min-w-0
                  "
                >
                  <StorefrontProductCard
                    product={
                      product
                    }
                  />
                </div>
              )
            )}
          </div>
        ) : (
          <div
            className="
              mx-4
              mt-8

              rounded-[16px]

              border
              border-black/10

              bg-white

              px-5
              py-14

              text-center
            "
          >
            No products found
          </div>
        )}
      </section>

      {/* ===================================================
          MOBILE SORT / FILTER
      =================================================== */}

      <div
        className="
          fixed
          bottom-0
          left-0
          right-0
          z-[1000]

          grid
          h-[64px]
          grid-cols-2

          border-t
          border-black/15

          bg-white

          shadow-[0_-7px_24px_rgba(0,0,0,.09)]

          md:hidden
        "
      >
        <button
          type="button"
          onClick={() =>
            setSortOpen(
              true
            )
          }
          className="
            flex
            cursor-pointer
            items-center
            justify-center

            gap-2

            border-r
            border-black/10

            font-semibold
          "
        >
          Sort
        </button>

        <button
          type="button"
          onClick={() =>
            setFilterOpen(
              true
            )
          }
          className="
            flex
            cursor-pointer
            items-center
            justify-center

            gap-2

            font-semibold
          "
        >
          Filter
        </button>
      </div>

      {/* ===================================================
          MOBILE SHEETS
      =================================================== */}

      <SortSheet
        open={sortOpen}
        value={sort}
        onChange={setSort}
        onClose={() =>
          setSortOpen(
            false
          )
        }
      />

      <FilterSheet
        open={
          filterOpen
        }
        value={filters}
        onChange={
          setFilters
        }
        onClose={() =>
          setFilterOpen(
            false
          )
        }
      />
    </main>
  );
}