"use client";

import Link from "next/link";

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

  Minus,

  Plus,

  ReceiptText,

  ShieldCheck,

  ShoppingBag,

  Tag,

  Trash2,

  Truck,

} from "lucide-react";



import Header from "@/src/components/Header/Header";



import AccountSidebar from "@/app/account/components/AccountSidebar";



import {

  useStorefrontCommerce,

} from "@/src/components/Storefront/StorefrontCommerceProvider";



import {

  applyDiscountCode,

  getCart,

  removeCartItem,

  removeDiscountCode,

  updateCartItem,

} from "@/lib/cart";



import {

  normalizeCartResponse,

  type CartView,

  type CartViewItem,

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

   API RESPONSE -> CART

========================================================= */



function cartFromMutation(

  response:

    unknown

) {

  return normalizeCartResponse(

    response

  );

}



/* =========================================================

   PAGE

========================================================= */



export default function CartPage() {

  const commerce =

    useStorefrontCommerce();



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

    busyItemId,

    setBusyItemId,

  ] =

    useState<

      string | null

    >(null);



  const [

    error,

    setError,

  ] =

    useState(

      ""

    );



  const [

    discountCode,

    setDiscountCode,

  ] =

    useState(

      ""

    );



  const [

    applyingCode,

    setApplyingCode,

  ] =

    useState(

      false

    );



  /* =======================================================

     LOAD CART



     initial=true:

     loader dikhana hai.



     initial=false:

     background sync only, UI ko blank nahi karna.

  ======================================================= */



  const loadCart =

    useCallback(

      async (

        initial =

          false

      ) => {

        if (

          commerce.isAuthenticated !==

          true

        ) {

          setCart(

            null

          );



          if (

            initial

          ) {

            setLoading(

              false

            );

          }



          return;

        }



        try {

          if (

            initial

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

          console.error(

            "LOAD CART ERROR:",

            loadError

          );



          setError(

            loadError instanceof

            Error

              ? loadError.message

              : "Unable to load your cart."

          );

        } finally {

          if (

            initial

          ) {

            setLoading(

              false

            );

          }

        }

      },

      [

        commerce.isAuthenticated,

      ]

    );



  /* =======================================================

     INITIAL LOAD

  ======================================================= */



  useEffect(() => {

    if (

      commerce.isAuthenticated ===

      true

    ) {

      void loadCart(

        true

      );

    } else if (

      commerce.isAuthenticated ===

      false

    ) {

      setLoading(

        false

      );



      setCart(

        null

      );

    }

  }, [

    commerce.isAuthenticated,

    loadCart,

  ]);



  /* =======================================================

     CART EVENT



     Add-to-bag kisi aur component se hua to background sync.

     Full loading state trigger nahi hota.

  ======================================================= */



  useEffect(() => {

    const handleUpdate =

      () => {

        void loadCart(

          false

        );

      };



    window.addEventListener(

      "hivrasoft-cart-updated",

      handleUpdate

    );



    return () => {

      window.removeEventListener(

        "hivrasoft-cart-updated",

        handleUpdate

      );

    };

  }, [

    loadCart,

  ]);



  /* =======================================================

     QUANTITY CHANGE



     IMPORTANT:

     mutation response directly state me.

     No loadCart() after +/-.

  ======================================================= */



  async function changeQuantity(

    item:

      CartViewItem,

    nextQuantity:

      number

  ) {

    if (

      busyItemId ||

      nextQuantity <

        1 ||

      nextQuantity >

        99

    ) {

      return;

    }



    if (

      item.availableStock >

        0 &&

      nextQuantity >

        item.availableStock

    ) {

      setError(

        `Only ${item.availableStock} item(s) available in stock.`

      );



      return;

    }



    try {

      setBusyItemId(

        item.id

      );



      setError(

        ""

      );



      const response =

        await updateCartItem(

          item.id,

          nextQuantity

        );



      /*

       * Server ne discounts + offers + tax dobara calculate

       * kiye hain. Wahi response directly UI me lagao.

       */

      setCart(

        cartFromMutation(

          response

        )

      );

    } catch (

      updateError

    ) {

      setError(

        updateError instanceof

        Error

          ? updateError.message

          : "Unable to update quantity."

      );

    } finally {

      setBusyItemId(

        null

      );

    }

  }



  /* =======================================================

     REMOVE ITEM



     No page refresh / no re-loader.

  ======================================================= */



  async function removeItem(

    itemId:

      string

  ) {

    if (

      busyItemId

    ) {

      return;

    }



    try {

      setBusyItemId(

        itemId

      );



      setError(

        ""

      );



      const response =

        await removeCartItem(

          itemId

        );



      setCart(

        cartFromMutation(

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

          : "Unable to remove item."

      );

    } finally {

      setBusyItemId(

        null

      );

    }

  }



  /* =======================================================

     APPLY DISCOUNT CODE



     Existing offers + automatic discount ke baad bhi

     user code enter kar sakta hai. Backend stacking rule

     final authority hai.

  ======================================================= */



  async function handleApplyDiscountCode(
    rawCode?:
      string
  ) {
    const code =
      String(
        rawCode ??
          discountCode
      )
        .trim()
        .toUpperCase();



    if (

      !code ||

      applyingCode

    ) {

      return;

    }



    try {

      setApplyingCode(

        true

      );



      setError(

        ""

      );



      const response =

        await applyDiscountCode(

          code

        );



      setCart(

        normalizeCartResponse(

          response

        )

      );



      setDiscountCode(

        ""

      );

    } catch (

      applyError

    ) {

      setError(

        applyError instanceof

        Error

          ? applyError.message

          : "Unable to apply discount code."

      );

    } finally {

      setApplyingCode(

        false

      );

    }

  }



  async function handleRemoveDiscountCode() {

    if (

      applyingCode

    ) {

      return;

    }



    try {

      setApplyingCode(

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

      removeCodeError

    ) {

      setError(

        removeCodeError instanceof

        Error

          ? removeCodeError.message

          : "Unable to remove discount code."

      );

    } finally {

      setApplyingCode(

        false

      );

    }

  }



  /* =======================================================

     VALUES

  ======================================================= */



  const items =

    cart?.items ||

    [];



  const totalItems =

    cart?.totalItems ||

    0;



  const subtotal =

    cart?.subtotal ||

    0;



  const totalDiscount =

    cart?.discount ||

    0;



  const deliveryCharge =

    cart?.deliveryCharge ?? null;



  const total =

    cart?.total ||

    0;



  /* =======================================================

     RENDER

  ======================================================= */



  return (

    <>

      <Header />



      <div

        className="

          min-h-screen

          bg-[#FBF8F6]

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

              pb-12

              pt-5



              sm:px-5



              lg:px-7

              lg:pt-7

            "

          >

            {/* =============================================

                TOP

            ============================================= */}



            <section

              className="

                overflow-hidden

                rounded-[20px]

                border

                border-[#EADFDB]

                bg-white

                shadow-[0_12px_35px_rgba(67,34,27,.05)]

              "

            >

              <div

                className="

                  bg-[linear-gradient(100deg,#FFF2F4_0%,#FFF9F8_55%,#F8ECE8_100%)]

                  px-5

                  py-6



                  sm:px-7

                  sm:py-7

                "

              >

                <p

                  className="

                    text-[9px]

                    font-bold

                    uppercase

                    tracking-[0.18em]

                    text-[#B31345]

                  "

                >

                  My Account / Cart

                </p>



                <div

                  className="

                    mt-2

                    flex

                    flex-col

                    gap-4



                    sm:flex-row

                    sm:items-end

                    sm:justify-between

                  "

                >

                  <div>

                    <h1

                      className="

                        font-serif

                        text-[34px]

                        leading-none

                        text-[#211817]



                        sm:text-[42px]

                      "

                    >

                      My Cart

                    </h1>



                    <p

                      className="

                        mt-3

                        max-w-[560px]

                        text-[11px]

                        leading-5

                        text-black/50

                      "

                    >

                      Offers, automatic

                      discounts, coupon

                      codes and taxes below

                      are calculated from

                      your live cart API.

                    </p>

                  </div>



                  <div

                    className="

                      flex

                      gap-2

                    "

                  >

                    <MiniStat

                      label="Items"

                      value={String(

                        totalItems

                      )}

                    />



                    <MiniStat

                      label="Payable"

                      value={money(

                        total

                      )}

                    />

                  </div>

                </div>

              </div>

            </section>



            {/* ERROR */}



            {error ? (

              <div

                className="

                  mt-4

                  rounded-[14px]

                  border

                  border-red-200

                  bg-red-50

                  px-4

                  py-3

                  text-[11px]

                  text-red-700

                "

              >

                {error}

              </div>

            ) : null}



            {/* AUTH CHECK */}



            {commerce.isAuthenticated ===

            null ? (

              <StateBox>

                Checking your

                account...

              </StateBox>

            ) : null}



            {/* LOGIN */}



            {commerce.isAuthenticated ===

            false ? (

              <StateBox>

                <div

                  className="

                    text-center

                  "

                >

                  <ShoppingBag

                    className="

                      mx-auto

                      text-[#B31345]

                    "

                    size={30}

                  />



                  <h2

                    className="

                      mt-4

                      font-serif

                      text-[26px]

                      text-[#211817]

                    "

                  >

                    Login to check your

                    cart

                  </h2>



                  <button

                    type="button"

                    onClick={() =>

                      commerce.openLoginPrompt(

                        "cart"

                      )

                    }

                    className="

                      mt-5

                      rounded-full

                      bg-[#B31345]

                      px-7

                      py-3

                      text-[10px]

                      font-bold

                      uppercase

                      tracking-[0.08em]

                      text-white

                    "

                  >

                    Login / Sign Up

                  </button>

                </div>

              </StateBox>

            ) : null}



            {/* LOADING */}



            {commerce.isAuthenticated ===

              true &&

            loading ? (

              <StateBox>

                <Loader2

                  className="

                    animate-spin

                    text-[#B31345]

                  "

                  size={22}

                />



                <span

                  className="

                    ml-2

                  "

                >

                  Loading your cart...

                </span>

              </StateBox>

            ) : null}



            {/* EMPTY */}



            {commerce.isAuthenticated ===

              true &&

            !loading &&

            items.length ===

              0 ? (

              <StateBox>

                <div

                  className="

                    text-center

                  "

                >

                  <ShoppingBag

                    className="

                      mx-auto

                      text-[#B31345]

                    "

                    size={34}

                  />



                  <h2

                    className="

                      mt-4

                      font-serif

                      text-[28px]

                      text-[#211817]

                    "

                  >

                    Your cart is empty

                  </h2>



                  <p

                    className="

                      mt-2

                      text-[11px]

                      text-black/45

                    "

                  >

                    Add something you

                    love and it will

                    appear here.

                  </p>



                  <Link

                    href="/women"

                    className="

                      mt-5

                      inline-flex

                      rounded-full

                      bg-[#B31345]

                      px-7

                      py-3

                      text-[10px]

                      font-bold

                      text-white

                    "

                  >

                    Continue Shopping

                  </Link>

                </div>

              </StateBox>

            ) : null}



            {/* =============================================

                CART

            ============================================= */}



            {commerce.isAuthenticated ===

              true &&

            !loading &&

            items.length >

              0 ? (

              <div

                className="

                  mt-5

                  grid

                  min-w-0

                  gap-5



                  xl:grid-cols-[minmax(0,1fr)_380px]

                "

              >

                {/* ITEMS */}



                <section

                  className="

                    min-w-0

                    overflow-hidden

                    rounded-[18px]

                    border

                    border-[#E9DFDB]

                    bg-white

                  "

                >

                  <div

                    className="

                      flex

                      items-center

                      justify-between

                      border-b

                      border-[#EFE6E2]

                      px-4

                      py-4



                      sm:px-5

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

                        Shopping Bag

                      </p>



                      <h2

                        className="

                          mt-1

                          font-serif

                          text-[21px]

                          text-[#211817]

                        "

                      >

                        {totalItems}{" "}

                        {totalItems ===

                        1

                          ? "item"

                          : "items"}

                      </h2>

                    </div>



                    <div

                      className="

                        rounded-full

                        bg-[#F8F2F0]

                        px-3

                        py-1.5

                        text-[9px]

                        font-semibold

                        text-black/45

                      "

                    >

                      Live pricing

                    </div>

                  </div>



                  {items.map(

                    (

                      item,

                      index

                    ) => (

                      <CartItemRow

                        key={

                          item.id

                        }

                        item={

                          item

                        }

                        busy={

                          busyItemId ===

                          item.id

                        }

                        last={

                          index ===

                          items.length -

                            1

                        }

                        onMinus={() =>

                          void changeQuantity(

                            item,

                            item.quantity -

                              1

                          )

                        }

                        onPlus={() =>

                          void changeQuantity(

                            item,

                            item.quantity +

                              1

                          )

                        }

                        onRemove={() =>

                          void removeItem(

                            item.id

                          )

                        }

                      />

                    )

                  )}

                </section>



                {/* SUMMARY */}



                <aside

                  className="

                    h-fit

                    min-w-0

                    rounded-[18px]

                    border

                    border-[#E9DFDB]

                    bg-white

                    p-5

                    shadow-[0_14px_40px_rgba(58,28,21,.05)]



                    xl:sticky

                    xl:top-[105px]

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

                        grid

                        h-10

                        w-10

                        place-items-center

                        rounded-full

                        bg-[#FFF0F4]

                        text-[#B31345]

                      "

                    >

                      <ReceiptText

                        size={18}

                      />

                    </span>



                    <div>

                      <h2

                        className="

                          font-serif

                          text-[21px]

                          text-[#211817]

                        "

                      >

                        Price Details

                      </h2>



                      <p

                        className="

                          mt-0.5

                          text-[8px]

                          text-black/35

                        "

                      >

                        Calculated by

                        server cart

                      </p>

                    </div>

                  </div>



                  {/* OFFER PROGRESS */}



                  {cart?.offerProgress

                    ?.length ? (

                    <div

                      className="

                        mt-5

                        space-y-3

                      "

                    >

                      {cart.offerProgress.map(

                        (

                          progress

                        ) => {

                          const selectedInCurrentGroup =

                            progress.unlocked &&

                            progress.remainingQuantity ===

                              0

                              ? progress.requiredQuantity

                              : progress.selectedQuantity %

                                  progress.requiredQuantity;



                          const shownSelected =

                            progress.unlocked &&

                            progress.remainingQuantity ===

                              0

                              ? progress.requiredQuantity

                              : selectedInCurrentGroup;



                          return (

                            <div

                              key={

                                progress.offerId

                              }

                              className={`

                                rounded-[14px]

                                border

                                p-3.5



                                ${

                                  progress.unlocked

                                    ? "border-emerald-200 bg-emerald-50/80"

                                    : "border-[#B31345]/15 bg-[#FFF4F7]"

                                }

                              `}

                            >

                              <div

                                className="

                                  flex

                                  items-start

                                  justify-between

                                  gap-3

                                "

                              >

                                <div

                                  className="

                                    min-w-0

                                  "

                                >

                                  <p

                                    className={`

                                      text-[8px]

                                      font-bold

                                      uppercase

                                      tracking-[0.1em]



                                      ${

                                        progress.unlocked

                                          ? "text-emerald-700"

                                          : "text-[#B31345]"

                                      }

                                    `}

                                  >

                                    {progress.unlocked

                                      ? "Offer Unlocked"

                                      : "Bundle Progress"}

                                  </p>



                                  <strong

                                    className="

                                      mt-1

                                      block

                                      truncate

                                      text-[11px]

                                      text-[#211817]

                                    "

                                  >

                                    {progress.name}

                                  </strong>

                                </div>



                                {progress.fixedPrice >

                                0 ? (

                                  <strong

                                    className="

                                      shrink-0

                                      text-[11px]

                                      text-[#B31345]

                                    "

                                  >

                                    {money(

                                      progress.fixedPrice

                                    )}

                                  </strong>

                                ) : null}

                              </div>



                              <div

                                className="

                                  mt-3

                                  flex

                                  gap-1.5

                                "

                              >

                                {Array.from({

                                  length:

                                    progress.requiredQuantity,

                                }).map(

                                  (

                                    _,

                                    index

                                  ) => (

                                    <span

                                      key={

                                        index

                                      }

                                      className={`

                                        h-1.5

                                        flex-1

                                        rounded-full



                                        ${

                                          index <

                                          shownSelected

                                            ? progress.unlocked

                                              ? "bg-emerald-500"

                                              : "bg-[#B31345]"

                                            : "bg-black/10"

                                        }

                                      `}

                                    />

                                  )

                                )}

                              </div>



                              <div

                                className="

                                  mt-2.5

                                  flex

                                  items-center

                                  justify-between

                                  gap-3

                                  text-[9px]

                                "

                              >

                                <span

                                  className="

                                    text-black/45

                                  "

                                >

                                  {shownSelected}/

                                  {

                                    progress.requiredQuantity

                                  }{" "}

                                  selected

                                </span>



                                <strong

                                  className={

                                    progress.unlocked

                                      ? "text-emerald-700"

                                      : "text-[#B31345]"

                                  }

                                >

                                  {progress.unlocked

                                    ? "Offer applied ✓"

                                    : `Add ${progress.remainingQuantity} more`}

                                </strong>

                              </div>

                            </div>

                          );

                        }

                      )}

                    </div>

                  ) : null}



                  {/* APPLIED OFFERS */}



                  {cart?.appliedOffers

                    .length ? (

                    <div

                      className="

                        mt-5

                        rounded-[14px]

                        border

                        border-emerald-100

                        bg-emerald-50/70

                        p-3

                      "

                    >

                      <div

                        className="

                          flex

                          items-center

                          gap-2

                          text-[9px]

                          font-bold

                          uppercase

                          tracking-[0.08em]

                          text-emerald-700

                        "

                      >

                        <Gift

                          size={14}

                        />



                        Applied Offers

                      </div>



                      <div

                        className="

                          mt-2

                          space-y-2

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

                                items-center

                                justify-between

                                gap-3

                                text-[10px]

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



                  {/* PRICE ROWS */}



                  <div

                    className="

                      mt-5

                      space-y-3

                      text-[11px]

                    "

                  >

                    <SummaryRow

                      label={`Subtotal (${totalItems})`}

                      value={money(

                        subtotal

                      )}

                    />



                    {cart &&

                    cart.offerDiscount >

                      0 ? (

                      <SummaryRow

                        positive

                        label="Offer discount"

                        value={`-${money(

                          cart.offerDiscount

                        )}`}

                      />

                    ) : null}



                    {cart &&

                    cart.automaticDiscount >

                      0 ? (

                      <SummaryRow

                        positive

                        label={

                          cart.automatic

                            ?.percentage

                            ? `${

                                cart.automatic

                                  .name ||

                                "Automatic discount"

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



                    {cart &&

                    cart.codeDiscount >

                      0 ? (

                      <SummaryRow

                        positive

                        label={`Coupon ${cart.appliedDiscountCode}`}

                        value={`-${money(

                          cart.codeDiscount

                        )}`}

                      />

                    ) : null}



                    {cart &&

                    cart.tax >

                      0 ? (

                      <SummaryRow

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



                    <SummaryRow

                      label="Delivery"

                      value={

                        deliveryCharge ===

                        null

                          ? "Calculated at checkout"

                          : deliveryCharge >

                              0

                            ? `+${money(

                                deliveryCharge

                              )}`

                            : "FREE"

                      }

                    />

                  </div>



                  {/* =================================================
                      DISCOUNT CODE

                      IMPORTANT:
                      - Available coupon codes cart page par show nahi honge.
                      - User khud code enter karega.
                      - Apply hone ke baad backend se jo actual codeDiscount
                        aayega wahi yahan aur Price Details me show hoga.
                  ================================================= */}

                  <div
                    className="
                      mt-5

                      rounded-[15px]

                      border
                      border-[#B31345]/10

                      bg-[#FFF8FA]

                      p-3.5
                    "
                  >
                    <div
                      className="
                        flex
                        items-center

                        gap-2
                      "
                    >
                      <Tag
                        size={13}
                        className="
                          text-[#B31345]
                        "
                      />

                      <span
                        className="
                          text-[9px]
                          font-extrabold

                          uppercase

                          tracking-[0.09em]

                          text-[#211817]
                        "
                      >
                        Discount Code
                      </span>
                    </div>

                    {cart
                      ?.appliedDiscountCode ? (
                      <div
                        className="
                          mt-3

                          flex
                          items-center
                          justify-between

                          gap-3

                          rounded-[11px]

                          border
                          border-emerald-200

                          bg-emerald-50

                          px-3
                          py-3
                        "
                      >
                        <div
                          className="
                            min-w-0
                          "
                        >
                          <span
                            className="
                              block

                              text-[7px]
                              font-bold

                              uppercase

                              tracking-[0.08em]

                              text-emerald-700/70
                            "
                          >
                            Coupon Applied
                          </span>

                          <strong
                            className="
                              mt-0.5

                              block
                              truncate

                              text-[14px]
                              font-black

                              tracking-[0.08em]

                              text-emerald-700
                            "
                          >
                            {
                              cart.appliedDiscountCode
                            }
                          </strong>

                          {cart.codeDiscount >
                          0 ? (
                            <span
                              className="
                                mt-1

                                block

                                text-[8px]
                                font-bold

                                text-emerald-700
                              "
                            >
                              You saved{" "}
                              {money(
                                cart.codeDiscount
                              )}
                            </span>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          disabled={
                            applyingCode
                          }
                          onClick={() =>
                            void handleRemoveDiscountCode()
                          }
                          className="
                            shrink-0

                            rounded-[8px]

                            border
                            border-emerald-200

                            bg-white

                            px-3
                            py-2

                            text-[8px]
                            font-extrabold

                            uppercase

                            text-emerald-700

                            disabled:opacity-40
                          "
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div
                        className="
                          mt-3

                          flex

                          gap-2
                        "
                      >
                        <input
                          value={
                            discountCode
                          }
                          onChange={(
                            event
                          ) =>
                            setDiscountCode(
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
                              void handleApplyDiscountCode();
                            }
                          }}
                          placeholder="ENTER COUPON CODE"
                          className="
                            h-10

                            min-w-0
                            flex-1

                            rounded-[10px]

                            border
                            border-black/10

                            bg-white

                            px-3

                            text-[10px]
                            font-extrabold

                            uppercase

                            tracking-[0.05em]

                            text-[#211817]

                            outline-none

                            transition

                            placeholder:font-semibold
                            placeholder:text-black/25

                            focus:border-[#B31345]/40
                          "
                        />

                        <button
                          type="button"
                          disabled={
                            applyingCode ||
                            !discountCode.trim()
                          }
                          onClick={() =>
                            void handleApplyDiscountCode()
                          }
                          className="
                            min-w-[76px]

                            rounded-[10px]

                            bg-[#211817]

                            px-4

                            text-[8px]
                            font-extrabold

                            uppercase

                            tracking-[0.04em]

                            text-white

                            transition

                            hover:bg-[#B31345]

                            disabled:cursor-not-allowed
                            disabled:opacity-40
                          "
                        >
                          {applyingCode
                            ? "..."
                            : "Apply"}
                        </button>
                      </div>
                    )}
                  </div>

{/* SAVINGS */}



                  {totalDiscount >

                  0 ? (

                    <div

                      className="

                        mt-4

                        flex

                        items-center

                        gap-2

                        rounded-[12px]

                        bg-emerald-50

                        px-3

                        py-2.5

                        text-[10px]

                        font-semibold

                        text-emerald-700

                      "

                    >

                      <CircleCheckBig

                        size={14}

                      />



                      You save{" "}

                      {money(

                        totalDiscount

                      )}{" "}

                      on this cart

                    </div>

                  ) : null}



                  {/* TOTAL */}



                  <div

                    className="

                      mt-5

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

                        <span

                          className="

                            text-[13px]

                            font-bold

                            text-[#211817]

                          "

                        >

                          Estimated Total

                        </span>



                        <p

                          className="

                            mt-1

                            text-[8px]

                            text-black/35

                          "

                        >

                          Includes current

                          tax and

                          discounts

                        </p>

                      </div>



                      <strong

                        className="

                          font-serif

                          text-[24px]

                          text-[#211817]

                        "

                      >

                        {money(

                          total

                        )}

                      </strong>

                    </div>

                  </div>



                  <Link

                    href="/account/checkout"

                    className="

                      mt-5

                      flex

                      h-12

                      w-full

                      items-center

                      justify-center

                      gap-2

                      rounded-[11px]

                      bg-[#B31345]

                      text-[10px]

                      font-bold

                      uppercase

                      tracking-[0.06em]

                      text-white

                      transition



                      hover:bg-[#97103A]

                    "

                  >

                    <ShieldCheck

                      size={15}

                    />



                    Proceed to Checkout

                  </Link>



                  <div

                    className="

                      mt-3

                      flex

                      items-center

                      justify-center

                      gap-2

                      text-[8px]

                      text-black/35

                    "

                  >

                    <Truck

                      size={12}

                    />



                    Delivery charges,

                    if applicable, are

                    finalized by

                    checkout.

                  </div>

                </aside>

              </div>

            ) : null}

          </main>

        </div>

      </div>

    </>

  );

}



/* =========================================================

   CART ITEM

========================================================= */



function CartItemRow({

  item,

  busy,

  last,

  onMinus,

  onPlus,

  onRemove,

}: {

  item:

    CartViewItem;



  busy:

    boolean;



  last:

    boolean;



  onMinus:

    () => void;



  onPlus:

    () => void;



  onRemove:

    () => void;

}) {

  const hasLineDiscount =

    item.discount.totalDiscount >

    0;



  const actualOfferName =

    item.discount.offerName;



  const selectionLabel =

    item.offerContext

      ?.offerType ===

      "fixed_price_bundle"

      ? "Bundle selection"

      : item.offerContext

          ?.offerType ===

          "buy_get"

        ? "Buy/Get selection"

        : "";



  return (

    <article

      className={`

        grid

        min-w-0

        grid-cols-[82px_minmax(0,1fr)]

        gap-4

        px-4

        py-5



        sm:grid-cols-[105px_minmax(0,1fr)_130px]

        sm:px-5



        ${

          !last

            ? "border-b border-[#EEE5E1]"

            : ""

        }

      `}

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

          relative

          h-[100px]

          w-[82px]

          overflow-hidden

          rounded-[11px]

          border

          border-[#EEE4E0]

          bg-[#F5F1EF]



          sm:h-[125px]

          sm:w-[105px]

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

              grid

              h-full

              w-full

              place-items-center

              text-[#B31345]

            "

          >

            <ShoppingBag

              size={24}

            />

          </div>

        )}

      </Link>



      <div

        className="

          min-w-0

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

            font-serif

            text-[15px]

            leading-5

            text-[#211817]



            sm:text-[16px]

          "

        >

          {item.name}

        </Link>



        <p

          className="

            mt-2

            text-[10px]

            text-black/45

          "

        >

          {item.color

            ? `Color: ${item.color}`

            : ""}



          {item.color &&

          item.size

            ? " • "

            : ""}



          {item.size

            ? `Size: ${item.size}`

            : ""}

        </p>



        {/* OFFER BADGES */}



        <div

          className="

            mt-2

            flex

            flex-wrap

            gap-1.5

          "

        >

          {selectionLabel ? (

            <span

              className="

                inline-flex

                items-center

                gap-1

                rounded-full

                bg-[#FFF0F4]

                px-2

                py-1

                text-[8px]

                font-bold

                text-[#B31345]

              "

            >

              <BadgePercent

                size={11}

              />



              {selectionLabel}

            </span>

          ) : null}



          {actualOfferName ? (

            <span

              className="

                inline-flex

                items-center

                gap-1

                rounded-full

                bg-emerald-50

                px-2

                py-1

                text-[8px]

                font-bold

                text-emerald-700

              "

            >

              <Gift

                size={11}

              />



              {actualOfferName}

            </span>

          ) : null}

        </div>



        {/* MOBILE PRICE */}



        <div

          className="

            mt-3

            flex

            items-center

            gap-2



            sm:hidden

          "

        >

          <strong

            className="

              text-[15px]

              text-[#211817]

            "

          >

            {money(

              item.finalLineTotal

            )}

          </strong>



          {hasLineDiscount ? (

            <span

              className="

                text-[10px]

                text-black/35

                line-through

              "

            >

              {money(

                item.subtotal

              )}

            </span>

          ) : null}

        </div>



        {/* ACTIONS */}



        <div

          className="

            mt-4

            flex

            flex-wrap

            items-center

            gap-3

          "

        >

          <div

            className="

              flex

              h-9

              overflow-hidden

              rounded-[9px]

              border

              border-[#DDD1CD]

            "

          >

            <button

              type="button"

              disabled={

                busy ||

                item.quantity <=

                  1

              }

              onClick={

                onMinus

              }

              className="

                grid

                w-9

                place-items-center

                bg-white

                text-[#211817]

                disabled:opacity-30

              "

            >

              <Minus

                size={14}

              />

            </button>



            <span

              className="

                grid

                min-w-[40px]

                place-items-center

                border-x

                border-[#DDD1CD]

                text-[11px]

                font-bold

                text-[#211817]

              "

            >

              {busy ? (

                <Loader2

                  className="

                    animate-spin

                  "

                  size={13}

                />

              ) : (

                item.quantity

              )}

            </span>



            <button

              type="button"

              disabled={

                busy ||

                (

                  item.availableStock >

                    0 &&

                  item.quantity >=

                    item.availableStock

                )

              }

              onClick={

                onPlus

              }

              className="

                grid

                w-9

                place-items-center

                bg-white

                text-[#211817]

                disabled:opacity-30

              "

            >

              <Plus

                size={14}

              />

            </button>

          </div>



          <button

            type="button"

            disabled={

              busy

            }

            onClick={

              onRemove

            }

            className="

              inline-flex

              h-9

              items-center

              gap-1.5

              rounded-[9px]

              border

              border-[#E5C8CE]

              bg-[#FFF7F8]

              px-3

              text-[9px]

              font-bold

              text-[#B31345]

              disabled:opacity-40

            "

          >

            <Trash2

              size={13}

            />



            Remove

          </button>

        </div>



        {hasLineDiscount ? (

          <p

            className="

              mt-3

              text-[9px]

              font-semibold

              text-emerald-700

            "

          >

            You save{" "}

            {money(

              item.discount.totalDiscount

            )}{" "}

            on this item

          </p>

        ) : null}

      </div>



      {/* DESKTOP LINE PRICE */}



      <div

        className="

          hidden

          min-w-0

          text-right



          sm:block

        "

      >

        <strong

          className="

            block

            font-serif

            text-[18px]

            text-[#211817]

          "

        >

          {money(

            item.finalLineTotal

          )}

        </strong>



        {hasLineDiscount ? (

          <>

            <span

              className="

                mt-1

                block

                text-[10px]

                text-black/35

                line-through

              "

            >

              {money(

                item.subtotal

              )}

            </span>



            <span

              className="

                mt-1

                block

                text-[8px]

                font-semibold

                text-emerald-700

              "

            >

              -

              {money(

                item.discount.totalDiscount

              )}

            </span>

          </>

        ) : null}

      </div>

    </article>

  );

}



/* =========================================================

   SMALL COMPONENTS

========================================================= */



function MiniStat({

  label,

  value,

}: {

  label:

    string;



  value:

    string;

}) {

  return (

    <div

      className="

        min-w-[90px]

        rounded-[13px]

        border

        border-white/80

        bg-white/80

        px-4

        py-3

        shadow-sm

        backdrop-blur

      "

    >

      <strong

        className="

          block

          text-[15px]

          text-[#211817]

        "

      >

        {value}

      </strong>



      <span

        className="

          mt-1

          block

          text-[8px]

          font-semibold

          uppercase

          tracking-[0.08em]

          text-black/35

        "

      >

        {label}

      </span>

    </div>

  );

}



function StateBox({

  children,

}: {

  children:

    React.ReactNode;

}) {

  return (

    <div

      className="

        mt-5

        flex

        min-h-[190px]

        items-center

        justify-center

        rounded-[18px]

        border

        border-[#E7DEDA]

        bg-white

        px-5

        text-center

        text-[12px]

        font-semibold

        text-[#211817]

      "

    >

      {children}

    </div>

  );

}



function SummaryRow({

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

        gap-5

      "

    >

      <span

        className="

          min-w-0

          text-black/55

        "

      >

        {label}

      </span>



      <strong

        className={`

          shrink-0

          text-right



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
