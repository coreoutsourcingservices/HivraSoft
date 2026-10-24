import { readFileSync } from "node:fs";
const legacyContentLinks = JSON.parse(readFileSync(new URL("./data/storefront-link-aliases.json", import.meta.url), "utf8"));

const production = process.env.NODE_ENV === "production";
const defaultBackendUrl = production ? "https://backend.hivrasoft.com" : "http://localhost:5000";
const defaultApiUrl = production ? "https://hivrasoft.com" : defaultBackendUrl;

function publicApiUrl(value) {
  const candidate = value?.trim().replace(/\/+$/, "");
  if (!candidate) return defaultApiUrl;
  try {
    const url = new URL(candidate);
    const loopback = /^(?:localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0|\[::1\])$/i.test(url.hostname);
    if (!["http:", "https:"].includes(url.protocol) || (production && (loopback || url.protocol !== "https:"))) {
      return defaultApiUrl;
    }
    // Keep the session cookie on the storefront host so server-rendered admin
    // pages and browser requests see the same authenticated session.
    if (production && url.origin === "https://backend.hivrasoft.com") return defaultApiUrl;
    return candidate;
  } catch {
    return defaultApiUrl;
  }
}

const browserApiUrl = publicApiUrl(process.env.NEXT_PUBLIC_API_URL);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js substitutes this value in every browser API caller at build time.
  // A missing/mistaken hosting variable must never send live visitors to localhost.
  env: { NEXT_PUBLIC_API_URL: browserApiUrl },
  // Build against fresh production route types; the running dev server owns
  // .next/dev/types and may rewrite those files during a production build.
  typescript: {
    tsconfigPath: process.env.NODE_ENV === "production" ? "tsconfig.build.json" : "tsconfig.json",
  },
  // Include dynamic SEO tags in the initial head for crawlers and share previews.
  htmlLimitedBots: /.*/,
  // Enable only the explicitly supplied temporary preview host in development.
  allowedDevOrigins: process.env.PREVIEW_HOST ? [process.env.PREVIEW_HOST] : [],
  async headers() {
    return production ? [{
      source: "/:path*",
      headers: [{ key: "Strict-Transport-Security", value: "max-age=31536000" }],
    }] : [];
  },
  async redirects() {
    return [
      ...Object.entries(legacyContentLinks).map(([source, destination]) => ({ source, destination, permanent: true })),
      {
        source: "/:path*",
        has: [{ type: "host", value: "www\\.hivrasoft\\.com" }],
        destination: "https://hivrasoft.com/:path*",
        statusCode: 301,
      },
    ];
  },
  async rewrites() {
    const backend = (process.env.API_URL?.trim() || defaultBackendUrl).replace(/\/+$/, "");
    return {
      beforeFiles: [
        { source: "/:slug(buy-[0-9]+-get-[0-9]+-free)", destination: "/offers/:slug" },
        { source: "/:slug(buy-[0-9]+-get-[0-9]+)", destination: "/offers/:slug" },
      ],
      // Keep local API handlers (including legacy blogs) ahead of the backend proxy.
      afterFiles: backend
        ? [{ source: "/api/:path*", destination: backend + "/api/:path*" }]
        : [],
      fallback: [],
    };
  },
  images: {
    imageSizes: [16, 32, 48, 64, 96, 128, 188, 256, 320, 384, 480, 800, 960, 1280, 1600],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "aquamarine-mosquito-320960.hostingersite.com", pathname: "/wp-content/uploads/**" },
    ],
  },
};
export default nextConfig;
