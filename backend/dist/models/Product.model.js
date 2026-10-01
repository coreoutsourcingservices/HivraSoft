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
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
/* =========================================================
   PRODUCT IMAGE SCHEMA
========================================================= */
const productImageSchema = new mongoose_1.Schema({
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
}, {
    /*
     * Image ke andar MongoDB _id nahi banega.
     */
    _id: false,
});
/* =========================================================
   PRODUCT SIZE SCHEMA
========================================================= */
const productSizeSchema = new mongoose_1.Schema({
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
            validator: (value) => {
                return Number.isInteger(value);
            },
            message: "Stock must be a whole number.",
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
}, {
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
});
/* =========================================================
   PRODUCT COLOR SCHEMA
========================================================= */
const productColorSchema = new mongoose_1.Schema({
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
}, {
    /*
     * Stable color ID is required by cart/wishlist tracking.
     * Existing products are migrated once at backend startup.
     */
    _id: true,
});
/* =========================================================
   PRODUCT RATING SCHEMA
========================================================= */
const productRatingSchema = new mongoose_1.Schema({
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
}, {
    _id: false,
});
/* =========================================================
   MAIN PRODUCT SCHEMA
========================================================= */
const productSchema = new mongoose_1.Schema({
    /* =====================================================
       RATINGS
    ===================================================== */
    ratings: {
        type: productRatingSchema,
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
                type: mongoose_1.Schema.Types
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
            validator: (categories) => {
                return (Array.isArray(categories) &&
                    categories.length >
                        0);
            },
            message: "At least one category is required.",
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
}, {
    /*
     * Automatically:
     *
     * createdAt
     * updatedAt
     */
    timestamps: true,
});
/* =========================================================
   VALIDATION
========================================================= */
productSchema.pre("validate", function () {
    /* =====================================================
       isColor = true
       Minimum 1 color required
    ===================================================== */
    if (this.isColor &&
        this.colors.length === 0) {
        this.invalidate("colors", "At least one color is required when isColor is true.");
    }
    /* =====================================================
       isColor = false
       One internal default details block is allowed.

       Product name, slug, images, sizes and pricing are
       stored inside colors[] even for a no-color product.
       The storefront uses isColor=false to hide the color UI.
    ===================================================== */
    if (!this.isColor &&
        this.colors.length > 1) {
        this.invalidate("colors", "Only one default product details block is allowed when isColor is false.");
    }
    /* =====================================================
       ONLY ONE DEFAULT COLOR
    ===================================================== */
    if (this.isColor &&
        this.colors.length > 0) {
        const defaultColors = this.colors.filter((color) => {
            return (color.isDefault ===
                true);
        });
        if (defaultColors.length >
            1) {
            this.invalidate("colors", "Only one color can be default.");
        }
    }
    /* =====================================================
       DUPLICATE PRODUCT SLUG CHECK INSIDE COLORS
    ===================================================== */
    const productSlugs = this.colors.map((color) => color.slugProduct);
    const uniqueProductSlugs = new Set(productSlugs);
    if (productSlugs.length !==
        uniqueProductSlugs.size) {
        this.invalidate("colors", "Duplicate product slug is not allowed.");
    }
    /* =====================================================
       DUPLICATE COLOR CHECK
    ===================================================== */
    const colorSlugs = this.colors.map((color) => color.slugColor);
    const uniqueColorSlugs = new Set(colorSlugs);
    if (colorSlugs.length !==
        uniqueColorSlugs.size) {
        this.invalidate("colors", "Duplicate color is not allowed.");
    }
    /* =====================================================
       ONLY ONE DEFAULT IMAGE PER COLOR
    ===================================================== */
    for (const color of this.colors) {
        const defaultImages = color.images.filter((image) => {
            return (image.isDefault ===
                true);
        });
        if (defaultImages.length >
            1) {
            this.invalidate("colors", `Only one default image is allowed for ${color.nameProduct}.`);
        }
    }
});
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
    "colors.nameProduct": "text",
    "colors.shortDescription": "text",
    "colors.description": "text",
    "colors.tags": "text",
});
/* =========================================================
   MODEL
========================================================= */
const Product = mongoose_1.default.models.Product ||
    mongoose_1.default.model("Product", productSchema);
exports.default = Product;
//# sourceMappingURL=Product.model.js.map