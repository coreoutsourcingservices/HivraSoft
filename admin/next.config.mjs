import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Shared hosting has a process limit; do not derive workers from host CPU count.
  experimental: { cpus: 2, preloadEntriesOnStart: false },
  outputFileTracingRoot: fileURLToPath(new URL(".", import.meta.url)),
  assetPrefix: "/admin-static",
  images: { remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }] },
  async rewrites() {
    const backend = (process.env.API_URL || "http://localhost:5000").replace(/\/$/, "");
    return [{ source: "/api/:path*", destination: backend + "/api/:path*" }, { source: "/admin-static/_next/:path*", destination: "/_next/:path*" }];
  },
};
export default nextConfig;
