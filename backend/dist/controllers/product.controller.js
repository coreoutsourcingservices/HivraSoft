"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProductController = exports.deleteProductSizeController = exports.updateProductSizeController = exports.addProductSizeController = exports.setDefaultProductColorController = exports.setDefaultProductColorImageController = exports.deleteProductColorImageController = exports.uploadProductColorImagesController = exports.updateProductController = exports.getProductBySlugController = exports.getProductByIdController = exports.getCatalogProductBySlugController = exports.getCatalogProductsController = exports.getRelatedProductsController = exports.getNewLaunchProductsController = exports.getFeaturedProductsController = exports.getActiveProductsController = exports.getAllProductsController = exports.createProductController = void 0;
const product_service_1 = require("../services/product.service");
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
   ERROR MESSAGE
========================================================= */
const getErrorMessage = (error, fallback) => {
    return error instanceof Error
        ? error.message
        : fallback;
};
/* =========================================================
   CREATE PRODUCT
   ADMIN
========================================================= */
const createProductController = async (req, res) => {
    try {
        const { categories, isColor, colors, isActive, isFeatured, isNewLaunch, } = req.body;
        if (!Array.isArray(categories) ||
            categories.length === 0) {
            return res
                .status(400)
                .json({
                success: false,
                message: "At least one category is required.",
            });
        }
        const product = await (0, product_service_1.createProduct)({
            categories,
            isColor,
            colors,
            isActive,
            isFeatured,
            isNewLaunch,
        });
        return res
            .status(201)
            .json({
            success: true,
            message: "Product created successfully.",
            product,
        });
    }
    catch (error) {
        return res
            .status(400)
            .json({
            success: false,
            message: getErrorMessage(error, "Unable to create product."),
        });
    }
};
exports.createProductController = createProductController;
/* =========================================================
   GET ALL PRODUCTS
   ADMIN
========================================================= */
const getAllProductsController = async (_req, res) => {
    try {
        const products = await (0, product_service_1.getAllProducts)();
        return res
            .status(200)
            .json({
            success: true,
            count: products.length,
            products,
        });
    }
    catch (error) {
        return res
            .status(500)
            .json({
            success: false,
            message: getErrorMessage(error, "Unable to load products."),
        });
    }
};
exports.getAllProductsController = getAllProductsController;
/* =========================================================
   GET ACTIVE PRODUCTS
   PUBLIC
========================================================= */
const getActiveProductsController = async (_req, res) => {
    try {
        const products = await (0, product_service_1.getActiveProducts)();
        return res
            .status(200)
            .json({
            success: true,
            count: products.length,
            products,
        });
    }
    catch (error) {
        return res
            .status(500)
            .json({
            success: false,
            message: getErrorMessage(error, "Unable to load active products."),
        });
    }
};
exports.getActiveProductsController = getActiveProductsController;
/* =========================================================
   FEATURED PRODUCTS
   PUBLIC
========================================================= */
const getFeaturedProductsController = async (_req, res) => {
    try {
        const products = await (0, product_service_1.getFeaturedProducts)();
        return res
            .status(200)
            .json({
            success: true,
            count: products.length,
            products,
        });
    }
    catch (error) {
        return res
            .status(500)
            .json({
            success: false,
            message: getErrorMessage(error, "Unable to load featured products."),
        });
    }
};
exports.getFeaturedProductsController = getFeaturedProductsController;
/* =========================================================
   NEW LAUNCH PRODUCTS
   PUBLIC
========================================================= */
const getNewLaunchProductsController = async (_req, res) => {
    try {
        const products = await (0, product_service_1.getNewLaunchProducts)();
        return res
            .status(200)
            .json({
            success: true,
            count: products.length,
            products,
        });
    }
    catch (error) {
        return res
            .status(500)
            .json({
            success: false,
            message: getErrorMessage(error, "Unable to load new launch products."),
        });
    }
};
exports.getNewLaunchProductsController = getNewLaunchProductsController;
/* =========================================================
   RELATED PRODUCTS
   PUBLIC

   GET /api/products/:id/related?limit=4
   GET /api/products/:id/related?limit=5
========================================================= */
const getRelatedProductsController = async (req, res) => {
    try {
        const productId = getRouteParam(req.params.id, "Product ID");
        const requestedLimit = Number(req.query.limit || 5);
        const limit = requestedLimit === 4
            ? 4
            : 5;
        const products = await (0, product_service_1.getRelatedProducts)(productId, limit);
        return res
            .status(200)
            .json({
            success: true,
            count: products.length,
            limit,
            products,
        });
    }
    catch (error) {
        const message = getErrorMessage(error, "Unable to load related products.");
        return res
            .status(message ===
            "Product not found."
            ? 404
            : 400)
            .json({
            success: false,
            message,
        });
    }
};
exports.getRelatedProductsController = getRelatedProductsController;
/* =========================================================
   CLEAN PRODUCT CATALOG
   PUBLIC / FRONTEND
========================================================= */
const getCatalogProductsController = async (_req, res) => {
    try {
        const products = await (0, product_service_1.getProductCatalog)();
        return res
            .status(200)
            .json({
            success: true,
            count: products.length,
            products,
        });
    }
    catch (error) {
        return res
            .status(500)
            .json({
            success: false,
            message: getErrorMessage(error, "Unable to load product catalog."),
        });
    }
};
exports.getCatalogProductsController = getCatalogProductsController;
/* =========================================================
   CATALOG PRODUCT BY SLUG
   PUBLIC / FRONTEND
========================================================= */
const getCatalogProductBySlugController = async (req, res) => {
    try {
        const slug = getRouteParam(req.params.slug, "Product slug");
        const product = await (0, product_service_1.getCatalogProductBySlug)(slug);
        return res
            .status(200)
            .json({
            success: true,
            product,
        });
    }
    catch (error) {
        return res
            .status(404)
            .json({
            success: false,
            message: getErrorMessage(error, "Product not found."),
        });
    }
};
exports.getCatalogProductBySlugController = getCatalogProductBySlugController;
/* =========================================================
   GET PRODUCT BY ID
   ADMIN
========================================================= */
const getProductByIdController = async (req, res) => {
    try {
        const id = getRouteParam(req.params.id, "Product ID");
        const product = await (0, product_service_1.getProductById)(id);
        return res
            .status(200)
            .json({
            success: true,
            product,
        });
    }
    catch (error) {
        return res
            .status(404)
            .json({
            success: false,
            message: getErrorMessage(error, "Product not found."),
        });
    }
};
exports.getProductByIdController = getProductByIdController;
/* =========================================================
   GET PRODUCT BY SLUG
   PUBLIC
========================================================= */
const getProductBySlugController = async (req, res) => {
    try {
        const slug = getRouteParam(req.params.slug, "Product slug");
        const product = await (0, product_service_1.getProductBySlug)(slug);
        return res
            .status(200)
            .json({
            success: true,
            product,
        });
    }
    catch (error) {
        return res
            .status(404)
            .json({
            success: false,
            message: getErrorMessage(error, "Product not found."),
        });
    }
};
exports.getProductBySlugController = getProductBySlugController;
/* =========================================================
   UPDATE PRODUCT
   ADMIN
========================================================= */
const updateProductController = async (req, res) => {
    try {
        const id = getRouteParam(req.params.id, "Product ID");
        const product = await (0, product_service_1.updateProduct)(id, {
            categories: req.body.categories,
            isColor: req.body.isColor,
            colors: req.body.colors,
            isActive: req.body.isActive,
            isFeatured: req.body.isFeatured,
            isNewLaunch: req.body.isNewLaunch,
        });
        return res
            .status(200)
            .json({
            success: true,
            message: "Product updated successfully.",
            product,
        });
    }
    catch (error) {
        return res
            .status(400)
            .json({
            success: false,
            message: getErrorMessage(error, "Unable to update product."),
        });
    }
};
exports.updateProductController = updateProductController;
/* =========================================================
   UPLOAD COLOR IMAGES
   ADMIN
========================================================= */
const uploadProductColorImagesController = async (req, res) => {
    try {
        const id = getRouteParam(req.params.id, "Product ID");
        const colorSlug = getRouteParam(req.params.colorSlug, "Color slug");
        const files = req.files;
        if (!files ||
            files.length === 0) {
            return res
                .status(400)
                .json({
                success: false,
                message: "At least one image is required.",
            });
        }
        let imageMeta = [];
        if (typeof req.body?.imageMeta ===
            "string") {
            try {
                const parsed = JSON.parse(req.body.imageMeta);
                if (Array.isArray(parsed)) {
                    imageMeta = parsed;
                }
            }
            catch {
                imageMeta = [];
            }
        }
        const result = await (0, product_service_1.uploadProductColorImages)(id, colorSlug, files.map((file, index) => ({
            buffer: file.buffer,
            originalname: file.originalname,
            name: typeof imageMeta[index]?.name ===
                "string"
                ? imageMeta[index].name
                : "",
            alt: typeof imageMeta[index]?.alt ===
                "string"
                ? imageMeta[index].alt
                : "",
            isDefault: typeof imageMeta[index]?.isDefault ===
                "boolean"
                ? imageMeta[index].isDefault
                : undefined,
        })));
        return res
            .status(201)
            .json({
            success: true,
            message: "Product images uploaded successfully.",
            ...result,
        });
    }
    catch (error) {
        return res
            .status(400)
            .json({
            success: false,
            message: getErrorMessage(error, "Unable to upload product images."),
        });
    }
};
exports.uploadProductColorImagesController = uploadProductColorImagesController;
/* =========================================================
   DELETE COLOR IMAGE
   ADMIN

   BODY:
   {
     "publicId": "hivrasoft/products/.../image-01"
   }
========================================================= */
const deleteProductColorImageController = async (req, res) => {
    try {
        const id = getRouteParam(req.params.id, "Product ID");
        const colorSlug = getRouteParam(req.params.colorSlug, "Color slug");
        const publicId = String(req.body.publicId ||
            "").trim();
        if (!publicId) {
            return res
                .status(400)
                .json({
                success: false,
                message: "Image publicId is required.",
            });
        }
        const product = await (0, product_service_1.deleteProductColorImage)(id, colorSlug, publicId);
        return res
            .status(200)
            .json({
            success: true,
            message: "Product image deleted successfully.",
            product,
        });
    }
    catch (error) {
        return res
            .status(400)
            .json({
            success: false,
            message: getErrorMessage(error, "Unable to delete product image."),
        });
    }
};
exports.deleteProductColorImageController = deleteProductColorImageController;
/* =========================================================
   SET DEFAULT IMAGE
   ADMIN

   BODY:
   {
     "publicId": "..."
   }
========================================================= */
const setDefaultProductColorImageController = async (req, res) => {
    try {
        const id = getRouteParam(req.params.id, "Product ID");
        const colorSlug = getRouteParam(req.params.colorSlug, "Color slug");
        const publicId = String(req.body.publicId ||
            "").trim();
        if (!publicId) {
            return res
                .status(400)
                .json({
                success: false,
                message: "Image publicId is required.",
            });
        }
        const product = await (0, product_service_1.setDefaultProductColorImage)(id, colorSlug, publicId);
        return res
            .status(200)
            .json({
            success: true,
            message: "Default image updated successfully.",
            product,
        });
    }
    catch (error) {
        return res
            .status(400)
            .json({
            success: false,
            message: getErrorMessage(error, "Unable to update default image."),
        });
    }
};
exports.setDefaultProductColorImageController = setDefaultProductColorImageController;
/* =========================================================
   SET DEFAULT COLOR
   ADMIN
========================================================= */
const setDefaultProductColorController = async (req, res) => {
    try {
        const id = getRouteParam(req.params.id, "Product ID");
        const colorSlug = getRouteParam(req.params.colorSlug, "Color slug");
        const product = await (0, product_service_1.setDefaultProductColor)(id, colorSlug);
        return res
            .status(200)
            .json({
            success: true,
            message: "Default color updated successfully.",
            product,
        });
    }
    catch (error) {
        return res
            .status(400)
            .json({
            success: false,
            message: getErrorMessage(error, "Unable to update default color."),
        });
    }
};
exports.setDefaultProductColorController = setDefaultProductColorController;
/* =========================================================
   ADD SIZE
   ADMIN
========================================================= */
const addProductSizeController = async (req, res) => {
    try {
        const id = getRouteParam(req.params.id, "Product ID");
        const colorSlug = getRouteParam(req.params.colorSlug, "Color slug");
        const { size, stock, originalPrice, showPrice, discountPrice, isActive, } = req.body;
        const product = await (0, product_service_1.addProductSize)(id, colorSlug, {
            size,
            stock,
            originalPrice,
            showPrice,
            discountPrice,
            isActive,
        });
        return res
            .status(201)
            .json({
            success: true,
            message: "Product size added successfully.",
            product,
        });
    }
    catch (error) {
        return res
            .status(400)
            .json({
            success: false,
            message: getErrorMessage(error, "Unable to add product size."),
        });
    }
};
exports.addProductSizeController = addProductSizeController;
/* =========================================================
   UPDATE SIZE
   ADMIN
========================================================= */
const updateProductSizeController = async (req, res) => {
    try {
        const id = getRouteParam(req.params.id, "Product ID");
        const colorSlug = getRouteParam(req.params.colorSlug, "Color slug");
        const sizeId = getRouteParam(req.params.sizeId, "Size ID");
        const product = await (0, product_service_1.updateProductSize)(id, colorSlug, sizeId, {
            size: req.body.size,
            stock: req.body.stock,
            originalPrice: req.body.originalPrice,
            showPrice: req.body.showPrice,
            discountPrice: req.body.discountPrice,
            isActive: req.body.isActive,
        });
        return res
            .status(200)
            .json({
            success: true,
            message: "Product size updated successfully.",
            product,
        });
    }
    catch (error) {
        return res
            .status(400)
            .json({
            success: false,
            message: getErrorMessage(error, "Unable to update product size."),
        });
    }
};
exports.updateProductSizeController = updateProductSizeController;
/* =========================================================
   DELETE SIZE
   ADMIN
========================================================= */
const deleteProductSizeController = async (req, res) => {
    try {
        const id = getRouteParam(req.params.id, "Product ID");
        const colorSlug = getRouteParam(req.params.colorSlug, "Color slug");
        const sizeId = getRouteParam(req.params.sizeId, "Size ID");
        const product = await (0, product_service_1.deleteProductSize)(id, colorSlug, sizeId);
        return res
            .status(200)
            .json({
            success: true,
            message: "Product size deleted successfully.",
            product,
        });
    }
    catch (error) {
        return res
            .status(400)
            .json({
            success: false,
            message: getErrorMessage(error, "Unable to delete product size."),
        });
    }
};
exports.deleteProductSizeController = deleteProductSizeController;
/* =========================================================
   DELETE PRODUCT
   ADMIN
========================================================= */
const deleteProductController = async (req, res) => {
    try {
        const id = getRouteParam(req.params.id, "Product ID");
        const result = await (0, product_service_1.deleteProduct)(id, req.user?._id ? String(req.user._id) : null);
        return res
            .status(200)
            .json(result);
    }
    catch (error) {
        return res
            .status(400)
            .json({
            success: false,
            message: getErrorMessage(error, "Unable to delete product."),
        });
    }
};
exports.deleteProductController = deleteProductController;
//# sourceMappingURL=product.controller.js.map