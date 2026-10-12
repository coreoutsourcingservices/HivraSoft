"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getCart,
} from "@/lib/cart";

import type {
  StorefrontOffer,
} from "@/src/services/offers";

/* =========================================================
   CONTEXT
========================================================= */

const FixedPriceOfferContext =
  createContext<
    StorefrontOffer | null
  >(
    null
  );

/* =========================================================
   CART TYPES
========================================================= */

type BundleCartItem = {
  quantity?:
    number;

  offerContext?:
    | {
        offerId?:
          string;

        offerType?:
          string;

        source?:
          string;
      }
    | null;
};

/* =========================================================
   READ CART ITEMS
========================================================= */

function readCartItems(
  response:
    unknown
): BundleCartItem[] {
  if (
    !response ||
    typeof response !==
      "object"
  ) {
    return [];
  }

  const root =
    response as {
      items?:
        BundleCartItem[];

      cart?: {
        items?:
          BundleCartItem[];
      };

      data?: {
        items?:
          BundleCartItem[];

        cart?: {
          items?:
            BundleCartItem[];
        };
      };
    };

  if (
    Array.isArray(
      root.cart?.items
    )
  ) {
    return root.cart!.items!;
  }

  if (
    Array.isArray(
      root.data?.cart?.items
    )
  ) {
    return root.data!.cart!.items!;
  }

  if (
    Array.isArray(
      root.data?.items
    )
  ) {
    return root.data!.items!;
  }

  if (
    Array.isArray(
      root.items
    )
  ) {
    return root.items;
  }

  return [];
}

/* =========================================================
   GET BUNDLE QUANTITY
========================================================= */

function getSelectedBundleQuantity(
  response:
    unknown,

  offerId:
    string
) {
  const items =
    readCartItems(
      response
    );

  return items.reduce(
    (
      total,
      item
    ) => {
      const context =
        item.offerContext;

      const matches =
        String(
          context?.offerId ||
            ""
        ) ===
          String(
            offerId
          ) &&
        context?.offerType ===
          "fixed_price_bundle" &&
        context?.source ===
          "fixed_price_bundle";

      if (
        !matches
      ) {
        return total;
      }

      return (
        total +
        Math.max(
          0,

          Number(
            item.quantity ||
              0
          )
        )
      );
    },

    0
  );
}

/* =========================================================
   PROGRESS FLOATING PILL
========================================================= */

