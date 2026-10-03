"use client";

import Link from "next/link";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Check,
  ChevronLeft,
  CreditCard,
  Landmark,
  ShieldCheck,
  Smartphone,
  WalletCards,
} from "lucide-react";

import Header from "@/src/components/Header/Header";

import {
  apiFetch,
} from "@/lib/api";

import {
  clearCheckoutDraft,
  createRazorpayOrder,
  getCheckoutCart,
  getCheckoutDraft,
  saveLastOrder,
  verifyRazorpayPayment,
  type CheckoutCart,
  type CheckoutDraft,
} from "@/lib/checkout";

/* =========================================================
   RAZORPAY TYPES
========================================================= */

type RazorpaySuccessResponse = {
  razorpay_payment_id:
    string;

  razorpay_order_id:
    string;

  razorpay_signature:
    string;
};

type RazorpayOptions = {
  key: string;

  amount: number;

  currency: string;

  name: string;

  description: string;

  order_id: string;

  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };

  theme?: {
    color?: string;
  };

  handler: (
    response:
      RazorpaySuccessResponse
  ) => void;

  modal?: {
    ondismiss?: () => void;
  };
};

type RazorpayInstance = {
  open:
    () => void;

  on?: (
    event: string,
    callback: (
      response: unknown
    ) => void
  ) => void;
};

