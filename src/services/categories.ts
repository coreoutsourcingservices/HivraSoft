/* =========================================================
   STOREFRONT CATEGORY TREE

   Source of truth:
   GET /api/categories/tree?active=true

   Storefront navigation must never maintain a second hardcoded
   copy of the admin category hierarchy. Add / rename / move /
   delete in Admin -> Categories is reflected on the next request.
========================================================= */

const RAW_API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(
    /\/+$/,
    ""
  ) || "http://localhost:5000";

const API_URL =
  RAW_API_URL.replace(
    /\/api$/i,
    ""
  );

export type StorefrontCategoryImage = {
  url: string;
  publicId: string;
  alt: string;
};

export type StorefrontCategoryNode = {
  id: string;
  name: string;
  slug: string;
  description: string;
  parent: string | null;
  ancestors: string[];
  level: number;
  images: StorefrontCategoryImage[];
  isActive: boolean;
  sortOrder: number;
  children: StorefrontCategoryNode[];
};

type CategoryTreeResponse =
  | StorefrontCategoryNode[]
  | {
      categories?: unknown;
      data?: unknown;
    };

function normalizeNode(
  value: unknown
): StorefrontCategoryNode | null {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return null;
  }

  const raw = value as Record<
    string,
    unknown
  >;

  const id = String(
    raw.id ||
      raw._id ||
      ""
  ).trim();

  const name = String(
    raw.name || ""
  ).trim();

  const slug = String(
    raw.slug || ""
  )
    .trim()
    .toLowerCase();

  if (!id || !name || !slug) {
    return null;
  }

  const rawImages =
    Array.isArray(raw.images)
      ? raw.images
      : [];

  const images = rawImages
    .map((image) => {
      if (
        !image ||
        typeof image !== "object"
      ) {
        return null;
      }

      const item = image as Record<
        string,
        unknown
      >;

      const url = String(
        item.url || ""
      ).trim();

      if (!url) {
        return null;
      }

      return {
        url,
        publicId: String(
          item.publicId || ""
        ),
        alt: String(
          item.alt || name
        ),
      };
    })
    .filter(
      (
        image
      ): image is StorefrontCategoryImage =>
        Boolean(image)
    );

  const rawChildren =
    Array.isArray(raw.children)
      ? raw.children
      : [];

  const children = rawChildren
    .map(normalizeNode)
    .filter(
      (
        child
      ): child is StorefrontCategoryNode =>
        Boolean(child)
    );

  return {
    id,
    name,
    slug,
    description: String(
      raw.description || ""
    ),
    parent:
      raw.parent == null
        ? null
        : String(raw.parent),
    ancestors: Array.isArray(
      raw.ancestors
    )
      ? raw.ancestors.map(
          (ancestor) =>
            String(ancestor)
        )
      : [],
    level:
      Number(raw.level) || 0,
    images,
    isActive:
      raw.isActive !== false,
    sortOrder:
      Number(raw.sortOrder) || 0,
    children,
  };
}

function extractTree(
  response: CategoryTreeResponse
): StorefrontCategoryNode[] {
  const rawTree =
    Array.isArray(response)
      ? response
      : Array.isArray(
            response?.categories
          )
        ? response.categories
        : Array.isArray(
              response?.data
            )
          ? response.data
          : [];

  return rawTree
    .map(normalizeNode)
    .filter(
      (
        node
      ): node is StorefrontCategoryNode =>
        Boolean(node)
    );
}

export async function getActiveCategoryTree(): Promise<
  StorefrontCategoryNode[]
> {
  try {
    const response = await fetch(
      `${API_URL}/api/categories/tree?active=true`,
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const body =
      (await response.json()) as CategoryTreeResponse;

    return extractTree(body);
  } catch {
    return [];
  }
}

export function findCategoryRoot(
  tree: StorefrontCategoryNode[],
  slug: string
): StorefrontCategoryNode | undefined {
  const target = slug
    .trim()
    .toLowerCase();

  return tree.find(
    (node) =>
      node.slug === target
  );
}

export function resolveCategoryPath(
  root: StorefrontCategoryNode,
  slugs: string[]
): StorefrontCategoryNode[] | null {
  if (slugs.length === 0) {
    return [];
  }

  const result:
    StorefrontCategoryNode[] = [];

  let children =
    root.children;

  for (const rawSlug of slugs) {
    const slug = rawSlug
      .trim()
      .toLowerCase();

    const node = children.find(
      (child) =>
        child.slug === slug
    );

    if (!node) {
      return null;
    }

    result.push(node);
    children = node.children;
  }

  return result;
}

export function flattenCategorySubtree(
  root: StorefrontCategoryNode
): StorefrontCategoryNode[] {
  const result:
    StorefrontCategoryNode[] = [];

  const visit = (
    node: StorefrontCategoryNode
  ) => {
    result.push(node);

    node.children.forEach(
      visit
    );
  };

  visit(root);

  return result;
}
