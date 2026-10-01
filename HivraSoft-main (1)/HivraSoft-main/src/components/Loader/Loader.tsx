"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

type LoaderProps = {
  onComplete?: () => void;
};

const greetings = [
  "नमस्ते",
  "Hello",
  "السلام علیکم",
];

export default function Loader({
  onComplete,
}: LoaderProps) {
  const [index, setIndex] = useState(0);
  const [finished, setFinished] = useState(false);

  const loaderRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (finished) return;

    const loader = loaderRef.current;
    const text = textRef.current;

    if (!loader || !text) return;

    document.body.style.overflow = "hidden";

    // --------------------------------
    // GREETING ENTER
    // --------------------------------

    gsap.fromTo(
      text,
      {
        opacity: 0,
        y: 22,
        scale: 0.96,
        filter: "blur(6px)",
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.45,
        ease: "power3.out",
      }
    );

    // --------------------------------
    // HOLD EACH LANGUAGE
    // --------------------------------

    const timer = window.setTimeout(() => {
      gsap.to(text, {
        opacity: 0,
        y: -18,
        scale: 1.02,
        filter: "blur(6px)",
        duration: 0.3,
        ease: "power3.in",

        onComplete: () => {
          // NEXT GREETING
          if (index < greetings.length - 1) {
            setIndex((prev) => prev + 1);
            return;
          }

          // --------------------------------
          // LAST GREETING FINISHED
          // FADE BLACK LOADER OUT
          // --------------------------------

          gsap.to(loader, {
            opacity: 0,
            duration: 0.55,
            ease: "power2.inOut",

            onComplete: () => {
              document.body.style.overflow = "";

              setFinished(true);

              // Starts HIVRASOFT intro
              onComplete?.();
            },
          });
        },
      });
    }, 850);

    return () => {
      window.clearTimeout(timer);
    };
  }, [index, finished, onComplete]);

  if (finished) {
    return null;
  }

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
        bg-black
        text-white
      "
    >
      {/* GREETING */}

      <h1
        key={index}
        ref={textRef}
        dir={index === 2 ? "rtl" : "ltr"}
        className="
          text-center
          text-[38px]
          font-normal
          italic
          leading-none
          sm:text-[46px]
          md:text-[56px]
        "
        style={{
          fontFamily:
            '"Segoe Script", "Brush Script MT", cursive',
        }}
      >
        {greetings[index]}
      </h1>

      {/* SMALL BRAND */}

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
    </div>
  );
}