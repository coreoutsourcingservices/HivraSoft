import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: fileURLToPath(new URL(".", import.meta.url)),
  async rewrites() {
    const backend = (process.env.API_URL || "http://localhost:5000").replace(/\/$/, "");
    const admin = (process.env.ADMIN_URL || "http://localhost:3001").replace(/\/$/, "");
    return {
      beforeFiles: [
        { source: "/superadmin/:path*", destination: `${admin}/superadmin/:path*` },
        { source: "/register", destination: `${admin}/register` },
        { source: "/change-password", destination: `${admin}/change-password` },
        { source: "/admin/:path*", destination: `${admin}/admin/:path*` },
        { source: "/admin-static/:path*", destination: `${admin}/admin-static/:path*` },
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
