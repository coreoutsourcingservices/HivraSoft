import type {
  StorefrontOffer,
} from "@/src/services/offers";

type Props = {
  offer:
    StorefrontOffer | null;
};

export default function CategoryOfferStrip({
  offer,
}: Props) {
  if (
    !offer ||
    offer.offerType !==
      "fixed_price_bundle"
  ) {
    return null;
  }

  return (
    <section
      className="
        border-y
        border-[#B31345]/10

        bg-[#FFF1F5]

        px-4
        py-4
      "
    >
      <div
        className="
          mx-auto
          flex
          max-w-[1380px]

          flex-col

          gap-1

          text-center

          sm:flex-row
          sm:items-center
          sm:justify-center
          sm:gap-3
        "
      >
        <strong
          className="
            text-[12px]

            text-[#B31345]

            sm:text-[13px]
          "
        >
          {offer.name}
        </strong>

        <span
          className="
            text-[10px]

            text-black/55
          "
        >
          Buy{" "}
          {
            offer.buyQuantity
          }
          + eligible products @ ₹
          {Number(
            offer.fixedPrice ||
              0,
          ).toLocaleString(
            "en-IN",
          )}{" "}
          each
        </span>
      </div>
    </section>
  );
}