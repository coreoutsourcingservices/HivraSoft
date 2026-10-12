import {
  notFound,
} from "next/navigation";

import Header from "@/src/components/Header/Header";

import AccessoriesCatalog from "@/src/components/Storefront/AccessoriesCatalog";

import {
  getActiveCategoryTree,
} from "@/src/services/categories";

import type {
  StorefrontCategoryNode,
} from "@/src/services/categories";

import {
  getActiveProducts,
} from "@/src/services/products";

import {
  mapProductToColorCards,
} from "@/src/services/storefront-catalog";

import type {
  CatalogBanner,
} from "@/types/catalog";

/* =========================================================
   DYNAMIC PAGE
========================================================= */

export const dynamic =
  "force-dynamic";

/* =========================================================
   TYPES
========================================================= */

type Props = {
  params: Promise<{
    path?: string[];
  }>;
};

type UnknownRecord =
  Record<
    string,
    unknown
  >;

/* =========================================================
   HELPERS
========================================================= */

function cleanSlug(
  value: unknown,
) {
  return String(
    value || "",
  )
    .trim()
    .toLowerCase()
    .replace(
      /^\/+|\/+$/g,
      "",
    );
}

function asArray<T>(
  value: unknown,
): T[] {
  return Array.isArray(
    value,
  )
    ? (value as T[])
    : [];
}

function asRecord(
  value: unknown,
): UnknownRecord | null {
  if (
    !value ||
    typeof value !==
      "object"
  ) {
    return null;
  }

  return value as UnknownRecord;
}

function readId(
  value: unknown,
) {
  if (
    typeof value ===
    "string"
  ) {
    return value;
  }

  const record =
    asRecord(
      value,
    );

  if (!record) {
    return "";
  }

  return String(
    record._id ||
      record.id ||
      "",
  ).trim();
}

function readSlug(
  value: unknown,
) {
  if (
    typeof value ===
    "string"
  ) {
    return cleanSlug(
      value,
    );
  }

  const record =
    asRecord(
      value,
    );

  if (!record) {
    return "";
  }

  return cleanSlug(
    record.slug ||
      record.slugProduct ||
      "",
  );
}

/* =========================================================
   FIND ACCESSORIES ROOT
========================================================= */

function findAccessoriesRoot(
  categories:
    StorefrontCategoryNode[],
) {
  return (
    categories.find(
      (category) => {
        const slug =
          cleanSlug(
            category.slug,
          );

        const name =
          cleanSlug(
            category.name,
          );

        return (
          slug ===
            "accessories" ||
          slug ===
            "accessory" ||
          name ===
            "accessories" ||
          name ===
            "accessory"
        );
      },
    ) || null
  );
}

/* =========================================================
   RESOLVE SELECTED CATEGORY

   /accessories
   => Accessories

   /accessories/socks
   => Socks

   /accessories/bags/travel
   => Travel
========================================================= */

function resolveCategoryPath(
  root:
    StorefrontCategoryNode,

  path:
    string[],
) {
  let current =
    root;

  for (
    const rawSlug of
      path
  ) {
    const slug =
      cleanSlug(
        rawSlug,
      );

    const next =
      (
        current.children ||
        []
      ).find(
        (child) =>
          cleanSlug(
            child.slug,
          ) === slug,
      );

    if (!next) {
      return null;
    }

    current =
      next;
  }

  return current;
}

/* =========================================================
   COLLECT CATEGORY + CHILD CATEGORY IDS

   Important:

   Accessories
      ├─ Socks
      ├─ Bags
      └─ Other

   /accessories par teeno ke products show honge.
========================================================= */

function collectCategoryIds(
  category:
    StorefrontCategoryNode,
) {
  const ids =
    new Set<string>();

  function walk(
    node:
      StorefrontCategoryNode,
  ) {
    const id =
      readId(
        node,
      );

    if (id) {
      ids.add(
        id,
      );
    }

    (
      node.children ||
      []
    ).forEach(
      walk,
    );
  }

  walk(
    category,
  );

  return ids;
}

/* =========================================================
   PRODUCT CATEGORY IDS
========================================================= */

function getProductCategoryIds(
  product: unknown,
) {
  const record =
    asRecord(
      product,
    );

  if (!record) {
    return [];
  }

  return asArray<unknown>(
    record.categories,
  )
    .map(
      readId,
    )
    .filter(
      Boolean,
    );
}

