import Offer from "../models/Offer.model";

/* =========================================================

   TYPES

========================================================= */

export type ContextOfferType =

  | "buy_get"

  | "fixed_price_bundle"

  | "";

export type ContextOfferSource =

  | "buy_get_page"

  | "fixed_price_bundle"

  | "";

export type ContextDiscountItem = {

  lineId: string;

  productId: string;

  unitPrice: number;

  quantity: number;

  offerId?:

    | string

    | null;

  offerType?:

    ContextOfferType;

  offerSource?:

    ContextOfferSource;

};

export type AppliedContextOffer = {

  offerId: string;

  name: string;

  offerType:

    | "buy_get"

    | "fixed_price_bundle";

  amount: number;

};

export type OfferProgress = {

  offerId: string;

  name: string;

  offerType:

    | "buy_get"

    | "fixed_price_bundle";

  requiredQuantity: number;

  selectedQuantity: number;

  remainingQuantity: number;

  unlocked: boolean;

  completedBundles: number;

  fixedPrice: number;

  getQuantity: number;

  getPrice: number;

};

export type ContextOfferPricingResult = {

  totalOfferDiscount:

    number;

  offerDiscountByLine:

    Map<string, number>;

  offerMetaByLine:

    Map<

      string,

      {

        offerId: string;

        offerName: string;

        offerType:

          | "buy_get"

          | "fixed_price_bundle";

      }

    >;

  applied:

    AppliedContextOffer[];

  progress:

    OfferProgress[];

};

/* =========================================================

   HELPERS

========================================================= */

function money(

  value:

    unknown

) {

  const number =

    Number(

      value ||

        0

    );

  if (

    !Number.isFinite(

      number

    )

  ) {

    return 0;

  }

  return Math.max(

    0,

    Number(

      number.toFixed(

        2

      )

    )

  );

}

function safeQuantity(

  value:

    unknown

) {

  const number =

    Math.floor(

      Number(

        value ||

          0

      )

    );

  if (

    !Number.isFinite(

      number

    )

  ) {

    return 0;

  }

  return Math.max(

    0,

    number

  );

}

function addLineDiscount(

  map:

    Map<string, number>,

  lineId:

    string,

  amount:

    number

) {

  const current =

    Number(

      map.get(

        lineId

      ) ||

        0

    );

  map.set(

    lineId,

    money(

      current +

        amount

    )

  );

}

/* =========================================================

   DISTRIBUTE FIXED-BUNDLE DISCOUNT

   Selected bundle units ko highest unit-price first choose

   kiya jaata hai. Isse "any N for fixed price" me customer

   ko best valid benefit milta hai.

   Example:

   4 × ₹169 = ₹676

   fixedPrice = ₹275

   discount = ₹401

========================================================= */

