import { Router } from "express";
import { globalSearchController } from "../controllers/search.controller";

const router = Router();

/* Public storefront global search */
router.get("/", globalSearchController);

export default router;
