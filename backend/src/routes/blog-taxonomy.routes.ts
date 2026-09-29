import { Router } from "express";
import { listPublicBlogCategories, listPublicBlogTags } from "../controllers/blog.controller";

export const blogCategoryRoutes = Router();
export const blogTagRoutes = Router();
blogCategoryRoutes.get("/", listPublicBlogCategories);
blogTagRoutes.get("/", listPublicBlogTags);
