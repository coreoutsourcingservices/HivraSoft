"use client";

import Link from "next/link";

import {

  useCallback,

  useEffect,

  useMemo,

  useRef,

  useState,

} from "react";

import {

  AlertCircle,

  ArrowRight,

  CalendarDays,

  CheckCircle2,

  ChevronDown,

  ChevronUp,

  Clock3,

  Download,

  Heart,

  MapPin,

  Package,

  RefreshCcw,


  ShieldCheck,

  ShoppingBag,

  Sparkles,

  Truck,

  XCircle,

} from "lucide-react";

import Header from "@/src/components/Header/Header";

import AccountSidebar from "@/app/account/components/AccountSidebar";

import {

  getMyOrders,

  userInvoiceUrl,

} from "@/lib/orders";

import {
  apiFetch,
} from "@/lib/api";

import {
  createProductReview,
} from "@/lib/reviews";

import type {

  Order,

} from "@/types/order";

/* =========================================================

   HELPERS

========================================================= */

function formatPrice(

  value: number | undefined,

) {

  const price =

    Number(value || 0);

  return `₹${price.toLocaleString(

    "en-IN",

    {

      maximumFractionDigits:

        2,

    },

  )}`;

}

function formatDate(value?: string) {

  if (!value) return "—";

  const date =

    new Date(value);

  if (

    Number.isNaN(

      date.getTime(),

    )

  ) {

    return "—";

  }

  return new Intl.DateTimeFormat(

    "en-IN",

    {

      day: "2-digit",

      month: "short",

      year: "numeric",

    },

  ).format(date);

}

function normalizeStatus(

  value?: string,

) {

  return String(

    value || "confirmed",

  )

    .trim()

    .toLowerCase()

    .replaceAll(" ", "_");

}

function formatStatus(

  value?: string,

) {

  const status =

    normalizeStatus(value);

  const map: Record<

    string,

    string

  > = {

    pending:

      "Pending",

    pending_payment:

      "Payment Pending",

    confirmed:

      "Confirmed",

    processing:

      "Processing",

    shipped:

      "Shipped",

    out_for_delivery:

      "Out for Delivery",

    delivered:

      "Delivered",

    cancelled:

      "Cancelled",

    canceled:

      "Cancelled",

    returned:

      "Returned",

    refunded:

      "Refunded",

  };

  return (

    map[status] ||

    status

      .replaceAll(

        "_",

        " ",

      )

      .replace(

        /\b\w/g,

        (letter) =>

          letter.toUpperCase(),

      )

  );

}

function formatPaymentMethod(

  value?: string,

) {

  const method =

    String(value || "")

      .trim()

      .toLowerCase();

  if (

    method === "cod"

  ) {

    return "Cash on Delivery";

  }

  if (

    method ===

      "razorpay" ||

    method === "online"

  ) {

    return "Online Payment";

  }

  return value || "Payment";

}

function getStatusTheme(

  value?: string,

) {

  const status =

    normalizeStatus(value);

  if (

    status === "delivered"

  ) {

    return {

      bg: "#EAF7EF",

      border:

        "#CAE6D4",

      color:

        "#176337",

    };

  }

  if (

    status ===

      "cancelled" ||

    status ===

      "canceled"

  ) {

    return {

      bg: "#FFF0F0",

      border:

        "#F0CCCC",

      color:

        "#962828",

    };

  }

  if (

    status === "shipped" ||

    status ===

      "out_for_delivery"

  ) {

    return {

      bg: "#EEF4FF",

      border:

        "#D2E0F7",

      color:

        "#315B92",

    };

  }

  if (

    status ===

    "processing"

  ) {

    return {

      bg: "#FFF7E9",

      border:

        "#EEDDBD",

      color:

        "#7B551C",

    };

  }

  return {

    bg: "#FFF0F3",

    border:

      "#F0C9D1",

    color:

      "#A90D3B",

  };

}

function hasCancellationRequest(

  order: Order,

) {

  return (

    order.statusHistory ||

    []

  ).some(

    (entry) =>

      String(

        entry?.status ||

          "",

      )

        .trim()

        .toLowerCase() ===

      "cancellation_requested",

  );

}

function getAddress(

  order: Order,

) {

  const address =

    order.shippingAddress;

  if (!address) {

    return "";

  }

  return [

    address.addressLine1,

    address.addressLine2,

    address.landmark,

    address.city,

    address.district,

    address.state,

    address.postalCode,

  ]

    .filter(Boolean)

    .join(", ");

}

/* =========================================================
   ACTIVE DISCOUNT CODES
========================================================= */

type ActiveDiscountCode = {
  _id: string;
  code: string;

  valueType:
    | "percentage"
    | "fixed";

  percentage: number;
  fixedAmount: number;

  minAmount: number;

  maxAmount:
    | number
    | null;

  appliesToAllProducts:
    boolean;

  startsAt:
    | string
    | null;

  endsAt:
    | string
    | null;
};

type ActiveDiscountCodesResponse = {
  success?: boolean;
  codes?: ActiveDiscountCode[];
};

/* =========================================================
   DISCOUNT TEXT
========================================================= */

function discountCodeMessage(
  code:
    ActiveDiscountCode
) {
  const benefit =
    code.valueType ===
    "fixed"
      ? `${formatPrice(
          code.fixedAmount
        )} OFF`
      : `${Number(
          code.percentage ||
            0
        )}% OFF`;

  let range =
    "";

  if (
    code.minAmount >
      0 &&
    code.maxAmount !==
      null
  ) {
    range =
      ` on orders from ${formatPrice(
        code.minAmount
      )} to ${formatPrice(
        code.maxAmount
      )}`;
  } else if (
    code.minAmount >
    0
  ) {
    range =
      ` on orders above ${formatPrice(
        code.minAmount
      )}`;
  } else if (
    code.maxAmount !==
    null
  ) {
    range =
      ` on orders up to ${formatPrice(
        code.maxAmount
      )}`;
  }

  const scope =
    code.appliesToAllProducts
      ? ""
      : " on selected products";

  return `Use ${code.code} and get ${benefit}${range}${scope}.`;
}

/* =========================================================
   DISCOUNT NOTIFICATION
========================================================= */

/* =========================================================
   DISCOUNT CODE TOAST

   - Static big section removed.
   - New/updated discount code temporary notification banega.
   - 8 seconds baad auto hide.
   - Same exact offer signature repeat nahi hogi.
========================================================= */

type DiscountToastItem = {
  signature:
    string;

  code:
    ActiveDiscountCode;
};

function getDiscountSignature(
  code:
    ActiveDiscountCode
) {
  return [
    code._id,
    code.code,
    code.valueType,
    code.percentage,
    code.fixedAmount,
    code.minAmount,
    code.maxAmount,
    code.appliesToAllProducts,
    code.startsAt,
    code.endsAt,
  ].join(
    "|"
  );
}

