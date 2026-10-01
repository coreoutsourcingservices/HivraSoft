import { Router } from "express";
import {
  getPublicBlogBySlug,
  listBlogsByCategory,
  listBlogsByTag,
  listFeaturedBlogs,
  listLatestBlogs,
  listPublicBlogController,
} from "../controllers/blog.controller";

const router = Router();

router.get("/", listPublicBlogController);
router.get("/featured", listFeaturedBlogs);
router.get("/latest", listLatestBlogs);
router.get("/category/:slug", listBlogsByCategory);
router.get("/tag/:slug", listBlogsByTag);
router.get("/:slug", getPublicBlogBySlug);

export default router;
