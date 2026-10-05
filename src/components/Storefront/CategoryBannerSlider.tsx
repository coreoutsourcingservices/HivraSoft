"use client";

import Link from "next/link";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  CatalogBanner,
} from "@/types/catalog";

type Props = {
  banners: CatalogBanner[];
};

export default function CategoryBannerSlider({
  banners,
}: Props) {
  /* =========================================================
     VALID BANNERS
  ========================================================= */

  const validBanners =
    useMemo(
      () =>
        banners.filter(
          (
            banner
          ) =>
            Boolean(
              banner.image
            )
        ),
      [
        banners,
      ]
    );

  const [
    activeIndex,
    setActiveIndex,
  ] =
    useState(0);

  /* =========================================================
     RESET INDEX
  ========================================================= */

  useEffect(() => {
    setActiveIndex(
      0
    );
  }, [
    validBanners.length,
  ]);

  /* =========================================================
     AUTO SLIDE
  ========================================================= */

  useEffect(() => {
    if (
      validBanners.length <=
      1
    ) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          setActiveIndex(
            (
              current
            ) =>
              (
                current +
                1
              ) %
              validBanners.length
          );
        },
        4500
      );

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, [
    validBanners.length,
  ]);

  /* =========================================================
     NO CURRENT CATEGORY IMAGE
     => NO BANNER
  ========================================================= */

  if (
    validBanners.length ===
    0
  ) {
    return null;
  }

  const previousBanner =
    () => {
      setActiveIndex(
        (
          current
        ) =>
          current === 0
            ? validBanners.length -
              1
            : current -
              1
      );
    };

  const nextBanner =
    () => {
      setActiveIndex(
        (
          current
        ) =>
          (
            current +
            1
          ) %
          validBanners.length
      );
    };

  return (
    <section
      className="
        relative
        w-full
        overflow-hidden
        bg-[#EFE6DC]
      "
    >
      {/* ===================================================
          EXACT 1600 × 389 RATIO
      =================================================== */}

      <div
        className="
          relative
          w-full
          aspect-[1600/389]
        "
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
                "#"
              }
              className={`
                absolute
                inset-0
                block
                cursor-pointer

                transition-opacity
                duration-700

                ${
                  activeIndex ===
                  index
                    ? "pointer-events-auto opacity-100"
                    : "pointer-events-none opacity-0"
                }
              `}
            >
              <img
                src={
                  banner.image
                }
                alt={
                  banner.alt ||
                  "Category banner"
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
            </Link>
          )
        )}

        {/* =================================================
            CONTROLS
        ================================================= */}

        {validBanners.length >
          1 && (
          <>
            {/* PREVIOUS */}

            <button
              type="button"
              aria-label="Previous banner"
              onClick={
                previousBanner
              }
              className="
                absolute
                left-2
                top-1/2
                z-20

                flex
                h-8
                w-8
                -translate-y-1/2

                cursor-pointer

                items-center
                justify-center

                rounded-full

                bg-white/90

                text-xl

                text-black

                shadow-md

                transition

                hover:bg-white

                sm:left-4
                sm:h-10
                sm:w-10
                sm:text-2xl
              "
            >
              ‹
            </button>

            {/* NEXT */}

            <button
              type="button"
              aria-label="Next banner"
              onClick={
                nextBanner
              }
              className="
                absolute
                right-2
                top-1/2
                z-20

                flex
                h-8
                w-8
                -translate-y-1/2

                cursor-pointer

                items-center
                justify-center

                rounded-full

                bg-white/90

                text-xl

                text-black

                shadow-md

                transition

                hover:bg-white

                sm:right-4
                sm:h-10
                sm:w-10
                sm:text-2xl
              "
            >
              ›
            </button>

            {/* DOTS */}

            <div
              className="
                absolute
                bottom-2
                left-1/2
                z-20

                flex
                -translate-x-1/2

                items-center
                gap-1.5

                sm:bottom-4
                sm:gap-2
              "
            >
              {validBanners.map(
                (
                  banner,
                  index
                ) => (
                  <button
                    key={`${banner.image}-dot-${index}`}
                    type="button"
                    aria-label={`Banner ${
                      index +
                      1
                    }`}
                    onClick={() =>
                      setActiveIndex(
                        index
                      )
                    }
                    className={`
                      h-2

                      cursor-pointer

                      rounded-full

                      transition-all

                      ${
                        activeIndex ===
                        index
                          ? "w-7 bg-[#B31345] sm:w-8"
                          : "w-2 bg-white/90"
                      }
                    `}
                  />
                )
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}