/* =========================================================
   CART VIEW NORMALIZER

   Shared by cart + checkout.
========================================================= */

export type CartOfferContextView = {
  offerId: string;
  offerType: string;
  source: string;
};

export type CartDiscountView = {
  offerId: string;
  offerName: string;
  offerType: string;

  offerDiscount: number;
  automaticDiscount: number;
  codeDiscount: number;

  totalDiscount: number;
  finalLineTotal: number;
};

export type CartViewItem = {
  id: string;

  productId: string;
  colorId: string;
  sizeId: string;

  name: string;
  slug: string;

  color: string;
  size: string;

  image: string;

  quantity: number;

  unitPrice: number;
  subtotal: number;

  availableStock: number;
  available: boolean;

  offerContext:
    | CartOfferContextView
    | null;

  discount:
    CartDiscountView;

  finalLineTotal: number;
};

export type CartAppliedOffer = {
  offerId: string;
  name: string;
  offerType: string;
  amount: number;
};

/* =========================================================
   AVAILABLE DISCOUNT CODE
========================================================= */

export type CartAvailableDiscountCode = {
  _id: string;

  code: string;

  startsAt:
    string | null;

  endsAt:
    string | null;
};

export type CartOfferProgress = {
  offerId: string;

  name: string;

  offerType:
    string;

  requiredQuantity:
    number;

  selectedQuantity:
    number;

  remainingQuantity:
    number;

  unlocked:
    boolean;

  completedBundles:
    number;

  fixedPrice:
    number;

  getQuantity:
    number;
};

export type CartView = {
  items:
    CartViewItem[];

  totalItems:
    number;

  subtotal:
    number;

  offerDiscount:
    number;

  automaticDiscount:
    number;

  codeDiscount:
    number;

  discount:
    number;

  appliedOffers:
    CartAppliedOffer[];

  offerProgress:
    CartOfferProgress[];

  automatic: {
    active: boolean;
    matched: boolean;
    name: string;
    percentage: number;
    amount: number;
  } | null;

  appliedDiscountCode:
    string;

  availableDiscountCodes:
    CartAvailableDiscountCode[];

  taxableAmount:
    number;

  tax:
    number;

  taxName:
    string;

  taxPercentage:
    number;

  deliveryCharge:
    number | null;

  total:
    number;
};

/* =========================================================
   OBJECT HELPER
========================================================= */

function obj(
  value:
    unknown
): Record<
  string,
  unknown
> {
  if (
    value &&
    typeof value ===
      "object" &&
    !Array.isArray(
      value
    )
  ) {
    return value as Record<
      string,
      unknown
    >;
  }

  return {};
}

/* =========================================================
   ARRAY HELPER
========================================================= */

function arr(
  value:
    unknown
): unknown[] {
  return Array.isArray(
    value
  )
    ? value
    : [];
}

/* =========================================================
   TEXT HELPER
========================================================= */

