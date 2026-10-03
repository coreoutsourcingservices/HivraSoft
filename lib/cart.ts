import {
  apiFetch,
} from "./api";

/* =========================================================
   TYPES
========================================================= */

export type AddToCartInput = {
  productId: string;
  colorId: string;
  sizeId: string;
  quantity?: number;
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
) {
  const response =
    await apiFetch(
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