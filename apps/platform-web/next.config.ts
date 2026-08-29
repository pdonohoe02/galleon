import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@galleon/contracts"],
};

export default nextConfig;
