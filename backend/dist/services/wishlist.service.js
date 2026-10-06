"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearUserWishlist = exports.removeProductFromWishlist = exports.checkProductInWishlist = exports.getUserWishlist = exports.addProductToWishlist = void 0;
const mongoose_1 = require("mongoose");
const Wishlist_model_1 = __importDefault(require("../models/Wishlist.model"));
const Product_model_1 = __importDefault(require("../models/Product.model"));
const activity_service_1 = require("./activity.service");
const commerce_email_service_1 = require("./commerce-email.service");
const WISHLIST_PRODUCT_SELECT = [
    "name",
    "slug",
    "shortDescription",
    "price",
    "compareAtPrice",
    "stock",
    "mainImages",
    "colors",
    "ratings",
    "status",
    "isActive",
    "isFeatured",
    "isNewLaunch",
].join(" ");
const validateObjectId = (value, fieldName) => {
    if (!mongoose_1.Types.ObjectId.isValid(value)) {
        throw new Error(`Invalid ${fieldName} ID.`);
    }
};
const populateWishlistById = async (wishlistId) => Wishlist_model_1.default.findById(wishlistId).populate({
    path: "items.product",
    select: WISHLIST_PRODUCT_SELECT,
});
const createEmptyWishlistResponse = (userId) => ({
    _id: null,
    user: userId,
    items: [],
    createdAt: null,
    updatedAt: null,
});
function buildTrackingProductSnapshot(product, colorId, sizeId) {
    const colors = Array.isArray(product?.colors) ? product.colors : [];
    const color = colors.find((item) => String(item?._id || "") === String(colorId || ""))
        || colors.find((item) => item?.isDefault === true)
        || colors[0]
        || null;
    const sizes = Array.isArray(color?.sizes) ? color.sizes : [];
    const size = sizes.find((item) => String(item?._id || "") === String(sizeId || ""))
        || sizes[0]
        || null;
    const images = Array.isArray(color?.images) ? color.images : [];
    const image = images.find((item) => item?.isDefault === true) || images[0] || null;
    return {
        name: String(color?.nameProduct || "Product"),
        slug: String(color?.slugProduct || ""),
        colorName: String(color?.nameColor || ""),
        sizeName: String(size?.size || ""),
        price: Number(size?.showPrice ?? color?.showPrice ?? 0),
        imageUrl: String(image?.url || ""),
    };
}
function validateVariant(product, input) {
    const colorId = String(input.colorId || "").trim();
    const sizeId = String(input.sizeId || "").trim();
    if (!colorId && !sizeId) {
        return { colorId: null, sizeId: null };
    }
    if (!colorId || !mongoose_1.Types.ObjectId.isValid(colorId)) {
        throw new Error("A valid colorId is required when saving a wishlist variant.");
    }
    const colors = Array.isArray(product?.colors) ? product.colors : [];
    const color = colors.find((item) => String(item?._id || "") === colorId);
    if (!color || color?.isActive === false) {
        throw new Error("Selected product color was not found or is inactive.");
    }
    if (!sizeId) {
        return { colorId, sizeId: null };
    }
    if (!mongoose_1.Types.ObjectId.isValid(sizeId)) {
        throw new Error("Invalid size ID.");
    }
    const sizes = Array.isArray(color?.sizes) ? color.sizes : [];
    const size = sizes.find((item) => String(item?._id || "") === sizeId);
    if (!size || size?.isActive === false) {
        throw new Error("Selected product size was not found or is inactive.");
    }
    return { colorId, sizeId };
}
const addProductToWishlist = async (userId, productId, variant = {}) => {
    validateObjectId(userId, "user");
    validateObjectId(productId, "product");
    const product = await Product_model_1.default.findOne({
        _id: productId,
        isActive: true,
    })
        .select("_id colors isActive")
        .lean();
    if (!product) {
        throw new Error("Active product not found.");
    }
    const selected = validateVariant(product, variant);
    const userObjectId = new mongoose_1.Types.ObjectId(userId);
    const productObjectId = new mongoose_1.Types.ObjectId(productId);
    const selectedColorId = selected.colorId ? new mongoose_1.Types.ObjectId(selected.colorId) : null;
    const selectedSizeId = selected.sizeId ? new mongoose_1.Types.ObjectId(selected.sizeId) : null;
    let wishlist = await Wishlist_model_1.default.findOne({ user: userObjectId });
    const sameVariant = (item) => item.product.equals(productObjectId) &&
        String(item.colorId || "") === String(selectedColorId || "") &&
        String(item.sizeId || "") === String(selectedSizeId || "");
    if (!wishlist) {
        const now = new Date();
        wishlist = await Wishlist_model_1.default.create({
            user: userObjectId,
            items: [
                {
                    product: productObjectId,
                    colorId: selectedColorId,
                    sizeId: selectedSizeId,
                    addedAt: now,
                    updatedAt: now,
                },
            ],
        });
        const activity = await (0, activity_service_1.trackUserActivity)({
            userId,
            type: "wishlist_add",
            productId,
            metadata: {
                colorId: selected.colorId,
                sizeId: selected.sizeId,
                addedAt: now,
                productSnapshot: buildTrackingProductSnapshot(product, selected.colorId, selected.sizeId),
            },
        });
        void (0, commerce_email_service_1.sendWishlistAddedEmail)({
            userId,
            productId,
            colorId: selected.colorId,
            sizeId: selected.sizeId,
        })
            .then((sent) => {
            if (sent && activity?._id)
                return (0, activity_service_1.markActivityEmailSent)(String(activity._id));
        })
            .catch((error) => console.error("WISHLIST ADDED EMAIL ERROR:", error));
        return { wishlist: await populateWishlistById(wishlist._id), alreadyExists: false };
    }
    const existing = wishlist.items.find(sameVariant);
    if (existing) {
        return { wishlist: await populateWishlistById(wishlist._id), alreadyExists: true };
    }
    const now = new Date();
    wishlist.items.push({
        product: productObjectId,
        colorId: selectedColorId,
        sizeId: selectedSizeId,
        addedAt: now,
        updatedAt: now,
    });
    await wishlist.save();
    const activity = await (0, activity_service_1.trackUserActivity)({
        userId,
        type: "wishlist_add",
        productId,
        metadata: {
            colorId: selected.colorId,
            sizeId: selected.sizeId,
            addedAt: now,
            productSnapshot: buildTrackingProductSnapshot(product, selected.colorId, selected.sizeId),
        },
    });
    void (0, commerce_email_service_1.sendWishlistAddedEmail)({
        userId,
        productId,
        colorId: selected.colorId,
        sizeId: selected.sizeId,
    })
        .then((sent) => {
        if (sent && activity?._id)
            return (0, activity_service_1.markActivityEmailSent)(String(activity._id));
    })
        .catch((error) => console.error("WISHLIST ADDED EMAIL ERROR:", error));
    return { wishlist: await populateWishlistById(wishlist._id), alreadyExists: false };
};
exports.addProductToWishlist = addProductToWishlist;
const getUserWishlist = async (userId) => {
    validateObjectId(userId, "user");
    const wishlist = await Wishlist_model_1.default.findOne({
        user: new mongoose_1.Types.ObjectId(userId),
    }).populate({
        path: "items.product",
        select: WISHLIST_PRODUCT_SELECT,
    });
    return wishlist || createEmptyWishlistResponse(userId);
};
exports.getUserWishlist = getUserWishlist;
const checkProductInWishlist = async (userId, productId) => {
    validateObjectId(userId, "user");
    validateObjectId(productId, "product");
    const exists = await Wishlist_model_1.default.exists({
        user: new mongoose_1.Types.ObjectId(userId),
        "items.product": new mongoose_1.Types.ObjectId(productId),
    });
    return Boolean(exists);
};
exports.checkProductInWishlist = checkProductInWishlist;
const removeProductFromWishlist = async (userId, itemOrProductId) => {
    validateObjectId(userId, "user");
    validateObjectId(itemOrProductId, "wishlist item or product");
    const wishlist = await Wishlist_model_1.default.findOne({ user: new mongoose_1.Types.ObjectId(userId) });
    if (!wishlist)
        throw new Error("Wishlist not found.");
    const target = new mongoose_1.Types.ObjectId(itemOrProductId);
    const byItemId = wishlist.items.find((item) => String(item._id || "") === itemOrProductId);
    const removedItems = byItemId
        ? wishlist.items.filter((item) => String(item._id || "") === itemOrProductId)
        : wishlist.items.filter((item) => item.product.equals(target));
    if (!removedItems.length) {
        throw new Error("Product is not in wishlist.");
    }
    wishlist.items = byItemId
        ? wishlist.items.filter((item) => String(item._id || "") !== itemOrProductId)
        : wishlist.items.filter((item) => !item.product.equals(target));
    await wishlist.save();
    for (const removed of removedItems) {
        await (0, activity_service_1.trackUserActivity)({
            userId,
            type: "wishlist_remove",
            productId: String(removed.product),
            metadata: {
                wishlistItemId: String(removed._id || ""),
                colorId: String(removed.colorId || ""),
                sizeId: String(removed.sizeId || ""),
                addedAt: removed.addedAt,
            },
        });
    }
    return populateWishlistById(wishlist._id);
};
exports.removeProductFromWishlist = removeProductFromWishlist;
const clearUserWishlist = async (userId) => {
    validateObjectId(userId, "user");
    const wishlist = await Wishlist_model_1.default.findOne({ user: new mongoose_1.Types.ObjectId(userId) });
    if (!wishlist)
        return createEmptyWishlistResponse(userId);
    const clearedItems = wishlist.items.length;
    wishlist.items = [];
    await wishlist.save();
    if (clearedItems > 0) {
        await (0, activity_service_1.trackUserActivity)({
            userId,
            type: "wishlist_clear",
            metadata: { clearedItems },
        });
    }
    return populateWishlistById(wishlist._id);
};
exports.clearUserWishlist = clearUserWishlist;
//# sourceMappingURL=wishlist.service.js.map