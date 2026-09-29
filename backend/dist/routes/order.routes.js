"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const order_controller_1 = require("../controllers/order.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.get("/", order_controller_1.getMyOrdersController);
router.post("/", order_controller_1.createOrderController);
router.post("/razorpay/create", order_controller_1.createRazorpayOrderController);
router.post("/razorpay/verify", order_controller_1.verifyRazorpayOrderController);
router.post("/delivery-charge/preview", order_controller_1.previewDeliveryChargeController);
router.get("/:id/invoice", order_controller_1.downloadMyInvoiceController);
router.get("/:id", order_controller_1.getMyOrderController);
router.patch("/:id/cancel", order_controller_1.cancelMyOrderController);
router.post("/:id/cancel", order_controller_1.cancelMyOrderController);
exports.default = router;
//# sourceMappingURL=order.routes.js.map