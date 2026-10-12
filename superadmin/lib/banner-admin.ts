export type CategoryOption = {
  _id: string;
  name: string;
  slug: string;
  level?: number;
  children?: CategoryOption[];
};

export type FlatCategoryOption = {
  _id: string;
  name: string;
  slug: string;
  level: number;
};

export type ProductOption = {
  _id: string;
  name: string;
  slug: string;
  price?: number;
};

export const flattenCategories = (
  categories: CategoryOption[],
  parentLevel = 0
): FlatCategoryOption[] => {
  const result:
    FlatCategoryOption[] = [];

  categories.forEach(
    category => {
      const level =
        typeof category.level ===
        "number"
          ? category.level
          : parentLevel;

      result.push({
        _id: category._id,
        name: category.name,
        slug: category.slug,
        level,
      });

      if (
        Array.isArray(
          category.children
        ) &&
        category.children.length >
          0
      ) {
        result.push(
          ...flattenCategories(
            category.children,
            level + 1
          )
        );
      }
    }
  );

  return result;
};
