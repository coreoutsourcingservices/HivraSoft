"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getProductReviews,
  type ProductReview,
} from "@/lib/reviews";

/* =========================================================
   PROPS
========================================================= */

type ProductReviewsProps = {
  productId: string;
  productName: string;
};

/* =========================================================
   CONSTANTS
========================================================= */

const REVIEWS_PER_LOAD = 6;

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
   REVIEW MEDIA
========================================================= */

function ReviewMedia({
  review,
}: {
  review:
    ProductReview;
}) {
  const media =
    Array.isArray(
      review.media
    )
      ? review.media.filter(
          (
            item
          ) =>
            Boolean(
              item?.url
            )
        )
      : [];

  if (
    media.length ===
    0
  ) {
    return null;
  }

  const first =
    media[0];

  return (
    <div
      className="
        relative

        aspect-[16/10]

        w-full

        overflow-hidden

        border-b
        border-black/[0.07]

        bg-[#F3F0EE]
      "
    >
      {first.type ===
      "video" ? (
        <video
          src={
            first.url
          }
          controls
          preload="metadata"
          className="
            h-full
            w-full

            object-cover
          "
        />
      ) : (
        <a
          href={
            first.url
          }
          target="_blank"
          rel="noreferrer"
          className="
            block

            h-full
            w-full
          "
        >
          <img
            src={
              first.url
            }
            alt="Customer review"
            className="
              h-full
              w-full

              object-cover
            "
          />
        </a>
      )}

      {media.length >
      1 ? (
        <span
          className="
            absolute
            bottom-2
            right-2

            rounded-full

            bg-black/70

            px-2
            py-1

            text-[9px]
            font-bold

            text-white
          "
        >
          +
          {media.length -
            1}
        </span>
      ) : null}
    </div>
  );
}

/* =========================================================
   REVIEW CARD
========================================================= */

function ReviewCard({
  review,
}: {
  review:
    ProductReview;
}) {
  return (
    <article
      className="
        flex

        h-full

        min-h-[330px]

        flex-col

        overflow-hidden

        rounded-[18px]

        border
        border-black/10

        bg-white

        shadow-[0_6px_22px_rgba(0,0,0,.035)]
      "
    >
      {/* ===============================================
          IMAGE / VIDEO TOP
      =============================================== */}

      <ReviewMedia
        review={
          review
        }
      />

      <div
        className="
          flex

          flex-1

          flex-col

          p-5
        "
      >
        {/* =============================================
            RATING TOP
        ============================================= */}

        <div
          className="
            flex
            flex-wrap

            items-center
            justify-between

            gap-2
          "
        >
          <Stars
            value={
              review.rating
            }
            size="small"
          />

          {review.isVerified ? (
            <span
              className="
                rounded-full

                bg-green-50

                px-2
                py-1

                text-[8px]
                font-bold

                uppercase

                tracking-[0.08em]

                text-green-700
              "
            >
              Verified Purchase
            </span>
          ) : null}
        </div>

        {/* =============================================
            CUSTOMER
        ============================================= */}

        <div
          className="
            mt-4

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

              shrink-0

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
              review.user
                ?.name ||
                "C"
            )
              .charAt(
                0
              )
              .toUpperCase()}
          </div>

          <div
            className="
              min-w-0
            "
          >
            <p
              className="
                truncate

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

        {/* =============================================
            REVIEW TITLE
        ============================================= */}

        {review.title ? (
          <h3
            className="
              mt-5

              text-[14px]
              font-semibold

              leading-5

              text-[#171312]
            "
          >
            {
              review.title
            }
          </h3>
        ) : null}

        {/* =============================================
            COMMENT
        ============================================= */}

        <p
          className="
            mt-2

            whitespace-pre-line

            break-words

            text-[12px]

            leading-6

            text-[#514944]
          "
        >
          {
            review.comment
          }
        </p>

        {/* =============================================
            ADMIN / CUSTOMER REPLY
        ============================================= */}

        {Array.isArray(
          review.conversation
        ) &&
        review.conversation
          .length >
          0 ? (
          <div
            className="
              mt-auto

              space-y-2

              pt-5
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

                    border-l-2

                    px-4
                    py-3

                    ${
                      message.sender ===
                      "admin"
                        ? "border-[#B31345] bg-[#FFF3F6]"
                        : "border-black/10 bg-[#F5F3F2]"
                    }
                  `}
                >
                  <p
                    className="
                      text-[8px]
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

                      whitespace-pre-line

                      break-words

                      text-[11px]

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
        ) : null}
      </div>
    </article>
  );
}

/* =========================================================
   MAIN
========================================================= */

export default function ProductReviews({
  productId,
  productName,
}: ProductReviewsProps) {
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
    useState(
      0
    );

  const [
    average,
    setAverage,
  ] =
    useState(
      0
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    visibleCount,
    setVisibleCount,
  ] =
    useState(
      REVIEWS_PER_LOAD
    );

  /* =======================================================
     RESET VISIBLE REVIEWS ON PRODUCT CHANGE
  ======================================================= */

  useEffect(() => {
    setVisibleCount(
      REVIEWS_PER_LOAD
    );
  }, [
    productId,
  ]);

  /* =======================================================
     LOAD REVIEWS
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
        } catch (
          error
        ) {
          console.error(
            "PRODUCT REVIEWS ERROR:",
            error
          );

          setReviews(
            []
          );

          setTotal(
            0
          );

          setAverage(
            0
          );
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
     FIRST 6 + LOAD MORE
  ======================================================= */

  const visibleReviews =
    useMemo(
      () =>
        reviews.slice(
          0,
          visibleCount
        ),
      [
        reviews,
        visibleCount,
      ]
    );

  const hasMoreReviews =
    visibleCount <
    reviews.length;

  /* =======================================================
     UI
  ======================================================= */

  return (
    <section
      id="reviews"
      className="
        border-t
        border-black/10

        bg-[#FAF8F6]

        px-4
        py-12

        sm:px-6

        lg:py-14
      "
    >
      <div
        className="
          mx-auto

          w-full
          max-w-[1260px]
        "
      >
        {/* ===============================================
            HEADING
        =============================================== */}

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

                text-[12px]

                leading-6

                text-black/50

                sm:text-[13px]
              "
            >
              See what customers
              think about{" "}
              {
                productName
              }.
            </p>
          </div>

          {/* =============================================
              TOTAL RATING
          ============================================= */}

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
                {total ===
                1
                  ? "review"
                  : "reviews"}
              </p>
            </div>
          </div>
        </div>

        {/* ===============================================
            REVIEWS ONLY

            WRITE A REVIEW REMOVED
        =============================================== */}

        <div
          className="
            mt-8
          "
        >
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
                No customer review
                has been added yet.
              </p>
            </div>
          ) : (
            <>
              {/* ===========================================
                  3 CARDS DESKTOP

                  MOBILE = 1
                  TABLET = 2
                  DESKTOP = 3
              =========================================== */}

              <div
                className="
                  grid

                  auto-rows-fr

                  grid-cols-1

                  gap-4

                  md:grid-cols-2

                  xl:grid-cols-3
                "
              >
                {visibleReviews.map(
                  (
                    review
                  ) => (
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

              {/* ===========================================
                  LOAD MORE AFTER 6
              =========================================== */}

              {hasMoreReviews ? (
                <div
                  className="
                    mt-7

                    flex
                    justify-center
                  "
                >
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleCount(
                        (
                          current
                        ) =>
                          current +
                          REVIEWS_PER_LOAD
                      )
                    }
                    className="
                      inline-flex

                      h-11

                      items-center
                      justify-center

                      rounded-full

                      border
                      border-[#8C1839]

                      bg-white

                      px-7

                      text-[10px]
                      font-bold

                      uppercase

                      tracking-[0.12em]

                      text-[#8C1839]

                      transition

                      hover:bg-[#8C1839]

                      hover:text-white
                    "
                  >
                    Load More Reviews
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </section>
  );
} 