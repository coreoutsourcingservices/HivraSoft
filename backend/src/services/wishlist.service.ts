import { Types } from "mongoose";

import Wishlist from "../models/Wishlist.model";
import Product from "../models/Product.model";
import { markActivityEmailSent, trackUserActivity } from "./activity.service";
import { sendWishlistAddedEmail } from "./commerce-email.service";

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

export type WishlistVariantInput = {
  colorId?: string | null;
  sizeId?: string | null;
};

const validateObjectId = (value: string, fieldName: string) => {
  if (!Types.ObjectId.isValid(value)) {
    throw new Error(`Invalid ${fieldName} ID.`);
  }
};

const populateWishlistById = async (wishlistId: string | Types.ObjectId) =>
  Wishlist.findById(wishlistId).populate({
    path: "items.product",
    select: WISHLIST_PRODUCT_SELECT,
  });

const createEmptyWishlistResponse = (userId: string) => ({
  _id: null,
  user: userId,
  items: [],
  createdAt: null,
  updatedAt: null,
});

function validateVariant(product: any, input: WishlistVariantInput) {
  const colorId = String(input.colorId || "").trim();
  const sizeId = String(input.sizeId || "").trim();

  if (!colorId && !sizeId) {
    return { colorId: null, sizeId: null };
  }

  if (!colorId || !Types.ObjectId.isValid(colorId)) {
    throw new Error("A valid colorId is required when saving a wishlist variant.");
  }

  const colors = Array.isArray(product?.colors) ? product.colors : [];
  const color = colors.find((item: any) => String(item?._id || "") === colorId);
  if (!color || color?.isActive === false) {
    throw new Error("Selected product color was not found or is inactive.");
  }

  if (!sizeId) {
    return { colorId, sizeId: null };
  }

  if (!Types.ObjectId.isValid(sizeId)) {
    throw new Error("Invalid size ID.");
  }

  const sizes = Array.isArray(color?.sizes) ? color.sizes : [];
  const size = sizes.find((item: any) => String(item?._id || "") === sizeId);
  if (!size || size?.isActive === false) {
    throw new Error("Selected product size was not found or is inactive.");
  }

  return { colorId, sizeId };
}

export const addProductToWishlist = async (
  userId: string,
  productId: string,
  variant: WishlistVariantInput = {}
) => {
  validateObjectId(userId, "user");
  validateObjectId(productId, "product");

  const product = await Product.findOne({
    _id: productId,
    isActive: true,
  })
    .select("_id colors isActive")
    .lean();

  if (!product) {
    throw new Error("Active product not found.");
  }

  const selected = validateVariant(product, variant);
  const userObjectId = new Types.ObjectId(userId);
  const productObjectId = new Types.ObjectId(productId);
  const selectedColorId = selected.colorId ? new Types.ObjectId(selected.colorId) : null;
  const selectedSizeId = selected.sizeId ? new Types.ObjectId(selected.sizeId) : null;

  let wishlist = await Wishlist.findOne({ user: userObjectId });

  const sameVariant = (item: any) =>
    item.product.equals(productObjectId) &&
    String(item.colorId || "") === String(selectedColorId || "") &&
    String(item.sizeId || "") === String(selectedSizeId || "");

  if (!wishlist) {
    const now = new Date();
    wishlist = await Wishlist.create({
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

    const activity = await trackUserActivity({
      userId,
      type: "wishlist_add",
      productId,
      metadata: {
        colorId: selected.colorId,
        sizeId: selected.sizeId,
        addedAt: now,
      },
    });

    void sendWishlistAddedEmail({
      userId,
      productId,
      colorId: selected.colorId,
      sizeId: selected.sizeId,
    })
      .then((sent) => {
        if (sent && activity?._id) return markActivityEmailSent(String(activity._id));
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

  const activity = await trackUserActivity({
    userId,
    type: "wishlist_add",
    productId,
    metadata: {
      colorId: selected.colorId,
      sizeId: selected.sizeId,
      addedAt: now,
    },
  });

  void sendWishlistAddedEmail({
    userId,
    productId,
    colorId: selected.colorId,
    sizeId: selected.sizeId,
  })
    .then((sent) => {
      if (sent && activity?._id) return markActivityEmailSent(String(activity._id));
    })
    .catch((error) => console.error("WISHLIST ADDED EMAIL ERROR:", error));

  return { wishlist: await populateWishlistById(wishlist._id), alreadyExists: false };
};

export const getUserWishlist = async (userId: string) => {
  validateObjectId(userId, "user");

  const wishlist = await Wishlist.findOne({
    user: new Types.ObjectId(userId),
  }).populate({
    path: "items.product",
    select: WISHLIST_PRODUCT_SELECT,
  });

  return wishlist || createEmptyWishlistResponse(userId);
};

export const checkProductInWishlist = async (userId: string, productId: string) => {
  validateObjectId(userId, "user");
  validateObjectId(productId, "product");

  const exists = await Wishlist.exists({
    user: new Types.ObjectId(userId),
    "items.product": new Types.ObjectId(productId),
  });

  return Boolean(exists);
};

export const removeProductFromWishlist = async (
  userId: string,
  itemOrProductId: string
) => {
  validateObjectId(userId, "user");
  validateObjectId(itemOrProductId, "wishlist item or product");

  const wishlist = await Wishlist.findOne({ user: new Types.ObjectId(userId) });
  if (!wishlist) throw new Error("Wishlist not found.");

  const target = new Types.ObjectId(itemOrProductId);
  const byItemId = wishlist.items.find((item: any) => String(item._id || "") === itemOrProductId);
  const removedItems = byItemId
    ? wishlist.items.filter((item: any) => String(item._id || "") === itemOrProductId)
    : wishlist.items.filter((item) => item.product.equals(target));

  if (!removedItems.length) {
    throw new Error("Product is not in wishlist.");
  }

  wishlist.items = byItemId
    ? wishlist.items.filter((item: any) => String(item._id || "") !== itemOrProductId)
    : wishlist.items.filter((item) => !item.product.equals(target));

  await wishlist.save();

  for (const removed of removedItems) {
    await trackUserActivity({
      userId,
      type: "wishlist_remove",
      productId: String(removed.product),
      metadata: {
        wishlistItemId: String((removed as any)._id || ""),
        colorId: String(removed.colorId || ""),
        sizeId: String(removed.sizeId || ""),
        addedAt: removed.addedAt,
      },
    });
  }

  return populateWishlistById(wishlist._id);
};

export const clearUserWishlist = async (userId: string) => {
  validateObjectId(userId, "user");

  const wishlist = await Wishlist.findOne({ user: new Types.ObjectId(userId) });
  if (!wishlist) return createEmptyWishlistResponse(userId);

  const clearedItems = wishlist.items.length;
  wishlist.items = [];
  await wishlist.save();

  if (clearedItems > 0) {
    await trackUserActivity({
      userId,
      type: "wishlist_clear",
      metadata: { clearedItems },
    });
  }

  return populateWishlistById(wishlist._id);
};
