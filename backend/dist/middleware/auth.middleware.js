"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = exports.protect = void 0;
const User_model_1 = __importDefault(require("../models/User.model"));
const jwt_1 = require("../utils/jwt");
const authenticate = async (req, res, next) => {
    try {
        const authorization = String(req.headers.authorization || "");
        const bearerToken = authorization.toLowerCase().startsWith("bearer ") ? authorization.slice(7).trim() : "";
        const token = req.cookies?.accessToken || bearerToken;
        if (!token) {
            res.status(401).json({
                success: false,
                message: "Not authenticated",
            });
            return;
        }
        const decoded = (0, jwt_1.verifyToken)(token);
        if (!decoded?.id) {
            res.status(401).json({
                success: false,
                message: "Invalid session",
            });
            return;
        }
        const user = await User_model_1.default.findById(decoded.id);
        if (!user) {
            res.status(401).json({
                success: false,
                message: "User not found",
            });
            return;
        }
        if (!user.isActive) {
            res.status(403).json({
                success: false,
                message: "Account is disabled",
            });
            return;
        }
        req.user = user;
        if (user.role === "customer") {
            const last = user.lastActiveAt ? new Date(user.lastActiveAt).getTime() : 0;
            if (!last || Date.now() - last > 5 * 60 * 1000) {
                void User_model_1.default.updateOne({ _id: user._id }, { $set: { lastActiveAt: new Date() } }).catch(() => undefined);
            }
        }
        next();
    }
    catch (error) {
        console.error("AUTH ERROR:", error);
        res.status(401).json({
            success: false,
            message: "Invalid or expired session",
        });
        return;
    }
};
exports.authenticate = authenticate;
exports.protect = authenticate;
exports.default = authenticate;
//# sourceMappingURL=auth.middleware.js.map