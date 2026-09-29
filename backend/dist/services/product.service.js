"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.getCatalogProductBySlug = exports.getProductCatalog = exports.toCatalogProduct = exports.updateProductRatingSummary = exports.deleteProductSize = exports.updateProductSize = exports.addProductSize = exports.setDefaultProductColor = exports.setDefaultProductColorImage = exports.deleteProductColorImage = exports.uploadProductColorImages = exports.updateProduct = exports.getProductBySlug = exports.getProductById = exports.getNewLaunchProducts = exports.getFeaturedProducts = exports.getActiveProducts = exports.getAllProducts = exports.createProduct = void 0;
const mongoose_1 = require("mongoose");
const Product_model_1 = __importDefault(require("../models/Product.model"));
const Category_model_1 = __importDefault(require("../models/Category.model"));
const slug_1 = require("../utils/slug");
const productHtml_1 = require("../utils/productHtml");
const cloudinary_service_1 = require("./cloudinary.service");
/* =========================================================
   CLOUDINARY PRODUCT ROOT
========================================================= */
const PRODUCT_ROOT_FOLDER = "hivrasoft/products";
/* =========================================================
   NORMALIZE SLUG
========================================================= */
const normalizeSlug = (value) => {
    const cleaned = String(value || "").trim();
    if (!cleaned) {
        throw new Error("Slug value is required.");
    }
    const slug = (0, slug_1.createSlug)(cleaned);
    if (!slug) {
        throw new Error("Unable to generate slug.");
    }
    return slug;
};
/* =========================================================
   IMAGE NAME FROM ORIGINAL FILE
========================================================= */
const imageNameFromFile = (originalname) => {
    const withoutExtension = originalname
        .replace(/\.[^/.]+$/, "")
        .trim();
    if (!withoutExtension) {
        return "image";
    }
    return ((0, slug_1.createSlug)(withoutExtension) || "image");
};
/* =========================================================
   PRODUCT IMAGE CLOUDINARY FOLDER
========================================================= */
const getProductColorFolder = (slugProduct, slugColor) => {
    return [
        PRODUCT_ROOT_FOLDER,
        normalizeSlug(slugProduct),
        "colors",
        normalizeSlug(slugColor),
    ].join("/");
};
/* =========================================================
   VALIDATE CATEGORIES
========================================================= */
const validateCategories = async (categoryIds) => {
    if (!Array.isArray(categoryIds) ||
        categoryIds.length ===
            0) {
        throw new Error("At least one category is required.");
    }
    const uniqueIds = [
        ...new Set(categoryIds.map((value) => String(value).trim())),
    ].filter(Boolean);
    for (const categoryId of uniqueIds) {
        if (!mongoose_1.Types.ObjectId.isValid(categoryId)) {
            throw new Error(`Invalid category ID: ${categoryId}`);
        }
    }
    const objectIds = uniqueIds.map((categoryId) => new mongoose_1.Types.ObjectId(categoryId));
    const totalCategories = await Category_model_1.default.countDocuments({
        _id: {
            $in: objectIds,
        },
    });
    if (totalCategories !==
        objectIds.length) {
        throw new Error("One or more selected categories do not exist.");
    }
    return objectIds;
};
/* =========================================================
   NORMALIZE TAGS
========================================================= */
const normalizeTags = (tags) => {
    if (!tags) {
        return [];
    }
    if (!Array.isArray(tags)) {
        throw new Error("Tags must be an array.");
    }
    return [
        ...new Set(tags
            .map((tag) => String(tag)
            .trim()
            .toLowerCase())
            .filter(Boolean)),
    ];
};
/* =========================================================
   NORMALIZE IMAGES
========================================================= */
const normalizeImages = (images) => {
    if (!images) {
        return [];
    }
    if (!Array.isArray(images)) {
        throw new Error("Product images must be an array.");
    }
    const publicIds = new Set();
    const normalized = images.map((image, index) => {
        const url = image.url
            ?.trim();
        const publicId = image.publicId
            ?.trim();
        if (!url ||
            !publicId) {
            throw new Error(`Image ${index + 1} requires url and publicId.`);
        }
        if (publicIds.has(publicId)) {
            throw new Error(`Duplicate image publicId: ${publicId}`);
        }
        publicIds.add(publicId);
        return {
            url,
            publicId,
            isDefault: image.isDefault ??
                index === 0,
        };
    });
    /*
     * Sirf ek image default rahegi.
     */
    if (normalized.length >
        0) {
        const selectedDefault = normalized.findIndex((image) => image.isDefault);
        const defaultIndex = selectedDefault >= 0
            ? selectedDefault
            : 0;
        normalized.forEach((image, index) => {
            image.isDefault =
                index ===
                    defaultIndex;
        });
    }
    return normalized;
};
/* =========================================================
   NORMALIZE PRICE
========================================================= */
const normalizePrice = (originalValue, showValue, label) => {
    const originalPrice = Number(originalValue);
    const showPrice = Number(showValue);
    if (!Number.isFinite(originalPrice) || originalPrice < 0) {
        throw new Error(`${label}: originalPrice must be 0 or greater.`);
    }
    if (!Number.isFinite(showPrice) || showPrice < 0) {
        throw new Error(`${label}: showPrice must be 0 or greater.`);
    }
    if (showPrice > originalPrice) {
        throw new Error(`${label}: showPrice cannot be greater than originalPrice.`);
    }
    return {
        originalPrice,
        showPrice,
        discountPrice: Number((originalPrice - showPrice).toFixed(2)),
    };
};
/* =========================================================
   NORMALIZE SIZES

   NO SKU
========================================================= */
const normalizeSizes = (sizes, colorName) => {
    if (!sizes) {
        return [];
    }
    if (!Array.isArray(sizes)) {
        throw new Error(`Sizes for ${colorName} must be an array.`);
    }
    const usedSizes = new Set();
    return sizes.map((size, index) => {
        const sizeName = size.size
            ?.trim()
            .toUpperCase();
        if (!sizeName) {
            throw new Error(`${colorName} size ${index + 1} is required.`);
        }
        if (usedSizes.has(sizeName)) {
            throw new Error(`Duplicate size ${sizeName} in ${colorName}.`);
        }
        usedSizes.add(sizeName);
        const stock = Number(size.stock);
        if (!Number.isInteger(stock) ||
            stock < 0) {
            throw new Error(`Stock for ${colorName} / ${sizeName} must be a whole number 0 or greater.`);
        }
        const pricing = normalizePrice(size.originalPrice, size.showPrice, `${colorName} / ${sizeName}`);
        return {
            size: sizeName,
            stock,
            ...pricing,
            isActive: size.isActive ??
                true,
        };
    });
};
/* =========================================================
   NORMALIZE COLORS
========================================================= */
const normalizeColors = (colors) => {
    if (!colors) {
        return [];
    }
    if (!Array.isArray(colors)) {
        throw new Error("Colors must be an array.");
    }
    const usedColorSlugs = new Set();
    const usedProductSlugs = new Set();
    const normalized = colors.map((color, colorIndex) => {
        const nameProduct = color.nameProduct
            ?.trim();
        if (!nameProduct) {
            throw new Error(`Color ${colorIndex + 1}: product name is required.`);
        }
        const slugProduct = normalizeSlug(color.slugProduct ||
            nameProduct);
        if (usedProductSlugs.has(slugProduct)) {
            throw new Error(`Duplicate product slug: ${slugProduct}`);
        }
        usedProductSlugs.add(slugProduct);
        const nameColor = color.nameColor
            ?.trim();
        if (!nameColor) {
            throw new Error(`Color ${colorIndex + 1}: color name is required.`);
        }
        const slugColor = normalizeSlug(color.slugColor ||
            nameColor);
        if (usedColorSlugs.has(slugColor)) {
            throw new Error(`Duplicate color: ${nameColor}`);
        }
        usedColorSlugs.add(slugColor);
        const sizes = normalizeSizes(color.sizes, nameColor);
        const images = normalizeImages(color.images);
        const pricing = normalizePrice(color.originalPrice, color.showPrice, nameProduct);
        return {
            nameProduct,
            slugProduct,
            nameColor,
            slugColor,
            hex: color.hex
                ?.trim() ||
                "",
            isDefault: color.isDefault ??
                colorIndex === 0,
            ...pricing,
            shortDescription: color
                .shortDescription
                ?.trim() ||
                "",
            description: (0, productHtml_1.sanitizeProductDescriptionHtml)(color.description),
            tags: normalizeTags(color.tags),
            seoTitle: color.seoTitle
                ?.trim() ||
                "",
            seoDescription: color
                .seoDescription
                ?.trim() ||
                "",
            images,
            sizes,
        };
    });
    /*
     * Sirf ek color default.
     */
    if (normalized.length >
        0) {
        const selectedDefault = normalized.findIndex((color) => color.isDefault);
        const defaultIndex = selectedDefault >= 0
            ? selectedDefault
            : 0;
        normalized.forEach((color, index) => {
            color.isDefault =
                index ===
                    defaultIndex;
        });
    }
    return normalized;
};
/* =========================================================
   VALIDATE COLOR MODE
========================================================= */
const validateColorMode = (isColor, colors) => {
    const colorCount = Array.isArray(colors)
        ? colors.length
        : 0;
    if (isColor &&
        colorCount === 0) {
        throw new Error("At least one color is required when isColor is true.");
    }
    /*
     * No-color products still keep one internal details block
     * in colors[] because product name, slug, images, sizes,
     * stock and pricing live in the color subdocument schema.
     * isColor=false only hides the color selector on storefront.
     */
    if (!isColor &&
        colorCount === 0) {
        throw new Error("Product details are required when isColor is false.");
    }
    if (!isColor &&
        colorCount > 1) {
        throw new Error("Only one default product details block is allowed when isColor is false.");
    }
};
const normalizeColorsForMode = (isColor, colors) => {
    const normalized = normalizeColors(colors);
    if (!isColor &&
        normalized[0]) {
        normalized[0].nameColor =
            "Default";
        normalized[0].slugColor =
            "default";
        normalized[0].hex =
            "";
        normalized[0].isDefault =
            true;
    }
    return normalized;
};
/* =========================================================
   PRESERVE EXISTING SEO SLUGS DURING UPDATE

   Product names may change for merchandising/SEO copy, but
   existing URLs should stay stable unless the admin explicitly
   sends a new slug. If an update payload leaves a slug blank,
   reuse the currently stored slug instead of regenerating it
   from the edited name.
========================================================= */
const preserveExistingSlugsForUpdate = (isColor, incomingColors, existingColors) => {
    return incomingColors.map((color, index) => {
        const existing = existingColors[index];
        const incomingProductSlug = String(color.slugProduct || "").trim();
        const incomingColorSlug = String(color.slugColor || "").trim();
        return {
            ...color,
            slugProduct: incomingProductSlug ||
                existing?.slugProduct ||
                color.nameProduct,
            slugColor: !isColor
                ? "default"
                : incomingColorSlug ||
                    existing?.slugColor ||
                    color.nameColor,
        };
    });
};
/* =========================================================
   UNIQUE PRODUCT SLUG ACROSS DATABASE
========================================================= */
const validateUniqueProductSlugs = async (colors, excludeProductId) => {
    for (const color of colors) {
        const query = {
            "colors.slugProduct": color.slugProduct,
        };
        if (excludeProductId) {
            query._id = {
                $ne: excludeProductId,
            };
        }
        const existing = await Product_model_1.default.findOne(query)
            .select("_id")
            .lean();
        if (existing) {
            throw new Error(`Product slug already exists: ${color.slugProduct}`);
        }
    }
};
/* =========================================================
   GET IMAGE IDS FROM PRODUCT
========================================================= */
const getProductImagePublicIds = (product) => {
    const publicIds = [];
    for (const color of product.colors ||
        []) {
        for (const image of color.images ||
            []) {
            if (image.publicId) {
                publicIds.push(image.publicId);
            }
        }
    }
    return [
        ...new Set(publicIds),
    ];
};
/* =========================================================
   CLEAN CLOUDINARY FOLDERS
========================================================= */
const cleanupFolders = async (publicIds) => {
    const folders = [
        ...new Set(publicIds
            .map((publicId) => (0, cloudinary_service_1.getCloudinaryFolderFromPublicId)(publicId))
            .filter(Boolean)),
    ];
    await Promise.allSettled(folders.map((folder) => (0, cloudinary_service_1.deleteCloudinaryFolderIfEmpty)(folder)));
};
/* =========================================================
   CREATE PRODUCT
========================================================= */
const createProduct = async (input) => {
    const categories = await validateCategories(input.categories);
    const isColor = input.isColor ??
        true;
    validateColorMode(isColor, input.colors);
    const colors = normalizeColorsForMode(isColor, input.colors);
    await validateUniqueProductSlugs(colors);
    const product = await Product_model_1.default.create({
        ratings: {
            average: 0,
            count: 0,
        },
        categories,
        isColor,
        colors,
        isActive: input.isActive ??
            true,
        isFeatured: input.isFeatured ??
            false,
        isNewLaunch: input.isNewLaunch ??
            false,
    });
    return product;
};
exports.createProduct = createProduct;
/* =========================================================
   GET ALL PRODUCTS
========================================================= */
const toPlainProductObject = (input) => {
    return typeof input?.toObject ===
        "function"
        ? input.toObject()
        : input;
};
const getListingImages = (images) => {
    if (!Array.isArray(images)) {
        return [];
    }
    if (images.length <= 1) {
        return images;
    }
    const defaultIndex = images.findIndex((image) => image?.isDefault ===
        true);
    if (defaultIndex < 0) {
        return images.slice(0, 2);
    }
    const listingImages = [
        images[defaultIndex],
    ];
    const nextImage = images[defaultIndex + 1];
    if (nextImage) {
        listingImages.push(nextImage);
    }
    return listingImages;
};
const formatProductResponse = (input, limitImages) => {
    const product = toPlainProductObject(input);
    return {
        ...product,
        colors: Array.isArray(product?.colors)
            ? product.colors.map((color) => {
                const { description: _description, ...colorWithoutDescription } = color;
                return {
                    ...colorWithoutDescription,
                    images: limitImages
                        ? getListingImages(color.images)
                        : color.images,
                };
            })
            : [],
    };
};
const getAllProducts = async () => {
    const products = await Product_model_1.default.find()
        .populate("categories", "_id name slug level")
        .sort({
        createdAt: -1,
    });
    return products.map((product) => formatProductResponse(product, false));
};
exports.getAllProducts = getAllProducts;
/* =========================================================
   GET ACTIVE PRODUCTS
========================================================= */
const getActiveProducts = async () => {
    const products = await Product_model_1.default.find({
        isActive: true,
    })
        .populate("categories", "_id name slug level")
        .sort({
        createdAt: -1,
    });
    return products.map((product) => formatProductResponse(product, true));
};
exports.getActiveProducts = getActiveProducts;
/* =========================================================
   GET FEATURED PRODUCTS
========================================================= */
const getFeaturedProducts = async () => {
    const products = await Product_model_1.default.find({
        isActive: true,
        isFeatured: true,
    })
        .populate("categories", "_id name slug level")
        .sort({
        createdAt: -1,
    });
    return products.map((product) => formatProductResponse(product, true));
};
exports.getFeaturedProducts = getFeaturedProducts;
/* =========================================================
   GET NEW LAUNCH PRODUCTS
========================================================= */
const getNewLaunchProducts = async () => {
    const products = await Product_model_1.default.find({
        isActive: true,
        isNewLaunch: true,
    })
        .populate("categories", "_id name slug level")
        .sort({
        createdAt: -1,
    });
    return products.map((product) => formatProductResponse(product, true));
};
exports.getNewLaunchProducts = getNewLaunchProducts;
/* =========================================================
   GET PRODUCT BY ID
========================================================= */
const getProductById = async (productId) => {
    if (!mongoose_1.Types.ObjectId.isValid(productId)) {
        throw new Error("Invalid product ID.");
    }
    const product = await Product_model_1.default.findById(productId).populate("categories", "_id name slug level");
    if (!product) {
        throw new Error("Product not found.");
    }
    return product;
};
exports.getProductById = getProductById;
/* =========================================================
   GET PRODUCT BY PRODUCT SLUG
========================================================= */
const getProductBySlug = async (slug) => {
    const normalizedSlug = normalizeSlug(slug);
    const product = await Product_model_1.default.findOne({
        "colors.slugProduct": normalizedSlug,
    }).populate("categories", "_id name slug level");
    if (!product) {
        throw new Error("Product not found.");
    }
    return product;
};
exports.getProductBySlug = getProductBySlug;
/* =========================================================
   UPDATE PRODUCT
========================================================= */
const updateProduct = async (productId, input) => {
    if (!mongoose_1.Types.ObjectId.isValid(productId)) {
        throw new Error("Invalid product ID.");
    }
    const product = await Product_model_1.default.findById(productId);
    if (!product) {
        throw new Error("Product not found.");
    }
    const oldImageIds = getProductImagePublicIds(product);
    /* =====================================================
       CATEGORIES
    ===================================================== */
    if (input.categories !==
        undefined) {
        product.categories =
            await validateCategories(input.categories);
    }
    /* =====================================================
       COLOR MODE
    ===================================================== */
    const nextIsColor = input.isColor !==
        undefined
        ? input.isColor
        : product.isColor;
    if (input.colors !==
        undefined) {
        validateColorMode(nextIsColor, input.colors);
        const colorsWithStableSlugs = preserveExistingSlugsForUpdate(nextIsColor, input.colors, product.colors);
        const colors = normalizeColorsForMode(nextIsColor, colorsWithStableSlugs);
        await validateUniqueProductSlugs(colors, productId);
        product.colors =
            colors;
    }
    else if (input.isColor !== undefined &&
        nextIsColor !== product.isColor) {
        if (product.colors.length === 0) {
            throw new Error("Product details are required before changing color mode.");
        }
        if (!nextIsColor) {
            product.colors =
                product.colors.slice(0, 1);
            product.colors[0].nameColor =
                "Default";
            product.colors[0].slugColor =
                "default";
            product.colors[0].hex =
                "";
            product.colors[0].isDefault =
                true;
        }
    }
    product.isColor =
        nextIsColor;
    if (product.isColor &&
        product.colors.length ===
            0) {
        throw new Error("At least one color is required when isColor is true.");
    }
    /* =====================================================
       STATUS
    ===================================================== */
    if (input.isActive !==
        undefined) {
        product.isActive =
            input.isActive;
    }
    if (input.isFeatured !==
        undefined) {
        product.isFeatured =
            input.isFeatured;
    }
    if (input.isNewLaunch !==
        undefined) {
        product.isNewLaunch =
            input.isNewLaunch;
    }
    await product.save();
    /* =====================================================
       DELETE REMOVED CLOUDINARY IMAGES
    ===================================================== */
    const newImageIds = new Set(getProductImagePublicIds(product));
    const removedImages = oldImageIds.filter((publicId) => !newImageIds.has(publicId));
    if (removedImages.length >
        0) {
        await (0, cloudinary_service_1.deleteCloudinaryImages)(removedImages);
        await cleanupFolders(removedImages);
    }
    return product;
};
exports.updateProduct = updateProduct;
/* =========================================================
   UPLOAD PRODUCT COLOR IMAGES

   Cloudinary:
   hivrasoft/products/
      product-slug/
        colors/
          black/
            front-image-01
========================================================= */
const uploadProductColorImages = async (productId, colorSlug, files) => {
    if (!mongoose_1.Types.ObjectId.isValid(productId)) {
        throw new Error("Invalid product ID.");
    }
    if (!Array.isArray(files) ||
        files.length ===
            0) {
        throw new Error("At least one image is required.");
    }
    const product = await Product_model_1.default.findById(productId);
    if (!product) {
        throw new Error("Product not found.");
    }
    const normalizedColorSlug = normalizeSlug(colorSlug);
    const color = product.colors.find((item) => item.slugColor ===
        normalizedColorSlug);
    if (!color) {
        throw new Error("Product color not found.");
    }
    const folder = getProductColorFolder(color.slugProduct, color.slugColor);
    const uploadedImages = [];
    const uploadedPublicIds = [];
    try {
        for (let index = 0; index <
            files.length; index++) {
            const file = files[index];
            const imageName = imageNameFromFile(file.originalname);
            /*
             * Example:
             * front-image-01
             * back-image-02
             */
            const imageNumber = color.images.length +
                index +
                1;
            const publicId = `${imageName}-${String(imageNumber).padStart(2, "0")}`;
            const result = await (0, cloudinary_service_1.uploadImageBuffer)(file.buffer, folder, publicId);
            uploadedPublicIds.push(result.public_id);
            uploadedImages.push({
                url: result.secure_url,
                publicId: result.public_id,
                /*
                 * Agar color me pehle koi image nahi,
                 * to first uploaded image default.
                 */
                isDefault: color.images
                    .length ===
                    0 &&
                    index === 0,
            });
        }
        /*
         * Agar existing default hai,
         * new images default nahi honge.
         */
        const existingDefault = color.images.some((image) => image.isDefault);
        if (existingDefault) {
            uploadedImages.forEach((image) => {
                image.isDefault =
                    false;
            });
        }
        color.images.push(...uploadedImages);
        product.markModified("colors");
        await product.save();
        return {
            productId: product._id,
            slugProduct: color.slugProduct,
            slugColor: color.slugColor,
            folder,
            images: uploadedImages,
        };
    }
    catch (error) {
        /*
         * DB save fail hua to uploaded images
         * Cloudinary se clean.
         */
        if (uploadedPublicIds.length >
            0) {
            await (0, cloudinary_service_1.deleteCloudinaryImages)(uploadedPublicIds);
            await (0, cloudinary_service_1.deleteCloudinaryFolderIfEmpty)(folder);
        }
        throw error;
    }
};
exports.uploadProductColorImages = uploadProductColorImages;
/* =========================================================
   DELETE ONE PRODUCT COLOR IMAGE
========================================================= */
const deleteProductColorImage = async (productId, colorSlug, publicId) => {
    if (!mongoose_1.Types.ObjectId.isValid(productId)) {
        throw new Error("Invalid product ID.");
    }
    const product = await Product_model_1.default.findById(productId);
    if (!product) {
        throw new Error("Product not found.");
    }
    const normalizedColorSlug = normalizeSlug(colorSlug);
    const color = product.colors.find((item) => item.slugColor ===
        normalizedColorSlug);
    if (!color) {
        throw new Error("Product color not found.");
    }
    const imageIndex = color.images.findIndex((image) => image.publicId ===
        publicId);
    if (imageIndex === -1) {
        throw new Error("Product image not found.");
    }
    const removedImage = color.images[imageIndex];
    const wasDefault = removedImage
        .isDefault;
    color.images.splice(imageIndex, 1);
    /*
     * Default image delete hui to
     * first remaining image default.
     */
    if (wasDefault &&
        color.images.length >
            0) {
        color.images.forEach((image, index) => {
            image.isDefault =
                index === 0;
        });
    }
    product.markModified("colors");
    await product.save();
    await (0, cloudinary_service_1.deleteCloudinaryImage)(publicId);
    const folder = (0, cloudinary_service_1.getCloudinaryFolderFromPublicId)(publicId);
    await (0, cloudinary_service_1.deleteCloudinaryFolderIfEmpty)(folder);
    return product;
};
exports.deleteProductColorImage = deleteProductColorImage;
/* =========================================================
   SET DEFAULT PRODUCT IMAGE
========================================================= */
const setDefaultProductColorImage = async (productId, colorSlug, publicId) => {
    const product = await Product_model_1.default.findById(productId);
    if (!product) {
        throw new Error("Product not found.");
    }
    const normalizedColorSlug = normalizeSlug(colorSlug);
    const color = product.colors.find((item) => item.slugColor ===
        normalizedColorSlug);
    if (!color) {
        throw new Error("Product color not found.");
    }
    const selectedImage = color.images.find((image) => image.publicId ===
        publicId);
    if (!selectedImage) {
        throw new Error("Product image not found.");
    }
    color.images.forEach((image) => {
        image.isDefault =
            image.publicId ===
                publicId;
    });
    product.markModified("colors");
    await product.save();
    return product;
};
exports.setDefaultProductColorImage = setDefaultProductColorImage;
/* =========================================================
   SET DEFAULT COLOR
========================================================= */
const setDefaultProductColor = async (productId, colorSlug) => {
    const product = await Product_model_1.default.findById(productId);
    if (!product) {
        throw new Error("Product not found.");
    }
    const normalizedColorSlug = normalizeSlug(colorSlug);
    const exists = product.colors.some((color) => color.slugColor ===
        normalizedColorSlug);
    if (!exists) {
        throw new Error("Product color not found.");
    }
    product.colors.forEach((color) => {
        color.isDefault =
            color.slugColor ===
                normalizedColorSlug;
    });
    product.markModified("colors");
    await product.save();
    return product;
};
exports.setDefaultProductColor = setDefaultProductColor;
/* =========================================================
   ADD SIZE
========================================================= */
const addProductSize = async (productId, colorSlug, input) => {
    const product = await Product_model_1.default.findById(productId);
    if (!product) {
        throw new Error("Product not found.");
    }
    const normalizedColorSlug = normalizeSlug(colorSlug);
    const color = product.colors.find((item) => item.slugColor ===
        normalizedColorSlug);
    if (!color) {
        throw new Error("Product color not found.");
    }
    const normalized = normalizeSizes([input], color.nameColor)[0];
    const duplicate = color.sizes.some((size) => size.size ===
        normalized.size);
    if (duplicate) {
        throw new Error(`Size ${normalized.size} already exists in ${color.nameColor}.`);
    }
    color.sizes.push(normalized);
    product.markModified("colors");
    await product.save();
    return product;
};
exports.addProductSize = addProductSize;
/* =========================================================
   UPDATE SIZE
========================================================= */
const updateProductSize = async (productId, colorSlug, sizeId, input) => {
    if (!mongoose_1.Types.ObjectId.isValid(sizeId)) {
        throw new Error("Invalid size ID.");
    }
    const product = await Product_model_1.default.findById(productId);
    if (!product) {
        throw new Error("Product not found.");
    }
    const color = product.colors.find((item) => item.slugColor ===
        normalizeSlug(colorSlug));
    if (!color) {
        throw new Error("Product color not found.");
    }
    const size = color.sizes.find((item) => item._id?.toString() ===
        sizeId);
    if (!size) {
        throw new Error("Product size not found.");
    }
    if (input.size !==
        undefined) {
        const nextSize = input.size
            .trim()
            .toUpperCase();
        if (!nextSize) {
            throw new Error("Size cannot be empty.");
        }
        const duplicate = color.sizes.some((item) => item._id?.toString() !==
            sizeId &&
            item.size ===
                nextSize);
        if (duplicate) {
            throw new Error(`Size ${nextSize} already exists.`);
        }
        size.size =
            nextSize;
    }
    if (input.stock !==
        undefined) {
        const stock = Number(input.stock);
        if (!Number.isInteger(stock) ||
            stock < 0) {
            throw new Error("Stock must be a whole number 0 or greater.");
        }
        size.stock =
            stock;
    }
    if (input.originalPrice !== undefined ||
        input.showPrice !== undefined ||
        input.discountPrice !== undefined) {
        const pricing = normalizePrice(input.originalPrice !== undefined
            ? input.originalPrice
            : size.originalPrice, input.showPrice !== undefined
            ? input.showPrice
            : size.showPrice, `${color.nameColor} / ${size.size}`);
        size.originalPrice = pricing.originalPrice;
        size.showPrice = pricing.showPrice;
        size.discountPrice = pricing.discountPrice;
    }
    if (input.isActive !==
        undefined) {
        size.isActive =
            input.isActive;
    }
    product.markModified("colors");
    await product.save();
    return product;
};
exports.updateProductSize = updateProductSize;
/* =========================================================
   DELETE SIZE
========================================================= */
const deleteProductSize = async (productId, colorSlug, sizeId) => {
    const product = await Product_model_1.default.findById(productId);
    if (!product) {
        throw new Error("Product not found.");
    }
    const color = product.colors.find((item) => item.slugColor ===
        normalizeSlug(colorSlug));
    if (!color) {
        throw new Error("Product color not found.");
    }
    const sizeIndex = color.sizes.findIndex((size) => size._id?.toString() ===
        sizeId);
    if (sizeIndex === -1) {
        throw new Error("Product size not found.");
    }
    color.sizes.splice(sizeIndex, 1);
    product.markModified("colors");
    await product.save();
    return product;
};
exports.deleteProductSize = deleteProductSize;
/* =========================================================
   UPDATE PRODUCT RATING

   Review service se call karna.
========================================================= */
const updateProductRatingSummary = async (productId, average, count) => {
    if (!mongoose_1.Types.ObjectId.isValid(productId)) {
        throw new Error("Invalid product ID.");
    }
    const safeAverage = Math.max(0, Math.min(5, Number(average) || 0));
    const safeCount = Math.max(0, Math.floor(Number(count) || 0));
    const product = await Product_model_1.default.findByIdAndUpdate(productId, {
        $set: {
            "ratings.average": Number(safeAverage.toFixed(2)),
            "ratings.count": safeCount,
        },
    }, {
        new: true,
        runValidators: true,
    });
    if (!product) {
        throw new Error("Product not found.");
    }
    return product;
};
exports.updateProductRatingSummary = updateProductRatingSummary;
/* =========================================================
   CATALOG RESPONSE

   EXACT REQUIRED JSON STRUCTURE
========================================================= */
const toCatalogProduct = (input) => {
    const product = typeof input?.toObject ===
        "function"
        ? input.toObject()
        : input;
    return {
        _id: product._id,
        ratings: {
            average: product.ratings
                ?.average ??
                0,
            count: product.ratings
                ?.count ??
                0,
        },
        categories: product.categories ||
            [],
        isColor: product.isColor ===
            true,
        colors: Array.isArray(product.colors)
            ? product.colors.map((color) => ({
                _id: color._id,
                nameProduct: color.nameProduct,
                slugProduct: color.slugProduct,
                nameColor: color.nameColor,
                slugColor: color.slugColor,
                hex: color.hex ||
                    "",
                isDefault: Boolean(color.isDefault),
                shortDescription: color.shortDescription ||
                    "",
                description: color.description ||
                    "",
                tags: color.tags ||
                    [],
                seoTitle: color.seoTitle ||
                    "",
                seoDescription: color.seoDescription ||
                    "",
                images: Array.isArray(color.images)
                    ? color.images.map((image) => ({
                        url: image.url,
                        publicId: image.publicId,
                        isDefault: Boolean(image.isDefault),
                    }))
                    : [],
                sizes: Array.isArray(color.sizes)
                    ? color.sizes.map((size) => ({
                        _id: size._id,
                        size: size.size,
                        stock: size.stock,
                        isActive: size.isActive !==
                            false,
                    }))
                    : [],
            }))
            : [],
        isActive: product.isActive ===
            true,
        isFeatured: product.isFeatured ===
            true,
        isNewLaunch: product.isNewLaunch ===
            true,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
    };
};
exports.toCatalogProduct = toCatalogProduct;
/* =========================================================
   GET CATALOG
========================================================= */
const getProductCatalog = async () => {
    const products = await Product_model_1.default.find({
        isActive: true,
    })
        .populate("categories", "_id name slug level")
        .sort({
        createdAt: -1,
    });
    return products.map((product) => formatProductResponse((0, exports.toCatalogProduct)(product), true));
};
exports.getProductCatalog = getProductCatalog;
/* =========================================================
   GET CATALOG PRODUCT BY SLUG
========================================================= */
const getCatalogProductBySlug = async (slug) => {
    const product = await Product_model_1.default.findOne({
        isActive: true,
        "colors.slugProduct": normalizeSlug(slug),
    }).populate("categories", "_id name slug level");
    if (!product) {
        throw new Error("Product not found.");
    }
    return (0, exports.toCatalogProduct)(product);
};
exports.getCatalogProductBySlug = getCatalogProductBySlug;
/* =========================================================
   DELETE PRODUCT

   1. Get all Cloudinary images
   2. Delete images
   3. Delete MongoDB product
   4. Delete empty folders
========================================================= */
const deleteProduct = async (productId) => {
    if (!mongoose_1.Types.ObjectId.isValid(productId)) {
        throw new Error("Invalid product ID.");
    }
    const product = await Product_model_1.default.findById(productId);
    if (!product) {
        throw new Error("Product not found.");
    }
    const publicIds = getProductImagePublicIds(product);
    if (publicIds.length >
        0) {
        await (0, cloudinary_service_1.deleteCloudinaryImages)(publicIds);
    }
    await Product_model_1.default.deleteOne({
        _id: product._id,
    });
    await cleanupFolders(publicIds);
    return {
        success: true,
        message: "Product deleted successfully.",
        deletedImages: publicIds.length,
    };
};
exports.deleteProduct = deleteProduct;
//# sourceMappingURL=product.service.js.map