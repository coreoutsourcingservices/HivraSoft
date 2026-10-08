import mongoose, {
  Schema,
  Document,
  Model,
  Types,
} from "mongoose";

/* =========================================================
   TYPES
========================================================= */

export type CartOfferType =
  | "buy_get"
  | "fixed_price_bundle"
  | "";

export type CartOfferSource =
  | "buy_get_page"
  | "fixed_price_bundle"
  | "";

/* =========================================================
   CART ITEM
========================================================= */

export interface ICartItem {
  _id?: Types.ObjectId;

  product: Types.ObjectId;

  colorId: Types.ObjectId;

  sizeId: Types.ObjectId;

  quantity: number;

  /*
   * null / empty:
   * Normal Men/Women/Home/Search cart item.
   *
   * buy_get + buy_get_page:
   * Item Buy/Get offer page se add hua hai.
   */
  offerId?:
    | Types.ObjectId
    | null;

  offerType?:
    CartOfferType;

  offerSource?:
    CartOfferSource;

  addedAt: Date;

  updatedAt: Date;
}

/* =========================================================
   CART
========================================================= */

export interface ICart
  extends Document {
  user: Types.ObjectId;

  items: ICartItem[];

  discountCode?: string;

  createdAt: Date;

  updatedAt: Date;
}

/* =========================================================
   CART ITEM SCHEMA
========================================================= */

const cartItemSchema =
  new Schema<ICartItem>(
    {
      product: {
        type:
          Schema.Types.ObjectId,

        ref:
          "Product",

        required:
          true,
      },

      colorId: {
        type:
          Schema.Types.ObjectId,

        required:
          true,
      },

      sizeId: {
        type:
          Schema.Types.ObjectId,

        required:
          true,
      },

      quantity: {
        type: Number,
        required: true,
        min: 1,
        max: 99,
        default: 1,
      },

      offerId: {
        type:
          Schema.Types.ObjectId,

        default:
          null,
      },

      offerType: {
        type:
          String,

        enum: [
          "",
          "buy_get",
          "fixed_price_bundle",
        ],

        default:
          "",
      },

      offerSource: {
        type:
          String,

        enum: [
          "",
          "buy_get_page",
          "fixed_price_bundle",
        ],

        default:
          "",
      },

      addedAt: {
        type: Date,
        required: true,
        default:
          Date.now,
      },

      updatedAt: {
        type: Date,
        default:
          Date.now,
      },
    },
    {
      _id: true,
    }
  );

/* =========================================================
   CART SCHEMA
========================================================= */

const cartSchema =
  new Schema<ICart>(
    {
      user: {
        type:
          Schema.Types.ObjectId,

        ref:
          "User",

        required:
          true,

        unique:
          true,

        index:
          true,
      },

      items: {
        type: [
          cartItemSchema,
        ],

        default: [],
      },

      discountCode: {
        type: String,
        trim: true,
        uppercase: true,
        default: "",
      },
    },
    {
      timestamps: true,
    }
  );

/* =========================================================
   INDEXES
========================================================= */

cartSchema.index({
  "items.product": 1,
});

cartSchema.index({
  "items.offerId": 1,
});

cartSchema.index({
  "items.addedAt": 1,
});

/* =========================================================
   MODEL
========================================================= */

const Cart: Model<ICart> =
  (mongoose.models
    .Cart as
    Model<ICart>) ||
  mongoose.model<ICart>(
    "Cart",
    cartSchema
  );

export default Cart;
