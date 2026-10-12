/* =========================================================
   HIVRA SOFT — HOMEPAGE CONTENT DATA

   FUTURE ME HOMEPAGE KA:
   - IMAGE
   - SECOND IMAGE
   - PRICE
   - PRODUCT SLUG
   - BANNER
   - REDIRECT

   SIRF IS FILE ME CHANGE KARNA HAI.
========================================================= */


/* =========================================================
   COMMON IMAGES
========================================================= */

export const images = {

  blog1:
     "https://hivrasoft.com/wp-content/uploads/2026/09/Gemini_Generated_Image_vr76g7vr76g7vr76.png",
  beigeBra:
    "https://hivrasoft.com/wp-content/uploads/2026/02/beige-Non-paded-bra-8-Picsart-AiImageEnhancer.jpg-600x750.webp",

  skinMaternity:
    "https://hivrasoft.com/wp-content/uploads/2026/04/Skin-Maternity-Bra-Side-600x750.webp",

  bikiniPanty:
    "https://hivrasoft.com/wp-content/uploads/2026/02/Bikini-Panty-1-3-Picsart-AiImageEnhancer-600x750.webp",

  blackMaternity:
    "https://hivrasoft.com/wp-content/uploads/2026/04/Black-Maternity-Bra-OPEN-600x750.webp",

  bluePanty:
    "https://hivrasoft.com/wp-content/uploads/2026/05/Pi7_BluePanty1-600x750.webp",

  blackBra:
    "https://hivrasoft.com/wp-content/uploads/2026/03/Black-3-Picsart-AiImageEnhancer-600x750.webp",

  blackPrintedPanty:
    "https://hivrasoft.com/wp-content/uploads/2026/05/Pi7_blackprintedpanty1-600x750.webp",

  collection:
    "https://hivrasoft.com/wp-content/uploads/2026/06/5363cdcc-4a0d-41a0-a599-5160af690af3-600x750.webp",

  blackEssential:
    "https://hivrasoft.com/wp-content/uploads/2026/06/BLACK1-600x750.webp",

  sportsBra:
    "https://hivrasoft.com/wp-content/uploads/2026/04/Sports-Bra-Black-Front-600x750.webp",

  blueGString:
    "https://hivrasoft.com/wp-content/uploads/2026/05/Pi7_womengstringblue3-600x750.webp",
};


/* =========================================================
   MAIN HOME BANNERS

   image
   redirect
   alt

   Banner add karna ho to bas ek new object add karo.
========================================================= */

export const bannerImages = [
  {
    image: images.blog1,
    redirect: "/new-launch",
    alt: "Hivra Soft New Launch",
  },

  {
    image: images.skinMaternity,
    redirect: "/women/maternity-bra",
    alt: "Hivra Soft Maternity Collection",
  },

  {
    image: images.sportsBra,
    redirect: "/women/sports-bra",
    alt: "Hivra Soft Sports Bra Collection",
  },

  {
    image: images.blackMaternity,
    redirect: "/women",
    alt: "Hivra Soft Women Collection",
  },
];


/* =========================================================
   YOUR FAVOURITES FOR A LIMITED TIME

   Har box me 3 images hain.
   Har image ka apna redirect hai.
========================================================= */

export const favouriteCards = [
  {
    name: "Comfort Essentials",

    slides: [
      {
        image: images.bikiniPanty,
        redirect: "/women",
      },

      {
        image: images.bluePanty,
        redirect: "/women",
      },

      {
        image: images.blackPrintedPanty,
        redirect: "/new-launch",
      },
    ],
  },

  {
    name: "Move With Confidence",

    slides: [
      {
        image: images.sportsBra,
        redirect: "/women/sports-bra",
      },

      {
        image: images.blackBra,
        redirect: "/women",
      },

      {
        image: images.skinMaternity,
        redirect: "/women/maternity-bra",
      },
    ],
  },
];


/* =========================================================
   INNERWEAR ONLINE FOR EVERY WOMAN

   FORMAT EXACTLY:
   name
   image1
   image2
   actualPrice        -> cut price
   discountedPrice    -> main shown price
   slug
========================================================= */

export const everyWomanProducts = [
  {
    name: "Beige Cotton Non Padded Everyday Bra",

    image1: images.beigeBra,
    image2: images.blackBra,

    actualPrice: 799,
    discountedPrice: 499,

    slug: "beige-cotton-non-padded-everyday-bra",
  },

  {
    name: "Skin Maternity Bra",

    image1: images.skinMaternity,
    image2: images.blackMaternity,

    actualPrice: 899,
    discountedPrice: 599,

    slug: "skin-maternity-bra",
  },

  {
    name: "Black Maternity Bra",

    image1: images.blackMaternity,
    image2: images.skinMaternity,

    actualPrice: 899,
    discountedPrice: 599,

    slug: "black-maternity-bra",
  },

  {
    name: "Black Sports Bra",

    image1: images.sportsBra,
    image2: images.blackBra,

    actualPrice: 799,
    discountedPrice: 499,

    slug: "black-sports-bra",
  },
];


