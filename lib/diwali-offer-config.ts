// Edit here to change or turn off the seasonal storefront campaign.
// Slab amounts, dates and product scope come from active DIWALI* admin codes.
export const DIWALI_OFFER_CONFIG = {
  enabled: true,
  codePattern: /^DIWALI\d*$/i,
  title: "Diwali Gold Coin Offer",
  badge: "DIWALI SPECIAL",
  prize: "1 gold coin",
  shopHref: "/new-innerwear-online",
  celebrationDurationMs: 5_000,
  homepageCelebrationDurationMs: 5_000,
  homepageFadeOutDurationMs: 2_000,
  homepageCoinCount: 114,
  homepageBurstCount: 36,
  coinCount: 64,
  confettiCount: 36,
  refreshIntervalMs: 60_000,
} as const;
