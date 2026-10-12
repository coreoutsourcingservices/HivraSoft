"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import Header from "@/src/components/Header/Header";

import {
  getLastOrder,
  getOrderById,
  type OrderResult,
} from "@/lib/checkout";

/* =========================================================
   MONEY
========================================================= */

function money(
  amount: number
) {
  return `₹${Math.max(
    0,
    amount
  ).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 2,
    }
  )}`;
}

/* =========================================================
   PAGE
========================================================= */

export default function ThanksPage() {
  const [
    order,
    setOrder,
  ] =
    useState<
      OrderResult | null
    >(null);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  /* =======================================================
     LOAD ORDER
  ======================================================= */

  useEffect(() => {
    let cancelled =
      false;

    const load =
      async () => {
        try {
          setLoading(
            true
          );

          const params =
            new URLSearchParams(
              window.location.search
            );

          const orderId =
            params.get(
              "orderId"
            );

          if (
            orderId
          ) {
            try {
              const result =
                await getOrderById(
                  orderId
                );

              if (
                !cancelled
              ) {
                setOrder(
                  result
                );
              }

              return;
            } catch {
              /*
               * Session fallback below.
               */
            }
          }

          const savedOrder =
            getLastOrder();

          if (
            !cancelled
          ) {
            setOrder(
              savedOrder
            );
          }
        } finally {
          if (
            !cancelled
          ) {
            setLoading(
              false
            );
          }
        }
      };

    void load();

    return () => {
      cancelled =
        true;
    };
  }, []);

  return (
    <>
      <Header />

      <main
        className="
          min-h-screen

          bg-[#FAF7F4]

          px-4
          py-8

          sm:px-6
          sm:py-14
        "
      >
        <div
          className="
            mx-auto

            max-w-[760px]
          "
        >
          <section
            className="
              overflow-hidden

              rounded-[24px]

              border
              border-black/10

              bg-white

              shadow-[0_20px_60px_rgba(0,0,0,.06)]
            "
          >
            {/* =============================================
                SUCCESS TOP
            ============================================= */}

            <div
              className="
                bg-[#211A18]

                px-5
                py-9

                text-center

                text-white

                sm:px-8
                sm:py-12
              "
            >
              <div
                className="
                  mx-auto

                  flex
                  h-16
                  w-16

                  items-center
                  justify-center

                  rounded-full

                  bg-white

                  text-3xl
                  font-bold

                  text-[#B31345]
                "
              >
                ✓
              </div>

              <p
                className="
                  mt-5

                  text-[8px]
                  font-bold
                  uppercase

                  tracking-[0.22em]

                  text-white/55
                "
              >
                Order Confirmed
              </p>

              <h1
                className="
                  mt-2

                  text-[29px]
                  font-semibold
                  leading-tight

                  sm:text-[42px]
                "
              >
                Thank you for your order!
              </h1>

              <p
                className="
                  mx-auto

                  mt-3

                  max-w-[500px]

                  text-[11px]
                  leading-6

                  text-white/65
                "
              >
                Your order has been
                successfully placed. We
                will keep you updated as
                your order moves through
                packing and delivery.
              </p>
            </div>

            {/* =============================================
                DETAILS
            ============================================= */}

            <div
              className="
                p-5

                sm:p-8
              "
            >
              {loading ? (
                <div
                  className="
                    h-[180px]

                    animate-pulse

                    rounded-[14px]

                    bg-black/5
                  "
                />
              ) : (
                <>
                  <div
                    className="
                      grid

                      gap-3

                      sm:grid-cols-2
                    "
                  >
                    <InfoCard
                      label="Order Number"
                      value={
                        order?.orderNumber ||
                        "Confirmed"
                      }
                    />

                    <InfoCard
                      label="Order Total"
                      value={
                        order &&
                        order.total >
                          0
                          ? money(
                              order.total
                            )
                          : "—"
                      }
                    />

                    <InfoCard
                      label="Payment Method"
                      value={
                        order?.paymentMethod ===
                        "cod"
                          ? "Cash on Delivery"
                          : order?.paymentMethod ===
                              "online"
                            ? "Online Payment"
                            : order?.paymentMethod ||
                              "Confirmed"
                      }
                    />

                    <InfoCard
                      label="Order Status"
                      value={
                        order?.status ||
                        "Confirmed"
                      }
                    />
                  </div>

                  {/* COD MESSAGE */}

                  {order?.paymentMethod ===
                    "cod" && (
                    <div
                      className="
                        mt-6

                        rounded-[14px]

                        bg-[#FFF7F9]

                        px-4
                        py-4

                        text-center
                      "
                    >
                      <p
                        className="
                          text-[10px]
                          leading-5

                          text-[#7B2442]
                        "
                      >
                        Cash on Delivery
                        selected. Payment
                        will be collected
                        when your order is
                        delivered.
                      </p>
                    </div>
                  )}

                  {/* ONLINE MESSAGE */}

                  {order?.paymentMethod ===
                    "online" && (
                    <div
                      className="
                        mt-6

                        rounded-[14px]

                        bg-green-50

                        px-4
                        py-4

                        text-center
                      "
                    >
                      <p
                        className="
                          text-[10px]
                          leading-5

                          text-green-800
                        "
                      >
                        Your payment has
                        been received and
                        your order is
                        confirmed.
                      </p>
                    </div>
                  )}

                  {/* =======================================
                      BUTTONS
                  ======================================= */}

                  <div
                    className="
                      mt-7

                      grid

                      gap-3

                      sm:grid-cols-2
                    "
                  >
                    <Link
                      href="/account/orders"
                      className="
                        flex
                        h-12

                        items-center
                        justify-center

                        rounded-[9px]

                        bg-[#B31345]

                        px-4

                        text-[9px]
                        font-bold
                        uppercase

                        tracking-[0.08em]

                        text-white

                        transition

                        hover:bg-[#8C1036]
                      "
                    >
                      View My Orders
                    </Link>

                    <Link
                      href="/"
                      className="
                        flex
                        h-12

                        items-center
                        justify-center

                        rounded-[9px]

                        border
                        border-black/15

                        px-4

                        text-[9px]
                        font-bold
                        uppercase

                        tracking-[0.08em]

                        text-[#211A18]

                        transition

                        hover:bg-black/[0.03]
                      "
                    >
                      Continue Shopping
                    </Link>
                  </div>
                </>
              )}

              {/* ===========================================
                  TRUST
              =========================================== */}

              <div
                className="
                  mt-8

                  grid
                  grid-cols-3

                  gap-2

                  border-t
                  border-black/10

                  pt-6
                "
              >
                <TrustItem
                  icon="✓"
                  title="Order Confirmed"
                />

                <TrustItem
                  icon="▣"
                  title="Secure Checkout"
                />

                <TrustItem
                  icon="♡"
                  title="Customer Support"
                />
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

/* =========================================================
   INFO CARD
========================================================= */

function InfoCard({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div
      className="
        rounded-[13px]

        border
        border-black/10

        bg-[#FAF8F6]

        p-4
      "
    >
      <p
        className="
          text-[7px]
          font-bold
          uppercase

          tracking-[0.12em]

          text-black/35
        "
      >
        {
          label
        }
      </p>

      <p
        className="
          mt-2

          break-words

          text-[12px]
          font-semibold

          capitalize

          text-[#211A18]
        "
      >
        {
          value
        }
      </p>
    </div>
  );
}

/* =========================================================
   TRUST
========================================================= */

function TrustItem({
  icon,
  title,
}: {
  icon: string;

  title: string;
}) {
  return (
    <div
      className="
        text-center
      "
    >
      <div
        className="
          mx-auto

          flex
          h-8
          w-8

          items-center
          justify-center

          rounded-full

          bg-[#F7E8ED]

          text-xs
          font-bold

          text-[#B31345]
        "
      >
        {
          icon
        }
      </div>

      <p
        className="
          mt-2

          text-[7px]
          font-semibold
          leading-4

          text-black/50
        "
      >
        {
          title
        }
      </p>
    </div>
  );
}