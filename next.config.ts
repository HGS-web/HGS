import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // For GitHub Pages deployment with custom domain
  // basePath: "",
  // assetPrefix: "",
};

export default nextConfig;
