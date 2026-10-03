import {
  Types,
} from "mongoose";

import Category, {
  ICategory,
  ICategoryImage,
} from "../models/Category.model";

import Product from "../models/Product.model";

import {
  createSlug,
} from "../utils/slug";

import {
  deleteCloudinaryFolderIfEmpty,
  deleteCloudinaryImages,
  getCloudinaryFolderFromPublicId,
  moveCloudinaryImage,
} from "./cloudinary.service";

import { softDeleteEntity } from "./admin-trash.service";

/* =========================================================
   TYPES
========================================================= */

export type CreateCategoryInput = {
  name: string;

  slug?: string;

  description?: string;

  parentId?: string | null;

  images?: ICategoryImage[];

  isActive?: boolean;

  sortOrder?: number;
};

export type UpdateCategoryInput = {
  name?: string;

  slug?: string;

  description?: string;

  parentId?: string | null;

  images?: ICategoryImage[];

  isActive?: boolean;

  sortOrder?: number;
};

export type DeleteCategoryOptions = {
  /*
    false = parent category with children cannot be deleted.
    true  = category + all descendants are deleted.
  */
  cascade?: boolean;
  deletedBy?: string | null;
};

export type CategoryTreeNode = {
  id: string;

  name: string;

  slug: string;

  description: string;

  parent: string | null;

  ancestors: string[];

  level: number;

  images: ICategoryImage[];

  isActive: boolean;

  sortOrder: number;

  children: CategoryTreeNode[];
};

/* =========================================================
   IMAGE NORMALIZER
========================================================= */

const normalizeImages =
  (
    images:
      | ICategoryImage[]
      | undefined,
    fallbackAlt: string
  ): ICategoryImage[] => {
    if (
      !Array.isArray(
        images
      )
    ) {
      return [];
    }

    const seenPublicIds =
      new Set<string>();

    const result:
      ICategoryImage[] =
      [];

    for (
      const image
      of images
    ) {
      const url =
        typeof image?.url ===
        "string"
          ? image.url.trim()
          : "";

      const publicId =
        typeof image?.publicId ===
        "string"
          ? image.publicId.trim()
          : "";

      const alt =
        typeof image?.alt ===
          "string" &&
        image.alt.trim()
          ? image.alt.trim()
          : fallbackAlt;

      if (
        !url ||
        !publicId ||
        seenPublicIds.has(
          publicId
        )
      ) {
        continue;
      }

      seenPublicIds.add(
        publicId
      );

      result.push({
        url,
        publicId,
        alt,
      });
    }

    return result;
  };


/* =========================================================
   CATEGORY CLOUDINARY FOLDER

   Every category gets its own folder only by category name:

   Women:
   hivrasoft/category-images/women

   Sports Bra:
   hivrasoft/category-images/sports-bra

   Image:
   hivrasoft/category-images/sports-bra/front-view
========================================================= */

const getCategoryCloudinaryFolder =
  (
    categoryName: string
  ): string => {
    return `hivrasoft/category-images/${createSlug(
      categoryName
    )}`;
  };

/* =========================================================
   ENSURE IMAGES ARE INSIDE CURRENT CATEGORY FOLDER

   Category create/update/name-change ke baad sab retained
   images canonical folder me move ho jayengi.

   Photo filename same rahega.
========================================================= */

const ensureCategoryImagesFolder =
  async (
    category: ICategory
  ) => {
    if (
      (category.images || []).length ===
      0
    ) {
      return;
    }

    const targetFolder =
      getCategoryCloudinaryFolder(
        category.name
      );

    let changed =
      false;

    const oldFolders =
      new Set<string>();

    const nextImages:
      ICategoryImage[] =
      [];

    for (
      const image
      of category.images || []
    ) {
      const fileName =
        image.publicId
          .split("/")
          .filter(
            Boolean
          )
          .pop() ||
        createSlug(
          image.alt
        );

      const targetPublicId =
        `${targetFolder}/${fileName}`;

      if (
        image.publicId ===
        targetPublicId
      ) {
        nextImages.push({
          url:
            image.url,

          publicId:
            image.publicId,

          alt:
            image.alt,
        });

        continue;
      }

      oldFolders.add(
        getCloudinaryFolderFromPublicId(
          image.publicId
        )
      );

      const moved =
        await moveCloudinaryImage(
          image.publicId,
          targetPublicId
        );

      if (
        !moved
      ) {
        nextImages.push({
          url:
            image.url,

          publicId:
            image.publicId,

          alt:
            image.alt,
        });

        continue;
      }

      changed =
        true;

      nextImages.push({
        url:
          moved.secure_url,

        publicId:
          moved.public_id,

        alt:
          image.alt,
      });
    }

    if (
      changed
    ) {
      category.images =
        nextImages;

      await category.save();

      /*
        Rename/move ke baad purane empty category folders
        ko best-effort remove karo.
      */
      await Promise.allSettled(
        Array.from(
          oldFolders
        )
          .filter(
            (
              folder
            ) =>
              Boolean(
                folder &&
                  folder !==
                    targetFolder
              )
          )
          .map(
            (
              folder
            ) =>
              deleteCloudinaryFolderIfEmpty(
                folder
              )
          )
      );
    }
  };

