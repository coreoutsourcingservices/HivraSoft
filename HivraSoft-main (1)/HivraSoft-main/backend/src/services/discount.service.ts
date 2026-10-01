import DiscountSetting from "../models/DiscountSetting.model";
import DiscountCode from "../models/DiscountCode.model";

export type DiscountableLine = {
  productId: string;
  unitPrice: number;
  quantity: number;
};

const roundMoney = (value: number) =>
  Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

function allocateFixedDiscount(target: number, bases: number[]) {
  const result = bases.map(() => 0);
  const eligibleIndexes = bases
    .map((base, index) => ({ base: roundMoney(Math.max(0, base)), index }))
    .filter((item) => item.base > 0);

  const totalBase = roundMoney(eligibleIndexes.reduce((sum, item) => sum + item.base, 0));
  const requested = roundMoney(Math.max(0, target));
  const totalDiscount = Math.min(requested, totalBase);
  if (totalDiscount <= 0 || totalBase <= 0) return result;

  let remaining = totalDiscount;
  eligibleIndexes.forEach((item, position) => {
    const isLast = position === eligibleIndexes.length - 1;
    const share = isLast
      ? remaining
      : Math.min(item.base, roundMoney((totalDiscount * item.base) / totalBase));
    const applied = Math.min(item.base, roundMoney(Math.max(0, share)));
    result[item.index] = applied;
    remaining = roundMoney(Math.max(0, remaining - applied));
  });

  if (remaining > 0) {
    for (let index = eligibleIndexes.length - 1; index >= 0 && remaining > 0; index -= 1) {
      const item = eligibleIndexes[index];
      const room = roundMoney(Math.max(0, item.base - result[item.index]));
      const extra = Math.min(room, remaining);
      result[item.index] = roundMoney(result[item.index] + extra);
      remaining = roundMoney(remaining - extra);
    }
  }

  return result;
}

