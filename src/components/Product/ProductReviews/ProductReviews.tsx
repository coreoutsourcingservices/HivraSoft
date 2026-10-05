"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  requestLogin,
} from "@/lib/api";

import {
  createProductReview,
  getProductReviews,
  getReviewOrders,
  type ProductReview,
  type ReviewOrder,
} from "@/lib/reviews";

import {
  useStorefrontCommerce,
} from "@/src/components/Storefront/StorefrontCommerceProvider";

/* =========================================================
   PROPS
========================================================= */

type ProductReviewsProps = {
  productId: string;

  productName: string;
};

/* =========================================================
   SAFE ID
========================================================= */

function idFromValue(
  value: unknown
): string {
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
      value as {
        _id?: unknown;
        id?: unknown;
      };

    return String(
      object._id ||
        object.id ||
        ""
    );
  }

  return "";
}

/* =========================================================
   ORDER HAS PRODUCT
========================================================= */

function orderContainsProduct(
  order: ReviewOrder,
  productId: string
) {
  return (
    Array.isArray(
      order.items
    ) &&
    order.items.some(
      (item) => {
        const firstId =
          idFromValue(
            item.productId
          );

        const secondId =
          idFromValue(
            item.product
          );

        return (
          firstId ===
            productId ||
          secondId ===
            productId
        );
      }
    )
  );
}

/* =========================================================
   ORDER ID
========================================================= */

function getOrderId(
  order: ReviewOrder
) {
  return String(
    order._id ||
      order.id ||
      ""
  );
}

/* =========================================================
   DATE
========================================================= */

