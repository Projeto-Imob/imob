/**
 * Nota de 0 a 100, determinística, nunca por IA (tarefa 2.7; CLAUDE.md "Nota").
 * Média ponderada só dos componentes com dado, com os pesos reponderados.
 * Recebe só o que é do cadastro e da pessoa: comissão, Vitrine Destacada, verba e incorporadora
 * não entram aqui (regra 2) — EmpreendimentoCompleto nem os carrega.
 */
import { scoringConfig, type ScoringConfig } from "@config/scoring.config";
import { distanciaM } from "@/lib/geo";
import type { CategoriaPonto, Comodidade, EmpreendimentoCompleto } from "@/modulos/catalogo";
import { filtrar, pertoDeMimAtivo, type ContextoBusca } from "./filtros";
import type { Exigencia } from "./exigencia";
import { extrairRequisitos } from "./requisitos";
import { sorteioFixo } from "./sorteio";
import type { Perfil } from "./tipos";

export type ChaveComponente = "financeiro" | "tipologia" | "localizacao" | "requisitos" | "comportamento";

/** De onde veio a nota da região: bairro escolhido, bairro vizinho ou "Perto de mim". */
export type OrigemRegiao = "escolhido" | "vizinho" | "perto_de_mim";

export type Componente = {
  chave: ChaveComponente;
  peso: number;
  /** 0 a 1, ou nulo quando fica fora da conta. */
  valor: number | null;
  /** Valores usados no cálculo, para "Por que estou vendo isso?" e para o motivo. */
  detalhe: Record<string, number | string | null>;
};

export type Historico = {
  /** Aberturas da página de cada empreendimento pela pessoa. */
  aberturas: Record<string, number>;
  /** Ids dos empreendimentos favoritados. */
  favoritos: string[];
};

export const HISTORICO_VAZIO: Historico = { aberturas: {}, favoritos: [] };

export type ContextoNota = ContextoBusca & {
  /** Semente do sorteio de desempate: id estável do perfil (conta ou visitante). */
  sementePerfil: string;
  historico?: Historico;
  comodidades: Comodidade[];
};

export type Avaliacao = {
  empreendimentoId: string;
  /** 0 a 100 (inteiro), ou nulo quando nenhum componente tem dado. */
  nota: number | null;
  componentes: Componente[];
  exigencia: Exigencia | null;
  unidadesCompativeis: number;
  sorteio: number;
};

const limitar = (v: number) => Math.min(1, Math.max(0, v));
const media = (vs: number[]) => (vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : null);

/** Categorias de ponto que entram na localização (seção 5). */
export const CATEGORIAS_PONTOS_NOTA: CategoriaPonto[] = ["escola", "parque", "hospital", "academia"];

function financeiro(e: EmpreendimentoCompleto, perfil: Perfil, ex: Exigencia | null, cfg: ScoringConfig): Componente {
  const { entrada, parcelaMaxima } = perfil.pagamento;
  const fator = cfg.proposta.financeiro.fatorExigencia;
  const partes: number[] = [];
  if (ex && entrada !== null && entrada > 0) partes.push(1 - (fator * ex.entrada) / entrada);
  if (ex && parcelaMaxima !== null && parcelaMaxima > 0 && ex.parcela !== null) partes.push(1 - (fator * ex.parcela) / parcelaMaxima);
  const base = media(partes);
  const permuta = perfil.permuta === "sim" && e.empreendimento.aceitaPermuta;
  const valor = base === null ? null : limitar(base + (permuta ? cfg.proposta.financeiro.bonusPermuta : 0));
  return {
    chave: "financeiro",
    peso: cfg.pesos.financeiro,
    valor,
    detalhe: {
      entradaExigida: ex?.entrada ?? null,
      entradaInformada: entrada,
      parcelaExigida: ex?.parcela ?? null,
      parcelaMaxima,
      bonusPermuta: permuta ? cfg.proposta.financeiro.bonusPermuta : 0,
    },
  };
}

function tipologia(perfil: Perfil, compativeis: number, cfg: ScoringConfig): Componente {
  return {
    chave: "tipologia",
    peso: cfg.pesos.tipologia,
    valor: perfil.quartos.length === 0 ? null : limitar(compativeis / cfg.proposta.divisorTipologia),
    detalhe: { unidadesCompativeis: compativeis },
  };
}

