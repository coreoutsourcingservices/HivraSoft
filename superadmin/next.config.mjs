/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const backend = (process.env.API_URL || "http://localhost:5000").replace(/\/$/, "");
    const admin = (process.env.ADMIN_INTERNAL_URL || "http://localhost:3001").replace(/\/$/, "");
    return [
      { source: "/api/:path*", destination: `${backend}/api/:path*` },
      { source: "/admin-static/_next/:path*", destination: `${admin}/_next/:path*` },
      { source: "/admin", destination: `${admin}/admin` },
      { source: "/admin/:path*", destination: `${admin}/admin/:path*` },
    ];
  },
};
export default nextConfig;
