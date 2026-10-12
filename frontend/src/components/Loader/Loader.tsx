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
  onComplete?: () => void;
};

/* =========================================================
   GREETINGS

   Urdu removed.

   FLOW:
   नमस्ते
   Hello
   Made to feel like you
   Welcome to
   HivraSoft
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
];

/* =========================================================
   LOADER
========================================================= */

export default function Loader({
  onComplete,
}: LoaderProps) {
  const pathname =
    usePathname();

  /* =======================================================
     ACTIVE
  ======================================================= */

  const [
    active,
    setActive,
  ] =
    useState(
      pathname === "/",
    );

  /* =======================================================
     LOADER REF
  ======================================================= */

  const loaderRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  /* =======================================================
     SHOW LOADER ONLY ON HOME PAGE
  ======================================================= */

  useEffect(() => {
    if (
      pathname === "/"
    ) {
      setActive(
        true,
      );

      return;
    }

    setActive(
      false,
    );
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

    /* =====================================================
       STOP BODY SCROLL WHILE LOADER IS OPEN
    ===================================================== */

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
        "(prefers-reduced-motion: reduce)",
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
              false,
            );

            onComplete?.();
          },
          500,
        );

      return () => {
        window.clearTimeout(
          timer,
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
          /* ===============================================
             GET ELEMENTS
          =============================================== */

          const greetingElements =
            gsap.utils.toArray<HTMLElement>(
              "[data-loader-greeting]",
            );

          const taglineMask =
            loader.querySelector<HTMLElement>(
              "[data-tagline-mask]",
            );

          const tagline =
            loader.querySelector<HTMLElement>(
              "[data-tagline]",
            );

          const taglineLine =
            loader.querySelector<HTMLElement>(
              "[data-tagline-line]",
            );

          const brandKicker =
            loader.querySelector<HTMLElement>(
              "[data-brand-kicker]",
            );

          const brandReveal =
            loader.querySelector<HTMLElement>(
              "[data-brand-reveal]",
            );

          const brandWord =
            loader.querySelector<HTMLElement>(
              "[data-brand-word]",
            );

          const brandUnderline =
            loader.querySelector<HTMLElement>(
              "[data-brand-underline]",
            );

          const brandSubline =
            loader.querySelector<HTMLElement>(
              "[data-brand-subline]",
            );

          const progress =
            loader.querySelector<HTMLElement>(
              "[data-progress]",
            );

          const silkOne =
            loader.querySelector<HTMLElement>(
              "[data-silk-one]",
            );

          const silkTwo =
            loader.querySelector<HTMLElement>(
              "[data-silk-two]",
            );

          const silkThree =
            loader.querySelector<HTMLElement>(
              "[data-silk-three]",
            );

          const shine =
            loader.querySelector<HTMLElement>(
              "[data-shine]",
            );

          /* ===============================================
             GREETING INITIAL STATE
          =============================================== */

          gsap.set(
            greetingElements,
            {
              autoAlpha: 0,

              y: 55,

              rotateX: 40,

              scale: 0.95,

              filter:
                "blur(12px)",

              transformPerspective:
                900,
            },
          );

          /* ===============================================
             TAGLINE INITIAL STATE
          =============================================== */

          if (
            taglineMask
          ) {
            gsap.set(
              taglineMask,
              {
                autoAlpha:
                  0,
              },
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
              },
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
              },
            );
          }

          /* ===============================================
             FINAL BRAND INITIAL STATE
          =============================================== */

          if (
            brandKicker
          ) {
            gsap.set(
              brandKicker,
              {
                autoAlpha:
                  0,

                y:
                  14,

                letterSpacing:
                  "0.28em",
              },
            );
          }

          /* ===============================================
             BRAND REVEAL INITIAL STATE

             IMPORTANT FIX:

             Clip actual italic text par nahi lagaya.

             Wrapper par lagaya hai.

             Final f / t cut nahi honge.
          =============================================== */

          if (
            brandReveal
          ) {
            gsap.set(
              brandReveal,
              {
                clipPath:
                  "inset(0 110% 0 -16%)",
              },
            );
          }

          /* ===============================================
             BRAND WORD INITIAL STATE
          =============================================== */

          if (
            brandWord
          ) {
            gsap.set(
              brandWord,
              {
                autoAlpha:
                  0,

                x:
                  -10,

                y:
                  7,

                scale:
                  0.98,

                filter:
                  "blur(3px)",

                transformOrigin:
                  "left center",
              },
            );
          }

          /* ===============================================
             UNDERLINE INITIAL
          =============================================== */

          if (
            brandUnderline
          ) {
            gsap.set(
              brandUnderline,
              {
                scaleX:
                  0,

                transformOrigin:
                  "left center",
              },
            );
          }

          /* ===============================================
             SUBLINE INITIAL
          =============================================== */

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
              },
            );
          }

          /* ===============================================
             PROGRESS INITIAL
          =============================================== */

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
              },
            );
          }

          /* ===============================================
             SILK 01
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
              },
            );
          }

          /* ===============================================
             SILK 02
          =============================================== */

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
              },
            );
          }

          /* ===============================================
             SILK 03
          =============================================== */

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
              },
            );
          }

          /* ===============================================
             MOVING LIGHT
          =============================================== */

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
              },
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
                    false,
                  );

                  onComplete?.();
                },
            });

          /* ===============================================
             GREETINGS

             नमस्ते
             Hello
          =============================================== */

          greetingElements.forEach(
            (
              greeting,
              index,
            ) => {
              const progressValue =
                0.12 +
                (
                  (
                    index +
                    1
                  ) /
                  greetingElements.length
                ) *
                  0.28;

              /* -------------------------------------------
                 ENTER
              ------------------------------------------- */

              timeline.to(
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
                    0.7,

                  ease:
                    "power4.out",
                },
              );

              /* -------------------------------------------
                 PROGRESS
              ------------------------------------------- */

              timeline.to(
                progress,
                {
                  scaleX:
                    progressValue,

                  duration:
                    0.5,

                  ease:
                    "power3.out",
                },
                "<",
              );

              /* -------------------------------------------
                 HOLD
              ------------------------------------------- */

              timeline.to(
                {},
                {
                  duration:
                    0.42,
                },
              );

              /* -------------------------------------------
                 EXIT
              ------------------------------------------- */

              timeline.to(
                greeting,
                {
                  autoAlpha:
                    0,

                  y:
                    -46,

                  rotateX:
                    -32,

                  scale:
                    1.03,

                  filter:
                    "blur(9px)",

                  duration:
                    0.42,

                  ease:
                    "power3.in",
                },
              );
            },
          );

          /* ===============================================
             MADE TO FEEL LIKE YOU
          =============================================== */

          if (
            taglineMask &&
            tagline &&
            taglineLine
          ) {
            timeline.set(
              taglineMask,
              {
                autoAlpha:
                  1,
              },
            );

            /* -------------------------------------------
               TEXT ENTER
            ------------------------------------------- */

            timeline.to(
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
              },
            );

            /* -------------------------------------------
               PROGRESS
            ------------------------------------------- */

            timeline.to(
              progress,
              {
                scaleX:
                  0.66,

                duration:
                  0.65,

                ease:
                  "power3.out",
              },
              "<",
            );

            /* -------------------------------------------
               LINE DRAW
            ------------------------------------------- */

            timeline.to(
              taglineLine,
              {
                scaleX:
                  1,

                duration:
                  0.7,

                ease:
                  "power4.out",
              },
              "-=0.45",
            );

            /* -------------------------------------------
               HOLD
            ------------------------------------------- */

            timeline.to(
              {},
              {
                duration:
                  0.65,
              },
            );

            /* -------------------------------------------
               TEXT EXIT
            ------------------------------------------- */

            timeline.to(
              tagline,
              {
                yPercent:
                  -120,

                filter:
                  "blur(6px)",

                duration:
                  0.65,

                ease:
                  "power4.in",
              },
            );

            /* -------------------------------------------
               LINE EXIT
            ------------------------------------------- */

            timeline.to(
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
              "<",
            );

            timeline.set(
              taglineMask,
              {
                autoAlpha:
                  0,
              },
            );
          }

          /* ===============================================
             WELCOME TO
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
                  "0.18em",

                duration:
                  0.7,

                ease:
                  "power4.out",
              },
            );
          }

          /* ===============================================
             HIVRASOFT BASE ENTER
          =============================================== */

          if (
            brandWord
          ) {
            timeline.to(
              brandWord,
              {
                autoAlpha:
                  1,

                x:
                  0,

                y:
                  0,

                scale:
                  1,

                filter:
                  "blur(0px)",

                duration:
                  0.4,

                ease:
                  "power3.out",
              },
              "-=0.25",
            );
          }

          /* ===============================================
             WRITING REVEAL

             Extra negative inset gives italic letters
             room on both sides.

             No more cut final "ft".
          =============================================== */

          if (
            brandReveal
          ) {
            timeline.to(
              brandReveal,
              {
                clipPath:
                  "inset(0 -18% 0 -16%)",

                duration:
                  1.45,

                ease:
                  "power2.inOut",
              },
              "-=0.32",
            );
          }

          /* ===============================================
             BRAND UNDERLINE
          =============================================== */

          if (
            brandUnderline
          ) {
            timeline.to(
              brandUnderline,
              {
                scaleX:
                  1,

                duration:
                  0.75,

                ease:
                  "power3.out",
              },
              "-=0.65",
            );
          }

          /* ===============================================
             SUBLINE
          =============================================== */

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
              "-=0.35",
            );
          }

          /* ===============================================
             FINISH PROGRESS
          =============================================== */

          timeline.to(
            progress,
            {
              scaleX:
                1,

              duration:
                0.7,

              ease:
                "power3.out",
            },
            "<",
          );

          /* ===============================================
             HOLD FINAL BRAND
          =============================================== */

          timeline.to(
            {},
            {
              duration:
                0.95,
            },
          );

          /* ===============================================
             BRAND EXIT
          =============================================== */

          timeline.to(
            [
              brandKicker,
              brandReveal,
              brandUnderline,
              brandSubline,
            ].filter(
              Boolean,
            ),
            {
              autoAlpha:
                0,

              y:
                -16,

              duration:
                0.4,

              stagger:
                0.025,

              ease:
                "power3.in",
            },
          );

          /* ===============================================
             FINAL CURTAIN EXIT
          =============================================== */

          timeline.to(
            loader,
            {
              yPercent:
                -100,

              skewY:
                -1.2,

              duration:
                1.05,

              ease:
                "power4.inOut",
            },
          );
        },
        loader,
      );

    /* =====================================================
       CLEANUP
    ===================================================== */

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
     HOME PAGE ONLY
  ======================================================= */

  if (
    pathname !== "/" ||
    !active
  ) {
    return null;
  }

  /* =======================================================
     RENDER
  ======================================================= */

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
          BASE BACKGROUND
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
          CENTER GLOW
      ================================================= */}

      <div
        className="
          pointer-events-none

          absolute

          left-1/2
          top-1/2

          h-[440px]
          w-[440px]

          -translate-x-1/2
          -translate-y-1/2

          rounded-full

          bg-white/30

          blur-[100px]

          sm:h-[620px]
          sm:w-[620px]
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
          via-white/45
          to-transparent

          blur-[80px]

          md:h-[470px]
        "
      />

      {/* =================================================
          MOVING SHINE
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
          TOP SMALL BRAND
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

          tracking-[0.32em]

          text-[#8B5364]/45

          sm:top-9
          sm:text-[8px]
        "
      >
        Hivra Soft
      </div>

      {/* =================================================
          CENTER CONTENT
      ================================================= */}

      <div
        className="
          relative

          z-20

          flex

          h-[230px]
          w-full

          items-center
          justify-center

          overflow-visible

          px-4

          text-center

          [transform-style:preserve-3d]

          sm:h-[270px]
        "
      >
        {/* ===============================================
            GREETINGS
        =============================================== */}

        {greetings.map(
          (
            greeting,
            index,
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
              {greeting.text}
            </h1>
          ),
        )}

        {/* ===============================================
            TAGLINE
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
          {/* =============================================
              WELCOME TO
          ============================================= */}

          <p
            data-brand-kicker
            className="
              mb-2

              opacity-0

              text-[9px]

              font-medium

              tracking-[0.18em]

              text-[#9A4961]

              will-change-transform

              sm:mb-3
              sm:text-[11px]

              md:text-[12px]
            "
          >
            Welcome to
          </p>

          {/* =============================================
              HIVRASOFT AREA
          ============================================= */}

          <div
            className="
              mx-auto

              flex

              w-fit
              max-w-[98vw]

              flex-col

              items-center
              justify-center

              overflow-visible

              px-2
            "
          >
            {/* ===========================================
                WRITING REVEAL WRAPPER

                IMPORTANT:

                Extra horizontal padding gives
                italic H and final f/t enough room.
            =========================================== */}

            <div
              data-brand-reveal
              className="
                overflow-visible

                px-[0.32em]

                pb-[0.12em]
                pt-[0.08em]

                will-change-[clip-path]
              "
            >
              <h2
                data-brand-word
                aria-label="Hivra Soft"
                className="
                  inline-block

                  overflow-visible

                  whitespace-nowrap

                  opacity-0

                  font-serif

                  text-[42px]

                  font-medium

                  italic

                  leading-[1.15]

                  tracking-[-0.035em]

                  text-[#741735]

                  will-change-transform

                  sm:text-[60px]

                  md:text-[78px]

                  lg:text-[94px]
                "
                style={{
                  fontFamily:
                    '"Cormorant Garamond", Georgia, "Times New Roman", serif',

                  paddingLeft:
                    "0.06em",

                  paddingRight:
                    "0.12em",
                }}
              >
                Hivra Soft
              </h2>
            </div>

            {/* ===========================================
                BRAND UNDERLINE
            =========================================== */}

            <div
              className="
                mt-1

                h-[1.5px]

                w-[68%]

                overflow-hidden

                sm:mt-2
              "
            >
              <div
                data-brand-underline
                className="
                  h-full
                  w-full

                  origin-left

                  scale-x-0

                  bg-gradient-to-r

                  from-transparent
                  via-[#9D2C4D]
                  to-transparent
                "
              />
            </div>
          </div>

          {/* =============================================
              SUBLINE
          ============================================= */}

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
          BOTTOM LEFT
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
