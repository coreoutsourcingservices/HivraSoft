/** @type {import('next').NextConfig} */
const nextConfig = {
  assetPrefix: "/admin-static",
  images: { remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }] },
  async rewrites() {
    const backend = (process.env.API_URL || "http://localhost:5000").replace(/\/$/, "");
    return [{ source: "/api/:path*", destination: backend + "/api/:path*" }];
  },
};
export default nextConfig;
