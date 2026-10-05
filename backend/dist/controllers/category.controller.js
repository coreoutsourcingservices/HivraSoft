"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCategoryController = exports.updateCategoryController = exports.getCategoryByIdController = exports.getCategoryBySlugController = exports.getCategoryTreeController = exports.getActiveCategoriesController = exports.getAllCategoriesController = exports.createCategoryController = void 0;
const category_service_1 = require("../services/category.service");
/* =========================================================
   ROUTE PARAM HELPER
========================================================= */
const getRouteParam = (value, paramName) => {
    if (!value) {
        throw new Error(`${paramName} is required.`);
    }
    if (Array.isArray(value)) {
        if (!value[0]) {
            throw new Error(`${paramName} is required.`);
        }
        return value[0];
    }
    return value;
};
/* =========================================================
   CREATE CATEGORY
========================================================= */
const createCategoryController = async (req, res) => {
    try {
        const { name, slug, description, parentId, images, isActive, sortOrder, } = req.body;
        if (!name ||
            !String(name).trim()) {
            return res
                .status(400)
                .json({
                success: false,
                message: "Category name is required.",
            });
        }
        const category = await (0, category_service_1.createCategory)({
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
            message: "Category created successfully.",
            category,
        });
    }
    catch (error) {
        return res
            .status(400)
            .json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Unable to create category.",
        });
    }
};
exports.createCategoryController = createCategoryController;
/* =========================================================
   GET ALL CATEGORIES - ADMIN
========================================================= */
const getAllCategoriesController = async (_req, res) => {
    try {
        const categories = await (0, category_service_1.getAllCategories)();
        return res
            .status(200)
            .json({
            success: true,
            count: categories.length,
            categories,
            data: categories,
        });
    }
    catch (error) {
        return res
            .status(500)
            .json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Unable to load categories.",
        });
    }
};
exports.getAllCategoriesController = getAllCategoriesController;
/* =========================================================
   GET ACTIVE CATEGORIES - STOREFRONT
========================================================= */
const getActiveCategoriesController = async (_req, res) => {
    try {
        const categories = await (0, category_service_1.getActiveCategories)();
        return res
            .status(200)
            .json({
            success: true,
            count: categories.length,
            categories,
            data: categories,
        });
    }
    catch (error) {
        return res
            .status(500)
            .json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Unable to load categories.",
        });
    }
};
exports.getActiveCategoriesController = getActiveCategoriesController;
/* =========================================================
   GET CATEGORY TREE

   GET /api/categories/tree
   GET /api/categories/tree?active=true
========================================================= */
const getCategoryTreeController = async (req, res) => {
    try {
        const activeOnly = req.query.active ===
            "true";
        const categories = await (0, category_service_1.getCategoryTree)(activeOnly);
        return res
            .status(200)
            .json({
            success: true,
            count: categories.length,
            categories,
            data: categories,
        });
    }
    catch (error) {
        return res
            .status(500)
            .json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Unable to load category tree.",
        });
    }
};
exports.getCategoryTreeController = getCategoryTreeController;
/* =========================================================
   GET CATEGORY BY SLUG
========================================================= */
const getCategoryBySlugController = async (req, res) => {
    try {
        const slug = getRouteParam(req.params.slug, "Category slug");
        const category = await (0, category_service_1.getCategoryBySlug)(slug);
        return res
            .status(200)
            .json({
            success: true,
            category,
        });
    }
    catch (error) {
        return res
            .status(404)
            .json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Category not found.",
        });
    }
};
exports.getCategoryBySlugController = getCategoryBySlugController;
/* =========================================================
   GET CATEGORY BY ID
========================================================= */
const getCategoryByIdController = async (req, res) => {
    try {
        const id = getRouteParam(req.params.id, "Category ID");
        const category = await (0, category_service_1.getCategoryById)(id);
        return res
            .status(200)
            .json({
            success: true,
            category,
        });
    }
    catch (error) {
        return res
            .status(404)
            .json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Category not found.",
        });
    }
};
exports.getCategoryByIdController = getCategoryByIdController;
/* =========================================================
   UPDATE CATEGORY
========================================================= */
const updateCategoryController = async (req, res) => {
    try {
        const id = getRouteParam(req.params.id, "Category ID");
        const category = await (0, category_service_1.updateCategory)(id, {
            name: req.body.name,
            slug: req.body.slug,
            description: req.body.description,
            parentId: req.body.parentId,
            images: req.body.images,
            isActive: req.body.isActive,
            sortOrder: req.body.sortOrder,
        });
        return res
            .status(200)
            .json({
            success: true,
            message: "Category updated successfully.",
            category,
        });
    }
    catch (error) {
        return res
            .status(400)
            .json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Unable to update category.",
        });
    }
};
exports.updateCategoryController = updateCategoryController;
/* =========================================================
   DELETE CATEGORY

   DELETE /api/categories/:id
   DELETE /api/categories/:id?cascade=true
========================================================= */
const deleteCategoryController = async (req, res) => {
    try {
        const id = getRouteParam(req.params.id, "Category ID");
        const cascade = req.query.cascade ===
            "true";
        const result = await (0, category_service_1.deleteCategory)(id, {
            cascade,
            deletedBy: req.user?._id ? String(req.user._id) : null,
        });
        return res
            .status(200)
            .json({
            success: true,
            ...result,
        });
    }
    catch (error) {
        const message = error instanceof Error
            ? error.message
            : "Unable to delete category.";
        const statusCode = message.includes("Use cascade delete")
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
exports.deleteCategoryController = deleteCategoryController;
//# sourceMappingURL=category.controller.js.map