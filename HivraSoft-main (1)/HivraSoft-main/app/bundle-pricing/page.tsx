import Header from "@/src/components/Header/Header";
import BundlePricingCatalog from "@/src/components/BundlePricing/BundlePricingCatalog";

/* =========================================================
   API
========================================================= */

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5000";

export const dynamic = "force-dynamic";

/* =========================================================
   TYPES
========================================================= */

type MediaImage = {
  url?: string;
  secure_url?: string;
  src?: string;
  imageUrl?: string;

  publicId?: string;
  public_id?: string;

  alt?: string;
  name?: string;
};

type ProductImage = {
  url: string;
  publicId?: string;
};

type ProductCategory = {
  _id?: string;
  id?: string;

  name?: string;
  slug?: string;
};

type ProductColor = {
  name?: string;
  hex?: string;

  images?: ProductImage[];

  isActive?: boolean;
};

type ApiProduct = {
  _id?: string;
  id?: string;

  name?: string;
  slug?: string;

  shortDescription?: string;

  price?: number;
  compareAtPrice?: number;

  mainImages?: ProductImage[];

  colors?: ProductColor[];

  categories?: ProductCategory[];

  status?: string;
};

type ApiCategory = {
  _id?: string;
  id?: string;

  name?: string;
  slug?: string;

  description?: string;

  images?: Array<
    string | MediaImage
  >;

  categoryImages?: Array<
    string | MediaImage
  >;

  image?:
    | string
    | MediaImage;

  bannerImage?:
    | string
    | MediaImage;

  desktopImage?:
    | string
    | MediaImage;

  thumbnail?:
    | string
    | MediaImage;

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
   IMAGE URL HELPER
========================================================= */

function getImageUrl(
  image?:
    | string
    | MediaImage
    | null
) {
  if (!image) {
    return "";
  }

  if (
    typeof image === "string"
  ) {
    return image;
  }

  return (
    image.url ||
    image.secure_url ||
    image.imageUrl ||
    image.src ||
    ""
  );
}

/* =========================================================
   GET CATEGORY IMAGE
========================================================= */

function getCategoryBannerUrl(
  category: ApiCategory | null
) {
  if (!category) {
    return "";
  }

  /* =======================================================
     CATEGORY IMAGES - FIRST PRIORITY
  ======================================================= */

  if (
    Array.isArray(
      category.images
    ) &&
    category.images.length > 0
  ) {
    const url =
      getImageUrl(
        category.images[0]
      );

    if (url) {
      return url;
    }
  }

  /* =======================================================
     ALTERNATIVE CATEGORY IMAGES FIELD
  ======================================================= */

  if (
    Array.isArray(
      category.categoryImages
    ) &&
    category.categoryImages.length > 0
  ) {
    const url =
      getImageUrl(
        category.categoryImages[0]
      );

    if (url) {
      return url;
    }
  }

  /* =======================================================
     FALLBACKS
  ======================================================= */

  return (
    getImageUrl(
      category.bannerImage
    ) ||
    getImageUrl(
      category.desktopImage
    ) ||
    getImageUrl(
      category.image
    ) ||
    getImageUrl(
      category.thumbnail
    ) ||
    ""
  );
}

/* =========================================================
   CATEGORY RESPONSE EXTRACT
========================================================= */

function extractCategory(
  result: unknown
): ApiCategory | null {
  if (
    !result ||
    typeof result !== "object"
  ) {
    return null;
  }

  const object =
    result as Record<
      string,
      unknown
    >;

  /* =======================================================
     {
       category: {...}
     }
  ======================================================= */

  if (
    object.category &&
    typeof object.category ===
      "object" &&
    !Array.isArray(
      object.category
    )
  ) {
    return object.category as ApiCategory;
  }

  /* =======================================================
     {
       data: {...}
     }
  ======================================================= */

  if (
    object.data &&
    typeof object.data ===
      "object" &&
    !Array.isArray(
      object.data
    )
  ) {
    const data =
      object.data as Record<
        string,
        unknown
      >;

    /* =====================================================
       {
         data: {
           category: {...}
         }
       }
    ===================================================== */

    if (
      data.category &&
      typeof data.category ===
        "object" &&
      !Array.isArray(
        data.category
      )
    ) {
      return data.category as ApiCategory;
    }

    return object.data as ApiCategory;
  }

  /* =======================================================
     DIRECT CATEGORY OBJECT
  ======================================================= */

  return result as ApiCategory;
}

/* =========================================================
   FETCH BUNDLE CATEGORY
========================================================= */

async function getBundleCategory(): Promise<
  ApiCategory | null
> {
  try {
    const response =
      await fetch(
        `${API_URL}/api/categories/slug/bundle-pricing`,
        {
          cache: "no-store",
        }
      );

    if (!response.ok) {
      console.error(
        "Bundle category API failed:",
        response.status
      );

      return null;
    }

    const result: unknown =
      await response.json();

    const category =
      extractCategory(
        result
      );

    console.log(
      "BUNDLE CATEGORY DATA:",
      category
    );

    console.log(
      "BUNDLE CATEGORY IMAGE URL:",
      getCategoryBannerUrl(
        category
      )
    );

    return category;
  } catch (error) {
    console.error(
      "Bundle category fetch error:",
      error
    );

    return null;
  }
}

/* =========================================================
   CHECK BUNDLE PRODUCT
========================================================= */

function isBundlePricingProduct(
  product: ApiProduct
) {
  if (
    !Array.isArray(
      product.categories
    )
  ) {
    return false;
  }

  return product.categories.some(
    (category) => {
      const slug =
        normalize(
          category.slug
        );

      const name =
        normalize(
          category.name
        );

      return (
        slug ===
          "bundle-pricing" ||
        name ===
          "bundle-pricing"
      );
    }
  );
}

/* =========================================================
   FETCH PRODUCTS
========================================================= */

async function getProducts(): Promise<
  ApiProduct[]
> {
  try {
    const response =
      await fetch(
        `${API_URL}/api/products/active`,
        {
          cache: "no-store",
        }
      );

    if (!response.ok) {
      console.error(
        "Products API failed:",
        response.status
      );

      return [];
    }

    const result: unknown =
      await response.json();

    /* =====================================================
       DIRECT ARRAY
    ===================================================== */

    if (
      Array.isArray(result)
    ) {
      return result as ApiProduct[];
    }

    /* =====================================================
       OBJECT RESPONSE
    ===================================================== */

    if (
      result &&
      typeof result === "object"
    ) {
      const object =
        result as Record<
          string,
          unknown
        >;

      if (
        Array.isArray(
          object.products
        )
      ) {
        return object.products as ApiProduct[];
      }

      if (
        Array.isArray(
          object.data
        )
      ) {
        return object.data as ApiProduct[];
      }

      if (
        object.data &&
        typeof object.data ===
          "object"
      ) {
        const data =
          object.data as Record<
            string,
            unknown
          >;

        if (
          Array.isArray(
            data.products
          )
        ) {
          return data.products as ApiProduct[];
        }
      }
    }

    return [];
  } catch (error) {
    console.error(
      "Products fetch error:",
      error
    );

    return [];
  }
}

/* =========================================================
   PAGE
========================================================= */

export default async function BundlePricingPage() {
  const [
    products,
    category,
  ] =
    await Promise.all([
      getProducts(),
      getBundleCategory(),
    ]);

  /* =======================================================
     CATEGORY IMAGE
  ======================================================= */

  const bannerUrl =
    getCategoryBannerUrl(
      category
    );

  /* =======================================================
     FILTER BUNDLE PRODUCTS
  ======================================================= */

  const bundleProducts =
    products.filter(
      isBundlePricingProduct
    );

  /* =======================================================
     PRODUCT MAPPING
  ======================================================= */

  const mappedProducts =
    bundleProducts.map(
      (
        product,
        index
      ) => {
        const mainImages =
          Array.isArray(
            product.mainImages
          )
            ? product.mainImages.filter(
                (image) =>
                  Boolean(
                    image?.url
                  )
              )
            : [];

        const activeColors =
          Array.isArray(
            product.colors
          )
            ? product.colors.filter(
                (color) =>
                  color.isActive !==
                  false
              )
            : [];

        const colorImages =
          Array.isArray(
            activeColors[0]
              ?.images
          )
            ? activeColors[0]
                .images!
            : [];

        return {
          id:
            product._id ||
            product.id ||
            String(index),

          name:
            product.name ||
            "Product",

          slug:
            product.slug ||
            "",

          shortDescription:
            product.shortDescription ||
            "",

          price:
            Number(
              product.price
            ) || 0,

          compareAtPrice:
            Number(
              product.compareAtPrice ||
                0
            ),

          image:
            mainImages[0]
              ?.url ||
            colorImages[0]
              ?.url ||
            "",

          hoverImage:
            mainImages[1]
              ?.url ||
            colorImages[1]
              ?.url ||
            mainImages[0]
              ?.url ||
            colorImages[0]
              ?.url ||
            "",

          colorCount:
            activeColors.length,
        };
      }
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      {/* =================================================
          HEADER
      ================================================= */}

      <Header />

      {/* =================================================
          BUNDLE PAGE
      ================================================= */}

      <BundlePricingCatalog
        products={
          mappedProducts
        }
        bannerUrl={
          bannerUrl
        }
        categoryName={
          category?.name ||
          "Bundle Pricing"
        }
      />
    </>
  );
}