// drizzle-kit só gera o SQL das tabelas a partir do schema (npm run db:generate).
// RLS, funções app.*, GRANTs e restrições especiais ficam em migrations SQL escritas à mão (design D13).
// As migrations são aplicadas por scripts/db/cli.ts, com o papel migrator.
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema/index.ts",
  out: "./db/migrations",
  strict: true,
  verbose: true,
});