/* =========================================================
   UNIQUE SLUG
========================================================= */

const generateUniqueSlug =
  async (
    value: string,
    excludeId?: string
  ): Promise<string> => {
    const baseSlug =
      createSlug(
        value
      );

    if (!baseSlug) {
      throw new Error("Category slug is required.");
    }

    let slug =
      baseSlug;

    let counter =
      2;

    while (
      true
    ) {
      const query: Record<
        string,
        unknown
      > = {
        slug,
      };

      if (
        excludeId
      ) {
        query._id = {
          $ne:
            excludeId,
        };
      }

      const existing =
        await Category.findOne(
          query
        )
          .select(
            "_id"
          )
          .lean();

      if (
        !existing
      ) {
        return slug;
      }

      slug =
        `${baseSlug}-${counter}`;

      counter +=
        1;
    }
  };

/* =========================================================
   PARENT INFORMATION
========================================================= */

const getParentInformation =
  async (
    parentId?:
      | string
      | null
  ) => {
    if (
      !parentId
    ) {
      return {
        parent:
          null,

        ancestors:
          [] as Types.ObjectId[],

        level:
          0,
      };
    }

    if (
      !Types.ObjectId.isValid(
        parentId
      )
    ) {
      throw new Error(
        "Invalid parent category ID."
      );
    }

    const parent =
      await Category.findById(
        parentId
      );

    if (
      !parent
    ) {
      throw new Error(
        "Parent category not found."
      );
    }

    return {
      parent:
        parent._id,

      ancestors: [
        ...parent.ancestors,
        parent._id,
      ] as Types.ObjectId[],

      level:
        parent.level +
        1,
    };
  };

/* =========================================================
   CREATE CATEGORY
========================================================= */

export const createCategory =
  async (
    input: CreateCategoryInput
  ) => {
    const name =
      input.name.trim();

    if (
      !name
    ) {
      throw new Error(
        "Category name is required."
      );
    }

    const slug =
      await generateUniqueSlug(
        input.slug?.trim() || name
      );

    const parentInfo =
      await getParentInformation(
        input.parentId
      );

    const images =
      normalizeImages(
        input.images,
        name
      );

    const category =
      await Category.create({
        name,

        slug,

        description:
          input.description
            ?.trim() ||
          "",

        parent:
          parentInfo.parent,

        ancestors:
          parentInfo.ancestors,

        level:
          parentInfo.level,

        images,

        isActive:
          input.isActive ??
          true,

        sortOrder:
          input.sortOrder ??
          0,
      });

    /*
      Ensure:
      hivrasoft/category-images/<category-name>/<photo-name>
    */
    await ensureCategoryImagesFolder(
      category
    );

    return category;
  };

/* =========================================================
   GET ALL CATEGORIES
========================================================= */

export const getAllCategories =
  async () => {
    return Category.find()
      .sort({
        level:
          1,

        sortOrder:
          1,

        name:
          1,
      })
      .lean();
  };

/* =========================================================
   GET ACTIVE CATEGORIES
========================================================= */

export const getActiveCategories =
  async () => {
    return Category.find({
      isActive:
        true,
    })
      .sort({
        level:
          1,

        sortOrder:
          1,

        name:
          1,
      })
      .lean();
  };

/* =========================================================
   GET CATEGORY BY ID
========================================================= */

export const getCategoryById =
  async (
    categoryId: string
  ) => {
    if (
      !Types.ObjectId.isValid(
        categoryId
      )
    ) {
      throw new Error(
        "Invalid category ID."
      );
    }

    const category =
      await Category.findById(
        categoryId
      );

    if (
      !category
    ) {
      throw new Error(
        "Category not found."
      );
    }

    return category;
  };

/* =========================================================
   GET CATEGORY BY SLUG
========================================================= */

