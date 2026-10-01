/* =========================================================
   HIVRA SOFT — WOMEN DATA

   YAHAN SE CONTROL HOGA:
   - Categories
   - Subcategories
   - Products
   - Prices
   - Product Images
   - Page-wise Banners
========================================================= */


/* =========================================================
   TYPES
========================================================= */

export type WomenProductSize = {
  id: string;
  label: string;
  stock: number;
  sellingPrice: number;
  actualPrice: number;
};

export type WomenProduct = {
  id?: string;
  isFeatured?: boolean;
  isNewLaunch?: boolean;
  name: string;

  image1: string;
  image2: string;

  actualPrice: number;
  discountedPrice: number;

  slug: string;

  category: string;

  subcategories: string[];

  colorId?: string;
  colorName?: string;
  sizes?: WomenProductSize[];

  onOffer?: boolean;
};


export type WomenMenuChild = {
  name: string;
  slug: string;
  href: string;
};


export type WomenMenuItem = {
  name: string;
  slug: string;
  href: string;
  children: WomenMenuChild[];
};


export type WomenBanner = {
  image: string;
  redirect: string;
  alt: string;
};


/* =========================================================
   WOMEN MENU
========================================================= */

export const womenMenu: WomenMenuItem[] = [
  {
    name: "Women Offers",
    slug: "offers",
    href: "/women/offers/",
    children: [],
  },

  {
    name: "Bra",
    slug: "bra",
    href: "/women/bra/",

    children: [
      {
        name: "Sports Bra",
        slug: "sports-bra",
        href: "/women/bra/sports-bra/",
      },

      {
        name: "Maternity Bra",
        slug: "maternity-bra",
        href: "/women/bra/maternity-bra/",
      },

      {
        name: "T-Shirt Bra",
        slug: "t-shirt-bra",
        href: "/women/bra/t-shirt-bra/",
      },

      {
        name: "Padded Bra",
        slug: "padded-bra",
        href: "/women/bra/padded-bra/",
      },

      {
        name: "Non Padded Bra",
        slug: "non-padded-bra",
        href: "/women/bra/non-padded-bra/",
      },
    ],
  },

  {
    name: "Panty",
    slug: "panty",
    href: "/women/panty/",

    children: [
      {
        name: "Seamless Panty",
        slug: "seamless-panty",
        href: "/women/panty/seamless-panty/",
      },

      {
        name: "Hipster",
        slug: "hipster",
        href: "/women/panty/hipster/",
      },

      {
        name: "Thongs",
        slug: "thongs",
        href: "/women/panty/thongs/",
      },

      {
        name: "G-String",
        slug: "g-string",
        href: "/women/panty/g-string/",
      },
    ],
  },

  {
    name: "Lingerie",
    slug: "lingerie",
    href: "/women/lingerie/",
    children: [],
  },

  {
    name: "Shop By Body Shape",
    slug: "shop-by-body-shape",
    href: "/women/shop-by-body-shape/",
    children: [],
  },
];


/* =========================================================
   PAGE-WISE BANNERS

   IMPORTANT:
   ALL BANNERS = 1600 x 558 px

   Future me sirf image URL/path change karna hai.
========================================================= */

export const womenBannerSets: Record<
  string,
  WomenBanner[]
