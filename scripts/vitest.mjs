// Relança o Vitest com a letra do drive em maiúscula. No Windows, um terminal aberto em
// "c:\" (minúsculo) faz o Vitest carregar duas cópias de si ("failed to find the current suite").
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const normalizar = (p) => p.replace(/^[a-z]:/, (d) => d.toUpperCase());
const raiz = normalizar(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));
const cli = path.join(raiz, "node_modules", "vitest", "vitest.mjs");

const { status } = spawnSync(process.execPath, [cli, ...process.argv.slice(2)], {
  cwd: raiz,
  stdio: "inherit",
});
process.exit(status ?? 1);