/* =========================================================
   NEW INNERWEAR FOR MEN & WOMEN

   COMPLETELY SEPARATE ARRAY
========================================================= */

export const menWomenProducts = [
  {
    name: "Bikini Panty",

    image1: images.bikiniPanty,
    image2: images.bluePanty,

    actualPrice: 499,
    discountedPrice: 299,

    slug: "bikini-panty",
  },

  {
    name: "Blue Everyday Panty",

    image1: images.bluePanty,
    image2: images.blackPrintedPanty,

    actualPrice: 399,
    discountedPrice: 249,

    slug: "blue-everyday-panty",
  },

  {
    name: "Black Everyday Innerwear",

    image1: images.blackBra,
    image2: images.blackEssential,

    actualPrice: 599,
    discountedPrice: 399,

    slug: "black-everyday-innerwear",
  },

  {
    name: "Black Printed Panty",

    image1: images.blackPrintedPanty,
    image2: images.bikiniPanty,

    actualPrice: 499,
    discountedPrice: 299,

    slug: "black-printed-panty",
  },

  {
    name: "Everyday Comfort Collection",

    image1: images.collection,
    image2: images.skinMaternity,

    actualPrice: 699,
    discountedPrice: 399,

    slug: "everyday-comfort-collection",
  },

  {
    name: "Black Comfort Essential",

    image1: images.blackEssential,
    image2: images.sportsBra,

    actualPrice: 599,
    discountedPrice: 399,

    slug: "black-comfort-essential",
  },

  {
    name: "Black Sports Bra",

    image1: images.sportsBra,
    image2: images.blackBra,

    actualPrice: 799,
    discountedPrice: 499,

    slug: "black-sports-bra",
  },

  {
    name: "Blue G-String",

    image1: images.blueGString,
    image2: images.bikiniPanty,

    actualPrice: 399,
    discountedPrice: 249,

    slug: "blue-g-string",
  },
];


/* =========================================================
   STYLE, COMFORT & CONFIDENCE

   HAR CARD ME SIRF ONE IMAGE
========================================================= */

export const styleComfortConfidence = [
  {
    name: "Bra Collection",
    image: images.beigeBra,
    redirect: "/women",
  },

  {
    name: "Maternity Collection",
    image: images.skinMaternity,
    redirect: "/women/maternity-bra",
  },

  {
    name: "Panty Collection",
    image: images.bluePanty,
    redirect: "/women",
  },
];


/* =========================================================
   FIND YOUR FIT

   HAR BOX = 4 IMAGES
   HAR IMAGE = APNA REDIRECT
========================================================= */

export const findYourFit = [
  {
    name: "Women",

    images: [
      {
        image: images.beigeBra,
        redirect:
          "/product/beige-cotton-non-padded-everyday-bra",
      },

      {
        image: images.skinMaternity,
        redirect: "/women/maternity-bra",
      },

      {
        image: images.blackMaternity,
        redirect: "/women/maternity-bra",
      },

      {
        image: images.blackBra,
        redirect: "/women",
      },
    ],
  },

  {
    name: "Men",

    images: [
      {
        image: images.blackEssential,
        redirect: "/men",
      },

      {
        image: images.collection,
        redirect: "/men",
      },

      {
        image: images.sportsBra,
        redirect: "/men",
      },

      {
        image: images.blackBra,
        redirect: "/men",
      },
    ],
  },

  {
    name: "New Launch",

    images: [
      {
        image: images.sportsBra,
        redirect: "/new-launch",
      },

      {
        image: images.bluePanty,
        redirect: "/new-launch",
      },

      {
        image: images.blackPrintedPanty,
        redirect: "/new-launch",
      },

      {
        image: images.beigeBra,
        redirect: "/new-launch",
      },
    ],
  },

  {
    name: "Accessories",

    images: [
      {
        image: images.blueGString,
        redirect: "/accessories",
      },

      {
        image: images.bikiniPanty,
        redirect: "/accessories",
      },

      {
        image: images.blackPrintedPanty,
        redirect: "/accessories",
      },

      {
        image: images.bluePanty,
        redirect: "/accessories",
      },
    ],
  },
];