> = {
  /* =======================================================
     /women/
  ======================================================= */

  women: [
    {
      image:
        "/images/banners/women/women-1.webp",

      redirect:
        "/women/bra/",

      alt:
        "Hivra Soft Women Collection",
    },

    {
      image:
        "/images/banners/women/women-2.webp",

      redirect:
        "/women/panty/",

      alt:
        "Hivra Soft Women Innerwear",
    },

    {
      image:
        "/images/banners/women/women-3.webp",

      redirect:
        "/new-launch/",

      alt:
        "Hivra Soft Women New Launch",
    },
  ],


  /* =======================================================
     /women/offers/
  ======================================================= */

  offers: [
    {
      image:
        "/images/banners/women/offers/offers-1.webp",

      redirect:
        "/women/offers/",

      alt:
        "Women Offers Banner 1",
    },

    {
      image:
        "/images/banners/women/offers/offers-2.webp",

      redirect:
        "/women/offers/",

      alt:
        "Women Offers Banner 2",
    },

    {
      image:
        "/images/banners/women/offers/offers-3.webp",

      redirect:
        "/women/offers/",

      alt:
        "Women Offers Banner 3",
    },
  ],


  /* =======================================================
     /women/bra/
  ======================================================= */

  bra: [
    {
      image:
        "/images/banners/women/bra/bra-1.webp",

      redirect:
        "/women/bra/sports-bra/",

      alt:
        "Bra Collection Banner 1",
    },

    {
      image:
        "/images/banners/women/bra/bra-2.webp",

      redirect:
        "/women/bra/maternity-bra/",

      alt:
        "Bra Collection Banner 2",
    },

    {
      image:
        "/images/banners/women/bra/bra-3.webp",

      redirect:
        "/women/bra/non-padded-bra/",

      alt:
        "Bra Collection Banner 3",
    },
  ],


  /* =======================================================
     SPORTS BRA
  ======================================================= */

  "bra/sports-bra": [
    {
      image:
        "/images/banners/women/sports-bra/sports-bra-1.webp",

      redirect:
        "/women/bra/sports-bra/",

      alt:
        "Sports Bra Banner 1",
    },

    {
      image:
        "/images/banners/women/sports-bra/sports-bra-2.webp",

      redirect:
        "/women/bra/sports-bra/",

      alt:
        "Sports Bra Banner 2",
    },

    {
      image:
        "/images/banners/women/sports-bra/sports-bra-3.webp",

      redirect:
        "/women/bra/sports-bra/",

      alt:
        "Sports Bra Banner 3",
    },
  ],


  /* =======================================================
     MATERNITY BRA
  ======================================================= */

  "bra/maternity-bra": [
    {
      image:
        "/images/banners/women/maternity-bra/maternity-bra-1.webp",

      redirect:
        "/women/bra/maternity-bra/",

      alt:
        "Maternity Bra Banner 1",
    },

    {
      image:
        "/images/banners/women/maternity-bra/maternity-bra-2.webp",

      redirect:
        "/women/bra/maternity-bra/",

      alt:
        "Maternity Bra Banner 2",
    },

    {
      image:
        "/images/banners/women/maternity-bra/maternity-bra-3.webp",

      redirect:
        "/women/bra/maternity-bra/",

      alt:
        "Maternity Bra Banner 3",
    },
  ],


  /* =======================================================
     T-SHIRT BRA
  ======================================================= */

  "bra/t-shirt-bra": [
    {
      image:
        "/images/banners/women/t-shirt-bra/t-shirt-bra-1.webp",

      redirect:
        "/women/bra/t-shirt-bra/",

      alt:
        "T Shirt Bra Banner 1",
    },

    {
      image:
        "/images/banners/women/t-shirt-bra/t-shirt-bra-2.webp",

      redirect:
        "/women/bra/t-shirt-bra/",

      alt:
        "T Shirt Bra Banner 2",
    },

    {
      image:
        "/images/banners/women/t-shirt-bra/t-shirt-bra-3.webp",

      redirect:
        "/women/bra/t-shirt-bra/",

      alt:
        "T Shirt Bra Banner 3",
    },
  ],


  /* =======================================================
     PADDED BRA
  ======================================================= */

  "bra/padded-bra": [
    {
      image:
        "/images/banners/women/padded-bra/padded-bra-1.webp",

      redirect:
        "/women/bra/padded-bra/",

      alt:
        "Padded Bra Banner 1",
    },

    {
      image:
        "/images/banners/women/padded-bra/padded-bra-2.webp",

      redirect:
        "/women/bra/padded-bra/",

      alt:
        "Padded Bra Banner 2",
    },

    {
      image:
        "/images/banners/women/padded-bra/padded-bra-3.webp",

      redirect:
        "/women/bra/padded-bra/",

      alt:
        "Padded Bra Banner 3",
    },
  ],


  /* =======================================================
     NON PADDED BRA
  ======================================================= */

  "bra/non-padded-bra": [
    {
      image:
        "/images/banners/women/non-padded-bra/non-padded-bra-1.webp",

      redirect:
        "/women/bra/non-padded-bra/",

      alt:
        "Non Padded Bra Banner 1",
    },

    {
      image:
        "/images/banners/women/non-padded-bra/non-padded-bra-2.webp",

      redirect:
        "/women/bra/non-padded-bra/",

      alt:
        "Non Padded Bra Banner 2",
    },

    {
      image:
        "/images/banners/women/non-padded-bra/non-padded-bra-3.webp",

      redirect:
        "/women/bra/non-padded-bra/",

      alt:
        "Non Padded Bra Banner 3",
    },
  ],


  /* =======================================================
     /women/panty/
  ======================================================= */

  panty: [
    {
      image:
        "/images/banners/women/panty/panty-1.webp",

      redirect:
        "/women/panty/hipster/",

      alt:
        "Panty Collection Banner 1",
    },

    {
      image:
        "/images/banners/women/panty/panty-2.webp",

      redirect:
        "/women/panty/seamless-panty/",

      alt:
        "Panty Collection Banner 2",
    },

    {
      image:
        "/images/banners/women/panty/panty-3.webp",

      redirect:
        "/women/panty/g-string/",

      alt:
        "Panty Collection Banner 3",
    },
  ],


  /* =======================================================
     SEAMLESS PANTY
  ======================================================= */

  "panty/seamless-panty": [
    {
      image:
        "/images/banners/women/seamless-panty/seamless-panty-1.webp",

      redirect:
        "/women/panty/seamless-panty/",

      alt:
        "Seamless Panty Banner 1",
    },

    {
      image:
        "/images/banners/women/seamless-panty/seamless-panty-2.webp",

      redirect:
        "/women/panty/seamless-panty/",

      alt:
        "Seamless Panty Banner 2",
    },

    {
      image:
        "/images/banners/women/seamless-panty/seamless-panty-3.webp",

      redirect:
        "/women/panty/seamless-panty/",

      alt:
        "Seamless Panty Banner 3",
    },
  ],


  /* =======================================================
     HIPSTER
  ======================================================= */

  "panty/hipster": [
    {
      image:
        "/images/banners/women/hipster/hipster-1.webp",

      redirect:
        "/women/panty/hipster/",

      alt:
        "Hipster Banner 1",
    },

    {
      image:
        "/images/banners/women/hipster/hipster-2.webp",

      redirect:
        "/women/panty/hipster/",

      alt:
        "Hipster Banner 2",
    },

    {
      image:
        "/images/banners/women/hipster/hipster-3.webp",

      redirect:
        "/women/panty/hipster/",

      alt:
        "Hipster Banner 3",
    },
  ],


  /* =======================================================
     THONGS
  ======================================================= */

  "panty/thongs": [
    {
      image:
        "/images/banners/women/thongs/thongs-1.webp",

      redirect:
        "/women/panty/thongs/",

      alt:
        "Thongs Banner 1",
    },

    {
      image:
        "/images/banners/women/thongs/thongs-2.webp",

      redirect:
        "/women/panty/thongs/",

      alt:
        "Thongs Banner 2",
    },

    {
      image:
        "/images/banners/women/thongs/thongs-3.webp",

      redirect:
        "/women/panty/thongs/",

      alt:
        "Thongs Banner 3",
    },
  ],


  /* =======================================================
     G STRING
  ======================================================= */

  "panty/g-string": [
    {
      image:
        "/images/banners/women/g-string/g-string-1.webp",

      redirect:
        "/women/panty/g-string/",

      alt:
        "G String Banner 1",
    },

    {
      image:
        "/images/banners/women/g-string/g-string-2.webp",

      redirect:
        "/women/panty/g-string/",

      alt:
        "G String Banner 2",
    },

    {
      image:
        "/images/banners/women/g-string/g-string-3.webp",

      redirect:
        "/women/panty/g-string/",

      alt:
        "G String Banner 3",
    },
  ],


  /* =======================================================
     LINGERIE
  ======================================================= */

  lingerie: [
    {
      image:
        "/images/banners/women/lingerie/lingerie-1.webp",

      redirect:
        "/women/lingerie/",

      alt:
        "Lingerie Banner 1",
    },

    {
      image:
        "/images/banners/women/lingerie/lingerie-2.webp",

      redirect:
        "/women/lingerie/",

      alt:
        "Lingerie Banner 2",
    },

    {
      image:
        "/images/banners/women/lingerie/lingerie-3.webp",

      redirect:
        "/women/lingerie/",

      alt:
        "Lingerie Banner 3",
    },
  ],


  /* =======================================================
     SHOP BY BODY SHAPE
  ======================================================= */

  "shop-by-body-shape": [
    {
      image:
        "/images/banners/women/body-shape/body-shape-1.webp",

      redirect:
        "/women/shop-by-body-shape/",

      alt:
        "Shop By Body Shape Banner 1",
    },

    {
      image:
        "/images/banners/women/body-shape/body-shape-2.webp",

      redirect:
        "/women/shop-by-body-shape/",

      alt:
        "Shop By Body Shape Banner 2",
    },

    {
      image:
        "/images/banners/women/body-shape/body-shape-3.webp",

      redirect:
        "/women/shop-by-body-shape/",

      alt:
        "Shop By Body Shape Banner 3",
    },
  ],
};


