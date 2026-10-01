import multer from "multer";

const imageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif"];
const videoTypes = ["video/mp4", "video/webm", "video/quicktime"];

export const reviewUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (![...imageTypes, ...videoTypes].includes(file.mimetype)) return cb(new Error("Only JPG, PNG, WEBP, AVIF, MP4, WEBM and MOV review media are allowed."));
    cb(null, true);
  },
  limits: { fileSize: 25 * 1024 * 1024, files: 8 },
}).fields([{ name: "images", maxCount: 5 }, { name: "videos", maxCount: 3 }]);
