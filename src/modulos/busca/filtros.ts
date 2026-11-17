/**
 * Filtros do questionário sobre a base elegível (tarefa 2.4; spec busca/recomendacao "Filtros").
 * Recebem a base já elegível; a posição de "Perto de mim" vem só da sessão, nunca do perfil gravado.
 */
import { scoringConfig, type ScoringConfig } from "@config/scoring.config";
import type { Coordenadas } from "@/lib/esquemas";
import { distanciaM } from "@/lib/geo";
import type { EmpreendimentoCompleto, Subcondominio, Tipologia, Unidade } from "@/modulos/catalogo";
import { melhorExigencia, type Exigencia } from "./exigencia";
import type { OpcaoQuartos, Perfil } from "./tipos";

export type ContextoBusca = {
  hoje: string;
  /** Posição do navegador, só na sessão (regra 9). Nula: "Perto de mim" não filtra nem conta. */
  posicao?: Coordenadas | null;
  config?: ScoringConfig;
};

export type ResultadoFiltro = {
  passa: boolean;
  unidadesCompativeis: Unidade[];
  exigencia: Exigencia | null;
};

/** Pronto para morar: status "pronto" ou entrega já vencida. */
export function prontoParaMorar(sub: Subcondominio, hoje: string): boolean {
  return sub.status === "pronto" || (sub.dataEntrega !== null && sub.dataEntrega <= hoje);
}

export function tipologiaAtende(t: Tipologia, opcoes: OpcaoQuartos[]): boolean {
  if (opcoes.length === 0) return true;
  const studio = t.tipo === "Studio" || t.dormitorios === 0;
  return opcoes.some((o) => {
    if (o === "studio") return studio;
    if (studio) return false;
    if (o === "4+") return t.dormitorios >= 4;
    return t.dormitorios === Number(o);
  });
}

/** Unidade compatível: disponível, com os quartos escolhidos e, em "agora", em subcondomínio pronto. */
export function unidadesCompativeis(e: EmpreendimentoCompleto, perfil: Perfil, hoje: string): Unidade[] {
  const tipologias = new Map(e.tipologias.map((t) => [t.id, t]));
  const subs = new Map(e.subcondominios.map((s) => [s.id, s]));
  return e.unidades.filter((u) => {
    if (u.status !== "disponivel") return false;
    const t = tipologias.get(u.tipologiaId);
    if (!t || !tipologiaAtende(t, perfil.quartos)) return false;
    if (perfil.prazo === "agora") {
      const s = subs.get(u.subcondominioId);
      if (!s || !prontoParaMorar(s, hoje)) return false;
    }
    return true;
  });
}

/** "Perto de mim" só vale com posição conhecida. */
export function pertoDeMimAtivo(perfil: Perfil, ctx: ContextoBusca): ctx is ContextoBusca & { posicao: Coordenadas } {
  return perfil.regiao.pertoDeMim && !!ctx.posicao;
}

export function regiaoDefinida(perfil: Perfil, ctx: ContextoBusca): boolean {
  return perfil.regiao.bairros.length > 0 || perfil.regiao.bairrosVizinhos.length > 0 || pertoDeMimAtivo(perfil, ctx);
}

export function atendeRegiao(e: EmpreendimentoCompleto, perfil: Perfil, ctx: ContextoBusca): boolean {
  if (!regiaoDefinida(perfil, ctx)) return true;
  const { bairro, localizacao } = e.empreendimento;
  if (perfil.regiao.bairros.includes(bairro) || perfil.regiao.bairrosVizinhos.includes(bairro)) return true;
  if (pertoDeMimAtivo(perfil, ctx)) {
    const raioM = (ctx.config ?? scoringConfig).proposta.raioPertoDeMimKm * 1000;
    return distanciaM(ctx.posicao, localizacao) <= raioM;
  }
  return false;
}

export function atendePermuta(e: EmpreendimentoCompleto, perfil: Perfil): boolean {
  return perfil.permuta !== "sim" || e.empreendimento.aceitaPermuta;
}

/** Comodidades: precisa ter todas as marcadas; só filtra quem tem o dado cadastrado. */
export function atendeComodidades(e: EmpreendimentoCompleto, perfil: Perfil): boolean {
  const cadastradas = e.empreendimento.comodidades;
  if (cadastradas === null) return true;
  return perfil.requisitos.chips.every((c) => cadastradas.includes(c));
}

/** Aplica todos os filtros e devolve as unidades compatíveis e a melhor exigência que cabe. */
export function filtrar(e: EmpreendimentoCompleto, perfil: Perfil, ctx: ContextoBusca): ResultadoFiltro {
  const nao = { passa: false, unidadesCompativeis: [], exigencia: null };
  if (!atendeRegiao(e, perfil, ctx) || !atendePermuta(e, perfil) || !atendeComodidades(e, perfil)) return nao;
  const unidades = unidadesCompativeis(e, perfil, ctx.hoje);
  if (unidades.length === 0) return nao;
  const exigencia = melhorExigencia(unidades, e.planos, perfil.pagamento);
  if (exigencia === null) return { ...nao, unidadesCompativeis: unidades };
  return { passa: true, unidadesCompativeis: unidades, exigencia };
}
