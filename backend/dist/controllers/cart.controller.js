"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeDiscountCodeController = exports.applyDiscountCodeController = exports.clearCartController = exports.removeCartItemController = exports.updateCartItemController = exports.getCartCountController = exports.getCartController = exports.addToCartController = void 0;
const cart_service_1 = require("../services/cart.service");
/* =========================================================
   HELPERS
========================================================= */
const getAuthenticatedUserId = (req) => {
    if (!req.user?._id) {
        throw new Error("Not authenticated.");
    }
    return String(req.user._id);
};
const getRouteParam = (value, name) => {
    if (!value) {
        throw new Error(`${name} is required.`);
    }
    if (Array.isArray(value)) {
        if (!value[0]) {
            throw new Error(`${name} is required.`);
        }
        return value[0];
    }
    return value;
};
/* =========================================================
   ADD TO CART
========================================================= */
const addToCartController = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const { productId, colorId, sizeId, quantity, } = req.body;
        const cart = await (0, cart_service_1.addItemToCart)(userId, {
            productId: String(productId ||
                ""),
            colorId: String(colorId ||
                ""),
            sizeId: String(sizeId ||
                ""),
            quantity,
        });
        return res
            .status(200)
            .json({
            success: true,
            message: "Product added to cart successfully.",
            cart,
        });
    }
    catch (error) {
        return res
            .status(400)
            .json({
            success: false,
            message: error instanceof
                Error
                ? error.message
                : "Unable to add product to cart.",
        });
    }
};
exports.addToCartController = addToCartController;
/* =========================================================
   GET CART
========================================================= */
const getCartController = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const cart = await (0, cart_service_1.getUserCart)(userId);
        return res
            .status(200)
            .json({
            success: true,
            message: "Cart fetched successfully.",
            count: cart.items.length,
            cart,
        });
    }
    catch (error) {
        return res
            .status(400)
            .json({
            success: false,
            message: error instanceof
                Error
                ? error.message
                : "Unable to fetch cart.",
        });
    }
};
exports.getCartController = getCartController;
/* =========================================================
   CART COUNT
========================================================= */
const getCartCountController = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const count = await (0, cart_service_1.getCartCount)(userId);
        return res
            .status(200)
            .json({
            success: true,
            count,
        });
    }
    catch (error) {
        return res
            .status(400)
            .json({
            success: false,
            message: error instanceof
                Error
                ? error.message
                : "Unable to fetch cart count.",
        });
    }
};
exports.getCartCountController = getCartCountController;
/* =========================================================
   UPDATE QUANTITY
========================================================= */
const updateCartItemController = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const cartItemId = getRouteParam(req.params
            .cartItemId, "Cart item ID");
        const cart = await (0, cart_service_1.updateCartItem)(userId, cartItemId, {
            quantity: req.body
                .quantity,
        });
        return res
            .status(200)
            .json({
            success: true,
            message: "Cart item quantity updated successfully.",
            cart,
        });
    }
    catch (error) {
        return res
            .status(400)
            .json({
            success: false,
            message: error instanceof
                Error
                ? error.message
                : "Unable to update cart item.",
        });
    }
};
exports.updateCartItemController = updateCartItemController;
/* =========================================================
   REMOVE ITEM
========================================================= */
const removeCartItemController = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const cartItemId = getRouteParam(req.params
            .cartItemId, "Cart item ID");
        const cart = await (0, cart_service_1.removeCartItem)(userId, cartItemId);
        return res
            .status(200)
            .json({
            success: true,
            message: "Cart item removed successfully.",
            cart,
        });
    }
    catch (error) {
        return res
            .status(400)
            .json({
            success: false,
            message: error instanceof
                Error
                ? error.message
                : "Unable to remove cart item.",
        });
    }
};
exports.removeCartItemController = removeCartItemController;
/* =========================================================
   CLEAR CART
========================================================= */
const clearCartController = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const cart = await (0, cart_service_1.clearUserCart)(userId);
        return res
            .status(200)
            .json({
            success: true,
            message: "Cart cleared successfully.",
            cart,
        });
    }
    catch (error) {
        return res
            .status(400)
            .json({
            success: false,
            message: error instanceof
                Error
                ? error.message
                : "Unable to clear cart.",
        });
    }
};
exports.clearCartController = clearCartController;
const applyDiscountCodeController = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const cart = await (0, cart_service_1.applyCartDiscountCode)(userId, req.body?.code);
        return res.status(200).json({ success: true, message: "Discount code applied.", cart });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to apply discount code." });
    }
};
exports.applyDiscountCodeController = applyDiscountCodeController;
const removeDiscountCodeController = async (req, res) => {
    try {
        const userId = getAuthenticatedUserId(req);
        const cart = await (0, cart_service_1.removeCartDiscountCode)(userId);
        return res.status(200).json({ success: true, message: "Discount code removed.", cart });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to remove discount code." });
    }
};
exports.removeDiscountCodeController = removeDiscountCodeController;
//# sourceMappingURL=cart.controller.js.map