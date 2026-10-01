import {
  apiFetch,
} from "./api";

/* =========================================================
   ADD CART INPUT
========================================================= */

export type AddCartInput = {
  productId: string;

  colorId: string;

  sizeId: string;

  quantity?: number;
};

/* =========================================================
   RESPONSE
========================================================= */

type CartApiResponse = {
  success: boolean;

  message?: string;

  count?: number;

  cart?: {
    totalItems?: number;

    items?: Array<{
      quantity?: number;
    }>;
  };
};

/* =========================================================
   GET COUNT
========================================================= */

function getCount(
  response: CartApiResponse
): number | undefined {
  if (
    typeof response.count ===
    "number"
  ) {
    return response.count;
  }

  if (
    typeof response.cart
      ?.totalItems ===
    "number"
  ) {
    return response.cart
      .totalItems;
  }

  if (
    Array.isArray(
      response.cart
        ?.items
    )
  ) {
    return response.cart!.items!.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(
          item.quantity ||
            0
        ),
      0
    );
  }

  return undefined;
}

/* =========================================================
   NOTIFY HEADER
========================================================= */

function notifyCartUpdated(
  response: CartApiResponse
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  const count =
    getCount(
      response
    );

  window.dispatchEvent(
    new CustomEvent(
      "hivrasoft-cart-updated",
      {
        detail: {
          count,
        },
      }
    )
  );

  window.dispatchEvent(
    new Event(
      "hivra:store-changed"
    )
  );
}

/* =========================================================
   ADD TO CART
========================================================= */

export async function addToCart(
  input: AddCartInput
) {
  const response =
    await apiFetch<CartApiResponse>(
      "/api/cart",
      {
        method:
          "POST",

        body: {
          productId:
            input.productId,

          colorId:
            input.colorId,

          sizeId:
            input.sizeId,

          quantity:
            input.quantity ||
            1,
        },
      }
    );

  notifyCartUpdated(
    response
  );

  return response;
}