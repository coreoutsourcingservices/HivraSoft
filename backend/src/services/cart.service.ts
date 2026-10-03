import mongoose, {
  Types,
} from "mongoose";

import Cart, {
  ICart,
  ICartItem,
} from "../models/Cart.model";

import Product from "../models/Product.model";
import DiscountCode from "../models/DiscountCode.model";
import { calculateDiscounts } from "./discount.service";
<<<<<<< HEAD
import { trackUserActivity } from "./activity.service";
=======
import { markActivityEmailSent, trackUserActivity } from "./activity.service";
import { sendCartAddedEmail } from "./commerce-email.service";
>>>>>>> aman
import { calculateTax } from "./tax.service";

/* =========================================================
   TYPES
========================================================= */

export interface AddCartItemData {
  productId: string;
  colorId: string;
  sizeId: string;
  quantity?: number;
}

export interface UpdateCartItemData {
  quantity: number;
}

/* =========================================================
   HELPERS
========================================================= */

const validateObjectId = (
  value: string,
  fieldName: string
) => {
  if (
    !value ||
    !mongoose.Types.ObjectId.isValid(
      value
    )
  ) {
    throw new Error(
      `Invalid ${fieldName}.`
    );
  }
};

const normalizeQuantity = (
  value: unknown,
  defaultValue = 1
): number => {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return defaultValue;
  }

  const quantity =
    Number(value);

  if (
    !Number.isInteger(
      quantity
    ) ||
    quantity < 1 ||
    quantity > 99
  ) {
    throw new Error(
      "Quantity must be a whole number between 1 and 99."
    );
  }

  return quantity;
};

const getVariant = (
  product: any,
  colorId: string,
  sizeId: string
) => {
  const color =
    product.colors?.find(
      (item: any) =>
        String(
          item._id
        ) === colorId
    );

  if (!color) {
    throw new Error(
      "Selected product color was not found."
    );
  }

  const size =
    color.sizes?.find(
      (item: any) =>
        String(
          item._id
        ) === sizeId
    );

  if (!size) {
    throw new Error(
      "Selected product size was not found."
    );
  }

  if (!size.isActive) {
    throw new Error(
      "Selected product size is inactive."
    );
  }

  return {
    color,
    size,
  };
};

const getAvailableStock = (
  _product: any,
  size: any
) => {
  return Math.max(0, Number(size?.stock ?? 0));
};

const getOrCreateCart =
  async (
    userId: string
  ): Promise<ICart> => {
    let cart =
      await Cart.findOne({
        user: userId,
      });

    if (!cart) {
      cart =
        await Cart.create({
          user:
            new Types.ObjectId(
              userId
            ),

          items: [],
        });
    }

    return cart;
  };

