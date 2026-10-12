import {
  apiFetch,
} from "./api";

/* =========================================================
   TYPES
========================================================= */

export type CartOfferType =
  | "buy_get"
  | "fixed_price_bundle";

export type CartOfferSource =
  | "buy_get_page"
  | "fixed_price_bundle";

export type CartOfferContext = {
  offerId: string;

  offerType:
    CartOfferType;

  source:
    CartOfferSource;

  /*
   * DISPLAY-ONLY DATA
   *
   * Backend pricing ke liye in values ko trust nahi karega.
   * Ye sirf frontend notification/progress ke liye hain.
   */
  offerName?: string;

  requiredQuantity?: number;

  getQuantity?: number;

  fixedPrice?: number;
};

export type CartResponseOfferContext = {
  offerId?: string;

  offerType?: string;

  source?: string;
};

export type AddToCartResponse = {
  success?: boolean;

  message?: string;

  cart?: {
    items?: Array<{
      _id?: string;

      quantity?: number;

      offerContext?:
        | CartResponseOfferContext
        | null;
    }>;

    totalItems?: number;
  };
};

export type AddToCartInput = {
  productId: string;
  colorId: string;
  sizeId: string;
  quantity?: number;

  offerContext?:
    | CartOfferContext
    | null;
};

type CartCountResponse = {
  count?: number;
  cartCount?: number;
  totalItems?: number;

  data?: {
    count?: number;
    cartCount?: number;
    totalItems?: number;
  };
};

/* =========================================================
   EVENTS
========================================================= */

function dispatchCartUpdated() {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

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
}

/* =========================================================
   GET CART
========================================================= */

export async function getCart() {
  return apiFetch(
    "/api/cart",
    {
      method: "GET",
    }
  );
}

/* =========================================================
   GET CART COUNT
========================================================= */

export async function getCartCount(): Promise<number> {
  const response =
    await apiFetch<CartCountResponse>(
      "/api/cart/count",
      {
        method: "GET",
      }
    );

  return Number(
    response?.count ??
      response?.cartCount ??
      response?.totalItems ??
      response?.data?.count ??
      response?.data?.cartCount ??
      response?.data?.totalItems ??
      0
  );
}

/* =========================================================
   ADD TO CART
========================================================= */

export async function addToCart(
  input: AddToCartInput
): Promise<AddToCartResponse> {
  /*
   * IMPORTANT:
   *
   * Backend ko sirf trusted identifiers/source bhejenge.
   * offerName / requiredQuantity / fixedPrice frontend display data hai.
   * Actual offer values backend apne Offer collection se verify karega.
   */
  const secureOfferContext =
    input.offerContext
      ? {
          offerId:
            input.offerContext
              .offerId,

          offerType:
            input.offerContext
              .offerType,

          source:
            input.offerContext
              .source,
        }
      : null;

  const response =
    await apiFetch<AddToCartResponse>(
      "/api/cart",
      {
        method: "POST",

        body: {
          productId:
            input.productId,

          colorId:
            input.colorId,

          sizeId:
            input.sizeId,

          quantity:
            input.quantity ??
            1,

          offerContext:
            secureOfferContext,
        },
      }
    );

  dispatchCartUpdated();

  return response;
}

/* =========================================================
   UPDATE ITEM
========================================================= */

export async function updateCartItem(
  cartItemId: string,
  quantity: number
) {
  const response =
    await apiFetch(
      `/api/cart/${encodeURIComponent(
        cartItemId
      )}`,
      {
        method: "PATCH",

        body: {
          quantity,
        },
      }
    );

  dispatchCartUpdated();

  return response;
}

/* =========================================================
   REMOVE ITEM
========================================================= */

export async function removeCartItem(
  cartItemId: string
) {
  const response =
    await apiFetch(
      `/api/cart/${encodeURIComponent(
        cartItemId
      )}`,
      {
        method: "DELETE",
      }
    );

  dispatchCartUpdated();

  return response;
}

/* =========================================================
   CLEAR CART
========================================================= */

export async function clearCart() {
  const response =
    await apiFetch(
      "/api/cart",
      {
        method: "DELETE",
      }
    );

  dispatchCartUpdated();

  return response;
}

/* =========================================================
   DISCOUNT CODE
========================================================= */

export async function applyDiscountCode(
  code: string
) {
  const response =
    await apiFetch(
      "/api/cart/discount-code",
      {
        method: "POST",

        body: {
          code,
        },
      }
    );

  dispatchCartUpdated();

  return response;
}

export async function removeDiscountCode() {
  const response =
    await apiFetch(
      "/api/cart/discount-code",
      {
        method: "DELETE",
      }
    );

  dispatchCartUpdated();

  return response;
}