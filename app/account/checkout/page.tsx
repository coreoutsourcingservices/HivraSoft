"use client";

import Link from "next/link";

import {
  loadRazorpayScript,
  razorpayFailureMessage,
} from "@/lib/razorpay-loader";


import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  Check,
  ChevronRight,
  CreditCard,
  MapPin,
  Package,
  Plus,
  ShieldCheck,
  Sparkles,
  Truck,
  WalletCards,
} from "lucide-react";

import Header from "@/src/components/Header/Header";

import AddressModal from "@/src/components/Checkout/AddressModal";

import {
  clearCheckoutDraft,
  createCheckoutAddress,
  createCodOrder,
  createRazorpayOrder,
  getCheckoutAddresses,
  getCheckoutCart,
  previewDeliveryCharge,
  saveLastOrder,
  setDefaultCheckoutAddress,
  verifyRazorpayPayment,
  type CheckoutAddress,
  type CheckoutCart,
  type PaymentMethod,
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
  key:
    string;

  amount:
    number;

  currency:
    string;

  name:
    string;

  description:
    string;

  order_id:
    string;

  prefill?: {
    name?:
      string;

    email?:
      string;

    contact?:
      string;
  };

  theme?: {
    color?:
      string;
  };

  handler: (
    response:
      RazorpaySuccessResponse
  ) => void;

  modal?: {
    ondismiss?:
      () => void;
  };
};

type RazorpayInstance = {
  open:
    () => void;

  on?: (
    event:
      string,

    callback: (
      response:
        unknown
    ) => void
  ) => void;
};

declare global {
  interface Window {
    Razorpay?: new (
      options:
        RazorpayOptions
    ) =>
      RazorpayInstance;
  }
}

/* =========================================================
   EMPTY ADDRESS
========================================================= */

const EMPTY_ADDRESS: Omit<
  CheckoutAddress,
  "id"
> = {
  name: "",

  phone: "",

  alternatePhone: "",

  homeNumber: "",

  officeNumber: "",

  addressLine1: "",

  addressLine2: "",

  landmark: "",

  city: "",

  district: "",

  state: "",

  postalCode: "",

  country: "India",

  countryCode: "IN",

  addressType:
    "home",

  isDefault:
    false,

  isShippingAddress:
    true,

  isBillingAddress:
    true,

  instructions: "",
};

/* =========================================================
   MONEY
========================================================= */

function money(
  amount: number
) {
  return `₹${Math.max(
    0,
    Number(amount) || 0
  ).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits:
        2,
    }
  )}`;
}

/* =========================================================
   CHECKOUT PAGE
========================================================= */

