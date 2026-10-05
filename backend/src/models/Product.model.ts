import mongoose, {
  Schema,
  Document,
  Model,
  Types,
} from "mongoose";

import { applySoftDeletePlugin } from "../utils/softDelete";

/* =========================================================
   PRODUCT IMAGE TYPE
========================================================= */

export interface IProductImage {
  url: string;
  publicId: string;
  isDefault: boolean;
  name?: string;
  alt?: string;
}

/* =========================================================
   PRODUCT SIZE TYPE
========================================================= */

export interface IProductSize {
  _id?: Types.ObjectId;

  size: string;

  stock: number;

  originalPrice: number;

  showPrice: number;

  discountPrice: number;

  isActive: boolean;
}

/* =========================================================
   PRODUCT COLOR TYPE
========================================================= */

export interface IProductColor {
  _id?: Types.ObjectId;

  nameProduct: string;

  slugProduct: string;

  nameColor: string;

  slugColor: string;

  hex?: string;

  isDefault: boolean;

  originalPrice: number;

  showPrice: number;

  discountPrice: number;

  shortDescription?: string;

  description?: string;

  tags: string[];

  focusKeyword?: string;

  seoTitle?: string;

  seoDescription?: string;

  images: IProductImage[];

  sizes: IProductSize[];
}

/* =========================================================
   PRODUCT RATING TYPE
========================================================= */

export interface IProductRating {
  average: number;

  count: number;
}

/* =========================================================
   PRODUCT TYPE
========================================================= */

export interface IProduct
  extends Document {

  ratings: IProductRating;

  categories: Types.ObjectId[];

  isColor: boolean;

  colors: IProductColor[];

  isActive: boolean;

  isFeatured: boolean;

  isNewLaunch: boolean;

  createdAt: Date;

  updatedAt: Date;
}

/* =========================================================
   PRODUCT IMAGE SCHEMA
========================================================= */

const productImageSchema =
  new Schema<IProductImage>(
    {
      url: {
        type: String,
        required: [
          true,
          "Product image URL is required.",
        ],
        trim: true,
      },

      publicId: {
        type: String,
        required: [
          true,
          "Product image publicId is required.",
        ],
        trim: true,
      },

      isDefault: {
        type: Boolean,
        default: false,
      },

      name: {
        type: String,
        default: "",
        trim: true,
        maxlength: [
          200,
          "Image name cannot exceed 200 characters.",
        ],
      },

      alt: {
        type: String,
        default: "",
        trim: true,
        maxlength: [
          500,
          "Image ALT text cannot exceed 500 characters.",
        ],
      },
    },
    {
      /*
       * Image ke andar MongoDB _id nahi banega.
       */
      _id: false,
    }
  );

/* =========================================================
   PRODUCT SIZE SCHEMA
========================================================= */

const productSizeSchema =
  new Schema<IProductSize>(
    {
      size: {
        type: String,

        required: [
          true,
          "Product size is required.",
        ],

        trim: true,

        uppercase: true,
      },

      stock: {
        type: Number,

        required: [
          true,
          "Product stock is required.",
        ],

        default: 0,

        min: [
          0,
          "Stock cannot be negative.",
        ],

        validate: {
          validator: (
            value: number
          ) => {
            return Number.isInteger(
              value
            );
          },

          message:
            "Stock must be a whole number.",
        },
      },

      originalPrice: {
        type: Number,
        required: [
          true,
          "Original price is required.",
        ],
        default: 0,
        min: [
          0,
          "Original price cannot be negative.",
        ],
      },

      showPrice: {
        type: Number,
        required: [
          true,
          "Show price is required.",
        ],
        default: 0,
        min: [
          0,
          "Show price cannot be negative.",
        ],
      },

      discountPrice: {
        type: Number,
        required: [
          true,
          "Discount price is required.",
        ],
        default: 0,
        min: [
          0,
          "Discount price cannot be negative.",
        ],
      },

      isActive: {
        type: Boolean,

        default: true,
      },
    },
    {
      /*
       * Size ke andar _id chahiye.
       *
       * Example:
       *
       * {
       *   "_id": "...",
       *   "size": "M",
       *   "stock": 30,
       *   "isActive": true
       * }
       */
      _id: true,
    }
  );

/* =========================================================
   PRODUCT COLOR SCHEMA
========================================================= */

