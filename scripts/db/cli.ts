// npm run db:bootstrap | db:migrate | db:seed | db:reset  (acrescente --teste para o banco de testes)
//   bootstrap: cria ou ajusta os papéis e o banco (superusuário; idempotente)
//   migrate:   aplica as migrations com o papel migrator (basta DATABASE_URL_MIGRATOR)
//   seed:      grava o seed fictício (só em localhost, ou com --homologacao; basta DATABASE_URL_MIGRATOR)
//   reset:     apaga e recria o banco, migra e grava o seed (só em localhost)
import { descrever, ehLocal, nomeDoBanco, urlAdmin, urlDoMigrator, urlDoPapel, type Alvo } from "./config.ts";
import { migrar, prepararBanco, prepararPapeis, semear } from "./operacoes.ts";

const [comando, ...opcoes] = process.argv.slice(2);
const alvo: Alvo = opcoes.includes("--teste") ? "teste" : "dev";
const banco = nomeDoBanco(alvo);

function exigirLocal(url: string, acao: string) {
  if (!ehLocal(url) && !opcoes.includes("--homologacao")) {
    throw new Error(`${acao} recusado fora de localhost (${descrever(url)}). Para homologação, use --homologacao.`);
  }
}

// As URLs são lidas dentro de cada comando: na tarefa de migration do servidor só existe a do migrator.
async function executar() {
  switch (comando) {
    case "bootstrap":
      console.log(`Banco: ${descrever(urlDoPapel("admin", alvo))} (${alvo})`);
      await prepararPapeis(urlAdmin());
      await prepararBanco(urlAdmin(), banco, { recriar: false });
      console.log("Papéis e banco prontos.");
      break;
    case "migrate": {
      const url = urlDoMigrator(alvo);
      console.log(`Migrations em: ${descrever(url)} (${alvo})`);
      await migrar(url);
      console.log("Migrations aplicadas.");
      break;
    }
    case "seed": {
      const url = urlDoMigrator(alvo);
      console.log(`Seed em: ${descrever(url)} (${alvo})`);
      exigirLocal(url, "Seed fictício");
      await semear(url);
      console.log("Seed fictício gravado.");
      break;
    }
    case "reset": {
      // O reset deriva tudo do servidor de administração, que precisa ser localhost.
      const url = urlDoPapel("migrator", alvo);
      console.log(`Banco: ${descrever(url)} (${alvo})`);
      if (!ehLocal(urlAdmin()) || !ehLocal(url)) throw new Error(`Reset recusado fora de localhost (${descrever(urlAdmin())}).`);
      await prepararPapeis(urlAdmin());
      await prepararBanco(urlAdmin(), banco, { recriar: true });
      await migrar(url);
      await semear(url);
      console.log("Banco recriado, migrado e com o seed fictício.");
      break;
    }
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
