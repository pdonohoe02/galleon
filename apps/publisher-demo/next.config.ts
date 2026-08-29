import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  transpilePackages: ["@galleon/contracts", "@galleon/publisher-sdk"],
};

export default nextConfig;
