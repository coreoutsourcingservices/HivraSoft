"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBannerController = exports.updateBannerController = exports.getBannerBySlugController = exports.getBannerByIdController = exports.getActiveBannersController = exports.getAllBannersController = exports.createBannerController = void 0;
const banner_service_1 = require("../services/banner.service");
/* =========================================================
   ROUTE PARAM
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
   PARSERS
========================================================= */
const parseBoolean = (value, defaultValue) => {
    if (value === undefined ||
        value === null ||
        value === "") {
        return defaultValue;
    }
    if (typeof value ===
        "boolean") {
        return value;
    }
    return (String(value).toLowerCase() ===
        "true");
};
const parseOptionalBoolean = (value) => {
    if (value === undefined) {
        return undefined;
    }
    return parseBoolean(value, false);
};
const parseNumber = (value, defaultValue = 0) => {
    if (value === undefined ||
        value === null ||
        value === "") {
        return defaultValue;
    }
    const result = Number(value);
    if (Number.isNaN(result)) {
        return defaultValue;
    }
    return result;
};
const parseOptionalNumber = (value) => {
    if (value === undefined) {
        return undefined;
    }
    return parseNumber(value);
};
const parseJsonArray = (value, fieldName) => {
    if (value === undefined ||
        value === null ||
        value === "") {
        return [];
    }
    if (Array.isArray(value)) {
        return value;
    }
    try {
        const parsed = JSON.parse(String(value));
        if (!Array.isArray(parsed)) {
            throw new Error();
        }
        return parsed;
    }
    catch {
        throw new Error(`${fieldName} must be a valid JSON array.`);
    }
};
const parseOptionalJsonArray = (value, fieldName) => {
    if (value === undefined) {
        return undefined;
    }
    return parseJsonArray(value, fieldName);
};
/* =========================================================
   FILES
========================================================= */
const getBannerFiles = (req) => {
    const files = (req.files || {});
    return {
        images: files.images || [],
        videos: files.videos || [],
        posters: files.posters || [],
    };
};
/* =========================================================
   CREATE BODY
========================================================= */
const getCreateData = (req) => {
    return {
        title: String(req.body.title || ""),
        slug: String(req.body.slug || ""),
        description: String(req.body.description || ""),
        mediaType: (req.body.mediaType ===
            "video"
            ? "video"
            : "image"),
        position: (req.body.position ||
            "home_hero"),
        device: (req.body.device ||
            "all"),
        sortOrder: parseNumber(req.body.sortOrder, 0),
        isActive: parseBoolean(req.body.isActive, true),
        itemsMeta: parseJsonArray(req.body.itemsMeta, "itemsMeta"),
    };
};
/* =========================================================
   UPDATE BODY
========================================================= */
const getUpdateData = (req) => {
    const data = {};
    if (req.body.title !==
        undefined) {
        data.title =
            String(req.body.title);
    }
    if (req.body.slug !==
        undefined) {
        data.slug =
            String(req.body.slug);
    }
    if (req.body.description !==
        undefined) {
        data.description =
            String(req.body.description);
    }
    if (req.body.mediaType !==
        undefined) {
        data.mediaType =
            req.body.mediaType;
    }
    if (req.body.position !==
        undefined) {
        data.position =
            req.body.position;
    }
    if (req.body.device !==
        undefined) {
        data.device =
            req.body.device;
    }
    if (req.body.sortOrder !==
        undefined) {
        data.sortOrder =
            parseOptionalNumber(req.body.sortOrder);
    }
    if (req.body.isActive !==
        undefined) {
        data.isActive =
            parseOptionalBoolean(req.body.isActive);
    }
    if (req.body.itemsMeta !==
        undefined) {
        data.itemsMeta =
            parseJsonArray(req.body.itemsMeta, "itemsMeta");
    }
    data.existingItemsMeta =
        parseOptionalJsonArray(req.body.existingItemsMeta, "existingItemsMeta");
    return data;
};
/* =========================================================
   CREATE
========================================================= */
const createBannerController = async (req, res) => {
    try {
        const banner = await (0, banner_service_1.createBanner)(getCreateData(req), getBannerFiles(req));
        return res
            .status(201)
            .json({
            success: true,
            message: "Banner created successfully.",
            data: banner,
        });
    }
    catch (error) {
        return res
            .status(400)
            .json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Failed to create banner.",
        });
    }
};
exports.createBannerController = createBannerController;
/* =========================================================
   GET ALL
========================================================= */
const getAllBannersController = async (_req, res) => {
    try {
        const banners = await (0, banner_service_1.getAllBanners)();
        return res
            .status(200)
            .json({
            success: true,
            message: "Banners fetched successfully.",
            count: banners.length,
            data: banners,
        });
    }
    catch (error) {
        return res
            .status(500)
            .json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Failed to fetch banners.",
        });
    }
};
exports.getAllBannersController = getAllBannersController;
/* =========================================================
   GET ACTIVE
========================================================= */
const getActiveBannersController = async (req, res) => {
    try {
        const position = typeof req.query.position ===
            "string"
            ? req.query.position
            : undefined;
        const device = typeof req.query.device ===
            "string"
            ? req.query.device
            : undefined;
        const banners = await (0, banner_service_1.getActiveBanners)(position, device);
        return res
            .status(200)
            .json({
            success: true,
            message: "Active banners fetched successfully.",
            count: banners.length,
            data: banners,
        });
    }
    catch (error) {
        return res
            .status(500)
            .json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Failed to fetch active banners.",
        });
    }
};
exports.getActiveBannersController = getActiveBannersController;
/* =========================================================
   GET ONE BY ID
========================================================= */
const getBannerByIdController = async (req, res) => {
    try {
        const bannerId = getRouteParam(req.params.id, "Banner ID");
        const banner = await (0, banner_service_1.getBannerById)(bannerId);
        return res
            .status(200)
            .json({
            success: true,
            message: "Banner fetched successfully.",
            data: banner,
        });
    }
    catch (error) {
        return res
            .status(404)
            .json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Banner not found.",
        });
    }
};
exports.getBannerByIdController = getBannerByIdController;
/* =========================================================
   GET BY SLUG
========================================================= */
const getBannerBySlugController = async (req, res) => {
    try {
        const slug = getRouteParam(req.params.slug, "Banner slug");
        const banner = await (0, banner_service_1.getBannerBySlug)(slug);
        return res
            .status(200)
            .json({
            success: true,
            message: "Banner fetched successfully.",
            data: banner,
        });
    }
    catch (error) {
        return res
            .status(404)
            .json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Banner not found.",
        });
    }
};
exports.getBannerBySlugController = getBannerBySlugController;
/* =========================================================
   UPDATE
========================================================= */
const updateBannerController = async (req, res) => {
    try {
        const bannerId = getRouteParam(req.params.id, "Banner ID");
        const banner = await (0, banner_service_1.updateBanner)(bannerId, getUpdateData(req), getBannerFiles(req));
        return res
            .status(200)
            .json({
            success: true,
            message: "Banner updated successfully.",
            data: banner,
        });
    }
    catch (error) {
        return res
            .status(400)
            .json({
            success: false,
            message: error instanceof Error
                ? error.message
                : "Failed to update banner.",
        });
    }
};
exports.updateBannerController = updateBannerController;
/* =========================================================
   DELETE
========================================================= */
const deleteBannerController = async (req, res) => {
    try {
        const bannerId = getRouteParam(req.params.id, "Banner ID");
        const result = await (0, banner_service_1.deleteBanner)(bannerId);
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
            : "Failed to delete banner.";
        return res
            .status(message ===
            "Banner not found."
            ? 404
            : 400)
            .json({
            success: false,
            message,
        });
    }
};
exports.deleteBannerController = deleteBannerController;
//# sourceMappingURL=banner.controller.js.map