import type { BlogRecord } from "./blog";

const SERVER_API_URL = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === "production" ? "https://backend.hivrasoft.com" : "http://localhost:5000")).replace(/\/$/, "");

async function publicFetch<T>(path: string): Promise<T | null> {
  const response = await requestPublicBlog(`${SERVER_API_URL}${path}`);
  if (response.status === 404) return null;
  return await response.json() as T;
}

/** Only a real missing article is a 404; outages must not deindex valid articles. */
export async function requestPublicBlog(url: string, request: typeof fetch = fetch): Promise<Response> {
  let failure: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await request(url, { cache: "no-store", signal: AbortSignal.timeout(8_000) });
      if (response.ok || response.status === 404) return response;
      const status = response.status;
      await response.body?.cancel();
      const error = new Error(`Blog API returned HTTP ${status}`);
      if (status < 500) throw error;
      failure = error;
    } catch (error) {
      if (error instanceof Error && /^Blog API returned HTTP 4/.test(error.message)) throw error;
      failure = error;
    }
  }
  throw failure instanceof Error ? failure : new Error("Blog API unavailable");
}

export async function fetchBlogsServer(query = "") {
  return publicFetch<{ success: boolean; blogs: BlogRecord[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(`/api/blogs${query ? `?${query}` : ""}`);
}

export async function fetchBlogServer(slug: string) {
  return publicFetch<{ success: boolean; blog: BlogRecord; related: BlogRecord[] }>(`/api/blogs/${encodeURIComponent(slug)}`);
}
