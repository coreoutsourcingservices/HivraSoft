import Header from "@/src/components/Header/Header";
<<<<<<< HEAD
import NewLaunchCatalog from "@/src/components/NewLaunch/NewLaunchCatalog";

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

  isNewLaunch?: boolean;
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
   GET CATEGORY BANNER
========================================================= */

function getCategoryBannerUrl(
  category: ApiCategory | null
) {
  if (!category) {
    return "";
  }

  /* CATEGORY IMAGES */

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

  /* ALTERNATIVE CATEGORY IMAGES */

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

  /* FALLBACKS */

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
   EXTRACT CATEGORY
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

  return result as ApiCategory;
}

/* =========================================================
   FETCH NEW LAUNCH CATEGORY
========================================================= */

/* =========================================================
   FETCH NEW LAUNCH CATEGORY
========================================================= */

async function getNewLaunchCategory(): Promise<
  ApiCategory | null
> {
  try {
    /* =====================================================
       FIRST: DIRECT SLUG
    ===================================================== */

    const directResponse =
      await fetch(
        `${API_URL}/api/categories/slug/new-launch`,
        {
          cache: "no-store",
        }
      );

    if (directResponse.ok) {
      const result: unknown =
        await directResponse.json();

      const category =
        extractCategory(result);

      if (category) {
        return category;
      }
    }

    /* =====================================================
       FALLBACK: ALL ACTIVE CATEGORIES
    ===================================================== */

    const response =
      await fetch(
        `${API_URL}/api/categories/active`,
        {
          cache: "no-store",
        }
      );

    if (!response.ok) {
      return null;
    }

    const result: unknown =
      await response.json();

    let categories:
      ApiCategory[] = [];

    if (Array.isArray(result)) {
      categories =
        result as ApiCategory[];
    } else if (
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
          object.categories
        )
      ) {
        categories =
          object.categories as ApiCategory[];
      } else if (
        Array.isArray(
          object.data
        )
      ) {
        categories =
          object.data as ApiCategory[];
      } else if (
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
            data.categories
          )
        ) {
          categories =
            data.categories as ApiCategory[];
        }
      }
    }

    const newLaunchCategory =
      categories.find(
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
              "new-launch" ||
            name ===
              "new-launch"
          );
        }
      );

    return (
      newLaunchCategory ||
      null
    );
  } catch (error) {
    console.log(
      "New Launch category fetch issue:",
      error
    );

    return null;
  }
}

/* =========================================================
   NEW LAUNCH PRODUCT CHECK
========================================================= */

function isNewLaunchProduct(
  product: ApiProduct
) {
  /* PRODUCT FLAG SUPPORT */

  if (
    product.isNewLaunch === true
  ) {
    return true;
  }

  /* CATEGORY SUPPORT */

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
          "new-launch" ||
        name ===
          "new-launch"
      );
    }
  );
}

/* =========================================================
   FETCH ACTIVE PRODUCTS
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

    if (
      Array.isArray(result)
    ) {
      return result as ApiProduct[];
    }

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

export default async function NewLaunchPage() {
  const [
    products,
    category,
  ] =
    await Promise.all([
      getProducts(),
      getNewLaunchCategory(),
    ]);

  /* =======================================================
     BANNER
  ======================================================= */

  const bannerUrl =
    getCategoryBannerUrl(
      category
    );

  /* =======================================================
     FILTER NEW LAUNCH PRODUCTS
  ======================================================= */

  const newLaunchProducts =
    products.filter(
      isNewLaunchProduct
    );

  /* =======================================================
     PRODUCT MAPPING
  ======================================================= */

  const mappedProducts =
    newLaunchProducts.map(
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

=======

import NewLaunchCatalog from "@/src/components/NewLaunch/NewLaunchCatalog";

import {
  getActiveCategoryTree,
} from "@/src/services/categories";

import {
  findCategoryAnywhere,
  getNewLaunchProducts,
  mapProductToColorCards,
  productBelongsToCategory,
} from "@/src/services/storefront-catalog";

export const dynamic =
  "force-dynamic";

export default async function NewLaunchPage() {
  const [
    categoryTree,
    newLaunchApiProducts,
  ] =
    await Promise.all([
      getActiveCategoryTree(),

      getNewLaunchProducts(),
    ]);

  const menRoot =
    findCategoryAnywhere(
      categoryTree,
      [
        "men",
        "mens",
      ]
    );

  const womenRoot =
    findCategoryAnywhere(
      categoryTree,
      [
        "women",
        "womens",
      ]
    );

  const newLaunchCategory =
    findCategoryAnywhere(
      categoryTree,
      [
        "new-launch",
        "new-launches",
      ]
    );

  /* =======================================================
     MEN
  ======================================================= */

  const menProducts =
    menRoot
      ? newLaunchApiProducts
          .filter((product) =>
            productBelongsToCategory(
              product,
              menRoot
            )
          )
          .flatMap(
            mapProductToColorCards
          )
      : [];

  /* =======================================================
     WOMEN
  ======================================================= */

  const womenProducts =
    womenRoot
      ? newLaunchApiProducts
          .filter((product) =>
            productBelongsToCategory(
              product,
              womenRoot
            )
          )
          .flatMap(
            mapProductToColorCards
          )
      : [];

  /* =======================================================
     BACKGROUND

     New Launch category first image.
  ======================================================= */

  const backgroundImage =
    newLaunchCategory
      ?.images?.[0]?.url ||
    "";

>>>>>>> aman
  return (
    <>
      <Header />

      <NewLaunchCatalog
<<<<<<< HEAD
        products={
          mappedProducts
        }
        bannerUrl={
          bannerUrl
        }
        categoryName={
          category?.name ||
          "New Launch"
=======
        menProducts={
          menProducts
        }
        womenProducts={
          womenProducts
        }
        menCategory={
          menRoot || null
        }
        womenCategory={
          womenRoot ||
          null
        }
        backgroundImage={
          backgroundImage
>>>>>>> aman
        }
      />
    </>
  );
}