// npm run test:db — testes de banco contra Postgres real (decisão D13): local (npm run db:start) e no CI.
// O banco de testes (imob_teste) é recriado a cada execução por tests/banco/preparar.ts.
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { urlDoPapel } from "./scripts/db/config.ts";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    // "server-only" barra o módulo no navegador; nos testes (Node) ele é neutro.
    alias: { "server-only": fileURLToPath(new URL("./tests/banco/server-only-vazio.ts", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/banco/**/*.test.ts"],
    globalSetup: ["tests/banco/preparar.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 120_000,
    env: { DATABASE_URL: urlDoPapel("app_user", "teste") },
  },
});
