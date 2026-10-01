import {
  apiFetch,
} from "./api";

/* =========================================================
   TYPES
========================================================= */

export type WishlistItem = {
  _id?: string;

  product:
    | string
    | {
        _id?: string;
        id?: string;

        name?: string;
        slug?: string;
      }
    | null;

  colorId?:
    | string
    | null;

  sizeId?:
    | string
    | null;

  addedAt?: string;

  updatedAt?: string;
};

export type Wishlist = {
  _id?:
    | string
    | null;

  user?: string;

  items:
    WishlistItem[];

  createdAt?:
    | string
    | null;

  updatedAt?:
    | string
    | null;
};

type WishlistApiResponse = {
  success: boolean;

  message?: string;

  count?: number;

  wishlist?: Wishlist;
};

type WishlistCheckApiResponse = {
  success: boolean;

  message?: string;

  productId?: string;

  isWishlisted: boolean;
};

/* =========================================================
   EMPTY
========================================================= */

const EMPTY_WISHLIST: Wishlist =
  {
    items: [],
  };

/* =========================================================
   UPDATE HEADER COUNT
========================================================= */

function notifyWishlistUpdated(
  wishlist?: Wishlist
) {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(
      "hivrasoft-wishlist-updated",
      {
        detail: {
          count:
            wishlist?.items
              .length ??
            0,
        },
      }
    )
  );
}

/* =========================================================
   REQUIRE WISHLIST
========================================================= */

function requireWishlist(
  response: WishlistApiResponse
): Wishlist {
  return (
    response.wishlist ||
    EMPTY_WISHLIST
  );
}

/* =========================================================
   GET
========================================================= */

export async function getWishlist(): Promise<Wishlist> {
  const response =
    await apiFetch<WishlistApiResponse>(
      "/api/wishlist"
    );

  return requireWishlist(
    response
  );
}

/* =========================================================
   ADD

   Current colorId also saves.
========================================================= */

export async function addToWishlist(
  productId: string,

  variant?: {
    colorId?:
      | string
      | null;

    sizeId?:
      | string
      | null;
  }
): Promise<Wishlist> {
  const response =
    await apiFetch<WishlistApiResponse>(
      "/api/wishlist",
      {
        method:
          "POST",

        body: {
          productId,

          ...(variant ||
            {}),
        },
      }
    );

  const wishlist =
    requireWishlist(
      response
    );

  notifyWishlistUpdated(
    wishlist
  );

  return wishlist;
}

/* =========================================================
   REMOVE

   Backend service supports:

   wishlist ITEM id
   OR
   product id

   Catalog color-wise removal ke liye wishlist item id bhejenge.

   Isliye:

   Beige remove
   ≠
   Black remove
========================================================= */

export async function removeFromWishlist(
  itemOrProductId: string
): Promise<Wishlist> {
  const response =
    await apiFetch<WishlistApiResponse>(
      `/api/wishlist/${encodeURIComponent(
        itemOrProductId
      )}`,
      {
        method:
          "DELETE",
      }
    );

  const wishlist =
    requireWishlist(
      response
    );

  notifyWishlistUpdated(
    wishlist
  );

  return wishlist;
}

/* =========================================================
   CLEAR
========================================================= */

export async function clearWishlist(): Promise<Wishlist> {
  const response =
    await apiFetch<WishlistApiResponse>(
      "/api/wishlist",
      {
        method:
          "DELETE",
      }
    );

  const wishlist =
    requireWishlist(
      response
    );

  notifyWishlistUpdated(
    wishlist
  );

  return wishlist;
}

/* =========================================================
   OLD PRODUCT LEVEL CHECK

   Product detail page ke existing code ke liye keep kiya hai.
========================================================= */

export async function isWishlisted(
  productId: string
): Promise<boolean> {
  const response =
    await apiFetch<WishlistCheckApiResponse>(
      `/api/wishlist/check/${encodeURIComponent(
        productId
      )}`
    );

  return Boolean(
    response.isWishlisted
  );
}