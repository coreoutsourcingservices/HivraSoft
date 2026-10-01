"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const images = [
  "/images/intro/model-walk-1.png",
  "/images/intro/model-walk-2.png",
  "/images/intro/model-walk-3.png",
  "/images/intro/model-walk-4.png",
  "/images/intro/model-sit-1.png",
  "/images/intro/model-sit-2.png",
];

export default function DivaStory() {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const nextPageRef = useRef<HTMLDivElement>(null);

  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const section = sectionRef.current;
    const text = textRef.current;
    const nextPage = nextPageRef.current;

    if (!section || !text || !nextPage) return;

    const ctx = gsap.context(() => {
      const cards = imageRefs.current.filter(
        (item): item is HTMLDivElement => item !== null
      );

      // NO fade / NO blur
      gsap.set(cards, {
        opacity: 1,
        visibility: "visible",
        filter: "none",
      });

      // next page starts below screen
      gsap.set(nextPage, {
        yPercent: 100,
      });

      gsap.set(text, {
        y: 0,
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      });

      // =====================================================
      // IMAGE 1
      // =====================================================

      tl.fromTo(
        imageRefs.current[0],
        {
          y: "115vh",
        },
        {
          y: "-115vh",
          duration: 3.4,
          ease: "none",
        },
        0
      );

      // =====================================================
      // IMAGE 2 — LEFT
      // =====================================================

      tl.fromTo(
        imageRefs.current[1],
        {
          y: "135vh",
        },
        {
          y: "-125vh",
          duration: 3.7,
          ease: "none",
        },
        0.55
      );

      // =====================================================
      // IMAGE 3 — RIGHT
      // =====================================================

      tl.fromTo(
        imageRefs.current[2],
        {
          y: "142vh",
        },
        {
          y: "-120vh",
          duration: 3.7,
          ease: "none",
        },
        0.72
      );

      // =====================================================
      // IMAGE 4 — CENTER
      // =====================================================

      tl.fromTo(
        imageRefs.current[3],
        {
          y: "165vh",
        },
        {
          y: "-120vh",
          duration: 3.8,
          ease: "none",
        },
        1.55
      );

      // =====================================================
      // IMAGE 5 — LEFT
      // =====================================================

      tl.fromTo(
        imageRefs.current[4],
        {
          y: "180vh",
        },
        {
          y: "-125vh",
          duration: 3.9,
          ease: "none",
        },
        2.15
      );

      // =====================================================
      // IMAGE 6 — LAST IMAGE
      // =====================================================

      tl.fromTo(
        imageRefs.current[5],
        {
          y: "185vh",
        },
        {
          y: "-130vh",
          duration: 3.9,
          ease: "none",
        },
        2.35
      );

      // =====================================================
      // IMPORTANT TRANSITION
      //
      // Last image jaise upar jayegi,
      // next page neeche se uske saath upar aayega.
      // =====================================================

      tl.to(
        nextPage,
        {
          yPercent: 0,
          duration: 1.25,
          ease: "none",
        },
        5.05
      );

      // current text also physically goes upward
      // NO FADE
      tl.to(
        text,
        {
          y: "-105vh",
          duration: 1.25,
          ease: "none",
        },
        5.05
      );
    }, section);

    ScrollTrigger.refresh();

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative h-[500vh] w-full bg-[#F7F3EF]"
    >
      {/* ==========================================
          STICKY VIEWPORT
      ========================================== */}

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
        {/* ==========================================
            CENTER TEXT
        ========================================== */}

        <div
          ref={textRef}
          className="
            pointer-events-none
            absolute
            left-1/2
            top-1/2
            z-10
            w-full
            -translate-x-1/2
            -translate-y-1/2
            px-6
            text-center
          "
        >
          <p
            className="
              mb-5
              text-[9px]
              uppercase
              tracking-[0.5em]
              md:text-[10px]
            "
            style={{
              color: "#8C6A52",
            }}
          >
            Hivra Soft
          </p>

          <h2
            className="
              text-[48px]
              font-medium
              leading-[0.88]
              tracking-[-0.055em]
              sm:text-[68px]
              md:text-[88px]
              lg:text-[105px]
            "
            style={{
              color: "#211A18",
            }}
          >
            Made to feel

            <br />

            <span
              className="block pt-3 font-normal italic"
              style={{
                fontFamily:
                  '"Segoe Script", "Snell Roundhand", "Brush Script MT", cursive',
                color: "#8C1839",
                fontWeight: 400,
                letterSpacing: "-0.04em",
              }}
            >
              like a diva.
            </span>
          </h2>

          <p
            className="
              mt-8
              text-[9px]
              uppercase
              tracking-[0.38em]
              md:text-[11px]
            "
            style={{
              color: "#9C765D",
            }}
          >
            Unmistakably yourself.
          </p>
        </div>

        {/* ==========================================
            IMAGE 1 — CENTER
        ========================================== */}

        <div
          ref={(el) => {
            imageRefs.current[0] = el;
          }}
          className="
            pointer-events-none
            absolute
            left-1/2
            top-0
            z-30
            h-[43vh]
            w-[25vw]
            min-w-[230px]
            max-w-[370px]
            -translate-x-1/2
          "
        >
          <div className="relative h-full w-full">
            <Image
              src={images[0]}
              alt="Hivra Soft model 1"
              fill
              priority
              sizes="25vw"
              className="object-contain"
            />
          </div>
        </div>

        {/* ==========================================
            IMAGE 2 — LEFT
        ========================================== */}

        <div
          ref={(el) => {
            imageRefs.current[1] = el;
          }}
          className="
            pointer-events-none
            absolute
            left-[2%]
            top-0
            z-20
            h-[48vh]
            w-[27vw]
            min-w-[240px]
            max-w-[410px]
          "
        >
          <div className="relative h-full w-full">
            <Image
              src={images[1]}
              alt="Hivra Soft model 2"
              fill
              sizes="28vw"
              className="object-contain"
            />
          </div>
        </div>

        {/* ==========================================
            IMAGE 3 — RIGHT
        ========================================== */}

        <div
          ref={(el) => {
            imageRefs.current[2] = el;
          }}
          className="
            pointer-events-none
            absolute
            right-[2%]
            top-0
            z-20
            h-[48vh]
            w-[27vw]
            min-w-[240px]
            max-w-[410px]
          "
        >
          <div className="relative h-full w-full">
            <Image
              src={images[2]}
              alt="Hivra Soft model 3"
              fill
              sizes="28vw"
              className="object-contain"
            />
          </div>
        </div>

        {/* ==========================================
            IMAGE 4 — CENTER LEFT
        ========================================== */}

        <div
          ref={(el) => {
            imageRefs.current[3] = el;
          }}
          className="
            pointer-events-none
            absolute
            left-[25%]
            top-0
            z-30
            h-[50vh]
            w-[27vw]
            min-w-[250px]
            max-w-[410px]
          "
        >
          <div className="relative h-full w-full">
            <Image
              src={images[3]}
              alt="Hivra Soft model 4"
              fill
              sizes="28vw"
              className="object-contain"
            />
          </div>
        </div>

        {/* ==========================================
            IMAGE 5 — LEFT
        ========================================== */}

        <div
          ref={(el) => {
            imageRefs.current[4] = el;
          }}
          className="
            pointer-events-none
            absolute
            left-[4%]
            top-0
            z-30
            h-[50vh]
            w-[27vw]
            min-w-[250px]
            max-w-[410px]
          "
        >
          <div className="relative h-full w-full">
            <Image
              src={images[4]}
              alt="Hivra Soft model 5"
              fill
              sizes="28vw"
              className="object-contain"
            />
          </div>
        </div>

        {/* ==========================================
            IMAGE 6 — LAST / RIGHT
        ========================================== */}

        <div
          ref={(el) => {
            imageRefs.current[5] = el;
          }}
          className="
            pointer-events-none
            absolute
            right-[4%]
            top-0
            z-30
            h-[50vh]
            w-[27vw]
            min-w-[250px]
            max-w-[410px]
          "
        >
          <div className="relative h-full w-full">
            <Image
              src={images[5]}
              alt="Hivra Soft model 6"
              fill
              sizes="28vw"
              className="object-contain"
            />
          </div>
        </div>

        {/* ==========================================
            NEXT PAGE

            Starts BELOW viewport.

            Last image ke saath upward slide karega.
        ========================================== */}

        <div
          ref={nextPageRef}
          className="
            absolute
            inset-0
            z-20
            flex
            h-screen
            w-full
            items-center
            justify-center
            bg-[#EFE6DC]
            px-6
            text-[#211A18]
          "
        >
          <div className="mx-auto w-full max-w-[1250px] text-center">
            <p
              className="
                mb-6
                text-[9px]
                uppercase
                tracking-[0.5em]
                md:text-[10px]
              "
              style={{
                color: "#8C6A52",
              }}
            >
              Hivra Soft
            </p>

            <h2
              className="
                text-[52px]
                font-medium
                leading-[0.9]
                tracking-[-0.055em]
                sm:text-[72px]
                md:text-[96px]
                lg:text-[120px]
              "
            >
              Confidence begins

              <br />

              <span
                className="font-normal italic"
                style={{
                  fontFamily:
                    '"Segoe Script", "Snell Roundhand", "Brush Script MT", cursive',
                  color: "#8C1839",
                  letterSpacing: "-0.035em",
                }}
              >
                underneath.
              </span>
            </h2>

            <p
              className="
                mx-auto
                mt-9
                max-w-[470px]
                text-[13px]
                leading-7
                md:text-sm
              "
              style={{
                color: "#8C6A52",
              }}
            >
              Because what you wear closest should make you feel your best.
            </p>

            <button
              type="button"
              className="
                mt-10
                rounded-full
                bg-[#211A18]
                px-8
                py-4
                text-[10px]
                uppercase
                tracking-[0.22em]
                text-[#F7F3EF]
              "
            >
              Explore Collection
            </button>
          </div>
        </div>

        {/* ==========================================
            EXPLORE PRODUCTS
        ========================================== */}

        <button
          type="button"
          className="
            absolute
            right-[4%]
            top-8
            z-50
            rounded-full
            bg-[#211A18]
            px-7
            py-4
            text-[10px]
            font-medium
            uppercase
            tracking-[0.1em]
            text-[#F7F3EF]
          "
        >
          Explore Products
        </button>
      </div>
    </section>
  );
}