export async function calculateDiscounts(lines: DiscountableLine[], code?: string | null) {
  const now = new Date();
  const baseAmount = roundMoney(
    lines.reduce(
      (sum, line) =>
        sum +
        Math.max(0, Number(line.unitPrice || 0)) * Math.max(0, Number(line.quantity || 0)),
      0
    )
  );

  const normalizedCode = String(code || "").trim().toUpperCase();

  const [auto, coupon] = await Promise.all([
    DiscountSetting.findOne({
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
      .lean(),
    normalizedCode
      ? DiscountCode.findOne({
          code: normalizedCode,
          isDeleted: { $ne: true },
          isActive: true,
        }).lean()
      : Promise.resolve(null),
  ]);

  const autoValueType = auto?.valueType === "fixed" ? "fixed" : "percentage";
  const autoPercentage = autoValueType === "percentage" ? Math.max(0, Number(auto?.percentage || 0)) : 0;
  const autoFixedAmount = autoValueType === "fixed" ? Math.max(0, Number(auto?.fixedAmount || 0)) : 0;
  const autoExcluded = new Set((auto?.excludedProducts || []).map((id: any) => String(id)));

  const lineBases = lines.map((line) =>
    roundMoney(Math.max(0, Number(line.unitPrice || 0)) * Math.max(0, Number(line.quantity || 0)))
  );
  const autoEligibleBases = lineBases.map((base, index) =>
    auto && !autoExcluded.has(String(lines[index]?.productId || "")) ? base : 0
  );
  const autoFixedAllocations =
    auto && autoValueType === "fixed"
      ? allocateFixedDiscount(autoFixedAmount, autoEligibleBases)
      : lineBases.map(() => 0);

  const couponValidDate = Boolean(
    coupon &&
      (!coupon.startsAt || new Date(coupon.startsAt) <= now) &&
      (!coupon.endsAt || new Date(coupon.endsAt) >= now)
  );
  const couponMinAmount = Math.max(0, Number(coupon?.minAmount || 0));
  const couponMaxAmount =
    coupon?.maxAmount === null || coupon?.maxAmount === undefined
      ? null
      : Math.max(0, Number(coupon.maxAmount));
  const couponRangeEligible = Boolean(
    coupon &&
      baseAmount >= couponMinAmount &&
      (couponMaxAmount === null || baseAmount <= couponMaxAmount)
  );
  const couponCanApply = Boolean(coupon && couponValidDate && couponRangeEligible);
  const couponValueType = coupon?.valueType === "fixed" ? "fixed" : "percentage";
  const couponPercentage =
    couponCanApply && couponValueType === "percentage"
      ? Math.max(0, Number(coupon?.percentage || 0))
      : 0;
  const couponFixedAmount =
    couponCanApply && couponValueType === "fixed"
      ? Math.max(0, Number(coupon?.fixedAmount || 0))
      : 0;
  const couponProducts = new Set((coupon?.productIds || []).map((id: any) => String(id)));

  const afterAutoBases = lineBases.map((base, index) => {
    const automaticEligible = Boolean(auto && autoEligibleBases[index] > 0);
    const autoAmount =
      automaticEligible && autoValueType === "percentage"
        ? roundMoney(base * (autoPercentage / 100))
        : autoFixedAllocations[index] || 0;
    return roundMoney(Math.max(0, base - autoAmount));
  });

  const couponEligibleBases = afterAutoBases.map((base, index) => {
    if (!couponCanApply || !coupon) return 0;
    const productId = String(lines[index]?.productId || "");
    return coupon.appliesToAllProducts || couponProducts.has(productId) ? base : 0;
  });
  const couponFixedAllocations =
    couponCanApply && couponValueType === "fixed"
      ? allocateFixedDiscount(couponFixedAmount, couponEligibleBases)
      : lineBases.map(() => 0);

  let automaticDiscount = 0;
  let codeDiscount = 0;

  const itemDiscounts = lines.map((line, index) => {
    const base = lineBases[index];
    const automaticEligible = Boolean(auto && autoEligibleBases[index] > 0);
    const autoAmount = automaticEligible
      ? autoValueType === "fixed"
        ? roundMoney(autoFixedAllocations[index] || 0)
        : roundMoney(base * (autoPercentage / 100))
      : 0;
    const afterAuto = roundMoney(Math.max(0, base - autoAmount));

    const codeEligible = Boolean(couponCanApply && couponEligibleBases[index] > 0);
    const codeAmount = codeEligible
      ? couponValueType === "fixed"
        ? roundMoney(couponFixedAllocations[index] || 0)
        : roundMoney(afterAuto * (couponPercentage / 100))
      : 0;

    automaticDiscount += autoAmount;
    codeDiscount += codeAmount;

    return {
      productId: line.productId,
      automaticValueType: autoValueType,
      automaticPercentage: automaticEligible && autoValueType === "percentage" ? autoPercentage : 0,
      automaticDiscount: autoAmount,
      codeValueType: couponValueType,
      codePercentage: codeEligible && couponValueType === "percentage" ? couponPercentage : 0,
      codeDiscount: codeAmount,
      totalDiscount: roundMoney(autoAmount + codeAmount),
      finalLineTotal: roundMoney(Math.max(0, base - autoAmount - codeAmount)),
    };
  });

  automaticDiscount = roundMoney(automaticDiscount);
  codeDiscount = roundMoney(codeDiscount);

  const autoMinAmount = Math.max(0, Number(auto?.minAmount || 0));
  const autoMaxAmount =
    auto?.maxAmount === null || auto?.maxAmount === undefined
      ? null
      : Math.max(0, Number(auto.maxAmount));

  return {
    automatic: {
      active: Boolean(auto),
      matched: Boolean(auto),
      ruleId: auto?._id ? String(auto._id) : null,
      name: auto?.name || "Automatic Discount",
      valueType: autoValueType,
      percentage: autoValueType === "percentage" ? autoPercentage : 0,
      fixedAmount: autoValueType === "fixed" ? autoFixedAmount : 0,
      minAmount: autoMinAmount,
      maxAmount: autoMaxAmount,
      baseAmount,
      amount: automaticDiscount,
    },
    code: normalizedCode
      ? {
          code: normalizedCode,
          valid: Boolean(coupon && couponCanApply),
          ruleId: coupon?._id ? String(coupon._id) : null,
          valueType: couponValueType,
          percentage: couponValueType === "percentage" ? couponPercentage : 0,
          fixedAmount: couponValueType === "fixed" ? couponFixedAmount : 0,
          minAmount: couponMinAmount,
          maxAmount: couponMaxAmount,
          rangeEligible: couponRangeEligible,
          amount: codeDiscount,
          message: !coupon
            ? "Discount code not found."
            : !couponValidDate
              ? "Discount code is not active for this date."
              : !couponRangeEligible
                ? "Cart subtotal is outside this discount code price range."
                : codeDiscount <= 0
                  ? "This code is not valid for products in your cart."
                  : "Discount code applied.",
        }
      : null,
    itemDiscounts,
    automaticDiscount,
    codeDiscount,
    totalDiscount: roundMoney(automaticDiscount + codeDiscount),
  };
}
