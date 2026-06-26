import type { NextConfig } from "next";

const isCI = process.env.GITHUB_ACTIONS === "true";
const basePath = isCI ? "/magic-ai-pipeline-demo" : "";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  basePath: basePath || undefined,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  trailingSlash: true,
  // Exposed to the client so fetch()/asset URLs can prefix the GitHub Pages base.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