export default function CheckoutPage() {
  const router =
    useRouter();

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    cart,
    setCart,
  ] =
    useState<
      CheckoutCart | null
    >(null);

  const [
    addresses,
    setAddresses,
  ] =
    useState<
      CheckoutAddress[]
    >([]);

  const [
    selectedAddressId,
    setSelectedAddressId,
  ] =
    useState("");

  const [
    paymentMethod,
    setPaymentMethod,
  ] =
    useState<
      PaymentMethod
    >("online");

  const [
    deliveryCharge,
    setDeliveryCharge,
  ] =
    useState(0);

  const [
    previewTotal,
    setPreviewTotal,
  ] =
    useState(0);

  const [
    deliveryLoading,
    setDeliveryLoading,
  ] =
    useState(false);

  const [
    addressModalOpen,
    setAddressModalOpen,
  ] =
    useState(false);

  const [
    addressForm,
    setAddressForm,
  ] =
    useState<
      Omit<
        CheckoutAddress,
        "id"
      >
    >({
      ...EMPTY_ADDRESS,
    });

  const [
    addressSaving,
    setAddressSaving,
  ] =
    useState(false);

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  /* =======================================================
     LOAD CHECKOUT
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

          setError("");

          const [
            cartData,
            addressData,
          ] =
            await Promise.all([
              getCheckoutCart(),

              getCheckoutAddresses(),
            ]);

          if (
            cancelled
          ) {
            return;
          }

          setCart(
            cartData
          );

          setAddresses(
            addressData
          );

          const preferredAddress =
            addressData.find(
              (
                address
              ) =>
                address.isDefault
            ) ||
            addressData[0];

          if (
            preferredAddress
          ) {
            setSelectedAddressId(
              preferredAddress.id
            );
          }
        } catch (
          loadError
        ) {
          console.error(
            "CHECKOUT LOAD ERROR:",
            loadError
          );

          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load checkout."
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
  }, []);

  /* =======================================================
     DELIVERY CHARGE PREVIEW
  ======================================================= */

  useEffect(() => {
    if (!cart) {
      return;
    }

    let cancelled =
      false;

    const loadDelivery =
      async () => {
        try {
          setDeliveryLoading(
            true
          );

          const preview =
            await previewDeliveryCharge(
              paymentMethod
            );

          if (
            cancelled
          ) {
            return;
          }

          setDeliveryCharge(
            preview.charge
          );

          setPreviewTotal(
            preview.total
          );
        } catch (
          previewError
        ) {
          console.error(
            "DELIVERY PREVIEW ERROR:",
            previewError
          );

          if (
            !cancelled
          ) {
            setDeliveryCharge(
              0
            );

            setPreviewTotal(
              0
            );
          }
        } finally {
          if (
            !cancelled
          ) {
            setDeliveryLoading(
              false
            );
          }
        }
      };

    void loadDelivery();

    return () => {
      cancelled =
        true;
    };
  }, [
    cart,
    paymentMethod,
  ]);

  /* =======================================================
     SELECTED ADDRESS
  ======================================================= */

  const selectedAddress =
    useMemo(
      () =>
        addresses.find(
          (
            address
          ) =>
            address.id ===
            selectedAddressId
        ) ||
        null,

      [
        addresses,
        selectedAddressId,
      ]
    );

  /* =======================================================
     FINAL TOTAL
  ======================================================= */

  const finalTotal =
    useMemo(() => {
      if (!cart) {
        return 0;
      }

      /*
       * Backend preview total authoritative hai.
       */
      if (
        previewTotal >
        0
      ) {
        return previewTotal;
      }

      /*
       * Otherwise old shipping remove karke
       * selected payment charge add karte hain.
       */
      return Math.max(
        0,

        cart.total -
          cart.shipping +
          deliveryCharge
      );
    }, [
      cart,
      deliveryCharge,
      previewTotal,
    ]);

  /* =======================================================
     TAX LABEL
  ======================================================= */

  const taxLabel =
    useMemo(() => {
      if (
        !cart?.taxSummary
      ) {
        return "Tax";
      }

      const percentage =
        cart.taxSummary
          .percentage;

      if (
        percentage >
        0
      ) {
        return `${cart.taxSummary.name} (${percentage}%)`;
      }

      return (
        cart.taxSummary
          .name ||
        "Tax"
      );
    }, [
      cart,
    ]);

  /* =======================================================
     RELOAD ADDRESSES
  ======================================================= */

  const reloadAddresses =
    async () => {
      const list =
        await getCheckoutAddresses();

      setAddresses(
        list
      );

      return list;
    };

  /* =======================================================
     OPEN ADDRESS MODAL
  ======================================================= */

  const openAddressModal =
    () => {
      setError("");

      setAddressForm({
        ...EMPTY_ADDRESS,
      });

      setAddressModalOpen(
        true
      );
    };

  /* =======================================================
     SAVE ADDRESS
  ======================================================= */

  const saveAddress =
    async () => {
      setError("");

      /* ===================================================
         NAME
      =================================================== */

      if (
        !addressForm.name.trim()
      ) {
        setError(
          "Please enter your full name."
        );

        return;
      }

      /* ===================================================
         PHONE
      =================================================== */

      const phoneDigits =
        addressForm.phone.replace(
          /\D/g,
          ""
        );

      if (
        phoneDigits.length <
        10
      ) {
        setError(
          "Please enter a valid 10 digit phone number."
        );

        return;
      }

      /* ===================================================
         ADDRESS
      =================================================== */

      if (
        !addressForm.addressLine1.trim()
      ) {
        setError(
          "Please enter your complete address."
        );

        return;
      }

      /* ===================================================
         CITY
      =================================================== */

      if (
        !addressForm.city.trim()
      ) {
        setError(
          "Please enter your city."
        );

        return;
      }

      /* ===================================================
         STATE
      =================================================== */

      if (
        !addressForm.state.trim()
      ) {
        setError(
          "Please enter your state."
        );

        return;
      }

      /* ===================================================
         PINCODE
      =================================================== */

      if (
        addressForm.postalCode
          .replace(
            /\D/g,
            ""
          )
          .length !==
        6
      ) {
        setError(
          "Please enter a valid 6 digit pincode."
        );

        return;
      }

      /* ===================================================
         SAVE
      =================================================== */

      try {
        setAddressSaving(
          true
        );

        const created =
          await createCheckoutAddress(
            addressForm
          );

        /* =================================================
           IMMEDIATELY SHOW CREATED ADDRESS
        ================================================= */

        setAddresses(
          (
            current
          ) => {
            const withoutCreated =
              current.filter(
                (
                  address
                ) =>
                  address.id !==
                  created.id
              );

            if (
              created.isDefault
            ) {
              return [
                created,

                ...withoutCreated.map(
                  (
                    address
                  ) => ({
                    ...address,

                    isDefault:
                      false,
                  })
                ),
              ];
            }

            return [
              ...withoutCreated,

              created,
            ];
          }
        );

        setSelectedAddressId(
          created.id
        );

        /* =================================================
           RELOAD REAL BACKEND DATA
        ================================================= */

        const latestAddresses =
          await reloadAddresses();

        const selected =
          latestAddresses.find(
            (
              address
            ) =>
              address.id ===
              created.id
          ) ||
          latestAddresses.find(
            (
              address
            ) =>
              address.isDefault
          ) ||
          latestAddresses[0];

        if (
          selected
        ) {
          setSelectedAddressId(
            selected.id
          );
        }

        setAddressForm({
          ...EMPTY_ADDRESS,
        });

        setAddressModalOpen(
          false
        );

        setError("");
      } catch (
        saveError
      ) {
        console.error(
          "SAVE ADDRESS ERROR:",
          saveError
        );

        setError(
          saveError instanceof
            Error
            ? saveError.message
            : "Unable to save address."
        );
      } finally {
        setAddressSaving(
          false
        );
      }
    };

  /* =======================================================
     SET DEFAULT
  ======================================================= */

  const makeDefault =
    async (
      addressId: string
    ) => {
      try {
        setError("");

        await setDefaultCheckoutAddress(
          addressId
        );

        const list =
          await reloadAddresses();

        setAddresses(
          list
        );

        setSelectedAddressId(
          addressId
        );
      } catch (
        defaultError
      ) {
        console.error(
          "DEFAULT ADDRESS ERROR:",
          defaultError
        );

        setError(
          defaultError instanceof
            Error
            ? defaultError.message
            : "Unable to set default address."
        );
      }
    };

  /* =======================================================
     CHECKOUT ACTION
  ======================================================= */

  const continueCheckout =
    async () => {
      if (!cart) {
        return;
      }

      setError("");

      /* ===================================================
         EMPTY CART
      =================================================== */

      if (
        cart.items.length ===
        0
      ) {
        setError(
          "Your shopping bag is empty."
        );

        return;
      }

      /* ===================================================
         ADDRESS
      =================================================== */

      if (
        !selectedAddress
      ) {
        setError(
          "Please add or select a delivery address."
        );

        return;
      }

      /* ===================================================
         ONLINE PAYMENT
         DIRECT RAZORPAY FROM CHECKOUT
      =================================================== */

      if (
        paymentMethod ===
        "online"
      ) {
        try {
          setSubmitting(
            true
          );

          setError(
            ""
          );

          const loaded =
            await loadRazorpayScript();

          if (
            !loaded ||
            !window.Razorpay
          ) {
            throw new Error(
              "Unable to load the payment gateway. Please check your connection and try again."
            );
          }

          const paymentOrder =
            await createRazorpayOrder(
              selectedAddress
            );

          const key =
            paymentOrder.key ||
            process.env
              .NEXT_PUBLIC_RAZORPAY_KEY_ID ||
            "";

          if (
            !paymentOrder
              .razorpayOrderId
          ) {
            throw new Error(
              "Razorpay order ID was not returned by server."
            );
          }

          if (
            !key
          ) {
            throw new Error(
              "Razorpay public key is not configured."
            );
          }

          const instance =
            new window.Razorpay({
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
                  selectedAddress.name,

                contact:
                  selectedAddress.phone,
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

                          internalOrderId:
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
                    console.error(
                      "RAZORPAY VERIFY ERROR:",
                      verifyError
                    );

                    setSubmitting(
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
                    setSubmitting(
                      false
                    );
                  },
              },
            });

          instance.on?.(
            "payment.failed",
            (
              response
            ) => {
              setSubmitting(
                false
              );

              setError(
                razorpayFailureMessage(
                  response
                )
              );
            }
          );

          instance.open();

          return;
        } catch (
          paymentError
        ) {
          console.error(
            "START RAZORPAY ERROR:",
            paymentError
          );

          setSubmitting(
            false
          );

          setError(
            paymentError instanceof
              Error
              ? paymentError.message
              : "Unable to start payment."
          );

          return;
        }
      }

      /* ===================================================
         COD
      =================================================== */

      try {
        setSubmitting(
          true
        );

        const order =
          await createCodOrder(
            selectedAddress
          );

        saveLastOrder(
          order
        );

        /*
         * Header cart count refresh.
         */

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

        const query =
          order.id
            ? `?orderId=${encodeURIComponent(
                order.id
              )}`
            : "";

        router.replace(
          `/account/thanks${query}`
        );
      } catch (
        orderError
      ) {
        console.error(
          "CREATE ORDER ERROR:",
          orderError
        );

        setError(
          orderError instanceof
            Error
            ? orderError.message
            : "Unable to place order."
        );
      } finally {
        setSubmitting(
          false
        );
      }
    };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <>
        <Header />

        <CheckoutLoading />
      </>
    );
  }

  /* =======================================================
     EMPTY CART
  ======================================================= */

  if (
    !cart ||
    cart.items.length ===
      0
  ) {
    return (
      <>
        <Header />

        <main
          className="
            flex
            min-h-[75vh]

            items-center
            justify-center

            bg-[#F9F5F2]

            px-5
          "
        >
          <div
            className="
              w-full
              max-w-[430px]

              rounded-[28px]

              border
              border-[#EADCD7]

              bg-white

              px-6
              py-10

              text-center

              shadow-[0_24px_80px_rgba(65,30,25,0.08)]
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

                bg-[#FBECEF]

                text-[#B31345]
              "
            >
              <Package
                className="
                  h-8
                  w-8
                "
              />
            </div>

            <h1
              className="
                mt-5

                text-2xl
                font-semibold
              "
            >
              Your bag is empty
            </h1>

            <p
              className="
                mt-2

                text-sm

                text-black/45
              "
            >
              Add your favourite products and
              come back to checkout.
            </p>

            <Link
              href="/women"
              className="
                mt-6

                inline-flex

                h-12

                items-center
                justify-center

                rounded-full

                bg-[#B31345]

                px-8

                text-[11px]
                font-bold

                uppercase

                tracking-[0.08em]

                text-white

                transition

                hover:bg-[#951039]
              "
            >
              Continue Shopping
            </Link>
          </div>
        </main>
      </>
    );
  }

  /* =======================================================
     MAIN PAGE
  ======================================================= */

  return (
    <>
      <Header />

      <main
        className="
          min-h-screen

          bg-[#F8F4F1]

          pb-28

          text-[#211817]

          lg:pb-16
        "
      >
        {/* =================================================
            PAGE HEADER
        ================================================= */}

        <section
          className="
            border-b
            border-[#EADDD8]

            bg-[#FFFDFC]
          "
        >
          <div
            className="
              mx-auto

              max-w-[1320px]

              px-4
              py-7

              sm:px-6

              lg:px-8
              lg:py-9
            "
          >
            <div
              className="
                flex

                items-start
                justify-between

                gap-4
              "
            >
              <div>
                <div
                  className="
                    flex

                    items-center

                    gap-2
                  "
                >
                  <span
                    className="
                      h-px
                      w-7

                      bg-[#B31345]
                    "
                  />

                  <span
                    className="
                      text-[9px]
                      font-bold

                      uppercase

                      tracking-[0.22em]

                      text-[#B31345]
                    "
                  >
                    Secure Checkout
                  </span>
                </div>

                <h1
                  className="
                    mt-2

                    text-[30px]
                    font-semibold

                    tracking-[-0.04em]

                    sm:text-[40px]
                  "
                >
                  Complete your order
                </h1>

                <p
                  className="
                    mt-1

                    max-w-[500px]

                    text-[11px]
                    leading-5

                    text-black/45

                    sm:text-[12px]
                  "
                >
                  Select your delivery address,
                  payment method and review your
                  bag.
                </p>
              </div>

              <div
                className="
                  hidden

                  rounded-full

                  bg-[#F8EDEE]

                  px-4
                  py-2

                  text-[10px]
                  font-medium

                  text-[#85213D]

                  sm:flex
                  sm:items-center
                  sm:gap-2
                "
              >
                <ShieldCheck
                  className="
                    h-4
                    w-4
                  "
                />

                100% Secure
              </div>
            </div>

            <CheckoutSteps />
          </div>
        </section>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div
          className="
            mx-auto

            grid

            max-w-[1320px]

            gap-6

            px-4
            py-6

            sm:px-6

            lg:grid-cols-[minmax(0,1fr)_390px]

            lg:px-8
            lg:py-9
          "
        >
          {/* =================================================
              LEFT COLUMN
          ================================================= */}

          <div
            className="
              min-w-0

              space-y-5
            "
          >
            {/* ===============================================
                DELIVERY ADDRESS
            =============================================== */}

            <CheckoutCard
              number="01"
              title="Delivery Address"
              subtitle="Where should we deliver your order?"
              icon={
                <MapPin />
              }
              action={
                <button
                  type="button"
                  onClick={
                    openAddressModal
                  }
                  className="
                    flex

                    cursor-pointer

                    items-center

                    gap-1.5

                    rounded-full

                    border
                    border-[#DDBCC5]

                    bg-[#FFF8FA]

                    px-3
                    py-2

                    text-[9px]
                    font-bold

                    uppercase

                    tracking-[0.07em]

                    text-[#B31345]

                    transition

                    hover:border-[#B31345]
                    hover:bg-[#FCEEF2]
                  "
                >
                  <Plus
                    className="
                      h-3.5
                      w-3.5
                    "
                  />

                  Add Address
                </button>
              }
            >
              {addresses.length >
              0 ? (
                <div
                  className="
                    grid

                    gap-3

                    md:grid-cols-2
                  "
                >
                  {addresses.map(
                    (
                      address
                    ) => (
                      <AddressCard
                        key={
                          address.id
                        }
                        address={
                          address
                        }
                        selected={
                          selectedAddressId ===
                          address.id
                        }
                        onSelect={() => {
                          setSelectedAddressId(
                            address.id
                          );

                          setError("");
                        }}
                        onDefault={() => {
                          void makeDefault(
                            address.id
                          );
                        }}
                      />
                    )
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={
                    openAddressModal
                  }
                  className="
                    group

                    flex

                    min-h-[170px]

                    w-full

                    cursor-pointer

                    flex-col

                    items-center
                    justify-center

                    rounded-[20px]

                    border
                    border-dashed
                    border-[#DDB7C2]

                    bg-gradient-to-br
                    from-[#FFF9FA]
                    to-[#FFF4F6]

                    px-6

                    text-center

                    transition

                    hover:border-[#B31345]

                    hover:shadow-[0_12px_35px_rgba(179,19,69,0.08)]
                  "
                >
                  <span
                    className="
                      flex

                      h-12
                      w-12

                      items-center
                      justify-center

                      rounded-full

                      bg-white

                      text-[#B31345]

                      shadow-sm
                    "
                  >
                    <MapPin
                      className="
                        h-6
                        w-6
                      "
                    />
                  </span>

                  <strong
                    className="
                      mt-3

                      text-[13px]
                    "
                  >
                    Add your delivery address
                  </strong>

                  <span
                    className="
                      mt-1

                      text-[10px]

                      text-black/40
                    "
                  >
                    Add an address to continue
                    checkout
                  </span>
                </button>
              )}
            </CheckoutCard>

            {/* ===============================================
                PAYMENT METHOD
            =============================================== */}

            <CheckoutCard
              number="02"
              title="Payment Method"
              subtitle="Choose how you want to pay."
              icon={
                <CreditCard />
              }
            >
              <div
                className="
                  grid

                  gap-3

                  md:grid-cols-2
                "
              >
                <PaymentCard
                  active={
                    paymentMethod ===
                    "online"
                  }
                  icon={
                    <WalletCards />
                  }
                  title="Pay Online"
                  subtitle="UPI, cards, net banking & wallets"
                  onClick={() => {
                    setPaymentMethod(
                      "online"
                    );

                    setError("");
                  }}
                />

                <PaymentCard
                  active={
                    paymentMethod ===
                    "cod"
                  }
                  icon={
                    <span
                      className="
                        text-lg
                        font-bold
                      "
                    >
                      ₹
                    </span>
                  }
                  title="Cash on Delivery"
                  subtitle={
                    deliveryLoading
                      ? "Checking COD charge..."
                      : deliveryCharge >
                          0
                        ? `${money(
                            deliveryCharge
                          )} COD charge`
                        : "Pay when your order arrives"
                  }
                  onClick={() => {
                    setPaymentMethod(
                      "cod"
                    );

                    setError("");
                  }}
                />
              </div>

              <div
                className="
                  mt-4

                  flex

                  items-start

                  gap-3

                  rounded-[16px]

                  border
                  border-[#F5E1E7]

                  bg-[#FFF5F7]

                  px-4
                  py-3
                "
              >
                <Truck
                  className="
                    mt-0.5

                    h-4
                    w-4

                    flex-none

                    text-[#B31345]
                  "
                />

                <p
                  className="
                    text-[9px]
                    leading-5

                    text-[#6C3A48]
                  "
                >
                  {paymentMethod ===
                  "cod"
                    ? deliveryLoading
                      ? "Checking applicable Cash on Delivery charge..."
                      : deliveryCharge >
                          0
                        ? `Cash on Delivery selected. Applicable COD charge is ${money(
                            deliveryCharge
                          )}.`
                        : "Cash on Delivery selected. No COD charge is applicable for this order."
                    : "Online payment will open Razorpay securely from checkout."}
                </p>
              </div>
            </CheckoutCard>

            {/* ===============================================
                BAG
            =============================================== */}

            <CheckoutCard
              number="03"
              title={`Your Bag (${cart.items.length})`}
              subtitle="Review your selected products."
              icon={
                <Package />
              }
              action={
                <Link
                  href="/cart"
                  className="
                    rounded-full

                    border
                    border-[#E1C7CE]

                    px-3
                    py-2

                    text-[9px]
                    font-bold

                    uppercase

                    tracking-[0.07em]

                    text-[#B31345]

                    transition

                    hover:bg-[#FFF5F7]
                  "
                >
                  Edit Bag
                </Link>
              }
            >
              <div
                className="
                  divide-y
                  divide-black/[0.07]
                "
              >
                {cart.items.map(
                  (
                    item
                  ) => (
                    <article
                      key={
                        item.id ||
                        `${item.productId}-${item.colorId}-${item.sizeId}`
                      }
                      className="
                        flex

                        gap-4

                        py-5

                        first:pt-0

                        last:pb-0
                      "
                    >
                      {/* IMAGE */}

                      <Link
                        href={
                          item.slug
                            ? `/product/${encodeURIComponent(
                                item.slug
                              )}`
                            : "#"
                        }
                        className="
                          relative

                          h-[124px]
                          w-[94px]

                          flex-none

                          overflow-hidden

                          rounded-[16px]

                          border
                          border-[#EEE4E1]

                          bg-[#F6F1EE]

                          sm:h-[138px]
                          sm:w-[106px]
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
                              h-full
                              w-full

                              object-cover
                              object-center

                              transition-transform
                              duration-500

                              hover:scale-[1.03]
                            "
                          />
                        ) : (
                          <div
                            className="
                              flex

                              h-full
                              w-full

                              items-center
                              justify-center

                              p-3

                              text-center

                              text-[8px]

                              text-black/25
                            "
                          >
                            No product image
                          </div>
                        )}
                      </Link>

                      {/* DETAILS */}

                      <div
                        className="
                          flex

                          min-w-0
                          flex-1

                          flex-col
                        "
                      >
                        <Link
                          href={
                            item.slug
                              ? `/product/${encodeURIComponent(
                                  item.slug
                                )}`
                              : "#"
                          }
                          className="
                            line-clamp-2

                            text-[12px]
                            font-semibold

                            leading-5

                            text-[#211817]

                            transition

                            hover:text-[#B31345]

                            sm:text-[13px]
                          "
                        >
                          {
                            item.name
                          }
                        </Link>

                        <div
                          className="
                            mt-2

                            flex
                            flex-wrap

                            gap-1.5
                          "
                        >
                          {item.colorName && (
                            <ProductMeta
                              label={`Color: ${item.colorName}`}
                            />
                          )}

                          {item.sizeLabel && (
                            <ProductMeta
                              label={`Size: ${item.sizeLabel}`}
                            />
                          )}

                          <ProductMeta
                            label={`Qty: ${item.quantity}`}
                          />
                        </div>

                        <div
                          className="
                            mt-auto

                            flex

                            items-end
                            justify-between

                            gap-3

                            pt-3
                          "
                        >
                          <span
                            className="
                              text-[9px]

                              text-black/40
                            "
                          >
                            {money(
                              item.price
                            )}{" "}
                            each
                          </span>

                          <strong
                            className="
                              text-[15px]

                              text-black

                              sm:text-[16px]
                            "
                          >
                            {money(
                              item.total
                            )}
                          </strong>
                        </div>
                      </div>
                    </article>
                  )
                )}
              </div>
            </CheckoutCard>

            {/* ===============================================
                ERROR
            =============================================== */}

            {error &&
              !addressModalOpen && (
              <div
                className="
                  rounded-[16px]

                  border
                  border-red-200

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
          </div>

          {/* =================================================
              ORDER SUMMARY
          ================================================= */}

          <aside
            className="
              min-w-0
            "
          >
            <div
              className="
                overflow-hidden

                rounded-[28px]

                border
                border-[#E6D8D4]

                bg-white

                shadow-[0_25px_70px_rgba(58,25,21,0.07)]

                lg:sticky
                lg:top-[100px]
              "
            >
              <div
                className="
                  h-[5px]

                  bg-gradient-to-r
                  from-[#71102F]
                  via-[#B31345]
                  to-[#E987A6]
                "
              />

              <div
                className="
                  p-5

                  sm:p-6
                "
              >
                <div
                  className="
                    flex

                    items-start
                    justify-between

                    gap-4
                  "
                >
                  <div>
                    <p
                      className="
                        text-[8px]
                        font-bold

                        uppercase

                        tracking-[0.18em]

                        text-[#B31345]
                      "
                    >
                      Your Order
                    </p>

                    <h2
                      className="
                        mt-1

                        text-[22px]
                        font-semibold

                        tracking-[-0.02em]
                      "
                    >
                      Order Summary
                    </h2>
                  </div>

                  <span
                    className="
                      flex

                      h-10
                      w-10

                      items-center
                      justify-center

                      rounded-full

                      bg-[#F9EDEF]

                      text-[#B31345]
                    "
                  >
                    <ShieldCheck
                      className="
                        h-5
                        w-5
                      "
                    />
                  </span>
                </div>

                {/* =========================================
                    MINI ITEMS
                ========================================= */}

                <div
                  className="
                    mt-5

                    space-y-3
                  "
                >
                  {cart.items
                    .slice(
                      0,
                      2
                    )
                    .map(
                      (
                        item
                      ) => (
                        <div
                          key={`summary-${item.id}-${item.colorId}-${item.sizeId}`}
                          className="
                            flex

                            items-center

                            gap-3

                            rounded-[14px]

                            bg-[#FAF7F5]

                            p-2.5
                          "
                        >
                          <div
                            className="
                              h-14
                              w-11

                              flex-none

                              overflow-hidden

                              rounded-[9px]

                              bg-white
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
                                  h-full
                                  w-full

                                  object-cover
                                "
                              />
                            ) : (
                              <div
                                className="
                                  h-full
                                  w-full

                                  bg-[#F0EAE7]
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
                                truncate

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
                              Qty{" "}
                              {
                                item.quantity
                              }
                            </p>
                          </div>

                          <strong
                            className="
                              text-[10px]
                            "
                          >
                            {money(
                              item.total
                            )}
                          </strong>
                        </div>
                      )
                    )}
                </div>

                {cart.items.length >
                  2 && (
                  <p
                    className="
                      mt-2

                      text-center

                      text-[8px]

                      text-black/35
                    "
                  >
                    +
                    {cart.items.length -
                      2}{" "}
                    more item
                    {cart.items.length -
                      2 >
                    1
                      ? "s"
                      : ""}
                  </p>
                )}

                <div
                  className="
                    my-5

                    border-t
                    border-black/[0.08]
                  "
                />

                {/* =========================================
                    PRICE BREAKDOWN
                ========================================= */}

                <div
                  className="
                    space-y-3.5
                  "
                >
                  <SummaryRow
                    label="Subtotal"
                    value={money(
                      cart.subtotal
                    )}
                  />

                  {cart.discount >
                    0 && (
                    <SummaryRow
                      label="Discount"
                      value={`-${money(
                        cart.discount
                      )}`}
                      green
                    />
                  )}

                  {cart.tax >
                    0 && (
                    <SummaryRow
                      label={
                        taxLabel
                      }
                      value={money(
                        cart.tax
                      )}
                    />
                  )}

                  <SummaryRow
                    label={
                      paymentMethod ===
                      "cod"
                        ? "COD Charges"
                        : "Delivery"
                    }
                    value={
                      deliveryLoading
                        ? "Checking..."
                        : deliveryCharge >
                            0
                          ? money(
                              deliveryCharge
                            )
                          : "FREE"
                    }
                    green={
                      !deliveryLoading &&
                      deliveryCharge ===
                        0
                    }
                  />
                </div>

                <div
                  className="
                    my-5

                    h-px

                    bg-black/[0.08]
                  "
                />

                {/* =========================================
                    TOTAL
                ========================================= */}

                <div
                  className="
                    flex

                    items-end
                    justify-between

                    gap-4
                  "
                >
                  <div>
                    <p
                      className="
                        text-[14px]
                        font-semibold
                      "
                    >
                      Total
                    </p>

                    <p
                      className="
                        mt-1

                        text-[8px]

                        text-black/40
                      "
                    >
                      Inclusive of applicable
                      taxes
                    </p>
                  </div>

                  <strong
                    className="
                      text-[27px]

                      tracking-[-0.03em]
                    "
                  >
                    {money(
                      finalTotal
                    )}
                  </strong>
                </div>

                {/* =========================================
                    SAVINGS
                ========================================= */}

                {cart.discount >
                  0 && (
                  <div
                    className="
                      mt-5

                      flex

                      items-center

                      gap-2

                      rounded-[14px]

                      bg-emerald-50

                      px-3
                      py-2.5
                    "
                  >
                    <Sparkles
                      className="
                        h-4
                        w-4

                        text-emerald-700
                      "
                    />

                    <span
                      className="
                        text-[9px]
                        font-medium

                        text-emerald-800
                      "
                    >
                      You saved{" "}
                      {money(
                        cart.discount
                      )}{" "}
                      on this order.
                    </span>
                  </div>
                )}

                {/* =========================================
                    DESKTOP CTA
                ========================================= */}

                <button
                  type="button"
                  disabled={
                    submitting ||
                    deliveryLoading ||
                    !selectedAddress
                  }
                  onClick={() => {
                    void continueCheckout();
                  }}
                  className="
                    mt-6

                    hidden

                    h-[54px]

                    w-full

                    cursor-pointer

                    items-center
                    justify-center

                    gap-2

                    rounded-full

                    bg-[#B31345]

                    text-[10px]
                    font-bold

                    uppercase

                    tracking-[0.08em]

                    text-white

                    shadow-[0_12px_28px_rgba(179,19,69,0.22)]

                    transition

                    hover:bg-[#961039]

                    hover:shadow-[0_15px_35px_rgba(179,19,69,0.28)]

                    disabled:cursor-not-allowed
                    disabled:opacity-45

                    lg:flex
                  "
                >
                  {submitting
                    ? "Placing Order..."
                    : paymentMethod ===
                        "cod"
                      ? `Place Order • ${money(
                          finalTotal
                        )}`
                      : `Continue To Payment • ${money(
                          finalTotal
                        )}`}

                  {!submitting && (
                    <ChevronRight
                      className="
                        h-4
                        w-4
                      "
                    />
                  )}
                </button>

                <div
                  className="
                    mt-4

                    hidden

                    items-center
                    justify-center

                    gap-2

                    text-[8px]

                    text-black/35

                    lg:flex
                  "
                >
                  <ShieldCheck
                    className="
                      h-3.5
                      w-3.5
                    "
                  />

                  Secure & encrypted checkout
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* =================================================
            MOBILE FIXED CTA
        ================================================= */}

        <div
          className="
            fixed

            inset-x-0
            bottom-0

            z-[70]

            border-t
            border-[#E8DCD8]

            bg-white/95

            px-4

            pb-[max(13px,env(safe-area-inset-bottom))]
            pt-3

            shadow-[0_-14px_40px_rgba(45,20,18,0.10)]

            backdrop-blur-xl

            lg:hidden
          "
        >
          <div
            className="
              mx-auto

              flex

              max-w-[650px]

              items-center

              gap-3
            "
          >
            <div
              className="
                min-w-[90px]
              "
            >
              <span
                className="
                  block

                  text-[8px]

                  uppercase

                  tracking-[0.12em]

                  text-black/40
                "
              >
                Total
              </span>

              <strong
                className="
                  mt-0.5

                  block

                  text-[18px]
                "
              >
                {money(
                  finalTotal
                )}
              </strong>
            </div>

            <button
              type="button"
              disabled={
                submitting ||
                deliveryLoading ||
                !selectedAddress
              }
              onClick={() => {
                void continueCheckout();
              }}
              className="
                flex

                h-[52px]

                min-w-0
                flex-1

                cursor-pointer

                items-center
                justify-center

                gap-1

                rounded-full

                bg-[#B31345]

                px-3

                text-[10px]
                font-bold

                uppercase

                tracking-[0.05em]

                text-white

                shadow-[0_8px_22px_rgba(179,19,69,0.22)]

                disabled:cursor-not-allowed
                disabled:opacity-45
              "
            >
              {submitting
                ? "Please Wait..."
                : paymentMethod ===
                    "cod"
                  ? "Place Order"
                  : "Continue To Payment"}

              {!submitting && (
                <ChevronRight
                  className="
                    h-4
                    w-4
                  "
                />
              )}
            </button>
          </div>
        </div>

        {/* =================================================
            ADDRESS MODAL
        ================================================= */}

        {addressModalOpen && (
          <AddressModal
            value={
              addressForm
            }
            onChange={
              setAddressForm
            }
            saving={
              addressSaving
            }
            error={
              error
            }
            onSave={() => {
              void saveAddress();
            }}
            onClose={() => {
              if (
                addressSaving
              ) {
                return;
              }

              setAddressModalOpen(
                false
              );

              setError("");

              setAddressForm({
                ...EMPTY_ADDRESS,
              });
            }}
          />
        )}
      </main>
    </>
  );
}

/* =========================================================
   CHECKOUT STEPS
========================================================= */

function CheckoutSteps() {
  return (
    <div
      className="
        mt-7

        flex

        max-w-[540px]

        items-start
      "
    >
      <Step
        number="1"
        label="Address"
        active
      />

      <StepLine />

      <Step
        number="2"
        label="Payment"
      />

      <StepLine />

      <Step
        number="3"
        label="Review"
      />
    </div>
  );
}

/* =========================================================
   STEP
========================================================= */

function Step({
  number,
  label,
  active = false,
}: {
  number: string;

  label: string;

  active?: boolean;
}) {
  return (
    <div
      className="
        flex

        flex-col

        items-center
      "
    >
      <span
        className={`
          flex

          h-7
          w-7

          items-center
          justify-center

          rounded-full

          text-[9px]
          font-bold

          ${
            active
              ? "bg-[#B31345] text-white shadow-[0_5px_15px_rgba(179,19,69,.22)]"
              : "border border-black/15 bg-white text-black/40"
          }
        `}
      >
        {
          number
        }
      </span>

      <span
        className={`
          mt-1.5

          text-[8px]
          font-semibold

          ${
            active
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

/* =========================================================
   STEP LINE
========================================================= */

function StepLine() {
  return (
    <span
      className="
        mt-[13px]

        h-px

        flex-1

        bg-black/10
      "
    />
  );
}

/* =========================================================
   CHECKOUT CARD
========================================================= */

function CheckoutCard({
  number,
  title,
  subtitle,
  icon,
  action,
  children,
}: {
  number: string;

  title: string;

  subtitle: string;

  icon:
    ReactNode;

  action?:
    ReactNode;

  children:
    ReactNode;
}) {
  return (
    <section
      className="
        rounded-[26px]

        border
        border-[#E8DAD6]

        bg-white

        p-4

        shadow-[0_12px_45px_rgba(50,22,20,0.035)]

        sm:p-6
      "
    >
      <div
        className="
          mb-5

          flex

          items-start
          justify-between

          gap-4
        "
      >
        <div
          className="
            flex

            items-center

            gap-3
          "
        >
          <span
            className="
              flex

              h-11
              w-11

              flex-none

              items-center
              justify-center

              rounded-[14px]

              bg-[#F9EDEF]

              text-[#B31345]

              [&>svg]:h-5
              [&>svg]:w-5
            "
          >
            {
              icon
            }
          </span>

          <div>
            <span
              className="
                text-[7px]
                font-bold

                tracking-[0.18em]

                text-[#B31345]
              "
            >
              {
                number
              }
            </span>

            <h2
              className="
                text-[17px]
                font-semibold

                tracking-[-0.02em]

                sm:text-[20px]
              "
            >
              {
                title
              }
            </h2>

            <p
              className="
                mt-0.5

                hidden

                text-[9px]

                text-black/40

                sm:block
              "
            >
              {
                subtitle
              }
            </p>
          </div>
        </div>

        {
          action
        }
      </div>

      {
        children
      }
    </section>
  );
}

/* =========================================================
   ADDRESS CARD
========================================================= */

function AddressCard({
  address,
  selected,
  onSelect,
  onDefault,
}: {
  address:
    CheckoutAddress;

  selected:
    boolean;

  onSelect:
    () => void;

  onDefault:
    () => void;
}) {
  const typeLabel =
    address.addressType ===
    "work"
      ? "Office"
      : address.addressType ===
          "other"
        ? "Other"
        : "Home";

  return (
    <article
      className={`
        relative

        overflow-hidden

        rounded-[18px]

        border

        transition-all

        ${
          selected
            ? "border-[#B31345] bg-[#FFF7F9] shadow-[0_9px_25px_rgba(179,19,69,.08)]"
            : "border-black/10 bg-[#FFFDFC] hover:border-[#D8B5BE]"
        }
      `}
    >
      {selected && (
        <div
          className="
            absolute

            left-0
            top-0

            h-full
            w-[3px]

            bg-[#B31345]
          "
        />
      )}

      <button
        type="button"
        onClick={
          onSelect
        }
        className="
          w-full

          cursor-pointer

          p-4

          text-left
        "
      >
        <div
          className="
            flex

            items-start

            gap-3
          "
        >
          <span
            className={`
              mt-0.5

              flex

              h-5
              w-5

              flex-none

              items-center
              justify-center

              rounded-full

              border

              ${
                selected
                  ? "border-[#B31345] bg-[#B31345]"
                  : "border-black/20 bg-white"
              }
            `}
          >
            {selected && (
              <Check
                className="
                  h-3
                  w-3

                  text-white
                "
              />
            )}
          </span>

          <div
            className="
              min-w-0
              flex-1
            "
          >
            <div
              className="
                flex

                flex-wrap

                items-center

                gap-2
              "
            >
              <strong
                className="
                  truncate

                  text-[12px]
                "
              >
                {
                  address.name
                }
              </strong>

              <span
                className="
                  rounded-full

                  bg-[#F4E8E5]

                  px-2
                  py-0.5

                  text-[7px]
                  font-semibold

                  uppercase

                  text-[#784A51]
                "
              >
                {
                  typeLabel
                }
              </span>

              {address.isDefault && (
                <span
                  className="
                    rounded-full

                    bg-emerald-50

                    px-2
                    py-0.5

                    text-[7px]
                    font-semibold

                    text-emerald-700
                  "
                >
                  Default
                </span>
              )}
            </div>

            <p
              className="
                mt-2

                text-[9px]
                leading-5

                text-black/50
              "
            >
              {address.homeNumber
                ? `${address.homeNumber}, `
                : ""}

              {address.officeNumber
                ? `${address.officeNumber}, `
                : ""}

              {
                address.addressLine1
              }

              {address.addressLine2
                ? `, ${address.addressLine2}`
                : ""}

              {address.landmark
                ? `, ${address.landmark}`
                : ""}

              <br />

              {
                address.city
              }

              {address.district
                ? `, ${address.district}`
                : ""}

              ,{" "}
              {
                address.state
              }{" "}

              {
                address.postalCode
              }

              <br />

              {
                address.phone
              }
            </p>
          </div>
        </div>
      </button>

      {!address.isDefault && (
        <div
          className="
            border-t
            border-black/[0.06]

            px-4
            py-2.5
          "
        >
          <button
            type="button"
            onClick={
              onDefault
            }
            className="
              cursor-pointer

              text-[8px]
              font-semibold

              uppercase

              tracking-[0.05em]

              text-[#B31345]
            "
          >
            Make Default
          </button>
        </div>
      )}
    </article>
  );
}

/* =========================================================
   PAYMENT CARD
========================================================= */

function PaymentCard({
  active,
  icon,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;

  icon:
    ReactNode;

  title: string;

  subtitle: string;

  onClick:
    () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`
        group

        flex

        min-h-[88px]

        w-full

        cursor-pointer

        items-center

        gap-3

        rounded-[18px]

        border

        px-4
        py-3.5

        text-left

        transition-all

        ${
          active
            ? "border-[#B31345] bg-[#FFF5F7] shadow-[0_8px_24px_rgba(179,19,69,.07)]"
            : "border-black/10 bg-[#FFFDFC] hover:border-[#D7AFB9]"
        }
      `}
    >
      <span
        className={`
          flex

          h-11
          w-11

          flex-none

          items-center
          justify-center

          rounded-full

          [&>svg]:h-5
          [&>svg]:w-5

          ${
            active
              ? "bg-[#B31345] text-white"
              : "bg-[#F2ECE9] text-[#3C302E]"
          }
        `}
      >
        {
          icon
        }
      </span>

      <span
        className="
          min-w-0
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
            leading-4

            text-black/40
          "
        >
          {
            subtitle
          }
        </span>
      </span>

      <span
        className={`
          flex

          h-5
          w-5

          flex-none

          items-center
          justify-center

          rounded-full

          border

          ${
            active
              ? "border-[#B31345] bg-[#B31345]"
              : "border-black/20 bg-white"
          }
        `}
      >
        {active && (
          <Check
            className="
              h-3
              w-3

              text-white
            "
          />
        )}
      </span>
    </button>
  );
}

/* =========================================================
   PRODUCT META
========================================================= */

function ProductMeta({
  label,
}: {
  label: string;
}) {
  return (
    <span
      className="
        rounded-full

        bg-[#F6F1EF]

        px-2
        py-1

        text-[8px]

        text-black/50
      "
    >
      {
        label
      }
    </span>
  );
}

/* =========================================================
   SUMMARY ROW
========================================================= */

function SummaryRow({
  label,
  value,
  green = false,
}: {
  label: string;

  value: string;

  green?: boolean;
}) {
  return (
    <div
      className="
        flex

        items-center
        justify-between

        gap-4
      "
    >
      <span
        className="
          text-[10px]

          text-black/50
        "
      >
        {
          label
        }
      </span>

      <strong
        className={`
          text-[10px]

          ${
            green
              ? "text-emerald-700"
              : "text-[#211817]"
          }
        `}
      >
        {
          value
        }
      </strong>
    </div>
  );
}

/* =========================================================
   LOADING
========================================================= */

function CheckoutLoading() {
  return (
    <main
      className="
        min-h-screen

        bg-[#F8F4F1]

        px-4
        py-8
      "
    >
      <div
        className="
          mx-auto

          grid

          max-w-[1320px]

          gap-6

          lg:grid-cols-[minmax(0,1fr)_390px]
        "
      >
        <div
          className="
            space-y-5
          "
        >
          {[1, 2, 3].map(
            (
              value
            ) => (
              <div
                key={
                  value
                }
                className="
                  h-[220px]

                  animate-pulse

                  rounded-[26px]

                  bg-black/[0.05]
                "
              />
            )
          )}
        </div>

        <div
          className="
            h-[430px]

            animate-pulse

            rounded-[28px]

            bg-black/[0.05]
          "
        />
      </div>
    </main>
  );
}