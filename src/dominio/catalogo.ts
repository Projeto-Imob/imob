import type { Empreendimento, Plano, Subcondominio, Tipologia, Unidade } from "./tipos";

/**
 * Empreendimento com o que a busca precisa. Deliberadamente sem dados comerciais
 * (comissão, escritório), Vitrine Destacada ou nome da incorporadora: eles não podem
 * influenciar nota nem ordem (regra 2).
 */
export type EmpreendimentoCompleto = {
  empreendimento: Empreendimento;
  subcondominios: Subcondominio[];
  tipologias: Tipologia[];
  unidades: Unidade[];
  planos: Plano[];
};

type Fonte = {
  empreendimentos: Empreendimento[];
  subcondominios: Subcondominio[];
  tipologias: Tipologia[];
  unidades: Unidade[];
  planos: Plano[];
};

export function montarCompletos(fonte: Fonte): EmpreendimentoCompleto[] {
  return fonte.empreendimentos.map((empreendimento) => ({
    empreendimento,
    subcondominios: fonte.subcondominios.filter((s) => s.empreendimentoId === empreendimento.id),
    tipologias: fonte.tipologias.filter((t) => t.empreendimentoId === empreendimento.id),
    unidades: fonte.unidades.filter((u) => u.empreendimentoId === empreendimento.id),
    planos: fonte.planos.filter((p) => p.empreendimentoId === empreendimento.id),
  }));
}

/** Data de hoje (AAAA-MM-DD) no fuso de Porto Alegre, a partir de um instante. */
export function dataLocal(instante: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(instante);
}
