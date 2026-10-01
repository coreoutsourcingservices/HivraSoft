import {
  getCategoryBanner,
} from "@/lib/banner";

type CategoryTopBannerProps = {
  categorySlug: string;
};

/* =========================================================
   CATEGORY TOP BANNER
========================================================= */

export default async function CategoryTopBanner({
  categorySlug,
}: CategoryTopBannerProps) {
  const banner =
    await getCategoryBanner(
      categorySlug
    );

  if (
    !banner?.imageUrl
  ) {
    return null;
  }

  return (
    <section
      className="
        relative
        w-full
        overflow-hidden
        bg-[#F4F2F1]
      "
    >
      <div
        className="
          relative
          w-full
          aspect-[16/7]

          sm:aspect-[16/6]

          md:aspect-[16/5]

          lg:aspect-[1920/520]
        "
      >
        <img
          src={
            banner.imageUrl
          }
          alt={
            banner.imageAlt
          }
          className="
            absolute
            inset-0
            h-full
            w-full
            object-cover
            object-center
          "
        />
      </div>
    </section>
  );
}