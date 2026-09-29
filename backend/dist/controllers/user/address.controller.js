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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDefaultAddress = exports.deleteAddress = exports.updateAddress = exports.getAddressById = exports.getAllAddresses = exports.createAddress = exports.protect = void 0;
const jsonwebtoken_1 = __importStar(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const address_model_1 = __importDefault(require("../../models/user/address.model"));
const User_model_1 = __importDefault(require("../../models/User.model"));
/* =========================================================
   CONSTANTS
========================================================= */
const ADDRESS_TYPES = [
    "home",
    "work",
    "other",
];
/* =========================================================
   HELPERS
========================================================= */
/**
 * Logged-in user id
 */
function getUserId(req) {
    const userId = req.user?._id?.toString();
    return userId || null;
}
/**
 * Valid address type
 */
function isValidAddressType(value) {
    return (typeof value === "string" &&
        ADDRESS_TYPES.includes(value));
}
/**
 * Optional string cleaner
 */
function cleanString(value) {
    if (typeof value !== "string") {
        return "";
    }
    return value.trim();
}
/* =========================================================
   PROTECT
========================================================= */
/**
 * Authentication middleware
 *
 * Supports:
 * 1. Cookie: token
 * 2. Authorization: Bearer TOKEN
 */
const protect = async (req, res, next) => {
    try {
        let token;
        /* =====================================================
           COOKIE TOKEN
        ===================================================== */
        if (typeof req.cookies?.token ===
            "string" &&
            req.cookies.token) {
            token = req.cookies.token;
        }
        /* =====================================================
           BEARER TOKEN
        ===================================================== */
        if (!token) {
            const authorization = req.headers.authorization;
            if (authorization &&
                authorization.startsWith("Bearer ")) {
                token =
                    authorization
                        .slice(7)
                        .trim();
            }
        }
        /* =====================================================
           TOKEN NOT FOUND
        ===================================================== */
        if (!token) {
            return res
                .status(401)
                .json({
                success: false,
                message: "Unauthorized. Please login.",
            });
        }
        /* =====================================================
           JWT SECRET
        ===================================================== */
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            console.error("JWT_SECRET is missing.");
            return res
                .status(500)
                .json({
                success: false,
                message: "Server configuration error.",
            });
        }
        /* =====================================================
           VERIFY TOKEN
        ===================================================== */
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        if (typeof decoded !== "object" ||
            decoded === null) {
            return res
                .status(401)
                .json({
                success: false,
                message: "Invalid authentication token.",
            });
        }
        const payload = decoded;
        const userId = payload.id ||
            payload.userId ||
            payload._id;
        if (!userId) {
            return res
                .status(401)
                .json({
                success: false,
                message: "Invalid authentication token.",
            });
        }
        /* =====================================================
           VALID MONGODB ID
        ===================================================== */
        if (!mongoose_1.default.isValidObjectId(userId)) {
            return res
                .status(401)
                .json({
                success: false,
                message: "Invalid authentication token.",
            });
        }
        /* =====================================================
           CHECK USER EXISTS
        ===================================================== */
        const user = await User_model_1.default.findById(userId);
        if (!user) {
            return res
                .status(401)
                .json({
                success: false,
                message: "User account not found.",
            });
        }
        /* =====================================================
           ATTACH USER
        ===================================================== */
        req.user = user;
        next();
    }
    catch (error) {
        console.error("PROTECT ERROR:", error);
        if (error instanceof
            jsonwebtoken_1.TokenExpiredError) {
            return res
                .status(401)
                .json({
                success: false,
                message: "Session expired. Please login again.",
            });
        }
        if (error instanceof
            jsonwebtoken_1.JsonWebTokenError) {
            return res
                .status(401)
                .json({
                success: false,
                message: "Invalid authentication token.",
            });
        }
        return res
            .status(500)
            .json({
            success: false,
            message: "Authentication failed.",
        });
    }
};
exports.protect = protect;
/* =========================================================
   CREATE ADDRESS
   POST /api/addresses
========================================================= */
const createAddress = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res
                .status(401)
                .json({
                success: false,
                message: "Unauthorized. Please login.",
            });
        }
        const { fullName, phone, alternatePhone, homeNumber, officeNumber, addressLine1, addressLine2, landmark, city, district, state, postalCode, country, countryCode, addressType, isDefault, isShippingAddress, isBillingAddress, instructions, } = req.body;
        /* =====================================================
           REQUIRED FIELDS
        ===================================================== */
        if (typeof fullName !==
            "string" ||
            !fullName.trim()) {
            return res
                .status(400)
                .json({
                success: false,
                message: "Full name is required.",
            });
        }
        if (typeof phone !==
            "string" ||
            !phone.trim()) {
            return res
                .status(400)
                .json({
                success: false,
                message: "Phone number is required.",
            });
        }
        if (typeof addressLine1 !==
            "string" ||
            !addressLine1.trim()) {
            return res
                .status(400)
                .json({
                success: false,
                message: "Address line 1 is required.",
            });
        }
        if (typeof city !==
            "string" ||
            !city.trim()) {
            return res
                .status(400)
                .json({
                success: false,
                message: "City is required.",
            });
        }
        if (typeof state !==
            "string" ||
            !state.trim()) {
            return res
                .status(400)
                .json({
                success: false,
                message: "State is required.",
            });
        }
        if (typeof postalCode !==
            "string" ||
            !postalCode.trim()) {
            return res
                .status(400)
                .json({
                success: false,
                message: "Postal code is required.",
            });
        }
        /* =====================================================
           ADDRESS TYPE
        ===================================================== */
        if (addressType !==
            undefined &&
            !isValidAddressType(addressType)) {
            return res
                .status(400)
                .json({
                success: false,
                message: "Address type must be home, work or other.",
            });
        }
        /* =====================================================
           BOOLEAN VALIDATION
        ===================================================== */
        if (isDefault !== undefined &&
            typeof isDefault !==
                "boolean") {
            return res
                .status(400)
                .json({
                success: false,
                message: "isDefault must be boolean.",
            });
        }
        if (isShippingAddress !==
            undefined &&
            typeof isShippingAddress !==
                "boolean") {
            return res
                .status(400)
                .json({
                success: false,
                message: "isShippingAddress must be boolean.",
            });
        }
        if (isBillingAddress !==
            undefined &&
            typeof isBillingAddress !==
                "boolean") {
            return res
                .status(400)
                .json({
                success: false,
                message: "isBillingAddress must be boolean.",
            });
        }
        /* =====================================================
           FIRST ADDRESS = DEFAULT
        ===================================================== */
        const addressCount = await address_model_1.default.countDocuments({
            user: userId,
        });
        const shouldBeDefault = addressCount === 0 ||
            isDefault === true;
        /* =====================================================
           REMOVE OLD DEFAULT
        ===================================================== */
        if (shouldBeDefault) {
            await address_model_1.default.updateMany({
                user: userId,
                isDefault: true,
            }, {
                $set: {
                    isDefault: false,
                },
            });
        }
        /* =====================================================
           CREATE
        ===================================================== */
        const address = await address_model_1.default.create({
            user: userId,
            fullName: fullName.trim(),
            phone: phone.trim(),
            alternatePhone: cleanString(alternatePhone),
            homeNumber: cleanString(homeNumber),
            officeNumber: cleanString(officeNumber),
            addressLine1: addressLine1.trim(),
            addressLine2: cleanString(addressLine2),
            landmark: cleanString(landmark),
            city: city.trim(),
            district: cleanString(district),
            state: state.trim(),
            postalCode: postalCode.trim(),
            country: cleanString(country) ||
                "India",
            countryCode: (cleanString(countryCode) || "IN").toUpperCase(),
            addressType: addressType || "home",
            isDefault: shouldBeDefault,
            isShippingAddress: typeof isShippingAddress ===
                "boolean"
                ? isShippingAddress
                : true,
            isBillingAddress: typeof isBillingAddress ===
                "boolean"
                ? isBillingAddress
                : true,
            instructions: cleanString(instructions),
        });
        return res
            .status(201)
            .json({
            success: true,
            message: "Address added successfully.",
            address,
        });
    }
    catch (error) {
        console.error("CREATE ADDRESS ERROR:", error);
        if (error instanceof
            mongoose_1.default.Error.ValidationError) {
            return res
                .status(400)
                .json({
                success: false,
                message: error.message,
            });
        }
        return res
            .status(500)
            .json({
            success: false,
            message: "Unable to add address.",
        });
    }
};
exports.createAddress = createAddress;
/* =========================================================
   GET ALL ADDRESSES
   GET /api/addresses
========================================================= */
const getAllAddresses = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res
                .status(401)
                .json({
                success: false,
                message: "Unauthorized. Please login.",
            });
        }
        const addresses = await address_model_1.default.find({
            user: userId,
        }).sort({
            isDefault: -1,
            createdAt: -1,
        });
        return res
            .status(200)
            .json({
            success: true,
            message: "Addresses fetched successfully.",
            count: addresses.length,
            addresses,
        });
    }
    catch (error) {
        console.error("GET ALL ADDRESSES ERROR:", error);
        return res
            .status(500)
            .json({
            success: false,
            message: "Unable to fetch addresses.",
        });
    }
};
exports.getAllAddresses = getAllAddresses;
/* =========================================================
   GET ONE ADDRESS
   GET /api/addresses/:addressId
========================================================= */
const getAddressById = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res
                .status(401)
                .json({
                success: false,
                message: "Unauthorized. Please login.",
            });
        }
        const { addressId } = req.params;
        /* ===================================================
           VALID ADDRESS ID
        =================================================== */
        if (!mongoose_1.default.isValidObjectId(addressId)) {
            return res
                .status(400)
                .json({
                success: false,
                message: "Invalid address id.",
            });
        }
        /* ===================================================
           OWNERSHIP CHECK
        =================================================== */
        const address = await address_model_1.default.findOne({
            _id: addressId,
            user: userId,
        });
        if (!address) {
            return res
                .status(404)
                .json({
                success: false,
                message: "Address not found.",
            });
        }
        return res
            .status(200)
            .json({
            success: true,
            message: "Address fetched successfully.",
            address,
        });
    }
    catch (error) {
        console.error("GET ADDRESS ERROR:", error);
        return res
            .status(500)
            .json({
            success: false,
            message: "Unable to fetch address.",
        });
    }
};
exports.getAddressById = getAddressById;
/* =========================================================
   UPDATE ADDRESS
   PUT /api/addresses/:addressId
========================================================= */
const updateAddress = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res
                .status(401)
                .json({
                success: false,
                message: "Unauthorized. Please login.",
            });
        }
        const { addressId } = req.params;
        if (!mongoose_1.default.isValidObjectId(addressId)) {
            return res
                .status(400)
                .json({
                success: false,
                message: "Invalid address id.",
            });
        }
        /* ===================================================
           FIND USER ADDRESS
        =================================================== */
        const address = await address_model_1.default.findOne({
            _id: addressId,
            user: userId,
        });
        if (!address) {
            return res
                .status(404)
                .json({
                success: false,
                message: "Address not found.",
            });
        }
        const { fullName, phone, alternatePhone, homeNumber, officeNumber, addressLine1, addressLine2, landmark, city, district, state, postalCode, country, countryCode, addressType, isDefault, isShippingAddress, isBillingAddress, instructions, } = req.body;
        /* ===================================================
           REQUIRED STRING FIELDS
        =================================================== */
        if (fullName !== undefined) {
            if (typeof fullName !==
                "string" ||
                !fullName.trim()) {
                return res
                    .status(400)
                    .json({
                    success: false,
                    message: "Full name cannot be empty.",
                });
            }
            address.fullName =
                fullName.trim();
        }
        if (phone !== undefined) {
            if (typeof phone !==
                "string" ||
                !phone.trim()) {
                return res
                    .status(400)
                    .json({
                    success: false,
                    message: "Phone cannot be empty.",
                });
            }
            address.phone =
                phone.trim();
        }
        if (addressLine1 !==
            undefined) {
            if (typeof addressLine1 !==
                "string" ||
                !addressLine1.trim()) {
                return res
                    .status(400)
                    .json({
                    success: false,
                    message: "Address line 1 cannot be empty.",
                });
            }
            address.addressLine1 =
                addressLine1.trim();
        }
        if (city !== undefined) {
            if (typeof city !==
                "string" ||
                !city.trim()) {
                return res
                    .status(400)
                    .json({
                    success: false,
                    message: "City cannot be empty.",
                });
            }
            address.city =
                city.trim();
        }
        if (state !== undefined) {
            if (typeof state !==
                "string" ||
                !state.trim()) {
                return res
                    .status(400)
                    .json({
                    success: false,
                    message: "State cannot be empty.",
                });
            }
            address.state =
                state.trim();
        }
        if (postalCode !== undefined) {
            if (typeof postalCode !==
                "string" ||
                !postalCode.trim()) {
                return res
                    .status(400)
                    .json({
                    success: false,
                    message: "Postal code cannot be empty.",
                });
            }
            address.postalCode =
                postalCode.trim();
        }
        /* ===================================================
           OPTIONAL STRINGS
        =================================================== */
        if (alternatePhone !==
            undefined) {
            address.alternatePhone =
                cleanString(alternatePhone);
        }
        if (homeNumber !==
            undefined) {
            address.homeNumber =
                cleanString(homeNumber);
        }
        if (officeNumber !==
            undefined) {
            address.officeNumber =
                cleanString(officeNumber);
        }
        if (addressLine2 !==
            undefined) {
            address.addressLine2 =
                cleanString(addressLine2);
        }
        if (landmark !== undefined) {
            address.landmark =
                cleanString(landmark);
        }
        if (district !== undefined) {
            address.district =
                cleanString(district);
        }
        if (country !== undefined) {
            if (typeof country !==
                "string" ||
                !country.trim()) {
                return res
                    .status(400)
                    .json({
                    success: false,
                    message: "Country cannot be empty.",
                });
            }
            address.country =
                country.trim();
        }
        if (countryCode !== undefined) {
            if (typeof countryCode !==
                "string" ||
                !countryCode.trim()) {
                return res
                    .status(400)
                    .json({
                    success: false,
                    message: "Country code cannot be empty.",
                });
            }
            address.countryCode =
                countryCode
                    .trim()
                    .toUpperCase();
        }
        if (instructions !==
            undefined) {
            address.instructions =
                cleanString(instructions);
        }
        /* ===================================================
           ADDRESS TYPE
        =================================================== */
        if (addressType !== undefined) {
            if (!isValidAddressType(addressType)) {
                return res
                    .status(400)
                    .json({
                    success: false,
                    message: "Address type must be home, work or other.",
                });
            }
            address.addressType =
                addressType;
        }
        /* ===================================================
           SHIPPING
        =================================================== */
        if (isShippingAddress !==
            undefined) {
            if (typeof isShippingAddress !==
                "boolean") {
                return res
                    .status(400)
                    .json({
                    success: false,
                    message: "isShippingAddress must be boolean.",
                });
            }
            address.isShippingAddress =
                isShippingAddress;
        }
        /* ===================================================
           BILLING
        =================================================== */
        if (isBillingAddress !==
            undefined) {
            if (typeof isBillingAddress !==
                "boolean") {
                return res
                    .status(400)
                    .json({
                    success: false,
                    message: "isBillingAddress must be boolean.",
                });
            }
            address.isBillingAddress =
                isBillingAddress;
        }
        /* ===================================================
           DEFAULT ADDRESS
        =================================================== */
        /* ===================================================
           SAVE
        =================================================== */
        await address.save();
        return res
            .status(200)
            .json({
            success: true,
            message: "Address updated successfully.",
            address,
        });
    }
    catch (error) {
        console.error("UPDATE ADDRESS ERROR:", error);
        if (error instanceof
            mongoose_1.default.Error.ValidationError) {
            return res
                .status(400)
                .json({
                success: false,
                message: error.message,
            });
        }
        return res
            .status(500)
            .json({
            success: false,
            message: "Unable to update address.",
        });
    }
};
exports.updateAddress = updateAddress;
/* =========================================================
   DELETE ADDRESS
   DELETE /api/addresses/:addressId
========================================================= */
const deleteAddress = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res
                .status(401)
                .json({
                success: false,
                message: "Unauthorized. Please login.",
            });
        }
        const { addressId } = req.params;
        if (!mongoose_1.default.isValidObjectId(addressId)) {
            return res
                .status(400)
                .json({
                success: false,
                message: "Invalid address id.",
            });
        }
        /* ===================================================
           FIND
        =================================================== */
        const address = await address_model_1.default.findOne({
            _id: addressId,
            user: userId,
        });
        if (!address) {
            return res
                .status(404)
                .json({
                success: false,
                message: "Address not found.",
            });
        }
        const wasDefault = address.isDefault;
        /* ===================================================
           DELETE
        =================================================== */
        await address.deleteOne();
        /* ===================================================
           IF DEFAULT DELETED,
           MAKE ANOTHER DEFAULT
        =================================================== */
        if (wasDefault) {
            const nextAddress = await address_model_1.default.findOne({
                user: userId,
            }).sort({
                createdAt: -1,
            });
            if (nextAddress) {
                nextAddress.isDefault =
                    true;
                await nextAddress.save();
            }
        }
        return res
            .status(200)
            .json({
            success: true,
            message: "Address deleted successfully.",
        });
    }
    catch (error) {
        console.error("DELETE ADDRESS ERROR:", error);
        return res
            .status(500)
            .json({
            success: false,
            message: "Unable to delete address.",
        });
    }
};
exports.deleteAddress = deleteAddress;
/* =========================================================
   SET DEFAULT ADDRESS
   PATCH /api/addresses/:addressId/default
========================================================= */
const setDefaultAddress = async (req, res) => {
    try {
        const userId = getUserId(req);
        if (!userId) {
            return res
                .status(401)
                .json({
                success: false,
                message: "Unauthorized. Please login.",
            });
        }
        const { addressId } = req.params;
        if (!mongoose_1.default.isValidObjectId(addressId)) {
            return res
                .status(400)
                .json({
                success: false,
                message: "Invalid address id.",
            });
        }
        /* ===================================================
           ADDRESS MUST BELONG TO USER
        =================================================== */
        const address = await address_model_1.default.findOne({
            _id: addressId,
            user: userId,
        });
        if (!address) {
            return res
                .status(404)
                .json({
                success: false,
                message: "Address not found.",
            });
        }
        /* ===================================================
           ALREADY DEFAULT
        =================================================== */
        if (address.isDefault) {
            return res
                .status(200)
                .json({
                success: true,
                message: "This address is already the default address.",
                address,
            });
        }
        /* ===================================================
           REMOVE DEFAULT FROM OTHER ADDRESSES
        =================================================== */
        await address_model_1.default.updateMany({
            user: userId,
            _id: {
                $ne: addressId,
            },
        }, {
            $set: {
                isDefault: false,
            },
        });
        /* ===================================================
           SET NEW DEFAULT
        =================================================== */
        address.isDefault = true;
        await address.save();
        return res
            .status(200)
            .json({
            success: true,
            message: "Default address updated successfully.",
            address,
        });
    }
    catch (error) {
        console.error("SET DEFAULT ADDRESS ERROR:", error);
        return res
            .status(500)
            .json({
            success: false,
            message: "Unable to set default address.",
        });
    }
};
exports.setDefaultAddress = setDefaultAddress;
//# sourceMappingURL=address.controller.js.map