import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CLAUDE.md is our own hand-maintained spec; don't let `next dev` append
  // its generic agent-rules block to it.
  agentRules: false,
  images: {
    remotePatterns: [
      { hostname: "i.ytimg.com" },
    ],
  },
};

export default nextConfig;
