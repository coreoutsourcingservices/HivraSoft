"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAccountInfo = exports.getAccountInfo = exports.logout = exports.getMe = exports.loginVerifyOtp = exports.loginSendOtp = exports.registerVerifyOtp = exports.registerSendOtp = void 0;
const auth_service_1 = require("../services/auth.service");
const User_model_1 = __importDefault(require("../models/User.model"));
const activity_service_1 = require("../services/activity.service");
const ONE_YEAR_MS = 365 *
    24 *
    60 *
    60 *
    1000;
/* =========================================================
   AUTH COOKIE
========================================================= */
const setAuthCookie = (res, token) => {
    const isProduction = process.env.NODE_ENV ===
        "production";
    res.cookie("accessToken", token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction
            ? "none"
            : "lax",
        maxAge: ONE_YEAR_MS,
        path: "/",
    });
};
/* =========================================================
   REGISTER - SEND OTP
========================================================= */
const registerSendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email ||
            typeof email !==
                "string") {
            return res
                .status(400)
                .json({
                success: false,
                message: "Email is required.",
            });
        }
        const result = await (0, auth_service_1.sendRegisterOtp)(email);
        return res
            .status(200)
            .json({
            success: true,
            ...result,
        });
    }
    catch (error) {
        return res
            .status(400)
            .json({
            success: false,
            message: error instanceof
                Error
                ? error.message
                : "Something went wrong.",
        });
    }
};
exports.registerSendOtp = registerSendOtp;
/* =========================================================
   REGISTER - VERIFY OTP
========================================================= */
const registerVerifyOtp = async (req, res) => {
    try {
        const { name, email, phone, otp, } = req.body;
        if (!name ||
            !email ||
            !phone ||
            !otp) {
            return res
                .status(400)
                .json({
                success: false,
                message: "Name, phone, email and OTP are required.",
            });
        }
        const result = await (0, auth_service_1.verifyRegisterOtp)({
            name,
            email,
            phone,
            otp,
        });
        setAuthCookie(res, result.token);
        await Promise.all([
            (0, activity_service_1.trackUserActivity)({ userId: String(result.user._id), type: "register" }),
            result.user.updateOne({ $set: { lastActiveAt: new Date(), accountStatus: "active", isActive: true } }),
        ]);
        return res
            .status(201)
            .json({
            success: true,
            message: "Account created successfully.",
            user: {
                id: String(result.user._id),
                name: result.user.name,
                email: result.user.email,
                phone: result.user.phone,
                role: result.user.role,
            },
        });
    }
    catch (error) {
        return res
            .status(400)
            .json({
            success: false,
            message: error instanceof
                Error
                ? error.message
                : "Something went wrong.",
        });
    }
};
exports.registerVerifyOtp = registerVerifyOtp;
/* =========================================================
   LOGIN - SEND OTP
========================================================= */
const loginSendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email ||
            typeof email !==
                "string") {
            return res
                .status(400)
                .json({
                success: false,
                message: "Email is required.",
            });
        }
        const result = await (0, auth_service_1.sendLoginOtp)(email);
        return res
            .status(200)
            .json({
            success: true,
            ...result,
        });
    }
    catch (error) {
        return res
            .status(400)
            .json({
            success: false,
            message: error instanceof
                Error
                ? error.message
                : "Something went wrong.",
        });
    }
};
exports.loginSendOtp = loginSendOtp;
/* =========================================================
   LOGIN - VERIFY OTP
========================================================= */
const loginVerifyOtp = async (req, res) => {
    try {
        const { email, otp, } = req.body;
        if (!email ||
            !otp) {
            return res
                .status(400)
                .json({
                success: false,
                message: "Email and OTP are required.",
            });
        }
        const result = await (0, auth_service_1.verifyLoginOtp)({
            email,
            otp,
        });
        setAuthCookie(res, result.token);
        await Promise.all([
            (0, activity_service_1.trackUserActivity)({ userId: String(result.user._id), type: "login" }),
            result.user.updateOne({ $set: { lastActiveAt: new Date() } }),
        ]);
        return res
            .status(200)
            .json({
            success: true,
            message: "Login successful.",
            user: {
                id: String(result.user._id),
                name: result.user.name,
                email: result.user.email,
                phone: result.user.phone,
                role: result.user.role,
            },
        });
    }
    catch (error) {
        return res
            .status(400)
            .json({
            success: false,
            message: error instanceof
                Error
                ? error.message
                : "Something went wrong.",
        });
    }
};
exports.loginVerifyOtp = loginVerifyOtp;
/* =========================================================
   GET CURRENT USER
========================================================= */
const getMe = async (req, res) => {
    try {
        if (!req.user) {
            return res
                .status(401)
                .json({
                success: false,
                message: "Not authenticated",
            });
        }
        return res
            .status(200)
            .json({
            success: true,
            user: {
                id: String(req.user._id),
                name: req.user.name,
                email: req.user.email,
                phone: req.user.phone,
                gender: req.user.gender || "other",
                role: req.user.role,
            },
        });
    }
    catch (error) {
        return res
            .status(500)
            .json({
            success: false,
            message: error instanceof
                Error
                ? error.message
                : "Unable to load user.",
        });
    }
};
exports.getMe = getMe;
/* =========================================================
   LOGOUT
========================================================= */
const logout = async (req, res) => {
    const isProduction = process.env.NODE_ENV ===
        "production";
    res.clearCookie("accessToken", {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction
            ? "none"
            : "lax",
        path: "/",
    });
    return res
        .status(200)
        .json({
        success: true,
        message: "Logout successful.",
    });
};
exports.logout = logout;
const getAccountInfo = async (req, res) => {
    try {
        /* =====================================================
           AUTH CHECK
        ===================================================== */
        if (!req.user?._id) {
            return res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
        }
        /* =====================================================
           GET CURRENT USER
        ===================================================== */
        const user = await User_model_1.default.findById(req.user._id)
            .select("name email phone gender birthday anniversary avatar createdAt")
            .lean();
        /* =====================================================
           USER NOT FOUND
        ===================================================== */
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }
        /* =====================================================
           SUCCESS RESPONSE
        ===================================================== */
        return res.status(200).json({
            success: true,
            message: "Account information fetched successfully.",
            account: {
                id: String(user._id),
                name: user.name,
                email: user.email,
                phone: user.phone,
                gender: user.gender || "other",
                birthday: user.birthday || null,
                anniversary: user.anniversary || null,
                avatar: {
                    url: user.avatar?.url ||
                        "",
                    publicId: user.avatar?.publicId ||
                        "",
                },
                memberSince: user.createdAt,
            },
        });
    }
    catch (error) {
        console.error("GET ACCOUNT INFO ERROR:", error);
        return res.status(500).json({
            success: false,
            message: "Unable to fetch account information.",
        });
    }
};
exports.getAccountInfo = getAccountInfo;
/* =========================================================
   UPDATE ACCOUNT INFO

   PATCH /api/user/account

   User can update:
   ├── name
   └── phone

   Email ko direct update nahi karenge.
   Email change ke liye OTP verification alag hona chahiye.
========================================================= */
const updateAccountInfo = async (req, res) => {
    try {
        if (!req.user?._id) {
            return res.status(401).json({ success: false, message: "Authentication required." });
        }
        const { name, phone, gender, birthday, anniversary } = req.body || {};
        if (name === undefined && phone === undefined && gender === undefined && birthday === undefined && anniversary === undefined) {
            return res.status(400).json({ success: false, message: "Name, phone, gender, birthday or anniversary is required." });
        }
        const updateData = {};
        if (name !== undefined) {
            if (typeof name !== "string" || name.trim().length < 2)
                return res.status(400).json({ success: false, message: "Name must be at least 2 characters." });
            updateData.name = name.trim();
        }
        if (phone !== undefined) {
            if (typeof phone !== "string" || phone.trim().length < 7)
                return res.status(400).json({ success: false, message: "Please enter a valid phone number." });
            updateData.phone = phone.trim();
        }
        if (gender !== undefined) {
            const normalized = String(gender).trim().toLowerCase();
            if (!["male", "female", "other"].includes(normalized))
                return res.status(400).json({ success: false, message: "Gender must be male, female or other." });
            updateData.gender = normalized;
        }
        for (const [field, value] of [["birthday", birthday], ["anniversary", anniversary]]) {
            if (value !== undefined) {
                if (value === null || String(value).trim() === "") {
                    updateData[field] = null;
                }
                else {
                    const parsed = new Date(String(value));
                    if (Number.isNaN(parsed.getTime()))
                        return res.status(400).json({ success: false, message: `Invalid ${field} date.` });
                    updateData[field] = parsed;
                }
            }
        }
        const user = await User_model_1.default.findByIdAndUpdate(req.user._id, { $set: updateData }, { new: true, runValidators: true })
            .select("name email phone gender birthday anniversary role avatar createdAt updatedAt")
            .lean();
        if (!user)
            return res.status(404).json({ success: false, message: "User not found." });
        return res.status(200).json({ success: true, message: "Account updated successfully.", account: { ...user, id: String(user._id), gender: user.gender || "other" } });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error instanceof Error ? error.message : "Unable to update account." });
    }
};
exports.updateAccountInfo = updateAccountInfo;
//# sourceMappingURL=auth.controller.js.map