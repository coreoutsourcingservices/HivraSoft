"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearWishlistController = exports.removeWishlistItemController = exports.checkWishlistItemController = exports.getWishlistController = exports.addWishlistItemController = void 0;
const wishlist_service_1 = require("../services/wishlist.service");
/* =========================================================
   HELPERS
========================================================= */
const getUserId = (req) => {
    const userId = req.user?._id?.toString();
    if (!userId) {
        throw new Error("Not authenticated.");
    }
    return userId;
};
const getRouteParam = (value, paramName) => {
    if (!value) {
        throw new Error(`${paramName} is required.`);
    }
    if (Array.isArray(value)) {
        if (!value[0]) {
            throw new Error(`${paramName} is required.`);
        }
        return value[0];
    }
    return value;
};
/* =========================================================
   POST /api/wishlist
========================================================= */
const addWishlistItemController = async (req, res) => {
    try {
        const userId = getUserId(req);
        const productId = typeof req.body
            ?.productId ===
            "string"
            ? req.body.productId.trim()
            : "";
        if (!productId) {
            return res
                .status(400)
                .json({
                success: false,
                message: "productId is required.",
            });
        }
        const result = await (0, wishlist_service_1.addProductToWishlist)(userId, productId, {
            colorId: typeof req.body?.colorId === "string" ? req.body.colorId.trim() : null,
            sizeId: typeof req.body?.sizeId === "string" ? req.body.sizeId.trim() : null,
        });
        return res
            .status(200)
            .json({
            success: true,
            message: result.alreadyExists
                ? "Product is already in wishlist."
                : "Product added to wishlist successfully.",
            count: result.wishlist
                ?.items.length ||
                0,
            wishlist: result.wishlist,
        });
    }
    catch (error) {
        return res
            .status(400)
            .json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Unable to add product to wishlist.",
        });
    }
};
exports.addWishlistItemController = addWishlistItemController;
/* =========================================================
   GET /api/wishlist
========================================================= */
const getWishlistController = async (req, res) => {
    try {
        const userId = getUserId(req);
        const wishlist = await (0, wishlist_service_1.getUserWishlist)(userId);
        return res
            .status(200)
            .json({
            success: true,
            message: "Wishlist fetched successfully.",
            count: wishlist.items
                .length,
            wishlist,
        });
    }
    catch (error) {
        return res
            .status(400)
            .json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Unable to fetch wishlist.",
        });
    }
};
exports.getWishlistController = getWishlistController;
/* =========================================================
   GET /api/wishlist/check/:productId
========================================================= */
const checkWishlistItemController = async (req, res) => {
    try {
        const userId = getUserId(req);
        const productId = getRouteParam(req.params.productId, "Product ID");
        const isWishlisted = await (0, wishlist_service_1.checkProductInWishlist)(userId, productId);
        return res
            .status(200)
            .json({
            success: true,
            productId,
            isWishlisted,
        });
    }
    catch (error) {
        return res
            .status(400)
            .json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Unable to check wishlist.",
        });
    }
};
exports.checkWishlistItemController = checkWishlistItemController;
/* =========================================================
   DELETE /api/wishlist/:productId
========================================================= */
const removeWishlistItemController = async (req, res) => {
    try {
        const userId = getUserId(req);
        const productId = getRouteParam(req.params.productId, "Product ID");
        const wishlist = await (0, wishlist_service_1.removeProductFromWishlist)(userId, productId);
        return res
            .status(200)
            .json({
            success: true,
            message: "Product removed from wishlist successfully.",
            count: wishlist?.items
                .length || 0,
            wishlist,
        });
    }
    catch (error) {
        const message = error instanceof Error
            ? error.message
            : "Unable to remove product from wishlist.";
        const status = message ===
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
exports.removeWishlistItemController = removeWishlistItemController;
/* =========================================================
   DELETE /api/wishlist
========================================================= */
const clearWishlistController = async (req, res) => {
    try {
        const userId = getUserId(req);
        const wishlist = await (0, wishlist_service_1.clearUserWishlist)(userId);
        return res
            .status(200)
            .json({
            success: true,
            message: "Wishlist cleared successfully.",
            count: 0,
            wishlist,
        });
    }
    catch (error) {
        return res
            .status(400)
            .json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Unable to clear wishlist.",
        });
    }
};
exports.clearWishlistController = clearWishlistController;
//# sourceMappingURL=wishlist.controller.js.map