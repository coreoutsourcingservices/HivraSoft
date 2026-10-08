import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  cancelMyOrderController,
  createOrderController,
  createRazorpayOrderController,
  downloadMyInvoiceController,
  getMyOrderController,
  getMyOrdersController,
  markRazorpayOrderFailedController,
  previewDeliveryChargeController,
  verifyRazorpayOrderController,
} from "../controllers/order.controller";

const router = Router();
router.use(authenticate);

router.get("/", getMyOrdersController);
router.post("/", createOrderController);
router.post("/razorpay/create", createRazorpayOrderController);
router.post("/razorpay/verify", verifyRazorpayOrderController);
router.post("/razorpay/failed", markRazorpayOrderFailedController);
router.post("/delivery-charge/preview", previewDeliveryChargeController);
router.get("/:id/invoice", downloadMyInvoiceController);
router.get("/:id", getMyOrderController);
router.patch("/:id/cancel", cancelMyOrderController);
router.post("/:id/cancel", cancelMyOrderController);

export default router;