declare global {
  interface Window {
    Razorpay?: new (
      options:
        RazorpayOptions
    ) => RazorpayInstance;
  }
}

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
      maximumFractionDigits:
        2,
    }
  )}`;
}

/* =========================================================
   LOAD RAZORPAY
========================================================= */

function loadRazorpayScript(): Promise<boolean> {
  return new Promise(
    (
      resolve
    ) => {
      if (
        typeof window ===
        "undefined"
      ) {
        resolve(
          false
        );

        return;
      }

      if (
        window.Razorpay
      ) {
        resolve(
          true
        );

        return;
      }

      const existing =
        document.querySelector(
          'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
        );

      if (existing) {
        existing.addEventListener(
          "load",
          () =>
            resolve(
              true
            ),
          {
            once:
              true,
          }
        );

        existing.addEventListener(
          "error",
          () =>
            resolve(
              false
            ),
          {
            once:
              true,
          }
        );

        return;
      }

      const script =
        document.createElement(
          "script"
        );

      script.src =
        "https://checkout.razorpay.com/v1/checkout.js";

      script.async =
        true;

      script.onload =
        () =>
          resolve(
            true
          );

      script.onerror =
        () =>
          resolve(
            false
          );

      document.body.appendChild(
        script
      );
    }
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function PaymentPage() {
  const router =
    useRouter();

  const [
    draft,
    setDraft,
  ] =
    useState<
      CheckoutDraft | null
    >(null);

  const [
    cart,
    setCart,
  ] =
    useState<
      CheckoutCart | null
    >(null);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    paying,
    setPaying,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    customer,
    setCustomer,
  ] =
    useState({
      name: "",
      email: "",
      phone: "",
    });

  /* =======================================================
     LOAD
  ======================================================= */

  useEffect(() => {
    let cancelled =
      false;

    const load =
      async () => {
        const savedDraft =
          getCheckoutDraft();

        if (
          !savedDraft
        ) {
          router.replace(
            "/account/checkout"
          );

          return;
        }

        setDraft(
          savedDraft
        );

        try {
          const [
            cartData,
            userResponse,
          ] =
            await Promise.all([
              getCheckoutCart(),

              apiFetch<unknown>(
                "/api/auth/me",
                {
                  method:
                    "GET",
                }
              ),
            ]);

          if (
            cancelled
          ) {
            return;
          }

          setCart(
            cartData
          );

          const root =
            (
              userResponse &&
              typeof userResponse ===
                "object"
            )
              ? userResponse as Record<
                  string,
                  unknown
                >
              : {};

          const data =
            (
              root.data &&
              typeof root.data ===
                "object"
            )
              ? root.data as Record<
                  string,
                  unknown
                >
              : {};

          const rawUser =
            (
              root.user &&
              typeof root.user ===
                "object"
            )
              ? root.user
              : (
                  data.user &&
                  typeof data.user ===
                    "object"
                )
                ? data.user
                : data;

          const user =
            rawUser as Record<
              string,
              unknown
            >;

          setCustomer({
            name:
              String(
                user?.name ||
                  savedDraft.address.name ||
                  ""
              ),

            email:
              String(
                user?.email ||
                  ""
              ),

            phone:
              String(
                user?.phone ||
                  user?.mobile ||
                  savedDraft.address.phone ||
                  ""
              ),
          });
        } catch (
          loadError
        ) {
          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load payment details."
          );
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
  }, [
    router,
  ]);

  /* =======================================================
     START PAYMENT
  ======================================================= */

  const startPayment =
    async () => {
      if (!draft) {
        router.replace(
          "/account/checkout"
        );

        return;
      }

      try {
        setError("");

        setPaying(
          true
        );

        const loaded =
          await loadRazorpayScript();

        if (
          !loaded ||
          !window.Razorpay
        ) {
          throw new Error(
            "Unable to load payment gateway."
          );
        }

        const paymentOrder =
          await createRazorpayOrder(
            draft.address
          );

        const key =
          paymentOrder.key ||
          process.env
            .NEXT_PUBLIC_RAZORPAY_KEY_ID ||
          "";

        if (
          !paymentOrder.razorpayOrderId
        ) {
          throw new Error(
            "Razorpay order ID was not returned by server."
          );
        }

        if (!key) {
          throw new Error(
            "Razorpay public key is not configured."
          );
        }

        const instance =
          new window.Razorpay(
            {
              key,

              amount:
                paymentOrder.amount,

              currency:
                paymentOrder.currency ||
                "INR",

              name:
                "HivraSoft",

              description:
                paymentOrder.orderNumber
                  ? `Order ${paymentOrder.orderNumber}`
                  : "HivraSoft Order",

              order_id:
                paymentOrder.razorpayOrderId,

              prefill: {
                name:
                  customer.name,

                email:
                  customer.email,

                contact:
                  customer.phone,
              },

              theme: {
                color:
                  "#B31345",
              },

              handler:
                async (
                  response
                ) => {
                  try {
                    const verified =
                      await verifyRazorpayPayment(
                        {
                          razorpay_order_id:
                            response.razorpay_order_id,

                          razorpay_payment_id:
                            response.razorpay_payment_id,

                          razorpay_signature:
                            response.razorpay_signature,

                          orderId:
                            paymentOrder.internalOrderId ||
                            undefined,
                        }
                      );

                    saveLastOrder(
                      verified
                    );

                    clearCheckoutDraft();

                    window.dispatchEvent(
                      new Event(
                        "hivrasoft-cart-updated"
                      )
                    );

                    window.dispatchEvent(
                      new Event(
                        "hivra:store-changed"
                      )
                    );

                    const orderId =
                      verified.id ||
                      paymentOrder.internalOrderId;

                    router.replace(
                      orderId
                        ? `/account/thanks?orderId=${encodeURIComponent(
                            orderId
                          )}`
                        : "/account/thanks"
                    );
                  } catch (
                    verifyError
                  ) {
                    setPaying(
                      false
                    );

                    setError(
                      verifyError instanceof
                        Error
                        ? verifyError.message
                        : "Payment verification failed."
                    );
                  }
                },

              modal: {
                ondismiss:
                  () => {
                    setPaying(
                      false
                    );
                  },
              },
            }
          );

        instance.on?.(
          "payment.failed",
          () => {
            setPaying(
              false
            );

            setError(
              "Payment failed. Please try again."
            );
          }
        );

        instance.open();
      } catch (
        paymentError
      ) {
        setPaying(
          false
        );

        setError(
          paymentError instanceof
            Error
            ? paymentError.message
            : "Unable to start payment."
        );
      }
    };

  if (
    loading ||
    !draft
  ) {
    return (
      <>
        <Header />

        <div
          className="
            min-h-screen
            bg-[#FBF7F4]
            p-6
          "
        >
          <div
            className="
              mx-auto
              h-[420px]
              max-w-[900px]
              animate-pulse
              rounded-3xl
              bg-black/5
            "
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Header />

      <main
        className="
          min-h-screen
          bg-[#FBF7F4]
          pb-28
          lg:pb-16
        "
      >
        <section
          className="
            border-b
            border-[#EBDDD8]
            bg-white
          "
        >
          <div
            className="
              mx-auto
              max-w-[1100px]
              px-4
              py-6
              sm:px-6
              lg:px-8
            "
          >
            <Link
              href="/account/checkout"
              className="
                inline-flex
                items-center
                gap-1
                text-[9px]
                font-medium
                uppercase
                text-black/45
              "
            >
              <ChevronLeft
                className="
                  h-4
                  w-4
                "
              />

              Back to checkout
            </Link>

            <div
              className="
                mt-3
                flex
                items-start
                justify-between
              "
            >
              <div>
                <h1
                  className="
                    text-[29px]
                    font-semibold
                    tracking-[-0.03em]
                    text-[#231817]
                    sm:text-[38px]
                  "
                >
                  Payment Method
                </h1>

                <p
                  className="
                    mt-1
                    text-[11px]
                    text-black/45
                  "
                >
                  Choose your preferred
                  secure payment method.
                </p>
              </div>

              <div
                className="
                  hidden
                  items-center
                  gap-2
                  text-[9px]
                  text-black/50
                  sm:flex
                "
              >
                <ShieldCheck
                  className="
                    h-4
                    w-4
                    text-[#B31345]
                  "
                />

                100% Secure Payments
              </div>
            </div>

            <PaymentStepper />
          </div>
        </section>

        <div
          className="
            mx-auto
            grid
            max-w-[1100px]
            gap-6
            px-4
            py-7
            sm:px-6
            lg:grid-cols-[minmax(0,1fr)_350px]
            lg:px-8
            lg:py-10
          "
        >
          <section
            className="
              rounded-[22px]
              border
              border-[#E6D9D6]
              bg-white
              p-5
              shadow-[0_16px_40px_rgba(55,18,25,.04)]
              sm:p-7
            "
          >
            <PaymentOption
              icon={
                <Smartphone
                  className="
                    h-5
                    w-5
                  "
                />
              }
              title="Pay Online"
              subtitle="UPI, cards, net banking & wallets"
              selected
            />

            <div
              className="
                mt-4
                grid
                gap-2
              "
            >
              <GatewayRow
                icon={
                  <Smartphone />
                }
                title="UPI"
                subtitle="Google Pay, PhonePe, Paytm & more"
              />

              <GatewayRow
                icon={
                  <CreditCard />
                }
                title="Credit / Debit Card"
                subtitle="Visa, Mastercard, RuPay"
              />

              <GatewayRow
                icon={
                  <Landmark />
                }
                title="Net Banking"
                subtitle="All major Indian banks"
              />

              <GatewayRow
                icon={
                  <WalletCards />
                }
                title="Wallets"
                subtitle="Supported wallets through Razorpay"
              />
            </div>

            <div
              className="
                mt-6
                rounded-2xl
                bg-[#FFF7F9]
                p-4
              "
            >
              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-3
                "
              >
                <strong
                  className="
                    text-[11px]
                  "
                >
                  Delivery Address
                </strong>

                <Link
                  href="/account/checkout"
                  className="
                    text-[8px]
                    font-bold
                    uppercase
                    text-[#B31345]
                  "
                >
                  Change
                </Link>
              </div>

              <p
                className="
                  mt-2
                  text-[10px]
                  leading-5
                  text-black/55
                "
              >
                <strong
                  className="
                    text-black
                  "
                >
                  {
                    draft.address.name
                  }
                </strong>

                <br />

                {
                  draft.address.addressLine1
                }

                {draft.address.addressLine2
                  ? `, ${draft.address.addressLine2}`
                  : ""}

                <br />

                {
                  draft.address.city
                }

                ,{" "}
                {
                  draft.address.state
                }{" "}

                {
                  draft.address.postalCode
                }
              </p>
            </div>

            {error && (
              <div
                className="
                  mt-5
                  rounded-xl
                  bg-red-50
                  px-4
                  py-3
                  text-[10px]
                  leading-5
                  text-red-700
                "
              >
                {
                  error
                }
              </div>
            )}

            <button
              type="button"
              disabled={
                paying ||
                !cart
              }
              onClick={() => {
                void startPayment();
              }}
              className="
                mt-6
                hidden
                h-[52px]
                w-full
                cursor-pointer
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-[#B31345]
                text-[11px]
                font-bold
                uppercase
                tracking-[0.05em]
                text-white
                hover:bg-[#931039]
                disabled:opacity-50
                lg:flex
              "
            >
              <ShieldCheck
                className="
                  h-4
                  w-4
                "
              />

              {paying
                ? "Processing..."
                : cart
                  ? `Pay ${money(
                      cart.total
                    )} Securely`
                  : "Loading..."}
            </button>
          </section>

          <aside
            className="
              lg:sticky
              lg:top-[100px]
            "
          >
            <div
              className="
                rounded-[22px]
                border
                border-[#E6D9D6]
                bg-white
                p-5
              "
            >
              <h2
                className="
                  text-lg
                  font-semibold
                "
              >
                Order Summary
              </h2>

              {cart && (
                <>
                  <div
                    className="
                      mt-5
                      space-y-4
                    "
                  >
                    {cart.items
                      .slice(
                        0,
                        3
                      )
                      .map(
                        (
                          item
                        ) => (
                          <div
                            key={
                              item.id ||
                              item.name
                            }
                            className="
                              flex
                              gap-3
                            "
                          >
                            <div
                              className="
                                h-[70px]
                                w-[54px]
                                flex-none
                                overflow-hidden
                                rounded-lg
                                bg-[#F5F0ED]
                              "
                            >
                              {item.image && (
                                <img
                                  src={
                                    item.image
                                  }
                                  alt={
                                    item.name
                                  }
                                  className="
                                    h-full
                                    w-full
                                    object-cover
                                  "
                                />
                              )}
                            </div>

                            <div
                              className="
                                min-w-0
                                flex-1
                              "
                            >
                              <p
                                className="
                                  line-clamp-2
                                  text-[9px]
                                  font-semibold
                                "
                              >
                                {
                                  item.name
                                }
                              </p>

                              <p
                                className="
                                  mt-1
                                  text-[8px]
                                  text-black/40
                                "
                              >
                                Qty:{" "}
                                {
                                  item.quantity
                                }
                              </p>

                              <strong
                                className="
                                  mt-1
                                  block
                                  text-[10px]
                                "
                              >
                                {money(
                                  item.total
                                )}
                              </strong>
                            </div>
                          </div>
                        )
                      )}
                  </div>

                  <div
                    className="
                      my-5
                      border-t
                      border-black/10
                    "
                  />

                  <div
                    className="
                      flex
                      items-center
                      justify-between
                    "
                  >
                    <span
                      className="
                        text-sm
                        font-semibold
                      "
                    >
                      Total
                    </span>

                    <strong
                      className="
                        text-xl
                      "
                    >
                      {money(
                        cart.total
                      )}
                    </strong>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>

        {cart && (
          <div
            className="
              fixed
              inset-x-0
              bottom-0
              z-50
              border-t
              border-[#E6D9D6]
              bg-white/95
              px-4
              pb-[max(14px,env(safe-area-inset-bottom))]
              pt-3
              shadow-[0_-12px_35px_rgba(40,15,20,.08)]
              backdrop-blur
              lg:hidden
            "
          >
            <button
              type="button"
              disabled={
                paying
              }
              onClick={() => {
                void startPayment();
              }}
              className="
                mx-auto
                flex
                h-[50px]
                w-full
                max-w-[600px]
                cursor-pointer
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-[#B31345]
                text-[10px]
                font-bold
                uppercase
                text-white
                disabled:opacity-50
              "
            >
              <ShieldCheck
                className="
                  h-4
                  w-4
                "
              />

              {paying
                ? "Processing..."
                : `Pay ${money(
                    cart.total
                  )} Securely`}
            </button>
          </div>
        )}
      </main>
    </>
  );
}

/* =========================================================
   STEPPER
========================================================= */

function PaymentStepper() {
  return (
    <div
      className="
        mt-7
        flex
        max-w-[560px]
        items-start
      "
    >
      <Step
        label="Address"
        done
      />

      <Connector
        done
      />

      <Step
        label="Payment"
        active
      />

      <Connector />

      <Step
        label="Review"
      />
    </div>
  );
}

function Step({
  label,
  active = false,
  done = false,
}: {
  label: string;
  active?: boolean;
  done?: boolean;
}) {
  return (
    <div
      className="
        flex
        flex-col
        items-center
      "
    >
      <div
        className={`
          flex
          h-7
          w-7
          items-center
          justify-center
          rounded-full
          text-[10px]

          ${
            active ||
            done
              ? "bg-[#B31345] text-white"
              : "border border-black/15 text-black/35"
          }
        `}
      >
        {done ? (
          <Check
            className="
              h-3.5
              w-3.5
            "
          />
        ) : active ? (
          "2"
        ) : (
          "3"
        )}
      </div>

      <span
        className={`
          mt-2
          text-[8px]
          font-semibold

          ${
            active ||
            done
              ? "text-[#B31345]"
              : "text-black/35"
          }
        `}
      >
        {
          label
        }
      </span>
    </div>
  );
}

function Connector({
  done = false,
}: {
  done?: boolean;
}) {
  return (
    <div
      className={`
        mt-[13px]
        h-px
        flex-1

        ${
          done
            ? "bg-[#B31345]"
            : "bg-black/10"
        }
      `}
    />
  );
}

/* =========================================================
   PAYMENT OPTION
========================================================= */

function PaymentOption({
  icon,
  title,
  subtitle,
  selected,
}: {
  icon:
    React.ReactNode;

  title: string;

  subtitle: string;

  selected: boolean;
}) {
  return (
    <div
      className={`
        flex
        items-center
        gap-3
        rounded-2xl
        border
        p-4

        ${
          selected
            ? "border-[#B31345] bg-[#FFF5F7]"
            : "border-black/10"
        }
      `}
    >
      <span
        className="
          flex
          h-9
          w-9
          items-center
          justify-center
          rounded-full
          bg-[#B31345]
          text-white
        "
      >
        {
          icon
        }
      </span>

      <div
        className="
          flex-1
        "
      >
        <strong
          className="
            block
            text-[11px]
          "
        >
          {
            title
          }
        </strong>

        <span
          className="
            mt-1
            block
            text-[8px]
            text-black/45
          "
        >
          {
            subtitle
          }
        </span>
      </div>

      <Check
        className="
          h-5
          w-5
          text-[#B31345]
        "
      />
    </div>
  );
}

/* =========================================================
   GATEWAY ROW
========================================================= */

function GatewayRow({
  icon,
  title,
  subtitle,
}: {
  icon:
    React.ReactNode;

  title: string;

  subtitle: string;
}) {
  return (
    <div
      className="
        flex
        items-center
        gap-3
        rounded-xl
        border
        border-black/10
        px-4
        py-3
      "
    >
      <span
        className="
          [&>svg]:h-4
          [&>svg]:w-4
          [&>svg]:text-black/60
        "
      >
        {
          icon
        }
      </span>

      <div>
        <p
          className="
            text-[10px]
            font-medium
          "
        >
          {
            title
          }
        </p>

        <p
          className="
            mt-0.5
            text-[8px]
            text-black/40
          "
        >
          {
            subtitle
          }
        </p>
      </div>
    </div>
  );
}