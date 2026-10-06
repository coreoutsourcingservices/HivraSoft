"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeCartDiscountCode = exports.applyCartDiscountCode = exports.clearUserCart = exports.removeCartItem = exports.updateCartItem = exports.getCartCount = exports.getUserCart = exports.addItemToCart = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const Cart_model_1 = __importDefault(require("../models/Cart.model"));
const Product_model_1 = __importDefault(require("../models/Product.model"));
const DiscountCode_model_1 = __importDefault(require("../models/DiscountCode.model"));
const discount_service_1 = require("./discount.service");
const activity_service_1 = require("./activity.service");
const commerce_email_service_1 = require("./commerce-email.service");
const tax_service_1 = require("./tax.service");
/* =========================================================
   HELPERS
========================================================= */
const validateObjectId = (value, fieldName) => {
    if (!value ||
        !mongoose_1.default.Types.ObjectId.isValid(value)) {
        throw new Error(`Invalid ${fieldName}.`);
    }
};
const normalizeQuantity = (value, defaultValue = 1) => {
    if (value === undefined ||
        value === null ||
        value === "") {
        return defaultValue;
    }
    const quantity = Number(value);
    if (!Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 99) {
        throw new Error("Quantity must be a whole number between 1 and 99.");
    }
    return quantity;
};
const getVariant = (product, colorId, sizeId) => {
    const color = product.colors?.find((item) => String(item._id) === colorId);
    if (!color) {
        throw new Error("Selected product color was not found.");
    }
    const size = color.sizes?.find((item) => String(item._id) === sizeId);
    if (!size) {
        throw new Error("Selected product size was not found.");
    }
    if (!size.isActive) {
        throw new Error("Selected product size is inactive.");
    }
    return {
        color,
        size,
    };
};
const getAvailableStock = (_product, size) => {
    return Math.max(0, Number(size?.stock ?? 0));
};
const getOrCreateCart = async (userId) => {
    let cart = await Cart_model_1.default.findOne({
        user: userId,
    });
    if (!cart) {
        cart =
            await Cart_model_1.default.create({
                user: new mongoose_1.Types.ObjectId(userId),
                items: [],
            });
    }
    return cart;
};
const buildCartResponse = async (cart) => {
    const productIds = Array.from(new Set(cart.items.map(item => String(item.product))));
    const products = productIds.length > 0
        ? await Product_model_1.default.find({
            _id: {
                $in: productIds,
            },
        }).lean()
        : [];
    const productMap = new Map(products.map(product => [
        String(product._id),
        product,
    ]));
    let subtotal = 0;
    let totalItems = 0;
    const items = cart.items.map(item => {
        const product = productMap.get(String(item.product));
        const quantity = Number(item.quantity);
        totalItems +=
            quantity;
        if (!product) {
            return {
                _id: item._id,
                product: null,
                colorId: item.colorId,
                sizeId: item.sizeId,
                quantity,
                unitPrice: 0,
                subtotal: 0,
                available: false,
                unavailableReason: "Product no longer exists.",
                addedAt: item.addedAt,
                updatedAt: item.updatedAt || item.addedAt,
                ageMs: item.addedAt ? Math.max(0, Date.now() - new Date(item.addedAt).getTime()) : 0,
            };
        }
        const color = product.colors?.find((value) => String(value._id) ===
            String(item.colorId));
        const size = color?.sizes?.find((value) => String(value._id) ===
            String(item.sizeId));
        const availableStock = color && size
            ? getAvailableStock(product, size)
            : 0;
        const available = product.isActive !== false &&
            Boolean(size?.isActive) &&
            availableStock >= quantity;
        const unitPrice = Number(size?.showPrice ??
            color?.showPrice ??
            0);
        const itemSubtotal = unitPrice *
            quantity;
        if (available) {
            subtotal +=
                itemSubtotal;
        }
        return {
            _id: item._id,
            product: {
                _id: product._id,
                name: color?.nameProduct || "Product",
                slug: color?.slugProduct || "",
                price: unitPrice,
                compareAtPrice: Number(size?.originalPrice ?? color?.originalPrice ?? unitPrice),
                stock: availableStock,
                mainImages: color?.images ||
                    [],
                status: product.isActive !== false ? "active" : "inactive",
            },
            selectedColor: color
                ? {
                    _id: color._id,
                    name: color.nameColor,
                    slug: color.slugColor,
                    hex: color.hex,
                    images: color.images ||
                        [],
                    isActive: true,
                }
                : null,
            selectedSize: size
                ? {
                    _id: size._id,
                    size: size.size,
                    sku: size.sku,
                    stock: size.stock,
                    isActive: size.isActive,
                }
                : null,
            colorId: item.colorId,
            sizeId: item.sizeId,
            quantity,
            unitPrice,
            subtotal: itemSubtotal,
            availableStock,
            available,
            addedAt: item.addedAt,
            updatedAt: item.updatedAt || item.addedAt,
            ageMs: item.addedAt ? Math.max(0, Date.now() - new Date(item.addedAt).getTime()) : 0,
        };
    });
    const discountResult = await (0, discount_service_1.calculateDiscounts)(items
        .filter((item) => item.available && item.product?._id)
        .map((item) => ({
        lineId: String(item._id || ""),
        productId: String(item.product._id),
        unitPrice: Number(item.unitPrice || 0),
        quantity: Number(item.quantity || 0),
    })), cart.discountCode || null);
    const discountByLine = new Map(discountResult.itemDiscounts.map((item) => [String(item.lineId || item.productId), item]));
    const discountedItems = items.map((item) => {
        if (!item.product?._id)
            return item;
        const discount = discountByLine.get(String(item._id || "")) ||
            discountByLine.get(String(item.product._id));
        return { ...item, discount: discount || null };
    });
    const discountedSubtotal = Math.max(0, subtotal - discountResult.totalDiscount);
    const taxResult = await (0, tax_service_1.calculateTax)(discountedItems
        .filter((item) => item.available && item.product?._id)
        .map((item) => ({
        productId: String(item.product._id),
        amount: Number(item.discount?.finalLineTotal ?? item.subtotal ?? 0),
    })));
    const total = Math.max(0, discountedSubtotal + taxResult.amount);
    return {
        _id: cart._id,
        user: cart.user,
        items: discountedItems,
        totalItems,
        subtotal,
        offerDiscount: discountResult.offerDiscount,
        automaticDiscount: discountResult.automaticDiscount,
        codeDiscount: discountResult.codeDiscount,
        discount: discountResult.totalDiscount,
        discountSummary: {
            offers: discountResult.offers,
            automatic: discountResult.automatic,
            code: discountResult.code,
        },
        appliedDiscountCode: cart.discountCode || "",
        taxableAmount: taxResult.taxableAmount,
        tax: taxResult.amount,
        taxSummary: taxResult,
        total,
        createdAt: cart.createdAt,
        updatedAt: cart.updatedAt,
    };
};
/* =========================================================
   ADD ITEM
========================================================= */
const addItemToCart = async (userId, data) => {
    validateObjectId(userId, "user ID");
    validateObjectId(data.productId, "product ID");
    validateObjectId(data.colorId, "color ID");
    validateObjectId(data.sizeId, "size ID");
    const quantity = normalizeQuantity(data.quantity, 1);
    const product = await Product_model_1.default.findById(data.productId);
    if (!product) {
        throw new Error("Product not found.");
    }
    if (product.isActive === false) {
        throw new Error("Product is not available for purchase.");
    }
    const { color, size, } = getVariant(product, data.colorId, data.sizeId);
    const cart = await getOrCreateCart(userId);
    const existingItem = cart.items.find(item => String(item.product) ===
        data.productId &&
        String(item.colorId) ===
            data.colorId &&
        String(item.sizeId) ===
            data.sizeId);
    const nextQuantity = existingItem
        ? existingItem.quantity +
            quantity
        : quantity;
    if (nextQuantity > 99) {
        throw new Error("Maximum cart quantity is 99.");
    }
    const availableStock = getAvailableStock(product, size);
    if (availableStock <
        nextQuantity) {
        throw new Error(`Only ${availableStock} item(s) are available in stock.`);
    }
    const now = new Date();
    let trackingAddedAt = now;
    if (existingItem) {
        existingItem.quantity =
            nextQuantity;
        existingItem.updatedAt =
            now;
        trackingAddedAt = existingItem.addedAt || now;
    }
    else {
        cart.items.push({
            product: new mongoose_1.Types.ObjectId(data.productId),
            colorId: new mongoose_1.Types.ObjectId(data.colorId),
            sizeId: new mongoose_1.Types.ObjectId(data.sizeId),
            quantity,
            addedAt: now,
            updatedAt: now,
        });
    }
    await cart.save();
    const activity = await (0, activity_service_1.trackUserActivity)({
        userId,
        type: "cart_add",
        productId: data.productId,
        metadata: {
            colorId: data.colorId,
            sizeId: data.sizeId,
            quantity,
            finalQuantity: nextQuantity,
            addedAt: trackingAddedAt,
            productSnapshot: {
                name: String(color?.nameProduct || "Product"),
                slug: String(color?.slugProduct || ""),
                colorName: String(color?.nameColor || ""),
                sizeName: String(size?.size || ""),
                price: Number(size?.showPrice ?? color?.showPrice ?? 0),
                imageUrl: String((color?.images || []).find((image) => image?.isDefault === true)?.url
                    || color?.images?.[0]?.url
                    || ""),
            },
        },
    });
    const response = await buildCartResponse(cart);
    void (0, commerce_email_service_1.sendCartAddedEmail)({
        userId,
        productId: data.productId,
        colorId: data.colorId,
        sizeId: data.sizeId,
        quantity: nextQuantity,
        cartTotal: Number(response.total || 0),
    })
        .then((sent) => {
        if (sent && activity?._id) {
            return (0, activity_service_1.markActivityEmailSent)(String(activity._id));
        }
    })
        .catch((error) => console.error("CART ADDED EMAIL ERROR:", error));
    return response;
};
exports.addItemToCart = addItemToCart;
/* =========================================================
   GET CART
========================================================= */
const getUserCart = async (userId) => {
    validateObjectId(userId, "user ID");
    const cart = await getOrCreateCart(userId);
    return buildCartResponse(cart);
};
exports.getUserCart = getUserCart;
/* =========================================================
   GET CART COUNT
========================================================= */
const getCartCount = async (userId) => {
    validateObjectId(userId, "user ID");
    const cart = await Cart_model_1.default.findOne({
        user: userId,
    });
    if (!cart) {
        return 0;
    }
    return cart.items.reduce((total, item) => total +
        item.quantity, 0);
};
exports.getCartCount = getCartCount;
/* =========================================================
   UPDATE ITEM QUANTITY
========================================================= */
const updateCartItem = async (userId, cartItemId, data) => {
    validateObjectId(userId, "user ID");
    validateObjectId(cartItemId, "cart item ID");
    const quantity = normalizeQuantity(data.quantity);
    const cart = await Cart_model_1.default.findOne({
        user: userId,
    });
    if (!cart) {
        throw new Error("Cart not found.");
    }
    const item = cart.items.find(value => String(value._id) ===
        cartItemId);
    if (!item) {
        throw new Error("Cart item not found.");
    }
    const product = await Product_model_1.default.findById(item.product);
    if (!product) {
        throw new Error("Product not found.");
    }
    if (product.isActive === false) {
        throw new Error("Product is not available for purchase.");
    }
    const { size, } = getVariant(product, String(item.colorId), String(item.sizeId));
    const availableStock = getAvailableStock(product, size);
    if (availableStock <
        quantity) {
        throw new Error(`Only ${availableStock} item(s) are available in stock.`);
    }
    const previousQuantity = Number(item.quantity || 0);
    item.quantity =
        quantity;
    item.updatedAt =
        new Date();
    await cart.save();
    await (0, activity_service_1.trackUserActivity)({
        userId,
        type: "cart_update",
        productId: String(item.product),
        metadata: {
            colorId: String(item.colorId),
            sizeId: String(item.sizeId),
            previousQuantity,
            quantity,
        },
    });
    return buildCartResponse(cart);
};
exports.updateCartItem = updateCartItem;
/* =========================================================
   REMOVE ONE CART ITEM
========================================================= */
const removeCartItem = async (userId, cartItemId) => {
    validateObjectId(userId, "user ID");
    validateObjectId(cartItemId, "cart item ID");
    const cart = await Cart_model_1.default.findOne({
        user: userId,
    });
    if (!cart) {
        throw new Error("Cart not found.");
    }
    const removedItem = cart.items.find(item => String(item._id) ===
        cartItemId);
    const itemExists = Boolean(removedItem);
    if (!itemExists) {
        throw new Error("Cart item not found.");
    }
    cart.items =
        cart.items.filter(item => String(item._id) !==
            cartItemId);
    await cart.save();
    if (removedItem) {
        await (0, activity_service_1.trackUserActivity)({
            userId,
            type: "cart_remove",
            productId: String(removedItem.product),
            metadata: {
                colorId: String(removedItem.colorId),
                sizeId: String(removedItem.sizeId),
                quantity: Number(removedItem.quantity || 0),
                addedAt: removedItem.addedAt,
            },
        });
    }
    return buildCartResponse(cart);
};
exports.removeCartItem = removeCartItem;
/* =========================================================
   CLEAR CART
========================================================= */
const clearUserCart = async (userId) => {
    validateObjectId(userId, "user ID");
    const cart = await getOrCreateCart(userId);
    const clearedItems = cart.items.length;
    cart.items = [];
    cart.discountCode = "";
    await cart.save();
    if (clearedItems > 0) {
        await (0, activity_service_1.trackUserActivity)({
            userId,
            type: "cart_clear",
            metadata: { clearedItems },
        });
    }
    return buildCartResponse(cart);
};
exports.clearUserCart = clearUserCart;
/* =========================================================
   DISCOUNT CODE
========================================================= */
const applyCartDiscountCode = async (userId, rawCode) => {
    validateObjectId(userId, "user ID");
    const code = String(rawCode || "").trim().toUpperCase();
    if (!code)
        throw new Error("Enter a discount code.");
    const coupon = await DiscountCode_model_1.default.findOne({ code, isActive: true }).lean();
    if (!coupon)
        throw new Error("Discount code is invalid or inactive.");
    const now = new Date();
    if (coupon.startsAt && new Date(coupon.startsAt) > now)
        throw new Error("Discount code is not active yet.");
    if (coupon.endsAt && new Date(coupon.endsAt) < now)
        throw new Error("Discount code has expired.");
    const cart = await getOrCreateCart(userId);
    cart.discountCode = code;
    await cart.save();
    const response = await buildCartResponse(cart);
    if (response.codeDiscount <= 0) {
        cart.discountCode = "";
        await cart.save();
        throw new Error("This discount code is not valid for products in your cart.");
    }
    return response;
};
exports.applyCartDiscountCode = applyCartDiscountCode;
const removeCartDiscountCode = async (userId) => {
    validateObjectId(userId, "user ID");
    const cart = await getOrCreateCart(userId);
    cart.discountCode = "";
    await cart.save();
    return buildCartResponse(cart);
};
exports.removeCartDiscountCode = removeCartDiscountCode;
//# sourceMappingURL=cart.service.js.map