export const getCategoryBySlug =
  async (
    slug: string
  ) => {
    const category =
      await Category.findOne({
        slug:
          slug
            .trim()
            .toLowerCase(),
      });

    if (
      !category
    ) {
      throw new Error(
        "Category not found."
      );
    }

    return category;
  };

/* =========================================================
   REBUILD DESCENDANTS
========================================================= */

const rebuildDescendants =
  async (
    categoryId: string
  ) => {
    const descendants =
      await Category.find({
        ancestors:
          new Types.ObjectId(
            categoryId
          ),
      }).sort({
        level:
          1,
      });

    for (
      const descendant
      of descendants
    ) {
      if (
        !descendant.parent
      ) {
        descendant.ancestors =
          [];

        descendant.level =
          0;

        await descendant.save();

        continue;
      }

      const parent =
        await Category.findById(
          descendant.parent
        );

      if (
        !parent
      ) {
        continue;
      }

      descendant.ancestors =
        [
          ...parent.ancestors,
          parent._id,
        ] as Types.ObjectId[];

      descendant.level =
        parent.level +
        1;

      await descendant.save();
    }
  };

/* =========================================================
   UPDATE CATEGORY
========================================================= */

export const updateCategory =
  async (
    categoryId: string,
    input: UpdateCategoryInput
  ) => {
    if (
      !Types.ObjectId.isValid(
        categoryId
      )
    ) {
      throw new Error(
        "Invalid category ID."
      );
    }

    const category =
      await Category.findById(
        categoryId
      );

    if (
      !category
    ) {
      throw new Error(
        "Category not found."
      );
    }

    /* NAME */

    if (
      input.name !==
      undefined
    ) {
      const name =
        input.name.trim();

      if (
        !name
      ) {
        throw new Error(
          "Category name cannot be empty."
        );
      }

      category.name =
        name;

      if (input.slug === undefined) {
        category.slug =
          await generateUniqueSlug(
            name,
            categoryId
          );
      }
    }

    /* MANUAL / AUTO SLUG */

    if (input.slug !== undefined) {
      category.slug =
        await generateUniqueSlug(
          input.slug.trim() || category.name,
          categoryId
        );
    }

    /* DESCRIPTION */

    if (
      input.description !==
      undefined
    ) {
      category.description =
        input.description.trim();
    }

    /* IMAGES */

    let removedImagePublicIds:
      string[] =
      [];

    if (
      input.images !==
      undefined
    ) {
      const nextImages =
        normalizeImages(
          input.images,
          category.name
        );

      const nextPublicIds =
        new Set(
          nextImages.map(
            (
              image
            ) =>
              image.publicId
          )
        );

      removedImagePublicIds =
        category.images
          .filter(
            (
              image
            ) =>
              !nextPublicIds.has(
                image.publicId
              )
          )
          .map(
            (
              image
            ) =>
              image.publicId
          );

      category.images =
        nextImages;
    }

    /* ACTIVE */

    if (
      input.isActive !==
      undefined
    ) {
      category.isActive =
        input.isActive;
    }

    /* SORT ORDER */

    if (
      input.sortOrder !==
      undefined
    ) {
      category.sortOrder =
        input.sortOrder;
    }

    /* PARENT CHANGE */

    let hierarchyChanged =
      false;

    if (
      input.parentId !==
      undefined
    ) {
      if (
        input.parentId ===
        categoryId
      ) {
        throw new Error(
          "Category cannot be its own parent."
        );
      }

      if (
        input.parentId
      ) {
        if (
          !Types.ObjectId.isValid(
            input.parentId
          )
        ) {
          throw new Error(
            "Invalid parent category ID."
          );
        }

        const newParent =
          await Category.findById(
            input.parentId
          );

        if (
          !newParent
        ) {
          throw new Error(
            "Parent category not found."
          );
        }

        const isDescendant =
          newParent.ancestors.some(
            (
              ancestorId
            ) =>
              String(
                ancestorId
              ) ===
              categoryId
          );

        if (
          isDescendant
        ) {
          throw new Error(
            "A child category cannot become the parent of its own ancestor."
          );
        }

        category.parent =
          newParent._id;

        category.ancestors =
          [
            ...newParent.ancestors,
            newParent._id,
          ] as Types.ObjectId[];

        category.level =
          newParent.level +
          1;
      } else {
        category.parent =
          null;

        category.ancestors =
          [];

        category.level =
          0;
      }

      hierarchyChanged =
        true;
    }

    /*
      First DB save.
      Agar DB save fail hua to old Cloudinary image
      abhi bhi safe rahegi.
    */
    await category.save();

    /*
      Successful DB update ke baad form se removed
      images Cloudinary se delete.
    */
    if (
      removedImagePublicIds.length >
      0
    ) {
      await deleteCloudinaryImages(
        removedImagePublicIds
      );

      const removedFolders =
        Array.from(
          new Set(
            removedImagePublicIds
              .map(
                getCloudinaryFolderFromPublicId
              )
              .filter(
                Boolean
              )
          )
        );

      await Promise.allSettled(
        removedFolders.map(
          (
            folder
          ) =>
            deleteCloudinaryFolderIfEmpty(
              folder
            )
        )
      );
    }

    /*
      Name change / folder mismatch:
      all retained images are moved into current category folder.
    */
    await ensureCategoryImagesFolder(
      category
    );

    if (
      hierarchyChanged
    ) {
      await rebuildDescendants(
        categoryId
      );
    }

    return category;
  };

