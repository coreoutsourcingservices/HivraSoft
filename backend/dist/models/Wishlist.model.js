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
   WISHLIST ITEM SCHEMA
========================================================= */
const wishlistItemSchema = new mongoose_1.Schema({
    product: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    colorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        default: null,
    },
    sizeId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    _id: true,
});
/* =========================================================
   WISHLIST SCHEMA
========================================================= */
const wishlistSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
        index: true,
    },
    items: {
        type: [wishlistItemSchema],
        default: [],
    },
}, {
    timestamps: true,
});
/* =========================================================
   PREVENT EXACT DUPLICATE PRODUCT/VARIANT ITEMS
========================================================= */
wishlistSchema.pre("validate", function () {
    const seen = new Set();
    this.items = this.items.filter((item) => {
        const key = [
            String(item.product),
            String(item.colorId || ""),
            String(item.sizeId || ""),
        ].join(":");
        if (seen.has(key))
            return false;
        seen.add(key);
        return true;
    });
});
wishlistSchema.index({ "items.product": 1 });
wishlistSchema.index({ "items.addedAt": 1 });
const Wishlist = mongoose_1.default.models.Wishlist ||
    mongoose_1.default.model("Wishlist", wishlistSchema);
exports.default = Wishlist;
//# sourceMappingURL=Wishlist.model.js.map