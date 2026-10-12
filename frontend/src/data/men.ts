/* =========================================================
   MEN PRODUCT TYPE
========================================================= */

export type MenProduct = {
  id: string;

  name: string;
  slug: string;

  image1: string;
  image2: string;

  actualPrice: number;
  discountedPrice: number;

  category: string;
  subcategories: string[];

  onOffer: boolean;

  isFeatured?: boolean;
  isNewLaunch?: boolean;
};

/* =========================================================
   MEN BANNER TYPE
========================================================= */

export type MenBanner = {
  id?: string;

  title?: string;
  subtitle?: string;

  image: string;

  alt?: string;

  redirect?: string;
  href?: string;

  buttonText?: string;
};

/* =========================================================
   MENU TYPES
========================================================= */

export type MenMenuChild = {
  name: string;
  slug: string;
  href: string;
};

export type MenMenuItem = {
  name: string;
  slug: string;
  href: string;

  children: MenMenuChild[];
};

/* =========================================================
   MEN MENU

   Screenshot ke according menu structure.
========================================================= */

export const menMenu: MenMenuItem[] = [
  {
    name: "Underwear",
    slug: "underwear",
    href: "/men/underwear",

    children: [
      {
        name: "Trunks",
        slug: "trunks",
        href: "/men/underwear/trunks",
      },

      {
        name: "Briefs",
        slug: "briefs",
        href: "/men/underwear/briefs",
      },

      {
        name: "Men Thongs",
        slug: "men-thongs",
        href: "/men/underwear/men-thongs",
      },

      {
        name: "G-Strings",
        slug: "g-strings",
        href: "/men/underwear/g-strings",
      },
    ],
  },

  {
    name: "Trunks",
    slug: "trunks",
    href: "/men/trunks",

    children: [],
  },

  {
    name: "Briefs",
    slug: "briefs",
    href: "/men/briefs",

    children: [],
  },

  {
    name: "Men Thongs",
    slug: "men-thongs",
    href: "/men/men-thongs",

    children: [],
  },

  {
    name: "G-Strings",
    slug: "g-strings",
    href: "/men/g-strings",

    children: [],
  },

  {
    name: "Men Offers",
    slug: "offers",
    href: "/men/offers",

    children: [],
  },
];

/* =========================================================
   GET MENU ITEM
========================================================= */

export function getMenMenuItem(
  category?: string
): MenMenuItem | undefined {
  if (!category) {
    return undefined;
  }

  return menMenu.find(
    (item) =>
      item.slug === category
  );
}

/* =========================================================
   TITLE CASE
========================================================= */

function titleCase(
  value?: string
): string {
  if (!value) {
    return "";
  }

  return value
    .split("-")
    .filter(Boolean)
    .map(
      (word) =>
        word
          .charAt(0)
          .toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

/* =========================================================
   PATH VALIDATION
========================================================= */

export function isValidMenPath(
  category?: string,
  subcategory?: string
): boolean {
  const validSlug =
    /^[a-z0-9-]+$/;

  if (
    category &&
    !validSlug.test(
      category
    )
  ) {
    return false;
  }

  if (
    subcategory &&
    !validSlug.test(
      subcategory
    )
  ) {
    return false;
  }

  if (
    category === "offers" &&
    subcategory
  ) {
    return false;
  }

  /*
   * IMPORTANT:
   *
   * Backend se future me new category
   * aa sakti hai.
   *
   * Isliye static menu ke basis par
   * 404 nahi kar rahe.
   */

  return true;
}

/* =========================================================
   PAGE TITLE
========================================================= */

export function getMenPageTitle(
  category?: string,
  subcategory?: string
): string {
  if (subcategory) {
    return titleCase(
      subcategory
    );
  }

  if (
    category === "offers"
  ) {
    return "Men's Offers";
  }

  if (category) {
    const menuItem =
      getMenMenuItem(
        category
      );

    return `Men's ${
      menuItem?.name ||
      titleCase(category)
    }`;
  }

  return "Men's Collection";
}

/* =========================================================
   PAGE DESCRIPTION
========================================================= */

export function getMenPageDescription(
  category?: string,
  subcategory?: string
): string {
  if (subcategory) {
    return `Explore our latest men's ${titleCase(
      subcategory
    ).toLowerCase()} collection.`;
  }

  if (
    category === "offers"
  ) {
    return "Explore special offers and discounted styles from our men's collection.";
  }

  if (category) {
    const menuItem =
      getMenMenuItem(
        category
      );

    const categoryName =
      menuItem?.name ||
      titleCase(
        category
      );

    return `Discover our latest men's ${categoryName.toLowerCase()} collection.`;
  }

  return "Explore our latest men's collection, styles and everyday essentials.";
}

/* =========================================================
   MEN BANNERS

   Abhi empty.
   Baad me Banner API connect karenge.
========================================================= */

export function getMenBanners(
  _category?: string,
  _subcategory?: string
): MenBanner[] {
  return [];
}