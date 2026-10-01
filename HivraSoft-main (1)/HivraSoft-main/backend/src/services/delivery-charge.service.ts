import DeliveryChargeRule, { type DeliveryPaymentMethod } from "../models/DeliveryChargeRule.model";

const roundMoney = (value: number) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

export function normalizeDeliveryPaymentMethod(value: unknown): DeliveryPaymentMethod {
  const method = String(value || "").trim().toLowerCase();
  if (method === "cod" || method === "cash_on_delivery" || method === "cash-on-delivery") {
    return "cod";
  }
  if (["online", "razorpay", "upi", "card", "netbanking", "wallet"].includes(method)) {
    return "online";
  }
  throw new Error("Payment method must be COD or online.");
}

export async function calculateDeliveryCharge(baseAmount: number, paymentMethod: unknown) {
  const normalizedMethod = normalizeDeliveryPaymentMethod(paymentMethod);
  const amount = roundMoney(Math.max(0, Number(baseAmount || 0)));

  const rule = await DeliveryChargeRule.findOne({
    paymentMethod: normalizedMethod,
    isActive: true,
    isDeleted: { $ne: true },
    minAmount: { $lte: amount },
    $or: [{ maxAmount: null }, { maxAmount: { $gte: amount } }],
  })
    .sort({ minAmount: -1, maxAmount: 1, updatedAt: -1 })
    .lean();

  const charge = rule ? roundMoney(Math.max(0, Number(rule.charge || 0))) : 0;

  return {
    paymentMethod: normalizedMethod,
    baseAmount: amount,
    charge,
    matched: Boolean(rule),
    rule: rule
      ? {
          id: String(rule._id),
          minAmount: Number(rule.minAmount || 0),
          maxAmount: rule.maxAmount === null || rule.maxAmount === undefined ? null : Number(rule.maxAmount),
          charge,
          isActive: rule.isActive === true,
        }
      : null,
  };
}
