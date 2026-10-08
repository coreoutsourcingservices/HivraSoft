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

  const requiredQuantity =
    Math.max(
      1,
      Number(
        offer.buyQuantity ||
          1
      )
    );

  const bundlePrice =
    Math.max(
      0,
      Number(
        offer.fixedPrice ||
          0
      )
    );

  const perItemPrice =
    requiredQuantity > 0
      ? bundlePrice /
        requiredQuantity
      : 0;

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
          items-center
          justify-center
          gap-1.5
          text-center

          sm:flex-row
          sm:gap-3
        "
      >
        <strong
          className="
            text-[12px]
            font-bold
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
          Add{" "}
          {requiredQuantity}{" "}
          eligible products to unlock
          the offer
        </span>

        {bundlePrice > 0 ? (
          <span
            className="
              text-[10px]
              font-semibold
              text-[#211A18]
            "
          >
            ₹
            {bundlePrice.toLocaleString(
              "en-IN",
              {
                maximumFractionDigits:
                  2,
              }
            )}{" "}
            total

            {perItemPrice > 0
              ? ` • ₹${perItemPrice.toLocaleString(
                  "en-IN",
                  {
                    maximumFractionDigits:
                      2,
                  }
                )} each`
              : ""}
          </span>
        ) : null}
      </div>
    </section>
  );
}