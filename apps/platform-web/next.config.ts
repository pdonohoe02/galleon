import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  transpilePackages: ["@galleon/contracts", "@galleon/crypto", "@galleon/database"],
};

export default nextConfig;
