"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCloudinaryFolderIfEmpty = exports.getCloudinaryFolderFromPublicId = exports.deleteCloudinaryVideos = exports.deleteCloudinaryVideo = exports.deleteCloudinaryImages = exports.deleteCloudinaryImage = exports.moveCloudinaryImage = exports.uploadVideoBuffer = exports.uploadImageBuffer = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
/* =========================================================
   UPLOAD IMAGE
========================================================= */
const uploadImageBuffer = async (buffer, folder, publicId) => {
    const cloudinary = (0, cloudinary_1.default)();
    return new Promise((resolve, reject) => {
        const options = {
            folder,
            resource_type: "image",
            overwrite: false,
        };
        if (publicId) {
            options.public_id =
                publicId;
            options.unique_filename =
                false;
            options.use_filename =
                false;
        }
        else {
            options.unique_filename =
                true;
        }
        const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
            if (error ||
                !result) {
                reject(error ||
                    new Error("Cloudinary image upload failed."));
                return;
            }
            resolve(result);
        });
        uploadStream.end(buffer);
    });
};
exports.uploadImageBuffer = uploadImageBuffer;
/* =========================================================
   UPLOAD VIDEO
========================================================= */
const uploadVideoBuffer = async (buffer, folder) => {
    const cloudinary = (0, cloudinary_1.default)();
    return new Promise((resolve, reject) => {
        const options = {
            folder,
            resource_type: "video",
            overwrite: false,
            unique_filename: true,
        };
        const uploadStream = cloudinary.uploader.upload_stream(options, (error, result) => {
            if (error ||
                !result) {
                reject(error ||
                    new Error("Cloudinary video upload failed."));
                return;
            }
            resolve(result);
        });
        uploadStream.end(buffer);
    });
};
exports.uploadVideoBuffer = uploadVideoBuffer;
/* =========================================================
   MOVE / RENAME IMAGE
========================================================= */
const moveCloudinaryImage = async (fromPublicId, toPublicId) => {
    if (!fromPublicId ||
        !toPublicId) {
        throw new Error("Cloudinary source and destination publicId are required.");
    }
    if (fromPublicId ===
        toPublicId) {
        return null;
    }
    const cloudinary = (0, cloudinary_1.default)();
    return cloudinary.uploader.rename(fromPublicId, toPublicId, {
        resource_type: "image",
        overwrite: false,
        invalidate: true,
    });
};
exports.moveCloudinaryImage = moveCloudinaryImage;
/* =========================================================
   DELETE ONE IMAGE
========================================================= */
const deleteCloudinaryImage = async (publicId) => {
    if (!publicId) {
        return null;
    }
    const cloudinary = (0, cloudinary_1.default)();
    return cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
        invalidate: true,
    });
};
exports.deleteCloudinaryImage = deleteCloudinaryImage;
/* =========================================================
   DELETE MANY IMAGES
========================================================= */
const deleteCloudinaryImages = async (publicIds) => {
    const uniqueIds = Array.from(new Set(publicIds
        .map(value => value.trim())
        .filter(Boolean)));
    if (uniqueIds.length ===
        0) {
        return [];
    }
    return Promise.all(uniqueIds.map(publicId => (0, exports.deleteCloudinaryImage)(publicId)));
};
exports.deleteCloudinaryImages = deleteCloudinaryImages;
/* =========================================================
   DELETE ONE VIDEO
========================================================= */
const deleteCloudinaryVideo = async (publicId) => {
    if (!publicId) {
        return null;
    }
    const cloudinary = (0, cloudinary_1.default)();
    return cloudinary.uploader.destroy(publicId, {
        resource_type: "video",
        invalidate: true,
    });
};
exports.deleteCloudinaryVideo = deleteCloudinaryVideo;
/* =========================================================
   DELETE MANY VIDEOS
========================================================= */
const deleteCloudinaryVideos = async (publicIds) => {
    const uniqueIds = Array.from(new Set(publicIds
        .map(value => value.trim())
        .filter(Boolean)));
    if (uniqueIds.length ===
        0) {
        return [];
    }
    return Promise.all(uniqueIds.map(publicId => (0, exports.deleteCloudinaryVideo)(publicId)));
};
exports.deleteCloudinaryVideos = deleteCloudinaryVideos;
/* =========================================================
   FOLDER FROM PUBLIC ID
========================================================= */
const getCloudinaryFolderFromPublicId = (publicId) => {
    const parts = publicId
        .split("/")
        .filter(Boolean);
    parts.pop();
    return parts.join("/");
};
exports.getCloudinaryFolderFromPublicId = getCloudinaryFolderFromPublicId;
/* =========================================================
   DELETE EMPTY CLOUDINARY FOLDER
========================================================= */
const deleteCloudinaryFolderIfEmpty = async (folder) => {
    if (!folder) {
        return;
    }
    try {
        const cloudinary = (0, cloudinary_1.default)();
        await cloudinary.api.delete_folder(folder);
    }
    catch {
        /* best effort only */
    }
};
exports.deleteCloudinaryFolderIfEmpty = deleteCloudinaryFolderIfEmpty;
//# sourceMappingURL=cloudinary.service.js.map