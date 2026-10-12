import type { BlogRecord } from "./blog";
import { cache } from "react";

const SERVER_API_URL = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");

async function publicFetch<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${SERVER_API_URL.replace(/\/api$/i, "")}${path}`, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!response.ok) return null;
    return await response.json() as T;
  } catch {
    return null;
  }
}

export async function fetchBlogsServer(query = "") {
  return publicFetch<{ success: boolean; blogs: BlogRecord[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/api/blogs${query ? `?${query}` : ""}`);
}

export const fetchBlogServer = cache(async (slug: string) => {
  return publicFetch<{ success: boolean; blog: BlogRecord; related: BlogRecord[] }>(`/api/blogs/${encodeURIComponent(slug)}`);
});