function text(
  ...values:
    unknown[]
): string {
  for (
    const value of
      values
  ) {
    if (
      typeof value ===
        "string" &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return "";
}

/* =========================================================
   NUMBER HELPER
========================================================= */

function num(
  value:
    unknown,
  fallback =
    0
): number {
  const parsed =
    Number(
      value
    );

  return Number.isFinite(
    parsed
  )
    ? parsed
    : fallback;
}

/* =========================================================
   OPTIONAL NUMBER
========================================================= */

function optionalNum(
  ...values:
    unknown[]
): number | null {
  for (
    const value of
      values
  ) {
    if (
      value === null ||
      value ===
        undefined ||
      value === ""
    ) {
      continue;
    }

    const parsed =
      Number(
        value
      );

    if (
      Number.isFinite(
        parsed
      )
    ) {
      return parsed;
    }
  }

  return null;
}

/* =========================================================
   ID HELPER
========================================================= */

function idOf(
  value:
    unknown
): string {
  if (
    typeof value ===
    "string"
  ) {
    return value;
  }

  const valueObject =
    obj(
      value
    );

  return text(
    valueObject._id,
    valueObject.id
  );
}

/* =========================================================
   IMAGE HELPER
========================================================= */

function imageOf(
  value:
    unknown
): string {
  if (
    typeof value ===
    "string"
  ) {
    return value;
  }

  const image =
    obj(
      value
    );

  return text(
    image.url,
    image.src,
    image.image,
    image.imageUrl
  );
}

/* =========================================================
   FIRST IMAGE
========================================================= */

function firstImage(
  ...values:
    unknown[]
) {
  for (
    const value of
      values
  ) {
    if (
      Array.isArray(
        value
      )
    ) {
      const preferred =
        value.find(
          (
            image
          ) =>
            obj(
              image
            ).isDefault ===
            true
        );

      const preferredUrl =
        imageOf(
          preferred
        );

      if (
        preferredUrl
      ) {
        return preferredUrl;
      }

      for (
        const image of
          value
      ) {
        const url =
          imageOf(
            image
          );

        if (
          url
        ) {
          return url;
        }
      }
    }

    const direct =
      imageOf(
        value
      );

    if (
      direct
    ) {
      return direct;
    }
  }

  return "";
}

/* =========================================================
   NORMALIZE CART ITEM
========================================================= */

function normalizeItem(
  raw:
    unknown
): CartViewItem | null {
  const item =
    obj(
      raw
    );

  const id =
    idOf(
      item
    );

  if (
    !id
  ) {
    return null;
  }

  const product =
    obj(
      item.product
    );

  const color =
    obj(
      item.selectedColor ||
        item.color
    );

  const size =
    obj(
      item.selectedSize ||
        item.size
    );

  const discount =
    obj(
      item.discount
    );

  const offerContextRaw =
    obj(
      item.offerContext
    );

  const quantity =
    Math.max(
      1,
      Math.floor(
        num(
          item.quantity,
          1
        )
      )
    );

  const unitPrice =
    Math.max(
      0,
      num(
        item.unitPrice,
        num(
          product.price
        )
      )
    );

  const subtotal =
    Math.max(
      0,
      num(
        item.subtotal,
        unitPrice *
          quantity
      )
    );

  const totalDiscount =
    Math.max(
      0,
      num(
        discount.totalDiscount
      )
    );

  const finalLineTotal =
    Math.max(
      0,
      num(
        discount.finalLineTotal,
        subtotal -
          totalDiscount
      )
    );

  const offerId =
    text(
      offerContextRaw.offerId
    );

  return {
    id,

    productId:
      text(
        idOf(
          item.product
        ),
        product._id,
        item.productId
      ),

    colorId:
      text(
        idOf(
          item.colorId
        ),
        color._id
      ),

    sizeId:
      text(
        idOf(
          item.sizeId
        ),
        size._id
      ),

    name:
      text(
        product.name,
        product.nameProduct,
        item.productName,
        "Product"
      ),

    slug:
      text(
        product.slug,
        product.slugProduct,
        item.slug
      ),

    color:
      text(
        color.name,
        color.nameColor,
        item.colorName
      ),

    size:
      text(
        size.size,
        size.name,
        item.sizeLabel
      ),

    image:
      firstImage(
        color.images,
        product.mainImages,
        product.images,
        item.image,
        item.imageUrl
      ),

    quantity,

    unitPrice,

    subtotal,

   availableStock: Math.max(
  0,
  num(
    item.availableStock,
    num(size.stock)
  )
),

available: item.available !== false,

offerContext:
  offerId
    ? {
        offerId,

            offerType:
              text(
                offerContextRaw.offerType
              ),

            source:
              text(
                offerContextRaw.source
              ),
          }
        : null,

    discount: {
      offerId:
        text(
          discount.offerId
        ),

      offerName:
        text(
          discount.offerName
        ),

      offerType:
        text(
          discount.offerType
        ),

      offerDiscount:
        Math.max(
          0,
          num(
            discount.offerDiscount
          )
        ),

      automaticDiscount:
        Math.max(
          0,
          num(
            discount.automaticDiscount
          )
        ),

      codeDiscount:
        Math.max(
          0,
          num(
            discount.codeDiscount
          )
        ),

      totalDiscount,

      finalLineTotal,
    },

    finalLineTotal,
  };
}

/* =========================================================
   NORMALIZE CART RESPONSE
========================================================= */

export function normalizeCartResponse(
  response:
    unknown
): CartView {
  /* =======================================================
     ROOT
  ======================================================= */

  const root =
    obj(
      response
    );

  const data =
    obj(
      root.data
    );

  /*
   * Supported:
   *
   * {
   *   cart: {...}
   * }
   *
   * {
   *   data: {
   *     cart: {...}
   *   }
   * }
   *
   * direct cart object
   */
  const cart =
    obj(
      root.cart ||
        data.cart ||
        data
    );

  /* =======================================================
     ITEMS
  ======================================================= */

  const items =
    arr(
      cart.items
    )
      .map(
        normalizeItem
      )
      .filter(
        (
          value
        ): value is CartViewItem =>
          Boolean(
            value
          )
      );

  /* =======================================================
     DISCOUNT SUMMARY
  ======================================================= */

  const discountSummary =
    obj(
      cart.discountSummary
    );

  const offersSummary =
    obj(
      discountSummary.offers
    );

  const automaticSummary =
    obj(
      discountSummary.automatic
    );

  const taxSummary =
    obj(
      cart.taxSummary
    );

  /* =======================================================
     APPLIED OFFERS
  ======================================================= */

  const appliedOffers =
    arr(
      offersSummary.applied
    )
      .map(
        (
          value
        ) => {
          const offer =
            obj(
              value
            );

          const name =
            text(
              offer.name
            );

          if (
            !name
          ) {
            return null;
          }

          return {
            offerId:
              text(
                offer.offerId
              ),

            name,

            offerType:
              text(
                offer.offerType
              ),

            amount:
              Math.max(
                0,
                num(
                  offer.amount
                )
              ),
          };
        }
      )
      .filter(
        (
          value
        ): value is CartAppliedOffer =>
          Boolean(
            value
          )
      );

  /* =======================================================
     OFFER PROGRESS
  ======================================================= */

  const offerProgress =
    arr(
      cart.offerProgress
    )
      .map(
        (
          value
        ) => {
          const progress =
            obj(
              value
            );

          const offerId =
            text(
              progress.offerId
            );

          const name =
            text(
              progress.name
            );

          if (
            !offerId ||
            !name
          ) {
            return null;
          }

          return {
            offerId,

            name,

            offerType:
              text(
                progress.offerType
              ),

            requiredQuantity:
              Math.max(
                1,
                num(
                  progress.requiredQuantity,
                  1
                )
              ),

            selectedQuantity:
              Math.max(
                0,
                num(
                  progress.selectedQuantity
                )
              ),

            remainingQuantity:
              Math.max(
                0,
                num(
                  progress.remainingQuantity
                )
              ),

            unlocked:
              progress.unlocked ===
              true,

            completedBundles:
              Math.max(
                0,
                num(
                  progress.completedBundles
                )
              ),

            fixedPrice:
              Math.max(
                0,
                num(
                  progress.fixedPrice
                )
              ),

            getQuantity:
              Math.max(
                0,
                num(
                  progress.getQuantity
                )
              ),
          };
        }
      )
      .filter(
        (
          value
        ): value is CartOfferProgress =>
          Boolean(
            value
          )
      );

  /* =======================================================
     AVAILABLE DISCOUNT CODES

     IMPORTANT:
     Ye normalizeCartResponse ke andar hi rehna chahiye,
     kyunki "cart" variable yahin available hai.
  ======================================================= */

  const availableDiscountCodes =
    arr(
      cart.availableDiscountCodes
    )
      .map(
        (
          value
        ) => {
          const coupon =
            obj(
              value
            );

          const code =
            text(
              coupon.code
            )
              .trim()
              .toUpperCase();

          if (
            !code
          ) {
            return null;
          }

          return {
            _id:
              text(
                coupon._id,
                coupon.id,
                code
              ),

            code,

            startsAt:
              text(
                coupon.startsAt
              ) ||
              null,

            endsAt:
              text(
                coupon.endsAt
              ) ||
              null,
          };
        }
      )
      .filter(
        (
          value
        ): value is CartAvailableDiscountCode =>
          Boolean(
            value
          )
      );

  /* =======================================================
     SUBTOTAL
  ======================================================= */

  const subtotal =
    Math.max(
      0,
      num(
        cart.subtotal,
        items.reduce(
          (
            total,
            item
          ) =>
            total +
            item.subtotal,
          0
        )
      )
    );

  /* =======================================================
     OFFER DISCOUNT
  ======================================================= */

  const offerDiscount =
    Math.max(
      0,
      num(
        cart.offerDiscount
      )
    );

  /* =======================================================
     AUTOMATIC DISCOUNT
  ======================================================= */

  const automaticDiscount =
    Math.max(
      0,
      num(
        cart.automaticDiscount
      )
    );

  /* =======================================================
     CODE DISCOUNT
  ======================================================= */

  const codeDiscount =
    Math.max(
      0,
      num(
        cart.codeDiscount
      )
    );

  /* =======================================================
     TOTAL DISCOUNT
  ======================================================= */

  const discount =
    Math.max(
      0,
      num(
        cart.discount,
        offerDiscount +
          automaticDiscount +
          codeDiscount
      )
    );

  /* =======================================================
     TAX
  ======================================================= */

  const tax =
    Math.max(
      0,
      num(
        cart.tax
      )
    );

  /* =======================================================
     DELIVERY
  ======================================================= */

  const deliveryCharge =
    optionalNum(
      cart.deliveryCharge,
      cart.shippingCharge,
      cart.shipping,
      cart.deliveryFee
    );

  /* =======================================================
     FINAL CART VIEW
  ======================================================= */

  return {
    items,

    totalItems:
      Math.max(
        0,
        num(
          cart.totalItems,
          items.reduce(
            (
              total,
              item
            ) =>
              total +
              item.quantity,
            0
          )
        )
      ),

    subtotal,

    offerDiscount,

    automaticDiscount,

    codeDiscount,

    discount,

    appliedOffers,

    offerProgress,

    automatic:
      Object.keys(
        automaticSummary
      ).length
        ? {
            active:
              automaticSummary.active ===
              true,

            matched:
              automaticSummary.matched ===
              true,

            name:
              text(
                automaticSummary.name,
                "Automatic Discount"
              ),

            percentage:
              Math.max(
                0,
                num(
                  automaticSummary.percentage
                )
              ),

            amount:
              Math.max(
                0,
                num(
                  automaticSummary.amount,
                  automaticDiscount
                )
              ),
          }
        : null,

    appliedDiscountCode:
      text(
        cart.appliedDiscountCode
      ),

    availableDiscountCodes,

    taxableAmount:
      Math.max(
        0,
        num(
          cart.taxableAmount
        )
      ),

    tax,

    taxName:
      text(
        taxSummary.name,
        "Tax"
      ),

    taxPercentage:
      Math.max(
        0,
        num(
          taxSummary.percentage
        )
      ),

    deliveryCharge,

    total:
      Math.max(
        0,
        num(
          cart.total,
          subtotal -
            discount +
            tax +
            Math.max(
              0,
              deliveryCharge ??
                0
            )
        )
      ),
  };
}