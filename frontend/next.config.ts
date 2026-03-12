import type { NextConfig } from "next";

const BACKEND = "http://localhost:8080";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND}/api/:path*`,
      },
      {
        source: "/auth/:path*",
        destination: `${BACKEND}/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
