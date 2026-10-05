"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBanner = exports.updateBanner = exports.getBannerBySlug = exports.getBannerById = exports.getActiveBanners = exports.getAllBanners = exports.createBanner = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Banner_model_1 = __importDefault(require("../models/Banner.model"));
const Category_model_1 = __importDefault(require("../models/Category.model"));
const Product_model_1 = __importDefault(require("../models/Product.model"));
const cloudinary_service_1 = require("./cloudinary.service");
const admin_trash_service_1 = require("./admin-trash.service");
/* =========================================================
   POPULATE
========================================================= */
const populateBanner = async (bannerId) => {
    return Banner_model_1.default.findById(bannerId)
        .populate("images.category", "name slug image level parent isActive")
        .populate("images.product", "name slug price compareAtPrice mainImages status")
        .populate("videos.category", "name slug image level parent isActive")
        .populate("videos.product", "name slug price compareAtPrice mainImages status");
};
/* =========================================================
   HELPERS
========================================================= */
const validateBannerId = (bannerId) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(bannerId)) {
        throw new Error("Invalid banner ID.");
    }
};
const toNullableObjectId = (value) => {
    if (!value) {
        return null;
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(value)) {
        throw new Error(`Invalid reference ID: ${value}`);
    }
    return new mongoose_1.default.Types.ObjectId(value);
};
const validateOneItemMeta = async (meta) => {
    const linkType = meta.linkType ||
        "none";
    if (linkType === "custom") {
        if (!meta.customLink?.trim()) {
            throw new Error("Custom link is required for a media item.");
        }
        return;
    }
    if (linkType === "category") {
        if (!meta.category) {
            throw new Error("Category is required for a media item.");
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(meta.category)) {
            throw new Error("Invalid category ID in banner media.");
        }
        const exists = await Category_model_1.default.exists({
            _id: meta.category,
        });
        if (!exists) {
            throw new Error("Selected category does not exist.");
        }
        return;
    }
    if (linkType === "product") {
        if (!meta.product) {
            throw new Error("Product is required for a media item.");
        }
        if (!mongoose_1.default.Types.ObjectId.isValid(meta.product)) {
            throw new Error("Invalid product ID in banner media.");
        }
        const exists = await Product_model_1.default.exists({
            _id: meta.product,
        });
        if (!exists) {
            throw new Error("Selected product does not exist.");
        }
    }
};
const validateItemsMeta = async (itemsMeta) => {
    for (const meta of itemsMeta) {
        await validateOneItemMeta(meta);
    }
};
const commonMediaData = (meta) => {
    const linkType = meta.linkType ||
        "none";
    return {
        title: meta.title?.trim() ||
            "",
        subtitle: meta.subtitle?.trim() ||
            "",
        description: meta.description?.trim() ||
            "",
        buttonText: meta.buttonText?.trim() ||
            "Shop Now",
        linkType,
        customLink: linkType === "custom"
            ? meta.customLink?.trim() ||
                ""
            : "",
        category: linkType === "category"
            ? toNullableObjectId(meta.category)
            : null,
        product: linkType === "product"
            ? toNullableObjectId(meta.product)
            : null,
        openInNewTab: meta.openInNewTab ??
            false,
    };
};
/* =========================================================
   CLOUDINARY DELETE HELPERS
========================================================= */
const deleteBannerImages = async (images) => {
    const publicIds = images
        .map(image => image.publicId)
        .filter(Boolean);
    if (publicIds.length > 0) {
        await (0, cloudinary_service_1.deleteCloudinaryImages)(publicIds);
    }
};
const deleteBannerVideos = async (videos) => {
    const videoIds = videos
        .map(video => video.publicId)
        .filter(Boolean);
    const posterIds = videos
        .map(video => video.poster
        ?.publicId)
        .filter((value) => Boolean(value));
    if (videoIds.length > 0) {
        await (0, cloudinary_service_1.deleteCloudinaryVideos)(videoIds);
    }
    if (posterIds.length > 0) {
        await (0, cloudinary_service_1.deleteCloudinaryImages)(posterIds);
    }
};
/* =========================================================
   CLOUDINARY UPLOAD - IMAGES
========================================================= */
const uploadBannerImages = async (files, itemsMeta) => {
    const uploaded = [];
    try {
        for (let index = 0; index < files.length; index++) {
            const file = files[index];
            const meta = itemsMeta[index] ||
                {};
            await validateOneItemMeta(meta);
            const result = await (0, cloudinary_service_1.uploadImageBuffer)(file.buffer, "hivrasoft/banners/images");
            uploaded.push({
                url: result.secure_url,
                publicId: result.public_id,
                alt: meta.alt?.trim() ||
                    meta.title?.trim() ||
                    "",
                ...commonMediaData(meta),
            });
        }
        return uploaded;
    }
    catch (error) {
        await deleteBannerImages(uploaded).catch(() => { });
        throw error;
    }
};
/* =========================================================
   CLOUDINARY UPLOAD - VIDEOS
========================================================= */
const uploadBannerVideos = async (videoFiles, posterFiles, itemsMeta) => {
    const uploaded = [];
    try {
        for (let index = 0; index < videoFiles.length; index++) {
            const file = videoFiles[index];
            const meta = itemsMeta[index] ||
                {};
            await validateOneItemMeta(meta);
            const videoResult = await (0, cloudinary_service_1.uploadVideoBuffer)(file.buffer, "hivrasoft/banners/videos");
            let poster;
            const posterFileIndex = typeof meta.posterFileIndex ===
                "number"
                ? meta.posterFileIndex
                : null;
            if (posterFileIndex !==
                null &&
                posterFiles[posterFileIndex]) {
                try {
                    const posterResult = await (0, cloudinary_service_1.uploadImageBuffer)(posterFiles[posterFileIndex].buffer, "hivrasoft/banners/posters");
                    poster = {
                        url: posterResult.secure_url,
                        publicId: posterResult.public_id,
                    };
                }
                catch (error) {
                    await (0, cloudinary_service_1.deleteCloudinaryVideos)([
                        videoResult.public_id,
                    ]).catch(() => { });
                    throw error;
                }
            }
            uploaded.push({
                url: videoResult.secure_url,
                publicId: videoResult.public_id,
                poster,
                autoplay: meta.autoplay ??
                    true,
                muted: meta.muted ??
                    true,
                loop: meta.loop ??
                    true,
                controls: meta.controls ??
                    false,
                ...commonMediaData(meta),
            });
        }
        return uploaded;
    }
    catch (error) {
        await deleteBannerVideos(uploaded).catch(() => { });
        throw error;
    }
};
/* =========================================================
   EXISTING MEDIA METADATA UPDATE
========================================================= */
const buildExistingImages = async (oldImages, existingItemsMeta) => {
    if (existingItemsMeta ===
        undefined) {
        return oldImages;
    }
    const oldMap = new Map(oldImages.map(item => [
        item.publicId,
        item,
    ]));
    const result = [];
    for (const meta of existingItemsMeta) {
        if (!meta.publicId) {
            throw new Error("Existing image publicId is required.");
        }
        const oldItem = oldMap.get(meta.publicId);
        if (!oldItem) {
            throw new Error("Existing banner image was not found.");
        }
        await validateOneItemMeta(meta);
        result.push({
            url: oldItem.url,
            publicId: oldItem.publicId,
            alt: meta.alt !==
                undefined
                ? meta.alt
                : oldItem.alt,
            ...commonMediaData({
                title: meta.title !==
                    undefined
                    ? meta.title
                    : oldItem.title,
                subtitle: meta.subtitle !==
                    undefined
                    ? meta.subtitle
                    : oldItem.subtitle,
                description: meta.description !==
                    undefined
                    ? meta.description
                    : oldItem.description,
                buttonText: meta.buttonText !==
                    undefined
                    ? meta.buttonText
                    : oldItem.buttonText,
                linkType: meta.linkType !==
                    undefined
                    ? meta.linkType
                    : oldItem.linkType,
                customLink: meta.customLink !==
                    undefined
                    ? meta.customLink
                    : oldItem.customLink,
                category: meta.category !==
                    undefined
                    ? meta.category
                    : oldItem.category
                        ?.toString() ||
                        null,
                product: meta.product !==
                    undefined
                    ? meta.product
                    : oldItem.product
                        ?.toString() ||
                        null,
                openInNewTab: meta.openInNewTab !==
                    undefined
                    ? meta.openInNewTab
                    : oldItem.openInNewTab,
            }),
        });
    }
    return result;
};
const buildExistingVideos = async (oldVideos, existingItemsMeta) => {
    if (existingItemsMeta ===
        undefined) {
        return oldVideos;
    }
    const oldMap = new Map(oldVideos.map(item => [
        item.publicId,
        item,
    ]));
    const result = [];
    for (const meta of existingItemsMeta) {
        if (!meta.publicId) {
            throw new Error("Existing video publicId is required.");
        }
        const oldItem = oldMap.get(meta.publicId);
        if (!oldItem) {
            throw new Error("Existing banner video was not found.");
        }
        await validateOneItemMeta(meta);
        result.push({
            url: oldItem.url,
            publicId: oldItem.publicId,
            poster: oldItem.poster
                ? {
                    url: oldItem.poster.url,
                    publicId: oldItem.poster
                        .publicId,
                }
                : undefined,
            autoplay: meta.autoplay !==
                undefined
                ? meta.autoplay
                : oldItem.autoplay,
            muted: meta.muted !==
                undefined
                ? meta.muted
                : oldItem.muted,
            loop: meta.loop !==
                undefined
                ? meta.loop
                : oldItem.loop,
            controls: meta.controls !==
                undefined
                ? meta.controls
                : oldItem.controls,
            ...commonMediaData({
                title: meta.title !==
                    undefined
                    ? meta.title
                    : oldItem.title,
                subtitle: meta.subtitle !==
                    undefined
                    ? meta.subtitle
                    : oldItem.subtitle,
                description: meta.description !==
                    undefined
                    ? meta.description
                    : oldItem.description,
                buttonText: meta.buttonText !==
                    undefined
                    ? meta.buttonText
                    : oldItem.buttonText,
                linkType: meta.linkType !==
                    undefined
                    ? meta.linkType
                    : oldItem.linkType,
                customLink: meta.customLink !==
                    undefined
                    ? meta.customLink
                    : oldItem.customLink,
                category: meta.category !==
                    undefined
                    ? meta.category
                    : oldItem.category
                        ?.toString() ||
                        null,
                product: meta.product !==
                    undefined
                    ? meta.product
                    : oldItem.product
                        ?.toString() ||
                        null,
                openInNewTab: meta.openInNewTab !==
                    undefined
                    ? meta.openInNewTab
                    : oldItem.openInNewTab,
            }),
        });
    }
    return result;
};
/* =========================================================
   CREATE
========================================================= */
const createBanner = async (data, files) => {
    if (!data.title?.trim()) {
        throw new Error("Banner title is required.");
    }
    if (!data.slug?.trim()) {
        throw new Error("Banner slug is required.");
    }
    const slug = data.slug
        .trim()
        .toLowerCase();
    const existing = await Banner_model_1.default.findOne({
        slug,
    });
    if (existing) {
        throw new Error("Banner slug already exists.");
    }
    const itemsMeta = data.itemsMeta || [];
    await validateItemsMeta(itemsMeta);
    let images = [];
    let videos = [];
    try {
        if (data.mediaType ===
            "image") {
            if (files.images.length ===
                0) {
                throw new Error("Please upload at least one banner image.");
            }
            images =
                await uploadBannerImages(files.images, itemsMeta);
        }
        if (data.mediaType ===
            "video") {
            if (files.videos.length ===
                0) {
                throw new Error("Please upload at least one banner video.");
            }
            videos =
                await uploadBannerVideos(files.videos, files.posters, itemsMeta);
        }
        const banner = await Banner_model_1.default.create({
            title: data.title.trim(),
            slug,
            description: data.description?.trim() ||
                "",
            mediaType: data.mediaType,
            images,
            videos,
            position: data.position ||
                "home_hero",
            device: data.device ||
                "all",
            sortOrder: data.sortOrder ??
                0,
            isActive: data.isActive ??
                true,
        });
        return populateBanner(banner._id);
    }
    catch (error) {
        if (images.length > 0) {
            await deleteBannerImages(images).catch(() => { });
        }
        if (videos.length > 0) {
            await deleteBannerVideos(videos).catch(() => { });
        }
        throw error;
    }
};
exports.createBanner = createBanner;
/* =========================================================
   GET ALL
========================================================= */
const getAllBanners = async () => {
    return Banner_model_1.default.find()
        .populate("images.category", "name slug image level parent isActive")
        .populate("images.product", "name slug price compareAtPrice mainImages status")
        .populate("videos.category", "name slug image level parent isActive")
        .populate("videos.product", "name slug price compareAtPrice mainImages status")
        .sort({
        sortOrder: 1,
        createdAt: -1,
    });
};
exports.getAllBanners = getAllBanners;
/* =========================================================
   GET ACTIVE - STOREFRONT
========================================================= */
const getActiveBanners = async (position, device) => {
    const filter = {
        isActive: true,
    };
    if (position) {
        filter.position =
            position;
    }
    if (device === "desktop" ||
        device === "mobile") {
        filter.device = {
            $in: [
                "all",
                device,
            ],
        };
    }
    else if (device === "all") {
        filter.device = "all";
    }
    return Banner_model_1.default.find(filter)
        .populate("images.category", "name slug image level parent isActive")
        .populate("images.product", "name slug price compareAtPrice mainImages status")
        .populate("videos.category", "name slug image level parent isActive")
        .populate("videos.product", "name slug price compareAtPrice mainImages status")
        .sort({
        sortOrder: 1,
        createdAt: -1,
    });
};
exports.getActiveBanners = getActiveBanners;
/* =========================================================
   GET BY ID
========================================================= */
const getBannerById = async (bannerId) => {
    validateBannerId(bannerId);
    const banner = await populateBanner(bannerId);
    if (!banner) {
        throw new Error("Banner not found.");
    }
    return banner;
};
exports.getBannerById = getBannerById;
/* =========================================================
   GET BY SLUG
========================================================= */
const getBannerBySlug = async (slug) => {
    const banner = await Banner_model_1.default.findOne({
        slug: slug
            .trim()
            .toLowerCase(),
    })
        .populate("images.category", "name slug image level parent isActive")
        .populate("images.product", "name slug price compareAtPrice mainImages status")
        .populate("videos.category", "name slug image level parent isActive")
        .populate("videos.product", "name slug price compareAtPrice mainImages status");
    if (!banner) {
        throw new Error("Banner not found.");
    }
    return banner;
};
exports.getBannerBySlug = getBannerBySlug;
/* =========================================================
   UPDATE

   - existingItemsMeta = existing items jo rakhni/edit karni hain
   - itemsMeta         = newly uploaded files ki metadata
   - missing existing publicId means remove that old item
========================================================= */
const updateBanner = async (bannerId, data, files) => {
    validateBannerId(bannerId);
    const banner = await Banner_model_1.default.findById(bannerId);
    if (!banner) {
        throw new Error("Banner not found.");
    }
    const oldImages = banner.images.map(image => ({
        url: image.url,
        publicId: image.publicId,
        alt: image.alt,
        title: image.title,
        subtitle: image.subtitle,
        description: image.description,
        buttonText: image.buttonText,
        linkType: image.linkType,
        customLink: image.customLink,
        category: image.category,
        product: image.product,
        openInNewTab: image.openInNewTab,
    }));
    const oldVideos = banner.videos.map(video => ({
        url: video.url,
        publicId: video.publicId,
        poster: video.poster
            ? {
                url: video.poster.url,
                publicId: video.poster.publicId,
            }
            : undefined,
        autoplay: video.autoplay,
        muted: video.muted,
        loop: video.loop,
        controls: video.controls,
        title: video.title,
        subtitle: video.subtitle,
        description: video.description,
        buttonText: video.buttonText,
        linkType: video.linkType,
        customLink: video.customLink,
        category: video.category,
        product: video.product,
        openInNewTab: video.openInNewTab,
    }));
    const oldMediaType = banner.mediaType;
    const newMediaType = data.mediaType ||
        banner.mediaType;
    const newItemsMeta = data.itemsMeta || [];
    await validateItemsMeta(newItemsMeta);
    let newlyUploadedImages = [];
    let newlyUploadedVideos = [];
    try {
        /* ===================================================
           SLUG
        =================================================== */
        if (data.slug !==
            undefined) {
            const slug = data.slug
                .trim()
                .toLowerCase();
            if (!slug) {
                throw new Error("Banner slug cannot be empty.");
            }
            const duplicate = await Banner_model_1.default.findOne({
                slug,
                _id: {
                    $ne: banner._id,
                },
            });
            if (duplicate) {
                throw new Error("Banner slug already exists.");
            }
            banner.slug = slug;
        }
        if (data.title !==
            undefined) {
            banner.title =
                data.title.trim();
        }
        if (data.description !==
            undefined) {
            banner.description =
                data.description.trim();
        }
        if (data.position !==
            undefined) {
            banner.position =
                data.position;
        }
        if (data.device !==
            undefined) {
            banner.device =
                data.device;
        }
        if (data.sortOrder !==
            undefined) {
            banner.sortOrder =
                data.sortOrder;
        }
        if (data.isActive !==
            undefined) {
            banner.isActive =
                data.isActive;
        }
        banner.mediaType =
            newMediaType;
        /* ===================================================
           IMAGE MODE
        =================================================== */
        if (newMediaType ===
            "image") {
            let existingImages = [];
            if (oldMediaType ===
                "image") {
                existingImages =
                    await buildExistingImages(oldImages, data.existingItemsMeta);
            }
            if (files.images.length >
                0) {
                newlyUploadedImages =
                    await uploadBannerImages(files.images, newItemsMeta);
            }
            const finalImages = [
                ...existingImages,
                ...newlyUploadedImages,
            ];
            if (finalImages.length ===
                0) {
                throw new Error("Image banner requires at least one image.");
            }
            banner.images =
                finalImages;
            banner.videos = [];
        }
        /* ===================================================
           VIDEO MODE
        =================================================== */
        if (newMediaType ===
            "video") {
            let existingVideos = [];
            if (oldMediaType ===
                "video") {
                existingVideos =
                    await buildExistingVideos(oldVideos, data.existingItemsMeta);
            }
            if (files.videos.length >
                0) {
                newlyUploadedVideos =
                    await uploadBannerVideos(files.videos, files.posters, newItemsMeta);
            }
            const finalVideos = [
                ...existingVideos,
                ...newlyUploadedVideos,
            ];
            if (finalVideos.length ===
                0) {
                throw new Error("Video banner requires at least one video.");
            }
            banner.videos =
                finalVideos;
            banner.images = [];
        }
        /* ===================================================
           SAVE DB FIRST
        =================================================== */
        await banner.save();
        /* ===================================================
           CLEAN REMOVED OLD CLOUDINARY MEDIA
        =================================================== */
        const finalImageIds = new Set(banner.images.map(item => item.publicId));
        const removedImages = oldImages.filter(item => !finalImageIds.has(item.publicId));
        if (removedImages.length >
            0) {
            await deleteBannerImages(removedImages).catch(error => {
                console.error("Old banner image cleanup failed:", error);
            });
        }
        const finalVideoIds = new Set(banner.videos.map(item => item.publicId));
        const removedVideos = oldVideos.filter(item => !finalVideoIds.has(item.publicId));
        if (removedVideos.length >
            0) {
            await deleteBannerVideos(removedVideos).catch(error => {
                console.error("Old banner video cleanup failed:", error);
            });
        }
        return populateBanner(banner._id);
    }
    catch (error) {
        if (newlyUploadedImages.length >
            0) {
            await deleteBannerImages(newlyUploadedImages).catch(() => { });
        }
        if (newlyUploadedVideos.length >
            0) {
            await deleteBannerVideos(newlyUploadedVideos).catch(() => { });
        }
        throw error;
    }
};
exports.updateBanner = updateBanner;
/* =========================================================
   DELETE

   Cloudinary first, MongoDB after successful media cleanup.
========================================================= */
const deleteBanner = async (bannerId, deletedBy) => {
    validateBannerId(bannerId);
    const result = await (0, admin_trash_service_1.softDeleteEntity)("banner", bannerId, deletedBy);
    return {
        bannerId,
        message: result.message,
        movedToTrash: true,
        retentionDays: 30,
    };
};
exports.deleteBanner = deleteBanner;
//# sourceMappingURL=banner.service.js.map