const productColorSchema =
  new Schema<IProductColor>(
    {
      /* =====================================================
         PRODUCT NAME
      ===================================================== */

      nameProduct: {
        type: String,

        required: [
          true,
          "Product name is required.",
        ],

        trim: true,

        maxlength: [
          200,
          "Product name cannot exceed 200 characters.",
        ],
      },

      /* =====================================================
         PRODUCT SLUG
      ===================================================== */

      slugProduct: {
        type: String,

        required: [
          true,
          "Product slug is required.",
        ],

        trim: true,

        lowercase: true,

        maxlength: [
          250,
          "Product slug cannot exceed 250 characters.",
        ],
      },

      /* =====================================================
         COLOR NAME
      ===================================================== */

      nameColor: {
        type: String,

        required: [
          true,
          "Color name is required.",
        ],

        trim: true,
      },

      /* =====================================================
         COLOR SLUG
      ===================================================== */

      slugColor: {
        type: String,

        required: [
          true,
          "Color slug is required.",
        ],

        trim: true,

        lowercase: true,
      },

      /* =====================================================
         COLOR HEX
      ===================================================== */

      hex: {
        type: String,

        default: "",

        trim: true,
      },

      /* =====================================================
         DEFAULT COLOR
      ===================================================== */

      isDefault: {
        type: Boolean,

        default: false,
      },

      /* =====================================================
         COLOR-LEVEL PRICING
      ===================================================== */

      originalPrice: {
        type: Number,
        required: [
          true,
          "Original price is required.",
        ],
        default: 0,
        min: [
          0,
          "Original price cannot be negative.",
        ],
      },

      showPrice: {
        type: Number,
        required: [
          true,
          "Show price is required.",
        ],
        default: 0,
        min: [
          0,
          "Show price cannot be negative.",
        ],
      },

      discountPrice: {
        type: Number,
        required: [
          true,
          "Discount price is required.",
        ],
        default: 0,
        min: [
          0,
          "Discount price cannot be negative.",
        ],
      },

      /* =====================================================
         SHORT DESCRIPTION
      ===================================================== */

      shortDescription: {
        type: String,

        default: "",

        trim: true,

        maxlength: [
          1000,
          "Short description cannot exceed 1000 characters.",
        ],
      },

      /* =====================================================
         FULL DESCRIPTION
      ===================================================== */

      description: {
        type: String,

        default: "",
      },

      /* =====================================================
         TAGS
      ===================================================== */

      tags: {
        type: [String],

        default: [],
      },

      /* =====================================================
         FOCUS KEYWORD
      ===================================================== */

      focusKeyword: {
        type: String,

        default: "",

        trim: true,

        maxlength: [
          180,
          "Focus keyword cannot exceed 180 characters.",
        ],
      },

      /* =====================================================
         SEO TITLE
      ===================================================== */

      seoTitle: {
        type: String,

        default: "",

        trim: true,

        maxlength: [
          200,
          "SEO title cannot exceed 200 characters.",
        ],
      },

      /* =====================================================
         SEO DESCRIPTION
      ===================================================== */

      seoDescription: {
        type: String,

        default: "",

        trim: true,

        maxlength: [
          1000,
          "SEO description cannot exceed 1000 characters.",
        ],
      },

      /* =====================================================
         PRODUCT IMAGES
      ===================================================== */

      images: {
        type: [
          productImageSchema,
        ],

        default: [],
      },

      /* =====================================================
         PRODUCT SIZES
      ===================================================== */

      sizes: {
        type: [
          productSizeSchema,
        ],

        default: [],
      },
    },
    {
      /*
       * Stable color ID is required by cart/wishlist tracking.
       * Existing products are migrated once at backend startup.
       */
      _id: true,
    }
  );

/* =========================================================
   PRODUCT RATING SCHEMA
========================================================= */

const productRatingSchema =
  new Schema<IProductRating>(
    {
      average: {
        type: Number,

        default: 0,

        min: [
          0,
          "Rating cannot be less than 0.",
        ],

        max: [
          5,
          "Rating cannot be greater than 5.",
        ],
      },

      count: {
        type: Number,

        default: 0,

        min: [
          0,
          "Rating count cannot be negative.",
        ],
      },
    },
    {
      _id: false,
    }
  );

/* =========================================================
   MAIN PRODUCT SCHEMA
========================================================= */

