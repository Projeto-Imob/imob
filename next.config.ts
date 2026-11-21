import type { NextConfig } from "next";
import { montarCabecalhos } from "./config/cabecalhos";

const nextConfig: NextConfig = {
  // Imagem Docker (fatia 0.4): saída standalone só no build da imagem; o e2e e o uso local não mudam.
  ...(process.env.IMOB_STANDALONE === "1" ? { output: "standalone" as const } : {}),
  // CSP e cabeçalhos de segurança (fatia 0.5a): sem nonce, para manter o cache das páginas públicas.
  async headers() {
    const cabecalhos = montarCabecalhos({
      desenvolvimento: process.env.NODE_ENV === "development",
      sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN,
    });
    return [{ source: "/:path*", headers: cabecalhos }];
  },
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
