/**
 * Estado da home (tarefa 2.10; spec comprador/inicio). Função pura a partir de usuário, eventos,
 * perfil, favoritos e visitas.
 *
 * Ordem de precedência: negociando > ativo > perfil > navegou > novo.
 * Proposta (a especificação não separa "perfil" de "ativo"): `ativo` é quem concluiu o questionário
 * e já tem favorito ou alerta; `perfil` é quem concluiu o questionário sem eles. Decisão de Matheus pendente.
 */
export type HomeState = "novo" | "navegou" | "perfil" | "ativo" | "negociando";

export type StatusVisita = "agendada" | "confirmada" | "realizada" | "cancelada";
export type StatusProposta = "enviada" | "em_analise" | "contraproposta" | "aceita" | "recusada" | "cancelada" | "expirada";

export type EntradaHome = {
  usuario: { contaId: string } | null;
  /** Quantidade de eventos de uso registrados para a pessoa (conta ou visitante). */
  eventos: number;
  questionarioConcluido: boolean;
  favoritos: number;
  alertas: number;
  visitas: Array<{ status: StatusVisita }>;
  propostas: Array<{ status: StatusProposta }>;
};

const VISITA_EM_ANDAMENTO: ReadonlySet<StatusVisita> = new Set(["agendada", "confirmada"]);
const PROPOSTA_EM_ANDAMENTO: ReadonlySet<StatusProposta> = new Set(["enviada", "em_analise", "contraproposta", "aceita"]);

export function resolveHomeState(e: EntradaHome): HomeState {
  if (e.visitas.some((v) => VISITA_EM_ANDAMENTO.has(v.status)) || e.propostas.some((p) => PROPOSTA_EM_ANDAMENTO.has(p.status))) {
    return "negociando";
  }
  if (e.questionarioConcluido) return e.favoritos > 0 || e.alertas > 0 ? "ativo" : "perfil";
  if (e.eventos > 0 || e.favoritos > 0) return "navegou";
  return "novo";
}