/* =========================================================
   PRODUCT MATCH
========================================================= */

function belongsToCategory(
  product: unknown,

  allowedIds:
    Set<string>,
) {
  return getProductCategoryIds(
    product,
  ).some(
    (categoryId) =>
      allowedIds.has(
        categoryId,
      ),
  );
}

/* =========================================================
   DESCRIPTION
========================================================= */

function categoryDescription(
  category:
    StorefrontCategoryNode,
) {
  const record =
    category as unknown as
      UnknownRecord;

  return String(
    record.description ||
      "",
  ).trim();
}

/* =========================================================
   CATEGORY IMAGE

   Banner na mile to category image fallback.
========================================================= */

function categoryImage(
  category:
    StorefrontCategoryNode,
) {
  const record =
    category as unknown as
      UnknownRecord;

  const images =
    asArray<unknown>(
      record.images,
    );

  for (
    const rawImage of
      images
  ) {
    const image =
      asRecord(
        rawImage,
      );

    if (!image) {
      continue;
    }

    const url =
      String(
        image.url ||
          "",
      ).trim();

    if (!url) {
      continue;
    }

    return {
      url,

      alt:
        String(
          image.alt ||
            category.name ||
            "Accessories",
        ).trim(),
    };
  }

  return null;
}

/* =========================================================
   API URL
========================================================= */

function getApiUrl() {
  return (
    process.env.API_URL ||
    process.env
      .NEXT_PUBLIC_API_URL ||
    "http://localhost:5000"
  ).replace(
    /\/$/,
    "",
  );
}

/* =========================================================
   ACCESSORIES BANNERS

   Admin:
   category_top
   category_middle

   Category linked banner hi use hoga.
========================================================= */

async function getAccessoriesBanners(
  category:
    StorefrontCategoryNode,

  categoryPath:
    string[],
): Promise<
  CatalogBanner[]
> {
  try {
    const response =
      await fetch(
        `${getApiUrl()}/api/banners/active`,
        {
          cache:
            "no-store",
        },
      );

    if (
      !response.ok
    ) {
      return [];
    }

    const responseBody:
      unknown =
      await response.json();

    const responseRecord =
      asRecord(
        responseBody,
      );

    const bannerGroups =
      asArray<unknown>(
        responseRecord?.data ||
          responseRecord?.banners ||
          responseBody,
      );

    const categoryId =
      readId(
        category,
      );

    const categorySlug =
      cleanSlug(
        category.slug,
      );

    const currentHref =
      categoryPath.length
        ? `/accessories/${categoryPath
            .map(
              encodeURIComponent,
            )
            .join("/")}`
        : "/accessories";

    const result:
      CatalogBanner[] =
      [];

    for (
      const rawGroup of
        bannerGroups
    ) {
      const group =
        asRecord(
          rawGroup,
        );

      if (!group) {
        continue;
      }

      if (
        group.isActive ===
        false
      ) {
        continue;
      }

      const position =
        cleanSlug(
          group.position,
        );

      if (
        position !==
          "category_top" &&
        position !==
          "category_middle"
      ) {
        continue;
      }

      const mediaItems =
        asArray<unknown>(
          group.images ||
            group.media ||
            group.items,
        );

      for (
        const rawItem of
          mediaItems
      ) {
        const item =
          asRecord(
            rawItem,
          );

        if (!item) {
          continue;
        }

        const linkedCategory =
          item.category ||
          group.category;

        const linkedCategoryId =
          readId(
            linkedCategory,
          );

        const linkedCategorySlug =
          readSlug(
            linkedCategory,
          );

        /* ===============================================
           CATEGORY MATCH
        =============================================== */

        if (
          linkedCategoryId
        ) {
          if (
            linkedCategoryId !==
              categoryId
          ) {
            continue;
          }
        } else if (
          linkedCategorySlug
        ) {
          if (
            linkedCategorySlug !==
              categorySlug
          ) {
            continue;
          }
        } else {
          /*
           * Category relation hi nahi hai,
           * to Accessories page par random
           * category banner mat show karo.
           */
          continue;
        }

        /* ===============================================
           IMAGE
        =============================================== */

        const image =
          String(
            item.url ||
              item.image ||
              "",
          ).trim();

        if (!image) {
          continue;
        }

        /* ===============================================
           REDIRECT
        =============================================== */

        let redirect =
          currentHref;

        const linkType =
          cleanSlug(
            item.linkType,
          );

        if (
          linkType ===
            "custom"
        ) {
          const customLink =
            String(
              item.customLink ||
                "",
            ).trim();

          if (
            customLink
          ) {
            redirect =
              customLink;
          }
        }

        if (
          linkType ===
            "product"
        ) {
          const productSlug =
            readSlug(
              item.product,
            );

          if (
            productSlug
          ) {
            redirect =
              `/product/${encodeURIComponent(
                productSlug,
              )}`;
          }
        }

        result.push(
          {
            image,

            alt:
              String(
                item.alt ||
                  item.title ||
                  category.name ||
                  "Accessories",
              ),

            redirect,
          } as CatalogBanner,
        );
      }
    }

    return result;
  } catch (
    error
  ) {
    console.error(
      "Accessories banners error:",
      error,
    );

    return [];
  }
}

