/**
 * Tipos de domínio (tarefa 2.1). Schemas Zod estritos: campo desconhecido é recusado.
 * Fonte: CLAUDE.md seções 4 a 9 e specs de catálogo, busca e house.
 * Valores monetários em reais (número), áreas em m², distâncias em metros, datas ISO.
 */
import { z } from "zod";

export const id = z.uuid();
const dataIso = z.iso.date();
const dataHoraIso = z.iso.datetime({ offset: true });
const percentual = z.number().min(0).max(100);
const reais = z.number().nonnegative();
const inteiroNaoNegativo = z.number().int().nonnegative();

/** Todo dado é fictício e marcado como exemplo (regra 16). */
const exemplo = z.literal(true);

export const coordenadas = z.strictObject({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type Coordenadas = z.infer<typeof coordenadas>;

// ---------- Tenants ----------

export const situacaoTenant = z.enum(["implantacao", "ativo", "suspenso", "encerrado"]);

export const incorporadora = z.strictObject({
  id,
  tipo: z.literal("incorporadora"),
  nomeComercial: z.string().min(1),
  razaoSocial: z.string().min(1),
  situacao: situacaoTenant,
  exemplo,
});
export type Incorporadora = z.infer<typeof incorporadora>;

// ---------- Contas e papéis ----------

export const papel = z.enum([
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
export type Papel = z.infer<typeof papel>;

export const conta = z.strictObject({
  id,
  nome: z.string().min(1),
  email: z.email(),
  papel,
  /** Nulo para buyer e equipe da plataforma (inclui a house). */
  tenantId: id.nullable(),
  cargo: z.string().nullable(),
  whatsapp: z
    .string()
    .regex(/^\+?\d{10,13}$/)
    .nullable(),
  telefone: z
    .string()
    .regex(/^\+?\d{10,13}$/)
    .nullable(),
  ativa: z.boolean(),
  exemplo,
});
export type Conta = z.infer<typeof conta>;

// ---------- Catálogo de comodidades ----------

export const comodidade = z.strictObject({
  id: z.string().regex(/^[a-z0-9_]+$/),
  nome: z.string().min(1),
  grupo: z.enum(["uso_comum", "infraestrutura_seguranca"]),
  /** Palavras-chave para ler o texto livre dos requisitos sem IA (minúsculas, sem acento). */
  palavrasChave: z.array(z.string().min(2)).min(1),
});
export type Comodidade = z.infer<typeof comodidade>;

// ---------- Empreendimento ----------

export const registroIncorporacao = z.strictObject({
  numero: z.string().min(1),
  cartorio: z.string().min(1),
  dataRegistro: dataIso,
  patrimonioAfetacao: z.boolean(),
});
export type RegistroIncorporacao = z.infer<typeof registroIncorporacao>;

export const etapaObra = z.strictObject({ nome: z.string().min(1), percentual });

export const categoriaPonto = z.enum(["escola", "parque", "hospital", "academia", "mercado", "transporte"]);
export type CategoriaPonto = z.infer<typeof categoriaPonto>;

export const pontoProximo = z.strictObject({
  categoria: categoriaPonto,
  nome: z.string().min(1),
  distanciaM: z.number().int().nonnegative(),
});
export type PontoProximo = z.infer<typeof pontoProximo>;

export const empreendimento = z.strictObject({
  id,
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  tenantId: id,
  nome: z.string().min(4),
  cnpj: z
    .string()
    .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)
    .nullable(),
  /** Nulo enquanto não houver R.I. (opcional no cadastro, obrigatório para publicar). */
  ri: registroIncorporacao.nullable(),
  tipo: z.enum(["novo", "terceiro"]),
  visibilidade: z.enum(["ativo", "nao_listado", "exclusivo"]),
  /** Situação editorial: rascunho até a publicação. */
  publicacao: z.enum(["rascunho", "publicado"]),
  curadoriaAprovada: z.boolean(),
  /** Regra 11: pré-lançamento fica em stand-by, desligado por padrão. */
  preLancamentoAtivo: z.boolean(),
  descricao: z.string(),
  videos: z.array(z.url()),
  capaPath: z.string().nullable(),
  mapaInterativoUrl: z.url().nullable(),
  obraEtapas: z.array(etapaObra),
  percentualObra: percentual,
  aceitaPermuta: z.boolean(),
  /** Ids do catálogo de comodidades. Nulo = sem dado cadastrado (não filtra por comodidade). */
  comodidades: z.array(z.string().min(1)).nullable(),
  localizacao: coordenadas,
  bairro: z.string().min(1),
  cidade: z.string().min(1),
  uf: z.string().length(2),
  pontosProximos: z.array(pontoProximo),
  /** Última atualização do espelho de unidades (regra 10: escassez só com < 24 h). */
  espelhoAtualizadoEm: dataHoraIso.nullable(),
  atualizadoEm: dataHoraIso,
  exemplo,
});
export type Empreendimento = z.infer<typeof empreendimento>;

/** Dados comerciais sensíveis em tabela separada (design D4): nunca visíveis ao comprador. */
export const empreendimentoComercial = z.strictObject({
  empreendimentoId: id,
  comissaoPercentual: percentual.nullable(),
  /** Quem aparece no escritório de vendas: a house (padrão) ou o plantão da incorporadora. */
  escritorio: z.enum(["house", "plantao"]),
  exemplo,
});
export type EmpreendimentoComercial = z.infer<typeof empreendimentoComercial>;

// ---------- Subcondomínio, tipologia, unidade ----------

export const statusSubcondominio = z.enum(["na_planta", "em_obra", "pronto", "vendido_100"]);

export const endereco = z.strictObject({
  cep: z
    .string()
    .regex(/^\d{5}-\d{3}$/)
    .nullable(),
  logradouro: z.string().min(1),
  numero: z.string().min(1),
  complemento: z.string().nullable(),
  bairro: z.string().min(1),
  cidade: z.string().min(1),
  uf: z.string().length(2),
  posicao: coordenadas,
});

export const subcondominio = z.strictObject({
  id,
  empreendimentoId: id,
  nome: z.string().min(1),
  status: statusSubcondominio,
  grupo: z.enum(["residencial", "loteamento_horizontal", "comercial", "residencial_comercial"]),
  pavimentos: inteiroNaoNegativo.nullable(),
  elevadores: inteiroNaoNegativo.nullable(),
  dataLancamento: dataIso.nullable(),
  dataEntrega: dataIso.nullable(),
  endereco,
  infraestrutura: z.array(z.string().min(1)),
  outrosItens: z.string().nullable(),
  exemplo,
});
export type Subcondominio = z.infer<typeof subcondominio>;

export const TIPOS_TIPOLOGIA = {
  residencial: [
    "Apartamento", "Casa", "Casa de condomínio", "Casa em condomínio rural", "Chácara", "Cobertura", "Duplex",
    "Duplex garden", "Fazenda", "Flat", "Garden", "Kitnet", "Loft", "Mansão em condomínio fechado", "Sobrado",
    "Sobrado duplex", "Sobrado triplex", "Studio",
  ],
  comercial: [
    "Box", "Casa comercial", "Conjunto comercial", "Depósito", "Galpão", "Loja", "Loja comercial", "Loja shopping",
    "Pavilhão", "Prédio inteiro", "Sala comercial", "Sala comercial aérea", "Sala comercial térrea",
  ],
  terreno: ["Lote", "Terreno", "Terreno em condomínio", "Terreno padrão"],
} as const;

const tipoTipologia = z.enum([...TIPOS_TIPOLOGIA.residencial, ...TIPOS_TIPOLOGIA.comercial, ...TIPOS_TIPOLOGIA.terreno]);

export const tipologia = z.strictObject({
  id,
  empreendimentoId: id,
  nome: z.string().min(1),
  tipo: tipoTipologia,
  finalidade: z.enum(["venda", "aluguel", "venda_ou_aluguel"]),
  plantaPath: z.string().nullable(),
  dormitorios: inteiroNaoNegativo,
  suites: inteiroNaoNegativo,
  suitesMaster: inteiroNaoNegativo,
  banheiros: inteiroNaoNegativo,
  lavabos: inteiroNaoNegativo,
  vagas: inteiroNaoNegativo,
  /** No mínimo 1 subcondomínio (o banco também recusa). */
  subcondominioIds: z.array(id).min(1),
  exemplo,
});
export type Tipologia = z.infer<typeof tipologia>;

export const statusUnidade = z.enum(["disponivel", "reservada", "vendida"]);
export type StatusUnidade = z.infer<typeof statusUnidade>;

export const unidade = z.strictObject({
  id,
  empreendimentoId: id,
  tipologiaId: id,
  subcondominioId: id,
  identificador: z.string().min(1),
  areaPrivativa: z.number().positive(),
  preco: z.number().positive(),
  status: statusUnidade,
  exemplo,
});
export type Unidade = z.infer<typeof unidade>;

// ---------- Planos ----------

export const financiamento = z.strictObject({
  aceita: z.boolean(),
  momento: z.enum(["chaves", "assinatura"]).nullable(),
  percentualMaximo: percentual.nullable(),
  fgts: z.boolean(),
  dacao: z.boolean(),
  parcelamentoDireto: z.boolean(),
});

export const plano = z.strictObject({
  id,
  empreendimentoId: id,
  nome: z.string().min(1),
  sinalPercentual: percentual,
  mensaisPercentual: percentual,
  /** Sem número de parcelas, a parcela calculada é nula. */
  numeroParcelas: z.number().int().positive().nullable(),
  intercaladasPercentual: percentual,
  chavesPercentual: percentual,
  saldoPercentual: percentual,
  indiceCorrecao: z.string().min(1).nullable(),
  financiamento,
  exemplo,
});
export type Plano = z.infer<typeof plano>;

// ---------- Perfil (respostas do questionário) ----------

export const modo = z.enum(["morar", "investir"]);
export type Modo = z.infer<typeof modo>;

export const opcaoQuartos = z.enum(["studio", "1", "2", "3", "4+"]);
export type OpcaoQuartos = z.infer<typeof opcaoQuartos>;

export const formaPagamento = z.enum(["a_vista", "financiamento_bancario", "direto_construtora", "fgts"]);
export type FormaPagamento = z.infer<typeof formaPagamento>;

export const perfil = z.strictObject({
  modo: modo.nullable(),
  prazo: z.enum(["agora", "posso_esperar"]).nullable(),
  quartos: z.array(opcaoQuartos),
  regiao: z.strictObject({
    bairros: z.array(z.string().min(1)),
    /** Bairros acrescentados pela ampliação (nota 0,6 na localização). */
    bairrosVizinhos: z.array(z.string().min(1)),
    pertoDeMim: z.boolean(),
  }),
  pagamento: z.strictObject({
    formas: z.array(formaPagamento),
    entrada: reais.nullable(),
    parcelaMaxima: reais.nullable(),
  }),
  permuta: z.enum(["sim", "nao"]).nullable(),
  requisitos: z.strictObject({
    chips: z.array(z.string().min(1)),
    textoLivre: z.string().max(500).nullable(),
  }),
  decisao: z.enum(["1_mes", "3_meses", "6_meses", "sem_pressa"]).nullable(),
  primeiroInvestimento: z.enum(["sim", "nao"]).nullable(),
  foco: z.enum(["renda", "valorizacao", "os_dois"]).nullable(),
});
export type Perfil = z.infer<typeof perfil>;

export const PERFIL_VAZIO: Perfil = {
  modo: null,
  prazo: null,
  quartos: [],
  regiao: { bairros: [], bairrosVizinhos: [], pertoDeMim: false },
  pagamento: { formas: [], entrada: null, parcelaMaxima: null },
  permuta: null,
  requisitos: { chips: [], textoLivre: null },
  decisao: null,
  primeiroInvestimento: null,
  foco: null,
};

// ---------- Lead e atendimento ----------

export const origemLead = z.enum(["busca", "contato_direto", "visita", "proposta", "campanha", "proprio"]);

export const lead = z.strictObject({
  id,
  origem: origemLead,
  /** Lead de campanha: só vê e recebe opções da incorporadora da campanha (regra 6). */
  campanhaTenantId: id.nullable(),
  contaId: id.nullable(),
  visitorId: id.nullable(),
  perfil: perfil.nullable(),
  /** Texto original dos requisitos, que vai também para o analista. */
  requisitosTextoOriginal: z.string().nullable(),
  criadoEm: dataHoraIso,
  exemplo,
});
export type Lead = z.infer<typeof lead>;

/** Contato em tabela separada (design D4): liberado à incorporadora só com interesse confirmado. */
export const leadContato = z.strictObject({
  leadId: id,
  nome: z.string().min(1),
  whatsapp: z.string().regex(/^\+?\d{10,13}$/),
  email: z.email().nullable(),
  optInWhatsapp: z.boolean(),
  exemplo,
});
export type LeadContato = z.infer<typeof leadContato>;

export const atendimento = z.strictObject({
  id,
  leadId: id,
  empreendimentoId: id,
  etapaId: id.nullable(),
  analistaContaId: id.nullable(),
  valorPotencial: reais.nullable(),
  proximaAcao: z.string().nullable(),
  etiquetas: z.array(z.string().min(1)),
  criadoEm: dataHoraIso,
  exemplo,
});
export type Atendimento = z.infer<typeof atendimento>;

// ---------- Eventos de uso ----------

export const TIPOS_EVENTO = [
  "quiz_start", "quiz_answer", "quiz_option_disabled", "quiz_widen_accepted", "quiz_complete", "contact_submitted",
  "result_view", "result_why_open", "result_map_open", "map_open", "map_geo_permission", "map_move", "map_pin_click",
  "map_empty_area", "map_area_alert_created", "project_view", "costs_simulated", "manager_contact", "visit_started",
  "visit_scheduled", "favorite_add", "alert_created", "mode_changed",
] as const;
export const tipoEvento = z.enum(TIPOS_EVENTO);
export type TipoEvento = z.infer<typeof tipoEvento>;

const valorEvento = z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(z.string())]);

export const evento = z.strictObject({
  id,
  /** ID anônimo do navegador; nunca IP nem posição exata. */
  visitorId: id,
  contaId: id.nullable(),
  tipo: tipoEvento,
  empreendimentoId: id.nullable(),
  dados: z.record(z.string(), valorEvento),
  criadoEm: dataHoraIso,
});
export type Evento = z.infer<typeof evento>;
