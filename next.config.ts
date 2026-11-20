import type { NextConfig } from "next";

const isPages = process.env.GITHUB_PAGES === "true";
const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const basePath = isPages && rawBasePath && rawBasePath !== "/"
  ? `/${rawBasePath.replace(/^\/+|\/+$/g, "")}`
  : "";

const nextConfig: NextConfig = isPages
  ? {
      output: "export",
      trailingSlash: true,
      ...(basePath ? { basePath, assetPrefix: `${basePath}/` } : {}),
      images: { unoptimized: true },
      env: {
        NEXT_PUBLIC_BASE_PATH: basePath,
        NEXT_PUBLIC_STATIC_EXPORT: "true",
      },
    }
  : {
      output: "standalone",
    };

export default nextConfig;