/* =========================================================
   PAGE
========================================================= */

export default async function AccessoriesPage({
  params,
}: Props) {
  const resolvedParams =
    await params;

  const categoryPath =
    asArray<string>(
      resolvedParams.path,
    )
      .map(
        cleanSlug,
      )
      .filter(
        Boolean,
      );

  /* =======================================================
     LOAD CATEGORY TREE + PRODUCTS
  ======================================================= */

  const [
    categoryTree,
    allProducts,
  ] =
    await Promise.all([
      getActiveCategoryTree(),

      getActiveProducts(),
    ]);

  /* =======================================================
     FIND ACCESSORIES
  ======================================================= */

  const categoryRoot =
    findAccessoriesRoot(
      categoryTree,
    );

  if (
    !categoryRoot
  ) {
    notFound();
  }

  /* =======================================================
     CURRENT CATEGORY
  ======================================================= */

  const selectedCategory =
    resolveCategoryPath(
      categoryRoot,
      categoryPath,
    );

  if (
    !selectedCategory
  ) {
    notFound();
  }

  /* =======================================================
     CATEGORY IDS

     Selected category +
     all descendants.
  ======================================================= */

  const categoryIds =
    collectCategoryIds(
      selectedCategory,
    );

  /* =======================================================
     FILTER ACCESSORIES PRODUCTS
  ======================================================= */

  const categoryProducts =
    allProducts.filter(
      (product) =>
        belongsToCategory(
          product,
          categoryIds,
        ),
    );

  /* =======================================================
     CONVERT PRODUCT -> CATALOG COLOR CARDS
  ======================================================= */

  const products =
    categoryProducts.flatMap(
      (product) =>
        mapProductToColorCards(
          product,
        ),
    );

  /* =======================================================
     BANNERS
  ======================================================= */

  let banners =
    await getAccessoriesBanners(
      selectedCategory,
      categoryPath,
    );

  /* =======================================================
     CATEGORY IMAGE FALLBACK

     Banner admin se nahi hai,
     to category image use hogi.
  ======================================================= */

  if (
    banners.length ===
    0
  ) {
    const fallback =
      categoryImage(
        selectedCategory,
      );

    if (
      fallback
    ) {
      banners = [
        {
          image:
            fallback.url,

          alt:
            fallback.alt,

          redirect:
            categoryPath.length
              ? `/accessories/${categoryPath
                  .map(
                    encodeURIComponent,
                  )
                  .join("/")}`
              : "/accessories",
        } as CatalogBanner,
      ];
    }
  }

  /* =======================================================
     TITLE
  ======================================================= */

  const title =
    selectedCategory.name ||
    "Accessories";

  /* =======================================================
     DESCRIPTION
  ======================================================= */

  const description =
    categoryDescription(
      selectedCategory,
    ) ||
    (
      categoryPath.length
        ? `Shop ${title} at Hivra Soft.`
        : "Complete your look with Hivra Soft accessories."
    );

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <>
      <Header />

      <AccessoriesCatalog
        products={
          products
        }
        banners={
          banners
        }
        title={
          title
        }
        description={
          description
        }
        categoryRoot={
          categoryRoot
        }
        categoryPath={
          categoryPath
        }
      />
    </>
  );
}