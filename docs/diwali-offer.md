# Editing the Diwali offer

- `lib/diwali-offer-config.ts`: change the title, badge, prize text, Shop More destination, celebration duration and particle counts. Set `enabled: false` to turn off this campaign. Celebration duration is at least five seconds; reduced motion preferences suppress animation.
- `src/components/Offers/DiwaliOffer.tsx`: shared cart / checkout / payment card and celebration popup.
- `src/components/Offers/DiwaliOffer.module.css`: gold card, coin / diya illustration, progress bar, compact checkout style and coin / confetti animations. Festival styles are isolated from global CSS.
- `src/components/Offers/HomeDiwaliCelebration.tsx` and its CSS module: separate celebration alongside the existing homepage welcome popup: five seconds of continuous rain, followed by two seconds of gradual settling. It waits until the popup image is loaded, the tab is visible and the root loader has disappeared, so the effect cannot finish unseen behind the loader. Coin and burst lifetimes are staggered, each fades independently and finishes before the overlay is removed. Change `homepageCelebrationDurationMs`, `homepageFadeOutDurationMs`, `homepageCoinCount` and `homepageBurstCount` in the config to tune it. Closing the popup also removes its celebration.
- `lib/diwali-offer.ts`: slab selection and product subtotal progress. GST and delivery never contribute to eligibility.

Active admin codes named DIWALI, DIWALI1, DIWALI2, DIWALI3, etc. provide each slab's minimum / maximum amounts, dates and product scope through the existing `/api/discounts/active` endpoint. Configure ₹1,499 / ₹1,999 / ₹2,499 minimums and no maximum for the three current slabs. No backend schema or API changes are required.

The highest matching slab activates automatically. Internal Diwali codes are hidden from customer-facing coupon controls and have no customer Remove action. The cart's regular coupon field stays available. A normal coupon can replace an internal Diwali code in the existing single coupon slot; the lucky draw promotion remains visible and eligible based on subtotal and online payment selection.

Each new matched slab or return to eligibility plays five seconds of coin rain, confetti and an unlock popup. Changes within the same slab do not restart the effect. COD shows the online-payment prompt. Final participation requires a successful online payment; this frontend does not choose winners or allocate physical prizes.

Validation: `node scripts/test-diwali-offer.cjs`, `node scripts/test-diwali-offer-ui.cjs`, `npm run build`.
