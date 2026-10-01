import {
  Request,
  Response,
} from "express";

import {
  addProductToWishlist,
  getUserWishlist,
  checkProductInWishlist,
  removeProductFromWishlist,
  clearUserWishlist,
} from "../services/wishlist.service";

/* =========================================================
   HELPERS
========================================================= */

const getUserId = (
  req: Request
): string => {
  const userId =
    req.user?._id?.toString();

  if (!userId) {
    throw new Error(
      "Not authenticated."
    );
  }

  return userId;
};

const getRouteParam = (
  value:
    | string
    | string[]
    | undefined,
  paramName: string
): string => {
  if (!value) {
    throw new Error(
      `${paramName} is required.`
    );
  }

  if (
    Array.isArray(
      value
    )
  ) {
    if (!value[0]) {
      throw new Error(
        `${paramName} is required.`
      );
    }

    return value[0];
  }

  return value;
};

/* =========================================================
   POST /api/wishlist
========================================================= */

export const addWishlistItemController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const userId =
        getUserId(req);

      const productId =
        typeof req.body
          ?.productId ===
        "string"
          ? req.body.productId.trim()
          : "";

      if (!productId) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "productId is required.",
          });
      }

      const result =
        await addProductToWishlist(
          userId,
          productId,
          {
            colorId: typeof req.body?.colorId === "string" ? req.body.colorId.trim() : null,
            sizeId: typeof req.body?.sizeId === "string" ? req.body.sizeId.trim() : null,
          }
        );

      return res
        .status(200)
        .json({
          success: true,

          message:
            result.alreadyExists
              ? "Product is already in wishlist."
              : "Product added to wishlist successfully.",

          count:
            result.wishlist
              ?.items.length ||
            0,

          wishlist:
            result.wishlist,
        });
    } catch (error) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            error instanceof Error
              ? error.message
              : "Unable to add product to wishlist.",
        });
    }
  };

/* =========================================================
   GET /api/wishlist
========================================================= */

export const getWishlistController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const userId =
        getUserId(req);

      const wishlist =
        await getUserWishlist(
          userId
        );

      return res
        .status(200)
        .json({
          success: true,
          message:
            "Wishlist fetched successfully.",
          count:
            wishlist.items
              .length,
          wishlist,
        });
    } catch (error) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            error instanceof Error
              ? error.message
              : "Unable to fetch wishlist.",
        });
    }
  };

/* =========================================================
   GET /api/wishlist/check/:productId
========================================================= */

export const checkWishlistItemController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const userId =
        getUserId(req);

      const productId =
        getRouteParam(
          req.params.productId,
          "Product ID"
        );

      const isWishlisted =
        await checkProductInWishlist(
          userId,
          productId
        );

      return res
        .status(200)
        .json({
          success: true,
          productId,
          isWishlisted,
        });
    } catch (error) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            error instanceof Error
              ? error.message
              : "Unable to check wishlist.",
        });
    }
  };

/* =========================================================
   DELETE /api/wishlist/:productId
========================================================= */

export const removeWishlistItemController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const userId =
        getUserId(req);

      const productId =
        getRouteParam(
          req.params.productId,
          "Product ID"
        );

      const wishlist =
        await removeProductFromWishlist(
          userId,
          productId
        );

      return res
        .status(200)
        .json({
          success: true,
          message:
            "Product removed from wishlist successfully.",
          count:
            wishlist?.items
              .length || 0,
          wishlist,
        });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to remove product from wishlist.";

      const status =
        message ===
          "Wishlist not found." ||
        message ===
          "Product is not in wishlist."
          ? 404
          : 400;

      return res
        .status(status)
        .json({
          success: false,
          message,
        });
    }
  };

/* =========================================================
   DELETE /api/wishlist
========================================================= */

export const clearWishlistController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const userId =
        getUserId(req);

      const wishlist =
        await clearUserWishlist(
          userId
        );

      return res
        .status(200)
        .json({
          success: true,
          message:
            "Wishlist cleared successfully.",
          count: 0,
          wishlist,
        });
    } catch (error) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            error instanceof Error
              ? error.message
              : "Unable to clear wishlist.",
        });
    }
  };
