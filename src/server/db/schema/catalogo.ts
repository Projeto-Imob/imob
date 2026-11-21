/**
 * Catálogo mínimo (fatia 0.2): o que a página do empreendimento e a busca precisam.
 * Obra, pontos próximos, mídias e movimentos do espelho entram nas fatias que os usam (migrations aditivas).
 * Localização em latitude e longitude, sem PostGIS na v1 (D5).
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  doublePrecision,
  foreignKey,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { tenants } from "./contas.ts";

export const tipoEmpreendimento = pgEnum("tipo_empreendimento", ["novo", "terceiro"]);
export const visibilidade = pgEnum("visibilidade", ["ativo", "nao_listado", "exclusivo"]);
export const publicacao = pgEnum("publicacao", ["rascunho", "publicado"]);
export const statusSubcondominio = pgEnum("status_subcondominio", ["na_planta", "em_obra", "pronto", "vendido_100"]);
export const grupoSubcondominio = pgEnum("grupo_subcondominio", [
  "residencial",
  "loteamento_horizontal",
  "comercial",
  "residencial_comercial",
]);
export const finalidade = pgEnum("finalidade", ["venda", "aluguel", "venda_ou_aluguel"]);
export const statusUnidade = pgEnum("status_unidade", ["disponivel", "reservada", "vendida"]);
export const escritorio = pgEnum("escritorio", ["house", "plantao"]);
export const momentoFinanciamento = pgEnum("momento_financiamento", ["chaves", "assinatura"]);

const quando = (nome: string) => timestamp(nome, { withTimezone: true, mode: "string" });
const percentual = (nome: string) => numeric(nome, { precision: 5, scale: 2, mode: "number" });

export const empreendimentos = pgTable(
  "empreendimentos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    slug: text("slug").notNull().unique(),
    nome: text("nome").notNull(),
    cnpj: text("cnpj"),
    /** Registro de incorporação: opcional no cadastro, obrigatório para publicar (regra 1). */
    riNumero: text("ri_numero"),
    riCartorio: text("ri_cartorio"),
    riDataRegistro: date("ri_data_registro", { mode: "string" }),
    riPatrimonioAfetacao: boolean("ri_patrimonio_afetacao"),
    tipo: tipoEmpreendimento("tipo").notNull().default("novo"),
    visibilidade: visibilidade("visibilidade").notNull().default("ativo"),
    publicacao: publicacao("publicacao").notNull().default("rascunho"),
    curadoriaAprovada: boolean("curadoria_aprovada").notNull().default(false),
    /** Regra 11: pré-lançamento em stand-by até o consentimento da incorporadora. */
    preLancamentoAtivo: boolean("pre_lancamento_ativo").notNull().default(false),
    descricao: text("descricao").notNull().default(""),
    videos: text("videos").array().notNull().default(sql`'{}'::text[]`),
    capaPath: text("capa_path"),
    mapaInterativoUrl: text("mapa_interativo_url"),
    percentualObra: percentual("percentual_obra").notNull().default(0),
    aceitaPermuta: boolean("aceita_permuta").notNull().default(false),
    /** Ids do catálogo de comodidades; nulo = sem dado cadastrado (não filtra). */
    comodidades: text("comodidades").array(),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    bairro: text("bairro").notNull(),
    cidade: text("cidade").notNull(),
    uf: text("uf").notNull(),
    /** Regra 10: escassez só com espelho atualizado há menos de 24 h. */
    espelhoAtualizadoEm: quando("espelho_atualizado_em"),
    atualizadoEm: quando("atualizado_em").notNull().defaultNow(),
    exemplo: boolean("exemplo").notNull().default(false),
  },
  (t) => [
    index("empreendimentos_tenant_id_idx").on(t.tenantId),
    index("empreendimentos_vitrine_idx").on(t.publicacao, t.visibilidade),
    index("empreendimentos_posicao_idx").on(t.latitude, t.longitude),
    check("empreendimentos_nome_minimo", sql`char_length(btrim(nome)) >= 4`),
    check("empreendimentos_cnpj_formato", sql`cnpj is null or cnpj ~ '^[0-9]{2}\\.[0-9]{3}\\.[0-9]{3}/[0-9]{4}-[0-9]{2}$'`),
    check("empreendimentos_uf", sql`char_length(uf) = 2`),
    check("empreendimentos_percentual_obra", sql`percentual_obra between 0 and 100`),
    check("empreendimentos_posicao", sql`latitude between -90 and 90 and longitude between -180 and 180`),
    // Regra 1 no banco: vale para qualquer papel, inclusive o god mode e o dono das tabelas.
    check(
      "empreendimentos_publicacao_exige_ri",
      sql`publicacao <> 'publicado' or (ri_numero is not null and btrim(ri_numero) <> '' and ri_cartorio is not null and btrim(ri_cartorio) <> '' and ri_data_registro is not null)`,
    ),
  ],
);

