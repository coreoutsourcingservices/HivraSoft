"use client";

import Link from "next/link";

import {
  useMemo,
  useState,
  type ReactNode,
} from "react";

/* =========================================================
   TYPES
========================================================= */

type BundleProduct = {
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

type BundlePricingCatalogProps = {
  products: BundleProduct[];

  bannerUrl: string;

  categoryName: string;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function BundlePricingCatalog({
  products,
  bannerUrl,
  categoryName,
}: BundlePricingCatalogProps) {
  const [
    sort,
    setSort,
  ] = useState<SortValue>(
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

  /* =======================================================
     FIRST 8 PRODUCTS
  ======================================================= */

  const featuredProducts =
    sortedProducts.slice(
      0,
      8
    );

  /* =======================================================
     PRODUCTS AFTER FIRST 8
  ======================================================= */

  const moreProducts =
    sortedProducts.slice(
      8
    );

  /* =======================================================
     IMAGES FOR COMFORT BANNER
  ======================================================= */

  const comfortImages =
    sortedProducts
      .filter(
        (product) =>
          Boolean(
            product.image
          )
      )
      .slice(
        0,
        3
      );

  /* =======================================================
     UI
  ======================================================= */

  return (
    <main
      className="
        min-h-screen
        overflow-x-hidden
        bg-[#FCFAF8]
        text-[#292526]
      "
    >
      {/* =================================================
          TOP CATEGORY BANNER

          IMPORTANT:
          h-auto rakha hai.
          Banner crop nahi hoga.
      ================================================= */}

      {bannerUrl ? (
        <section
          className="
            w-full
            overflow-hidden
            bg-[#F3ECE7]
          "
        >
          <img
            src={bannerUrl}
            alt={categoryName}
            className="
              block
              h-auto
              w-full
            "
          />
        </section>
      ) : null}

      {/* =================================================
          FEATURED PRODUCTS
      ================================================= */}

      <section
        className="
          mx-auto
          w-full
          max-w-[1380px]
          px-4
          pb-14
          pt-10

          sm:px-6

          md:px-8
          md:pt-14

          lg:px-10
          lg:pb-16
        "
      >
        {/* =================================================
            TITLE + SORT
        ================================================= */}

        <div
          className="
            flex
            flex-col
            gap-6
            border-b
            border-black/[0.07]
            pb-6

            sm:flex-row
            sm:items-end
            sm:justify-between
          "
        >
          <div>
            <p
              className="
                text-[8px]
                font-semibold
                uppercase
                tracking-[0.24em]
                text-[#8A1734]

                sm:text-[9px]
              "
            >
              Better Together
            </p>

            <h1
              className="
                mt-2
                text-[28px]
                font-medium
                leading-tight
                tracking-[-0.035em]
                text-[#481722]

                sm:text-[34px]

                lg:text-[40px]
              "
            >
              Featured Collection
            </h1>

            <p
              className="
                mt-2
                max-w-[590px]
                text-[10px]
                leading-5
                text-black/45

                sm:text-[11px]
                sm:leading-6
              "
            >
              Everyday essentials
              for a softer,
              brighter you.
              Explore thoughtfully
              selected pieces for
              women and men.
            </p>
          </div>

          {/* SORT */}

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
                  text-[8px]
                  font-semibold
                  uppercase
                  tracking-[0.14em]
                  text-black/40

                  sm:block
                "
              >
                Sort By
              </span>

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
                  min-w-[175px]
                  cursor-pointer
                  rounded-full
                  border
                  border-black/10
                  bg-white
                  px-4
                  text-[10px]
                  font-medium
                  text-[#332B2A]
                  outline-none
                  transition

                  hover:border-[#8A1734]/30

                  focus:border-[#8A1734]/50
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
            EMPTY STATE
        ================================================= */}

        {featuredProducts.length ===
        0 ? (
          <div
            className="
              flex
              min-h-[380px]
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
                h-16
                w-16
                items-center
                justify-center
                rounded-full
                bg-[#8A1734]/[0.06]
                text-[#8A1734]
              "
            >
              <HeartIcon />
            </div>

            <h2
              className="
                mt-5
                text-[20px]
                font-semibold
                text-[#3D2528]
              "
            >
              Products Coming Soon
            </h2>

            <p
              className="
                mt-2
                max-w-[430px]
                text-[10px]
                leading-5
                text-black/40
              "
            >
              Bundle Pricing
              category me products
              add karoge to woh
              automatically yahan
              show honge.
            </p>
          </div>
        ) : (
          <div
            className="
              mt-8
              grid
              grid-cols-2
              gap-x-3
              gap-y-9

              sm:gap-x-5

              md:grid-cols-3
              md:gap-x-6
              md:gap-y-11

              lg:grid-cols-4
              lg:gap-x-6
            "
          >
            {featuredProducts.map(
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

      {/* =================================================
          BUILD YOUR COMFORT SET
      ================================================= */}

      {products.length >
        0 && (
        <section
          className="
            mx-auto
            w-full
            max-w-[1380px]
            px-4
            pb-16

            sm:px-6

            md:px-8

            lg:px-10
          "
        >
          <div
            className="
              relative
              overflow-hidden
              rounded-[22px]
              border
              border-[#8A1734]/10
              bg-[#F4E8E2]
            "
          >
            {/* BACKGROUND DECORATIONS */}

            <div
              className="
                pointer-events-none
                absolute
                -left-24
                -top-24
                h-[300px]
                w-[300px]
                rounded-full
                bg-white/50
                blur-3xl
              "
            />

            <div
              className="
                pointer-events-none
                absolute
                -bottom-28
                left-[45%]
                h-[280px]
                w-[280px]
                rounded-full
                bg-[#9D5365]/10
                blur-3xl
              "
            />

            <div
              className="
                relative
                grid
                grid-cols-1

                lg:grid-cols-[1.05fr_0.95fr]
              "
            >
              {/* =================================================
                  LEFT
              ================================================= */}

              <div
                className="
                  flex
                  min-h-[340px]
                  flex-col
                  justify-center
                  px-6
                  py-10

                  sm:px-9

                  md:px-12

                  lg:px-14
                  lg:py-12
                "
              >
                <p
                  className="
                    text-[8px]
                    font-semibold
                    uppercase
                    tracking-[0.25em]
                    text-[#8A1734]
                  "
                >
                  The HivraSoft
                  Bundle
                </p>

                <h2
                  className="
                    mt-3
                    max-w-[620px]
                    text-[32px]
                    font-medium
                    leading-[1.04]
                    tracking-[-0.04em]
                    text-[#501724]

                    sm:text-[39px]

                    lg:text-[47px]
                  "
                >
                  Build Your
                  Comfort Set
                </h2>

                <p
                  className="
                    mt-4
                    max-w-[500px]
                    text-[11px]
                    leading-6
                    text-[#675957]

                    sm:text-[12px]
                  "
                >
                  Pick your
                  favourites, mix
                  your everyday
                  essentials and
                  create a bundle
                  made around your
                  comfort.
                </p>

                {/* FEATURES */}

                <div
                  className="
                    mt-7
                    grid
                    max-w-[650px]
                    grid-cols-1
                    gap-4

                    sm:grid-cols-3
                  "
                >
                  <ComfortFeature
                    icon={
                      <BraIcon />
                    }
                    title="Pick your favourites"
                  />

                  <ComfortFeature
                    icon={
                      <BagIcon />
                    }
                    title="Save more together"
                  />

                  <ComfortFeature
                    icon={
                      <HeartIcon />
                    }
                    title="Comfort made smarter"
                  />
                </div>

                <Link
                  href="#more-products"
                  className="
                    mt-8
                    inline-flex
                    h-11
                    w-fit
                    items-center
                    justify-center
                    gap-3
                    rounded-full
                    bg-[#74172C]
                    px-6
                    text-[8px]
                    font-semibold
                    uppercase
                    tracking-[0.13em]
                    text-white
                    transition-all
                    duration-300

                    hover:bg-[#52101F]
                    hover:px-7
                  "
                >
                  Explore More

                  <span
                    className="
                      text-[14px]
                      font-normal
                    "
                  >
                    →
                  </span>
                </Link>
              </div>

              {/* =================================================
                  RIGHT COLLAGE
              ================================================= */}

              <div
                className="
                  relative
                  min-h-[330px]
                  overflow-hidden
                  bg-gradient-to-br
                  from-[#E6C6BE]
                  via-[#EFD9D2]
                  to-[#F8EFEB]

                  sm:min-h-[370px]

                  lg:min-h-full
                "
              >
                {/* SCRIPT TEXT */}

                <div
                  className="
                    absolute
                    right-6
                    top-7
                    z-30
                    max-w-[150px]
                    rotate-[-5deg]
                    text-right
                    text-[17px]
                    font-medium
                    italic
                    leading-6
                    text-[#8A4053]/70

                    sm:right-9
                    sm:text-[20px]
                  "
                >
                  Comfort
                  looks good
                  on you ♡
                </div>

                {/* IMAGE 1 */}

                {comfortImages[0]
                  ?.image && (
                  <div
                    className="
                      absolute
                      bottom-[-7%]
                      left-[3%]
                      h-[72%]
                      w-[39%]
                      rotate-[-6deg]
                      overflow-hidden
                      rounded-[18px]
                      border
                      border-white/40
                      bg-white/40
                      shadow-[0_22px_50px_rgba(82,20,37,0.13)]
                    "
                  >
                    <img
                      src={
                        comfortImages[0]
                          .image
                      }
                      alt={
                        comfortImages[0]
                          .name
                      }
                      className="
                        h-full
                        w-full
                        object-cover
                        object-center
                      "
                    />
                  </div>
                )}

                {/* IMAGE 2 */}

                {comfortImages[1]
                  ?.image && (
                  <div
                    className="
                      absolute
                      bottom-[-10%]
                      left-[34%]
                      z-10
                      h-[79%]
                      w-[39%]
                      overflow-hidden
                      rounded-[18px]
                      border
                      border-white/50
                      bg-white/45
                      shadow-[0_22px_50px_rgba(82,20,37,0.14)]
                    "
                  >
                    <img
                      src={
                        comfortImages[1]
                          .image
                      }
                      alt={
                        comfortImages[1]
                          .name
                      }
                      className="
                        h-full
                        w-full
                        object-cover
                        object-center
                      "
                    />
                  </div>
                )}

                {/* IMAGE 3 */}

                {comfortImages[2]
                  ?.image && (
                  <div
                    className="
                      absolute
                      bottom-[-6%]
                      right-[2%]
                      h-[70%]
                      w-[36%]
                      rotate-[6deg]
                      overflow-hidden
                      rounded-[18px]
                      border
                      border-white/40
                      bg-white/40
                      shadow-[0_22px_50px_rgba(82,20,37,0.13)]
                    "
                  >
                    <img
                      src={
                        comfortImages[2]
                          .image
                      }
                      alt={
                        comfortImages[2]
                          .name
                      }
                      className="
                        h-full
                        w-full
                        object-cover
                        object-center
                      "
                    />
                  </div>
                )}

                {/* ONE IMAGE FALLBACK */}

                {comfortImages.length ===
                  1 && (
                  <div
                    className="
                      absolute
                      bottom-6
                      right-6
                      rounded-full
                      bg-[#71182B]
                      px-5
                      py-3
                      text-[8px]
                      font-semibold
                      uppercase
                      tracking-[0.11em]
                      text-white
                    "
                  >
                    More products
                    coming soon
                  </div>
                )}

                {/* NO IMAGE FALLBACK */}

                {comfortImages.length ===
                  0 && (
                  <div
                    className="
                      flex
                      h-full
                      min-h-[330px]
                      items-center
                      justify-center
                      px-8
                      text-center
                    "
                  >
                    <p
                      className="
                        max-w-[260px]
                        text-[11px]
                        leading-6
                        text-[#7A5D62]
                      "
                    >
                      Product images
                      add karte hi
                      comfort collage
                      automatically
                      yahan show hoga.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =================================================
          PRODUCTS AFTER 8
      ================================================= */}

      {moreProducts.length >
        0 && (
        <section
          id="more-products"
          className="
            mx-auto
            w-full
            max-w-[1380px]
            px-4
            pb-20

            sm:px-6

            md:px-8

            lg:px-10
          "
        >
          <div
            className="
              flex
              flex-col
              gap-4
              border-b
              border-black/[0.07]
              pb-6

              sm:flex-row
              sm:items-end
              sm:justify-between
            "
          >
            <div>
              <p
                className="
                  text-[8px]
                  font-semibold
                  uppercase
                  tracking-[0.22em]
                  text-[#8A1734]
                "
              >
                Keep Exploring
              </p>

              <h2
                className="
                  mt-2
                  text-[28px]
                  font-medium
                  tracking-[-0.03em]
                  text-[#431722]

                  sm:text-[34px]
                "
              >
                More To Love
              </h2>

              <p
                className="
                  mt-1.5
                  text-[10px]
                  leading-5
                  text-black/40
                "
              >
                More everyday
                favourites,
                selected for you.
              </p>
            </div>

            <span
              className="
                text-[9px]
                text-black/35
              "
            >
              {
                moreProducts.length
              }{" "}
              {moreProducts.length ===
              1
                ? "product"
                : "products"}
            </span>
          </div>

          <div
            className="
              mt-8
              grid
              grid-cols-2
              gap-x-3
              gap-y-9

              sm:gap-x-5

              md:grid-cols-3
              md:gap-x-6
              md:gap-y-11

              lg:grid-cols-4
            "
          >
            {moreProducts.map(
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
                    index + 8
                  }
                />
              )
            )}
          </div>
        </section>
      )}

      {/* =================================================
          SMALL BOTTOM BENEFIT STRIP
          FOOTER NAHI HAI
      ================================================= */}

      <section
        className="
          border-t
          border-black/[0.05]
          bg-[#F7EFEB]
        "
      >
        <div
          className="
            mx-auto
            grid
            w-full
            max-w-[1380px]
            grid-cols-2
            gap-y-6
            px-5
            py-8

            md:grid-cols-4
            md:px-9
          "
        >
          <BottomBenefit
            icon={
              <LeafIcon />
            }
            title="Gentle on You"
            text="Everyday comfort"
          />

          <BottomBenefit
            icon={
              <FlowerIcon />
            }
            title="Thoughtful"
            text="Designed with care"
          />

          <BottomBenefit
            icon={
              <DiamondIcon />
            }
            title="Premium"
            text="Made to feel better"
          />

          <BottomBenefit
            icon={
              <HeartIcon />
            }
            title="For Every You"
            text="Comfort with confidence"
          />
        </div>
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
  product: BundleProduct;
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
            rounded-[16px]
            border
            border-black/[0.055]
            bg-[#F0E9E5]
          "
        >
          {/* NUMBER */}

          <span
            className="
              absolute
              left-3
              top-3
              z-30
              rounded-full
              bg-white/90
              px-2.5
              py-1.5
              text-[7px]
              font-semibold
              tracking-[0.1em]
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
                z-30
                rounded-full
                bg-[#8A1734]
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

          {/* PRODUCT IMAGE */}

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
                      ? "group-hover:scale-[1.02] group-hover:opacity-0"
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
              No Product Image
            </div>
          )}

          {/* VIEW PRODUCT HOVER */}

          <div
            className="
              absolute
              inset-x-3
              bottom-3
              z-30
              translate-y-3
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
                bg-white/95
                text-[8px]
                font-semibold
                uppercase
                tracking-[0.1em]
                text-[#4B1722]
                shadow-lg
                backdrop-blur
              "
            >
              View Product

              <span
                className="
                  ml-2
                  text-[13px]
                "
              >
                →
              </span>
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
              gap-3
            "
          >
            <h3
              className="
                min-w-0
                flex-1
                text-[11px]
                font-semibold
                leading-[1.45]
                text-[#2F2928]

                sm:text-[12px]
              "
            >
              {
                product.name
              }
            </h3>

            <span
              className="
                shrink-0
                text-[14px]
                text-black/25
                transition-all

                group-hover:translate-x-1
                group-hover:text-[#8A1734]
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
                min-h-[32px]
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
                text-[13px]
                font-semibold
                text-[#32171C]

                sm:text-[14px]
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

          {/* COLOR COUNT */}

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
                  bg-[#8A1734]/70
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

          {/* BUTTON */}

          <div
            className="
              mt-4
              flex
              h-10
              items-center
              justify-center
              gap-2
              rounded-full
              bg-[#78162B]
              text-[8px]
              font-semibold
              uppercase
              tracking-[0.09em]
              text-white
              transition

              group-hover:bg-[#53101E]
            "
          >
            <BagIcon />

            View Product
          </div>
        </div>
      </Link>
    </article>
  );
}

/* =========================================================
   COMFORT FEATURE
========================================================= */

function ComfortFeature({
  icon,
  title,
}: {
  icon: ReactNode;
  title: string;
}) {
  return (
    <div
      className="
        flex
        items-center
        gap-3
      "
    >
      <div
        className="
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center
          rounded-full
          bg-white/60
          text-[#79172B]
        "
      >
        {icon}
      </div>

      <span
        className="
          max-w-[120px]
          text-[8px]
          font-medium
          leading-4
          text-[#4E4140]
        "
      >
        {title}
      </span>
    </div>
  );
}

/* =========================================================
   BOTTOM BENEFIT
========================================================= */

function BottomBenefit({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div
      className="
        flex
        items-center
        justify-center
        gap-3
        px-3

        md:border-r
        md:border-black/[0.07]

        md:last:border-r-0
      "
    >
      <div
        className="
          shrink-0
          text-[#8A1734]
        "
      >
        {icon}
      </div>

      <div>
        <p
          className="
            text-[9px]
            font-semibold
            text-[#3E3332]
          "
        >
          {title}
        </p>

        <p
          className="
            mt-0.5
            text-[7px]
            text-black/40
          "
        >
          {text}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   ICONS
========================================================= */

function HeartIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8h12l1 13H5L6 8Z" />

      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function BraIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7v8c2.5 0 4.5 1.2 6 3 1.5-1.8 3-3 3-6V7" />

      <path d="M21 7v8c-2.5 0-4.5 1.2-6 3-1.5-1.8-3-3-3-6" />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 4c-8 0-14 3-14 9 0 4 3 7 7 7 6 0 8-8 7-16Z" />

      <path d="M6 20c2-5 6-9 11-12" />
    </svg>
  );
}

function FlowerIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle
        cx="12"
        cy="12"
        r="2"
      />

      <path d="M12 2c2 0 3 3 3 5s-1 3-3 3-3-1-3-3 1-5 3-5Z" />

      <path d="M22 12c0 2-3 3-5 3s-3-1-3-3 1-3 3-3 5 1 5 3Z" />

      <path d="M12 22c-2 0-3-3-3-5s1-3 3-3 3 1 3 3-1 5-3 5Z" />

      <path d="M2 12c0-2 3-3 5-3s3 1 3 3-1 3-3 3-5-1-5-3Z" />
    </svg>
  );
}

function DiamondIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 9 4-5h10l4 5-9 11L3 9Z" />

      <path d="M3 9h18" />

      <path d="m7 4 5 16 5-16" />
    </svg>
  );
}