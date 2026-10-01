import multer from "multer";

/* =========================================================
   MEMORY STORAGE
========================================================= */

const storage =
  multer.memoryStorage();

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

const fileFilter:
  multer.Options["fileFilter"] =
  (
    _req,
    file,
    callback
  ) => {
    if (
      !allowedMimeTypes.includes(
        file.mimetype
      )
    ) {
      callback(
        new Error(
          "Only JPG, JPEG, PNG, WEBP and AVIF images are allowed."
        )
      );

      return;
    }

    callback(
      null,
      true
    );
  };

/* =========================================================
   MULTER UPLOAD
========================================================= */

export const upload =
  multer({
    storage,

    fileFilter,

    limits: {
      /*
       * Maximum 10 MB per image
       */
      fileSize:
        10 *
        1024 *
        1024,

      /*
       * Maximum files in one request
       */
      files: 10,
    },
  });