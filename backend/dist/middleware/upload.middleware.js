"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
/* =========================================================
   MEMORY STORAGE
========================================================= */
const storage = multer_1.default.memoryStorage();
/* =========================================================
   ALLOWED IMAGE TYPES
========================================================= */
const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/avif",
];
/* =========================================================
   FILE FILTER
========================================================= */
const fileFilter = (_req, file, callback) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
        callback(new Error("Only JPG, JPEG, PNG, WEBP and AVIF images are allowed."));
        return;
    }
    callback(null, true);
};
/* =========================================================
   MULTER UPLOAD
========================================================= */
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        /*
         * Maximum 10 MB per image
         */
        fileSize: 10 *
            1024 *
            1024,
        /*
         * Maximum files in one request
         */
        files: 10,
    },
});
//# sourceMappingURL=upload.middleware.js.map