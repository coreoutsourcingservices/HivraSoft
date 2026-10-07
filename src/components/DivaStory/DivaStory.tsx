"use client";

import Image from "next/image";

import {
  useEffect,
  useRef,
} from "react";

import {
  gsap,
} from "gsap";

import {
  ScrollTrigger,
} from "gsap/ScrollTrigger";

/* =========================================================
   IMAGES
========================================================= */

const images = [
  "/images/intro/model-walk-1.png",
  "/images/intro/model-walk-2.png",
  "/images/intro/model-walk-3.png",
  "/images/intro/model-walk-4.png",
  "/images/intro/model-sit-1.png",
  "/images/intro/model-sit-2.png",
];

/* =========================================================
   SCRAMBLE CHARACTERS
========================================================= */

const SCRAMBLE_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/* =========================================================
   SCRAMBLE HELPER

   GSAP ScrambleText plugin ki zarurat nahi.
========================================================= */

function createScrambleTween(
  element: HTMLElement,
  finalText: string,
  duration = 1.2,
) {
  const proxy = {
    progress: 0,
  };

  const originalCharacters =
    finalText.split("");

  return gsap.to(
    proxy,
    {
      progress: 1,

      duration,

      ease:
        "power2.out",

      onStart: () => {
        element.textContent =
          "";
      },

      onUpdate: () => {
        const revealCount =
          Math.floor(
            proxy.progress *
              originalCharacters.length,
          );

        const result =
          originalCharacters
            .map(
              (
                character,
                index,
              ) => {
                if (
                  character ===
                  " "
                ) {
                  return " ";
                }

                if (
                  index <
                  revealCount
                ) {
                  return character;
                }

                return SCRAMBLE_CHARS[
                  Math.floor(
                    Math.random() *
                      SCRAMBLE_CHARS.length,
                  )
                ];
              },
            )
            .join("");

        element.textContent =
          result;
      },

      onComplete: () => {
        element.textContent =
          finalText;
      },
    },
  );
}

/* =========================================================
   DIVA STORY
========================================================= */

