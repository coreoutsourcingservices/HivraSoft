import {
  Router,
} from "express";

import {
  authenticate,
} from "../middleware/auth.middleware";

import {
  requireAdmin,
} from "../middleware/admin.middleware";

import {
  upload,
} from "../middleware/upload.middleware";

import {
  uploadImageController,
  listImagesController,
  updateImageDetailsController,
  deleteImageController,
} from "../controllers/upload.controller";

const router =
  Router();

/* =========================================================
   MEDIA LIBRARY
========================================================= */

router.get(
  "/images",
  authenticate,
  requireAdmin,
  listImagesController
);

/* =========================================================
   UPLOAD
========================================================= */

router.post(
  "/image",
  authenticate,
  requireAdmin,
  upload.single("image"),
  uploadImageController
);

router.patch(
  "/image",
  authenticate,
  requireAdmin,
  updateImageDetailsController
);

/* =========================================================
   DELETE
========================================================= */

router.delete(
  "/image",
  authenticate,
  requireAdmin,
  deleteImageController
);

export default router;