/** Dados comerciais sensíveis em tabela separada (design D4): o comprador nunca lê. */
export const empreendimentosComercial = pgTable(
  "empreendimentos_comercial",
  {
    empreendimentoId: uuid("empreendimento_id")
      .primaryKey()
      .references(() => empreendimentos.id),
    comissaoPercentual: percentual("comissao_percentual"),
    escritorio: escritorio("escritorio").notNull().default("house"),
    exemplo: boolean("exemplo").notNull().default(false),
  },
  () => [check("comercial_comissao", sql`comissao_percentual is null or comissao_percentual between 0 and 100`)],
);

export const subcondominios = pgTable(
  "subcondominios",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    empreendimentoId: uuid("empreendimento_id")
      .notNull()
      .references(() => empreendimentos.id),
    nome: text("nome").notNull(),
    status: statusSubcondominio("status").notNull().default("na_planta"),
    grupo: grupoSubcondominio("grupo").notNull().default("residencial"),
    pavimentos: integer("pavimentos"),
    elevadores: integer("elevadores"),
    dataLancamento: date("data_lancamento", { mode: "string" }),
    dataEntrega: date("data_entrega", { mode: "string" }),
    cep: text("cep"),
    logradouro: text("logradouro").notNull(),
    numero: text("numero").notNull(),
    complemento: text("complemento"),
    bairro: text("bairro").notNull(),
    cidade: text("cidade").notNull(),
    uf: text("uf").notNull(),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    infraestrutura: text("infraestrutura").array().notNull().default(sql`'{}'::text[]`),
    outrosItens: text("outros_itens"),
    exemplo: boolean("exemplo").notNull().default(false),
  },
  (t) => [
    index("subcondominios_empreendimento_id_idx").on(t.empreendimentoId),
    // Alvo das FKs compostas: filhos só apontam para subcondomínio do mesmo empreendimento.
    unique("subcondominios_id_empreendimento").on(t.id, t.empreendimentoId),
    check("subcondominios_pavimentos", sql`pavimentos is null or pavimentos >= 0`),
    check("subcondominios_elevadores", sql`elevadores is null or elevadores >= 0`),
  ],
);

export const tipologias = pgTable(
  "tipologias",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    empreendimentoId: uuid("empreendimento_id")
      .notNull()
      .references(() => empreendimentos.id),
    nome: text("nome").notNull(),
    /** Tipo da lista da especificação (validado na fronteira com Zod). */
    tipo: text("tipo").notNull(),
    finalidade: finalidade("finalidade").notNull().default("venda"),
    plantaPath: text("planta_path"),
    dormitorios: integer("dormitorios").notNull().default(0),
    suites: integer("suites").notNull().default(0),
    suitesMaster: integer("suites_master").notNull().default(0),
    banheiros: integer("banheiros").notNull().default(0),
    lavabos: integer("lavabos").notNull().default(0),
    vagas: integer("vagas").notNull().default(0),
    exemplo: boolean("exemplo").notNull().default(false),
  },
  (t) => [
    index("tipologias_empreendimento_id_idx").on(t.empreendimentoId),
    unique("tipologias_id_empreendimento").on(t.id, t.empreendimentoId),
    check(
      "tipologias_contagens",
      sql`dormitorios >= 0 and suites >= 0 and suites_master >= 0 and banheiros >= 0 and lavabos >= 0 and vagas >= 0`,
    ),
  ],
);

/**
 * Subcondomínios que usam a tipologia (no mínimo 1; a checagem entra na fatia 1.8).
 * FKs compostas: tipologia e subcondomínio são sempre do mesmo empreendimento (sem referência cruzada entre tenants).
 */
export const tipologiaSubcondominios = pgTable(
  "tipologia_subcondominios",
  {
    empreendimentoId: uuid("empreendimento_id")
      .notNull()
      .references(() => empreendimentos.id),
    tipologiaId: uuid("tipologia_id").notNull(),
    subcondominioId: uuid("subcondominio_id").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.tipologiaId, t.subcondominioId] }),
    index("tipologia_subcondominios_empreendimento_id_idx").on(t.empreendimentoId),
    index("tipologia_subcondominios_subcondominio_id_idx").on(t.subcondominioId),
    foreignKey({
      name: "tipologia_subcondominios_tipologia_mesmo_empreendimento",
      columns: [t.tipologiaId, t.empreendimentoId],
      foreignColumns: [tipologias.id, tipologias.empreendimentoId],
    }),
    foreignKey({
      name: "tipologia_subcondominios_subcondominio_mesmo_empreendimento",
      columns: [t.subcondominioId, t.empreendimentoId],
      foreignColumns: [subcondominios.id, subcondominios.empreendimentoId],
    }),
  ],
);

