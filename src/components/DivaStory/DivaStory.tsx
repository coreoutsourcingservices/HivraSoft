"use client";

import Image from "next/image";
import Link from "next/link";
import {
  CSSProperties,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/* =========================================================
   ASSETS
   ========================================================= */

const WOMEN_BG = "/images/story/women-bg.jpg";
const MEN_BG = "/images/story/men-bg.jpg";

const womenModels = [
  "/images/intro/model-walk-1.png",
  "/images/intro/model-walk-2.png",
  "/images/intro/model-walk-3.png",
  "/images/intro/model-walk-4.png",
  "/images/intro/model-sit-1.png",
  "/images/intro/model-sit-2.png",
];

/*
  Keep empty until your real male transparent PNGs exist.
  Your men hero background still appears correctly.
*/
const menModels: string[] = [];

/* =========================================================
   MOBILE PRODUCTS
   Replace later with real product images.
   ========================================================= */

const mobileProducts = [
  {
    title: "Contour",
    subtitle: "Soft structure",
    image: "/images/intro/model-walk-1.png",
    href: "/women",
  },
  {
    title: "Motion",
    subtitle: "Made to move",
    image: "/images/intro/model-walk-2.png",
    href: "/women",
  },
  {
    title: "Everyday",
    subtitle: "Easy confidence",
    image: "/images/intro/model-walk-3.png",
    href: "/women",
  },
  {
    title: "Essential",
    subtitle: "Clean comfort",
    image: "/images/intro/model-walk-4.png",
    href: "/women",
  },
  {
    title: "Sculpt",
    subtitle: "Defined shape",
    image: "/images/intro/model-sit-1.png",
    href: "/women",
  },
  {
    title: "Lounge",
    subtitle: "Slow days",
    image: "/images/intro/model-sit-2.png",
    href: "/women",
  },
];

/* =========================================================
   MODEL POSITIONS
   ========================================================= */

const womenPositions = [
  "right-[31%] top-[8%] h-[48vh] w-[20vw]",
  "right-[6%] top-[10%] h-[46vh] w-[19vw]",
  "right-[31%] bottom-[-4%] h-[50vh] w-[21vw]",
  "right-[6%] bottom-[-4%] h-[49vh] w-[21vw]",
  "right-[31%] top-[14%] h-[47vh] w-[20vw]",
  "right-[6%] bottom-[-3%] h-[50vh] w-[21vw]",
];

const menPositions = [
  "right-[31%] top-[8%] h-[48vh] w-[20vw]",
  "right-[6%] top-[10%] h-[46vh] w-[19vw]",
  "right-[31%] bottom-[-4%] h-[50vh] w-[21vw]",
  "right-[6%] bottom-[-4%] h-[49vh] w-[21vw]",
  "right-[31%] top-[14%] h-[47vh] w-[20vw]",
  "right-[6%] bottom-[-3%] h-[50vh] w-[21vw]",
];

/* =========================================================
   SCRAMBLE
   ========================================================= */

const SCRAMBLE_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

function createScrambleTween(
  element: HTMLElement,
  finalText: string,
  duration = 1.1,
) {
  const proxy = { progress: 0 };
  const chars = finalText.split("");

  return gsap.to(proxy, {
    progress: 1,
    duration,
    ease: "power2.out",

    onStart: () => {
      element.textContent = "";
    },

    onUpdate: () => {
      const revealCount = Math.floor(
        proxy.progress * chars.length,
      );

      element.textContent = chars
        .map((char, index) => {
          if (char === " ") return " ";
          if (index < revealCount) return char;

          return SCRAMBLE_CHARS[
            Math.floor(Math.random() * SCRAMBLE_CHARS.length)
          ];
        })
        .join("");
    },

    onComplete: () => {
      element.textContent = finalText;
    },
  });
}

/* =========================================================
   ADD 2 MODELS AT A TIME
   ========================================================= */

function addModelPairs(
  timeline: gsap.core.Timeline,
  cards: HTMLAnchorElement[],
  startTime: number,
) {
  let cursor = startTime;

  for (let index = 0; index < cards.length; index += 2) {
    const pair = [cards[index], cards[index + 1]].filter(
      (item): item is HTMLAnchorElement => Boolean(item),
    );

    if (!pair.length) continue;

    pair.forEach((card, pairIndex) => {
      timeline.fromTo(
        card,
        {
          autoAlpha: 0,
          xPercent: pairIndex === 0 ? 45 : 75,
          yPercent: 28,
          scale: 0.86,
          rotation: pairIndex === 0 ? -4 : 4,
          filter: "blur(6px)",
        },
        {
          autoAlpha: 1,
          xPercent: 0,
          yPercent: 0,
          scale: 1,
          rotation: 0,
          filter: "blur(0px)",
          duration: 0.75,
          ease: "power3.out",
        },
        cursor + pairIndex * 0.08,
      );
    });

    timeline.to(
      pair,
      {
        scale: 1.015,
        duration: 0.55,
        ease: "none",
      },
      cursor + 0.76,
    );

    timeline.to(
      pair,
      {
        autoAlpha: 0,
        xPercent: -24,
        yPercent: -12,
        scale: 0.94,
        filter: "blur(6px)",
        duration: 0.55,
        stagger: 0.05,
        ease: "power3.in",
      },
      cursor + 1.31,
    );

    cursor += 1.9;
  }

  return cursor;
}

/* =========================================================
   DESKTOP STORY
   IMPORTANT:
   No long sticky 820vh section now.
   ScrollTrigger itself pins the section.
   This removes the blank screen problem.
   ========================================================= */

function DesktopStory() {
  const sectionRef = useRef<HTMLElement | null>(null);

  const introRef = useRef<HTMLDivElement | null>(null);
  const madeRef = useRef<HTMLSpanElement | null>(null);
  const youRef = useRef<HTMLSpanElement | null>(null);
  const cursorRef = useRef<HTMLSpanElement | null>(null);

  const womenSceneRef = useRef<HTMLDivElement | null>(null);
  const menSceneRef = useRef<HTMLDivElement | null>(null);

  const womenRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const menRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    if (!window.matchMedia("(min-width: 1024px)").matches) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const intro = introRef.current;
    const womenScene = womenSceneRef.current;
    const menScene = menSceneRef.current;
    const made = madeRef.current;
    const you = youRef.current;
    const cursor = cursorRef.current;

    if (
      !section ||
      !intro ||
      !womenScene ||
      !menScene ||
      !made ||
      !you
    ) {
      return;
    }

    const womenCards = womenRefs.current.filter(
      (item): item is HTMLAnchorElement => item !== null,
    );

    const menCards = menRefs.current.filter(
      (item): item is HTMLAnchorElement => item !== null,
    );

    const ctx = gsap.context(() => {
      /* -----------------------------------------
         INITIAL STATES
         ----------------------------------------- */

      gsap.set(intro, {
        autoAlpha: 1,
        yPercent: 0,
        scale: 1,
      });

      /*
        NO Tailwind "invisible" class.
        GSAP completely controls visibility.
      */
      gsap.set(womenScene, {
        autoAlpha: 0,
        yPercent: 100,
        visibility: "visible",
      });

      gsap.set(menScene, {
        autoAlpha: 0,
        yPercent: 100,
        visibility: "visible",
      });

      gsap.set([...womenCards, ...menCards], {
        autoAlpha: 0,
        visibility: "hidden",
      });

      /* -----------------------------------------
         TEXT SCRAMBLE
         ----------------------------------------- */

      const introText = gsap.timeline({
        delay: 0.1,
      });

      introText
        .add(createScrambleTween(made, "Made to feel", 1))
        .add(createScrambleTween(you, "like you.", 1.15), "-=0.25");

      if (cursor) {
        gsap.to(cursor, {
          opacity: 0,
          duration: 0.4,
          repeat: -1,
          yoyo: true,
          ease: "none",
        });
      }

      /* -----------------------------------------
         MASTER PINNED TIMELINE
         ----------------------------------------- */

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",

          /*
            Scroll distance for the complete intro -> women -> men story.
          */
          end: "+=6200",

          scrub: 0.85,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      /* =========================================
         1. INTRO
         ========================================= */

      timeline.to({}, { duration: 0.7 });

      /*
        Women starts BEFORE intro is completely gone.
        Therefore there can be no cream blank screen.
      */
      timeline.fromTo(
        womenScene,
        {
          yPercent: 100,
          autoAlpha: 0,
        },
        {
          yPercent: 0,
          autoAlpha: 1,
          duration: 1.15,
          ease: "power4.inOut",
        },
        0.55,
      );

      timeline.to(
        intro,
        {
          yPercent: -24,
          scale: 0.96,
          autoAlpha: 0,
          duration: 0.85,
          ease: "power3.inOut",
        },
        0.7,
      );

      /* =========================================
         2. WOMEN MODELS
         ========================================= */

      const womenEnd = addModelPairs(
        timeline,
        womenCards,
        1.45,
      );

      const womenFinishedAt = Math.max(womenEnd, 3.5);

      timeline.to(
        {},
        {
          duration: 0.45,
        },
        womenFinishedAt,
      );

      /* =========================================
         3. WOMEN -> MEN
         ========================================= */

      const menSwitchAt = womenFinishedAt + 0.35;

      /*
        Men comes up while women is leaving.
        Again: no blank frame between sections.
      */
      timeline.fromTo(
        menScene,
        {
          yPercent: 100,
          autoAlpha: 0,
        },
        {
          yPercent: 0,
          autoAlpha: 1,
          duration: 1.15,
          ease: "power4.inOut",
        },
        menSwitchAt,
      );

      timeline.to(
        womenScene,
        {
          yPercent: -100,
          autoAlpha: 0,
          duration: 1.15,
          ease: "power4.inOut",
        },
        menSwitchAt,
      );

      /* =========================================
         4. OPTIONAL MEN MODELS
         ========================================= */

      if (menCards.length > 0) {
        const menEnd = addModelPairs(
          timeline,
          menCards,
          menSwitchAt + 0.8,
        );

        timeline.to({}, { duration: 1 }, menEnd);
      } else {
        /*
          Your male PNG files currently don't exist,
          so keep the men hero background visible.
        */
        timeline.to(
          {},
          {
            duration: 2,
          },
          menSwitchAt + 1.15,
        );
      }
    }, section);

    const refreshTimer = window.setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    return () => {
      window.clearTimeout(refreshTimer);
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="
        relative
        hidden
        h-screen
        w-full
        overflow-hidden
        bg-[#F7F3EF]
        lg:block
      "
    >
      {/* =================================================
          INTRO
      ================================================= */}

      <div
        ref={introRef}
        className="
          absolute
          inset-0
          z-30
          flex
          items-center
          justify-center
          bg-[#F7F3EF]
        "
      >
        <div
          className="
            pointer-events-none
            absolute
            inset-0
            bg-[radial-gradient(circle_at_center,_#FFF9F5_0%,_#F7F3EF_57%,_#EFE4DE_100%)]
          "
        />

        <div className="relative z-10 w-full px-5 text-center">
          <p
            className="
              mb-4
              text-[9px]
              uppercase
              tracking-[0.5em]
              text-[#8C6A52]
            "
          >
            Hivra Soft
          </p>

          <h1
            className="
              text-[70px]
              font-medium
              leading-[0.9]
              tracking-[-0.055em]
              text-[#211A18]
              md:text-[88px]
              lg:text-[104px]
            "
          >
            <span
              ref={madeRef}
              className="inline-block min-h-[1em]"
            >
              Made to feel
            </span>

            <br />

            <span className="inline-flex items-end justify-center pt-3">
              <span
                ref={youRef}
                className="font-normal italic text-[#8C1839]"
                style={{
                  fontFamily:
                    '"Segoe Script", "Snell Roundhand", "Brush Script MT", cursive',
                  letterSpacing: "-0.04em",
                }}
              >
                like you.
              </span>

              <span
                ref={cursorRef}
                className="
                  ml-2
                  inline-block
                  h-[0.78em]
                  w-[3px]
                  bg-[#8C1839]
                "
              />
            </span>
          </h1>

          <p
            className="
              mt-7
              text-[9px]
              uppercase
              tracking-[0.35em]
              text-[#9C765D]
            "
          >
            Unmistakably yourself.
          </p>
        </div>
      </div>

      {/* =================================================
          WOMEN
      ================================================= */}

      <div
        ref={womenSceneRef}
        className="
          absolute
          inset-0
          z-20
          overflow-hidden
          bg-[#706545]
        "
        style={{
          opacity: 0,
          visibility: "hidden",
        }}
      >
        <Image
          src={WOMEN_BG}
          alt="Hivra Soft women collection"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        <div className="pointer-events-none absolute inset-0 bg-black/[0.02]" />

        {womenModels.map((src, index) => (
          <Link
            key={src}
            ref={(element) => {
              womenRefs.current[index] = element;
            }}
            href="/women"
            aria-label={`Explore women collection model ${index + 1}`}
            className={`
              absolute
              z-30
              block
              cursor-pointer
              ${womenPositions[index]}
            `}
            style={{
              opacity: 0,
              visibility: "hidden",
            }}
          >
            <div
              className="
                relative
                h-full
                w-full
                origin-bottom
                transition-transform
                duration-500
                hover:scale-[1.045]
              "
            >
              <Image
                src={src}
                alt={`Women model ${index + 1}`}
                fill
                sizes="24vw"
                className="
                  object-contain
                  object-bottom
                  drop-shadow-[0_18px_28px_rgba(0,0,0,0.16)]
                "
              />
            </div>
          </Link>
        ))}

        <Link
          href="/women"
          className="
            absolute
            bottom-[6%]
            right-[4%]
            z-50
            text-right
            text-white
          "
        >
          <p className="text-[8px] uppercase tracking-[0.5em]">
            Hivra Soft
          </p>

          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.28em]">
            Explore Women -&gt;
          </p>
        </Link>
      </div>

      {/* =================================================
          MEN
      ================================================= */}

      <div
        ref={menSceneRef}
        className="
          absolute
          inset-0
          z-20
          overflow-hidden
          bg-[#B77F47]
        "
        style={{
          opacity: 0,
          visibility: "hidden",
        }}
      >
        <Image
          src={MEN_BG}
          alt="Hivra Soft men collection"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />

        <div className="pointer-events-none absolute inset-0 bg-black/[0.02]" />

        {menModels.map((src, index) => (
          <Link
            key={src}
            ref={(element) => {
              menRefs.current[index] = element;
            }}
            href="/men"
            className={`
              absolute
              z-30
              block
              cursor-pointer
              ${menPositions[index]}
            `}
            style={{
              opacity: 0,
              visibility: "hidden",
            }}
          >
            <div className="relative h-full w-full">
              <Image
                src={src}
                alt={`Men model ${index + 1}`}
                fill
                sizes="24vw"
                className="object-contain object-bottom"
              />
            </div>
          </Link>
        ))}

        <Link
          href="/men"
          className="
            absolute
            bottom-[6%]
            right-[4%]
            z-50
            text-right
            text-white
          "
        >
          <p className="text-[8px] uppercase tracking-[0.5em]">
            Hivra Soft
          </p>

          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.28em]">
            Explore Men -&gt;
          </p>
        </Link>
      </div>
    </section>
  );
}

/* =========================================================
   MOBILE CIRCULAR PRODUCT WHEEL
   ========================================================= */

function MobileProductWheel() {
  const [active, setActive] = useState(0);

  const activeProduct = mobileProducts[active];

  const move = (direction: number) => {
    setActive((current) => {
      const next = current + direction;

      return (
        (next + mobileProducts.length) %
        mobileProducts.length
      );
    });
  };

  return (
    <section
      className="
        relative
        min-h-screen
        overflow-hidden
        bg-[#F7F3EF]
        px-4
        pb-7
        pt-8
        text-[#211A18]
        lg:hidden
      "
    >
      <div
        className="
          pointer-events-none
          absolute
          inset-0
          bg-[radial-gradient(circle_at_80%_12%,rgba(140,24,57,0.12),transparent_36%)]
        "
      />

      <div className="relative z-10">
        <p
          className="
            mb-2
            text-[9px]
            font-semibold
            uppercase
            tracking-[0.35em]
            text-[#9C765D]
          "
        >
          Hivra Soft
        </p>

        <h2
          className="
            max-w-[300px]
            font-serif
            text-[48px]
            font-normal
            leading-[0.93]
            tracking-[-0.055em]
          "
        >
          Find your fit.
        </h2>
      </div>

      <div
        className="
          hivra-mobile-card
          relative
          mt-8
          min-h-[680px]
          overflow-hidden
          rounded-[26px]
          border
          border-[#211A18]/15
          bg-[#FFF9F5]
          shadow-[0_24px_80px_rgba(71,43,33,0.11)]
        "
      >
        <div
          className="
            pointer-events-none
            absolute
            inset-0
            bg-[radial-gradient(circle_at_50%_-5%,rgba(140,24,57,0.18),transparent_36%),radial-gradient(circle_at_12%_70%,rgba(197,138,84,0.16),transparent_28%)]
          "
        />

        <div className="absolute left-1/2 top-[-145px] h-px w-px">
          <div className="hivra-wheel-orbit relative h-px w-px">
            {mobileProducts.map((product, index) => {
              let delta = index - active;

              if (delta > mobileProducts.length / 2) {
                delta -= mobileProducts.length;
              }

              if (delta < -mobileProducts.length / 2) {
                delta += mobileProducts.length;
              }

              const angle = delta * 60;

              const itemStyle: CSSProperties = {
                transform: `rotate(${angle}deg) translateY(var(--wheel-radius)) rotate(${-angle}deg)`,
              };

              return (
                <button
                  key={`${product.title}-${index}`}
                  type="button"
                  className={`hivra-wheel-item ${
                    index === active ? "is-active" : ""
                  }`}
                  style={itemStyle}
                  onClick={() => setActive(index)}
                  aria-label={`Select ${product.title}`}
                >
                  <span className="hivra-wheel-image">
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      sizes="140px"
                      className="object-contain object-bottom"
                    />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="absolute bottom-7 left-6 right-6 z-10">
          <p
            className="
              mb-3
              text-[10px]
              font-bold
              tracking-[0.24em]
              text-[#8C1839]
            "
          >
            {String(active + 1).padStart(2, "0")}
            {" / "}
            {String(mobileProducts.length).padStart(2, "0")}
          </p>

          <h3
            className="
              font-serif
              text-[52px]
              font-normal
              leading-[0.95]
              tracking-[-0.05em]
            "
          >
            {activeProduct.title}
          </h3>

          <p className="mt-3 text-[13px] text-[#765F55]">
            {activeProduct.subtitle}
          </p>

          <Link
            href={activeProduct.href}
            className="
              mt-6
              inline-flex
              items-center
              gap-2
              border-b
              border-[#211A18]/40
              pb-1
              text-[11px]
              font-bold
              uppercase
              tracking-[0.16em]
            "
          >
            Explore product
          </Link>

          <div className="mt-6 flex gap-2">
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="Previous product"
              className="
                grid
                h-[52px]
                w-[52px]
                place-items-center
                rounded-full
                border
                border-[#211A18]/15
                bg-[#F7F3EF]
                text-xl
              "
            >
              {"<"}
            </button>

            <button
              type="button"
              onClick={() => move(1)}
              aria-label="Next product"
              className="
                grid
                h-[52px]
                w-[52px]
                place-items-center
                rounded-full
                border
                border-[#211A18]/15
                bg-[#F7F3EF]
                text-xl
              "
            >
              {">"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* =========================================================
   MAIN EXPORT
   ========================================================= */

export default function DivaStory() {
  useLayoutEffect(() => {
    const previousRestoration =
      window.history.scrollRestoration;

    window.history.scrollRestoration = "manual";

    const resetScroll = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    resetScroll();

    const frame = requestAnimationFrame(() => {
      resetScroll();
    });

    return () => {
      cancelAnimationFrame(frame);

      window.history.scrollRestoration =
        previousRestoration;
    };
  }, []);

  return (
    <main
      className="
        hivra-story-root
        relative
        m-0
        w-full
        overflow-x-hidden
        p-0
      "
    >
      <style>{`
        footer,
        .site-footer,
        [data-site-footer],
        #footer {
          display: none !important;
        }

        html,
        body {
          margin: 0 !important;
          padding: 0 !important;
        }

        body {
          overflow-x: hidden;
        }

        .hivra-mobile-card {
          --wheel-radius: min(57vw, 235px);
        }

        .hivra-wheel-orbit::before {
          content: "";
          position: absolute;
          top: 50%;
          left: 50%;

          width: calc((var(--wheel-radius) * 2) + 130px);
          height: calc((var(--wheel-radius) * 2) + 130px);

          border: 1px dashed rgba(140, 24, 57, 0.22);
          border-radius: 999px;

          background:
            radial-gradient(
              circle,
              rgba(140, 24, 57, 0.09),
              transparent 64%
            );

          transform: translate(-50%, -50%);
        }

        .hivra-wheel-item {
          position: absolute;

          top: -58px;
          left: -58px;

          width: 116px;
          height: 116px;

          padding: 0;
          border: 0;
          border-radius: 999px;

          background: transparent;
          cursor: pointer;

          transition:
            transform 600ms cubic-bezier(0.2, 0.85, 0.2, 1),
            opacity 350ms ease;
        }

        .hivra-wheel-image {
          position: absolute;
          inset: 4px;

          display: block;
          overflow: hidden;

          border: 1px solid rgba(33, 26, 24, 0.13);
          border-radius: 999px;

          background: #eadfd8;

          box-shadow:
            0 12px 28px rgba(42, 20, 16, 0.16);

          transition:
            transform 350ms ease,
            box-shadow 350ms ease;
        }

        .hivra-wheel-item.is-active .hivra-wheel-image {
          transform: scale(1.22);

          box-shadow:
            0 0 0 5px rgba(247, 243, 239, 0.92),
            0 0 0 7px #8c1839,
            0 20px 35px rgba(42, 20, 16, 0.22);
        }
      `}</style>

      <DesktopStory />
      <MobileProductWheel />
    </main>
  );
}
