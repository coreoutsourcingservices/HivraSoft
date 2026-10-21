/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build against fresh production route types; the running dev server owns
  // .next/dev/types and may rewrite those files during a production build.
  typescript: {
    tsconfigPath: process.env.NODE_ENV === "production" ? "tsconfig.build.json" : "tsconfig.json",
  },
  // Include dynamic SEO tags in the initial head for crawlers and share previews.
  htmlLimitedBots: /.*/,
  // Enable only the explicitly supplied temporary preview host in development.
  allowedDevOrigins: process.env.PREVIEW_HOST ? [process.env.PREVIEW_HOST] : [],
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www\\.hivrasoft\\.com" }],
        destination: "https://hivrasoft.com/:path*",
        statusCode: 301,
      },
    ];
  },
  async rewrites() {
    const backend = process.env.API_URL?.replace(/\/$/, "");
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
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};
export default nextConfig;
