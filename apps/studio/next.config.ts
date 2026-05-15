import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Compile @vibe-cms-platform/core from TypeScript source — keeps the monorepo dev loop
  // tight (no rebuild between core edits and studio HMR). For publishing to
  // GitHub Packages we add a build step that emits dist/ alongside src/.
  transpilePackages: ["@vibe-cms-platform/core"],

  // Standalone output: ships a self-contained server.js + minimal node_modules
  // in .next/standalone. The Dockerfile copies that bundle into a small runner.
  output: "standalone",
  // Monorepo: tell Next to trace files from the repo root so workspace
  // packages are included in the standalone bundle.
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;
