"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdmin = void 0;
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        return res
            .status(401)
            .json({
            success: false,
            message: "Not authenticated.",
        });
    }
    if (req.user.role !==
        "admin" &&
        req.user.role !==
            "super_admin") {
        return res
            .status(403)
            .json({
            success: false,
            message: "Admin access required.",
        });
    }
    return next();
};
exports.requireAdmin = requireAdmin;
exports.default = requireAdmin;
//# sourceMappingURL=admin.middleware.js.map