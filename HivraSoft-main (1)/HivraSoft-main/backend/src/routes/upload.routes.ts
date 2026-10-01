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
  deleteImageController,
} from "../controllers/upload.controller";

const router =
  Router();

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