/* =========================================================
   DELETE CATEGORY + DESCENDANTS + CLOUDINARY IMAGES

   Example:

   women
   └── Bra
       └── Sports Bra

   cascade: true

   DELETE women
      ↓
   women + Bra + Sports Bra images delete from Cloudinary
      ↓
   deleted category IDs are removed from Product.categories[]
      ↓
   all category documents are deleted
      ↓
   empty Cloudinary folders cleanup
========================================================= */

export const deleteCategory =
  async (
    categoryId: string,
    options: DeleteCategoryOptions = {}
  ) => {
    if (!Types.ObjectId.isValid(categoryId)) {
      throw new Error("Invalid category ID.");
    }

    const categoryObjectId = new Types.ObjectId(categoryId);
    const category = await Category.findById(categoryObjectId);
    if (!category) throw new Error("Category not found.");

    const subtree = await Category.find({
      $or: [{ _id: categoryObjectId }, { ancestors: categoryObjectId }],
    }).sort({ level: -1 });

    const descendantCount = Math.max(0, subtree.length - 1);
    if (descendantCount > 0 && !options.cascade) {
      throw new Error(
        `"${category.name}" has ${descendantCount} subcategor${
          descendantCount === 1 ? "y" : "ies"
        }. Use cascade delete to delete the complete category tree.`
      );
    }

    let moved = 0;
    for (const item of subtree) {
      await softDeleteEntity("category", String(item._id), options.deletedBy);
      moved += 1;
    }

    return {
      message:
        moved > 1
          ? `"${category.name}" and all subcategories moved to Trash.`
          : `"${category.name}" moved to Trash.`,
      deletedCategories: moved,
      deletedSubcategories: Math.max(0, moved - 1),
      deletedImages: 0,
      updatedProducts: 0,
      movedToTrash: true,
      retentionDays: 30,
    };
  };

/* =========================================================
   CATEGORY TREE
========================================================= */

export const getCategoryTree =
  async (
    activeOnly =
      false
  ): Promise<
    CategoryTreeNode[]
  > => {
    const filter =
      activeOnly
        ? {
            isActive:
              true,
          }
        : {};

    const categories =
      await Category.find(
        filter
      ).sort({
        level:
          1,

        sortOrder:
          1,

        name:
          1,
      });

    const map =
      new Map<
        string,
        CategoryTreeNode
      >();

    const roots:
      CategoryTreeNode[] =
      [];

    for (
      const category
      of categories
    ) {
      const id =
        String(
          category._id
        );

      map.set(
        id,
        {
          id,

          name:
            category.name,

          slug:
            category.slug,

          description:
            category.description ||
            "",

          parent:
            category.parent
              ? String(
                  category.parent
                )
              : null,

          ancestors:
            category.ancestors.map(
              (
                ancestor
              ) =>
                String(
                  ancestor
                )
            ),

          level:
            category.level,

          images:
            category.images.map(
              (
                image
              ) => ({
                url:
                  image.url,

                publicId:
                  image.publicId,

                alt:
                  image.alt,
              })
            ),

          isActive:
            category.isActive,

          sortOrder:
            category.sortOrder,

          children:
            [],
        }
      );
    }

    for (
      const category
      of categories
    ) {
      const id =
        String(
          category._id
        );

      const node =
        map.get(
          id
        );

      if (
        !node
      ) {
        continue;
      }

      if (
        category.parent
      ) {
        const parentNode =
          map.get(
            String(
              category.parent
            )
          );

        if (
          parentNode
        ) {
          parentNode.children.push(
            node
          );

          continue;
        }
      }

      roots.push(
        node
      );
    }

    return roots;
  };
