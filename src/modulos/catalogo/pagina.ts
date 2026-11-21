/**
 * Regras puras da página do empreendimento (fatia 1.1): ordem dos blocos por modo, escassez, custos por plano,
 * vizinhança e contatos. Sem React, sem banco e com o relógio injetado.
 */
import { minutosAPe } from "@/lib/geo";
import type { CategoriaPonto, EmpreendimentoPublico, EscritorioVendas, Plano, PontoProximo, StatusUnidade, Tipologia, Unidade } from "./tipos";

export type Modo = "morar" | "investir";

/** Proposta: sem `?modo=` ou com valor inválido, Morar. */
export function lerModo(valor: string | string[] | undefined): Modo {
  return valor === "investir" ? "investir" : "morar";
}

export type Bloco = "galeria" | "resumo" | "numeros" | "custos" | "plantas" | "vizinhanca" | "comodidades" | "escritorio" | "legais";

const ORDEM_MORAR: Bloco[] = ["galeria", "resumo", "custos", "plantas", "vizinhanca", "numeros", "comodidades", "escritorio", "legais"];
/** Proposta: Investir abre com resumo, números, custos, vizinhança e galeria; o resto segue a ordem do Morar. */
const ORDEM_INVESTIR: Bloco[] = ["resumo", "numeros", "custos", "vizinhanca", "galeria", "plantas", "comodidades", "escritorio", "legais"];

export function ordemDosBlocos(modo: Modo): Bloco[] {
  return [...(modo === "investir" ? ORDEM_INVESTIR : ORDEM_MORAR)];
}

// ---------- Dados públicos da página (só colunas públicas: nada de comissão, tenant ou e-mail de login) ----------

/** O tipo vem do banco como texto; a lista da especificação é validada na fronteira do cadastro. */
export type TipologiaPublica = Pick<Tipologia, "id" | "nome" | "finalidade" | "dormitorios" | "suites" | "vagas"> & { tipo: string };
export type UnidadePublica = Pick<Unidade, "id" | "tipologiaId" | "identificador" | "areaPrivativa" | "preco" | "status">;
/** Plano sem o nome do índice: o texto é "corrigidas pelo índice do contrato" (decisão 4, regra 3). */
export type PlanoPublico = Pick<
  Plano,
  | "id"
  | "nome"
  | "sinalPercentual"
  | "mensaisPercentual"
  | "numeroParcelas"
  | "intercaladasPercentual"
  | "chavesPercentual"
  | "saldoPercentual"
  | "financiamento"
>;
export type EscritorioPublico = Omit<EscritorioVendas, "empreendimentoId" | "exemplo">;

export type PaginaEmpreendimento = EmpreendimentoPublico & {
  exemplo: boolean;
  /** Ids do catálogo de comodidades; nulo = sem dado cadastrado. */
  comodidades: string[] | null;
  tipologias: TipologiaPublica[];
  unidades: UnidadePublica[];
  planos: PlanoPublico[];
  pontos: PontoProximo[];
  escritorio: EscritorioPublico | null;
  /** Instante da última atualização do espelho. A regra 10 é decidida fora do cache, com o relógio do pedido. */
  espelhoAtualizadoEm: string | null;
};

// ---------- Escassez (regra 10) ----------

const VINTE_E_QUATRO_HORAS_MS = 24 * 60 * 60 * 1000;
/** Proposta: "Restam {x}" só com x entre 1 e 5. */
const LIMITE_RESTAM = 5;

/** Espelho atualizado há menos de 24 h. Nulo, de 24 h ou mais, ou no futuro: não vale. */
export function escassezVisivel(espelhoAtualizadoEm: string | null, agora: Date): boolean {
  if (!espelhoAtualizadoEm) return false;
  const idade = agora.getTime() - new Date(espelhoAtualizadoEm).getTime();
  return Number.isFinite(idade) && idade >= 0 && idade < VINTE_E_QUATRO_HORAS_MS;
}

/** Proposta: a reservada não conta. Só entram tipologias com 1 a 5 disponíveis, e só com o espelho fresco. */
export function restamPorTipologia(
  unidades: Array<{ tipologiaId: string; status: StatusUnidade }>,
  espelhoAtualizadoEm: string | null,
  agora: Date,
): Record<string, number> {
  if (!escassezVisivel(espelhoAtualizadoEm, agora)) return {};
  const contagem: Record<string, number> = {};
  for (const u of unidades) if (u.status === "disponivel") contagem[u.tipologiaId] = (contagem[u.tipologiaId] ?? 0) + 1;
  return Object.fromEntries(Object.entries(contagem).filter(([, n]) => n >= 1 && n <= LIMITE_RESTAM));
}

