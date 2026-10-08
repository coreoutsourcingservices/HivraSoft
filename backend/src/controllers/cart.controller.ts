import {
  Request,
  Response,
} from "express";

import {
  addItemToCart,
  clearUserCart,
  getCartCount,
  getUserCart,
  removeCartItem,
  updateCartItem,
  applyCartDiscountCode,
  removeCartDiscountCode,
} from "../services/cart.service";

/* =========================================================
   HELPERS
========================================================= */

const getAuthenticatedUserId = (
  req: Request
): string => {
  if (!req.user?._id) {
    throw new Error(
      "Not authenticated."
    );
  }

  return String(
    req.user._id
  );
};

const getRouteParam = (
  value:
    | string
    | string[]
    | undefined,
  name: string
): string => {
  if (!value) {
    throw new Error(
      `${name} is required.`
    );
  }

  if (
    Array.isArray(
      value
    )
  ) {
    if (!value[0]) {
      throw new Error(
        `${name} is required.`
      );
    }

    return value[0];
  }

  return value;
};

/* =========================================================
   ADD TO CART
========================================================= */

export const addToCartController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const userId =
        getAuthenticatedUserId(
          req
        );

      const {
        productId,
        colorId,
        sizeId,
        quantity,
        offerContext,
      } = req.body;

      const cart =
        await addItemToCart(
          userId,
          {
            productId:
              String(
                productId ||
                  ""
              ),

            colorId:
              String(
                colorId ||
                  ""
              ),

            sizeId:
              String(
                sizeId ||
                  ""
              ),

            quantity,

            /*
             * null:
             * normal storefront.
             *
             * buy_get_page:
             * only Buy/Get catalog.
             *
             * Validation cart.service me hoti hai.
             */
            offerContext:
              offerContext ??
              null,
          }
        );

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Product added to cart successfully.",

          cart,
        });
    } catch (error) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            error instanceof
            Error
              ? error.message
              : "Unable to add product to cart.",
        });
    }
  };

/* =========================================================
   GET CART
========================================================= */

export const getCartController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const userId =
        getAuthenticatedUserId(
          req
        );

      const cart =
        await getUserCart(
          userId
        );

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Cart fetched successfully.",

          count:
            cart.items.length,

          cart,
        });
    } catch (error) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            error instanceof
            Error
              ? error.message
              : "Unable to fetch cart.",
        });
    }
  };

/* =========================================================
   CART COUNT
========================================================= */

export const getCartCountController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const userId =
        getAuthenticatedUserId(
          req
        );

      const count =
        await getCartCount(
          userId
        );

      return res
        .status(200)
        .json({
          success: true,
          count,
        });
    } catch (error) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            error instanceof
            Error
              ? error.message
              : "Unable to fetch cart count.",
        });
    }
  };

/* =========================================================
   UPDATE QUANTITY
========================================================= */

export const updateCartItemController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const userId =
        getAuthenticatedUserId(
          req
        );

      const cartItemId =
        getRouteParam(
          req.params
            .cartItemId,
          "Cart item ID"
        );

      const cart =
        await updateCartItem(
          userId,
          cartItemId,
          {
            quantity:
              req.body
                .quantity,
          }
        );

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Cart item quantity updated successfully.",

          cart,
        });
    } catch (error) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            error instanceof
            Error
              ? error.message
              : "Unable to update cart item.",
        });
    }
  };

/* =========================================================
   REMOVE ITEM
========================================================= */

export const removeCartItemController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const userId =
        getAuthenticatedUserId(
          req
        );

      const cartItemId =
        getRouteParam(
          req.params
            .cartItemId,
          "Cart item ID"
        );

      const cart =
        await removeCartItem(
          userId,
          cartItemId
        );

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Cart item removed successfully.",

          cart,
        });
    } catch (error) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            error instanceof
            Error
              ? error.message
              : "Unable to remove cart item.",
        });
    }
  };

/* =========================================================
   CLEAR CART
========================================================= */

export const clearCartController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const userId =
        getAuthenticatedUserId(
          req
        );

      const cart =
        await clearUserCart(
          userId
        );

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Cart cleared successfully.",

          cart,
        });
    } catch (error) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            error instanceof
            Error
              ? error.message
              : "Unable to clear cart.",
        });
    }
  };

/* =========================================================
   APPLY DISCOUNT CODE
========================================================= */

export const applyDiscountCodeController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const userId =
        getAuthenticatedUserId(
          req
        );

      const cart =
        await applyCartDiscountCode(
          userId,
          req.body?.code
        );

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Discount code applied.",

          cart,
        });
    } catch (error) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            error instanceof
            Error
              ? error.message
              : "Unable to apply discount code.",
        });
    }
  };

/* =========================================================
   REMOVE DISCOUNT CODE
========================================================= */

export const removeDiscountCodeController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const userId =
        getAuthenticatedUserId(
          req
        );

      const cart =
        await removeCartDiscountCode(
          userId
        );

      return res
        .status(200)
        .json({
          success: true,

          message:
            "Discount code removed.",

          cart,
        });
    } catch (error) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            error instanceof
            Error
              ? error.message
              : "Unable to remove discount code.",
        });
    }
  };
