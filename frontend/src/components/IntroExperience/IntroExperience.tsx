"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

type IntroExperienceProps = {
  onComplete: () => void;
};

const fontStyles = [
  {
    family: "Arial Black, Arial, sans-serif",
    style: "normal",
    weight: "900",
    spacing: "-0.06em",
  },
  {
    family: "Georgia, serif",
    style: "italic",
    weight: "400",
    spacing: "-0.03em",
  },
  {
    family: "'Courier New', monospace",
    style: "normal",
    weight: "700",
    spacing: "0.08em",
  },
  {
    family: "'Times New Roman', serif",
    style: "italic",
    weight: "500",
    spacing: "0.02em",
  },
  {
    family: "Impact, Arial, sans-serif",
    style: "normal",
    weight: "400",
    spacing: "0.01em",
  },
];

export default function IntroExperience({
  onComplete,
}: IntroExperienceProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const brandRef = useRef<HTMLHeadingElement>(null);
  const smallBrandRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const brand = brandRef.current;
    const smallBrand = smallBrandRef.current;

    if (!section || !brand || !smallBrand) return;

    document.body.style.overflow = "hidden";

    let fontTimer: number | undefined;

    const ctx = gsap.context(() => {
      // ==============================
      // INITIAL STATE
      // ==============================

      gsap.set(section, {
        opacity: 1,
        backgroundColor: "#000000",
      });

      gsap.set(brand, {
        opacity: 0,
        scale: 0.82,
        y: 20,
        filter: "blur(10px)",
      });

      gsap.set(smallBrand, {
        opacity: 0,
      });

      // ==============================
      // FONT CHANGING
      // ==============================

      let fontIndex = 0;

      fontTimer = window.setInterval(() => {
        fontIndex = (fontIndex + 1) % fontStyles.length;

        const current = fontStyles[fontIndex];

        gsap.to(brand, {
          opacity: 0.15,
          scale: 0.98,
          filter: "blur(3px)",
          duration: 0.12,

          onComplete: () => {
            brand.style.fontFamily = current.family;
            brand.style.fontStyle = current.style;
            brand.style.fontWeight = current.weight;
            brand.style.letterSpacing = current.spacing;

            gsap.to(brand, {
              opacity: 1,
              scale: 1,
              filter: "blur(0px)",
              duration: 0.18,
              ease: "power2.out",
            });
          },
        });
      }, 550);

      // ==============================
      // 5 SECOND INTRO
      // ==============================

      const tl = gsap.timeline({
        onComplete: () => {
          if (fontTimer) {
            window.clearInterval(fontTimer);
          }

          document.body.style.overflow = "";

          onComplete();
        },
      });

      // 0 - 0.7 sec
      // HIVRASOFT appears

      tl.to(brand, {
        opacity: 1,
        scale: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.7,
        ease: "power4.out",
      });

      // small brand

      tl.to(
        smallBrand,
        {
          opacity: 0.35,
          duration: 0.5,
        },
        "-=0.4"
      );

      // 0.7 - 4.2 sec
      // fonts keep changing

      tl.to({}, { duration: 3.5 });

      // ==============================
      // 4.2 - 5 SEC
      // FINAL BLUR
      // ==============================

      tl.to(brand, {
        opacity: 0,
        scale: 1.12,
        filter: "blur(24px)",
        letterSpacing: "0.22em",
        duration: 0.8,
        ease: "power3.inOut",
      });

      tl.to(
        smallBrand,
        {
          opacity: 0,
          duration: 0.4,
        },
        "<"
      );

      tl.to(
        section,
        {
          opacity: 0,
          duration: 0.45,
          ease: "power2.out",
        },
        "-=0.3"
      );
    }, section);

    return () => {
      if (fontTimer) {
        window.clearInterval(fontTimer);
      }

      document.body.style.overflow = "";
      ctx.revert();
    };
  }, [onComplete]);

  return (
    <section
      ref={sectionRef}
      className="
        fixed
        inset-0
        z-[5000]
        flex
        items-center
        justify-center
        overflow-hidden
        bg-black
        text-white
      "
    >
      {/* MAIN HIVRASOFT */}

      <div className="absolute inset-0 flex items-center justify-center px-6">
        <h1
          ref={brandRef}
          className="
            select-none
            whitespace-nowrap
            text-center
            text-[13vw]
            uppercase
            leading-none
            text-white
            sm:text-[11vw]
            md:text-[9vw]
            lg:text-[7.5vw]
          "
          style={{
            fontFamily: "Arial Black, Arial, sans-serif",
            fontWeight: "900",
            letterSpacing: "-0.06em",
          }}
        >
          HIVRASOFT
        </h1>
      </div>

      {/* SMALL BRAND */}

      <p
        ref={smallBrandRef}
        className="
          absolute
          bottom-8
          left-1/2
          -translate-x-1/2
          whitespace-nowrap
          text-[8px]
          uppercase
          tracking-[0.5em]
          text-white
          sm:text-[9px]
        "
      >
        Hivra Soft
      </p>
    </section>
  );
}