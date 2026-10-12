"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  BadgePercent,
  CircleCheckBig,
  Gift,
  Loader2,
  LockKeyhole,
  Tag,
  Truck,
} from "lucide-react";

import {
  applyDiscountCode,
  getCart,
  removeDiscountCode,
} from "@/lib/cart";

import {
  normalizeCartResponse,
  type CartView,
} from "@/src/services/cart-view";

/* =========================================================
   MONEY
========================================================= */

function money(
  value:
    number
) {
  return `₹${Math.max(
    0,
    Number(
      value ||
        0
    )
  ).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits:
        2,
    }
  )}`;
}

/* =========================================================
   CHECKOUT ORDER SUMMARY

   Payment page ke right-side existing Order Summary ko
   is component se replace karo.

   Same /api/cart data use hota hai:
   - offer discounts
   - automatic discounts
   - discount code
   - tax
   - delivery charge (agar backend return kare)
   - final total
========================================================= */

export default function CheckoutOrderSummary() {
  const [
    cart,
    setCart,
  ] =
    useState<CartView | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    error,
    setError,
  ] =
    useState(
      ""
    );

  const [
    code,
    setCode,
  ] =
    useState(
      ""
    );

  const [
    applying,
    setApplying,
  ] =
    useState(
      false
    );

  /* =======================================================
     LOAD
  ======================================================= */

  const load =
    useCallback(
      async (
        showLoader =
          false
      ) => {
        try {
          if (
            showLoader
          ) {
            setLoading(
              true
            );
          }

          const response =
            await getCart();

          setCart(
            normalizeCartResponse(
              response
            )
          );

          setError(
            ""
          );
        } catch (
          loadError
        ) {
          setError(
            loadError instanceof
            Error
              ? loadError.message
              : "Unable to load order summary."
          );
        } finally {
          if (
            showLoader
          ) {
            setLoading(
              false
            );
          }
        }
      },
      []
    );

  useEffect(() => {
    void load(
      true
    );
  }, [
    load,
  ]);

  /* =======================================================
     CART CHANGES

     Payment page visible ho aur cart event aaye to
     background update; no whole page refresh.
  ======================================================= */

  useEffect(() => {
    const handle =
      () => {
        void load(
          false
        );
      };

    window.addEventListener(
      "hivrasoft-cart-updated",
      handle
    );

    return () => {
      window.removeEventListener(
        "hivrasoft-cart-updated",
        handle
      );
    };
  }, [
    load,
  ]);

  /* =======================================================
     COUPON
  ======================================================= */

  async function applyCode() {
    const value =
      code
        .trim()
        .toUpperCase();

    if (
      !value ||
      applying
    ) {
      return;
    }

    try {
      setApplying(
        true
      );

      setError(
        ""
      );

      const response =
        await applyDiscountCode(
          value
        );

      setCart(
        normalizeCartResponse(
          response
        )
      );

      setCode(
        ""
      );
    } catch (
      applyError
    ) {
      setError(
        applyError instanceof
        Error
          ? applyError.message
          : "Unable to apply code."
      );
    } finally {
      setApplying(
        false
      );
    }
  }

  async function removeCode() {
    if (
      applying
    ) {
      return;
    }

    try {
      setApplying(
        true
      );

      setError(
        ""
      );

      const response =
        await removeDiscountCode();

      setCart(
        normalizeCartResponse(
          response
        )
      );
    } catch (
      removeError
    ) {
      setError(
        removeError instanceof
        Error
          ? removeError.message
          : "Unable to remove code."
      );
    } finally {
      setApplying(
        false
      );
    }
  }

  /* =======================================================
     LOADING
  ======================================================= */

  if (
    loading
  ) {
    return (
      <aside
        className="
          rounded-[18px]
          border
          border-[#E9DFDB]
          bg-white
          p-5
        "
      >
        <div
          className="
            flex
            min-h-[170px]
            items-center
            justify-center
            gap-2
            text-[10px]
            text-black/45
          "
        >
          <Loader2
            className="
              animate-spin
            "
            size={16}
          />

          Loading summary...
        </div>
      </aside>
    );
  }

  if (
    !cart
  ) {
    return (
      <aside
        className="
          rounded-[18px]
          border
          border-[#E9DFDB]
          bg-white
          p-5
          text-[10px]
          text-red-600
        "
      >
        {error ||
          "Unable to load order summary."}
      </aside>
    );
  }

  const delivery =
    cart.deliveryCharge;

  return (
    <aside
      className="
        h-fit
        overflow-hidden
        rounded-[18px]
        border
        border-[#E9DFDB]
        bg-white
        shadow-[0_14px_40px_rgba(58,28,21,.05)]
      "
    >
      {/* HEADER */}

      <div
        className="
          border-b
          border-[#EFE6E2]
          bg-[#FFF9F8]
          px-5
          py-4
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
          <div>
            <p
              className="
                text-[8px]
                font-bold
                uppercase
                tracking-[0.16em]
                text-[#B31345]
              "
            >
              Checkout
            </p>

            <h2
              className="
                mt-1
                font-serif
                text-[20px]
                text-[#211817]
              "
            >
              Order Summary
            </h2>
          </div>

          <span
            className="
              inline-flex
              items-center
              gap-1
              rounded-full
              bg-emerald-50
              px-2.5
              py-1.5
              text-[8px]
              font-semibold
              text-emerald-700
            "
          >
            <LockKeyhole
              size={11}
            />

            Secure
          </span>
        </div>
      </div>

      <div
        className="
          p-5
        "
      >
        {/* ITEMS */}

        <div
          className="
            max-h-[260px]
            space-y-3
            overflow-y-auto
            pr-1
          "
        >
          {cart.items.map(
            (
              item
            ) => (
              <div
                key={
                  item.id
                }
                className="
                  flex
                  gap-3
                "
              >
                <div
                  className="
                    h-[62px]
                    w-[50px]
                    shrink-0
                    overflow-hidden
                    rounded-[9px]
                    bg-[#F5F1EF]
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
                  ) : null}
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
                      leading-4
                      text-[#211817]
                    "
                  >
                    {item.name}
                  </p>

                  <div
                    className="
                      mt-1
                      text-[8px]
                      text-black/35
                    "
                  >
                    Qty{" "}
                    {
                      item.quantity
                    }

                    {item.size
                      ? ` • ${item.size}`
                      : ""}
                  </div>

                  <div
                    className="
                      mt-1.5
                      flex
                      flex-wrap
                      gap-1
                    "
                  >
                    {item.offerContext
                      ?.offerType ===
                    "fixed_price_bundle" ? (
                      <span
                        className="
                          rounded-full
                          bg-[#FFF0F4]
                          px-2
                          py-0.5
                          text-[7px]
                          font-bold
                          text-[#B31345]
                        "
                      >
                        Bundle
                      </span>
                    ) : null}

                    {item.discount
                      .offerName ? (
                      <span
                        className="
                          max-w-full
                          truncate
                          rounded-full
                          bg-emerald-50
                          px-2
                          py-0.5
                          text-[7px]
                          font-bold
                          text-emerald-700
                        "
                      >
                        {
                          item.discount
                            .offerName
                        }
                      </span>
                    ) : null}
                  </div>
                </div>

                <div
                  className="
                    shrink-0
                    text-right
                  "
                >
                  <strong
                    className="
                      block
                      text-[10px]
                      text-[#211817]
                    "
                  >
                    {money(
                      item.finalLineTotal
                    )}
                  </strong>

                  {item.discount
                    .totalDiscount >
                  0 ? (
                    <span
                      className="
                        mt-1
                        block
                        text-[8px]
                        text-black/30
                        line-through
                      "
                    >
                      {money(
                        item.subtotal
                      )}
                    </span>
                  ) : null}
                </div>
              </div>
            )
          )}
        </div>

        {/* OFFERS */}

        {cart.appliedOffers
          .length ? (
          <div
            className="
              mt-4
              rounded-[12px]
              bg-emerald-50/70
              p-3
            "
          >
            <div
              className="
                flex
                items-center
                gap-2
                text-[8px]
                font-bold
                uppercase
                tracking-[0.08em]
                text-emerald-700
              "
            >
              <Gift
                size={12}
              />

              Offers Applied
            </div>

            <div
              className="
                mt-2
                space-y-1.5
              "
            >
              {cart.appliedOffers.map(
                (
                  offer
                ) => (
                  <div
                    key={`${offer.offerId}-${offer.name}`}
                    className="
                      flex
                      justify-between
                      gap-3
                      text-[9px]
                    "
                  >
                    <span
                      className="
                        min-w-0
                        truncate
                        text-emerald-800
                      "
                    >
                      {
                        offer.name
                      }
                    </span>

                    <strong
                      className="
                        shrink-0
                        text-emerald-700
                      "
                    >
                      -
                      {money(
                        offer.amount
                      )}
                    </strong>
                  </div>
                )
              )}
            </div>
          </div>
        ) : null}

        {/* BREAKDOWN */}

        <div
          className="
            mt-4
            space-y-2.5
            border-t
            border-[#EFE6E2]
            pt-4
            text-[9px]
          "
        >
          <Row
            label={`Subtotal (${cart.totalItems})`}
            value={money(
              cart.subtotal
            )}
          />

          {cart.offerDiscount >
          0 ? (
            <Row
              positive
              label="Offer discount"
              value={`-${money(
                cart.offerDiscount
              )}`}
            />
          ) : null}

          {cart.automaticDiscount >
          0 ? (
            <Row
              positive
              label={
                cart.automatic
                  ?.percentage
                  ? `${
                      cart.automatic
                        .name
                    } (${cart.automatic.percentage}%)`
                  : cart.automatic
                      ?.name ||
                    "Automatic discount"
              }
              value={`-${money(
                cart.automaticDiscount
              )}`}
            />
          ) : null}

          {cart.codeDiscount >
          0 ? (
            <Row
              positive
              label={`Coupon ${cart.appliedDiscountCode}`}
              value={`-${money(
                cart.codeDiscount
              )}`}
            />
          ) : null}

          {cart.tax >
          0 ? (
            <Row
              label={
                cart.taxPercentage >
                0
                  ? `${cart.taxName} (${cart.taxPercentage}%)`
                  : cart.taxName
              }
              value={`+${money(
                cart.tax
              )}`}
            />
          ) : null}

          <Row
            label="Delivery"
            value={
              delivery ===
              null
                ? "Calculated"
                : delivery >
                    0
                  ? `+${money(
                      delivery
                    )}`
                  : "FREE"
            }
          />
        </div>

        {/* COUPON */}

        <div
          className="
            mt-4
            rounded-[12px]
            bg-[#FAF6F4]
            p-3
          "
        >
          <div
            className="
              flex
              items-center
              gap-2
              text-[8px]
              font-bold
              uppercase
              tracking-[0.08em]
              text-[#6A5C57]
            "
          >
            <Tag
              size={12}
            />

            Have a discount code?
          </div>

          {cart.appliedDiscountCode ? (
            <div
              className="
                mt-2
                flex
                items-center
                justify-between
                gap-3
                rounded-[9px]
                bg-white
                px-3
                py-2
              "
            >
              <div
                className="
                  min-w-0
                "
              >
                <strong
                  className="
                    block
                    truncate
                    text-[10px]
                    text-[#B31345]
                  "
                >
                  {
                    cart.appliedDiscountCode
                  }
                </strong>

                <span
                  className="
                    text-[7px]
                    text-black/35
                  "
                >
                  Applied
                </span>
              </div>

              <button
                type="button"
                disabled={
                  applying
                }
                onClick={() =>
                  void removeCode()
                }
                className="
                  text-[8px]
                  font-bold
                  text-[#B31345]
                  disabled:opacity-40
                "
              >
                Remove
              </button>
            </div>
          ) : (
            <div
              className="
                mt-2
                flex
                gap-2
              "
            >
              <input
                value={
                  code
                }
                onChange={(
                  event
                ) =>
                  setCode(
                    event.target.value.toUpperCase()
                  )
                }
                onKeyDown={(
                  event
                ) => {
                  if (
                    event.key ===
                    "Enter"
                  ) {
                    void applyCode();
                  }
                }}
                placeholder="HIVRA20"
                className="
                  h-9
                  min-w-0
                  flex-1
                  rounded-[9px]
                  border
                  border-black/10
                  bg-white
                  px-3
                  text-[9px]
                  uppercase
                  outline-none
                  focus:border-[#B31345]/40
                "
              />

              <button
                type="button"
                disabled={
                  applying ||
                  !code.trim()
                }
                onClick={() =>
                  void applyCode()
                }
                className="
                  rounded-[9px]
                  bg-[#211817]
                  px-3
                  text-[8px]
                  font-bold
                  uppercase
                  text-white
                  disabled:opacity-40
                "
              >
                {applying
                  ? "..."
                  : "Apply"}
              </button>
            </div>
          )}
        </div>

        {error ? (
          <p
            className="
              mt-3
              rounded-[9px]
              bg-red-50
              px-3
              py-2
              text-[8px]
              text-red-700
            "
          >
            {error}
          </p>
        ) : null}

        {/* TOTAL */}

        <div
          className="
            mt-4
            border-t
            border-dashed
            border-[#DCCFCC]
            pt-4
          "
        >
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
                  text-[10px]
                  font-bold
                  text-[#211817]
                "
              >
                Total
              </p>

              <p
                className="
                  mt-1
                  text-[7px]
                  text-black/30
                "
              >
                Current taxes and
                discounts included
              </p>
            </div>

            <strong
              className="
                font-serif
                text-[22px]
                text-[#211817]
              "
            >
              {money(
                cart.total
              )}
            </strong>
          </div>
        </div>

        {cart.discount >
        0 ? (
          <div
            className="
              mt-3
              flex
              items-center
              gap-2
              rounded-[10px]
              bg-emerald-50
              px-3
              py-2
              text-[8px]
              font-semibold
              text-emerald-700
            "
          >
            <CircleCheckBig
              size={12}
            />

            You save{" "}
            {money(
              cart.discount
            )}
          </div>
        ) : null}

        <div
          className="
            mt-3
            flex
            items-center
            justify-center
            gap-2
            text-[7px]
            text-black/30
          "
        >
          <Truck
            size={11}
          />

          Delivery is finalized
          before payment
        </div>
      </div>
    </aside>
  );
}

/* =========================================================
   ROW
========================================================= */

function Row({
  label,
  value,
  positive =
    false,
}: {
  label:
    string;

  value:
    string;

  positive?:
    boolean;
}) {
  return (
    <div
      className="
        flex
        items-start
        justify-between
        gap-4
      "
    >
      <span
        className="
          min-w-0
          text-black/50
        "
      >
        {label}
      </span>

      <strong
        className={`
          shrink-0

          ${
            positive
              ? "text-emerald-700"
              : "text-[#211817]"
          }
        `}
      >
        {value}
      </strong>
    </div>
  );
}