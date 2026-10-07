"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

type LoaderProps = {
  onComplete?: () => void;
};

const greetings = [
  {
    text: "नमस्ते",
    dir: "ltr" as const,
  },
  {
    text: "Hello",
    dir: "ltr" as const,
  },
  {
    text: "السلام علیکم",
    dir: "rtl" as const,
  },
];

export default function Loader({ onComplete }: LoaderProps) {
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showBrand, setShowBrand] = useState(false);

  const loaderRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (finished || showBrand) return;

    const loader = loaderRef.current;
    const text = textRef.current;
    const progress = progressRef.current;

    if (!loader || !text) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const ctx = gsap.context(() => {
      // -----------------------------
      // Greeting enter
      // -----------------------------
      gsap.fromTo(
        text,
        {
          opacity: 0,
          y: 28,
          scale: 0.96,
          filter: "blur(8px)",
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          duration: 0.55,
          ease: "power3.out",
        }
      );

      // -----------------------------
      // Progress bar
      // -----------------------------
      if (progress) {
        gsap.to(progress, {
          scaleX: (index + 1) / greetings.length,
          duration: 0.7,
          ease: "power3.out",
        });
      }
    }, loader);

    const timer = window.setTimeout(() => {
      gsap.to(text, {
        opacity: 0,
        y: -22,
        scale: 1.025,
        filter: "blur(8px)",
        duration: 0.35,
        ease: "power3.in",

        onComplete: () => {
          if (index < greetings.length - 1) {
            setIndex((prev) => prev + 1);
          } else {
            setShowBrand(true);
          }
        },
      });
    }, 900);

    return () => {
      window.clearTimeout(timer);
      ctx.revert();

      gsap.killTweensOf(text);
      gsap.killTweensOf(progress);

      document.body.style.overflow = previousOverflow;
    };
  }, [index, finished, showBrand]);

  useEffect(() => {
    if (!showBrand || finished) return;

    const loader = loaderRef.current;
    const brand = brandRef.current;

    if (!loader || !brand) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion) {
      document.body.style.overflow = previousOverflow;
      setFinished(true);
      onComplete?.();
      return;
    }

    const timeline = gsap.timeline({
      onComplete: () => {
        document.body.style.overflow = previousOverflow;
        setFinished(true);
        onComplete?.();
      },
    });

    timeline
      // -----------------------------
      // Brand reveal
      // -----------------------------
      .fromTo(
        brand,
        {
          opacity: 0,
          y: 20,
          scale: 0.96,
          filter: "blur(10px)",
          letterSpacing: "0.35em",
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          letterSpacing: "0.18em",
          duration: 0.8,
          ease: "power4.out",
        }
      )

      // Hold
      .to({}, { duration: 0.55 })

      // Brand exit
      .to(brand, {
        opacity: 0,
        y: -15,
        filter: "blur(6px)",
        duration: 0.35,
        ease: "power3.in",
      })

      // -----------------------------
      // Curtain exit
      // -----------------------------
      .to(loader, {
        yPercent: -100,
        duration: 1,
        ease: "power4.inOut",
      });

    return () => {
      timeline.kill();
      document.body.style.overflow = previousOverflow;
    };
  }, [showBrand, finished, onComplete]);

  if (finished) return null;

  return (
    <div
      ref={loaderRef}
      className="
        fixed
        inset-0
        z-[99999]
        flex
        items-center
        justify-center
        overflow-hidden
        bg-black
        text-white
      "
    >
      {/* --------------------------------
          BACKGROUND GLOW
      -------------------------------- */}

      <div
        className="
          pointer-events-none
          absolute
          left-1/2
          top-1/2
          h-[300px]
          w-[300px]
          -translate-x-1/2
          -translate-y-1/2
          rounded-full
          bg-white/[0.025]
          blur-[100px]
          md:h-[500px]
          md:w-[500px]
        "
      />

      {/* --------------------------------
          GREETINGS
      -------------------------------- */}

      {!showBrand && (
        <h1
          key={index}
          ref={textRef}
          dir={greetings[index].dir}
          className="
            relative
            z-10
            px-6
            text-center
            text-[38px]
            font-normal
            italic
            leading-none
            sm:text-[46px]
            md:text-[58px]
            lg:text-[64px]
          "
          style={{
            fontFamily:
              '"Segoe Script", "Noto Nastaliq Urdu", "Noto Sans Devanagari", cursive',
          }}
        >
          {greetings[index].text}
        </h1>
      )}

      {/* --------------------------------
          FINAL BRAND
      -------------------------------- */}

      {showBrand && (
        <div
          ref={brandRef}
          className="
            relative
            z-10
            text-center
            text-[30px]
            font-medium
            uppercase
            tracking-[0.18em]
            sm:text-[38px]
            md:text-[52px]
          "
        >
          welcome to HIVRASOFT
        </div>
      )}

      {/* --------------------------------
          COUNTER
      -------------------------------- */}

      {!showBrand && (
        <div
          className="
            absolute
            bottom-8
            left-6
            text-[9px]
            font-medium
            tracking-[0.3em]
            text-white/35
            sm:left-10
          "
        >
          0{index + 1}
          <span className="mx-2 text-white/15">/</span>
          0{greetings.length}
        </div>
      )}

      {/* --------------------------------
          SMALL BRAND
      -------------------------------- */}

      {!showBrand && (
        <div
          className="
            absolute
            bottom-8
            left-1/2
            -translate-x-1/2
            whitespace-nowrap
            text-[8px]
            uppercase
            tracking-[0.5em]
            text-white/25
          "
        >
          Hivra Soft
        </div>
      )}

      {/* --------------------------------
          STATUS
      -------------------------------- */}

      {!showBrand && (
        <div
          className="
            absolute
            bottom-8
            right-6
            hidden
            items-center
            gap-2
            text-[8px]
            uppercase
            tracking-[0.3em]
            text-white/25
            sm:flex
            sm:right-10
          "
        >
          <span
            className="
              h-[4px]
              w-[4px]
              animate-pulse
              rounded-full
              bg-white/50
            "
          />

          Loading
        </div>
      )}

      {/* --------------------------------
          PROGRESS BAR
      -------------------------------- */}

      <div
        className="
          absolute
          bottom-0
          left-0
          h-[1px]
          w-full
          bg-white/10
        "
      >
        <div
          ref={progressRef}
          className="
            h-full
            w-full
            origin-left
            scale-x-0
            bg-white/60
          "
        />
      </div>
    </div>
  );
}