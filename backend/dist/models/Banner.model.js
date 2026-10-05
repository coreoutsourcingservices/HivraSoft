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
const softDelete_1 = require("../utils/softDelete");
/* =========================================================
   COMMON MEDIA FIELDS
========================================================= */
const commonMediaFields = {
    title: {
        type: String,
        default: "",
        trim: true,
        maxlength: 200,
    },
    subtitle: {
        type: String,
        default: "",
        trim: true,
        maxlength: 300,
    },
    description: {
        type: String,
        default: "",
        trim: true,
        maxlength: 2000,
    },
    buttonText: {
        type: String,
        default: "Shop Now",
        trim: true,
        maxlength: 100,
    },
    linkType: {
        type: String,
        enum: [
            "none",
            "custom",
            "category",
            "product",
        ],
        default: "none",
    },
    customLink: {
        type: String,
        default: "",
        trim: true,
    },
    category: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Category",
        default: null,
    },
    product: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Product",
        default: null,
    },
    openInNewTab: {
        type: Boolean,
        default: false,
    },
};
/* =========================================================
   IMAGE SCHEMA
========================================================= */
const bannerImageSchema = new mongoose_1.Schema({
    url: {
        type: String,
        required: true,
        trim: true,
    },
    publicId: {
        type: String,
        required: true,
        trim: true,
    },
    alt: {
        type: String,
        default: "",
        trim: true,
        maxlength: 200,
    },
    ...commonMediaFields,
}, {
    _id: false,
});
/* =========================================================
   VIDEO POSTER SCHEMA
========================================================= */
const bannerVideoPosterSchema = new mongoose_1.Schema({
    url: {
        type: String,
        required: true,
        trim: true,
    },
    publicId: {
        type: String,
        required: true,
        trim: true,
    },
}, {
    _id: false,
});
/* =========================================================
   VIDEO SCHEMA
========================================================= */
const bannerVideoSchema = new mongoose_1.Schema({
    url: {
        type: String,
        required: true,
        trim: true,
    },
    publicId: {
        type: String,
        required: true,
        trim: true,
    },
    poster: {
        type: bannerVideoPosterSchema,
        default: undefined,
    },
    autoplay: {
        type: Boolean,
        default: true,
    },
    muted: {
        type: Boolean,
        default: true,
    },
    loop: {
        type: Boolean,
        default: true,
    },
    controls: {
        type: Boolean,
        default: false,
    },
    ...commonMediaFields,
}, {
    _id: false,
});
/* =========================================================
   NORMALIZE / VALIDATE MEDIA LINK
========================================================= */
const normalizeMediaLink = (item) => {
    if (item.linkType === "custom") {
        if (!item.customLink?.trim()) {
            throw new Error("Custom link is required for every media item using custom link.");
        }
        item.category = null;
        item.product = null;
        return;
    }
    if (item.linkType === "category") {
        if (!item.category) {
            throw new Error("Category is required for every media item using category link.");
        }
        item.customLink = "";
        item.product = null;
        return;
    }
    if (item.linkType === "product") {
        if (!item.product) {
            throw new Error("Product is required for every media item using product link.");
        }
        item.customLink = "";
        item.category = null;
        return;
    }
    item.customLink = "";
    item.category = null;
    item.product = null;
};
/* =========================================================
   BANNER SCHEMA
========================================================= */
const bannerSchema = new mongoose_1.Schema({
    /* =====================================================
       ADMIN / GROUP DETAILS
    ===================================================== */
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        maxlength: 250,
        match: [
            /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
            "Banner slug must contain only lowercase letters, numbers and hyphens.",
        ],
    },
    description: {
        type: String,
        default: "",
        trim: true,
        maxlength: 2000,
    },
    /* =====================================================
       MEDIA
    ===================================================== */
    mediaType: {
        type: String,
        enum: [
            "image",
            "video",
        ],
        required: true,
        default: "image",
    },
    images: {
        type: [bannerImageSchema],
        default: [],
    },
    videos: {
        type: [bannerVideoSchema],
        default: [],
    },
    /* =====================================================
       PLACEMENT
    ===================================================== */
    position: {
        type: String,
        enum: [
            "home_hero",
            "home_top",
            "home_middle",
            "home_bottom",
            "category_top",
            "category_middle",
        ],
        default: "home_hero",
    },
    device: {
        type: String,
        enum: [
            "all",
            "desktop",
            "mobile",
        ],
        default: "all",
    },
    sortOrder: {
        type: Number,
        default: 0,
        min: 0,
    },
    /* =====================================================
       STATUS
    ===================================================== */
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});
/* =========================================================
   VALIDATION
========================================================= */
bannerSchema.pre("validate", function () {
    if (this.mediaType === "image") {
        if (!Array.isArray(this.images) ||
            this.images.length === 0) {
            throw new Error("Image banner requires at least one image.");
        }
        this.videos = [];
        this.images.forEach(normalizeMediaLink);
    }
    if (this.mediaType === "video") {
        if (!Array.isArray(this.videos) ||
            this.videos.length === 0) {
            throw new Error("Video banner requires at least one video.");
        }
        this.images = [];
        this.videos.forEach(normalizeMediaLink);
    }
});
/* =========================================================
   INDEXES
========================================================= */
bannerSchema.index({
    isActive: 1,
});
bannerSchema.index({
    position: 1,
    device: 1,
    isActive: 1,
    sortOrder: 1,
});
bannerSchema.index({
    "images.category": 1,
});
bannerSchema.index({
    "images.product": 1,
});
bannerSchema.index({
    "videos.category": 1,
});
bannerSchema.index({
    "videos.product": 1,
});
(0, softDelete_1.applySoftDeletePlugin)(bannerSchema);
/* =========================================================
   MODEL
========================================================= */
const Banner = mongoose_1.default.models.Banner ||
    mongoose_1.default.model("Banner", bannerSchema);
exports.default = Banner;
//# sourceMappingURL=Banner.model.js.map