/* =========================================================
   PRODUCTS
========================================================= */

export const womenProducts: WomenProduct[] = [
  {
    name:
      "Beige Cotton Non Padded Everyday Bra",

    image1:
      "https://hivrasoft.com/wp-content/uploads/2026/02/beige-Non-paded-bra-8-Picsart-AiImageEnhancer.jpg-600x750.webp",

    image2:
      "https://hivrasoft.com/wp-content/uploads/2026/03/Black-3-Picsart-AiImageEnhancer-600x750.webp",

    actualPrice: 799,
    
    discountedPrice: 499,

    slug:
      "beige-cotton-non-padded-everyday-bra",

    category:
      "bra",

    subcategories: [
      "non-padded-bra",
    ],

    onOffer: true,
  },

  {
    name:
      "Skin Maternity Bra",

    image1:
      "https://hivrasoft.com/wp-content/uploads/2026/04/Skin-Maternity-Bra-Side-600x750.webp",

    image2:
      "https://hivrasoft.com/wp-content/uploads/2026/04/Black-Maternity-Bra-OPEN-600x750.webp",

    actualPrice: 899,

    discountedPrice: 599,

    slug:
      "skin-maternity-bra",

    category:
      "bra",

    subcategories: [
      "maternity-bra",
    ],

    onOffer: true,
  },

  {
    name:
      "Black Maternity Bra",

    image1:
      "https://hivrasoft.com/wp-content/uploads/2026/04/Black-Maternity-Bra-OPEN-600x750.webp",

    image2:
      "https://hivrasoft.com/wp-content/uploads/2026/04/Skin-Maternity-Bra-Side-600x750.webp",

    actualPrice: 899,

    discountedPrice: 599,

    slug:
      "black-maternity-bra",

    category:
      "bra",

    subcategories: [
      "maternity-bra",
    ],
  },

  {
    name:
      "Black Sports Bra",

    image1:
      "https://hivrasoft.com/wp-content/uploads/2026/04/Sports-Bra-Black-Front-600x750.webp",

    image2:
      "https://hivrasoft.com/wp-content/uploads/2026/06/BLACK1-600x750.webp",

    actualPrice: 799,

    discountedPrice: 499,

    slug:
      "black-sports-bra",

    category:
      "bra",

    subcategories: [
      "sports-bra",
    ],

    onOffer: true,
  },

  {
    name:
      "Blue Everyday Panty",

    image1:
      "https://hivrasoft.com/wp-content/uploads/2026/05/Pi7_BluePanty1-600x750.webp",

    image2:
      "https://hivrasoft.com/wp-content/uploads/2026/05/Pi7_blackprintedpanty1-600x750.webp",

    actualPrice: 399,

    discountedPrice: 249,

    slug:
      "blue-everyday-panty",

    category:
      "panty",

    subcategories: [
      "hipster",
    ],

    onOffer: true,
  },

  {
    name:
      "Black Printed Panty",

    image1:
      "https://hivrasoft.com/wp-content/uploads/2026/05/Pi7_blackprintedpanty1-600x750.webp",

    image2:
      "https://hivrasoft.com/wp-content/uploads/2026/02/Bikini-Panty-1-3-Picsart-AiImageEnhancer-600x750.webp",

    actualPrice: 499,

    discountedPrice: 299,

    slug:
      "black-printed-panty",

    category:
      "panty",

    subcategories: [
      "hipster",
    ],

    onOffer: true,
  },

  {
    name:
      "Blue G-String",

    image1:
      "https://hivrasoft.com/wp-content/uploads/2026/05/Pi7_womengstringblue3-600x750.webp",

    image2:
      "https://hivrasoft.com/wp-content/uploads/2026/02/Bikini-Panty-1-3-Picsart-AiImageEnhancer-600x750.webp",

    actualPrice: 399,

    discountedPrice: 249,

    slug:
      "blue-g-string",

    category:
      "panty",

    subcategories: [
      "g-string",
    ],
  },
];


