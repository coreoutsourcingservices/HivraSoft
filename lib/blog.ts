import { apiFetch } from "./api";

export type BlogImage = {
  url: string;
  publicId: string;
  alt?: string;
  title?: string;
  caption?: string;
  width?: number;
  height?: number;
};

export type BlogBlock = {
  id: string;
  type: string;
  data: Record<string, any>;
  style?: Record<string, any>;
  className?: string;
  anchorId?: string;
};

export type BlogTaxonomy = { _id: string; name: string; slug: string; description?: string; image?: BlogImage; isActive?: boolean };

export type BlogRecord = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  blocks: BlogBlock[];
  featuredImage: BlogImage;
  category?: BlogTaxonomy | string | null;
  tags: Array<BlogTaxonomy | string>;
  author?: { _id?: string; name?: string; email?: string; avatar?: { url?: string } } | string;
  seo: Record<string, any>;
  status: "DRAFT" | "PUBLISHED" | "SCHEDULED" | "PRIVATE";
  publishedAt?: string | null;
  scheduledAt?: string | null;
  readingTime: number;
  views: number;
<<<<<<< HEAD
  likeCount?: number;
=======
>>>>>>> aman
  isFeatured: boolean;
  customCss?: string;
  revisions?: Array<Record<string, any>>;
  createdAt?: string;
  updatedAt?: string;
};

export async function getAdminBlogs(query: Record<string, string | number | undefined> = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => { if (value !== undefined && value !== "") params.set(key, String(value)); });
  return apiFetch<{ success: boolean; blogs: BlogRecord[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/api/admin/blogs${params.toString() ? `?${params}` : ""}`);
}

export async function getAdminBlog(id: string) {
  const result = await apiFetch<{ success: boolean; blog: BlogRecord }>(`/api/admin/blogs/${encodeURIComponent(id)}`);
  return result.blog;
}

export async function createAdminBlog(body: Record<string, any>) {
  return apiFetch<{ success: boolean; message: string; blog: BlogRecord }>("/api/admin/blogs", { method: "POST", body });
}

export async function updateAdminBlog(id: string, body: Record<string, any>) {
  return apiFetch<{ success: boolean; message: string; blog: BlogRecord }>(`/api/admin/blogs/${encodeURIComponent(id)}`, { method: "PUT", body });
}

export async function deleteAdminBlog(id: string) {
  return apiFetch<{ success: boolean; message: string }>(`/api/admin/blogs/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function duplicateAdminBlog(id: string) {
  return apiFetch<{ success: boolean; message: string; blog: BlogRecord }>(`/api/admin/blogs/${encodeURIComponent(id)}/duplicate`, { method: "POST" });
}

export async function getBlogCategories(admin = true) {
  const result = await apiFetch<{ success: boolean; categories: BlogTaxonomy[] }>(admin ? "/api/admin/blog-categories" : "/api/blog-categories");
  return result.categories || [];
}

export async function createBlogCategory(body: Record<string, any>) {
  return apiFetch<{ success: boolean; category: BlogTaxonomy }>("/api/admin/blog-categories", { method: "POST", body });
}

export async function updateBlogCategory(id: string, body: Record<string, any>) {
  return apiFetch<{ success: boolean; category: BlogTaxonomy }>(`/api/admin/blog-categories/${encodeURIComponent(id)}`, { method: "PUT", body });
}

export async function deleteBlogCategory(id: string) {
  return apiFetch(`/api/admin/blog-categories/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function getBlogTags(admin = true) {
  const result = await apiFetch<{ success: boolean; tags: BlogTaxonomy[] }>(admin ? "/api/admin/blog-tags" : "/api/blog-tags");
  return result.tags || [];
}

export async function createBlogTag(body: Record<string, any>) {
  return apiFetch<{ success: boolean; tag: BlogTaxonomy }>("/api/admin/blog-tags", { method: "POST", body });
}

export async function updateBlogTag(id: string, body: Record<string, any>) {
  return apiFetch<{ success: boolean; tag: BlogTaxonomy }>(`/api/admin/blog-tags/${encodeURIComponent(id)}`, { method: "PUT", body });
}

export async function deleteBlogTag(id: string) {
  return apiFetch(`/api/admin/blog-tags/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function uploadBlogImage(file: File, imageName = "blog-image") {
  const form = new FormData();
  form.set("image", file);
  form.set("folder", "blog");
  form.set("imageName", imageName);
  const result = await apiFetch<{ success: boolean; image: { url: string; publicId: string; width: number; height: number; alt?: string; name?: string } }>("/api/uploads/image", { method: "POST", body: form });
  return result.image;
}

export async function getPublicBlogs(query: Record<string, string | number | undefined> = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => { if (value !== undefined && value !== "") params.set(key, String(value)); });
  return apiFetch<{ success: boolean; blogs: BlogRecord[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/api/blogs${params.toString() ? `?${params}` : ""}`);
}

export async function getPublicBlog(slug: string) {
  return apiFetch<{ success: boolean; blog: BlogRecord; related: BlogRecord[] }>(`/api/blogs/${encodeURIComponent(slug)}`);
}
<<<<<<< HEAD


export async function likePublicBlog(slug: string) {
  return apiFetch<{ success: boolean; liked: boolean; likeCount: number }>(`/api/blogs/${encodeURIComponent(slug)}/like`, { method: "POST" });
}
=======
>>>>>>> aman
