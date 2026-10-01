import {
  Request,
  Response,
} from "express";

import {
  createCategory,
  getAllCategories,
  getActiveCategories,
  getCategoryById,
  getCategoryBySlug,
  getCategoryTree,
  updateCategory,
  deleteCategory,
} from "../services/category.service";

/* =========================================================
   ROUTE PARAM HELPER
========================================================= */

const getRouteParam = (
  value:
    | string
    | string[]
    | undefined,
  paramName: string
): string => {
  if (!value) {
    throw new Error(
      `${paramName} is required.`
    );
  }

  if (
    Array.isArray(
      value
    )
  ) {
    if (!value[0]) {
      throw new Error(
        `${paramName} is required.`
      );
    }

    return value[0];
  }

  return value;
};

/* =========================================================
   CREATE CATEGORY
========================================================= */

export const createCategoryController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const {
        name,
        slug,
        description,
        parentId,
        images,
        isActive,
        sortOrder,
      } = req.body;

      if (
        !name ||
        !String(
          name
        ).trim()
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Category name is required.",
          });
      }

      const category =
        await createCategory({
          name,
          slug,
          description,
          parentId,
          images,
          isActive,
          sortOrder,
        });

      return res
        .status(201)
        .json({
          success: true,
          message:
            "Category created successfully.",
          category,
        });
    } catch (error) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Unable to create category.",
        });
    }
  };

/* =========================================================
   GET ALL CATEGORIES - ADMIN
========================================================= */

export const getAllCategoriesController =
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      const categories =
        await getAllCategories();

      return res
        .status(200)
        .json({
          success: true,
          count:
            categories.length,
          categories,
          data: categories,
        });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Unable to load categories.",
        });
    }
  };

/* =========================================================
   GET ACTIVE CATEGORIES - STOREFRONT
========================================================= */

export const getActiveCategoriesController =
  async (
    _req: Request,
    res: Response
  ) => {
    try {
      const categories =
        await getActiveCategories();

      return res
        .status(200)
        .json({
          success: true,
          count:
            categories.length,
          categories,
          data: categories,
        });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Unable to load categories.",
        });
    }
  };

/* =========================================================
   GET CATEGORY TREE

   GET /api/categories/tree
   GET /api/categories/tree?active=true
========================================================= */

export const getCategoryTreeController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const activeOnly =
        req.query.active ===
        "true";

      const categories =
        await getCategoryTree(
          activeOnly
        );

      return res
        .status(200)
        .json({
          success: true,
          count:
            categories.length,
          categories,
          data: categories,
        });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Unable to load category tree.",
        });
    }
  };

/* =========================================================
   GET CATEGORY BY SLUG
========================================================= */

export const getCategoryBySlugController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const slug =
        getRouteParam(
          req.params.slug,
          "Category slug"
        );

      const category =
        await getCategoryBySlug(
          slug
        );

      return res
        .status(200)
        .json({
          success: true,
          category,
        });
    } catch (error) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Category not found.",
        });
    }
  };

/* =========================================================
   GET CATEGORY BY ID
========================================================= */

export const getCategoryByIdController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id =
        getRouteParam(
          req.params.id,
          "Category ID"
        );

      const category =
        await getCategoryById(
          id
        );

      return res
        .status(200)
        .json({
          success: true,
          category,
        });
    } catch (error) {
      return res
        .status(404)
        .json({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Category not found.",
        });
    }
  };

/* =========================================================
   UPDATE CATEGORY
========================================================= */

export const updateCategoryController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id =
        getRouteParam(
          req.params.id,
          "Category ID"
        );

      const category =
        await updateCategory(
          id,
          {
            name:
              req.body.name,

            slug:
              req.body.slug,

            description:
              req.body.description,

            parentId:
              req.body.parentId,

            images:
              req.body.images,

            isActive:
              req.body.isActive,

            sortOrder:
              req.body.sortOrder,
          }
        );

      return res
        .status(200)
        .json({
          success: true,
          message:
            "Category updated successfully.",
          category,
        });
    } catch (error) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : "Unable to update category.",
        });
    }
  };

/* =========================================================
   DELETE CATEGORY

   DELETE /api/categories/:id
   DELETE /api/categories/:id?cascade=true
========================================================= */

export const deleteCategoryController =
  async (
    req: Request,
    res: Response
  ) => {
    try {
      const id =
        getRouteParam(
          req.params.id,
          "Category ID"
        );

      const cascade =
        req.query.cascade ===
        "true";

      const result =
        await deleteCategory(
          id,
          {
            cascade,
          }
        );

      return res
        .status(200)
        .json({
          success: true,
          ...result,
        });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to delete category.";

      const statusCode =
        message.includes(
          "Use cascade delete"
        )
          ? 409
          : message ===
              "Category not found."
            ? 404
            : 400;

      return res
        .status(statusCode)
        .json({
          success: false,
          message,
        });
    }
  };