/* =========================================================
   GET BANNERS
========================================================= */

export function getWomenBanners(
  category?: string,
  subcategory?: string
): WomenBanner[] {
  /*
   * /women/
   */

  if (!category) {
    return womenBannerSets.women ?? [];
  }


  /*
   * Exact child page
   *
   * /women/bra/sports-bra/
   */

  if (subcategory) {
    const key =
      `${category}/${subcategory}`;

    const exact =
      womenBannerSets[key];

    if (exact) {
      return exact;
    }
  }


  /*
   * Parent category fallback
   *
   * /women/bra/
   */

  const parent =
    womenBannerSets[category];

  if (parent) {
    return parent;
  }


  /*
   * Final fallback
   */

  return womenBannerSets.women ?? [];
}


/* =========================================================
   MENU HELPERS
========================================================= */

export function getWomenMenuItem(
  category?: string
) {
  if (!category) {
    return undefined;
  }

  return womenMenu.find(
    (item) =>
      item.slug === category
  );
}


export function getWomenSubmenuItem(
  category?: string,
  subcategory?: string
) {
  if (
    !category ||
    !subcategory
  ) {
    return undefined;
  }

  const parent =
    getWomenMenuItem(category);

  return parent?.children.find(
    (child) =>
      child.slug ===
      subcategory
  );
}


