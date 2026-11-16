// npm run db:bootstrap | db:migrate | db:seed | db:reset  (acrescente --teste para o banco de testes)
//   bootstrap: cria ou ajusta os papéis e o banco (superusuário; idempotente)
//   migrate:   aplica as migrations com o papel migrator
//   seed:      grava o seed fictício (só em localhost, ou com --homologacao)
//   reset:     apaga e recria o banco, migra e grava o seed (só em localhost)
import { descrever, ehLocal, nomeDoBanco, urlAdmin, urlDoPapel, type Alvo } from "./config.ts";
import { migrar, prepararBanco, prepararPapeis, semear } from "./operacoes.ts";

const [comando, ...opcoes] = process.argv.slice(2);
const alvo: Alvo = opcoes.includes("--teste") ? "teste" : "dev";
const banco = nomeDoBanco(alvo);
// Reset e seed sempre derivam do servidor de administração; só o migrate aceita DATABASE_URL_MIGRATOR.
const urlMigrator = urlDoPapel("migrator", alvo);
const urlMigratorMigrate = (alvo === "dev" && process.env.DATABASE_URL_MIGRATOR) || urlMigrator;

function exigirLocal(url: string, acao: string) {
  if (!ehLocal(url) && !opcoes.includes("--homologacao")) {
    throw new Error(`${acao} recusado fora de localhost (${descrever(url)}). Para homologação, use --homologacao.`);
  }
}

async function executar() {
  console.log(`Banco: ${descrever(urlMigrator)} (${alvo})`);
  switch (comando) {
    case "bootstrap":
      await prepararPapeis(urlAdmin());
      await prepararBanco(urlAdmin(), banco, { recriar: false });
      console.log("Papéis e banco prontos.");
      break;
    case "migrate":
      console.log(`Migrations em: ${descrever(urlMigratorMigrate)}`);
      await migrar(urlMigratorMigrate);
      console.log("Migrations aplicadas.");
      break;
    case "seed":
      exigirLocal(urlMigrator, "Seed fictício");
      await semear(urlMigrator);
      console.log("Seed fictício gravado.");
      break;
    case "reset":
      if (!ehLocal(urlAdmin()) || !ehLocal(urlMigrator)) throw new Error(`Reset recusado fora de localhost (${descrever(urlAdmin())}).`);
      await prepararPapeis(urlAdmin());
      await prepararBanco(urlAdmin(), banco, { recriar: true });
      await migrar(urlMigrator);
      await semear(urlMigrator);
      console.log("Banco recriado, migrado e com o seed fictício.");
      break;
    default:
      console.error("Uso: node scripts/db/cli.ts <bootstrap|migrate|seed|reset> [--teste] [--homologacao]");
      process.exit(2);
  }
}

executar().catch((erro: unknown) => {
  // O drizzle embrulha o erro do Postgres em cause; mostre os dois.
  const causa = erro instanceof Error && erro.cause instanceof Error ? ` (${erro.cause.message})` : "";
  console.error(erro instanceof Error ? `${erro.message}${causa}` : erro);
  process.exit(1);
});
