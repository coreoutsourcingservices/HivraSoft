import { Router } from "express";
import {
  getPublicBlogBySlug,
  listBlogsByCategory,
  listBlogsByTag,
  listFeaturedBlogs,
  listLatestBlogs,
  listPublicBlogController,
<<<<<<< HEAD
  likePublicBlog,
} from "../controllers/blog.controller";
import { authenticate } from "../middleware/auth.middleware";
=======
} from "../controllers/blog.controller";
>>>>>>> aman

const router = Router();

router.get("/", listPublicBlogController);
router.get("/featured", listFeaturedBlogs);
router.get("/latest", listLatestBlogs);
router.get("/category/:slug", listBlogsByCategory);
router.get("/tag/:slug", listBlogsByTag);
<<<<<<< HEAD
router.post("/:slug/like", authenticate, likePublicBlog);
=======
>>>>>>> aman
router.get("/:slug", getPublicBlogBySlug);

export default router;