function BundleProgressNotice({
  offer,

  selectedQuantity,
}: {
  offer:
    StorefrontOffer;

  selectedQuantity:
    number;
}) {
  const requiredQuantity =
    Math.max(
      1,

      Number(
        offer.buyQuantity ||
          1
      )
    );

  const currentQuantity =
    selectedQuantity %
    requiredQuantity;

  /*
   * Exact completed bundle:
   *
   * 4/4
   * 3/3
   * 5/5 etc.
   *
   * Is state me normal progress pill nahi dikhana.
   */
  const unlocked =
    selectedQuantity >
      0 &&
    currentQuantity ===
      0;

  /*
   * User ne abhi bundle start nahi kiya.
   *
   * 0 items par kuch nahi dikhega.
   */
  if (
    selectedQuantity <=
      0 ||
    unlocked
  ) {
    return null;
  }

  const remainingQuantity =
    Math.max(
      0,

      requiredQuantity -
        currentQuantity
    );

  const progressPercent =
    Math.max(
      0,

      Math.min(
        100,

        (
          currentQuantity /
          requiredQuantity
        ) *
          100
      )
    );

  return (
    <div
      className="
        fixed

        bottom-5
        right-3

        z-[9990]

        flex

        max-w-[calc(100vw-24px)]

        items-center

        gap-2.5

        rounded-full

        border
        border-[#F09AB6]

        bg-white/95

        px-3
        py-2.5

        shadow-[0_12px_35px_rgba(132,30,65,0.20)]

        backdrop-blur-xl

        transition-all
        duration-300

        sm:bottom-6
        sm:right-5

        sm:min-w-[260px]

        sm:px-4
        sm:py-3

        lg:bottom-8
        lg:right-7
      "
    >
      {/* =================================================
          TEXT
      ================================================= */}

      <div
        className="
          min-w-0

          flex-1
        "
      >
        <p
          className="
            whitespace-nowrap

            text-[9px]

            font-extrabold

            leading-[1.2]

            text-[#D71957]

            min-[390px]:text-[10px]

            sm:text-[11px]
          "
        >
          Add{" "}
          {
            remainingQuantity
          }{" "}
          more to unlock
        </p>

        <p
          className="
            mt-0.5

            max-w-[145px]

            truncate

            text-[7px]

            font-medium

            text-[#6D5A60]

            min-[390px]:text-[8px]

            sm:max-w-[170px]
            sm:text-[9px]
          "
        >
          {
            offer.name ||
            "Bundle pricing"
          }
        </p>
      </div>

      {/* =================================================
          CIRCULAR PROGRESS
      ================================================= */}

      <div
        className="
          relative

          flex

          h-[42px]
          w-[42px]

          shrink-0

          items-center
          justify-center

          rounded-full

          sm:h-[46px]
          sm:w-[46px]
        "
        style={{
          background:
            `conic-gradient(
              #D71957 ${progressPercent}%,
              #F4D7E1 ${progressPercent}% 100%
            )`,
        }}
      >
        <div
          className="
            flex

            h-[34px]
            w-[34px]

            items-center
            justify-center

            rounded-full

            bg-white

            text-[10px]

            font-black

            text-[#201A1B]

            sm:h-[37px]
            sm:w-[37px]
            sm:text-[11px]
          "
        >
          {
            currentQuantity
          }
          /
          {
            requiredQuantity
          }
        </div>
      </div>

      {/* =================================================
          ARROW
      ================================================= */}

      <div
        className="
          flex

          h-[32px]
          w-[32px]

          shrink-0

          items-center
          justify-center

          rounded-full

          bg-[#FCE4EC]

          text-[20px]

          font-semibold

          leading-none

          text-[#E32161]

          sm:h-[34px]
          sm:w-[34px]
        "
      >
        ›
      </div>
    </div>
  );
}

/* =========================================================
   OFFER UNLOCKED BURST
========================================================= */

function OfferUnlockedBurst() {
  return (
    <div
      className="
        pointer-events-none

        fixed

        bottom-6
        right-3

        z-[10040]

        flex

        w-[calc(100vw-24px)]

        max-w-[330px]

        items-center
        justify-center

        sm:bottom-8
        sm:right-6

        lg:bottom-10
        lg:right-8
      "
    >
      <div
        className="
          relative

          w-full

          overflow-visible

          rounded-[22px]

          border
          border-[#89D7A5]

          bg-white/95

          px-5
          py-5

          text-center

          shadow-[0_22px_70px_rgba(26,137,69,0.25)]

          backdrop-blur-xl

          animate-[bundleUnlockPop_.45s_cubic-bezier(.2,.9,.25,1.25)]
        "
      >
        {/* =================================================
            BURST RAYS
        ================================================= */}

        <span
          className="
            absolute
            left-1/2
            top-1/2

            h-[3px]
            w-[34px]

            origin-left

            -translate-y-1/2

            bg-[#F3B820]

            animate-[bundleRay_.8s_ease-out]
          "
          style={{
            transform:
              "rotate(0deg) translateX(42px)",
          }}
        />

        <span
          className="
            absolute
            left-1/2
            top-1/2

            h-[3px]
            w-[30px]

            origin-left

            -translate-y-1/2

            bg-[#EC4F83]

            animate-[bundleRay_.8s_ease-out]
          "
          style={{
            transform:
              "rotate(45deg) translateX(42px)",
          }}
        />

        <span
          className="
            absolute
            left-1/2
            top-1/2

            h-[3px]
            w-[34px]

            origin-left

            -translate-y-1/2

            bg-[#20A653]

            animate-[bundleRay_.8s_ease-out]
          "
          style={{
            transform:
              "rotate(90deg) translateX(42px)",
          }}
        />

        <span
          className="
            absolute
            left-1/2
            top-1/2

            h-[3px]
            w-[28px]

            origin-left

            -translate-y-1/2

            bg-[#7C63E8]

            animate-[bundleRay_.8s_ease-out]
          "
          style={{
            transform:
              "rotate(135deg) translateX(42px)",
          }}
        />

        <span
          className="
            absolute
            left-1/2
            top-1/2

            h-[3px]
            w-[34px]

            origin-left

            -translate-y-1/2

            bg-[#F3B820]

            animate-[bundleRay_.8s_ease-out]
          "
          style={{
            transform:
              "rotate(180deg) translateX(42px)",
          }}
        />

        <span
          className="
            absolute
            left-1/2
            top-1/2

            h-[3px]
            w-[30px]

            origin-left

            -translate-y-1/2

            bg-[#EC4F83]

            animate-[bundleRay_.8s_ease-out]
          "
          style={{
            transform:
              "rotate(225deg) translateX(42px)",
          }}
        />

        <span
          className="
            absolute
            left-1/2
            top-1/2

            h-[3px]
            w-[34px]

            origin-left

            -translate-y-1/2

            bg-[#20A653]

            animate-[bundleRay_.8s_ease-out]
          "
          style={{
            transform:
              "rotate(270deg) translateX(42px)",
          }}
        />

        <span
          className="
            absolute
            left-1/2
            top-1/2

            h-[3px]
            w-[28px]

            origin-left

            -translate-y-1/2

            bg-[#7C63E8]

            animate-[bundleRay_.8s_ease-out]
          "
          style={{
            transform:
              "rotate(315deg) translateX(42px)",
          }}
        />

        {/* =================================================
            SUCCESS ICON
        ================================================= */}

        <div
          className="
            relative
            z-10

            mx-auto

            flex

            h-[54px]
            w-[54px]

            items-center
            justify-center

            rounded-full

            bg-[#DDF6E6]

            text-[28px]

            shadow-[0_8px_25px_rgba(32,166,83,.20)]

            animate-[bundleIconPop_.55s_cubic-bezier(.2,.9,.3,1.4)]
          "
        >
          🎉
        </div>

        {/* =================================================
            TEXT
        ================================================= */}

        <p
          className="
            relative
            z-10

            mt-3

            text-[13px]

            font-black

            uppercase

            tracking-[0.06em]

            text-[#177A3D]

            sm:text-[14px]
          "
        >
          Your Offer Is Unlocked
        </p>

        <p
          className="
            relative
            z-10

            mt-1

            text-[9px]

            font-medium

            text-black/45

            sm:text-[10px]
          "
        >
          Bundle pricing applied successfully
        </p>
      </div>

      {/* =================================================
          ANIMATION
      ================================================= */}

      <style>
        {`
          @keyframes bundleUnlockPop {
            0% {
              opacity: 0;
              transform: translateY(24px) scale(.82);
            }

            65% {
              opacity: 1;
              transform: translateY(-4px) scale(1.04);
            }

            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes bundleIconPop {
            0% {
              transform: scale(.35) rotate(-20deg);
            }

            65% {
              transform: scale(1.18) rotate(8deg);
            }

            100% {
              transform: scale(1) rotate(0deg);
            }
          }

          @keyframes bundleRay {
            0% {
              opacity: 0;
            }

            25% {
              opacity: 1;
            }

            100% {
              opacity: 0;
            }
          }
        `}
      </style>
    </div>
  );
}

/* =========================================================
   PROVIDER
========================================================= */

export function FixedPriceOfferScope({
  offer,

  children,
}: {
  offer:
    | StorefrontOffer
    | null
    | undefined;

  children:
    ReactNode;
}) {
  const validOffer =
    offer &&
    offer.isActive !==
      false &&
    offer.offerType ===
      "fixed_price_bundle"
      ? offer
      : null;

  const [
    selectedQuantity,

    setSelectedQuantity,
  ] =
    useState(
      0
    );

  const [
    showUnlockedBurst,

    setShowUnlockedBurst,
  ] =
    useState(
      false
    );

  /*
   * Previous quantity remember karenge.
   *
   * Isse page open hote hi existing 4/4
   * cart par fake unlock popup nahi aayega.
   *
   * Popup sirf actual NEW add ke baad aayega.
   */
  const previousQuantityRef =
    useRef(
      0
    );

  const initialLoadDoneRef =
    useRef(
      false
    );

  const burstTimerRef =
    useRef<
      ReturnType<
        typeof setTimeout
      > | null
    >(
      null
    );

  /* =======================================================
     LOAD BUNDLE STATE
  ======================================================= */

  const loadBundleProgress =
    useCallback(
      async (
        triggerUnlockAnimation:
          boolean
      ) => {
        if (
          !validOffer
        ) {
          setSelectedQuantity(
            0
          );

          previousQuantityRef.current =
            0;

          return;
        }

        try {
          const cart =
            await getCart();

          const quantity =
            getSelectedBundleQuantity(
              cart,

              validOffer._id
            );

          const requiredQuantity =
            Math.max(
              1,

              Number(
                validOffer.buyQuantity ||
                  1
              )
            );

          const previousQuantity =
            previousQuantityRef.current;

          /*
           * Complete bundle detect:
           *
           * 4/4
           * 3/3
           * 5/5
           * etc.
           */
          const unlockedNow =
            quantity >
              0 &&
            quantity %
                requiredQuantity ===
              0;

          /*
           * Important:
           *
           * Unlock popup sirf tab:
           *
           * 1. cart update hua ho
           * 2. quantity increase hui ho
           * 3. exact bundle quantity complete hui ho
           */
          const newlyUnlocked =
            triggerUnlockAnimation &&
            quantity >
              previousQuantity &&
            unlockedNow;

          setSelectedQuantity(
            quantity
          );

          previousQuantityRef.current =
            quantity;

          if (
            newlyUnlocked
          ) {
            /*
             * Normal 4/4 progress pill
             * is state me render hi nahi hoga.
             *
             * Sirf burst.
             */
            setShowUnlockedBurst(
              true
            );

            if (
              burstTimerRef.current
            ) {
              clearTimeout(
                burstTimerRef.current
              );
            }

            burstTimerRef.current =
              setTimeout(
                () => {
                  setShowUnlockedBurst(
                    false
                  );
                },

                2800
              );
          }
        } catch {
          /*
           * Cart empty / guest / API problem:
           * bundle progress hidden.
           */
          setSelectedQuantity(
            0
          );

          previousQuantityRef.current =
            0;
        }
      },

      [
        validOffer,
      ]
    );

  /* =======================================================
     INITIAL LOAD

     Initial load par burst kabhi nahi.
  ======================================================= */

  useEffect(() => {
    if (
      !validOffer
    ) {
      setSelectedQuantity(
        0
      );

      setShowUnlockedBurst(
        false
      );

      previousQuantityRef.current =
        0;

      initialLoadDoneRef.current =
        false;

      return;
    }

    let active =
      true;

    async function initialize() {
      await loadBundleProgress(
        false
      );

      if (
        active
      ) {
        initialLoadDoneRef.current =
          true;
      }
    }

    void initialize();

    return () => {
      active =
        false;
    };
  }, [
    validOffer,

    loadBundleProgress,
  ]);

  /* =======================================================
     CART UPDATE

     Product add hone ke baad hi progress/update.
  ======================================================= */

  useEffect(() => {
    if (
      !validOffer
    ) {
      return;
    }

    const handleCartUpdated =
      () => {
        /*
         * Initial cart load complete hone ke baad
         * hi unlock burst allow karenge.
         */
        void loadBundleProgress(
          initialLoadDoneRef.current
        );
      };

    const handleAuthChanged =
      () => {
        void loadBundleProgress(
          false
        );
      };

    window.addEventListener(
      "hivrasoft-cart-updated",

      handleCartUpdated
    );

    window.addEventListener(
      "hivrasoft-auth-changed",

      handleAuthChanged
    );

    return () => {
      window.removeEventListener(
        "hivrasoft-cart-updated",

        handleCartUpdated
      );

      window.removeEventListener(
        "hivrasoft-auth-changed",

        handleAuthChanged
      );
    };
  }, [
    validOffer,

    loadBundleProgress,
  ]);

  /* =======================================================
     CLEANUP
  ======================================================= */

  useEffect(() => {
    return () => {
      if (
        burstTimerRef.current
      ) {
        clearTimeout(
          burstTimerRef.current
        );
      }
    };
  }, []);

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <FixedPriceOfferContext.Provider
      value={
        validOffer
      }
    >
      {
        children
      }

      {/* =================================================
          PROGRESS

          0 item = hidden
          1/4 = visible
          2/4 = visible
          3/4 = visible
          4/4 = hidden
      ================================================= */}

      {validOffer ? (
        <BundleProgressNotice
          offer={
            validOffer
          }
          selectedQuantity={
            selectedQuantity
          }
        />
      ) : null}

      {/* =================================================
          UNLOCK BURST

          4/4 etc hone ke baad temporary popup.
      ================================================= */}

      {validOffer &&
      showUnlockedBurst ? (
        <OfferUnlockedBurst />
      ) : null}
    </FixedPriceOfferContext.Provider>
  );
}

/* =========================================================
   HOOK
========================================================= */

export function useFixedPriceOfferScope() {
  return useContext(
    FixedPriceOfferContext
  );
}