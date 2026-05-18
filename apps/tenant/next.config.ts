import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  transpilePackages: ["@vibe-cms-platform/core"],
  images: {
    // Static export can't run the optimization pipeline; Cloudinary URLs
    // are already optimized at source.
    unoptimized: true,
  },
};

export default nextConfig;
