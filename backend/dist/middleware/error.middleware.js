"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multer_1 = __importDefault(require("multer"));
const errorMiddleware = (error, _req, res, _next) => {
    console.error(error);
    if (error instanceof
        multer_1.default.MulterError) {
        return res
            .status(400)
            .json({
            success: false,
            message: error.message,
        });
    }
    if (error.message.includes("Only JPG") ||
        error.message.includes("Only MP4") ||
        error.message.includes("Invalid banner upload field")) {
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
        message: error.message ||
            "Internal server error",
    });
};
exports.default = errorMiddleware;
//# sourceMappingURL=error.middleware.js.map