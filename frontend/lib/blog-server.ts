import type { BlogRecord } from "./blog";

const SERVER_API_URL = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

async function publicFetch<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${SERVER_API_URL}${path}`, { cache: "no-store" });
    if (!response.ok) return null;
    return await response.json() as T;
  } catch {
    return null;
  }
}

export async function fetchBlogsServer(query = "") {
  return publicFetch<{ success: boolean; blogs: BlogRecord[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/api/blogs${query ? `?${query}` : ""}`);
}

export async function fetchBlogServer(slug: string) {
  return publicFetch<{ success: boolean; blog: BlogRecord; related: BlogRecord[] }>(`/api/blogs/${encodeURIComponent(slug)}`);
}
