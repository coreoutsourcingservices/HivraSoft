import type { Request, Response, NextFunction } from "express";

// Only public GET endpoints used on the homepage are cached.
// Do not cache auth, cart, checkout, or admin responses.
const HOME_API_PATHS = new Set([
  "/banners/active",
  "/on-trend-picks",
  "/always-in-it",
  "/products/new-launches",
  "/products/active",
]);

const CACHE_TTL_SECONDS = 12 * 60 * 60;

async function redisCommand(command: (string | number)[]): Promise<unknown> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    signal: AbortSignal.timeout(2000),
  });

  if (!response.ok) throw new Error(`Upstash returned ${response.status}`);
  const data = (await response.json()) as { result?: unknown; error?: string };
  if (data.error) throw new Error(data.error);
  return data.result ?? null;
}

export async function cacheHomeApi(req: Request, res: Response, next: NextFunction) {
  if (req.method !== "GET" || !HOME_API_PATHS.has(req.path) || req.originalUrl.includes("?")) {
    return next();
  }

  // No Redis credentials? Serve the existing API normally.
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return next();
  }

  const key = `hivrasoft:home:v1:${req.path}`;

  try {
    const cached = await redisCommand(["GET", key]);
    if (typeof cached === "string") {
      return res.type("application/json").send(cached);
    }
  } catch {
    // Redis should never prevent the backend from serving live data.
  }

  const originalJson = res.json.bind(res);
  res.json = ((body: unknown) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      // Don't delay the API response while populating the shared cache.
      void redisCommand(["SET", key, JSON.stringify(body), "EX", CACHE_TTL_SECONDS]).catch(() => {});
    }
    return originalJson(body);
  }) as typeof res.json;

  next();
}
