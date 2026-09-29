"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategoryTree = exports.deleteCategory = exports.updateCategory = exports.getCategoryBySlug = exports.getCategoryById = exports.getActiveCategories = exports.getAllCategories = exports.createCategory = void 0;
const mongoose_1 = require("mongoose");
const Category_model_1 = __importDefault(require("../models/Category.model"));
const Product_model_1 = __importDefault(require("../models/Product.model"));
const slug_1 = require("../utils/slug");
const cloudinary_service_1 = require("./cloudinary.service");
/* =========================================================
   IMAGE NORMALIZER
========================================================= */
const normalizeImages = (images, fallbackAlt) => {
    if (!Array.isArray(images)) {
        return [];
    }
    const seenPublicIds = new Set();
    const result = [];
    for (const image of images) {
        const url = typeof image?.url ===
            "string"
            ? image.url.trim()
            : "";
        const publicId = typeof image?.publicId ===
            "string"
            ? image.publicId.trim()
            : "";
        const alt = typeof image?.alt ===
            "string" &&
            image.alt.trim()
            ? image.alt.trim()
            : fallbackAlt;
        if (!url ||
            !publicId ||
            seenPublicIds.has(publicId)) {
            continue;
        }
        seenPublicIds.add(publicId);
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
const getCategoryCloudinaryFolder = (categoryName) => {
    return `hivrasoft/category-images/${(0, slug_1.createSlug)(categoryName)}`;
};
/* =========================================================
   ENSURE IMAGES ARE INSIDE CURRENT CATEGORY FOLDER

   Category create/update/name-change ke baad sab retained
   images canonical folder me move ho jayengi.

   Photo filename same rahega.
========================================================= */
const ensureCategoryImagesFolder = async (category) => {
    if ((category.images || []).length ===
        0) {
        return;
    }
    const targetFolder = getCategoryCloudinaryFolder(category.name);
    let changed = false;
    const oldFolders = new Set();
    const nextImages = [];
    for (const image of category.images || []) {
        const fileName = image.publicId
            .split("/")
            .filter(Boolean)
            .pop() ||
            (0, slug_1.createSlug)(image.alt);
        const targetPublicId = `${targetFolder}/${fileName}`;
        if (image.publicId ===
            targetPublicId) {
            nextImages.push({
                url: image.url,
                publicId: image.publicId,
                alt: image.alt,
            });
            continue;
        }
        oldFolders.add((0, cloudinary_service_1.getCloudinaryFolderFromPublicId)(image.publicId));
        const moved = await (0, cloudinary_service_1.moveCloudinaryImage)(image.publicId, targetPublicId);
        if (!moved) {
            nextImages.push({
                url: image.url,
                publicId: image.publicId,
                alt: image.alt,
            });
            continue;
        }
        changed =
            true;
        nextImages.push({
            url: moved.secure_url,
            publicId: moved.public_id,
            alt: image.alt,
        });
    }
    if (changed) {
        category.images =
            nextImages;
        await category.save();
        /*
          Rename/move ke baad purane empty category folders
          ko best-effort remove karo.
        */
        await Promise.allSettled(Array.from(oldFolders)
            .filter((folder) => Boolean(folder &&
            folder !==
                targetFolder))
            .map((folder) => (0, cloudinary_service_1.deleteCloudinaryFolderIfEmpty)(folder)));
    }
};
/* =========================================================
   UNIQUE SLUG
========================================================= */
const generateUniqueSlug = async (value, excludeId) => {
    const baseSlug = (0, slug_1.createSlug)(value);
    if (!baseSlug) {
        throw new Error("Category slug is required.");
    }
    let slug = baseSlug;
    let counter = 2;
    while (true) {
        const query = {
            slug,
        };
        if (excludeId) {
            query._id = {
                $ne: excludeId,
            };
        }
        const existing = await Category_model_1.default.findOne(query)
            .select("_id")
            .lean();
        if (!existing) {
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
const getParentInformation = async (parentId) => {
    if (!parentId) {
        return {
            parent: null,
            ancestors: [],
            level: 0,
        };
    }
    if (!mongoose_1.Types.ObjectId.isValid(parentId)) {
        throw new Error("Invalid parent category ID.");
    }
    const parent = await Category_model_1.default.findById(parentId);
    if (!parent) {
        throw new Error("Parent category not found.");
    }
    return {
        parent: parent._id,
        ancestors: [
            ...parent.ancestors,
            parent._id,
        ],
        level: parent.level +
            1,
    };
};
/* =========================================================
   CREATE CATEGORY
========================================================= */
const createCategory = async (input) => {
    const name = input.name.trim();
    if (!name) {
        throw new Error("Category name is required.");
    }
    const slug = await generateUniqueSlug(input.slug?.trim() || name);
    const parentInfo = await getParentInformation(input.parentId);
    const images = normalizeImages(input.images, name);
    const category = await Category_model_1.default.create({
        name,
        slug,
        description: input.description
            ?.trim() ||
            "",
        parent: parentInfo.parent,
        ancestors: parentInfo.ancestors,
        level: parentInfo.level,
        images,
        isActive: input.isActive ??
            true,
        sortOrder: input.sortOrder ??
            0,
    });
    /*
      Ensure:
      hivrasoft/category-images/<category-name>/<photo-name>
    */
    await ensureCategoryImagesFolder(category);
    return category;
};
exports.createCategory = createCategory;
/* =========================================================
   GET ALL CATEGORIES
========================================================= */
const getAllCategories = async () => {
    return Category_model_1.default.find()
        .sort({
        level: 1,
        sortOrder: 1,
        name: 1,
    })
        .lean();
};
exports.getAllCategories = getAllCategories;
/* =========================================================
   GET ACTIVE CATEGORIES
========================================================= */
const getActiveCategories = async () => {
    return Category_model_1.default.find({
        isActive: true,
    })
        .sort({
        level: 1,
        sortOrder: 1,
        name: 1,
    })
        .lean();
};
exports.getActiveCategories = getActiveCategories;
/* =========================================================
   GET CATEGORY BY ID
========================================================= */
const getCategoryById = async (categoryId) => {
    if (!mongoose_1.Types.ObjectId.isValid(categoryId)) {
        throw new Error("Invalid category ID.");
    }
    const category = await Category_model_1.default.findById(categoryId);
    if (!category) {
        throw new Error("Category not found.");
    }
    return category;
};
exports.getCategoryById = getCategoryById;
/* =========================================================
   GET CATEGORY BY SLUG
========================================================= */
const getCategoryBySlug = async (slug) => {
    const category = await Category_model_1.default.findOne({
        slug: slug
            .trim()
            .toLowerCase(),
    });
    if (!category) {
        throw new Error("Category not found.");
    }
    return category;
};
exports.getCategoryBySlug = getCategoryBySlug;
/* =========================================================
   REBUILD DESCENDANTS
========================================================= */
const rebuildDescendants = async (categoryId) => {
    const descendants = await Category_model_1.default.find({
        ancestors: new mongoose_1.Types.ObjectId(categoryId),
    }).sort({
        level: 1,
    });
    for (const descendant of descendants) {
        if (!descendant.parent) {
            descendant.ancestors =
                [];
            descendant.level =
                0;
            await descendant.save();
            continue;
        }
        const parent = await Category_model_1.default.findById(descendant.parent);
        if (!parent) {
            continue;
        }
        descendant.ancestors =
            [
                ...parent.ancestors,
                parent._id,
            ];
        descendant.level =
            parent.level +
                1;
        await descendant.save();
    }
};
/* =========================================================
   UPDATE CATEGORY
========================================================= */
const updateCategory = async (categoryId, input) => {
    if (!mongoose_1.Types.ObjectId.isValid(categoryId)) {
        throw new Error("Invalid category ID.");
    }
    const category = await Category_model_1.default.findById(categoryId);
    if (!category) {
        throw new Error("Category not found.");
    }
    /* NAME */
    if (input.name !==
        undefined) {
        const name = input.name.trim();
        if (!name) {
            throw new Error("Category name cannot be empty.");
        }
        category.name =
            name;
        if (input.slug === undefined) {
            category.slug =
                await generateUniqueSlug(name, categoryId);
        }
    }
    /* MANUAL / AUTO SLUG */
    if (input.slug !== undefined) {
        category.slug =
            await generateUniqueSlug(input.slug.trim() || category.name, categoryId);
    }
    /* DESCRIPTION */
    if (input.description !==
        undefined) {
        category.description =
            input.description.trim();
    }
    /* IMAGES */
    let removedImagePublicIds = [];
    if (input.images !==
        undefined) {
        const nextImages = normalizeImages(input.images, category.name);
        const nextPublicIds = new Set(nextImages.map((image) => image.publicId));
        removedImagePublicIds =
            category.images
                .filter((image) => !nextPublicIds.has(image.publicId))
                .map((image) => image.publicId);
        category.images =
            nextImages;
    }
    /* ACTIVE */
    if (input.isActive !==
        undefined) {
        category.isActive =
            input.isActive;
    }
    /* SORT ORDER */
    if (input.sortOrder !==
        undefined) {
        category.sortOrder =
            input.sortOrder;
    }
    /* PARENT CHANGE */
    let hierarchyChanged = false;
    if (input.parentId !==
        undefined) {
        if (input.parentId ===
            categoryId) {
            throw new Error("Category cannot be its own parent.");
        }
        if (input.parentId) {
            if (!mongoose_1.Types.ObjectId.isValid(input.parentId)) {
                throw new Error("Invalid parent category ID.");
            }
            const newParent = await Category_model_1.default.findById(input.parentId);
            if (!newParent) {
                throw new Error("Parent category not found.");
            }
            const isDescendant = newParent.ancestors.some((ancestorId) => String(ancestorId) ===
                categoryId);
            if (isDescendant) {
                throw new Error("A child category cannot become the parent of its own ancestor.");
            }
            category.parent =
                newParent._id;
            category.ancestors =
                [
                    ...newParent.ancestors,
                    newParent._id,
                ];
            category.level =
                newParent.level +
                    1;
        }
        else {
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
    if (removedImagePublicIds.length >
        0) {
        await (0, cloudinary_service_1.deleteCloudinaryImages)(removedImagePublicIds);
        const removedFolders = Array.from(new Set(removedImagePublicIds
            .map(cloudinary_service_1.getCloudinaryFolderFromPublicId)
            .filter(Boolean)));
        await Promise.allSettled(removedFolders.map((folder) => (0, cloudinary_service_1.deleteCloudinaryFolderIfEmpty)(folder)));
    }
    /*
      Name change / folder mismatch:
      all retained images are moved into current category folder.
    */
    await ensureCategoryImagesFolder(category);
    if (hierarchyChanged) {
        await rebuildDescendants(categoryId);
    }
    return category;
};
exports.updateCategory = updateCategory;
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
const deleteCategory = async (categoryId, options = {}) => {
    /* =====================================================
       VALIDATE ID
    ===================================================== */
    if (!mongoose_1.Types.ObjectId.isValid(categoryId)) {
        throw new Error("Invalid category ID.");
    }
    const categoryObjectId = new mongoose_1.Types.ObjectId(categoryId);
    /* =====================================================
       FIND ROOT CATEGORY
    ===================================================== */
    const category = await Category_model_1.default.findById(categoryObjectId);
    if (!category) {
        throw new Error("Category not found.");
    }
    /* =====================================================
       FIND COMPLETE SUBTREE

       ancestors[] makes this possible in one query.

       Root category itself + every descendant where
       ancestors contains the root category id.
    ===================================================== */
    const subtree = await Category_model_1.default.find({
        $or: [
            {
                _id: categoryObjectId,
            },
            {
                ancestors: categoryObjectId,
            },
        ],
    }).sort({
        level: -1,
    });
    const descendantCount = Math.max(0, subtree.length - 1);
    if (descendantCount > 0 &&
        !options.cascade) {
        throw new Error(`"${category.name}" has ${descendantCount} subcategor${descendantCount === 1
            ? "y"
            : "ies"}. Use cascade delete to delete the complete category tree.`);
    }
    /* =====================================================
       CATEGORY IDS
    ===================================================== */
    const categoryIds = subtree.map((item) => item._id);
    /* =====================================================
       COLLECT ALL CLOUDINARY PUBLIC IDS
    ===================================================== */
    const publicIds = Array.from(new Set(subtree.flatMap((item) => (item.images || [])
        .map((image) => image.publicId
        ?.trim())
        .filter((publicId) => Boolean(publicId)))));
    /* =====================================================
       COLLECT CLOUDINARY FOLDERS
    ===================================================== */
    const folders = Array.from(new Set(publicIds
        .map(cloudinary_service_1.getCloudinaryFolderFromPublicId)
        .filter(Boolean)));
    /* =====================================================
       DELETE CLOUDINARY IMAGES FIRST

       If Cloudinary fails, MongoDB category data stays intact
       so the admin can safely retry the deletion.
    ===================================================== */
    if (publicIds.length > 0) {
        await (0, cloudinary_service_1.deleteCloudinaryImages)(publicIds);
    }
    /* =====================================================
       REMOVE CATEGORY REFERENCES FROM PRODUCTS

       Product.categories[] can contain root or child ids.
       Pull every deleted id so products do not keep dangling
       category references.
    ===================================================== */
    const productCleanup = await Product_model_1.default.updateMany({
        categories: {
            $in: categoryIds,
        },
    }, {
        $pull: {
            categories: {
                $in: categoryIds,
            },
        },
    });
    /* =====================================================
       DELETE CATEGORY TREE
    ===================================================== */
    const deleteResult = await Category_model_1.default.deleteMany({
        _id: {
            $in: categoryIds,
        },
    });
    /* =====================================================
       DELETE EMPTY CLOUDINARY FOLDERS

       Best effort only. Images are already deleted.
    ===================================================== */
    await Promise.allSettled(folders.map((folder) => (0, cloudinary_service_1.deleteCloudinaryFolderIfEmpty)(folder)));
    /* =====================================================
       RESPONSE
    ===================================================== */
    return {
        message: subtree.length > 1
            ? `"${category.name}" and all subcategories deleted successfully.`
            : `"${category.name}" deleted successfully.`,
        deletedCategories: deleteResult.deletedCount,
        deletedSubcategories: Math.max(0, deleteResult.deletedCount - 1),
        deletedImages: publicIds.length,
        updatedProducts: productCleanup.modifiedCount,
    };
};
exports.deleteCategory = deleteCategory;
/* =========================================================
   CATEGORY TREE
========================================================= */
const getCategoryTree = async (activeOnly = false) => {
    const filter = activeOnly
        ? {
            isActive: true,
        }
        : {};
    const categories = await Category_model_1.default.find(filter).sort({
        level: 1,
        sortOrder: 1,
        name: 1,
    });
    const map = new Map();
    const roots = [];
    for (const category of categories) {
        const id = String(category._id);
        map.set(id, {
            id,
            name: category.name,
            slug: category.slug,
            description: category.description ||
                "",
            parent: category.parent
                ? String(category.parent)
                : null,
            ancestors: category.ancestors.map((ancestor) => String(ancestor)),
            level: category.level,
            images: category.images.map((image) => ({
                url: image.url,
                publicId: image.publicId,
                alt: image.alt,
            })),
            isActive: category.isActive,
            sortOrder: category.sortOrder,
            children: [],
        });
    }
    for (const category of categories) {
        const id = String(category._id);
        const node = map.get(id);
        if (!node) {
            continue;
        }
        if (category.parent) {
            const parentNode = map.get(String(category.parent));
            if (parentNode) {
                parentNode.children.push(node);
                continue;
            }
        }
        roots.push(node);
    }
    return roots;
};
exports.getCategoryTree = getCategoryTree;
//# sourceMappingURL=category.service.js.map