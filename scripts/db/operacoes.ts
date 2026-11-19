// Operações de banco usadas pela CLI (scripts/db/cli.ts) e pela preparação dos testes de banco.
import { createHash, createHmac, pbkdf2Sync, randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { gerarSeed } from "../../src/seed/seed.ts";
import * as s from "../../src/server/db/schema/index.ts";
import { LIMITES_DO_PAPEL, PAPEIS_BANCO, ehLocal, senhaDoPapel } from "./config.ts";

const PASTA_MIGRATIONS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../db/migrations");

async function comCliente<T>(url: string, fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  try {
    return await fn(c);
  } finally {
    await c.end();
  }
}

/**
 * Verificador SCRAM-SHA-256 no formato que o Postgres guarda. Enviar o verificador em vez da senha
 * evita que a senha em texto apareça em log de erro ou em pg_stat_statements.
 */
export function verificadorScram(senha: string, iteracoes = 4096): string {
  const sal = randomBytes(16);
  const salgada = pbkdf2Sync(senha.normalize("NFKC"), sal, iteracoes, 32, "sha256");
  const chaveCliente = createHmac("sha256", salgada).update("Client Key").digest();
  const chaveArmazenada = createHash("sha256").update(chaveCliente).digest();
  const chaveServidor = createHmac("sha256", salgada).update("Server Key").digest();
  return `SCRAM-SHA-256$${iteracoes}:${sal.toString("base64")}$${chaveArmazenada.toString("base64")}:${chaveServidor.toString("base64")}`;
}

/**
 * Cria ou ajusta os papéis do banco (operação do cluster, idempotente).
 * Nenhum deles é superusuário nem ignora RLS. Senhas vêm de DB_SENHA_<PAPEL>; fora de localhost são obrigatórias.
 */
export async function prepararPapeis(urlAdmin: string): Promise<void> {
  const local = ehLocal(urlAdmin);
  for (const papel of PAPEIS_BANCO) {
    if (!local && !senhaDoPapel(papel)) {
      throw new Error(`Defina DB_SENHA_${papel.toUpperCase()} para preparar papéis fora de localhost.`);
    }
  }
  await comCliente(urlAdmin, async (c) => {
    for (const papel of PAPEIS_BANCO) {
      const ident = c.escapeIdentifier(papel);
      const existe = await c.query("select 1 from pg_roles where rolname = $1", [papel]);
      const atributos = "login nosuperuser nocreatedb nocreaterole nobypassrls noinherit";
      await c.query(existe.rowCount ? `alter role ${ident} ${atributos}` : `create role ${ident} ${atributos}`);
      const senha = senhaDoPapel(papel);
      if (senha) await c.query(`alter role ${ident} password ${c.escapeLiteral(verificadorScram(senha))}`);
      const limites = LIMITES_DO_PAPEL[papel];
      if (limites) {
        await c.query(`alter role ${ident} set statement_timeout = ${c.escapeLiteral(limites.statementTimeout)}`);
        await c.query(`alter role ${ident} set idle_in_transaction_session_timeout = ${c.escapeLiteral(limites.idleInTransactionSessionTimeout)}`);
      }
    }
  });
}

/** Algum registro real (exemplo = false) nas tabelas principais? Recriar um banco assim é recusado. */
async function temDadoReal(urlAdmin: string, nome: string): Promise<boolean> {
  const u = new URL(urlAdmin);
  u.pathname = `/${nome}`;
  return comCliente(u.toString(), async (c) => {
    for (const tabela of ["tenants", "contas", "empreendimentos"]) {
      const existe = await c.query("select to_regclass($1) is not null as existe", [`public.${tabela}`]);
      if (!existe.rows[0]?.existe) continue;
      const real = await c.query(`select exists (select 1 from public.${tabela} where not exemplo) as real`);
      if (real.rows[0]?.real) return true;
    }
    return false;
  });
}

/**
 * Cria o banco com dono migrator e fuso de São Paulo. Recriar apaga tudo e só é aceito em localhost
 * e num banco sem nenhum dado real.
 */
export async function prepararBanco(urlAdmin: string, nome: string, opcoes: { recriar: boolean }): Promise<void> {
  if (opcoes.recriar && !ehLocal(urlAdmin)) throw new Error("Recriar banco só é permitido em localhost.");
  const existia = await comCliente(urlAdmin, async (c) => !!(await c.query("select 1 from pg_database where datname = $1", [nome])).rowCount);
  if (opcoes.recriar && existia && (await temDadoReal(urlAdmin, nome))) {
    throw new Error(`Recriar recusado: o banco ${nome} tem dados reais (exemplo = false).`);
  }
  await comCliente(urlAdmin, async (c) => {
    const ident = c.escapeIdentifier(nome);
    if (opcoes.recriar) await c.query(`drop database if exists ${ident} with (force)`);
    const existe = await c.query("select 1 from pg_database where datname = $1", [nome]);
    if (!existe.rowCount) await c.query(`create database ${ident} owner migrator encoding 'UTF8'`);
    // Banco criado antes por outro caminho (ex.: POSTGRES_DB do contêiner) passa a ser do migrator.
    await c.query(`alter database ${ident} owner to migrator`);
    await c.query(`alter database ${ident} set timezone to 'America/Sao_Paulo'`);
    await c.query(`revoke all on database ${ident} from public`);
    await c.query(`grant connect on database ${ident} to app_user, auth_service, worker`);
  });
}

/** Aplica as migrations pendentes, numa transação, com o papel migrator. */
export async function migrar(urlMigrator: string): Promise<void> {
  const pool = new pg.Pool({ connectionString: urlMigrator, max: 1 });
  try {
    await migrate(drizzle({ client: pool }), { migrationsFolder: PASTA_MIGRATIONS, migrationsSchema: "drizzle" });
  } finally {
    await pool.end();
  }
}

/** Grava o seed fictício (src/seed/seed.ts) como migrator, dono das tabelas. Idempotente. */
export async function semear(urlMigrator: string): Promise<void> {
  const seed = gerarSeed();
  const pool = new pg.Pool({ connectionString: urlMigrator, max: 1 });
  const db = drizzle({ client: pool });
  try {
    await db.transaction(async (tx) => {
      await tx
        .insert(s.tenants)
        .values(seed.incorporadoras.map((i) => ({ id: i.id, tipo: "incorporadora" as const, nomeComercial: i.nomeComercial, razaoSocial: i.razaoSocial, situacao: i.situacao, exemplo: true })))
        .onConflictDoNothing();
      await tx
        .insert(s.contas)
        .values(
          seed.contas.map((c) => ({
            id: c.id, nome: c.nome, email: c.email, papel: c.papel, tenantId: c.tenantId, cargo: c.cargo,
            whatsapp: c.whatsapp, telefone: c.telefone, ativa: c.ativa, exemplo: true,
          })),
        )
        .onConflictDoNothing();
      await tx
        .insert(s.empreendimentos)
        .values(
          seed.empreendimentos.map((e) => ({
            id: e.id, tenantId: e.tenantId, slug: e.slug, nome: e.nome, cnpj: e.cnpj,
            riNumero: e.ri?.numero ?? null, riCartorio: e.ri?.cartorio ?? null,
            riDataRegistro: e.ri?.dataRegistro ?? null, riPatrimonioAfetacao: e.ri?.patrimonioAfetacao ?? null,
            tipo: e.tipo, visibilidade: e.visibilidade, publicacao: e.publicacao, curadoriaAprovada: e.curadoriaAprovada,
            preLancamentoAtivo: e.preLancamentoAtivo, descricao: e.descricao, videos: e.videos, capaPath: e.capaPath,
            mapaInterativoUrl: e.mapaInterativoUrl, percentualObra: e.percentualObra, aceitaPermuta: e.aceitaPermuta,
            comodidades: e.comodidades, latitude: e.localizacao.lat, longitude: e.localizacao.lng,
            bairro: e.bairro, cidade: e.cidade, uf: e.uf, espelhoAtualizadoEm: e.espelhoAtualizadoEm,
            atualizadoEm: e.atualizadoEm, exemplo: true,
          })),
        )
        .onConflictDoNothing();
      await tx
        .insert(s.empreendimentosComercial)
        .values(seed.comerciais.map((c) => ({ empreendimentoId: c.empreendimentoId, comissaoPercentual: c.comissaoPercentual, escritorio: c.escritorio, exemplo: true })))
        .onConflictDoNothing();
      await tx
        .insert(s.subcondominios)
        .values(
          seed.subcondominios.map((sc) => ({
            id: sc.id, empreendimentoId: sc.empreendimentoId, nome: sc.nome, status: sc.status, grupo: sc.grupo,
            pavimentos: sc.pavimentos, elevadores: sc.elevadores, dataLancamento: sc.dataLancamento, dataEntrega: sc.dataEntrega,
            cep: sc.endereco.cep, logradouro: sc.endereco.logradouro, numero: sc.endereco.numero, complemento: sc.endereco.complemento,
            bairro: sc.endereco.bairro, cidade: sc.endereco.cidade, uf: sc.endereco.uf,
            latitude: sc.endereco.posicao.lat, longitude: sc.endereco.posicao.lng,
            infraestrutura: sc.infraestrutura, outrosItens: sc.outrosItens, exemplo: true,
          })),
        )
        .onConflictDoNothing();
      await tx
        .insert(s.tipologias)
        .values(
          seed.tipologias.map((t) => ({
            id: t.id, empreendimentoId: t.empreendimentoId, nome: t.nome, tipo: t.tipo, finalidade: t.finalidade,
            plantaPath: t.plantaPath, dormitorios: t.dormitorios, suites: t.suites, suitesMaster: t.suitesMaster,
            banheiros: t.banheiros, lavabos: t.lavabos, vagas: t.vagas, exemplo: true,
          })),
        )
        .onConflictDoNothing();
      await tx
        .insert(s.tipologiaSubcondominios)
        .values(seed.tipologias.flatMap((t) => t.subcondominioIds.map((subcondominioId) => ({ empreendimentoId: t.empreendimentoId, tipologiaId: t.id, subcondominioId }))))
        .onConflictDoNothing();
      await tx
        .insert(s.unidades)
        .values(
          seed.unidades.map((u) => ({
            id: u.id, empreendimentoId: u.empreendimentoId, tipologiaId: u.tipologiaId, subcondominioId: u.subcondominioId,
            identificador: u.identificador, areaPrivativa: u.areaPrivativa, preco: u.preco, status: u.status, exemplo: true,
          })),
        )
        .onConflictDoNothing();
      await tx
        .insert(s.planos)
        .values(
          seed.planos.map((p) => ({
            id: p.id, empreendimentoId: p.empreendimentoId, nome: p.nome, sinalPercentual: p.sinalPercentual,
            mensaisPercentual: p.mensaisPercentual, numeroParcelas: p.numeroParcelas, intercaladasPercentual: p.intercaladasPercentual,
            chavesPercentual: p.chavesPercentual, saldoPercentual: p.saldoPercentual, indiceCorrecao: p.indiceCorrecao,
            financiamentoAceita: p.financiamento.aceita, financiamentoMomento: p.financiamento.momento,
            financiamentoPercentualMaximo: p.financiamento.percentualMaximo, fgts: p.financiamento.fgts,
            dacao: p.financiamento.dacao, parcelamentoDireto: p.financiamento.parcelamentoDireto, exemplo: true,
          })),
        )
        .onConflictDoNothing();
      await tx
        .insert(s.pontosProximos)
        .values(
          seed.empreendimentos.flatMap((e) =>
            e.pontosProximos.map((p) => ({ empreendimentoId: e.id, categoria: p.categoria, nome: p.nome, distanciaM: p.distanciaM, exemplo: true })),
          ),
        )
        .onConflictDoNothing();
      await tx
        .insert(s.escritoriosVendas)
        .values(
          seed.escritorios.map((o) => ({
            empreendimentoId: o.empreendimentoId, origem: o.origem, nome: o.nome, cargo: o.cargo, experiencia: o.experiencia,
            fotoPath: o.fotoPath, whatsapp: o.whatsapp, email: o.email, telefone: o.telefone, exemplo: true,
          })),
        )
        .onConflictDoNothing();
    });
  } finally {
    await pool.end();
  }
}
