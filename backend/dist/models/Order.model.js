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
const statusHistorySchema = new mongoose_1.Schema({
    status: { type: String, required: true, trim: true },
    message: { type: String, trim: true, default: "" },
    at: { type: Date, default: Date.now },
    by: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", default: null },
}, { _id: false });
const orderSchema = new mongoose_1.Schema({
    orderNumber: { type: String, required: true, unique: true, index: true },
    invoiceNumber: { type: String, unique: true, sparse: true, index: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    customer: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    items: { type: [mongoose_1.Schema.Types.Mixed], default: [] },
    subtotal: { type: Number, required: true, min: 0 },
    offerDiscount: { type: Number, default: 0, min: 0 },
    offerDiscountDetails: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    automaticDiscount: { type: Number, default: 0, min: 0 },
    automaticDiscountDetails: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    codeDiscount: { type: Number, default: 0, min: 0 },
    codeDiscountDetails: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    discount: { type: Number, default: 0, min: 0 },
    discountCode: { type: String, uppercase: true, trim: true, default: "" },
    tax: { type: Number, default: 0, min: 0 },
    taxName: { type: String, trim: true, default: "GST" },
    taxPercentage: { type: Number, default: 0, min: 0, max: 100 },
    taxDetails: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    shipping: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    status: {
        type: String,
        enum: [
            "pending",
            "pending_payment",
            "confirmed",
            "processing",
            "shipped",
            "out_for_delivery",
            "delivered",
            "cancelled",
            "canceled",
            "returned",
            "refunded",
        ],
        default: "confirmed",
        index: true,
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending",
        index: true,
    },
    paymentMethod: { type: String, trim: true, lowercase: true, default: "cod", index: true },
    payment: {
        type: mongoose_1.Schema.Types.Mixed,
        default: () => ({
            gateway: "cod",
            razorpayOrderId: "",
            razorpayPaymentId: "",
            transactionId: "",
            amount: 0,
            currency: "INR",
            paidAt: null,
        }),
    },
    shippingAddress: { type: mongoose_1.Schema.Types.Mixed, required: true },
    statusHistory: { type: [statusHistorySchema], default: [] },
    inventoryCommitted: { type: Boolean, default: false, index: true },
    fulfillmentState: {
        type: String,
        enum: ["pending", "processing", "done", "failed", "cancelled"],
        default: "pending",
        index: true,
    },
    cancelledAt: { type: Date, default: null },
    cancellationReason: { type: String, trim: true, default: "" },
}, { timestamps: true, versionKey: false });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ "payment.razorpayOrderId": 1 }, { sparse: true });
orderSchema.index({ "customer.email": 1, createdAt: -1 });
orderSchema.index({ "customer.phone": 1, createdAt: -1 });
const Order = mongoose_1.default.models.Order || mongoose_1.default.model("Order", orderSchema);
exports.default = Order;
//# sourceMappingURL=Order.model.js.map