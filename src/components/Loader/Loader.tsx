"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  usePathname,
} from "next/navigation";

import {
  gsap,
} from "gsap";

/* =========================================================
   TYPES
========================================================= */

type LoaderProps = {
  onComplete?:
    () => void;
};

/* =========================================================
   GREETINGS
========================================================= */

const greetings = [
  {
    text: "नमस्ते",
    dir: "ltr" as const,
    font:
      '"Noto Sans Devanagari", "Segoe UI", sans-serif',
  },

  {
    text: "Hello",
    dir: "ltr" as const,
    font:
      '"Cormorant Garamond", Georgia, "Times New Roman", serif',
  },

  {
    text: "السلام علیکم",
    dir: "rtl" as const,
    font:
      '"Noto Nastaliq Urdu", "Segoe UI", serif',
  },
];

/* =========================================================
   BRAND LETTERS
========================================================= */

const brandLetters =
  "HIVRASOFT".split("");

/* =========================================================
   LOADER
========================================================= */

export default function Loader({
  onComplete,
}: LoaderProps) {
  const pathname =
    usePathname();

  const [
    active,
    setActive,
  ] =
    useState(
      pathname === "/"
    );

  const loaderRef =
    useRef<HTMLDivElement>(
      null
    );

  /* =======================================================
     SHOW ONLY ON HOME PAGE
  ======================================================= */

  useEffect(() => {
    if (
      pathname === "/"
    ) {
      setActive(
        true
      );
    } else {
      setActive(
        false
      );
    }
  }, [
    pathname,
  ]);

  /* =======================================================
     MAIN ANIMATION
  ======================================================= */

  useEffect(() => {
    if (
      !active ||
      pathname !== "/"
    ) {
      return;
    }

    const loader =
      loaderRef.current;

    if (
      !loader
    ) {
      return;
    }

    const previousOverflow =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    /* =====================================================
       REDUCED MOTION
    ===================================================== */

    const reduceMotion =
      window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

    if (
      reduceMotion
    ) {
      const timer =
        window.setTimeout(
          () => {
            document.body.style.overflow =
              previousOverflow;

            setActive(
              false
            );

            onComplete?.();
          },
          400
        );

      return () => {
        window.clearTimeout(
          timer
        );

        document.body.style.overflow =
          previousOverflow;
      };
    }

    /* =====================================================
       GSAP CONTEXT
    ===================================================== */

    const ctx =
      gsap.context(
        () => {
          const greetingElements =
            gsap.utils.toArray<HTMLElement>(
              "[data-loader-greeting]"
            );

          const taglineMask =
            loader.querySelector<HTMLElement>(
              "[data-tagline-mask]"
            );

          const tagline =
            loader.querySelector<HTMLElement>(
              "[data-tagline]"
            );

          const taglineLine =
            loader.querySelector<HTMLElement>(
              "[data-tagline-line]"
            );

          const brandKicker =
            loader.querySelector<HTMLElement>(
              "[data-brand-kicker]"
            );

          const letters =
            gsap.utils.toArray<HTMLElement>(
              "[data-brand-letter]"
            );

          const brandSubline =
            loader.querySelector<HTMLElement>(
              "[data-brand-subline]"
            );

          const progress =
            loader.querySelector<HTMLElement>(
              "[data-progress]"
            );

          const silkOne =
            loader.querySelector<HTMLElement>(
              "[data-silk-one]"
            );

          const silkTwo =
            loader.querySelector<HTMLElement>(
              "[data-silk-two]"
            );

          const silkThree =
            loader.querySelector<HTMLElement>(
              "[data-silk-three]"
            );

          const shine =
            loader.querySelector<HTMLElement>(
              "[data-shine]"
            );

          /* ===============================================
             INITIAL STATE
          =============================================== */

          gsap.set(
            greetingElements,
            {
              autoAlpha:
                0,

              y:
                55,

              rotateX:
                45,

              scale:
                0.94,

              filter:
                "blur(14px)",

              transformPerspective:
                900,
            }
          );

          if (
            taglineMask
          ) {
            gsap.set(
              taglineMask,
              {
                autoAlpha:
                  0,
              }
            );
          }

          if (
            tagline
          ) {
            gsap.set(
              tagline,
              {
                yPercent:
                  120,

                filter:
                  "blur(8px)",
              }
            );
          }

          if (
            taglineLine
          ) {
            gsap.set(
              taglineLine,
              {
                scaleX:
                  0,

                transformOrigin:
                  "left center",
              }
            );
          }

          if (
            brandKicker
          ) {
            gsap.set(
              brandKicker,
              {
                autoAlpha:
                  0,

                y:
                  15,

                letterSpacing:
                  "0.55em",
              }
            );
          }

          gsap.set(
            letters,
            {
              autoAlpha:
                0,

              y:
                80,

              rotateX:
                70,

              rotateZ:
                3,

              scale:
                0.88,

              filter:
                "blur(12px)",

              transformPerspective:
                1000,
            }
          );

          if (
            brandSubline
          ) {
            gsap.set(
              brandSubline,
              {
                autoAlpha:
                  0,

                y:
                  12,
              }
            );
          }

          if (
            progress
          ) {
            gsap.set(
              progress,
              {
                scaleX:
                  0,

                transformOrigin:
                  "left center",
              }
            );
          }

          /* ===============================================
             BACKGROUND MOVEMENT
          =============================================== */

          if (
            silkOne
          ) {
            gsap.to(
              silkOne,
              {
                xPercent:
                  14,

                yPercent:
                  -9,

                rotate:
                  6,

                duration:
                  7,

                repeat:
                  -1,

                yoyo:
                  true,

                ease:
                  "sine.inOut",
              }
            );
          }

          if (
            silkTwo
          ) {
            gsap.to(
              silkTwo,
              {
                xPercent:
                  -12,

                yPercent:
                  11,

                rotate:
                  -7,

                duration:
                  8,

                repeat:
                  -1,

                yoyo:
                  true,

                ease:
                  "sine.inOut",
              }
            );
          }

          if (
            silkThree
          ) {
            gsap.to(
              silkThree,
              {
                xPercent:
                  10,

                yPercent:
                  7,

                scale:
                  1.08,

                duration:
                  6,

                repeat:
                  -1,

                yoyo:
                  true,

                ease:
                  "sine.inOut",
              }
            );
          }

          if (
            shine
          ) {
            gsap.fromTo(
              shine,
              {
                xPercent:
                  -180,
              },
              {
                xPercent:
                  180,

                duration:
                  4.5,

                repeat:
                  -1,

                repeatDelay:
                  0.3,

                ease:
                  "power1.inOut",
              }
            );
          }

          /* ===============================================
             MAIN TIMELINE
          =============================================== */

          const timeline =
            gsap.timeline({
              defaults: {
                overwrite:
                  "auto",
              },

              onComplete:
                () => {
                  document.body.style.overflow =
                    previousOverflow;

                  setActive(
                    false
                  );

                  onComplete?.();
                },
            });

          /* ===============================================
             GREETINGS
          =============================================== */

          greetingElements.forEach(
            (
              greeting,
              index
            ) => {
              timeline
                .to(
                  greeting,
                  {
                    autoAlpha:
                      1,

                    y:
                      0,

                    rotateX:
                      0,

                    scale:
                      1,

                    filter:
                      "blur(0px)",

                    duration:
                      0.68,

                    ease:
                      "power4.out",
                  }
                )

                .to(
                  progress,
                  {
                    scaleX:
                      (index + 1) /
                      5,

                    duration:
                      0.55,

                    ease:
                      "power3.out",
                  },
                  "<"
                )

                .to(
                  {},
                  {
                    duration:
                      0.42,
                  }
                )

                .to(
                  greeting,
                  {
                    autoAlpha:
                      0,

                    y:
                      -48,

                    rotateX:
                      -38,

                    scale:
                      1.04,

                    filter:
                      "blur(11px)",

                    duration:
                      0.42,

                    ease:
                      "power3.in",
                  }
                );
            }
          );

          /* ===============================================
             MADE TO FEEL LIKE YOU
          =============================================== */

          if (
            taglineMask &&
            tagline &&
            taglineLine
          ) {
            timeline
              .set(
                taglineMask,
                {
                  autoAlpha:
                    1,
                }
              )

              .to(
                tagline,
                {
                  yPercent:
                    0,

                  filter:
                    "blur(0px)",

                  duration:
                    0.9,

                  ease:
                    "power4.out",
                }
              )

              .to(
                progress,
                {
                  scaleX:
                    0.8,

                  duration:
                    0.65,

                  ease:
                    "power3.out",
                },
                "<"
              )

              .to(
                taglineLine,
                {
                  scaleX:
                    1,

                  duration:
                    0.7,

                  ease:
                    "power4.out",
                },
                "-=0.42"
              )

              .to(
                {},
                {
                  duration:
                    0.65,
                }
              )

              .to(
                tagline,
                {
                  yPercent:
                    -120,

                  filter:
                    "blur(7px)",

                  duration:
                    0.68,

                  ease:
                    "power4.in",
                }
              )

              .to(
                taglineLine,
                {
                  scaleX:
                    0,

                  transformOrigin:
                    "right center",

                  duration:
                    0.35,

                  ease:
                    "power3.in",
                },
                "<"
              )

              .set(
                taglineMask,
                {
                  autoAlpha:
                    0,
                }
              );
          }

          /* ===============================================
             WELCOME TO HIVRASOFT
          =============================================== */

          if (
            brandKicker
          ) {
            timeline.to(
              brandKicker,
              {
                autoAlpha:
                  1,

                y:
                  0,

                letterSpacing:
                  "0.38em",

                duration:
                  0.7,

                ease:
                  "power4.out",
              }
            );
          }

          timeline.to(
            letters,
            {
              autoAlpha:
                1,

              y:
                0,

              rotateX:
                0,

              rotateZ:
                0,

              scale:
                1,

              filter:
                "blur(0px)",

              duration:
                0.85,

              stagger:
                0.055,

              ease:
                "back.out(1.45)",
            },
            "-=0.25"
          );

          if (
            brandSubline
          ) {
            timeline.to(
              brandSubline,
              {
                autoAlpha:
                  1,

                y:
                  0,

                duration:
                  0.55,

                ease:
                  "power3.out",
              },
              "-=0.35"
            );
          }

          timeline
            .to(
              progress,
              {
                scaleX:
                  1,

                duration:
                  0.7,

                ease:
                  "power3.out",
              },
              "<"
            )

            .to(
              {},
              {
                duration:
                  0.75,
              }
            );

          /* ===============================================
             BRAND EXIT
          =============================================== */

          if (
            brandKicker ||
            brandSubline
          ) {
            timeline.to(
              [
                brandKicker,
                brandSubline,
              ].filter(
                Boolean
              ),
              {
                autoAlpha:
                  0,

                y:
                  -15,

                duration:
                  0.35,

                ease:
                  "power3.in",
              }
            );
          }

          timeline
            .to(
              letters,
              {
                autoAlpha:
                  0,

                y:
                  -38,

                rotateX:
                  -28,

                scale:
                  1.04,

                filter:
                  "blur(8px)",

                duration:
                  0.45,

                stagger: {
                  each:
                    0.025,

                  from:
                    "center",
                },

                ease:
                  "power3.in",
              },
              "<"
            )

            /* =============================================
               FINAL CURTAIN EXIT
            ============================================= */

            .to(
              loader,
              {
                yPercent:
                  -100,

                skewY:
                  -1.5,

                duration:
                  1.1,

                ease:
                  "power4.inOut",
              }
            );
        },
        loader
      );

    return () => {
      ctx.revert();

      document.body.style.overflow =
        previousOverflow;
    };
  }, [
    active,
    pathname,
    onComplete,
  ]);

  /* =======================================================
     ONLY MAIN HOME PAGE
  ======================================================= */

  if (
    pathname !== "/" ||
    !active
  ) {
    return null;
  }

  return (
    <div
      ref={
        loaderRef
      }
      className="
        fixed
        inset-0

        z-[99999]

        flex

        items-center
        justify-center

        overflow-hidden

        bg-[#FCE7ED]

        text-[#761A36]

        [perspective:1200px]
      "
    >
      {/* =================================================
          BASE SOFT PINK BACKGROUND
      ================================================= */}

      <div
        className="
          pointer-events-none

          absolute
          inset-0

          bg-gradient-to-br

          from-[#FFF9FA]

          via-[#FCE7ED]

          to-[#F6D5DF]
        "
      />

      {/* =================================================
          SILK LIGHT 01
      ================================================= */}

      <div
        data-silk-one
        className="
          pointer-events-none

          absolute

          -left-[20%]
          top-[7%]

          h-[180px]
          w-[90%]

          -rotate-[14deg]

          rounded-[100%]

          bg-gradient-to-r

          from-transparent

          via-white/55

          to-transparent

          blur-[45px]

          sm:h-[230px]

          md:h-[300px]
        "
      />

      {/* =================================================
          SILK LIGHT 02
      ================================================= */}

      <div
        data-silk-two
        className="
          pointer-events-none

          absolute

          -right-[25%]
          top-[48%]

          h-[210px]
          w-[95%]

          rotate-[16deg]

          rounded-[100%]

          bg-gradient-to-r

          from-transparent

          via-[#ECA8B9]/35

          to-transparent

          blur-[55px]

          md:h-[300px]
        "
      />

      {/* =================================================
          SILK LIGHT 03
      ================================================= */}

      <div
        data-silk-three
        className="
          pointer-events-none

          absolute

          bottom-[-18%]
          left-[8%]

          h-[330px]
          w-[85%]

          -rotate-[8deg]

          rounded-[100%]

          bg-gradient-to-r

          from-transparent

          via-[#FFFFFF]/45

          to-transparent

          blur-[80px]

          md:h-[470px]
        "
      />

      {/* =================================================
          MOVING LIGHT SHINE
      ================================================= */}

      <div
        data-shine
        className="
          pointer-events-none

          absolute

          -left-[35%]
          top-0

          h-full
          w-[28%]

          -skew-x-[20deg]

          bg-gradient-to-r

          from-transparent

          via-white/25

          to-transparent

          blur-[30px]
        "
      />

      {/* =================================================
          TOP BRAND
      ================================================= */}

      <div
        className="
          absolute

          left-1/2
          top-7

          -translate-x-1/2

          whitespace-nowrap

          text-[7px]
          font-semibold

          uppercase

          tracking-[0.48em]

          text-[#8B5364]/45

          sm:top-9
          sm:text-[8px]
        "
      >
        Hivra Soft
      </div>

      {/* =================================================
          MAIN CENTER AREA
      ================================================= */}

      <div
        className="
          relative

          z-20

          flex

          h-[180px]
          w-full

          items-center
          justify-center

          overflow-visible

          px-4

          text-center

          [transform-style:preserve-3d]

          sm:h-[220px]
        "
      >
        {/* ===============================================
            GREETINGS

            IMPORTANT:
            opacity-0 prevents first-render overlap.
        =============================================== */}

        {greetings.map(
          (
            greeting,
            index
          ) => (
            <h1
              key={
                greeting.text
              }
              data-loader-greeting
              dir={
                greeting.dir
              }
              className="
                absolute

                left-1/2
                top-1/2

                w-full

                max-w-[95vw]

                -translate-x-1/2
                -translate-y-1/2

                opacity-0

                px-4

                text-center

                text-[42px]

                font-normal

                leading-[1.2]

                text-[#771A38]

                will-change-transform

                sm:text-[56px]

                md:text-[72px]

                lg:text-[86px]
              "
              style={{
                fontFamily:
                  greeting.font,

                fontStyle:
                  index === 1
                    ? "italic"
                    : "normal",
              }}
            >
              {
                greeting.text
              }
            </h1>
          )
        )}

        {/* ===============================================
            MADE TO FEEL LIKE YOU

            Initial opacity-0 prevents overlap.
        =============================================== */}

        <div
          data-tagline-mask
          className="
            absolute

            left-1/2
            top-1/2

            w-full
            max-w-[95vw]

            -translate-x-1/2
            -translate-y-1/2

            overflow-hidden

            opacity-0

            px-4
            py-7

            will-change-transform
          "
        >
          <h2
            data-tagline
            className="
              text-center

              font-serif

              text-[29px]

              font-medium

              italic

              leading-[1.1]

              tracking-[-0.035em]

              text-[#68152F]

              will-change-transform

              sm:text-[42px]

              md:text-[58px]

              lg:text-[70px]
            "
          >
            Made to feel like you
          </h2>

          <div
            className="
              mx-auto

              mt-5

              h-px
              w-[90px]

              overflow-hidden

              bg-[#A84561]/15

              sm:w-[120px]
            "
          >
            <div
              data-tagline-line
              className="
                h-full
                w-full

                origin-left

                scale-x-0

                bg-[#9D2C4D]
              "
            />
          </div>
        </div>

        {/* ===============================================
            FINAL BRAND
        =============================================== */}

        <div
          className="
            absolute

            left-1/2
            top-1/2

            w-full

            -translate-x-1/2
            -translate-y-1/2

            px-3

            text-center

            [transform-style:preserve-3d]
          "
        >
          {/* WELCOME TO */}

          <p
            data-brand-kicker
            className="
              mb-3

              opacity-0

              text-[8px]

              font-semibold

              uppercase

              tracking-[0.38em]

              text-[#9A4961]

              will-change-transform

              sm:mb-4
              sm:text-[10px]

              md:text-[11px]
            "
          >
            Welcome To
          </p>

          {/* HIVRASOFT */}

          <div
            className="
              flex

              items-center
              justify-center

              overflow-visible

              [transform-style:preserve-3d]
            "
          >
            {brandLetters.map(
              (
                letter,
                index
              ) => (
                <span
                  key={
                    `${letter}-${index}`
                  }
                  data-brand-letter
                  className="
                    inline-block

                    opacity-0

                    text-[30px]

                    font-semibold

                    leading-none

                    tracking-[0.035em]

                    text-[#741735]

                    will-change-transform

                    [transform-style:preserve-3d]

                    sm:text-[43px]

                    md:text-[60px]

                    lg:text-[76px]
                  "
                >
                  {
                    letter
                  }
                </span>
              )
            )}
          </div>

          {/* SUBLINE */}

          <p
            data-brand-subline
            className="
              mt-4

              opacity-0

              text-[7px]

              font-medium

              uppercase

              tracking-[0.3em]

              text-[#98556A]/65

              will-change-transform

              sm:mt-5
              sm:text-[8px]
            "
          >
            Comfort • Confidence • You
          </p>
        </div>
      </div>

      {/* =================================================
          LEFT DECORATIVE LINE
      ================================================= */}

      <div
        className="
          pointer-events-none

          absolute

          left-5
          top-1/2

          hidden

          h-[110px]
          w-px

          -translate-y-1/2

          bg-gradient-to-b

          from-transparent

          via-[#9E5368]/30

          to-transparent

          sm:block
          sm:left-8

          lg:left-12
        "
      />

      {/* =================================================
          RIGHT DECORATIVE LINE
      ================================================= */}

      <div
        className="
          pointer-events-none

          absolute

          right-5
          top-1/2

          hidden

          h-[110px]
          w-px

          -translate-y-1/2

          bg-gradient-to-b

          from-transparent

          via-[#9E5368]/30

          to-transparent

          sm:block
          sm:right-8

          lg:right-12
        "
      />

      {/* =================================================
          BOTTOM STATUS
      ================================================= */}

      <div
        className="
          absolute

          bottom-7
          left-5

          flex

          items-center

          gap-2

          text-[7px]

          font-semibold

          uppercase

          tracking-[0.28em]

          text-[#83485B]/40

          sm:bottom-9
          sm:left-9
          sm:text-[8px]
        "
      >
        <span
          className="
            h-[4px]
            w-[4px]

            animate-pulse

            rounded-full

            bg-[#A73757]/60
          "
        />

        Loading Experience
      </div>

      {/* =================================================
          BOTTOM CENTER
      ================================================= */}

      <div
        className="
          absolute

          bottom-7
          left-1/2

          hidden

          -translate-x-1/2

          whitespace-nowrap

          text-[7px]

          uppercase

          tracking-[0.42em]

          text-[#83485B]/35

          sm:block
          sm:bottom-9
        "
      >
        Made To Feel Like You
      </div>

      {/* =================================================
          PROGRESS BAR
      ================================================= */}

      <div
        className="
          absolute

          bottom-0
          left-0

          h-[2px]
          w-full

          bg-[#9B405A]/10
        "
      >
        <div
          data-progress
          className="
            h-full
            w-full

            origin-left

            scale-x-0

            bg-gradient-to-r

            from-[#D77D94]

            via-[#A82F51]

            to-[#7A1736]
          "
        />
      </div>
    </div>
  );
}