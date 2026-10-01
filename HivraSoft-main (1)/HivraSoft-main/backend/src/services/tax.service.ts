import { Types } from "mongoose";
import TaxSetting from "../models/TaxSetting.model";

export type TaxableLine = {
  productId: string;
  amount: number;
};

const roundMoney = (value: number) =>
  Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

export async function calculateTax(input: number | TaxableLine[]) {
  const lines: TaxableLine[] = Array.isArray(input)
    ? input.map((line) => ({
        productId: String(line.productId || ""),
        amount: roundMoney(Math.max(0, Number(line.amount || 0))),
      }))
    : [{ productId: "", amount: roundMoney(Math.max(0, Number(input || 0))) }];

  const baseAmount = roundMoney(lines.reduce((sum, line) => sum + line.amount, 0));

  const setting = await TaxSetting.findOne({
    isDeleted: { $ne: true },
    isActive: true,
    $and: [
      { $or: [{ minAmount: { $lte: baseAmount } }, { minAmount: { $exists: false } }] },
      {
        $or: [
          { maxAmount: null },
          { maxAmount: { $exists: false } },
          { maxAmount: { $gte: baseAmount } },
        ],
      },
    ],
  })
    .sort({ minAmount: -1, updatedAt: -1 })
    .lean();

  if (!setting) {
    return {
      active: false,
      matched: false,
      ruleId: null,
      name: "GST",
      valueType: "percentage" as const,
      percentage: 0,
      fixedAmount: 0,
      minAmount: 0,
      maxAmount: null,
      baseAmount,
      taxableAmount: baseAmount,
      amount: 0,
      applyToAllProducts: true,
      excludedProducts: [] as string[],
    };
  }

  const applyToAllProducts = setting.applyToAllProducts !== false;
  const excluded = new Set(
    (applyToAllProducts ? [] : setting.excludedProducts || []).map((id: any) => String(id))
  );

  const taxableAmount = roundMoney(
    lines.reduce((sum, line) => {
      if (line.productId && excluded.has(line.productId)) return sum;
      return sum + line.amount;
    }, 0)
  );

  const valueType = setting.valueType === "fixed" ? "fixed" : "percentage";
  const percentage =
    valueType === "percentage"
      ? Math.max(0, Math.min(100, Number(setting.percentage || 0)))
      : 0;
  const fixedAmount = valueType === "fixed" ? Math.max(0, Number(setting.fixedAmount || 0)) : 0;
  const amount =
    taxableAmount <= 0
      ? 0
      : valueType === "fixed"
        ? roundMoney(fixedAmount)
        : roundMoney(taxableAmount * (percentage / 100));

  return {
    active: amount > 0,
    matched: true,
    ruleId: String(setting._id),
    name: String(setting.name || "GST"),
    valueType,
    percentage,
    fixedAmount,
    minAmount: Math.max(0, Number(setting.minAmount || 0)),
    maxAmount:
      setting.maxAmount === null || setting.maxAmount === undefined
        ? null
        : Math.max(0, Number(setting.maxAmount)),
    baseAmount,
    taxableAmount,
    amount,
    applyToAllProducts,
    excludedProducts: (applyToAllProducts ? [] : setting.excludedProducts || []).map((id: any) =>
      String(id)
    ),
  };
}

export function normalizeExcludedProductIds(value: unknown) {
  if (!Array.isArray(value)) return [] as Types.ObjectId[];
  return Array.from(
    new Set(
      value
        .map((item) => String(item || "").trim())
        .filter((id) => Types.ObjectId.isValid(id))
    )
  ).map((id) => new Types.ObjectId(id));
}