function applyFixedBundle(

  offer:

    any,

  items:

    ContextDiscountItem[],

  offerDiscountByLine:

    Map<string, number>,

  offerMetaByLine:

    ContextOfferPricingResult[

      "offerMetaByLine"

    ]

) {

  const requiredQuantity =

    Math.max(

      1,

      safeQuantity(

        offer.buyQuantity

      ) ||

        1

    );

  const fixedPrice =

    money(

      offer.fixedPrice

    );

  const selectedQuantity =

    items.reduce(

      (

        total,

        item

      ) =>

        total +

        safeQuantity(

          item.quantity

        ),

      0

    );

  const completedBundles =

    Math.floor(

      selectedQuantity /

        requiredQuantity

    );

  const currentRemainder =

    selectedQuantity %

    requiredQuantity;

  const unlocked =

    selectedQuantity >

      0 &&

    completedBundles >

      0;

  const remainingQuantity =

    unlocked &&

    currentRemainder ===

      0

      ? 0

      : currentRemainder >

          0

        ? requiredQuantity -

          currentRemainder

        : requiredQuantity;

  const progress:

    OfferProgress = {

      offerId:

        String(

          offer._id

        ),

      name:

        String(

          offer.name ||

            "Bundle Offer"

        ),

      offerType:

        "fixed_price_bundle",

      requiredQuantity,

      selectedQuantity,

      remainingQuantity:

        selectedQuantity ===

          0

          ? requiredQuantity

          : remainingQuantity,

      unlocked,

      completedBundles,

      fixedPrice,

      getQuantity: 0,

      getPrice: 0,

    };

  if (

    completedBundles <=

      0 ||

    fixedPrice <=

      0

  ) {

    return {

      amount: 0,

      progress,

    };

  }

  const unitsToBundle =

    completedBundles *

    requiredQuantity;

  /*

   * Highest price units first.

   */

  const sorted =

    [...items].sort(

      (

        first,

        second

      ) =>

        money(

          second.unitPrice

        ) -

        money(

          first.unitPrice

        )

    );

  let remainingUnits =

    unitsToBundle;

  const selectedLines:

    Array<{

      item:

        ContextDiscountItem;

      bundledQuantity:

        number;

      subtotal:

        number;

    }> = [];

  for (

    const item of

      sorted

  ) {

    if (

      remainingUnits <=

      0

    ) {

      break;

    }

    const quantity =

      safeQuantity(

        item.quantity

      );

    if (

      quantity <=

      0

    ) {

      continue;

    }

    const bundledQuantity =

      Math.min(

        quantity,

        remainingUnits

      );

    selectedLines.push({

      item,

      bundledQuantity,

      subtotal:

        money(

          bundledQuantity *

            money(

              item.unitPrice

            )

        ),

    });

    remainingUnits -=

      bundledQuantity;

  }

  const normalBundleSubtotal =

    money(

      selectedLines.reduce(

        (

          total,

          line

        ) =>

          total +

          line.subtotal,

        0

      )

    );

  const targetBundleTotal =

    money(

      completedBundles *

        fixedPrice

    );

  const totalDiscount =

    money(

      Math.max(

        0,

        normalBundleSubtotal -

          targetBundleTotal

      )

    );

  if (

    totalDiscount <=

    0

  ) {

    return {

      amount: 0,

      progress,

    };

  }

  let distributed =

    0;

  selectedLines.forEach(

    (

      line,

      index

    ) => {

      let lineDiscount =

        index ===

        selectedLines.length -

          1

          ? money(

              totalDiscount -

                distributed

            )

          : money(

              totalDiscount *

                (

                  line.subtotal /

                  normalBundleSubtotal

                )

            );

      lineDiscount =

        Math.min(

          line.subtotal,

          lineDiscount

        );

      distributed =

        money(

          distributed +

            lineDiscount

        );

      addLineDiscount(

        offerDiscountByLine,

        line.item.lineId,

        lineDiscount

      );

      offerMetaByLine.set(

        line.item.lineId,

        {

          offerId:

            String(

              offer._id

            ),

          offerName:

            String(

              offer.name ||

                "Bundle Offer"

            ),

          offerType:

            "fixed_price_bundle",

        }

      );

    }

  );

  return {

    amount:

      money(

        distributed

      ),

    progress,

  };

}

/* =========================================================

   BUY GET

   Buy 3 Get 1:

   trigger = 4 selected units

   free units = cheapest eligible unit(s)

   IMPORTANT:

   Sirf source=buy_get_page lines count hongi.

========================================================= */

function applyBuyGet(

  offer:

    any,

  items:

    ContextDiscountItem[],

  offerDiscountByLine:

    Map<string, number>,

  offerMetaByLine:

    ContextOfferPricingResult[

      "offerMetaByLine"

    ]

) {

  const buyQuantity =

    Math.max(

      1,

      safeQuantity(

        offer.buyQuantity

      ) ||

        1

    );

  const getQuantity =

    Math.max(

      0,

      safeQuantity(

        offer.getQuantity

      )

    );

  const requiredQuantity =

    buyQuantity +

    getQuantity;

  const selectedQuantity =

    items.reduce(

      (

        total,

        item

      ) =>

        total +

        safeQuantity(

          item.quantity

        ),

      0

    );

  const completedBundles =

    requiredQuantity >

      0

      ? Math.floor(

          selectedQuantity /

            requiredQuantity

        )

      : 0;

  const currentRemainder =

    requiredQuantity >

      0

      ? selectedQuantity %

        requiredQuantity

      : 0;

  const unlocked =

    completedBundles >

    0;

  const remainingQuantity =

    selectedQuantity ===

      0

      ? requiredQuantity

      : currentRemainder ===

          0 &&

        unlocked

        ? 0

        : Math.max(

            0,

            requiredQuantity -

              currentRemainder

          );

  const progress:

    OfferProgress = {

      offerId:

        String(

          offer._id

        ),

      name:

        String(

          offer.name ||

            "Buy/Get Offer"

        ),

      offerType:

        "buy_get",

      requiredQuantity,

      selectedQuantity,

      remainingQuantity,

      unlocked,

      completedBundles,

      fixedPrice: 0,

      getQuantity,

      getPrice: money(offer.getPrice ?? 0),

    };

  if (

    completedBundles <=

      0 ||

    getQuantity <=

      0

  ) {

    return {

      amount: 0,

      progress,

    };

  }

  const discountedUnits =

    completedBundles *

    getQuantity;

  const getPrice = money(offer.getPrice ?? 0);

  /*

   * Cheapest units free.

   */

  const sorted =

    [...items].sort(

      (

        first,

        second

      ) =>

        money(

          first.unitPrice

        ) -

        money(

          second.unitPrice

        )

    );

  let remainingDiscountedUnits =

    discountedUnits;

  let totalDiscount =

    0;

  for (

    const item of

      sorted

  ) {

    if (

      remainingDiscountedUnits <=

      0

    ) {

      break;

    }

    const quantity =

      safeQuantity(

        item.quantity

      );

    const freeQuantity =

      Math.min(

        quantity,

        remainingDiscountedUnits

      );

    if (

      freeQuantity <=

      0

    ) {

      continue;

    }

    // Get items are charged at the admin price, not always free.
    // Do not charge extra if a product's normal price is already lower.
    const lineDiscount = money(
      freeQuantity * Math.max(0, money(item.unitPrice) - getPrice)
    );

    addLineDiscount(

      offerDiscountByLine,

      item.lineId,

      lineDiscount

    );

    offerMetaByLine.set(

      item.lineId,

      {

        offerId:

          String(

            offer._id

          ),

        offerName:

          String(

            offer.name ||

              "Buy/Get Offer"

          ),

        offerType:

          "buy_get",

      }

    );

    totalDiscount =

      money(

        totalDiscount +

          lineDiscount

      );

    remainingDiscountedUnits -=

      freeQuantity;

  }

  return {

    amount:

      totalDiscount,

    progress,

  };

}

