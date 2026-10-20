import { DIWALI_OFFER_CONFIG } from "./diwali-offer-config";

export type DiwaliCode = {
  _id: string;
  code: string;
  minAmount: number;
  maxAmount: number | null;
  appliesToAllProducts: boolean;
  productIds: string[];
  startsAt: string | null;
  endsAt: string | null;
};

export function isDiwaliCode(code: string) {
  return DIWALI_OFFER_CONFIG.codePattern.test(code.trim());
}

export function getRegularCouponCode(code: string) {
  return isDiwaliCode(code) ? "" : code.trim();
}

// Use the same pre-discount subtotal range as the existing discount API.
export function getDiwaliOffers(
  codes: DiwaliCode[],
  subtotal: number,
  productIds: string[],
  now = Date.now(),
) {
  if (!DIWALI_OFFER_CONFIG.enabled || !Number.isFinite(subtotal) || subtotal < 0) {
    return { matched: null, next: null };
  }
  const active = codes.filter((offer) =>
    isDiwaliCode(offer.code) &&
    Number.isFinite(offer.minAmount) && offer.minAmount >= 0 &&
    (!offer.startsAt || Date.parse(offer.startsAt) <= now) &&
    (!offer.endsAt || Date.parse(offer.endsAt) >= now) &&
    (offer.appliesToAllProducts || offer.productIds.some((id) => productIds.includes(id))),
  ).sort((a, b) => b.minAmount - a.minAmount || a.code.localeCompare(b.code));
  const matched = active.find((offer) =>
    subtotal >= offer.minAmount && (offer.maxAmount === null || subtotal <= offer.maxAmount),
  ) ?? null;
  const next = [...active].reverse().find((offer) => offer.minAmount > subtotal) ?? null;
  return { matched, next };
}

export function getDiwaliProgress(codes: DiwaliCode[], subtotal: number, productIds: string[], now = Date.now()) {
  const { matched, next } = getDiwaliOffers(codes, subtotal, productIds, now);
  const target = matched ?? next;
  const remaining = target ? Math.max(0, Math.round((target.minAmount - subtotal) * 100) / 100) : 0;
  const percentage = target ? target.minAmount > 0 ? Math.min(100, Math.max(0, subtotal / target.minAmount * 100)) : 100 : 0;
  return { matched, next, target, remaining, percentage };
}
