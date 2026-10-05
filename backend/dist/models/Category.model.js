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
   IMAGE SCHEMA
========================================================= */
const categoryImageSchema = new mongoose_1.Schema({
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
        required: true,
        trim: true,
        maxlength: 160,
    },
}, {
    _id: false,
});
/* =========================================================
   CATEGORY SCHEMA
========================================================= */
const categorySchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    description: {
        type: String,
        default: "",
        trim: true,
    },
    /*
      null = root category

      Women
      └── Bra
          └── Sports Bra
    */
    parent: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Category",
        default: null,
        index: true,
    },
    /*
      Sports Bra example:
      [
        Women._id,
        Bra._id
      ]
    */
    ancestors: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "Category",
        },
    ],
    level: {
        type: Number,
        default: 0,
        min: 0,
        index: true,
    },
    /*
      All root / sub / sub-sub categories
      use the SAME images[] field.

      [
        {
          url: "https://res.cloudinary.com/...",
          publicId:
            "hivrasoft/category-images/women/bra/front-view",
          alt: "Front View"
        }
      ]
    */
    images: {
        type: [
            categoryImageSchema,
        ],
        default: [],
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true,
    },
    sortOrder: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});
/* =========================================================
   INDEXES
========================================================= */
categorySchema.index({
    parent: 1,
    sortOrder: 1,
});
categorySchema.index({
    ancestors: 1,
});
categorySchema.index({
    level: 1,
    sortOrder: 1,
    name: 1,
});
(0, softDelete_1.applySoftDeletePlugin)(categorySchema);
/* =========================================================
   MODEL
========================================================= */
const Category = mongoose_1.default.models.Category ||
    mongoose_1.default.model("Category", categorySchema);
exports.default = Category;
//# sourceMappingURL=Category.model.js.map