function localizacao(e: EmpreendimentoCompleto, perfil: Perfil, ctx: ContextoBusca, cfg: ScoringConfig): Componente {
  const { bairro, localizacao: pos, pontosProximos } = e.empreendimento;
  const loc = cfg.proposta.localizacao;
  const notasRegiao: Array<{ origem: OrigemRegiao; nota: number }> = [];
  if (perfil.regiao.bairros.includes(bairro)) notasRegiao.push({ origem: "escolhido", nota: 1 });
  if (perfil.regiao.bairrosVizinhos.includes(bairro)) notasRegiao.push({ origem: "vizinho", nota: loc.notaBairroVizinho });
  let distanciaPertoM: number | null = null;
  if (pertoDeMimAtivo(perfil, ctx)) {
    distanciaPertoM = Math.round(distanciaM(ctx.posicao, pos));
    notasRegiao.push({ origem: "perto_de_mim", nota: limitar(1 - distanciaPertoM / (cfg.proposta.raioPertoDeMimKm * 1000)) });
  }
  // A origem é a da melhor nota; no empate vale a ordem de preferência: escolhido, vizinho, perto de mim.
  const melhor = notasRegiao.reduce<(typeof notasRegiao)[number] | null>((m, r) => (m === null || r.nota > m.nota ? r : m), null);
  const regiao = melhor?.nota ?? null;

  const maisPerto = CATEGORIAS_PONTOS_NOTA.flatMap((cat) => {
    const ds = pontosProximos.filter((p) => p.categoria === cat).map((p) => p.distanciaM);
    return ds.length ? [Math.min(...ds)] : [];
  });
  const pontos = media(maisPerto.map((m) => limitar(1 - m / loc.divisorPontosMetros)));

  const valor =
    regiao !== null && pontos !== null ? loc.pesoRegiao * regiao + loc.pesoPontos * pontos : (regiao ?? pontos);
  return {
    chave: "localizacao",
    peso: cfg.pesos.localizacao,
    valor,
    detalhe: { bairro, regiao, origemRegiao: melhor?.origem ?? null, pontos, distanciaPertoDeMimM: distanciaPertoM },
  };
}

function requisitos(e: EmpreendimentoCompleto, perfil: Perfil, comodidades: Comodidade[], cfg: ScoringConfig): Componente {
  const pedidos = [...new Set([...perfil.requisitos.chips, ...extrairRequisitos(perfil.requisitos.textoLivre, comodidades)])];
  const cadastradas = e.empreendimento.comodidades ?? [];
  const atendidos = pedidos.filter((p) => cadastradas.includes(p)).length;
  return {
    chave: "requisitos",
    peso: cfg.pesos.requisitos,
    valor: pedidos.length === 0 ? null : atendidos / pedidos.length,
    detalhe: { atendidos, pedidos: pedidos.length },
  };
}

function comportamento(e: EmpreendimentoCompleto, historico: Historico, cfg: ScoringConfig): Componente {
  const temHistorico = Object.values(historico.aberturas).some((n) => n > 0) || historico.favoritos.length > 0;
  const aberturas = historico.aberturas[e.empreendimento.id] ?? 0;
  const favorito = historico.favoritos.includes(e.empreendimento.id) ? 1 : 0;
  const c = cfg.proposta.comportamento;
  return {
    chave: "comportamento",
    peso: cfg.pesos.comportamento,
    valor: temHistorico ? limitar((aberturas + c.multiplicadorFavoritos * favorito) / c.divisor) : null,
    detalhe: { aberturas, favoritos: favorito },
  };
}

/**
 * Nota final: média ponderada dos componentes com dado, reponderada, em 0 a 100 (inteiro).
 * A conta é toda em inteiros (pesos × 100, valores em 4 casas) para o ponto e meio não depender de ponto flutuante.
 * O meio ponto arredonda para cima (Proposta, `arredondamentoNota` em config/scoring.config.ts).
 */
export function notaFinal(componentes: Componente[]): number | null {
  let soma = 0;
  let pesos = 0;
  for (const c of componentes) {
    if (c.valor === null) continue;
    const peso = Math.round(c.peso * 100);
    soma += peso * Math.round(c.valor * 10000);
    pesos += peso;
  }
  if (pesos === 0) return null;
  // nota = soma ÷ (pesos × 100); com o meio ponto para cima: (2 × soma + divisor) ÷ (2 × divisor), truncado.
  const divisor = pesos * 100;
  const numerador = 2 * soma + divisor;
  return (numerador - (numerador % (2 * divisor))) / (2 * divisor);
}

export function avaliar(e: EmpreendimentoCompleto, perfil: Perfil, ctx: ContextoNota): Avaliacao | null {
  const r = filtrar(e, perfil, ctx);
  if (!r.passa) return null;
  const cfg = ctx.config ?? scoringConfig;
  const componentes = [
    financeiro(e, perfil, r.exigencia, cfg),
    tipologia(perfil, r.unidadesCompativeis.length, cfg),
    localizacao(e, perfil, ctx, cfg),
    requisitos(e, perfil, ctx.comodidades, cfg),
    comportamento(e, ctx.historico ?? HISTORICO_VAZIO, cfg),
  ];
  return {
    empreendimentoId: e.empreendimento.id,
    nota: notaFinal(componentes),
    componentes,
    exigencia: r.exigencia,
    unidadesCompativeis: r.unidadesCompativeis.length,
    sorteio: sorteioFixo(ctx.sementePerfil, e.empreendimento.id),
  };
}

/** Ordem: nota decrescente; no empate, o sorteio fixo do perfil. */
export function compararAvaliacoes(a: Avaliacao, b: Avaliacao): number {
  return (b.nota ?? -1) - (a.nota ?? -1) || a.sorteio - b.sorteio || a.empreendimentoId.localeCompare(b.empreendimentoId);
}

/** Avalia a base elegível e devolve as avaliações em ordem. */
export function avaliarBase(base: EmpreendimentoCompleto[], perfil: Perfil, ctx: ContextoNota): Avaliacao[] {
  return base
    .map((e) => avaliar(e, perfil, ctx))
    .filter((a): a is Avaliacao => a !== null)
    .sort(compararAvaliacoes);
}