function DiscountCodeToast({
  item,
  onClose,
}: {
  item:
    DiscountToastItem | null;

  onClose:
    () => void;
}) {
  const [
    copied,
    setCopied,
  ] =
    useState(
      false
    );

  const cardRef =
    useRef<
      HTMLDivElement | null
    >(
      null
    );

  const iconRef =
    useRef<
      HTMLDivElement | null
    >(
      null
    );

  useEffect(() => {
    setCopied(
      false
    );
  }, [
    item?.signature,
  ]);

  useEffect(() => {
    if (
      !item
    ) {
      return;
    }

    const card =
      cardRef.current;

    const icon =
      iconRef.current;

    if (
      card
    ) {
      card.animate(
        [
          {
            opacity:
              0,

            transform:
              "scale(0.78)",

            filter:
              "blur(4px)",
          },
          {
            opacity:
              1,

            transform:
              "scale(1.07)",

            filter:
              "blur(0px)",
          },
          {
            opacity:
              1,

            transform:
              "scale(0.98)",
          },
          {
            opacity:
              1,

            transform:
              "scale(1)",
          },
        ],
        {
          duration:
            430,

          easing:
            "cubic-bezier(0.16, 1, 0.3, 1)",

          fill:
            "both",
        }
      );
    }

    if (
      icon
    ) {
      icon.animate(
        [
          {
            transform:
              "scale(0.5) rotate(-18deg)",
          },
          {
            transform:
              "scale(1.22) rotate(8deg)",
          },
          {
            transform:
              "scale(1) rotate(0deg)",
          },
        ],
        {
          duration:
            520,

          easing:
            "cubic-bezier(0.16, 1, 0.3, 1)",
        }
      );
    }
  }, [
    item?.signature,
  ]);

  if (
    !item
  ) {
    return null;
  }

  const {
    code,
  } =
    item;

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(
        code.code
      );

      setCopied(
        true
      );

      window.setTimeout(
        () => {
          setCopied(
            false
          );
        },
        1400
      );
    } catch {
      setCopied(
        false
      );
    }
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[9999]

        flex
        items-center
        justify-center

        bg-black/20

        px-4
        py-8

        backdrop-blur-[1.5px]
      "
      role="presentation"
    >
      <div
        ref={
          cardRef
        }
        role="status"
        aria-live="polite"
        className="
          relative

          w-full
          max-w-[470px]

          overflow-hidden

          rounded-[22px]

          border
          border-[#E8CCD5]

          bg-white

          shadow-[0_30px_90px_rgba(65,13,31,.28)]
        "
      >
        {/* =================================================
            CLOSE BUTTON
        ================================================= */}

        <button
          type="button"
          aria-label="Close discount notification"
          onClick={
            onClose
          }
          className="
            absolute

            right-4
            top-4

            z-20

            grid

            h-9
            w-9

            place-items-center

            rounded-full

            border
            border-black/[0.08]

            bg-white

            text-[20px]
            leading-none

            text-black/45

            shadow-sm

            transition

            hover:border-[#A90D3B]/20
            hover:bg-[#FFF4F7]
            hover:text-[#A90D3B]
          "
        >
          ×
        </button>

        {/* =================================================
            BURST DECORATION
        ================================================= */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none

            absolute
            left-1/2
            top-[64px]

            h-[130px]
            w-[130px]

            -translate-x-1/2
          "
        >
          <span
            className="
              absolute

              left-1/2
              top-0

              h-3
              w-1

              -translate-x-1/2

              rounded-full

              bg-[#A90D3B]/35
            "
          />

          <span
            className="
              absolute

              bottom-0
              left-1/2

              h-3
              w-1

              -translate-x-1/2

              rounded-full

              bg-[#A90D3B]/25
            "
          />

          <span
            className="
              left-0
              top-1/2

              absolute

              h-1
              w-3

              -translate-y-1/2

              rounded-full

              bg-[#A90D3B]/30
            "
          />

          <span
            className="
              absolute

              right-0
              top-1/2

              h-1
              w-3

              -translate-y-1/2

              rounded-full

              bg-[#A90D3B]/30
            "
          />

          <span
            className="
              absolute

              left-[17px]
              top-[16px]

              h-2
              w-2

              rotate-45

              rounded-[2px]

              bg-[#E4A6B8]
            "
          />

          <span
            className="
              absolute

              right-[17px]
              top-[18px]

              h-2
              w-2

              rotate-45

              rounded-[2px]

              bg-[#A90D3B]/45
            "
          />

          <span
            className="
              absolute

              bottom-[18px]
              left-[20px]

              h-2
              w-2

              rounded-full

              bg-[#A90D3B]/25
            "
          />

          <span
            className="
              absolute

              bottom-[16px]
              right-[20px]

              h-2
              w-2

              rounded-full

              bg-[#E4A6B8]
            "
          />
        </div>

        {/* =================================================
            POPUP CONTENT
        ================================================= */}

        <div
          className="
            relative

            px-6
            pb-7
            pt-8

            text-center

            sm:px-9
            sm:pb-9
            sm:pt-9
          "
        >
          <div
            ref={
              iconRef
            }
            className="
              relative
              z-10

              mx-auto

              grid

              h-16
              w-16

              place-items-center

              rounded-full

              bg-[#A90D3B]

              text-[22px]
              font-black

              text-white

              shadow-[0_12px_30px_rgba(169,13,59,.30)]
            "
          >
            %
          </div>

          <p
            className="
              relative
              z-10

              mt-5

              text-[10px]
              font-bold

              uppercase

              tracking-[0.18em]

              text-[#A90D3B]
            "
          >
            Thanks For Your Review
          </p>

          <h3
            className="
              relative
              z-10

              mt-2

              text-[22px]
              font-semibold

              leading-tight

              text-[#211A18]

              sm:text-[25px]
            "
          >
            Your next-order code is{" "}

            <span
              className="
                text-[#A90D3B]
              "
            >
              {
                code.code
              }
            </span>
          </h3>

          <p
            className="
              relative
              z-10

              mx-auto
              mt-3

              max-w-[360px]

              text-[12px]

              leading-6

              text-black/60

              sm:text-[13px]
            "
          >
            {discountCodeMessage(
              code
            )}
          </p>

          {code.endsAt ? (
            <p
              className="
                relative
                z-10

                mt-1.5

                text-[9px]

                text-black/35
              "
            >
              Valid till{" "}

              {formatDate(
                code.endsAt
              )}
            </p>
          ) : null}

          <div
            className="
              relative
              z-10

              mt-6

              flex
              flex-col

              items-center
              justify-center

              gap-2

              sm:flex-row
            "
          >
            <button
              type="button"
              onClick={() => {
                void copyCode();
              }}
              className="
                inline-flex

                h-11

                min-w-[138px]

                items-center
                justify-center

                rounded-[10px]

                bg-[#A90D3B]

                px-5

                text-[10px]
                font-bold

                uppercase

                tracking-[0.08em]

                text-white

                transition

                hover:bg-[#86102F]
              "
            >
              {copied
                ? "Copied"
                : "Copy Code"}
            </button>

            <span
              className="
                text-[9px]

                text-black/35
              "
            >
              Auto closes in 8 sec
            </span>
          </div>
        </div>

        <div
          className="
            h-[4px]
            w-full
            bg-[#A90D3B]
          "
        />
      </div>
    </div>
  );
}

/* =========================================================
   WHATSAPP ICON
========================================================= */

function WhatsAppIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.52 3.48A11.78 11.78 0 0 0 12.08 0C5.54 0 .22 5.32.22 11.86c0 2.09.55 4.13 1.6 5.93L.12 24l6.36-1.67a11.85 11.85 0 0 0 5.6 1.43h.01c6.54 0 11.86-5.32 11.86-11.86 0-3.17-1.22-6.15-3.43-8.42ZM12.09 21.75h-.01a9.81 9.81 0 0 1-5-1.37l-.36-.21-3.77.99 1.01-3.68-.24-.38a9.8 9.8 0 0 1-1.5-5.24c0-5.44 4.43-9.87 9.88-9.87 2.64 0 5.12 1.03 6.98 2.92A9.8 9.8 0 0 1 21.96 11.9c0 5.44-4.43 9.86-9.87 9.86Zm5.42-7.39c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.22 3.07.15.2 2.1 3.21 5.09 4.5.71.31 1.27.49 1.7.63.71.23 1.36.19 1.87.12.57-.08 1.76-.72 2.01-1.41.25-.69.25-1.28.17-1.41-.08-.12-.27-.2-.57-.35Z" />
    </svg>
  );
}

/* =========================================================
   ORDER ITEM REVIEW

   Each ordered product gets its own rating area.

   Flow:
   - stars stay visible on the order item row
   - "Add Images & Comment" expands the review form
   - POST /api/reviews uses THIS orderId + THIS productId
   - backend verifies this account actually purchased the product
   - product page automatically receives the review from
     GET /api/reviews/product/:productId
========================================================= */

type MyOrderReview = {
  _id:
    string;

  productId:
    unknown;

  orderId:
    unknown;

  rating:
    number;

  comment?:
    string;
};

type MyReviewsResponse = {
  success?:
    boolean;

  reviews?:
    MyOrderReview[];
};

function reviewEntityId(
  value:
    unknown
) {
  if (
    typeof value ===
    "string"
  ) {
    return value;
  }

  if (
    value &&
    typeof value ===
      "object"
  ) {
    const object =
      value as Record<
        string,
        unknown
      >;

    return String(
      object._id ||
        object.id ||
        ""
    );
  }

  return "";
}

/* =========================================================
   ORDER ITEM REVIEW
========================================================= */

function OrderItemReview({
  orderId,
  productId,
  productName,
  existingReview,
  onReviewSubmitted,
}: {
  orderId: string;
  productId?: string;
  productName: string;

  existingReview?:
    MyOrderReview;

  onReviewSubmitted?:
    () =>
      | void
      | Promise<void>;
}) {
  const [
    rating,
    setRating,
  ] =
    useState(
      0
    );

  const [
    open,
    setOpen,
  ] =
    useState(
      false
    );

  const [
    comment,
    setComment,
  ] =
    useState(
      ""
    );

  const [
    files,
    setFiles,
  ] =
    useState<
      File[]
    >(
      []
    );

  const [
    submitting,
    setSubmitting,
  ] =
    useState(
      false
    );

  const [
    submitted,
    setSubmitted,
  ] =
    useState(
      false
    );

  const [
    message,
    setMessage,
  ] =
    useState<{
      type:
        | "success"
        | "error";

      text:
        string;
    } | null>(
      null
    );

  useEffect(() => {
    if (
      !existingReview
    ) {
      return;
    }

    setRating(
      Math.max(
        1,
        Math.min(
          5,
          Number(
            existingReview.rating ||
              1
          )
        )
      )
    );

    setComment(
      String(
        existingReview.comment ||
          ""
      )
    );

    setSubmitted(
      true
    );

    setOpen(
      false
    );

    setMessage({
      type:
        "success",

      text:
        "You already reviewed this product from this order.",
    });
  }, [
    existingReview?._id,
    existingReview?.rating,
    existingReview?.comment,
  ]);

  if (
    !productId
  ) {
    return null;
  }

  function handleFiles(
    fileList:
      FileList | null
  ) {
    if (
      !fileList
    ) {
      return;
    }

    const selected =
      Array.from(
        fileList
      );

    const images =
      selected.filter(
        (
          file
        ) =>
          file.type.startsWith(
            "image/"
          )
      );

    if (
      images.length >
      5
    ) {
      setMessage({
        type:
          "error",

        text:
          "Maximum 5 images are allowed.",
      });

      return;
    }

    const tooLarge =
      images.find(
        (
          file
        ) =>
          file.size >
          25 *
            1024 *
            1024
      );

    if (
      tooLarge
    ) {
      setMessage({
        type:
          "error",

        text:
          `${tooLarge.name} is larger than 25 MB.`,
      });

      return;
    }

    setFiles(
      images
    );

    setMessage(
      null
    );
  }

  async function submitReview() {
    if (
      submitted ||
      submitting
    ) {
      return;
    }

    const reviewProductId =
      String(
        productId ||
          ""
      ).trim();

    if (
      !reviewProductId
    ) {
      setMessage({
        type:
          "error",

        text:
          "Product information is unavailable for this review.",
      });

      return;
    }

    if (
      rating <
      1
    ) {
      setMessage({
        type:
          "error",

        text:
          "Please select a star rating.",
      });

      return;
    }

    if (
      !comment.trim()
    ) {
      setMessage({
        type:
          "error",

        text:
          "Please write a comment.",
      });

      return;
    }

    try {
      setSubmitting(
        true
      );

      setMessage(
        null
      );

      await createProductReview({
        productId:
          reviewProductId,

        orderId,

        rating,

        comment:
          comment.trim(),

        files,
      });

      setSubmitted(
        true
      );

      setOpen(
        false
      );

      setFiles(
        []
      );

      setMessage({
        type:
          "success",

        text:
          "Review submitted. It is now available on this product page.",
      });

      /*
       * Review submit hone ke BAAD hi active discount
       * code fetch karke top-right notification dikhayenge.
       *
       * Discount fetch fail ho to review success ko fail
       * nahi karna.
       */
      try {
        await onReviewSubmitted?.();
      } catch (
        notificationError
      ) {
        console.error(
          "POST-REVIEW DISCOUNT NOTIFICATION ERROR:",
          notificationError
        );
      }
    } catch (
      error
    ) {
      const text =
        error instanceof
        Error
          ? error.message
          : "Unable to submit review.";

      if (
        /already reviewed/i.test(
          text
        )
      ) {
        setSubmitted(
          true
        );

        setOpen(
          false
        );
      }

      setMessage({
        type:
          /already reviewed/i.test(
            text
          )
            ? "success"
            : "error",

        text,
      });
    } finally {
      setSubmitting(
        false
      );
    }
  }

  return (
    <div
      className="
        w-full
        min-w-0
      "
    >
      {/* STARS - ALWAYS VISIBLE */}

      <div
        className="
          flex
          flex-wrap
          items-center
          gap-1
        "
      >
        {[
          1,
          2,
          3,
          4,
          5,
        ].map(
          (
            star
          ) => (
            <button
              key={
                star
              }
              type="button"
              disabled={
                submitted
              }
              aria-label={`Rate ${star} star${star === 1 ? "" : "s"}`}
              onClick={() => {
                setRating(
                  star
                );

                setMessage(
                  null
                );
              }}
              className="
                grid
                h-8
                w-8
                place-items-center

                rounded-full

                text-[22px]

                leading-none

                transition

                hover:scale-110

                disabled:cursor-default
              "
              style={{
                color:
                  star <=
                  rating
                    ? "#B31345"
                    : "#D8D2CF",
              }}
            >
              ★
            </button>
          )
        )}

        {submitted ? (
          <span
            className="
              ml-1
              rounded-full

              bg-[#EAF7EF]

              px-2.5
              py-1

              text-[8px]
              font-bold

              uppercase

              tracking-[0.07em]

              text-[#176337]
            "
          >
            Reviewed
          </span>
        ) : null}
      </div>

      {!submitted ? (
        <button
          type="button"
          onClick={() => {
            setOpen(
              (
                current
              ) =>
                !current
            );

            setMessage(
              null
            );
          }}
          className="
            mt-1.5

            inline-flex

            min-h-8

            items-center

            gap-1.5

            rounded-[7px]

            border
            border-[#E3D5D7]

            bg-[#FFF8FA]

            px-3

            text-[9px]
            font-bold

            text-[#A90D3B]

            transition

            hover:border-[#C88798]
            hover:bg-[#FFF1F5]
          "
        >
          Add Images & Comment

          {open ? (
            <ChevronUp
              size={
                13
              }
            />
          ) : (
            <ChevronDown
              size={
                13
              }
            />
          )}
        </button>
      ) : null}

      {open &&
      !submitted ? (
        <div
          className="
            mt-2

            rounded-[10px]

            border
            border-[#E9DDDA]

            bg-[#FFFDFC]

            p-3

            shadow-[0_8px_24px_rgba(72,45,40,.06)]
          "
        >
          <p
            className="
              text-[9px]
              font-bold

              uppercase

              tracking-[0.06em]

              text-[#302927]
            "
          >
            Review {productName}
          </p>

          <textarea
            value={
              comment
            }
            maxLength={
              4000
            }
            onChange={(
              event
            ) => {
              setComment(
                event.target.value
              );

              setMessage(
                null
              );
            }}
            placeholder="Write your comment..."
            className="
              mt-2

              min-h-[82px]
              w-full

              resize-y

              rounded-[8px]

              border
              border-[#DED2CE]

              bg-white

              p-2.5

              text-[10px]

              leading-5

              text-[#211A18]

              outline-none

              focus:border-[#A90D3B]
            "
          />

          <div
            className="
              mt-2

              flex
              flex-wrap

              items-center

              gap-2
            "
          >
            <label
              className="
                inline-flex

                min-h-9

                cursor-pointer

                items-center
                justify-center

                rounded-[7px]

                border
                border-[#DCCFCC]

                bg-white

                px-3

                text-[9px]
                font-bold

                text-[#211A18]

                transition

                hover:border-[#A90D3B]
                hover:text-[#A90D3B]
              "
            >
              + Add Images

              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="hidden"
                onChange={(
                  event
                ) =>
                  handleFiles(
                    event.target.files
                  )
                }
              />
            </label>

            {files.length >
            0 ? (
              <span
                className="
                  text-[9px]

                  font-semibold

                  text-black/50
                "
              >
                {files.length} image
                {files.length ===
                1
                  ? ""
                  : "s"} selected
              </span>
            ) : null}
          </div>

          {files.length >
          0 ? (
            <div
              className="
                mt-2

                flex
                gap-2

                overflow-x-auto

                pb-1

                [scrollbar-width:none]

                [&::-webkit-scrollbar]:hidden
              "
            >
              {files.map(
                (
                  file,
                  index
                ) => (
                  <div
                    key={`${file.name}-${file.size}-${index}`}
                    className="
                      max-w-[110px]

                      shrink-0

                      truncate

                      rounded-[6px]

                      bg-[#F7F2F0]

                      px-2
                      py-1.5

                      text-[8px]

                      text-black/55
                    "
                    title={
                      file.name
                    }
                  >
                    {
                      file.name
                    }
                  </div>
                )
              )}
            </div>
          ) : null}

          {message ? (
            <div
              className={`
                mt-2

                rounded-[7px]

                px-2.5
                py-2

                text-[9px]

                leading-4

                ${
                  message.type ===
                  "success"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }
              `}
            >
              {
                message.text
              }
            </div>
          ) : null}

          <div
            className="
              mt-3

              flex

              justify-end

              gap-2
            "
          >
            <button
              type="button"
              disabled={
                submitting
              }
              onClick={() =>
                setOpen(
                  false
                )
              }
              className="
                h-9

                rounded-[7px]

                border
                border-[#DCCFCC]

                bg-white

                px-3

                text-[9px]
                font-bold

                text-[#332D2B]

                disabled:opacity-50
              "
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={
                submitting
              }
              onClick={() => {
                void submitReview();
              }}
              className="
                h-9

                rounded-[7px]

                bg-[#A90D3B]

                px-4

                text-[9px]
                font-bold

                uppercase

                tracking-[0.06em]

                text-white

                transition

                hover:bg-[#86102F]

                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {submitting
                ? "Submitting..."
                : "Submit Review"}
            </button>
          </div>
        </div>
      ) : null}

      {!open &&
      message ? (
        <div
          className={`
            mt-2

            rounded-[7px]

            px-2.5
            py-2

            text-[9px]

            leading-4

            ${
              message.type ===
              "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }
          `}
        >
          {
            message.text
          }
        </div>
      ) : null}
    </div>
  );
}

/* =========================================================

   PRICE BREAKDOWN

========================================================= */

function OrderPriceBreakdown({

  order,

}: {

  order: Order;

}) {

  const automaticDiscount =

    Number(

      order.automaticDiscount ||

        0,

    );

  const codeDiscount =

    Number(

      order.codeDiscount ||

        0,

    );

  const fallbackDiscount =

    Number(

      order.discount ||

        0,

    );

  const knownDiscount =

    automaticDiscount +

    codeDiscount;

  const otherDiscount =

    Math.max(

      0,

      fallbackDiscount -

        knownDiscount,

    );

  return (

    <div

      className="

        border-t

        border-[#EEE5E1]

        bg-[#FFFDFC]

        px-4

        py-4

        sm:px-5

      "

    >

      <div

        className="

          mx-auto

          max-w-[520px]

          sm:ml-auto

          sm:mr-0

        "

      >

        <div

          className="

            mb-3

            text-[11px]

            font-bold

            uppercase

            tracking-[0.08em]

            text-[#211A18]

          "

        >

          Price Details

        </div>

        <div

          className="

            space-y-3

            text-[12px]

          "

        >

          <PriceRow

            label="Items Subtotal"

            value={formatPrice(

              order.subtotal,

            )}

          />

          {automaticDiscount >

            0 && (

            <PriceRow

              label="Automatic Discount"

              value={`- ${formatPrice(

                automaticDiscount,

              )}`}

              discount

            />

          )}

          {codeDiscount >

            0 && (

            <PriceRow

              label={

                order.discountCode

                  ? `Coupon (${order.discountCode})`

                  : "Coupon Discount"

              }

              value={`- ${formatPrice(

                codeDiscount,

              )}`}

              discount

            />

          )}

          {otherDiscount >

            0 && (

            <PriceRow

              label="Other Discount"

              value={`- ${formatPrice(

                otherDiscount,

              )}`}

              discount

            />

          )}

          <PriceRow

            label={

              order.taxPercentage

                ? `${order.taxName || "Tax"} (${order.taxPercentage}%)`

                : order.taxName ||

                  "Tax"

            }

            value={`+ ${formatPrice(

              order.tax || 0,

            )}`}

          />

          <PriceRow

            label="Delivery Charge"

            value={

              Number(

                order.shipping ||

                  0,

              ) > 0

                ? `+ ${formatPrice(

                    order.shipping,

                  )}`

                : "FREE"

            }

          />

          <div

            className="

              border-t

              border-dashed

              border-[#DCCFCC]

              pt-3

            "

          >

            <PriceRow

              label="Total Paid / Payable"

              value={formatPrice(

                order.total,

              )}

              total

            />

          </div>

        </div>

      </div>

    </div>

  );

}

function PriceRow({

  label,

  value,

  discount = false,

  total = false,

}: {

  label: string;

  value: string;

  discount?: boolean;

  total?: boolean;

}) {

  return (

    <div

      className="

        flex

        items-center

        justify-between

        gap-6

      "

    >

      <span

        className={

          total

            ? "font-bold text-[#171313]"

            : "font-medium text-[#332D2B]"

        }

      >

        {label}

      </span>

      <span

        className={[

          "shrink-0 text-right",

          total

            ? "font-serif text-[18px] font-semibold text-[#111111]"

            : discount

              ? "font-semibold text-[#15803D]"

              : "font-semibold text-[#171313]",

        ].join(" ")}

      >

        {value}

      </span>

    </div>

  );

}

/* =========================================================

   PAGE

========================================================= */

export default function OrdersPage() {

  const [

    orders,

    setOrders,

  ] =

    useState<Order[]>(

      [],

    );

  const [

    loading,

    setLoading,

  ] = useState(true);

  const [

    error,

    setError,

  ] = useState("");

  const [

    expandedOrderId,

    setExpandedOrderId,

  ] =

    useState<string>("");

  const [
    myReviews,
    setMyReviews,
  ] =
    useState<
      MyOrderReview[]
    >([]);

  const loadMyReviews =
    useCallback(
      async () => {
        try {
          const response =
            await apiFetch<MyReviewsResponse>(
              "/api/reviews/my-reviews",
              {
                method:
                  "GET",
              }
            );

          setMyReviews(
            Array.isArray(
              response.reviews
            )
              ? response.reviews
              : []
          );
        } catch (
          reviewLoadError
        ) {
          console.error(
            "LOAD MY REVIEWS ERROR:",
            reviewLoadError
          );

          setMyReviews(
            []
          );
        }
      },
      []
    );

  const [
    activeDiscountToast,
    setActiveDiscountToast,
  ] =
    useState<
      DiscountToastItem | null
    >(
      null
    );

  /* =======================================================
     SHOW DISCOUNT ONLY AFTER REVIEW SUBMISSION

     Flow:
     Review submitted
       -> GET /api/discounts/active
       -> latest active code
       -> top-right temporary toast
  ======================================================= */

  const showDiscountAfterReview =
    useCallback(
      async () => {
        try {
          const response =
            await apiFetch<ActiveDiscountCodesResponse>(
              "/api/discounts/active",
              {
                method:
                  "GET",
              }
            );

          const codes =
            Array.isArray(
              response.codes
            )
              ? response.codes
              : [];

          const latestCode =
            codes[0];

          if (
            !latestCode
          ) {
            return;
          }

          setActiveDiscountToast({
            signature:
              getDiscountSignature(
                latestCode
              ),

            code:
              latestCode,
          });
        } catch (
          loadError
        ) {
          console.error(
            "LOAD POST-REVIEW DISCOUNT CODE ERROR:",
            loadError
          );
        }
      },
      []
    );

  const loadOrders =

    useCallback(

      async () => {

        try {

          setLoading(true);

          setError("");

          const rows =

            await getMyOrders();

          const visibleOrders =

            rows.filter(

              (

                order,

              ) => {

                const paymentMethod =

                  String(

                    order.paymentMethod ||

                      "",

                  )

                    .trim()

                    .toLowerCase();

                const paymentStatus =

                  String(

                    order.paymentStatus ||

                      "",

                  )

                    .trim()

                    .toLowerCase();

                const isOnlinePayment =

                  paymentMethod ===

                    "razorpay" ||

                  paymentMethod ===

                    "online";

                if (

                  !isOnlinePayment

                ) {

                  return true;

                }

                return (

                  paymentStatus ===

                  "paid"

                );

              },

            );

          const uniqueOrders =

            Array.from(

              new Map(

                visibleOrders.map(

                  (

                    order,

                  ) => [

                    order.id ||

                      order.orderNumber,

                    order,

                  ],

                ),

              ).values(),

            );

          uniqueOrders.sort(

            (a, b) => {

              const aTime =

                new Date(

                  a.createdAt ||

                    0,

                ).getTime();

              const bTime =

                new Date(

                  b.createdAt ||

                    0,

                ).getTime();

              return (

                bTime -

                aTime

              );

            },

          );

          setOrders(

            uniqueOrders,

          );

        } catch (

          loadError

        ) {

          console.error(

            "LOAD ORDERS ERROR:",

            loadError,

          );

          setError(

            loadError instanceof Error

              ? loadError.message

              : "Unable to load your orders.",

          );

        } finally {

          setLoading(false);

        }

      },

      [],

    );

  useEffect(() => {

    void loadOrders();

  }, [loadOrders]);

  useEffect(() => {
    void loadMyReviews();
  }, [
    loadMyReviews,
  ]);

  /* =======================================================
     AUTO HIDE AFTER 8 SECONDS
  ======================================================= */

  useEffect(() => {
    if (
      !activeDiscountToast
    ) {
      return;
    }

    const timer =
      window.setTimeout(
        () => {
          setActiveDiscountToast(
            null
          );
        },
        8000
      );

    return () => {
      window.clearTimeout(
        timer
      );
    };
  }, [
    activeDiscountToast,
  ]);

  const totalOrders =

    orders.length;

  const totalSpend =

    useMemo(() => {

      return orders

        .filter(

          (order) => {

            const status =

              normalizeStatus(

                order.status,

              );

            return ![

              "cancelled",

              "canceled",

              "refunded",

            ].includes(

              status,

            );

          },

        )

        .reduce(

          (

            sum,

            order,

          ) =>

            sum +

            Number(

              order.total ||

                0,

            ),

          0,

        );

    }, [orders]);

  const averageOrder =

    totalOrders > 0

      ? totalSpend /

        totalOrders

      : 0;


  return (

    <>

      <Header />

      <div

        className="

          min-h-screen

          bg-[#FDFCFB]

        "

      >

        <div

          className="

            mx-auto

            flex

            w-full

            max-w-[1600px]

            flex-col

            lg:flex-row

            lg:items-start

          "

        >

          <AccountSidebar />

          <main

            className="

              min-w-0

              w-full

              max-w-full

              flex-1

              overflow-x-hidden

              px-3

              pb-8

              pt-4

              sm:px-5

              lg:px-7

              lg:pb-12

            "

          >

            <div

              className="

                grid

                min-w-0

                grid-cols-1

                gap-[18px]

                xl:grid-cols-[minmax(0,1.7fr)_minmax(330px,1fr)]

              "

            >

              <section

                className="

                  relative

                  min-h-[150px]

                  overflow-hidden

                  rounded-[12px]

                  px-5

                  py-6

                  sm:min-h-[165px]

                  sm:px-[30px]

                "

                style={{

                  background: `

                    radial-gradient(circle at 84% 28%, rgba(255,255,255,.90) 0 7%, rgba(255,255,255,0) 22%),

                    radial-gradient(circle at 94% 80%, rgba(223,154,165,.22) 0 7%, rgba(223,154,165,0) 20%),

                    linear-gradient(90deg, #FAEDEB 0%, #FBEFED 54%, #F7E4E5 100%)

                  `,

                }}

              >

                <div

                  className="

                    text-[10px]

                    font-semibold

                    tracking-[0.5px]

                    text-[#282221]

                  "

                >

                  MY ACCOUNT &gt; Orders

                </div>

                <h1

                  className="

                    mt-[14px]

                    font-serif

                    text-[37px]

                    font-normal

                    leading-none

                    text-[#171313]

                    sm:text-[44px]

                  "

                >

                  My Orders

                </h1>

                <p

                  className="

                    mt-3

                    max-w-[430px]

                    text-[12px]

                    font-medium

                    leading-[1.55]

                    text-[#332E2C]

                  "

                >

                  Track, manage and

                  relive your favorite

                  finds. Your shopping

                  journey will appear

                  here.

                </p>

                <div

                  className="

                    absolute

                    right-[18%]

                    top-[31px]

                    hidden

                    rotate-[-7deg]

                    font-['Segoe_Print','Comic_Sans_MS',cursive]

                    text-[18px]

                    leading-[1.12]

                    text-[#A64055]

                    2xl:block

                  "

                >

                  Good

                  <br />

                  Things

                  <br />

                  Take

                  <br />

                  Style ♡

                </div>

              </section>

              <section

                className="

                  min-h-[165px]

                  rounded-[12px]

                  border

                  border-[#E7DEDA]

                  bg-white

                  p-4

                  sm:p-5

                "

              >

                <div

                  className="

                    flex

                    flex-wrap

                    items-center

                    justify-between

                    gap-3

                  "

                >

                  <div

                    className="

                      flex

                      min-w-0

                      items-center

                      gap-[13px]

                    "

                  >

                    <div

                      className="

                        grid

                        h-12

                        w-12

                        shrink-0

                        place-items-center

                        rounded-full

                        bg-[#FCEAEA]

                        text-[#AD2348]

                      "

                    >

                      <Package

                        size={23}

                        strokeWidth={

                          1.5

                        }

                      />

                    </div>

                    <span

                      className="

                        whitespace-nowrap

                        font-serif

                        text-[17px]

                        font-medium

                        text-[#171313]

                      "

                    >

                      Order Summary

                    </span>

                  </div>

                  <span

                    className="

                      whitespace-nowrap

                      rounded-[8px]

                      bg-[#F7F2F0]

                      px-[13px]

                      py-2

                      text-[9px]

                      font-semibold

                      text-[#211B19]

                    "

                  >

                    {loading

                      ? "Loading..."

                      : `${totalOrders} Order${

                          totalOrders ===

                          1

                            ? ""

                            : "s"

                        }`}

                  </span>

                </div>

                <div

                  className="

                    mt-[22px]

                    grid

                    grid-cols-3

                  "

                >

                  <SummaryStat

                    value={String(

                      totalOrders,

                    )}

                    label="Total Orders"

                  />

                  <SummaryStat

                    value={formatPrice(

                      totalSpend,

                    )}

                    label="Total Spend"

                    bordered

                  />

                  <SummaryStat

                    value={formatPrice(

                      averageOrder,

                    )}

                    label="Average Order"

                  />

                </div>

              </section>

            </div>

            <DiscountCodeToast
              item={
                activeDiscountToast
              }
              onClose={() => {
                setActiveDiscountToast(
                  null
                );
              }}
            />

            {loading && (

              <div

                className="

                  mt-[18px]

                  flex

                  min-h-[180px]

                  items-center

                  justify-center

                  rounded-[12px]

                  border

                  border-[#E9DFDB]

                  bg-white

                  text-center

                  text-[#171313]

                "

              >

                <div>

                  <Package

                    className="

                      mx-auto

                    "

                    size={30}

                  />

                  <p

                    className="

                      mt-3

                      text-[13px]

                      font-semibold

                    "

                  >

                    Loading your

                    orders...

                  </p>

                </div>

              </div>

            )}

            {!loading &&

              error && (

              <div

                className="

                  mt-[18px]

                  flex

                  min-h-[180px]

                  items-center

                  justify-center

                  rounded-[12px]

                  border

                  border-[#E9DFDB]

                  bg-white

                  px-5

                  text-center

                "

              >

                <div>

                  <AlertCircle

                    className="

                      mx-auto

                    "

                    size={30}

                  />

                  <p

                    className="

                      mt-3

                      text-[13px]

                      font-semibold

                      text-[#171313]

                    "

                  >

                    {error}

                  </p>

                  <button

                    type="button"

                    onClick={() =>

                      void loadOrders()

                    }

                    className="

                      mt-4

                      inline-flex

                      h-10

                      items-center

                      gap-2

                      rounded-[7px]

                      border

                      border-[#DCCFCC]

                      bg-white

                      px-4

                      text-[11px]

                      font-bold

                      text-[#171313]

                    "

                  >

                    <RefreshCcw

                      size={14}

                    />

                    Try Again

                  </button>

                </div>

              </div>

            )}

            {!loading &&

              !error &&

              orders.length >

                0 && (

              <section

                className="

                  mt-[18px]

                  grid

                  min-w-0

                  gap-[14px]

                "

              >

                {orders.map(

                  (order) => {

                    const theme =

                      getStatusTheme(

                        order.status,

                      );

                    const pendingCancellation =

                      hasCancellationRequest(

                        order,

                      );

                    const cancelled =

                      [

                        "cancelled",

                        "canceled",

                      ].includes(

                        normalizeStatus(

                          order.status,

                        ),

                      );

                    const expanded =

                      expandedOrderId ===

                      order.id;

                    const deliveryAddress =

                      getAddress(

                        order,

                      );

                    return (

                      <article

                        key={

                          order.id

                        }

                        className="

                          min-w-0

                          overflow-hidden

                          rounded-[12px]

                          border

                          border-[#E9DFDB]

                          bg-white

                          shadow-[0_8px_30px_rgba(72,45,40,0.035)]

                        "

                      >

                        <div

                          className="

                            flex

                            flex-col

                            justify-between

                            gap-4

                            border-b

                            border-[#EEE5E1]

                            bg-gradient-to-r

                            from-[#FFF9F8]

                            to-[#FFFDFD]

                            px-4

                            py-4

                            sm:px-5

                            md:flex-row

                            md:items-center

                          "

                        >

                          <div

                            className="

                              grid

                              grid-cols-2

                              gap-x-6

                              gap-y-3

                              sm:grid-cols-3

                              sm:gap-x-9

                            "

                          >

                            <OrderMeta

                              label="Order Number"

                              value={`#${order.orderNumber}`}

                            />

                            <OrderMeta

                              label="Order Date"

                              value={formatDate(

                                order.createdAt,

                              )}

                            />

                            <OrderMeta

                              label="Payment"

                              value={formatPaymentMethod(

                                order.paymentMethod,

                              )}

                            />

                          </div>

                          <div

                            className="

                              flex

                              flex-col

                              items-start

                              gap-2

                              md:items-end

                            "

                          >

                            <span

                              className="

                                inline-flex

                                items-center

                                gap-1.5

                                rounded-full

                                border

                                px-3

                                py-[7px]

                                text-[9px]

                                font-bold

                              "

                              style={{

                                background:

                                  theme.bg,

                                borderColor:

                                  theme.border,

                                color:

                                  theme.color,

                              }}

                            >

                              {cancelled ? (

                                <XCircle

                                  size={13}

                                />

                              ) : normalizeStatus(

                                  order.status,

                                ) ===

                                "delivered" ? (

                                <CheckCircle2

                                  size={13}

                                />

                              ) : (

                                <Clock3

                                  size={13}

                                />

                              )}

                              {formatStatus(

                                order.status,

                              )}

                            </span>

                            {pendingCancellation &&

                              !cancelled && (

                                <span

                                  className="

                                    inline-flex

                                    items-center

                                    gap-1.5

                                    text-[10px]

                                    font-bold

                                    text-[#8D1836]

                                  "

                                >

                                  <Clock3

                                    size={13}

                                  />

                                  Your order is

                                  waiting to be

                                  cancelled

                                </span>

                              )}

                          </div>

                        </div>

                        <div

                          className="

                            px-4

                            sm:px-5

                          "

                        >

                          {order.items.map(

                            (item) => (

                              <div

                                key={

                                  item.id

                                }

                                className="
                                    grid
                                    min-w-0
                                    grid-cols-[72px_minmax(0,1fr)]
                                    items-center
                                    gap-3
                                    border-b
                                    border-[#F0E9E6]
                                    py-4

                                    sm:grid-cols-[92px_minmax(0,1fr)_auto]
                                    sm:gap-4

                                    lg:grid-cols-[92px_minmax(0,1fr)_minmax(250px,320px)_auto]
                                  "

                              >

                                {item.image ? (

                                  <img

                                    src={

                                      item.image

                                    }

                                    alt={

                                      item.name

                                    }

                                    className="
                                      order-1

                                      h-[88px]

                                      w-[72px]

                                      rounded-[10px]

                                      border

                                      border-[#EEE4E0]

                                      object-cover

                                      sm:h-[108px]

                                      sm:w-[92px]

                                    "

                                  />

                                ) : (

                                  <div

                                    className="
                                      order-1

                                      grid

                                      h-[88px]

                                      w-[72px]

                                      place-items-center

                                      rounded-[10px]

                                      border

                                      border-[#EEE4E0]

                                      bg-[#F8F4F2]

                                      text-[#A31A40]

                                      sm:h-[108px]

                                      sm:w-[92px]

                                    "

                                  >

                                    <Package

                                      size={30}

                                    />

                                  </div>

                                )}

                                <div
                                  className="
                                    order-2
                                    min-w-0
                                  "
                                >
                                  <h3

                                    className="

                                      break-words

                                      font-serif

                                      text-[14px]

                                      font-medium

                                      leading-[1.35]

                                      text-[#171313]

                                      sm:text-[16px]

                                    "

                                  >

                                    {item.name}

                                  </h3>

                                  <p

                                    className="

                                      mt-1.5

                                      break-words

                                      text-[11px]

                                      font-medium

                                      leading-[1.55]

                                      text-[#393230]

                                    "

                                  >

                                    {item.color &&

                                      `Color: ${item.color}`}

                                    {item.color &&

                                      item.size &&

                                      " • "}

                                    {item.size &&

                                      `Size: ${item.size}`}

                                  </p>

                                  <p

                                    className="

                                      mt-1

                                      text-[11px]

                                      font-medium

                                      text-[#393230]

                                    "

                                  >

                                    Quantity:{" "}

                                    {

                                      item.quantity

                                    }

                                  </p>

                                  <div

                                    className="

                                      mt-2

                                      font-serif

                                      text-[14px]

                                      font-semibold

                                      text-[#171313]

                                      sm:hidden

                                    "

                                  >

                                    {formatPrice(

                                      item.finalTotal ??

                                        item.subtotal,

                                    )}

                                  </div>

                                </div>

                                <div
                                  className="
                                    order-3
                                    col-span-2
                                    min-w-0

                                    sm:order-4
                                    sm:col-span-3

                                    lg:order-3
                                    lg:col-span-1
                                  "
                                >
                                  <OrderItemReview
                                    orderId={
                                      order.id
                                    }
                                    productId={
                                      item.productId
                                    }
                                    productName={
                                      item.name
                                    }
                                    existingReview={
                                      myReviews.find(
                                        (
                                          review
                                        ) =>
                                          reviewEntityId(
                                            review.orderId
                                          ) ===
                                            order.id &&
                                          reviewEntityId(
                                            review.productId
                                          ) ===
                                            String(
                                              item.productId ||
                                                ""
                                            )
                                      )
                                    }
                                    onReviewSubmitted={
                                      showDiscountAfterReview
                                    }
                                  />
                                </div>

                                <div
                                  className="
                                    order-4
                                    hidden
                                    text-right
                                    font-serif
                                    text-[15px]
                                    font-semibold
                                    text-[#171313]

                                    sm:order-3
                                    sm:block

                                    lg:order-4
                                  "
                                >
                                  {formatPrice(
                                    item.finalTotal ??
                                      item.subtotal,
                                  )}
                                </div>

                              </div>

                            ),

                          )}

                        </div>

                        <button

                          type="button"

                          onClick={() =>

                            setExpandedOrderId(

                              expanded

                                ? ""

                                : order.id,

                            )

                          }

                          className="

                            flex

                            w-full

                            items-center

                            justify-between

                            gap-5

                            border-0

                            bg-white

                            px-4

                            py-[15px]

                            text-left

                            sm:px-5

                          "

                        >

                          <div>

                            <div

                              className="

                                text-[11px]

                                font-semibold

                                text-[#312B29]

                              "

                            >

                              Order Total

                            </div>

                            <div

                              className="

                                mt-1

                                inline-flex

                                items-center

                                gap-1

                                text-[10px]

                                font-semibold

                                text-[#A90D3B]

                              "

                            >

                              {expanded

                                ? "Hide Price Details"

                                : "View Price Details"}

                              {expanded ? (

                                <ChevronUp

                                  size={14}

                                />

                              ) : (

                                <ChevronDown

                                  size={14}

                                />

                              )}

                            </div>

                          </div>

                          <strong

                            className="

                              shrink-0

                              font-serif

                              text-[18px]

                              font-semibold

                              text-[#111111]

                              sm:text-[20px]

                            "

                          >

                            {formatPrice(

                              order.total,

                            )}

                          </strong>

                        </button>

                        {expanded && (

                          <OrderPriceBreakdown

                            order={order}

                          />

                        )}

                        <div

                          className="

                            grid

                            gap-4

                            border-t

                            border-[#EEE6E2]

                            bg-[#FFFCFB]

                            px-4

                            py-4

                            sm:px-5

                            lg:grid-cols-[minmax(0,1fr)_auto]

                            lg:items-center

                          "

                        >

                          <div

                            className="

                              flex

                              min-w-0

                              items-start

                              gap-2.5

                              break-words

                              text-[11px]

                              font-medium

                              leading-[1.55]

                              text-[#241F1D]

                            "

                          >

                            {deliveryAddress ? (

                              <>

                                <MapPin

                                  size={16}

                                  className="

                                    mt-0.5

                                    shrink-0

                                  "

                                />

                                <div

                                  className="

                                    min-w-0

                                    break-words

                                  "

                                >

                                  <strong

                                    className="

                                      mb-0.5

                                      block

                                      text-[#171313]

                                    "

                                  >

                                    Delivery

                                    Address

                                  </strong>

                                  {

                                    deliveryAddress

                                  }

                                </div>

                              </>

                            ) : (

                              <>

                                <CalendarDays

                                  size={16}

                                  className="

                                    shrink-0

                                  "

                                />

                                Ordered on{" "}

                                {formatDate(

                                  order.createdAt,

                                )}

                              </>

                            )}

                          </div>

                          <div

                            className="

                              flex

                              flex-wrap

                              gap-2

                              lg:justify-end

                            "

                          >

                            {order.invoiceNumber && (

                              <a

                                href={userInvoiceUrl(

                                  order.id,

                                )}

                                target="_blank"

                                rel="noreferrer"

                                className="

                                  inline-flex

                                  h-10

                                  items-center

                                  justify-center

                                  gap-2

                                  rounded-[7px]

                                  border

                                  border-[#DCCFCC]

                                  bg-white

                                  px-4

                                  text-[10px]

                                  font-bold

                                  text-[#1C1716]

                                  no-underline

                                "

                              >

                                <Download

                                  size={14}

                                />

                                Invoice

                              </a>

                            )}

                            <a
                              href={`https://wa.me/919420980536?text=${encodeURIComponent(
                                `Hi HivraSoft, I need help with order #${order.orderNumber}.`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`Chat on WhatsApp about order ${order.orderNumber}`}
                              className="
                                inline-flex
                                h-10
                                items-center
                                justify-center
                                gap-2
                                rounded-[7px]
                                border
                                border-[#BFE3CB]
                                bg-[#F1FFF6]
                                px-4
                                text-[10px]
                                font-bold
                                text-[#128C4A]
                                no-underline
                                transition
                                hover:border-[#25D366]
                                hover:bg-[#E9FFF1]
                              "
                            >
                              <WhatsAppIcon />

                              WhatsApp
                            </a>

                          </div>

                        </div>

                      </article>

                    );

                  },

                )}

              </section>

            )}

            {!loading &&

              !error &&

              orders.length ===

                0 && (

              <section

                className="

                  relative

                  mt-[18px]

                  flex

                  min-h-[430px]

                  items-center

                  justify-center

                  overflow-hidden

                  rounded-[12px]

                  border

                  border-[#E7DDDA]

                  bg-gradient-to-b

                  from-white

                  to-[#FFFCFB]

                  px-5

                  py-10

                "

              >

                <div

                  className="

                    relative

                    z-10

                    flex

                    w-full

                    max-w-[620px]

                    flex-col

                    items-center

                    text-center

                  "

                >

                  <div

                    className="

                      relative

                      mb-3

                      grid

                      h-[150px]

                      w-[180px]

                      place-items-center

                    "

                  >

                    <div

                      className="

                        absolute

                        h-[140px]

                        w-[140px]

                        rounded-full

                        bg-[#F8CACD]/30

                      "

                    />

                    <div

                      className="

                        relative

                        grid

                        h-[105px]

                        w-[115px]

                        place-items-center

                        rounded-[16px]

                        border

                        border-[#F0C6CA]

                        bg-gradient-to-br

                        from-[#F8D6D8]

                        to-[#EFAEB6]

                        text-[#A6163D]

                        shadow-lg

                      "

                    >

                      <Package

                        size={56}

                        strokeWidth={

                          1.25

                        }

                      />

                    </div>

                    <Heart

                      className="

                        absolute

                        left-0

                        top-4

                        text-[#D85B70]

                      "

                    />

                    <Sparkles

                      className="

                        absolute

                        right-0

                        top-0

                        text-[#D85B70]

                      "

                    />

                  </div>

                  <h2

                    className="

                      font-serif

                      text-[28px]

                      text-[#171313]

                      sm:text-[32px]

                    "

                  >

                    No orders yet

                  </h2>

                  <p

                    className="

                      mt-3

                      max-w-[430px]

                      text-[12px]

                      font-medium

                      leading-6

                      text-[#302A28]

                      sm:text-[13px]

                    "

                  >

                    You haven&apos;t

                    placed any orders

                    yet. Once you shop,

                    your ordered

                    products and

                    delivery status

                    will appear here.

                  </p>

                  <Link

                    href="/"

                    className="

                      mt-6

                      inline-flex

                      min-h-[46px]

                      items-center

                      justify-center

                      gap-2

                      rounded-[8px]

                      bg-[#A90D3B]

                      px-6

                      text-[12px]

                      font-semibold

                      text-white

                      no-underline

                    "

                  >

                    <ShoppingBag

                      size={17}

                    />

                    Start Shopping

                    <ArrowRight

                      size={16}

                    />

                  </Link>

                  <div

                    className="

                      mt-7

                      flex

                      flex-wrap

                      justify-center

                      gap-5

                      text-[10px]

                      font-semibold

                      text-[#332D2B]

                    "

                  >

                    <span

                      className="

                        inline-flex

                        items-center

                        gap-1.5

                      "

                    >

                      <ShieldCheck

                        size={14}

                      />

                      Secure checkout

                    </span>

                    <span

                      className="

                        inline-flex

                        items-center

                        gap-1.5

                      "

                    >

                      <Truck

                        size={14}

                      />

                      Easy tracking

                    </span>

                    <span

                      className="

                        inline-flex

                        items-center

                        gap-1.5

                      "

                    >

                      <RefreshCcw

                        size={14}

                      />

                      Easy returns

                    </span>

                  </div>

                </div>

              </section>

            )}

          </main>

        </div>

      </div>

    </>

  );

}

/* =========================================================

   SMALL COMPONENTS

========================================================= */

function SummaryStat({

  value,

  label,

  bordered = false,

}: {

  value: string;

  label: string;

  bordered?: boolean;

}) {

  return (

    <div

      className={[

        "flex min-w-0 flex-col items-center justify-center px-2 text-center",

        bordered

          ? "border-x border-[#ECE7E4]"

          : "",

      ].join(" ")}

    >

      <strong

        className="

          whitespace-nowrap

          font-serif

          text-[15px]

          text-[#111111]

          sm:text-[18px]

        "

      >

        {value}

      </strong>

      <span

        className="

          mt-1.5

          text-[8px]

          font-semibold

          text-[#302927]

          sm:text-[9px]

        "

      >

        {label}

      </span>

    </div>

  );

}

function OrderMeta({

  label,

  value,

}: {

  label: string;

  value: string;

}) {

  return (

    <div

      className="

        min-w-0

      "

    >

      <span

        className="

          mb-1

          block

          text-[9px]

          font-bold

          uppercase

          tracking-[0.6px]

          text-[#746A66]

        "

      >

        {label}

      </span>

      <span

        className="

          block

          break-words

          text-[12px]

          font-semibold

          leading-[1.4]

          text-[#171313]

        "

      >

        {value}

      </span>

    </div>

  );

}