// ---------- Custos ----------

const centavos = (v: number) => Math.round(v * 100) / 100;

export type FluxoDoPlano = {
  preco: number;
  sinal: number;
  mensais: number;
  /** Nula sem número de parcelas. */
  parcela: number | null;
  /** Proposta: as intercaladas entram pelo total. */
  intercaladas: number;
  /** Proposta: no mês da entrega. */
  chaves: number;
  saldo: number;
  /** A entrada é o sinal. */
  entrada: number;
};

type PercentuaisDoPlano = Pick<
  PlanoPublico,
  "sinalPercentual" | "mensaisPercentual" | "numeroParcelas" | "intercaladasPercentual" | "chavesPercentual" | "saldoPercentual"
>;

/** Valores do plano para uma unidade, em centavos. Entrada e parcela coincidem com a exigência da busca. */
export function fluxoDoPlano(unidade: Pick<Unidade, "preco">, plano: PercentuaisDoPlano): FluxoDoPlano {
  const parte = (pct: number) => centavos((unidade.preco * pct) / 100);
  const sinal = parte(plano.sinalPercentual);
  return {
    preco: unidade.preco,
    sinal,
    mensais: parte(plano.mensaisPercentual),
    parcela: plano.numeroParcelas === null ? null : centavos((unidade.preco * plano.mensaisPercentual) / 100 / plano.numeroParcelas),
    intercaladas: parte(plano.intercaladasPercentual),
    chaves: parte(plano.chavesPercentual),
    saldo: parte(plano.saldoPercentual),
    entrada: sinal,
  };
}

/** Proposta: a unidade escolhida de partida é a disponível de menor preço. */
export function unidadePadrao<U extends Pick<UnidadePublica, "status" | "preco" | "identificador">>(unidades: U[]): U | null {
  const livres = unidades.filter((u) => u.status === "disponivel");
  return livres.sort((a, b) => a.preco - b.preco || a.identificador.localeCompare(b.identificador))[0] ?? null;
}

/** Proposta: a entrada "a partir de" é o menor sinal entre as unidades disponíveis e os planos. Nula sem uma das duas. */
export function entradaMinima(
  unidades: Array<Pick<UnidadePublica, "status" | "preco">>,
  planos: Array<Pick<PlanoPublico, "sinalPercentual">>,
): number | null {
  const valores = unidades
    .filter((u) => u.status === "disponivel")
    .flatMap((u) => planos.map((p) => centavos((u.preco * p.sinalPercentual) / 100)));
  return valores.length ? Math.min(...valores) : null;
}

export function precoPorM2(unidade: Pick<Unidade, "preco" | "areaPrivativa">): number {
  return centavos(unidade.preco / unidade.areaPrivativa);
}

// ---------- Vizinhança ----------

export const CATEGORIAS_PONTO: CategoriaPonto[] = ["escola", "parque", "hospital", "academia", "mercado", "transporte"];

/** O ponto mais próximo de cada categoria, na ordem fixa. Categoria sem dado fica com ponto nulo. */
export function pontosPorCategoria(
  pontos: PontoProximo[],
): Array<{ categoria: CategoriaPonto; ponto: (PontoProximo & { minutos: number }) | null }> {
  return CATEGORIAS_PONTO.map((categoria) => {
    const maisPerto = pontos
      .filter((p) => p.categoria === categoria)
      .sort((a, b) => a.distanciaM - b.distanciaM || a.nome.localeCompare(b.nome))[0];
    return { categoria, ponto: maisPerto ? { ...maisPerto, minutos: minutosAPe(maisPerto.distanciaM) } : null };
  });
}

/** Proposta: a frase usa as duas primeiras categorias com dado, na ordem escola, parque, hospital, academia, mercado e transporte. */
export function fraseVizinhanca(pontos: PontoProximo[]): Array<{ categoria: CategoriaPonto; minutos: number }> {
  return pontosPorCategoria(pontos)
    .flatMap((c) => (c.ponto ? [{ categoria: c.categoria, minutos: c.ponto.minutos }] : []))
    .slice(0, 2);
}

// ---------- Contato do escritório (liberado até 01/12, decisão 2) ----------

const soDigitos = (v: string) => v.replace(/\D/g, "");

/** A mensagem pronta vem do catálogo; aqui só se monta o link. */
export function linkWhatsapp(numero: string, mensagem: string): string {
  return `https://wa.me/${soDigitos(numero)}?text=${encodeURIComponent(mensagem)}`;
}
export const linkEmail = (email: string) => `mailto:${email}`;
export const linkTelefone = (telefone: string) => `tel:+${soDigitos(telefone)}`;
