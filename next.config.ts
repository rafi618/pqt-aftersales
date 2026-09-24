import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // allow large scanned documents through the login check
    proxyClientMaxBodySize: "200mb",
    serverActions: { bodySizeLimit: "200mb" },
  },
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