/* =========================================================
   VALID PATH
========================================================= */

export function isValidWomenPath(
  category?: string,
  subcategory?: string
) {
  if (!category) {
    return true;
  }

  const parent =
    getWomenMenuItem(category);

  if (!parent) {
    return false;
  }

  if (!subcategory) {
    return true;
  }

  return parent.children.some(
    (child) =>
      child.slug ===
      subcategory
  );
}


/* =========================================================
   PRODUCT FILTER
========================================================= */

export function filterWomenProducts(
  category?: string,
  subcategory?: string
): WomenProduct[] {
  /*
   * All Women
   */

  if (!category) {
    return womenProducts;
  }


  /*
   * Offers
   */

  if (
    category === "offers"
  ) {
    return womenProducts.filter(
      (product) =>
        product.onOffer === true
    );
  }


  /*
   * Parent Category
   *
   * /women/bra/
   */

  if (!subcategory) {
    return womenProducts.filter(
      (product) =>
        product.category ===
        category
    );
  }


  /*
   * Child category
   */

  return womenProducts.filter(
    (product) =>
      product.category ===
        category &&
      product.subcategories.includes(
        subcategory
      )
  );
}


/* =========================================================
   PAGE TITLE
========================================================= */

export function getWomenPageTitle(
  category?: string,
  subcategory?: string
) {
  if (!category) {
    return "Women";
  }

  if (subcategory) {
    return (
      getWomenSubmenuItem(
        category,
        subcategory
      )?.name ??
      formatSlug(subcategory)
    );
  }

  return (
    getWomenMenuItem(category)
      ?.name ??
    formatSlug(category)
  );
}


/* =========================================================
   DESCRIPTION
========================================================= */

export function getWomenPageDescription(
  category?: string,
  subcategory?: string
) {
  if (!category) {
    return (
      "Explore Hivra Soft bras, panties, lingerie and everyday innerwear designed around comfort, confidence and effortless wear."
    );
  }

  if (
    category === "bra" &&
    !subcategory
  ) {
    return (
      "Explore all Hivra Soft bras including sports bras, maternity bras, T-shirt bras, padded bras and non-padded styles."
    );
  }

  if (
    category === "panty" &&
    !subcategory
  ) {
    return (
      "Explore Hivra Soft panties including seamless styles, hipsters, thongs and G-strings."
    );
  }

  const title =
    getWomenPageTitle(
      category,
      subcategory
    );

  return `Shop Hivra Soft ${title} designed around everyday comfort, support and confidence.`;
}


/* =========================================================
   FORMAT
========================================================= */

function formatSlug(
  value: string
) {
  return value
    .split("-")
    .map(
      (word) =>
        word
          .charAt(0)
          .toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}