export default function DivaStory() {
  const sectionRef =
    useRef<HTMLElement | null>(
      null,
    );

  const headlineRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const madeTextRef =
    useRef<HTMLSpanElement | null>(
      null,
    );

  const divaTextRef =
    useRef<HTMLSpanElement | null>(
      null,
    );

  const cursorRef =
    useRef<HTMLSpanElement | null>(
      null,
    );

  const storyRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const imageRefs =
    useRef<
      (
        HTMLDivElement |
        null
      )[]
    >([]);

  /* =======================================================
     GSAP
  ======================================================= */

  useEffect(() => {
    gsap.registerPlugin(
      ScrollTrigger,
    );

    const section =
      sectionRef.current;

    const headline =
      headlineRef.current;

    const madeText =
      madeTextRef.current;

    const divaText =
      divaTextRef.current;

    const cursor =
      cursorRef.current;

    const story =
      storyRef.current;

    if (
      !section ||
      !headline ||
      !madeText ||
      !divaText ||
      !story
    ) {
      return;
    }

    const ctx =
      gsap.context(
        () => {
          const cards =
            imageRefs.current.filter(
              (
                card,
              ): card is HTMLDivElement =>
                card !== null,
            );

          /* =============================================
             INITIAL STATE
          ============================================= */

          gsap.set(
            headline,
            {
              opacity:
                1,

              scale:
                1,

              y:
                0,
            },
          );

          gsap.set(
            story,
            {
              opacity:
                0,

              y:
                55,

              scale:
                0.96,
            },
          );

          gsap.set(
            cards,
            {
              opacity:
                0,
            },
          );

          /* =============================================
             SCRAMBLE INTRO
          ============================================= */

          const scrambleTimeline =
            gsap.timeline({
              delay:
                0.15,
            });

          scrambleTimeline
            .add(
              createScrambleTween(
                madeText,
                "Made to feel",
                1.15,
              ),
            )

            .add(
              createScrambleTween(
                divaText,
                "like a diva.",
                1.35,
              ),
              "-=0.35",
            );

          /* =============================================
             CURSOR BLINK
          ============================================= */

          if (
            cursor
          ) {
            gsap.to(
              cursor,
              {
                opacity:
                  0,

                duration:
                  0.42,

                ease:
                  "none",

                repeat:
                  -1,

                yoyo:
                  true,
              },
            );
          }

          /* =============================================
             SCROLL TIMELINE
          ============================================= */

          const tl =
            gsap.timeline({
              scrollTrigger: {
                trigger:
                  section,

                start:
                  "top top",

                end:
                  "bottom bottom",

                scrub:
                  0.85,

                invalidateOnRefresh:
                  true,
              },
            });

          /* =============================================
             IMAGE 1 — LEFT
          ============================================= */

          tl.fromTo(
            imageRefs.current[
              0
            ],
            {
              xPercent:
                -120,

              yPercent:
                20,

              rotation:
                -8,

              scale:
                0.78,

              opacity:
                0,
            },
            {
              xPercent:
                0,

              yPercent:
                0,

              rotation:
                -3,

              scale:
                1,

              opacity:
                1,

              duration:
                1.25,

              ease:
                "power3.out",
            },
            0.2,
          );

          /* =============================================
             IMAGE 2 — RIGHT
          ============================================= */

          tl.fromTo(
            imageRefs.current[
              1
            ],
            {
              xPercent:
                120,

              yPercent:
                24,

              rotation:
                8,

              scale:
                0.8,

              opacity:
                0,
            },
            {
              xPercent:
                0,

              yPercent:
                0,

              rotation:
                3,

              scale:
                1,

              opacity:
                1,

              duration:
                1.25,

              ease:
                "power3.out",
            },
            0.45,
          );

          /* =============================================
             IMAGE 3 — CENTER HERO REVEAL
          ============================================= */

          tl.fromTo(
            imageRefs.current[
              2
            ],
            {
              yPercent:
                80,

              scale:
                1.12,

              opacity:
                0,

              clipPath:
                "inset(100% 0% 0% 0%)",
            },
            {
              yPercent:
                0,

              scale:
                1,

              opacity:
                1,

              clipPath:
                "inset(0% 0% 0% 0%)",

              duration:
                1.5,

              ease:
                "power3.inOut",
            },
            0.95,
          );

          /* =============================================
             IMAGE 4 — BOTTOM LEFT
          ============================================= */

          tl.fromTo(
            imageRefs.current[
              3
            ],
            {
              xPercent:
                -80,

              yPercent:
                90,

              rotation:
                -10,

              opacity:
                0,

              scale:
                0.8,
            },
            {
              xPercent:
                0,

              yPercent:
                0,

              rotation:
                -4,

              opacity:
                1,

              scale:
                1,

              duration:
                1.2,

              ease:
                "power3.out",
            },
            1.6,
          );

          /* =============================================
             IMAGE 5 — BOTTOM RIGHT
          ============================================= */

          tl.fromTo(
            imageRefs.current[
              4
            ],
            {
              xPercent:
                80,

              yPercent:
                100,

              rotation:
                10,

              opacity:
                0,

              scale:
                0.8,
            },
            {
              xPercent:
                0,

              yPercent:
                0,

              rotation:
                4,

              opacity:
                1,

              scale:
                1,

              duration:
                1.2,

              ease:
                "power3.out",
            },
            1.8,
          );

          /* =============================================
             IMAGE 6 — BACK / CENTER
          ============================================= */

          tl.fromTo(
            imageRefs.current[
              5
            ],
            {
              yPercent:
                110,

              scale:
                0.72,

              opacity:
                0,
            },
            {
              yPercent:
                0,

              scale:
                1,

              opacity:
                1,

              duration:
                1.25,

              ease:
                "power3.out",
            },
            2.05,
          );

          /* =============================================
             HEADLINE GOES UP

             Old animation ki tarah screen se fly nahi karega.
             Bas elegant movement.
          ============================================= */

          tl.to(
            headline,
            {
              yPercent:
                -85,

              scale:
                0.82,

              opacity:
                0.08,

              duration:
                1.1,

              ease:
                "power2.inOut",
            },
            2.8,
          );

          /* =============================================
             COLLAGE EXPANDS

             Images center text ke around frame banayengi.
          ============================================= */

          tl.to(
            imageRefs.current[
              0
            ],
            {
              xPercent:
                -8,

              yPercent:
                -8,

              scale:
                0.93,

              duration:
                1,
            },
            2.9,
          );

          tl.to(
            imageRefs.current[
              1
            ],
            {
              xPercent:
                8,

              yPercent:
                -7,

              scale:
                0.93,

              duration:
                1,
            },
            2.9,
          );

          tl.to(
            imageRefs.current[
              2
            ],
            {
              yPercent:
                -7,

              scale:
                0.9,

              opacity:
                0.75,

              duration:
                1,
            },
            2.9,
          );

          tl.to(
            imageRefs.current[
              3
            ],
            {
              xPercent:
                -8,

              yPercent:
                5,

              scale:
                0.92,

              duration:
                1,
            },
            2.9,
          );

          tl.to(
            imageRefs.current[
              4
            ],
            {
              xPercent:
                8,

              yPercent:
                5,

              scale:
                0.92,

              duration:
                1,
            },
            2.9,
          );

          tl.to(
            imageRefs.current[
              5
            ],
            {
              yPercent:
                8,

              scale:
                0.88,

              opacity:
                0.65,

              duration:
                1,
            },
            2.9,
          );

          /* =============================================
             REAL WOMEN STORY TEXT
          ============================================= */

          tl.to(
            story,
            {
              opacity:
                1,

              y:
                0,

              scale:
                1,

              duration:
                1.15,

              ease:
                "power3.out",
            },
            3.25,
          );

          /* =============================================
             SUBTLE PARALLAX
          ============================================= */

          tl.to(
            imageRefs.current[
              0
            ],
            {
              yPercent:
                -18,

              duration:
                1.3,

              ease:
                "none",
            },
            4.25,
          );

          tl.to(
            imageRefs.current[
              1
            ],
            {
              yPercent:
                -12,

              duration:
                1.3,

              ease:
                "none",
            },
            4.25,
          );

          tl.to(
            imageRefs.current[
              2
            ],
            {
              yPercent:
                -20,

              duration:
                1.3,

              ease:
                "none",
            },
            4.25,
          );

          tl.to(
            imageRefs.current[
              3
            ],
            {
              yPercent:
                -8,

              duration:
                1.3,

              ease:
                "none",
            },
            4.25,
          );

          tl.to(
            imageRefs.current[
              4
            ],
            {
              yPercent:
                -14,

              duration:
                1.3,

              ease:
                "none",
            },
            4.25,
          );

          tl.to(
            imageRefs.current[
              5
            ],
            {
              yPercent:
                -7,

              duration:
                1.3,

              ease:
                "none",
            },
            4.25,
          );

          /* =============================================
             END HOLD
          ============================================= */

          tl.to(
            {},
            {
              duration:
                0.7,
            },
          );
        },
        section,
      );

    ScrollTrigger.refresh();

    return () => {
      ctx.revert();
    };
  }, []);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <section
      ref={
        sectionRef
      }
      className="
        relative
        h-[520vh]
        w-full
        bg-[#F7F3EF]
      "
    >
      {/* ===================================================
          STICKY VIEWPORT
      =================================================== */}

      <div
        className="
          sticky
          top-0
          h-screen
          w-full
          overflow-hidden
          bg-[#F7F3EF]
        "
      >
        {/* =================================================
            BACKGROUND
        ================================================= */}

        <div
          className="
            pointer-events-none
            absolute
            inset-0
            bg-[radial-gradient(circle_at_center,_#FFF7F2_0%,_#F7F3EF_55%,_#EFE4DE_100%)]
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -left-[15vw]
            top-[10vh]
            h-[55vh]
            w-[55vh]
            rounded-full
            bg-[#F4DCD8]/40
            blur-[90px]
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -right-[15vw]
            bottom-[5vh]
            h-[60vh]
            w-[60vh]
            rounded-full
            bg-[#8C1839]/10
            blur-[100px]
          "
        />

        {/* =================================================
            MAIN HEADLINE
        ================================================= */}

        <div
          ref={
            headlineRef
          }
          className="
            pointer-events-none
            absolute
            left-1/2
            top-1/2
            z-40
            w-full
            -translate-x-1/2
            -translate-y-1/2
            px-5
            text-center
          "
        >
          <p
            className="
              mb-4
              text-[8px]
              uppercase
              tracking-[0.5em]
              text-[#8C6A52]

              sm:text-[9px]

              md:text-[10px]
            "
          >
            Hivra Soft
          </p>

          <h2
            aria-label="Made to feel like a diva."
            className="
              text-[46px]
              font-medium
              leading-[0.88]
              tracking-[-0.055em]
              text-[#211A18]

              sm:text-[66px]

              md:text-[86px]

              lg:text-[105px]
            "
          >
            <span
              ref={
                madeTextRef
              }
              className="
                inline-block
                min-h-[1em]
              "
            >
              Made to feel
            </span>

            <br />

            <span
              className="
                inline-flex
                items-end
                justify-center
                pt-3
              "
            >
              <span
                ref={
                  divaTextRef
                }
                className="
                  font-normal
                  italic
                  text-[#8C1839]
                "
                style={{
                  fontFamily:
                    '"Segoe Script", "Snell Roundhand", "Brush Script MT", cursive',

                  fontWeight:
                    400,

                  letterSpacing:
                    "-0.04em",
                }}
              >
                like a diva.
              </span>

              <span
                ref={
                  cursorRef
                }
                aria-hidden="true"
                className="
                  ml-2
                  inline-block
                  h-[0.78em]
                  w-[2px]
                  bg-[#8C1839]

                  md:w-[3px]
                "
              />
            </span>
          </h2>

          <p
            className="
              mt-7
              text-[8px]
              uppercase
              tracking-[0.35em]
              text-[#9C765D]

              sm:text-[9px]

              md:text-[10px]
            "
          >
            Unmistakably yourself.
          </p>
        </div>

        {/* =================================================
            IMAGE 1 — LEFT TOP
        ================================================= */}

        <div
          ref={(
            element,
          ) => {
            imageRefs.current[
              0
            ] =
              element;
          }}
          className="
            pointer-events-none
            absolute
            -left-[11%]
            top-[12%]
            z-20
            h-[43vh]
            w-[52vw]

            sm:left-[2%]
            sm:h-[48vh]
            sm:w-[30vw]

            lg:left-[4%]
            lg:w-[23vw]
          "
        >
          <div
            className="
              relative
              h-full
              w-full
            "
          >
            <Image
              src={
                images[0]
              }
              alt="Hivra Soft model 1"
              fill
              priority
              sizes="30vw"
              className="
                object-contain
              "
            />
          </div>
        </div>

        {/* =================================================
            IMAGE 2 — RIGHT TOP
        ================================================= */}

        <div
          ref={(
            element,
          ) => {
            imageRefs.current[
              1
            ] =
              element;
          }}
          className="
            pointer-events-none
            absolute
            -right-[11%]
            top-[14%]
            z-20
            h-[42vh]
            w-[52vw]

            sm:right-[2%]
            sm:h-[47vh]
            sm:w-[30vw]

            lg:right-[4%]
            lg:w-[23vw]
          "
        >
          <div
            className="
              relative
              h-full
              w-full
            "
          >
            <Image
              src={
                images[1]
              }
              alt="Hivra Soft model 2"
              fill
              sizes="30vw"
              className="
                object-contain
              "
            />
          </div>
        </div>

        {/* =================================================
            IMAGE 3 — CENTER HERO
        ================================================= */}

        <div
          ref={(
            element,
          ) => {
            imageRefs.current[
              2
            ] =
              element;
          }}
          className="
            pointer-events-none
            absolute
            left-1/2
            top-[7%]
            z-30
            h-[55vh]
            w-[56vw]
            -translate-x-1/2
            overflow-hidden

            sm:h-[61vh]
            sm:w-[34vw]

            lg:w-[27vw]
          "
        >
          <div
            className="
              relative
              h-full
              w-full
            "
          >
            <Image
              src={
                images[2]
              }
              alt="Hivra Soft model 3"
              fill
              sizes="35vw"
              className="
                object-contain
              "
            />
          </div>
        </div>

        {/* =================================================
            IMAGE 4 — BOTTOM LEFT
        ================================================= */}

        <div
          ref={(
            element,
          ) => {
            imageRefs.current[
              3
            ] =
              element;
          }}
          className="
            pointer-events-none
            absolute
            -left-[5%]
            bottom-[-2%]
            z-30
            h-[39vh]
            w-[46vw]

            sm:left-[14%]
            sm:h-[43vh]
            sm:w-[27vw]

            lg:left-[18%]
            lg:w-[21vw]
          "
        >
          <div
            className="
              relative
              h-full
              w-full
            "
          >
            <Image
              src={
                images[3]
              }
              alt="Hivra Soft model 4"
              fill
              sizes="28vw"
              className="
                object-contain
              "
            />
          </div>
        </div>

        {/* =================================================
            IMAGE 5 — BOTTOM RIGHT
        ================================================= */}

        <div
          ref={(
            element,
          ) => {
            imageRefs.current[
              4
            ] =
              element;
          }}
          className="
            pointer-events-none
            absolute
            -right-[6%]
            bottom-[-2%]
            z-30
            h-[39vh]
            w-[46vw]

            sm:right-[14%]
            sm:h-[43vh]
            sm:w-[27vw]

            lg:right-[18%]
            lg:w-[21vw]
          "
        >
          <div
            className="
              relative
              h-full
              w-full
            "
          >
            <Image
              src={
                images[4]
              }
              alt="Hivra Soft model 5"
              fill
              sizes="28vw"
              className="
                object-contain
              "
            />
          </div>
        </div>

        {/* =================================================
            IMAGE 6 — LOWER CENTER
        ================================================= */}

        <div
          ref={(
            element,
          ) => {
            imageRefs.current[
              5
            ] =
              element;
          }}
          className="
            pointer-events-none
            absolute
            bottom-[-8%]
            left-1/2
            z-10
            h-[37vh]
            w-[42vw]
            -translate-x-1/2

            sm:h-[40vh]
            sm:w-[25vw]

            lg:w-[19vw]
          "
        >
          <div
            className="
              relative
              h-full
              w-full
            "
          >
            <Image
              src={
                images[5]
              }
              alt="Hivra Soft model 6"
              fill
              sizes="25vw"
              className="
                object-contain
              "
            />
          </div>
        </div>

        {/* =================================================
            STORY TEXT

            Images reveal hone ke baad center me aayega.
        ================================================= */}

        <div
          ref={
            storyRef
          }
          className="
            pointer-events-none
            absolute
            left-1/2
            top-1/2
            z-50
            w-full
            max-w-[760px]
            -translate-x-1/2
            -translate-y-1/2
            px-6
            text-center
          "
        >
          <p
            className="
              mb-4
              text-[8px]
              uppercase
              tracking-[0.5em]
              text-[#8C6A52]

              sm:text-[9px]
            "
          >
            The Hivra Story
          </p>

          <h3
            className="
              font-serif
              text-[40px]
              leading-[0.95]
              tracking-[-0.045em]
              text-[#211A18]

              sm:text-[58px]

              md:text-[72px]

              lg:text-[86px]
            "
          >
            Real women.

            <br />

            <span
              className="
                italic
                text-[#8C1839]
              "
            >
              Real stories.
            </span>
          </h3>

          <p
            className="
              mx-auto
              mt-6
              max-w-[430px]
              text-[10px]
              leading-6
              text-[#765F55]

              sm:text-[11px]

              md:text-[12px]
            "
          >
            Different bodies.
            Same confidence.
            Designed to feel
            comfortable, effortless
            and completely yours.
          </p>

          <div
            className="
              mx-auto
              mt-7
              h-[42px]
              w-px
              bg-[#8C1839]/40
            "
          />

          <p
            className="
              mt-3
              text-[7px]
              uppercase
              tracking-[0.35em]
              text-[#8C6A52]

              sm:text-[8px]
            "
          >
            Scroll to discover
          </p>
        </div>
      </div>
    </section>
  );
}