export const unidades = pgTable(
  "unidades",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    empreendimentoId: uuid("empreendimento_id")
      .notNull()
      .references(() => empreendimentos.id),
    tipologiaId: uuid("tipologia_id").notNull(),
    subcondominioId: uuid("subcondominio_id").notNull(),
    identificador: text("identificador").notNull(),
    areaPrivativa: numeric("area_privativa", { precision: 10, scale: 2, mode: "number" }).notNull(),
    preco: numeric("preco", { precision: 14, scale: 2, mode: "number" }).notNull(),
    status: statusUnidade("status").notNull().default("disponivel"),
    exemplo: boolean("exemplo").notNull().default(false),
  },
  (t) => [
    index("unidades_empreendimento_id_idx").on(t.empreendimentoId),
    index("unidades_tipologia_id_idx").on(t.tipologiaId),
    index("unidades_subcondominio_id_idx").on(t.subcondominioId, t.status),
    unique("unidades_identificador_por_subcondominio").on(t.subcondominioId, t.identificador),
    // Tipologia e subcondomínio da unidade são sempre do mesmo empreendimento dela.
    foreignKey({
      name: "unidades_tipologia_mesmo_empreendimento",
      columns: [t.tipologiaId, t.empreendimentoId],
      foreignColumns: [tipologias.id, tipologias.empreendimentoId],
    }),
    foreignKey({
      name: "unidades_subcondominio_mesmo_empreendimento",
      columns: [t.subcondominioId, t.empreendimentoId],
      foreignColumns: [subcondominios.id, subcondominios.empreendimentoId],
    }),
    check("unidades_valores", sql`area_privativa > 0 and preco > 0`),
  ],
);

export const planos = pgTable(
  "planos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    empreendimentoId: uuid("empreendimento_id")
      .notNull()
      .references(() => empreendimentos.id),
    nome: text("nome").notNull(),
    sinalPercentual: percentual("sinal_percentual").notNull(),
    mensaisPercentual: percentual("mensais_percentual").notNull(),
    /** Sem número de parcelas, a parcela calculada é nula. */
    numeroParcelas: integer("numero_parcelas"),
    intercaladasPercentual: percentual("intercaladas_percentual").notNull().default(0),
    chavesPercentual: percentual("chaves_percentual").notNull().default(0),
    saldoPercentual: percentual("saldo_percentual").notNull().default(0),
    indiceCorrecao: text("indice_correcao"),
    financiamentoAceita: boolean("financiamento_aceita").notNull().default(false),
    financiamentoMomento: momentoFinanciamento("financiamento_momento"),
    financiamentoPercentualMaximo: percentual("financiamento_percentual_maximo"),
    fgts: boolean("fgts").notNull().default(false),
    dacao: boolean("dacao").notNull().default(false),
    parcelamentoDireto: boolean("parcelamento_direto").notNull().default(false),
    exemplo: boolean("exemplo").notNull().default(false),
  },
  (t) => [
    index("planos_empreendimento_id_idx").on(t.empreendimentoId),
    check("planos_parcelas", sql`numero_parcelas is null or numero_parcelas > 0`),
    check(
      "planos_percentuais",
      sql`sinal_percentual between 0 and 100 and mensais_percentual between 0 and 100 and intercaladas_percentual between 0 and 100 and chaves_percentual between 0 and 100 and saldo_percentual between 0 and 100`,
    ),
  ],
);

export const categoriaPonto = pgEnum("categoria_ponto", ["escola", "parque", "hospital", "academia", "mercado", "transporte"]);

/** Vizinhança com distância (fatia 1.1): o tempo a pé é calculado na leitura (80 m/min), nunca guardado. */
export const pontosProximos = pgTable(
  "pontos_proximos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    empreendimentoId: uuid("empreendimento_id")
      .notNull()
      .references(() => empreendimentos.id),
    categoria: categoriaPonto("categoria").notNull(),
    nome: text("nome").notNull(),
    distanciaM: integer("distancia_m").notNull(),
    exemplo: boolean("exemplo").notNull().default(false),
  },
  (t) => [
    index("pontos_proximos_empreendimento_id_idx").on(t.empreendimentoId),
    unique("pontos_proximos_unico").on(t.empreendimentoId, t.categoria, t.nome),
    check("pontos_proximos_distancia", sql`distancia_m >= 0`),
  ],
);

/**
 * Cartão do escritório de vendas: um por empreendimento (fatia 1.1). Só a house por enquanto (decisão 11);
 * a leitura pública não passa por `contas`, que o visitante não lê.
 */
export const escritoriosVendas = pgTable("escritorios_vendas", {
  empreendimentoId: uuid("empreendimento_id")
    .primaryKey()
    .references(() => empreendimentos.id),
  origem: escritorio("origem").notNull().default("house"),
  nome: text("nome").notNull(),
  cargo: text("cargo"),
  experiencia: text("experiencia"),
  fotoPath: text("foto_path"),
  whatsapp: text("whatsapp"),
  email: text("email"),
  telefone: text("telefone"),
  exemplo: boolean("exemplo").notNull().default(false),
});
