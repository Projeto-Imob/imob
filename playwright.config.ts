import { defineConfig, devices } from "@playwright/test";

const PORTA = Number(process.env.E2E_PORTA ?? 3100);

// E2E contra o build de produção, para medir o que vai ao ar.
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Máquina de desenvolvimento com 2 núcleos e 8 GB: poucos workers.
  workers: process.env.CI ? 2 : 1,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORTA}`,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build && npm run start -- --port ${PORTA}`,
    url: `http://localhost:${PORTA}`,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    // next start roda em produção e exige DATABASE_URL. Padrão: o Postgres local com o seed (npm run db:reset).
    env: { DATABASE_URL: process.env.DATABASE_URL ?? "postgres://app_user@localhost:5432/imob" },
  },
});
