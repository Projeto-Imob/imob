/**
 * Tipos do catálogo: empreendimento, subcondomínio, tipologia, unidade, plano e comodidades.
 * Schemas Zod estritos: campo desconhecido é recusado. Fonte: CLAUDE.md seções 4 a 9 e spec de catálogo.
 */
import { z } from "zod";
import { coordenadas, dataHoraIso, dataIso, exemplo, id, inteiroNaoNegativo, percentual } from "@/lib/esquemas";

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

// ---------- Vitrine pública ----------

/** Resumo público do empreendimento, lido por consultas.ts: sem dado comercial (regra 7). */
export type EmpreendimentoPublico = {
  slug: string;
  nome: string;
  bairro: string;
  cidade: string;
  uf: string;
  descricao: string;
  percentualObra: number;
  /** Nome comercial da incorporadora, público quando ela tem empreendimento na vitrine. */
  construtora: string | null;
  /** Maior data de entrega entre as torres que o público vê (AAAA-MM-DD); nula se nenhuma tem data. */
  entrega: string | null;
  /** Registro de incorporação: todo empreendimento da vitrine tem (regra 1). */
  ri: { numero: string; cartorio: string; dataRegistro: string; patrimonioAfetacao: boolean | null };
};

// ---------- Escritório de vendas (fatia 1.1) ----------

/** Cartão de quem atende o empreendimento. Na 1.1 só a house; o plantão da incorporadora fica para depois (decisão 11). */
export const escritorioVendas = z.strictObject({
  empreendimentoId: id,
  origem: z.enum(["house", "plantao"]),
  nome: z.string().min(1),
  cargo: z.string().nullable(),
  experiencia: z.string().nullable(),
  fotoPath: z.string().nullable(),
  whatsapp: z.string().nullable(),
  email: z.string().nullable(),
  telefone: z.string().nullable(),
  exemplo,
});
export type EscritorioVendas = z.infer<typeof escritorioVendas>;
