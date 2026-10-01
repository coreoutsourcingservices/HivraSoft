import mongoose, {
  Schema,
  Document,
  Model,
  Types,
} from "mongoose";

/* =========================================================
   WISHLIST ITEM
========================================================= */

export interface IWishlistItem {
  _id?: Types.ObjectId;
  product: Types.ObjectId;
  colorId?: Types.ObjectId | null;
  sizeId?: Types.ObjectId | null;
  addedAt: Date;
  updatedAt: Date;
}

/* =========================================================
   WISHLIST
========================================================= */

export interface IWishlist extends Document {
  user: Types.ObjectId;
  items: IWishlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

/* =========================================================
   WISHLIST ITEM SCHEMA
========================================================= */

const wishlistItemSchema =
  new Schema<IWishlistItem>(
    {
      product: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      colorId: {
        type: Schema.Types.ObjectId,
        default: null,
      },
      sizeId: {
        type: Schema.Types.ObjectId,
        default: null,
      },
      addedAt: {
        type: Date,
        required: true,
        default: Date.now,
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
    {
      _id: true,
    }
  );

/* =========================================================
   WISHLIST SCHEMA
========================================================= */

const wishlistSchema =
  new Schema<IWishlist>(
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
        index: true,
      },
      items: {
        type: [wishlistItemSchema],
        default: [],
      },
    },
    {
      timestamps: true,
    }
  );

/* =========================================================
   PREVENT EXACT DUPLICATE PRODUCT/VARIANT ITEMS
========================================================= */

wishlistSchema.pre("validate", function () {
  const seen = new Set<string>();

  this.items = this.items.filter((item) => {
    const key = [
      String(item.product),
      String(item.colorId || ""),
      String(item.sizeId || ""),
    ].join(":");

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
});

wishlistSchema.index({ "items.product": 1 });
wishlistSchema.index({ "items.addedAt": 1 });

const Wishlist: Model<IWishlist> =
  (mongoose.models.Wishlist as Model<IWishlist>) ||
  mongoose.model<IWishlist>("Wishlist", wishlistSchema);

export default Wishlist;
