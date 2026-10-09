import Offer from "../models/Offer.model";
import Product from "../models/Product.model";
import Category from "../models/Category.model";

export type OfferDiscountLine = {
  lineId?: string;
  productId: string;
  unitPrice: number;
  quantity: number;
};

const roundMoney = (value: number) =>
  Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

function isEligible(
  offer: any,
  line: OfferDiscountLine,
  productLineage: Map<string, Set<string>>
) {
  if (offer?.appliesToAllProducts) return true;

  const productId = String(line.productId || "");
  const offerProducts = new Set<string>((offer?.productIds || []).map((id: any) => String(id)));
  if (offerProducts.has(productId)) return true;

  const selectedCategories = new Set<string>((offer?.categoryIds || []).map((id: any) => String(id)));
  if (!selectedCategories.size) return false;

  const lineage = productLineage.get(productId) || new Set<string>();
  for (const categoryId of selectedCategories) {
    if (lineage.has(categoryId)) return true;
  }
  return false;
}

function buyGetAllocation(offer: any, lines: OfferDiscountLine[], eligibleIndexes: number[]) {
  const allocations = lines.map(() => 0);
  const buyQuantity = Math.max(1, Number(offer?.buyQuantity || 1));
  const getQuantity = Math.max(1, Number(offer?.getQuantity || 1));
  const groupSize = buyQuantity + getQuantity;
  const totalQuantity = eligibleIndexes.reduce(
    (sum, index) => sum + Math.max(0, Number(lines[index]?.quantity || 0)),
    0
  );
  let discountedUnits = Math.floor(totalQuantity / groupSize) * getQuantity;
  const getPrice = Math.max(0, Number(offer?.getPrice ?? 0));
  if (discountedUnits <= 0) return allocations;

  const cheapestFirst = eligibleIndexes
    .map((index) => ({ index, unitPrice: Math.max(0, Number(lines[index]?.unitPrice || 0)) }))
    .sort((a, b) => a.unitPrice - b.unitPrice || a.index - b.index);

  for (const item of cheapestFirst) {
    if (discountedUnits <= 0) break;
    const quantity = Math.max(0, Number(lines[item.index]?.quantity || 0));
    const unitsHere = Math.min(quantity, discountedUnits);
    // Never raise the original item's price if it already costs less than Get price.
    allocations[item.index] = roundMoney(unitsHere * Math.max(0, item.unitPrice - getPrice));
    discountedUnits -= unitsHere;
  }

  return allocations;
}

function fixedBundleAllocation(offer: any, lines: OfferDiscountLine[], eligibleIndexes: number[]) {
  const allocations = lines.map(() => 0);
  const buyQuantity = Math.max(1, Number(offer?.buyQuantity || 1));
  const totalQuantity = eligibleIndexes.reduce(
    (sum, index) => sum + Math.max(0, Number(lines[index]?.quantity || 0)),
    0
  );
  if (totalQuantity < buyQuantity) return allocations;

  const fixedPrice = Math.max(0, Number(offer?.fixedPrice || 0));
  eligibleIndexes.forEach((index) => {
    const quantity = Math.max(0, Number(lines[index]?.quantity || 0));
    const unitPrice = Math.max(0, Number(lines[index]?.unitPrice || 0));
    allocations[index] = roundMoney(Math.max(0, unitPrice - fixedPrice) * quantity);
  });
  return allocations;
}

export async function calculateOfferDiscounts(lines: OfferDiscountLine[]) {
  const zeroItems = lines.map((line) => ({
    lineId: line.lineId || "",
    productId: String(line.productId || ""),
    offerDiscount: 0,
    offerId: null as string | null,
    offerName: "",
    offerType: null as "buy_get" | "fixed_price_bundle" | null,
  }));

  if (!lines.length) {
    return { amount: 0, itemOffers: zeroItems, appliedOffers: [] as any[] };
  }

  const offers = await Offer.find({ isDeleted: { $ne: true }, isActive: true })
    .sort({ updatedAt: -1, createdAt: -1 })
    .lean();
  if (!offers.length) {
    return { amount: 0, itemOffers: zeroItems, appliedOffers: [] as any[] };
  }

  const productIds = Array.from(new Set(lines.map((line) => String(line.productId || "")).filter(Boolean)));
  const products = await Product.find({ _id: { $in: productIds } }).select("categories").lean();

  const productCategoryIds = Array.from(
    new Set(
      products.flatMap((product: any) =>
        (Array.isArray(product?.categories) ? product.categories : []).map((id: any) => String(id))
      )
    )
  );

  const categories = productCategoryIds.length
    ? await Category.find({ _id: { $in: productCategoryIds } }).select("_id ancestors").lean()
    : [];
  const categoryMap = new Map(categories.map((category: any) => [String(category._id), category]));

  const productLineage = new Map<string, Set<string>>();
  products.forEach((product: any) => {
    const set = new Set<string>();
    (Array.isArray(product?.categories) ? product.categories : []).forEach((categoryId: any) => {
      const id = String(categoryId);
      set.add(id);
      const category = categoryMap.get(id) as any;
      (Array.isArray(category?.ancestors) ? category.ancestors : []).forEach((ancestor: any) => set.add(String(ancestor)));
    });
    productLineage.set(String(product._id), set);
  });

  const best = zeroItems.map((item) => ({ ...item }));

  for (const offer of offers as any[]) {
    const eligibleIndexes = lines
      .map((line, index) => (isEligible(offer, line, productLineage) ? index : -1))
      .filter((index) => index >= 0);
    if (!eligibleIndexes.length) continue;

    const allocations = offer.offerType === "buy_get"
      ? buyGetAllocation(offer, lines, eligibleIndexes)
      : fixedBundleAllocation(offer, lines, eligibleIndexes);

    allocations.forEach((amount, index) => {
      const value = roundMoney(Math.max(0, amount));
      if (value <= best[index].offerDiscount) return;
      best[index] = {
        lineId: lines[index].lineId || "",
        productId: String(lines[index].productId || ""),
        offerDiscount: value,
        offerId: String(offer._id),
        offerName: String(offer.name || "Offer"),
        offerType: offer.offerType,
      };
    });
  }

  const appliedMap = new Map<string, any>();
  best.forEach((item) => {
    if (!item.offerId || item.offerDiscount <= 0) return;
    const current = appliedMap.get(item.offerId) || {
      offerId: item.offerId,
      name: item.offerName,
      offerType: item.offerType,
      amount: 0,
    };
    current.amount = roundMoney(current.amount + item.offerDiscount);
    appliedMap.set(item.offerId, current);
  });

  const amount = roundMoney(best.reduce((sum, item) => sum + item.offerDiscount, 0));
  return {
    amount,
    itemOffers: best,
    appliedOffers: Array.from(appliedMap.values()),
  };
}
