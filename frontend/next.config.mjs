import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: fileURLToPath(new URL(".", import.meta.url)),
  async redirects() {
    const admin = (process.env.NEXT_PUBLIC_ADMIN_URL || process.env.ADMIN_URL || "http://localhost:3001").replace(/\/$/, "");
    return [
      { source: "/admin/:path*", destination: `${admin}/:path*`, permanent: false },
      { source: "/superadmin/:path*", destination: `${admin}/superadmin/:path*`, permanent: false },
      { source: "/register", destination: `${admin}/register`, permanent: false },
      { source: "/change-password", destination: `${admin}/change-password`, permanent: false },
    ];
  },
  async rewrites() {
    const backend = (process.env.API_URL || "http://localhost:5000").replace(/\/$/, "");
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
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};
export default nextConfig;
