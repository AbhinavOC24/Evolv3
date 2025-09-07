import type { NextConfig } from "next";

const backendUrl =
  process.env.NODE_ENV === "production" ? "" : "http://localhost:8000";
const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
