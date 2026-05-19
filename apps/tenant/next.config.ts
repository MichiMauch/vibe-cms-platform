import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  transpilePackages: ["@vibe-cms-platform/core"],
  // Emit /<slug>/index.html and /<slug>/<locale>/index.html so the Pages
  // Worker can rewrite `/` → `/<slug>/` cleanly without bouncing through
  // a 308 trailing-slash redirect that briefly exposes the slug in the URL.
  trailingSlash: true,
  images: {
    // Static export can't run the optimization pipeline; Cloudinary URLs
    // are already optimized at source.
    unoptimized: true,
  },
};

export default nextConfig;
