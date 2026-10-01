/* =========================================================
   API
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

/* =========================================================
   EXISTING HOME BANNER SECTIONS
========================================================= */

export const BANNER_SECTIONS = [
  {
    label: "Banner",
    value: "home_hero",
  },
  {
    label: "Favourites for a limited time!",
    value: "home_middle",
  },
  {
    label: "Find your fit.",
    value: "home_bottom",
  },
] as const;

export type BannerPosition =
  (typeof BANNER_SECTIONS)[number]["value"];

export const getBannerSectionLabel = (
  position: string
) => {
  return (
    BANNER_SECTIONS.find(
      (section) =>
        section.value === position
    )?.label || position
  );
};

/* =========================================================
   TYPES
========================================================= */

type CategoryData = {
  _id?: string;
  id?: string;
  name?: string;
  slug?: string;
};

type BannerImage = {
  url?: string;
  secure_url?: string;
  alt?: string;
};

type BannerData = {
  _id?: string;
  id?: string;

  title?: string;
  subtitle?: string;
  description?: string;

  slug?: string;

  mediaType?: string;

  images?: Array<
    BannerImage | string
  >;

  image?:
    | BannerImage
    | string;

  imageAlts?: string[];

  linkType?: string;

  category?:
    | string
    | CategoryData
    | null;

  sortOrder?: number;

  isActive?: boolean;
};

/* =========================================================
   NORMALIZE
========================================================= */

function normalize(
  value?: string
) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-");
}

/* =========================================================
   IMAGE URL
========================================================= */

function getImageUrl(
  value?:
    | BannerImage
    | string
) {
  if (!value) {
    return "";
  }

  if (
    typeof value === "string"
  ) {
    return value;
  }

  return (
    value.url ||
    value.secure_url ||
    ""
  );
}

/* =========================================================
   EXTRACT BANNERS
========================================================= */

function extractBanners(
  result: unknown
): BannerData[] {
  if (
    Array.isArray(result)
  ) {
    return result as BannerData[];
  }

  if (
    !result ||
    typeof result !== "object"
  ) {
    return [];
  }

  const data =
    result as Record<
      string,
      unknown
    >;

  if (
    Array.isArray(
      data.banners
    )
  ) {
    return data.banners as BannerData[];
  }

  if (
    Array.isArray(
      data.data
    )
  ) {
    return data.data as BannerData[];
  }

  if (
    data.data &&
    typeof data.data === "object"
  ) {
    const nested =
      data.data as Record<
        string,
        unknown
      >;

    if (
      Array.isArray(
        nested.banners
      )
    ) {
      return nested.banners as BannerData[];
    }
  }

  return [];
}

/* =========================================================
   GET CATEGORY BY SLUG
========================================================= */

async function getCategoryBySlug(
  slug: string
): Promise<CategoryData | null> {
  try {
    const response =
      await fetch(
        `${API_URL}/api/categories/slug/${encodeURIComponent(
          slug
        )}`,
        {
          cache: "no-store",
        }
      );

    if (!response.ok) {
      console.error(
        "Category fetch failed:",
        response.status
      );

      return null;
    }

    const result =
      await response.json();

    return (
      result?.category ??
      result?.data ??
      result ??
      null
    );
  } catch (error) {
    console.error(
      "Category fetch error:",
      error
    );

    return null;
  }
}

/* =========================================================
   GET ACTIVE BANNERS
========================================================= */

async function getActiveBanners(): Promise<
  BannerData[]
> {
  try {
    const response =
      await fetch(
        `${API_URL}/api/banners/active`,
        {
          cache: "no-store",
        }
      );

    if (!response.ok) {
      console.error(
        "Banner fetch failed:",
        response.status
      );

      return [];
    }

    const result =
      await response.json();

    return extractBanners(
      result
    );
  } catch (error) {
    console.error(
      "Banner fetch error:",
      error
    );

    return [];
  }
}

/* =========================================================
   CATEGORY MATCH
========================================================= */

function matchesCategory(
  banner: BannerData,
  category: CategoryData,
  requestedSlug: string
) {
  const linkedCategory =
    banner.category;

  if (!linkedCategory) {
    return false;
  }

  const categoryId =
    String(
      category._id ||
        category.id ||
        ""
    );

  const categorySlug =
    normalize(
      category.slug ||
        requestedSlug
    );

  const categoryName =
    normalize(
      category.name
    );

  /* =======================================================
     CATEGORY DIRECT ID
  ======================================================= */

  if (
    typeof linkedCategory ===
    "string"
  ) {
    return (
      linkedCategory ===
      categoryId
    );
  }

  /* =======================================================
     POPULATED CATEGORY OBJECT
  ======================================================= */

  const linkedId =
    String(
      linkedCategory._id ||
        linkedCategory.id ||
        ""
    );

  const linkedSlug =
    normalize(
      linkedCategory.slug
    );

  const linkedName =
    normalize(
      linkedCategory.name
    );

  return (
    (
      categoryId &&
      linkedId === categoryId
    ) ||
    (
      categorySlug &&
      linkedSlug ===
        categorySlug
    ) ||
    (
      categoryName &&
      linkedName ===
        categoryName
    )
  );
}

/* =========================================================
   GET CATEGORY BANNER
========================================================= */

export async function getCategoryBanner(
  categorySlug: string
) {
  try {
    const [
      category,
      banners,
    ] =
      await Promise.all([
        getCategoryBySlug(
          categorySlug
        ),

        getActiveBanners(),
      ]);

    console.log(
      "CATEGORY FOR BANNER:",
      category
    );

    console.log(
      "ACTIVE BANNERS:",
      banners
    );

    if (!category) {
      return null;
    }

    const matchingBanners =
      banners
        .filter(
          (banner) =>
            banner.isActive !==
            false
        )
        .filter(
          (banner) =>
            matchesCategory(
              banner,
              category,
              categorySlug
            )
        )
        .sort(
          (a, b) =>
            Number(
              a.sortOrder || 0
            ) -
            Number(
              b.sortOrder || 0
            )
        );

    console.log(
      "MATCHED CATEGORY BANNERS:",
      matchingBanners
    );

    const banner =
      matchingBanners[0];

    if (!banner) {
      return null;
    }

    const firstImage =
      Array.isArray(
        banner.images
      )
        ? banner.images[0]
        : banner.image;

    const imageUrl =
      getImageUrl(
        firstImage
      );

    console.log(
      "FINAL BANNER IMAGE:",
      imageUrl
    );

    if (!imageUrl) {
      return null;
    }

    const imageAlt =
      typeof firstImage ===
        "object" &&
      firstImage?.alt
        ? firstImage.alt
        : banner.imageAlts?.[0] ||
          banner.title ||
          category.name ||
          "Category Banner";

    return {
      ...banner,

      imageUrl,

      imageAlt,
    };
  } catch (error) {
    console.error(
      "getCategoryBanner error:",
      error
    );

    return null;
  }
}