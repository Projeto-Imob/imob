import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Imagem Docker (fatia 0.4): saída standalone só no build da imagem; o e2e e o uso local não mudam.
  ...(process.env.IMOB_STANDALONE === "1" ? { output: "standalone" as const } : {}),
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
