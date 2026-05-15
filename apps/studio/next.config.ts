import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Compile @vibe-cms-platform/core from TypeScript source — keeps the monorepo dev loop
  // tight (no rebuild between core edits and studio HMR). For publishing to
  // GitHub Packages we add a build step that emits dist/ alongside src/.
  transpilePackages: ["@vibe-cms-platform/core"],
};

export default nextConfig;