function displayDate(
  value?: string
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

/* =========================================================
   STARS
========================================================= */

function Stars({
  value,
  size = "normal",
}: {
  value: number;

  size?:
    | "small"
    | "normal";
}) {
  const rounded =
    Math.round(value);

  return (
    <div
      className="
        flex
        items-center
        gap-0.5
      "
      aria-label={`${value} out of 5 stars`}
    >
      {[
        1,
        2,
        3,
        4,
        5,
      ].map(
        (star) => (
          <span
            key={
              star
            }
            className={
              size ===
              "small"
                ? "text-[13px]"
                : "text-[20px]"
            }
            style={{
              color:
                star <=
                rounded
                  ? "#B31345"
                  : "#D8D2CF",
            }}
          >
            ★
          </span>
        )
      )}
    </div>
  );
}

/* =========================================================
   REVIEW CARD
========================================================= */

function ReviewCard({
  review,
}: {
  review: ProductReview;
}) {
  return (
    <article
      className="
        rounded-[18px]

        border
        border-black/10

        bg-white

        p-5

        md:p-6
      "
    >
      <div
        className="
          flex
          flex-wrap
          items-start
          justify-between

          gap-3
        "
      >
        <div>
          <div
            className="
              flex
              items-center
              gap-3
            "
          >
            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center

                rounded-full

                bg-[#F5E8EC]

                text-sm
                font-bold

                text-[#8C1839]
              "
            >
              {String(
                review.user?.name ||
                  "C"
              )
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <p
                className="
                  text-[13px]
                  font-semibold

                  text-[#171312]
                "
              >
                {review.user
                  ?.name ||
                  "HivraSoft Customer"}
              </p>

              <p
                className="
                  mt-0.5

                  text-[10px]

                  text-black/40
                "
              >
                {displayDate(
                  review.createdAt
                )}
              </p>
            </div>
          </div>
        </div>

        <div
          className="
            flex
            flex-col
            items-end
            gap-1
          "
        >
          <Stars
            value={
              review.rating
            }
            size="small"
          />

          {review.isVerified && (
            <span
              className="
                text-[9px]
                font-semibold
                uppercase

                tracking-[0.08em]

                text-green-700
              "
            >
              Verified Purchase
            </span>
          )}
        </div>
      </div>

      {review.title && (
        <h3
          className="
            mt-5

            text-[14px]
            font-semibold

            text-[#171312]
          "
        >
          {
            review.title
          }
        </h3>
      )}

      <p
        className="
          mt-2

          whitespace-pre-line

          text-[13px]
          leading-6

          text-[#514944]
        "
      >
        {
          review.comment
        }
      </p>

      {/* MEDIA */}

      {Array.isArray(
        review.media
      ) &&
        review.media.length >
          0 && (
          <div
            className="
              mt-4

              flex
              flex-wrap
              gap-2
            "
          >
            {review.media.map(
              (
                media,
                index
              ) =>
                media.type ===
                "video" ? (
                  <video
                    key={`${media.url}-${index}`}
                    src={
                      media.url
                    }
                    controls
                    preload="metadata"
                    className="
                      h-[110px]
                      w-[110px]

                      rounded-[10px]

                      bg-black

                      object-cover
                    "
                  />
                ) : (
                  <a
                    key={`${media.url}-${index}`}
                    href={
                      media.url
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="
                      block

                      h-[110px]
                      w-[110px]

                      overflow-hidden

                      rounded-[10px]

                      bg-[#F3F1EF]
                    "
                  >
                    <img
                      src={
                        media.url
                      }
                      alt="Customer review"
                      className="
                        h-full
                        w-full

                        object-cover
                      "
                    />
                  </a>
                )
            )}
          </div>
        )}

      {/* CONVERSATION */}

      {Array.isArray(
        review.conversation
      ) &&
        review.conversation.length >
          0 && (
          <div
            className="
              mt-5

              space-y-2

              border-l-2
              border-[#E9CCD5]

              pl-4
            "
          >
            {review.conversation.map(
              (
                message,
                index
              ) => (
                <div
                  key={
                    message._id ||
                    `${message.sender}-${index}`
                  }
                  className={`
                    rounded-[10px]

                    px-4
                    py-3

                    ${
                      message.sender ===
                      "admin"
                        ? "bg-[#FFF3F6]"
                        : "bg-[#F5F3F2]"
                    }
                  `}
                >
                  <p
                    className="
                      text-[9px]
                      font-bold
                      uppercase

                      tracking-[0.1em]

                      text-[#8C1839]
                    "
                  >
                    {message.sender ===
                    "admin"
                      ? "HivraSoft Reply"
                      : "Customer"}
                  </p>

                  <p
                    className="
                      mt-1

                      text-[12px]
                      leading-5

                      text-[#4B433F]
                    "
                  >
                    {
                      message.message
                    }
                  </p>
                </div>
              )
            )}
          </div>
        )}
    </article>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function ProductReviews({
  productId,
  productName,
}: ProductReviewsProps) {
  const commerce =
    useStorefrontCommerce();

  const [
    reviews,
    setReviews,
  ] =
    useState<
      ProductReview[]
    >([]);

  const [
    total,
    setTotal,
  ] =
    useState(0);

  const [
    average,
    setAverage,
  ] =
    useState(0);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    orders,
    setOrders,
  ] =
    useState<
      ReviewOrder[]
    >([]);

  const [
    ordersLoading,
    setOrdersLoading,
  ] =
    useState(false);

  const [
    selectedOrderId,
    setSelectedOrderId,
  ] =
    useState("");

  const [
    rating,
    setRating,
  ] =
    useState(5);

  const [
    title,
    setTitle,
  ] =
    useState("");

  const [
    comment,
    setComment,
  ] =
    useState("");

  const [
    files,
    setFiles,
  ] =
    useState<
      File[]
    >([]);

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState<{
      type:
        | "success"
        | "error";

      text: string;
    } | null>(
      null
    );

  /* =======================================================
     LOAD PUBLIC REVIEWS
  ======================================================= */

  const loadReviews =
    useCallback(
      async () => {
        if (
          !productId
        ) {
          return;
        }

        try {
          setLoading(
            true
          );

          const response =
            await getProductReviews(
              productId,
              1,
              30
            );

          setReviews(
            response.reviews
          );

          setTotal(
            response.total
          );

          setAverage(
            response.ratings
              .average
          );
        } catch {
          setReviews([]);

          setTotal(0);

          setAverage(0);
        } finally {
          setLoading(
            false
          );
        }
      },
      [
        productId,
      ]
    );

  useEffect(() => {
    void loadReviews();
  }, [
    loadReviews,
  ]);

  /* =======================================================
     LOAD PURCHASED ORDERS
  ======================================================= */

  useEffect(() => {
    if (
      commerce.isAuthenticated !==
        true ||
      !productId
    ) {
      setOrders([]);

      setSelectedOrderId(
        ""
      );

      return;
    }

    let cancelled =
      false;

    const run =
      async () => {
        try {
          setOrdersLoading(
            true
          );

          const allOrders =
            await getReviewOrders();

          if (cancelled) {
            return;
          }

          const matchingOrders =
            allOrders.filter(
              (order) =>
                orderContainsProduct(
                  order,
                  productId
                )
            );

          setOrders(
            matchingOrders
          );

          if (
            matchingOrders.length >
            0
          ) {
            setSelectedOrderId(
              getOrderId(
                matchingOrders[0]
              )
            );
          }
        } catch {
          if (
            !cancelled
          ) {
            setOrders([]);
          }
        } finally {
          if (
            !cancelled
          ) {
            setOrdersLoading(
              false
            );
          }
        }
      };

    void run();

    return () => {
      cancelled =
        true;
    };
  }, [
    commerce.isAuthenticated,
    productId,
  ]);

  /* =======================================================
     FILE COUNTS
  ======================================================= */

  const fileCounts =
    useMemo(() => {
      return {
        images:
          files.filter(
            (file) =>
              file.type.startsWith(
                "image/"
              )
          ).length,

        videos:
          files.filter(
            (file) =>
              file.type.startsWith(
                "video/"
              )
          ).length,
      };
    }, [
      files,
    ]);

  /* =======================================================
     FILE CHANGE
  ======================================================= */

  const handleFiles = (
    list:
      | FileList
      | null
  ) => {
    if (!list) {
      return;
    }

    const next =
      Array.from(list);

    const imageFiles =
      next.filter(
        (file) =>
          file.type.startsWith(
            "image/"
          )
      );

    const videoFiles =
      next.filter(
        (file) =>
          file.type.startsWith(
            "video/"
          )
      );

    if (
      imageFiles.length >
      5
    ) {
      setMessage({
        type: "error",

        text:
          "Maximum 5 images are allowed.",
      });

      return;
    }

    if (
      videoFiles.length >
      3
    ) {
      setMessage({
        type: "error",

        text:
          "Maximum 3 videos are allowed.",
      });

      return;
    }

    const tooLarge =
      next.find(
        (file) =>
          file.size >
          25 *
            1024 *
            1024
      );

    if (tooLarge) {
      setMessage({
        type: "error",

        text:
          `${tooLarge.name} is larger than 25 MB.`,
      });

      return;
    }

    setFiles(next);

    setMessage(null);
  };

  /* =======================================================
     SUBMIT
  ======================================================= */

  const submitReview =
    async () => {
      setMessage(null);

      if (
        commerce.isAuthenticated !==
        true
      ) {
        requestLogin();

        return;
      }

      if (
        !selectedOrderId
      ) {
        setMessage({
          type: "error",

          text:
            "A purchased order containing this product is required.",
        });

        return;
      }

      if (
        rating < 1 ||
        rating > 5
      ) {
        setMessage({
          type: "error",

          text:
            "Please select a rating.",
        });

        return;
      }

      if (
        !comment.trim()
      ) {
        setMessage({
          type: "error",

          text:
            "Please write your review comment.",
        });

        return;
      }

      try {
        setSubmitting(
          true
        );

        await createProductReview(
          {
            productId,

            orderId:
              selectedOrderId,

            rating,

            title,

            comment,

            files,
          }
        );

        setTitle("");

        setComment("");

        setFiles([]);

        setRating(5);

        setMessage({
          type: "success",

          text:
            "Thank you. Your review has been submitted.",
        });

        await loadReviews();
      } catch (
        error
      ) {
        setMessage({
          type: "error",

          text:
            error instanceof
            Error
              ? error.message
              : "Unable to submit review.",
        });
      } finally {
        setSubmitting(
          false
        );
      }
    };

  return (
    <section
      id="reviews"
      className="
        border-t
        border-black/10

        bg-[#FAF8F6]

        px-4
        py-14

        sm:px-6
        lg:py-16
      "
    >
      <div
        className="
          mx-auto

          w-full
          max-w-[1180px]
        "
      >
        {/* HEADING */}

        <div
          className="
            flex
            flex-col
            gap-5

            border-b
            border-black/10

            pb-7

            md:flex-row
            md:items-end
            md:justify-between
          "
        >
          <div>
            <p
              className="
                text-[9px]
                font-bold
                uppercase

                tracking-[0.2em]

                text-[#9D173E]
              "
            >
              Customer Experience
            </p>

            <h2
              className="
                mt-2

                text-2xl
                font-semibold

                text-[#211A18]

                sm:text-3xl
              "
            >
              Reviews & Comments
            </h2>

            <p
              className="
                mt-2

                max-w-xl

                text-[13px]
                leading-6

                text-black/50
              "
            >
              See what customers
              think about{" "}
              {productName}.
            </p>
          </div>

          <div
            className="
              flex
              items-center
              gap-4
            "
          >
            <div
              className="
                text-4xl
                font-bold

                text-[#211A18]
              "
            >
              {average.toFixed(
                1
              )}
            </div>

            <div>
              <Stars
                value={
                  average
                }
              />

              <p
                className="
                  mt-1

                  text-[10px]

                  text-black/45
                "
              >
                Based on{" "}
                {total}{" "}
                {total === 1
                  ? "review"
                  : "reviews"}
              </p>
            </div>
          </div>
        </div>

        <div
          className="
            mt-8

            grid
            gap-8

            lg:grid-cols-[360px_minmax(0,1fr)]
          "
        >
          {/* ===============================================
              WRITE REVIEW
          =============================================== */}

          <aside>
            <div
              className="
                rounded-[20px]

                border
                border-black/10

                bg-white

                p-5

                lg:sticky
                lg:top-[110px]
              "
            >
              <h3
                className="
                  text-[17px]
                  font-semibold

                  text-[#211A18]
                "
              >
                Write a Review
              </h3>

              {commerce.isAuthenticated ===
                null && (
                <p
                  className="
                    mt-4

                    text-sm

                    text-black/45
                  "
                >
                  Checking your
                  account...
                </p>
              )}

              {commerce.isAuthenticated ===
                false && (
                <div
                  className="
                    mt-5

                    rounded-[14px]

                    bg-[#FFF4F7]

                    p-4
                  "
                >
                  <p
                    className="
                      text-[12px]
                      leading-5

                      text-[#5B4B50]
                    "
                  >
                    Login to write a
                    review for a
                    product you
                    purchased.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      requestLogin()
                    }
                    className="
                      mt-4

                      h-10
                      w-full

                      rounded-[8px]

                      bg-[#8C1839]

                      text-[10px]
                      font-bold
                      uppercase

                      tracking-[0.1em]

                      text-white
                    "
                  >
                    Login / Sign Up
                  </button>
                </div>
              )}

              {commerce.isAuthenticated ===
                true && (
                <>
                  {/* ORDER */}

                  <div
                    className="
                      mt-5
                    "
                  >
                    <label
                      className="
                        text-[11px]
                        font-semibold

                        text-[#211A18]
                      "
                    >
                      Purchased Order
                    </label>

                    {ordersLoading ? (
                      <p
                        className="
                          mt-2

                          text-[11px]

                          text-black/40
                        "
                      >
                        Loading your
                        orders...
                      </p>
                    ) : orders.length >
                      0 ? (
                      <select
                        value={
                          selectedOrderId
                        }
                        onChange={(
                          event
                        ) =>
                          setSelectedOrderId(
                            event.target
                              .value
                          )
                        }
                        className="
                          mt-2

                          h-11
                          w-full

                          rounded-[9px]

                          border
                          border-black/15

                          bg-white

                          px-3

                          text-[11px]

                          text-[#211A18]

                          outline-none

                          focus:border-[#8C1839]
                        "
                      >
                        {orders.map(
                          (order) => {
                            const id =
                              getOrderId(
                                order
                              );

                            return (
                              <option
                                key={
                                  id
                                }
                                value={
                                  id
                                }
                              >
                                {order.orderNumber ||
                                  `Order ${id.slice(
                                    -6
                                  )}`}
                              </option>
                            );
                          }
                        )}
                      </select>
                    ) : (
                      <div
                        className="
                          mt-2

                          rounded-[10px]

                          border
                          border-black/10

                          bg-[#FAF8F6]

                          p-3

                          text-[11px]
                          leading-5

                          text-black/50
                        "
                      >
                        No order
                        containing this
                        product was
                        found for your
                        account.
                      </div>
                    )}
                  </div>

                  {/* RATING */}

                  <div
                    className="
                      mt-5
                    "
                  >
                    <p
                      className="
                        text-[11px]
                        font-semibold

                        text-[#211A18]
                      "
                    >
                      Your Rating
                    </p>

                    <div
                      className="
                        mt-2

                        flex
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
                            aria-label={`${star} stars`}
                            onClick={() =>
                              setRating(
                                star
                              )
                            }
                            className="
                              text-[27px]

                              transition

                              hover:scale-110
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
                    </div>
                  </div>

                  {/* TITLE */}

                  <div
                    className="
                      mt-5
                    "
                  >
                    <label
                      className="
                        text-[11px]
                        font-semibold

                        text-[#211A18]
                      "
                    >
                      Review Title
                    </label>

                    <input
                      value={
                        title
                      }
                      maxLength={
                        160
                      }
                      onChange={(
                        event
                      ) =>
                        setTitle(
                          event.target
                            .value
                        )
                      }
                      placeholder="Example: Very comfortable"
                      className="
                        mt-2

                        h-11
                        w-full

                        rounded-[9px]

                        border
                        border-black/15

                        px-3

                        text-[12px]

                        outline-none

                        focus:border-[#8C1839]
                      "
                    />
                  </div>

                  {/* COMMENT */}

                  <div
                    className="
                      mt-5
                    "
                  >
                    <label
                      className="
                        text-[11px]
                        font-semibold

                        text-[#211A18]
                      "
                    >
                      Comment
                    </label>

                    <textarea
                      value={
                        comment
                      }
                      maxLength={
                        4000
                      }
                      onChange={(
                        event
                      ) =>
                        setComment(
                          event.target
                            .value
                        )
                      }
                      placeholder="Share your experience with this product..."
                      className="
                        mt-2

                        min-h-[125px]
                        w-full

                        resize-y

                        rounded-[9px]

                        border
                        border-black/15

                        p-3

                        text-[12px]
                        leading-5

                        outline-none

                        focus:border-[#8C1839]
                      "
                    />
                  </div>

                  {/* FILES */}

                  <div
                    className="
                      mt-5
                    "
                  >
                    <label
                      className="
                        block

                        text-[11px]
                        font-semibold

                        text-[#211A18]
                      "
                    >
                      Photos / Videos
                    </label>

                    <label
                      className="
                        mt-2

                        flex
                        min-h-[70px]
                        cursor-pointer
                        items-center
                        justify-center

                        rounded-[10px]

                        border
                        border-dashed
                        border-black/20

                        bg-[#FAF8F6]

                        px-4

                        text-center

                        text-[10px]
                        leading-5

                        text-black/50

                        transition

                        hover:border-[#8C1839]
                      "
                    >
                      Add up to 5
                      images and 3
                      videos

                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm,video/quicktime"
                        className="hidden"
                        onChange={(
                          event
                        ) =>
                          handleFiles(
                            event.target
                              .files
                          )
                        }
                      />
                    </label>

                    {files.length >
                      0 && (
                      <p
                        className="
                          mt-2

                          text-[10px]

                          text-black/50
                        "
                      >
                        {
                          fileCounts.images
                        }{" "}
                        image(s) •{" "}
                        {
                          fileCounts.videos
                        }{" "}
                        video(s)
                      </p>
                    )}
                  </div>

                  {message && (
                    <div
                      className={`
                        mt-4

                        rounded-[10px]

                        px-3
                        py-3

                        text-[11px]
                        leading-5

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
                  )}

                  <button
                    type="button"
                    disabled={
                      submitting ||
                      orders.length ===
                        0
                    }
                    onClick={() => {
                      void submitReview();
                    }}
                    className="
                      mt-5

                      h-11
                      w-full

                      rounded-[9px]

                      bg-[#8C1839]

                      text-[10px]
                      font-bold
                      uppercase

                      tracking-[0.12em]

                      text-white

                      transition

                      hover:bg-[#6E102D]

                      disabled:cursor-not-allowed
                      disabled:bg-black/20
                    "
                  >
                    {submitting
                      ? "Submitting..."
                      : "Submit Review"}
                  </button>
                </>
              )}
            </div>
          </aside>

          {/* ===============================================
              REVIEWS
          =============================================== */}

          <div>
            {loading ? (
              <div
                className="
                  rounded-[18px]

                  border
                  border-black/10

                  bg-white

                  px-6
                  py-16

                  text-center

                  text-sm

                  text-black/40
                "
              >
                Loading reviews...
              </div>
            ) : reviews.length ===
              0 ? (
              <div
                className="
                  rounded-[18px]

                  border
                  border-black/10

                  bg-white

                  px-6
                  py-16

                  text-center
                "
              >
                <div
                  className="
                    text-[34px]
                  "
                >
                  ☆
                </div>

                <h3
                  className="
                    mt-3

                    text-[16px]
                    font-semibold

                    text-[#211A18]
                  "
                >
                  No reviews yet
                </h3>

                <p
                  className="
                    mt-2

                    text-[12px]

                    text-black/45
                  "
                >
                  Be the first
                  customer to share
                  your experience.
                </p>
              </div>
            ) : (
              <div
                className="
                  space-y-4
                "
              >
                {reviews.map(
                  (review) => (
                    <ReviewCard
                      key={
                        review._id
                      }
                      review={
                        review
                      }
                    />
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}