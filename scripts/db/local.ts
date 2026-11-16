// npm run db:start | db:stop | db:status — Postgres 17 local, sem Docker (decisão D4).
// Binários portáteis oficiais (zip da EDB) e dados fora do repositório. Caminhos ajustáveis
// por PG_BIN e PGDATA_IMOB; o padrão é o da máquina do Matheus.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const PG_BIN = process.env.PG_BIN ?? "C:/dev/ferramentas/pgsql/bin";
const PGDATA = process.env.PGDATA_IMOB ?? "C:/dev/ferramentas/pgdata-imob";
const LOG = `${PGDATA}.log`;
const pgCtl = path.join(PG_BIN, process.platform === "win32" ? "pg_ctl.exe" : "pg_ctl");

if (!fs.existsSync(pgCtl) || !fs.existsSync(PGDATA)) {
  console.error(`Postgres local não encontrado (PG_BIN=${PG_BIN}, PGDATA_IMOB=${PGDATA}). Veja "Banco local" no README.`);
  process.exit(1);
}

// stdio "ignore": o servidor não herda o terminal, então o comando termina e o Postgres continua no ar.
const pg = (...args: string[]) => spawnSync(pgCtl, ["-D", PGDATA, ...args], { stdio: "ignore" }).status ?? 1;

switch (process.argv[2]) {
  case "start": {
    if (pg("status") === 0) {
      console.log("Postgres local já está no ar.");
      break;
    }
    const status = pg("-l", LOG, "-w", "-t", "30", "start");
    console.log(status === 0 ? "Postgres local no ar (localhost:5432)." : `Falhou ao iniciar; veja ${LOG}`);
    process.exit(status);
    break;
  }
  case "stop": {
    const status = pg("-m", "fast", "-w", "stop");
    console.log(status === 0 ? "Postgres local parado." : "Postgres local já estava parado.");
    break;
  }
  case "status":
    console.log(pg("status") === 0 ? "Postgres local no ar." : "Postgres local parado.");
    break;
  default:
    console.error("Uso: node scripts/db/local.ts <start|stop|status>");
    process.exit(2);
}
