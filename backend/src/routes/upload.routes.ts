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
  trashGalleryImageController,
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

// Only the Gallery admin uses this soft-delete route. Other upload APIs are unchanged.
router.post("/image/trash", authenticate, requireAdmin, trashGalleryImageController);

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