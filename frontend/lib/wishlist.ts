import {
  apiFetch,
} from "./api";

/* =========================================================
   TYPES
========================================================= */

export type WishlistProductReference =
  | string
  | {
      _id?: string;
      id?: string;
    };

export type WishlistItem = {
  _id?: string;

  product:
    WishlistProductReference;

  colorId?:
    | string
    | null;

  sizeId?:
    | string
    | null;
};

export type Wishlist = {
  _id?: string;

  items: WishlistItem[];
};

type WishlistResponse = {
  success?: boolean;

  wishlist?: Wishlist;

  items?: WishlistItem[];

  data?:
    | Wishlist
    | {
        wishlist?: Wishlist;
        items?: WishlistItem[];
      };
};

type WishlistCheckResponse = {
  success?: boolean;

  exists?: boolean;

  isWishlisted?: boolean;

  data?: {
    exists?: boolean;

    isWishlisted?: boolean;
  };
};

/* =========================================================
   EMPTY
========================================================= */

const EMPTY_WISHLIST: Wishlist =
  {
    items: [],
  };

/* =========================================================
   NORMALIZER
========================================================= */

function normalizeWishlist(
  response:
    | WishlistResponse
    | null
    | undefined
): Wishlist {
  if (!response) {
    return EMPTY_WISHLIST;
  }

  if (
    response.wishlist &&
    Array.isArray(
      response.wishlist.items
    )
  ) {
    return response.wishlist;
  }

  if (
    Array.isArray(
      response.items
    )
  ) {
    return {
      items:
        response.items,
    };
  }

  if (
    response.data &&
    "items" in
      response.data &&
    Array.isArray(
      response.data.items
    )
  ) {
    return {
      items:
        response.data.items,
    };
  }

  if (
    response.data &&
    "wishlist" in
      response.data &&
    response.data.wishlist &&
    Array.isArray(
      response.data
        .wishlist.items
    )
  ) {
    return response.data
      .wishlist;
  }

  return EMPTY_WISHLIST;
}

/* =========================================================
   EVENT
========================================================= */

function dispatchWishlistUpdated() {
  if (
    typeof window ===
    "undefined"
  ) {
    return;
  }

  window.dispatchEvent(
    new Event(
      "hivrasoft-wishlist-updated"
    )
  );

  window.dispatchEvent(
    new Event(
      "hivra:store-changed"
    )
  );
}

/* =========================================================
   GET WISHLIST
========================================================= */

export async function getWishlist(): Promise<Wishlist> {
  const response =
    await apiFetch<WishlistResponse>(
      "/api/wishlist",
      {
        method: "GET",
      }
    );

  return normalizeWishlist(
    response
  );
}

/* =========================================================
   ADD

   productId required.
   colorId optional.
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
  const body: Record<
    string,
    unknown
  > = {
    productId,
  };

  if (
    variant?.colorId
  ) {
    body.colorId =
      variant.colorId;
  }

  if (
    variant?.sizeId
  ) {
    body.sizeId =
      variant.sizeId;
  }

  const response =
    await apiFetch<WishlistResponse>(
      "/api/wishlist",
      {
        method: "POST",

        body,
      }
    );

  dispatchWishlistUpdated();

  return normalizeWishlist(
    response
  );
}

/* =========================================================
   REMOVE

   Official storefront route:
   DELETE /api/wishlist/:productId
========================================================= */

export async function removeFromWishlist(
  productId: string
): Promise<Wishlist> {
  const response =
    await apiFetch<WishlistResponse>(
      `/api/wishlist/${encodeURIComponent(
        productId
      )}`,
      {
        method: "DELETE",
      }
    );

  dispatchWishlistUpdated();

  return normalizeWishlist(
    response
  );
}

/* =========================================================
   CHECK
========================================================= */

export async function isWishlisted(
  productId: string
): Promise<boolean> {
  const response =
    await apiFetch<WishlistCheckResponse>(
      `/api/wishlist/check/${encodeURIComponent(
        productId
      )}`,
      {
        method: "GET",
      }
    );

  return Boolean(
    response.isWishlisted ??
      response.exists ??
      response.data
        ?.isWishlisted ??
      response.data?.exists
  );
}

/* =========================================================
   CLEAR
========================================================= */

export async function clearWishlist(): Promise<Wishlist> {
  const response =
    await apiFetch<WishlistResponse>(
      "/api/wishlist",
      {
        method: "DELETE",
      }
    );

  dispatchWishlistUpdated();

  return normalizeWishlist(
    response
  );
}
