// npm run seed:json — grava o seed fictício (fonte única, src/seed/seed.ts) em JSON
// para o seed do banco (grupo 4). O arquivo gerado não é versionado.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gerarSeed } from "../src/seed/seed.ts";

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const destino = path.join(raiz, "db", "seed", "seed.gerado.json");
fs.mkdirSync(path.dirname(destino), { recursive: true });
fs.writeFileSync(destino, JSON.stringify(gerarSeed(), null, 2) + "\n");
console.log(`Seed gravado em ${path.relative(raiz, destino)}`);