const productSchema =
  new Schema<IProduct>(
    {
      /* =====================================================
         RATINGS
      ===================================================== */

      ratings: {
        type:
          productRatingSchema,

        default: () => ({
          average: 0,
          count: 0,
        }),
      },

      /* =====================================================
         CATEGORIES
      ===================================================== */

      categories: {
        type: [
          {
            type:
              Schema.Types
                .ObjectId,

            ref: "Category",
          },
        ],

        required: [
          true,
          "Product category is required.",
        ],

        default: [],

        validate: {
          validator: (
            categories:
              Types.ObjectId[]
          ) => {
            return (
              Array.isArray(
                categories
              ) &&
              categories.length >
                0
            );
          },

          message:
            "At least one category is required.",
        },
      },

      /* =====================================================
         COLOR PRODUCT
      ===================================================== */

      isColor: {
        type: Boolean,

        required: true,

        default: true,
      },

      /* =====================================================
         COLORS
      ===================================================== */

      colors: {
        type: [
          productColorSchema,
        ],

        default: [],
      },

      /* =====================================================
         ACTIVE
      ===================================================== */

      isActive: {
        type: Boolean,

        default: true,
      },

      /* =====================================================
         FEATURED
      ===================================================== */

      isFeatured: {
        type: Boolean,

        default: false,
      },

      /* =====================================================
         NEW LAUNCH
      ===================================================== */

      isNewLaunch: {
        type: Boolean,

        default: false,
      },
    },
    {
      /*
       * Automatically:
       *
       * createdAt
       * updatedAt
       */
      timestamps: true,
    }
  );

/* =========================================================
   VALIDATION
========================================================= */

productSchema.pre(
  "validate",
  function () {

    /* =====================================================
       isColor = true
       Minimum 1 color required
    ===================================================== */

    if (
      this.isColor &&
      this.colors.length === 0
    ) {
      this.invalidate(
        "colors",
        "At least one color is required when isColor is true."
      );
    }

    /* =====================================================
       isColor = false
       One internal default details block is allowed.

       Product name, slug, images, sizes and pricing are
       stored inside colors[] even for a no-color product.
       The storefront uses isColor=false to hide the color UI.
    ===================================================== */

    if (
      !this.isColor &&
      this.colors.length > 1
    ) {
      this.invalidate(
        "colors",
        "Only one default product details block is allowed when isColor is false."
      );
    }

    /* =====================================================
       ONLY ONE DEFAULT COLOR
    ===================================================== */

    if (
      this.isColor &&
      this.colors.length > 0
    ) {
      const defaultColors =
        this.colors.filter(
          (color) => {
            return (
              color.isDefault ===
              true
            );
          }
        );

      if (
        defaultColors.length >
        1
      ) {
        this.invalidate(
          "colors",
          "Only one color can be default."
        );
      }
    }

    /* =====================================================
       DUPLICATE PRODUCT SLUG CHECK INSIDE COLORS
    ===================================================== */

    const productSlugs =
      this.colors.map(
        (color) =>
          color.slugProduct
      );

    const uniqueProductSlugs =
      new Set(
        productSlugs
      );

    if (
      productSlugs.length !==
      uniqueProductSlugs.size
    ) {
      this.invalidate(
        "colors",
        "Duplicate product slug is not allowed."
      );
    }

    /* =====================================================
       DUPLICATE COLOR CHECK
    ===================================================== */

    const colorSlugs =
      this.colors.map(
        (color) =>
          color.slugColor
      );

    const uniqueColorSlugs =
      new Set(
        colorSlugs
      );

    if (
      colorSlugs.length !==
      uniqueColorSlugs.size
    ) {
      this.invalidate(
        "colors",
        "Duplicate color is not allowed."
      );
    }

    /* =====================================================
       ONLY ONE DEFAULT IMAGE PER COLOR
    ===================================================== */

    for (
      const color of
      this.colors
    ) {
      const defaultImages =
        color.images.filter(
          (image) => {
            return (
              image.isDefault ===
              true
            );
          }
        );

      if (
        defaultImages.length >
        1
      ) {
        this.invalidate(
          "colors",
          `Only one default image is allowed for ${color.nameProduct}.`
        );
      }
    }
  }
);

/* =========================================================
   INDEXES
========================================================= */

/*
 * Category filter:
 *
 * /products?category=...
 */
productSchema.index({
  categories: 1,
});

/*
 * Active products
 */
productSchema.index({
  isActive: 1,
});

/*
 * Featured products
 */
productSchema.index({
  isFeatured: 1,
});

/*
 * New launches
 */
productSchema.index({
  isNewLaunch: 1,
});

/*
 * Top rated products
 */
productSchema.index({
  "ratings.average": -1,
});

/*
 * Latest products
 */
productSchema.index({
  createdAt: -1,
});

/*
 * Product slug lookup
 */
productSchema.index({
  "colors.slugProduct": 1,
});

/*
 * Color lookup
 */
productSchema.index({
  "colors.slugColor": 1,
});

/*
 * SEO/search text
 */
productSchema.index({
  "colors.nameProduct":
    "text",

  "colors.shortDescription":
    "text",

  "colors.description":
    "text",

  "colors.tags":
    "text",
});

applySoftDeletePlugin(productSchema);

/* =========================================================
   MODEL
========================================================= */

const Product: Model<IProduct> =
  mongoose.models.Product ||
  mongoose.model<IProduct>(
    "Product",
    productSchema
  );

export default Product;