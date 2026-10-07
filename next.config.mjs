/** @type {import('next').NextConfig} */
const nextConfig = {
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
