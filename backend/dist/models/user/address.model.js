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
   SCHEMA
========================================================= */
const addressSchema = new mongoose_1.Schema({
    /* ===============================================
       USER
    =============================================== */
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    /* ===============================================
       CUSTOMER
    =============================================== */
    fullName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        maxlength: 20,
    },
    alternatePhone: {
        type: String,
        trim: true,
        default: "",
        maxlength: 20,
    },
    /* ===============================================
       HOME / OFFICE NUMBER
    =============================================== */
    homeNumber: {
        type: String,
        trim: true,
        default: "",
        maxlength: 80,
    },
    officeNumber: {
        type: String,
        trim: true,
        default: "",
        maxlength: 80,
    },
    /* ===============================================
       ADDRESS
    =============================================== */
    addressLine1: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },
    addressLine2: {
        type: String,
        trim: true,
        default: "",
        maxlength: 200,
    },
    landmark: {
        type: String,
        trim: true,
        default: "",
        maxlength: 150,
    },
    city: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
    district: {
        type: String,
        trim: true,
        default: "",
        maxlength: 100,
    },
    state: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },
    postalCode: {
        type: String,
        required: true,
        trim: true,
        maxlength: 20,
    },
    country: {
        type: String,
        required: true,
        trim: true,
        default: "India",
        maxlength: 100,
    },
    countryCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        default: "IN",
        maxlength: 2,
    },
    /* ===============================================
       ADDRESS TYPE
    =============================================== */
    addressType: {
        type: String,
        enum: [
            "home",
            "work",
            "other",
        ],
        default: "home",
    },
    /* ===============================================
       DEFAULT ADDRESS
    =============================================== */
    isDefault: {
        type: Boolean,
        default: false,
    },
    /* ===============================================
       SHIPPING / BILLING
    =============================================== */
    isShippingAddress: {
        type: Boolean,
        default: true,
    },
    isBillingAddress: {
        type: Boolean,
        default: true,
    },
    /* ===============================================
       DELIVERY INSTRUCTIONS
    =============================================== */
    instructions: {
        type: String,
        trim: true,
        default: "",
        maxlength: 300,
    },
}, {
    timestamps: true,
    versionKey: false,
});
/* =========================================================
   INDEXES
========================================================= */
/*
  User ke addresses ko newest first
  fetch karne ke liye.
*/
addressSchema.index({
    user: 1,
    createdAt: -1,
});
/*
  User ke default address ko quickly
  find karne ke liye.
*/
addressSchema.index({
    user: 1,
    isDefault: 1,
});
/* =========================================================
   JSON OUTPUT TRANSFORM
========================================================= */
addressSchema.set("toJSON", {
    transform: (_doc, ret) => {
        /*
          MongoDB:
  
          _id: ObjectId(...)
          user: ObjectId(...)
  
          API:
  
          id: "..."
          userId: "..."
        */
        ret.id =
            ret._id?.toString();
        ret.userId =
            ret.user?.toString();
        delete ret._id;
        delete ret.user;
        return ret;
    },
});
/* =========================================================
   MODEL
========================================================= */
const Address = mongoose_1.default.models.Address ||
    mongoose_1.default.model("Address", addressSchema);
exports.default = Address;
//# sourceMappingURL=address.model.js.map