const buildCartResponse =
  async (
    cart: ICart
  ) => {
    const productIds =
      Array.from(
        new Set(
          cart.items.map(
            item =>
              String(
                item.product
              )
          )
        )
      );

    const products =
      productIds.length > 0
        ? await Product.find({
            _id: {
              $in:
                productIds,
            },
          }).lean()
        : [];

    const productMap =
      new Map(
        products.map(
          product => [
            String(
              product._id
            ),
            product,
          ]
        )
      );

    let subtotal = 0;
    let totalItems = 0;

    const items =
      cart.items.map(
        item => {
          const product =
            productMap.get(
              String(
                item.product
              )
            ) as any;

          const quantity =
            Number(
              item.quantity
            );

          totalItems +=
            quantity;

          if (!product) {
            return {
              _id:
                item._id,

              product: null,

              colorId:
                item.colorId,

              sizeId:
                item.sizeId,

              quantity,

              unitPrice: 0,

              subtotal: 0,

              available:
                false,

              unavailableReason:
                "Product no longer exists.",

              addedAt:
                item.addedAt,

              updatedAt:
                item.updatedAt || item.addedAt,

              ageMs:
                item.addedAt ? Math.max(0, Date.now() - new Date(item.addedAt).getTime()) : 0,
            };
          }

          const color =
            product.colors?.find(
              (value: any) =>
                String(
                  value._id
                ) ===
                String(
                  item.colorId
                )
            );

          const size =
            color?.sizes?.find(
              (value: any) =>
                String(
                  value._id
                ) ===
                String(
                  item.sizeId
                )
            );

          const availableStock =
            color && size
              ? getAvailableStock(
                  product,
                  size
                )
              : 0;

          const available =
            product.isActive !== false &&
            Boolean(size?.isActive) &&
            availableStock >= quantity;

          const unitPrice =
            Number(
              size?.showPrice ??
              color?.showPrice ??
              0
            );

          const itemSubtotal =
            unitPrice *
            quantity;

          if (available) {
            subtotal +=
              itemSubtotal;
          }

          return {
            _id:
              item._id,

            product: {
              _id:
                product._id,

              name:
                color?.nameProduct || "Product",

              slug:
                color?.slugProduct || "",

              price:
                unitPrice,

              compareAtPrice:
                Number(size?.originalPrice ?? color?.originalPrice ?? unitPrice),

              stock:
                availableStock,

              mainImages:
                color?.images ||
                [],

              status:
                product.isActive !== false ? "active" : "inactive",
            },

            selectedColor:
              color
                ? {
                    _id:
                      color._id,

                    name:
                      color.nameColor,

                    slug:
                      color.slugColor,

                    hex:
                      color.hex,

                    images:
                      color.images ||
                      [],

                    isActive:
                      true,
                  }
                : null,

            selectedSize:
              size
                ? {
                    _id:
                      size._id,

                    size:
                      size.size,

                    sku:
                      size.sku,

                    stock:
                      size.stock,

                    isActive:
                      size.isActive,
                  }
                : null,

            colorId:
              item.colorId,

            sizeId:
              item.sizeId,

            quantity,

            unitPrice,

            subtotal:
              itemSubtotal,

            availableStock,

            available,

            addedAt:
              item.addedAt,

            updatedAt:
              item.updatedAt || item.addedAt,

            ageMs:
              item.addedAt ? Math.max(0, Date.now() - new Date(item.addedAt).getTime()) : 0,
          };
        }
      );

    const discountResult = await calculateDiscounts(
      items
        .filter((item: any) => item.available && item.product?._id)
        .map((item: any) => ({
<<<<<<< HEAD
          lineId: String(item._id || ""),
=======
>>>>>>> aman
          productId: String(item.product._id),
          unitPrice: Number(item.unitPrice || 0),
          quantity: Number(item.quantity || 0),
        })),
      cart.discountCode || null
    );

<<<<<<< HEAD
    const discountByLine = new Map(
      discountResult.itemDiscounts.map((item) => [String(item.lineId || item.productId), item])
=======
    const discountByProduct = new Map(
      discountResult.itemDiscounts.map((item) => [item.productId, item])
>>>>>>> aman
    );

    const discountedItems = items.map((item: any) => {
      if (!item.product?._id) return item;
<<<<<<< HEAD
      const discount =
        discountByLine.get(String(item._id || "")) ||
        discountByLine.get(String(item.product._id));
=======
      const discount = discountByProduct.get(String(item.product._id));
>>>>>>> aman
      return { ...item, discount: discount || null };
    });

    const discountedSubtotal = Math.max(0, subtotal - discountResult.totalDiscount);
    const taxResult = await calculateTax(
      discountedItems
        .filter((item: any) => item.available && item.product?._id)
        .map((item: any) => ({
          productId: String(item.product._id),
          amount: Number(item.discount?.finalLineTotal ?? item.subtotal ?? 0),
        }))
    );
    const total = Math.max(0, discountedSubtotal + taxResult.amount);

    return {
      _id: cart._id,
      user: cart.user,
      items: discountedItems,
      totalItems,
      subtotal,
<<<<<<< HEAD
      offerDiscount: discountResult.offerDiscount,
      automaticDiscount: discountResult.automaticDiscount,
      codeDiscount: discountResult.codeDiscount,
      discount: discountResult.totalDiscount,
      discountSummary: {
        offers: discountResult.offers,
        automatic: discountResult.automatic,
        code: discountResult.code,
      },
=======
      automaticDiscount: discountResult.automaticDiscount,
      codeDiscount: discountResult.codeDiscount,
      discount: discountResult.totalDiscount,
      discountSummary: { automatic: discountResult.automatic, code: discountResult.code },
>>>>>>> aman
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

export const addItemToCart =
  async (
    userId: string,
    data: AddCartItemData
  ) => {
    validateObjectId(
      userId,
      "user ID"
    );

    validateObjectId(
      data.productId,
      "product ID"
    );

    validateObjectId(
      data.colorId,
      "color ID"
    );

    validateObjectId(
      data.sizeId,
      "size ID"
    );

    const quantity =
      normalizeQuantity(
        data.quantity,
        1
      );

    const product =
      await Product.findById(
        data.productId
      );

    if (!product) {
      throw new Error(
        "Product not found."
      );
    }

    if (
      (product as any).isActive === false
    ) {
      throw new Error(
        "Product is not available for purchase."
      );
    }

    const {
      size,
    } = getVariant(
      product,
      data.colorId,
      data.sizeId
    );

    const cart =
      await getOrCreateCart(
        userId
      );

    const existingItem =
      cart.items.find(
        item =>
          String(
            item.product
          ) ===
            data.productId &&
          String(
            item.colorId
          ) ===
            data.colorId &&
          String(
            item.sizeId
          ) ===
            data.sizeId
      );

    const nextQuantity =
      existingItem
        ? existingItem.quantity +
          quantity
        : quantity;

    if (
      nextQuantity > 99
    ) {
      throw new Error(
        "Maximum cart quantity is 99."
      );
    }

    const availableStock =
      getAvailableStock(
        product,
        size
      );

    if (
      availableStock <
      nextQuantity
    ) {
      throw new Error(
        `Only ${availableStock} item(s) are available in stock.`
      );
    }

    const now = new Date();
    let trackingAddedAt = now;

    if (existingItem) {
      existingItem.quantity =
        nextQuantity;
      existingItem.updatedAt =
        now;
      trackingAddedAt = existingItem.addedAt || now;
    } else {
      cart.items.push({
        product:
          new Types.ObjectId(
            data.productId
          ),

        colorId:
          new Types.ObjectId(
            data.colorId
          ),

        sizeId:
          new Types.ObjectId(
            data.sizeId
          ),

        quantity,

        addedAt:
          now,

        updatedAt:
          now,
      });
    }

    await cart.save();

<<<<<<< HEAD
    await trackUserActivity({
=======
    const activity = await trackUserActivity({
>>>>>>> aman
      userId,
      type: "cart_add",
      productId: data.productId,
      metadata: {
        colorId: data.colorId,
        sizeId: data.sizeId,
        quantity,
        finalQuantity: nextQuantity,
        addedAt: trackingAddedAt,
      },
    });

<<<<<<< HEAD
    return buildCartResponse(
      cart
    );
=======
    const response = await buildCartResponse(
      cart
    );

    void sendCartAddedEmail({
      userId,
      productId: data.productId,
      colorId: data.colorId,
      sizeId: data.sizeId,
      quantity: nextQuantity,
      cartTotal: Number((response as any).total || 0),
    })
      .then((sent) => {
        if (sent && activity?._id) {
          return markActivityEmailSent(String(activity._id));
        }
      })
      .catch((error) => console.error("CART ADDED EMAIL ERROR:", error));

    return response;
>>>>>>> aman
  };

/* =========================================================
   GET CART
========================================================= */

export const getUserCart =
  async (
    userId: string
  ) => {
    validateObjectId(
      userId,
      "user ID"
    );

    const cart =
      await getOrCreateCart(
        userId
      );

    return buildCartResponse(
      cart
    );
  };

/* =========================================================
   GET CART COUNT
========================================================= */

export const getCartCount =
  async (
    userId: string
  ) => {
    validateObjectId(
      userId,
      "user ID"
    );

    const cart =
      await Cart.findOne({
        user: userId,
      });

    if (!cart) {
      return 0;
    }

    return cart.items.reduce(
      (
        total,
        item
      ) =>
        total +
        item.quantity,
      0
    );
  };

/* =========================================================
   UPDATE ITEM QUANTITY
========================================================= */

export const updateCartItem =
  async (
    userId: string,
    cartItemId: string,
    data: UpdateCartItemData
  ) => {
    validateObjectId(
      userId,
      "user ID"
    );

    validateObjectId(
      cartItemId,
      "cart item ID"
    );

    const quantity =
      normalizeQuantity(
        data.quantity
      );

    const cart =
      await Cart.findOne({
        user: userId,
      });

    if (!cart) {
      throw new Error(
        "Cart not found."
      );
    }

    const item =
      cart.items.find(
        value =>
          String(
            value._id
          ) ===
          cartItemId
      );

    if (!item) {
      throw new Error(
        "Cart item not found."
      );
    }

    const product =
      await Product.findById(
        item.product
      );

    if (!product) {
      throw new Error(
        "Product not found."
      );
    }

    if (
      (product as any).isActive === false
    ) {
      throw new Error(
        "Product is not available for purchase."
      );
    }

    const {
      size,
    } = getVariant(
      product,
      String(
        item.colorId
      ),
      String(
        item.sizeId
      )
    );

    const availableStock =
      getAvailableStock(
        product,
        size
      );

    if (
      availableStock <
      quantity
    ) {
      throw new Error(
        `Only ${availableStock} item(s) are available in stock.`
      );
    }

    const previousQuantity = Number(item.quantity || 0);
    item.quantity =
      quantity;
    item.updatedAt =
      new Date();

    await cart.save();

    await trackUserActivity({
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

    return buildCartResponse(
      cart
    );
  };

/* =========================================================
   REMOVE ONE CART ITEM
========================================================= */

export const removeCartItem =
  async (
    userId: string,
    cartItemId: string
  ) => {
    validateObjectId(
      userId,
      "user ID"
    );

    validateObjectId(
      cartItemId,
      "cart item ID"
    );

    const cart =
      await Cart.findOne({
        user: userId,
      });

    if (!cart) {
      throw new Error(
        "Cart not found."
      );
    }

    const removedItem =
      cart.items.find(
        item =>
          String(
            item._id
          ) ===
          cartItemId
      );

    const itemExists = Boolean(removedItem);

    if (!itemExists) {
      throw new Error(
        "Cart item not found."
      );
    }

    cart.items =
      cart.items.filter(
        item =>
          String(
            item._id
          ) !==
          cartItemId
      );

    await cart.save();

    if (removedItem) {
      await trackUserActivity({
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

    return buildCartResponse(
      cart
    );
  };

/* =========================================================
   CLEAR CART
========================================================= */

export const clearUserCart =
  async (
    userId: string
  ) => {
    validateObjectId(
      userId,
      "user ID"
    );

    const cart =
      await getOrCreateCart(
        userId
      );

    const clearedItems = cart.items.length;
    cart.items = [];
    cart.discountCode = "";

    await cart.save();

    if (clearedItems > 0) {
      await trackUserActivity({
        userId,
        type: "cart_clear",
        metadata: { clearedItems },
      });
    }

    return buildCartResponse(
      cart
    );
  };


/* =========================================================
   DISCOUNT CODE
========================================================= */

export const applyCartDiscountCode = async (userId: string, rawCode: string) => {
  validateObjectId(userId, "user ID");
  const code = String(rawCode || "").trim().toUpperCase();
  if (!code) throw new Error("Enter a discount code.");

  const coupon = await DiscountCode.findOne({ code, isActive: true }).lean();
  if (!coupon) throw new Error("Discount code is invalid or inactive.");

  const now = new Date();
  if (coupon.startsAt && new Date(coupon.startsAt) > now) throw new Error("Discount code is not active yet.");
  if (coupon.endsAt && new Date(coupon.endsAt) < now) throw new Error("Discount code has expired.");

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

export const removeCartDiscountCode = async (userId: string) => {
  validateObjectId(userId, "user ID");
  const cart = await getOrCreateCart(userId);
  cart.discountCode = "";
  await cart.save();
  return buildCartResponse(cart);
};
