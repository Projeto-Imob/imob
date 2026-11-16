/**
 * Tenants e contas (fatia 0.2). O papel do produto vem sempre desta tabela, nunca da sessão
 * do Better Auth (design D4). RLS, funções app.* e GRANTs ficam na migration de segurança.
 * Sem imports com alias: este arquivo também é carregado pelos scripts de banco no Node.
 */
import { sql } from "drizzle-orm";
import { boolean, check, index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const tipoTenant = pgEnum("tipo_tenant", ["incorporadora", "plataforma"]);
export const situacaoTenant = pgEnum("situacao_tenant", ["implantacao", "ativo", "suspenso", "encerrado"]);
export const papel = pgEnum("papel", [
  "buyer",
  "client_superadmin",
  "client_manager",
  "sales_member",
  "internal_seller",
  "internal_account_manager",
  "internal_admin",
  "internal_superadmin",
  "god_mode",
]);

const criadoEm = () => timestamp("criado_em", { withTimezone: true, mode: "string" }).notNull().defaultNow();

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  tipo: tipoTenant("tipo").notNull(),
  nomeComercial: text("nome_comercial").notNull(),
  razaoSocial: text("razao_social").notNull(),
  situacao: situacaoTenant("situacao").notNull().default("implantacao"),
  /** Regra 16: dado fictício marcado como exemplo. */
  exemplo: boolean("exemplo").notNull().default(false),
  criadoEm: criadoEm(),
});

export const contas = pgTable(
  "contas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Usuário do Better Auth (ligação criada na fatia 1.4). */
    authUserId: text("auth_user_id").unique(),
    nome: text("nome").notNull(),
    email: text("email").notNull().unique(),
    papel: papel("papel").notNull(),
    /** Nulo para comprador e equipe da plataforma (inclui a house). */
    tenantId: uuid("tenant_id").references(() => tenants.id),
    cargo: text("cargo"),
    whatsapp: text("whatsapp"),
    telefone: text("telefone"),
    ativa: boolean("ativa").notNull().default(true),
    exemplo: boolean("exemplo").notNull().default(false),
    criadoEm: criadoEm(),
  },
  (t) => [
    index("contas_tenant_id_idx").on(t.tenantId),
    // Papéis de cliente pertencem a um tenant; comprador, equipe da plataforma e god mode não.
    check(
      "contas_papel_e_tenant",
      sql`(papel in ('client_superadmin', 'client_manager', 'sales_member')) = (tenant_id is not null)`,
    ),
  ],
);
