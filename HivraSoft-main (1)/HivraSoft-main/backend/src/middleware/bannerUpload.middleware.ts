import multer from "multer";

const storage =
  multer.memoryStorage();

const imageMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
];

const videoMimeTypes = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
];

const fileFilter:
  multer.Options["fileFilter"] =
  (
    _req,
    file,
    callback
  ) => {
    if (
      file.fieldname === "images" ||
      file.fieldname === "posters"
    ) {
      if (
        !imageMimeTypes.includes(
          file.mimetype
        )
      ) {
        callback(
          new Error(
            "Only JPG, PNG, WEBP, AVIF and GIF images are allowed."
          )
        );
        return;
      }

      callback(null, true);
      return;
    }

    if (
      file.fieldname === "videos"
    ) {
      if (
        !videoMimeTypes.includes(
          file.mimetype
        )
      ) {
        callback(
          new Error(
            "Only MP4, WEBM, MOV and M4V videos are allowed."
          )
        );
        return;
      }

      callback(null, true);
      return;
    }

    callback(
      new Error(
        `Invalid banner upload field: ${file.fieldname}`
      )
    );
  };

const bannerMulter =
  multer({
    storage,
    fileFilter,
    limits: {
      fileSize:
        100 * 1024 * 1024,
      files: 40,
    },
  });

export const bannerUpload =
  bannerMulter.fields([
    {
      name: "images",
      maxCount: 20,
    },
    {
      name: "videos",
      maxCount: 10,
    },
    {
      name: "posters",
      maxCount: 10,
    },
  ]);