/* =========================================================

   MAIN

========================================================= */

export async function calculateContextOffers(

  items:

    ContextDiscountItem[]

): Promise<

  ContextOfferPricingResult

> {

  const offerDiscountByLine =

    new Map<

      string,

      number

    >();

  const offerMetaByLine =

    new Map<

      string,

      {

        offerId: string;

        offerName: string;

        offerType:

          | "buy_get"

          | "fixed_price_bundle";

      }

    >();

  const applied:

    AppliedContextOffer[] =

    [];

  const progress:

    OfferProgress[] =

    [];

  const validItems =

    items.filter(

      (

        item

      ) =>

        Boolean(

          item.lineId

        ) &&

        Boolean(

          item.offerId

        ) &&

        (

          item.offerType ===

            "buy_get" ||

          item.offerType ===

            "fixed_price_bundle"

        )

    );

  if (

    validItems.length ===

    0

  ) {

    return {

      totalOfferDiscount:

        0,

      offerDiscountByLine,

      offerMetaByLine,

      applied,

      progress,

    };

  }

  const offerIds =

    Array.from(

      new Set(

        validItems

          .map(

            (

              item

            ) =>

              String(

                item.offerId ||

                  ""

              )

          )

          .filter(

            Boolean

          )

      )

    );

  const offers =

    await Offer.find({

      _id: {

        $in:

          offerIds,

      },

      isActive:

        true,

      isDeleted: {

        $ne:

          true,

      },

    }).lean();

  const offerMap =

    new Map<string, any>(

      offers.map(

        (

          offer:

            any

        ) => [

          String(

            offer._id

          ),

          offer,

        ]

      )

    );

  for (

    const offerId of

      offerIds

  ) {

    const offer =

      offerMap.get(

        offerId

      );

    if (!offer) {

      continue;

    }

    if (

      offer.offerType ===

      "buy_get"

    ) {

      const matchingItems =

        validItems.filter(

          (

            item

          ) =>

            String(

              item.offerId ||

                ""

            ) ===

              offerId &&

            item.offerType ===

              "buy_get" &&

            item.offerSource ===

              "buy_get_page"

        );

      if (

        matchingItems.length ===

        0

      ) {

        continue;

      }

      const result =

        applyBuyGet(

          offer,

          matchingItems,

          offerDiscountByLine,

          offerMetaByLine

        );

      progress.push(

        result.progress

      );

      if (

        result.amount >

        0

      ) {

        applied.push({

          offerId,

          name:

            String(

              offer.name ||

                "Buy/Get Offer"

            ),

          offerType:

            "buy_get",

          amount:

            result.amount,

        });

      }

      continue;

    }

    if (

      offer.offerType ===

      "fixed_price_bundle"

    ) {

      const matchingItems =

        validItems.filter(

          (

            item

          ) =>

            String(

              item.offerId ||

                ""

            ) ===

              offerId &&

            item.offerType ===

              "fixed_price_bundle" &&

            item.offerSource ===

              "fixed_price_bundle"

        );

      if (

        matchingItems.length ===

        0

      ) {

        continue;

      }

      const result =

        applyFixedBundle(

          offer,

          matchingItems,

          offerDiscountByLine,

          offerMetaByLine

        );

      progress.push(

        result.progress

      );

      if (

        result.amount >

        0

      ) {

        applied.push({

          offerId,

          name:

            String(

              offer.name ||

                "Bundle Offer"

            ),

          offerType:

            "fixed_price_bundle",

          amount:

            result.amount,

        });

      }

    }

  }

  const totalOfferDiscount =

    money(

      Array.from(

        offerDiscountByLine.values()

      ).reduce(

        (

          total,

          amount

        ) =>

          total +

          amount,

        0

      )

    );

  return {

    totalOfferDiscount,

    offerDiscountByLine,

    offerMetaByLine,

    applied,

    progress,

  };

}
