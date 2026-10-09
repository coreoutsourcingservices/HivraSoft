"use client";

import {
  useEffect,
  useRef,
} from "react";

import {
  usePathname,
} from "next/navigation";

/* =========================================================
   HELPERS
========================================================= */

function randomBetween(
  min: number,
  max: number,
) {
  return (
    Math.floor(
      Math.random() *
        (max - min + 1),
    ) + min
  );
}

/* =========================================================
   COLORS
========================================================= */

const COLORS = [
  "#FF2F7D",
  "#D41455",
  "#FF4F9A",
  "#F54E75",
  "#E9438A",
  "#FF6B35",
  "#FF8A00",
  "#FFB800",
  "#FFD700",
  "#F8C537",
  "#FFF1A8",
];

/* =========================================================
   SYMBOLS
========================================================= */

const SYMBOLS = [
  "✦",
  "✧",
  "★",
  "✶",
  "✷",
  "◆",
  "•",
  "✹",
];

/* =========================================================
   MAIN
========================================================= */

export default function FestiveCrackerEffects() {
  const pathname =
    usePathname();

  const overlayRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const lastScrollBurst =
    useRef(0);

  const lastPointerBurst =
    useRef(0);

  const lastPointerPosition =
    useRef({
      x: 0,
      y: 0,
    });

  const currentPointer =
    useRef({
      x: 0,
      y: 0,
      active: false,
    });

  /* =======================================================
     HIDDEN ROUTES
  ======================================================= */

  const hiddenRoute =
    pathname === "/admin" ||
    pathname.startsWith(
      "/admin/",
    ) ||
    pathname === "/account" ||
    pathname.startsWith(
      "/account/",
    ) ||
    pathname === "/cart" ||
    pathname.startsWith(
      "/cart/",
    ) ||
    pathname === "/wishlist" ||
    pathname.startsWith(
      "/wishlist/",
    ) ||
    pathname === "/checkout" ||
    pathname.startsWith(
      "/checkout/",
    ) ||
    pathname === "/payment" ||
    pathname.startsWith(
      "/payment/",
    ) ||
    pathname === "/thanks" ||
    pathname.startsWith(
      "/thanks/",
    );

  /* =======================================================
     EFFECTS
  ======================================================= */

  useEffect(() => {
    if (
      hiddenRoute
    ) {
      return;
    }

    const overlay =
      overlayRef.current;

    if (
      !overlay
    ) {
      return;
    }

    /* =====================================================
       CREATE PARTICLE
    ===================================================== */

    function createParticle({
      x,
      y,
      distance,
      angle,
      size,
      duration,
      delay,
      symbol,
    }: {
      x: number;
      y: number;
      distance: number;
      angle: number;
      size: number;
      duration: number;
      delay: number;
      symbol: string;
    }) {
      const particle =
        document.createElement(
          "span",
        );

      const radians =
        (angle * Math.PI) /
        180;

      const moveX =
        Math.cos(
          radians,
        ) * distance;

      const moveY =
        Math.sin(
          radians,
        ) * distance;

      const color =
        COLORS[
          randomBetween(
            0,
            COLORS.length - 1,
          )
        ];

      particle.className =
        "hivra-festive-particle";

      particle.textContent =
        symbol;

      particle.style.left =
        `${x}px`;

      particle.style.top =
        `${y}px`;

      particle.style.fontSize =
        `${size}px`;

      particle.style.color =
        color;

      particle.style.setProperty(
        "--festive-x",
        `${moveX}px`,
      );

      particle.style.setProperty(
        "--festive-y",
        `${moveY}px`,
      );

      particle.style.setProperty(
        "--festive-rotate",
        `${randomBetween(
          -360,
          360,
        )}deg`,
      );

      particle.style.setProperty(
        "--festive-duration",
        `${duration}ms`,
      );

      particle.style.setProperty(
        "--festive-delay",
        `${delay}ms`,
      );

      overlay.appendChild(
        particle,
      );

      window.setTimeout(
        () => {
          particle.remove();
        },
        duration +
          delay +
          150,
      );
    }

    /* =====================================================
       FLASH
    ===================================================== */

    function createFlash(
      x: number,
      y: number,
      type:
        | "big"
        | "small",
    ) {
      const flash =
        document.createElement(
          "span",
        );

      flash.className =
        type === "big"
          ? "hivra-festive-flash"
          : "hivra-mini-flash";

      flash.style.left =
        `${x}px`;

      flash.style.top =
        `${y}px`;

      overlay.appendChild(
        flash,
      );

      window.setTimeout(
        () => {
          flash.remove();
        },
        type === "big"
          ? 550
          : 350,
      );
    }

    /* =====================================================
       CLICK BURST

       DESKTOP 60 - 85
       MOBILE 45 - 60
    ===================================================== */

    function createClickBurst(
      x: number,
      y: number,
    ) {
      const mobile =
        window.innerWidth <
        768;

      const count =
        mobile
          ? randomBetween(
              45,
              60,
            )
          : randomBetween(
              60,
              85,
            );

      createFlash(
        x,
        y,
        "big",
      );

      for (
        let index = 0;
        index < count;
        index += 1
      ) {
        createParticle({
          x,
          y,

          angle:
            randomBetween(
              0,
              360,
            ),

          distance:
            mobile
              ? randomBetween(
                  50,
                  170,
                )
              : randomBetween(
                  70,
                  250,
                ),

          size:
            randomBetween(
              6,
              mobile
                ? 15
                : 19,
            ),

          duration:
            randomBetween(
              550,
              1050,
            ),

          delay:
            randomBetween(
              0,
              100,
            ),

          symbol:
            SYMBOLS[
              randomBetween(
                0,
                SYMBOLS.length -
                  1,
              )
            ],
        });
      }
    }

    /* =====================================================
       MOUSE MOVE BURST

       Desktop only:
       cursor ko left/right move karoge
       to small cracker trail aayega.

       4 - 6 particles only.
    ===================================================== */

    function createPointerBurst(
      x: number,
      y: number,
    ) {
      const count =
        randomBetween(
          4,
          6,
        );

      createFlash(
        x,
        y,
        "small",
      );

      for (
        let index = 0;
        index < count;
        index += 1
      ) {
        createParticle({
          x:
            x +
            randomBetween(
              -7,
              7,
            ),

          y:
            y +
            randomBetween(
              -7,
              7,
            ),

          angle:
            randomBetween(
              0,
              360,
            ),

          distance:
            randomBetween(
              20,
              55,
            ),

          size:
            randomBetween(
              4,
              9,
            ),

          duration:
            randomBetween(
              350,
              600,
            ),

          delay:
            randomBetween(
              0,
              30,
            ),

          symbol:
            SYMBOLS[
              randomBetween(
                0,
                SYMBOLS.length -
                  1,
              )
            ],
        });
      }
    }

    /* =====================================================
       SCROLL BURST

       LIGHT VERSION

       DESKTOP 5 - 7
       MOBILE 3 - 5
    ===================================================== */

    function createScrollBurst() {
      const mobile =
        window.innerWidth <
        768;

      const width =
        window.innerWidth;

      const height =
        window.innerHeight;

      const count =
        mobile
          ? randomBetween(
              3,
              5,
            )
          : randomBetween(
              5,
              7,
            );

      let centerX =
        currentPointer.current
          .active
          ? currentPointer
              .current.x
          : randomBetween(
              Math.floor(
                width * 0.3,
              ),
              Math.floor(
                width * 0.7,
              ),
            );

      let centerY =
        currentPointer.current
          .active
          ? currentPointer
              .current.y
          : randomBetween(
              Math.floor(
                height * 0.3,
              ),
              Math.floor(
                height * 0.7,
              ),
            );

      centerX =
        Math.max(
          30,
          Math.min(
            width - 30,
            centerX,
          ),
        );

      centerY =
        Math.max(
          40,
          Math.min(
            height - 40,
            centerY,
          ),
        );

      /*
       * Scroll par flash har baar nahi.
       * Randomly kabhi-kabhi.
       */

      if (
        Math.random() >
        0.55
      ) {
        createFlash(
          centerX,
          centerY,
          "small",
        );
      }

      for (
        let index = 0;
        index < count;
        index += 1
      ) {
        const usePointerArea =
          Math.random() <
          0.7;

        let x: number;
        let y: number;

        if (
          usePointerArea
        ) {
          x =
            centerX +
            randomBetween(
              mobile
                ? -50
                : -75,
              mobile
                ? 50
                : 75,
            );

          y =
            centerY +
            randomBetween(
              mobile
                ? -55
                : -75,
              mobile
                ? 55
                : 75,
            );
        } else {
          x =
            randomBetween(
              20,
              width - 20,
            );

          y =
            randomBetween(
              Math.floor(
                height * 0.18,
              ),
              Math.floor(
                height * 0.85,
              ),
            );
        }

        x =
          Math.max(
            10,
            Math.min(
              width - 10,
              x,
            ),
          );

        y =
          Math.max(
            10,
            Math.min(
              height - 10,
              y,
            ),
          );

        createParticle({
          x,
          y,

          angle:
            randomBetween(
              0,
              360,
            ),

          distance:
            mobile
              ? randomBetween(
                  20,
                  55,
                )
              : randomBetween(
                  25,
                  65,
                ),

          size:
            randomBetween(
              4,
              mobile
                ? 8
                : 10,
            ),

          duration:
            randomBetween(
              350,
              600,
            ),

          delay:
            randomBetween(
              0,
              35,
            ),

          symbol:
            SYMBOLS[
              randomBetween(
                0,
                SYMBOLS.length -
                  1,
              )
            ],
        });
      }
    }

    /* =====================================================
       CLICK
    ===================================================== */

    function handleClick(
      event: MouseEvent,
    ) {
      createClickBurst(
        event.clientX,
        event.clientY,
      );
    }

    /* =====================================================
       MOUSE LEFT / RIGHT
    ===================================================== */

    function handlePointerMove(
      event: PointerEvent,
    ) {
      currentPointer.current =
        {
          x: event.clientX,
          y: event.clientY,
          active: true,
        };

      /*
       * Mobile touch ko yahan
       * mouse burst nahi dena.
       */

      if (
        event.pointerType ===
        "touch"
      ) {
        return;
      }

      const previous =
        lastPointerPosition.current;

      const movementX =
        Math.abs(
          event.clientX -
            previous.x,
        );

      const movementY =
        Math.abs(
          event.clientY -
            previous.y,
        );

      lastPointerPosition.current =
        {
          x: event.clientX,
          y: event.clientY,
        };

      /*
       * Very tiny movement par
       * effect nahi.
       */

      if (
        movementX < 8 &&
        movementY < 8
      ) {
        return;
      }

      const now =
        Date.now();

      /*
       * Cursor effect controlled.
       * Har pixel par burst nahi.
       */

      if (
        now -
          lastPointerBurst.current <
        100
      ) {
        return;
      }

      lastPointerBurst.current =
        now;

      createPointerBurst(
        event.clientX,
        event.clientY,
      );
    }

    /* =====================================================
       MOBILE TOUCH POSITION
    ===================================================== */

    function handleTouchMove(
      event: TouchEvent,
    ) {
      const touch =
        event.touches[0];

      if (
        !touch
      ) {
        return;
      }

      currentPointer.current =
        {
          x: touch.clientX,
          y: touch.clientY,
          active: true,
        };
    }

    /* =====================================================
       SCROLL
    ===================================================== */

    function handleScroll() {
      const now =
        Date.now();

      const mobile =
        window.innerWidth <
        768;

      /*
       * Scroll particles ab kam hain.
       * Gap bhi bada rakha hai.
       */

      const throttle =
        mobile
          ? 280
          : 240;

      if (
        now -
          lastScrollBurst.current <
        throttle
      ) {
        return;
      }

      lastScrollBurst.current =
        now;

      createScrollBurst();
    }

    /* =====================================================
       EVENTS
    ===================================================== */

    document.addEventListener(
      "click",
      handleClick,
    );

    window.addEventListener(
      "pointermove",
      handlePointerMove,
      {
        passive: true,
      },
    );

    window.addEventListener(
      "touchmove",
      handleTouchMove,
      {
        passive: true,
      },
    );

    window.addEventListener(
      "scroll",
      handleScroll,
      {
        passive: true,
      },
    );

    /* =====================================================
       CLEANUP
    ===================================================== */

    return () => {
      document.removeEventListener(
        "click",
        handleClick,
      );

      window.removeEventListener(
        "pointermove",
        handlePointerMove,
      );

      window.removeEventListener(
        "touchmove",
        handleTouchMove,
      );

      window.removeEventListener(
        "scroll",
        handleScroll,
      );

      overlay.innerHTML =
        "";
    };
  }, [
    hiddenRoute,
  ]);

  /* =======================================================
     HIDDEN
  ======================================================= */

  if (
    hiddenRoute
  ) {
    return null;
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <>
      <style>
        {`
          /* =============================================
             PARTICLES
          ============================================= */

          .hivra-festive-particle {
            position: absolute;

            display: block;

            pointer-events: none;
            user-select: none;

            width: auto;
            height: auto;

            line-height: 1;

            font-weight: 900;

            opacity: 0;

            filter:
              drop-shadow(
                0 0 3px
                currentColor
              );

            text-shadow:
              0 0 4px currentColor,
              0 0 8px currentColor,
              0 0 14px currentColor,
              0 0 20px rgba(
                255,
                255,
                255,
                .75
              );

            transform:
              translate(
                -50%,
                -50%
              )
              scale(.15);

            animation:
              hivraFestiveParticle
              var(
                --festive-duration
              )
              cubic-bezier(
                .13,
                .75,
                .24,
                1
              )
              var(
                --festive-delay
              )
              forwards;

            will-change:
              transform,
              opacity;
          }

          @keyframes hivraFestiveParticle {
            0% {
              opacity: 0;

              transform:
                translate(
                  -50%,
                  -50%
                )
                scale(.1)
                rotate(0deg);
            }

            10% {
              opacity: 1;

              transform:
                translate(
                  -50%,
                  -50%
                )
                scale(1.35)
                rotate(25deg);
            }

            45% {
              opacity: 1;
            }

            72% {
              opacity: .8;
            }

            100% {
              opacity: 0;

              transform:
                translate(
                  calc(
                    -50% +
                    var(--festive-x)
                  ),
                  calc(
                    -50% +
                    var(--festive-y)
                  )
                )
                scale(.25)
                rotate(
                  var(
                    --festive-rotate
                  )
                );
            }
          }

          /* =============================================
             BIG CLICK FLASH
          ============================================= */

          .hivra-festive-flash {
            position: absolute;

            width: 11px;
            height: 11px;

            pointer-events: none;

            border-radius: 999px;

            background: #ffffff;

            box-shadow:
              0 0 8px 4px
                #ffffff,
              0 0 18px 8px
                #ffd83d,
              0 0 32px 13px
                #ff981f,
              0 0 52px 18px
                rgba(
                  255,
                  39,
                  119,
                  .80
                );

            transform:
              translate(
                -50%,
                -50%
              )
              scale(0);

            animation:
              hivraFestiveFlash
              520ms
              ease-out
              forwards;
          }

          @keyframes hivraFestiveFlash {
            0% {
              opacity: 1;

              transform:
                translate(
                  -50%,
                  -50%
                )
                scale(0);
            }

            30% {
              opacity: 1;

              transform:
                translate(
                  -50%,
                  -50%
                )
                scale(3);
            }

            100% {
              opacity: 0;

              transform:
                translate(
                  -50%,
                  -50%
                )
                scale(6);
            }
          }

          /* =============================================
             SMALL MOUSE / SCROLL FLASH
          ============================================= */

          .hivra-mini-flash {
            position: absolute;

            width: 5px;
            height: 5px;

            pointer-events: none;

            border-radius: 999px;

            background: #fff8ca;

            box-shadow:
              0 0 5px 2px
                #ffffff,
              0 0 10px 4px
                #ffd63c,
              0 0 18px 6px
                rgba(
                  255,
                  56,
                  128,
                  .55
                );

            transform:
              translate(
                -50%,
                -50%
              )
              scale(0);

            animation:
              hivraMiniFlash
              330ms
              ease-out
              forwards;
          }

          @keyframes hivraMiniFlash {
            0% {
              opacity: .9;

              transform:
                translate(
                  -50%,
                  -50%
                )
                scale(.2);
            }

            40% {
              opacity: 1;

              transform:
                translate(
                  -50%,
                  -50%
                )
                scale(2);
            }

            100% {
              opacity: 0;

              transform:
                translate(
                  -50%,
                  -50%
                )
                scale(3.4);
            }
          }

          /* =============================================
             REDUCED MOTION
          ============================================= */

          @media (
            prefers-reduced-motion:
            reduce
          ) {
            .hivra-festive-particle,
            .hivra-festive-flash,
            .hivra-mini-flash {
              display:
                none !important;
            }
          }
        `}
      </style>

      <div
        ref={
          overlayRef
        }
        aria-hidden="true"
        className="
          pointer-events-none
          fixed
          inset-0
          z-[9980]
          overflow-hidden
        "
      />
    </>
  );
}