/**
 * Parâmetros das regras de cálculo da busca (CLAUDE.md, seção 5 "Regras de cálculo").
 * Os valores em `proposta` são **Proposta** e esperam a validação de Matheus [NEEDS CLARIFICATION: C14].
 * Não é editável pelo god mode (seção 11: pesos e regras da busca ficam fora da edição).
 */
export const scoringConfig = {
  /** Pesos da nota (definidos na especificação, não são Proposta). */
  pesos: {
    financeiro: 0.35,
    tipologia: 0.25,
    localizacao: 0.2,
    requisitos: 0.1,
    comportamento: 0.1,
  },

  proposta: {
    /** Raio de "Perto de mim", em km. */
    raioPertoDeMimKm: 5,
    /** Ampliação de região: bairros a até esta distância de algum empreendimento dos bairros escolhidos, em km. */
    raioAmpliacaoRegiaoKm: 3.5,

    financeiro: {
      /** Fator de (1 − fator × exigido ÷ informado) para entrada e parcela. */
      fatorExigencia: 0.5,
      /** Bônus quando a pessoa tem permuta e o empreendimento aceita. */
      bonusPermuta: 0.1,
    },

    /** Tipologia: unidades compatíveis ÷ divisor, até 1. */
    divisorTipologia: 6,

    localizacao: {
      /** Nota da região quando o empreendimento está num bairro vizinho. */
      notaBairroVizinho: 0.6,
      /** Pontos próximos: cada um 1 − metros ÷ divisor. */
      divisorPontosMetros: 2000,
      /** Mistura quando há região e pontos. */
      pesoRegiao: 0.6,
      pesoPontos: 0.4,
    },

    /** Comportamento: (aberturas + multiplicador × favoritos) ÷ divisor, até 1. */
    comportamento: {
      multiplicadorFavoritos: 2,
      divisor: 4,
    },

    /** Nota mínima para uma opção entrar no resultado. */
    notaMinima: 50,
    /** A terceira opção só entra se estiver a até esta distância da primeira, em pontos. */
    janelaTerceiraOpcao: 15,

    /** Prazo de proteção ao lead da house, em dias. Sem valor na especificação: nulo até Matheus definir. */
    prazoProtecaoLeadDias: null as number | null,
  },
} as const;

export type ScoringConfig = typeof scoringConfig;
