/**
 * Base elegível do comprador (tarefa 2.3; spec conformidade-de-publicacao e catalogo).
 * Contador, resultado, mapa, alertas e listas públicas usam só o que passa aqui.
 */
import type { EmpreendimentoCompleto } from "./regras";
import type { Subcondominio, Unidade } from "./tipos";

export type FaseVenda = "pre_lancamento" | "esgotado" | "vendas_abertas";

export type MotivoExclusao =
  | "sem_ri"
  | "rascunho"
  | "sem_curadoria"
  | "pre_lancamento"
  | "esgotado"
  | "nao_listado"
  | "exclusivo"
  | "fora_da_campanha";

export type ContextoElegibilidade = {
  /** Hoje, AAAA-MM-DD (relógio injetado). */
  hoje: string;
  /** Lead de campanha: só a incorporadora da campanha (regra 6). */
  campanhaTenantId?: string | null;
};

function subcondominioVendido(sub: Subcondominio, unidades: Unidade[]): boolean {
  if (sub.status === "vendido_100") return true;
  const doSub = unidades.filter((u) => u.subcondominioId === sub.id);
  return doSub.length > 0 && doSub.every((u) => u.status === "vendida");
}

/**
 * Fase de venda calculada, sem campo próprio: lançamento futuro em todos os subcondomínios
 * é pré-lançamento; todos os subcondomínios 100% vendidos é esgotado.
 */
export function faseVenda(e: EmpreendimentoCompleto, hoje: string): FaseVenda {
  const subs = e.subcondominios;
  if (subs.length > 0 && subs.every((s) => s.dataLancamento !== null && s.dataLancamento > hoje)) return "pre_lancamento";
  if (subs.length > 0 && subs.every((s) => subcondominioVendido(s, e.unidades))) return "esgotado";
  return "vendas_abertas";
}

export function motivosExclusao(e: EmpreendimentoCompleto, ctx: ContextoElegibilidade): MotivoExclusao[] {
  const emp = e.empreendimento;
  const motivos: MotivoExclusao[] = [];
  if (emp.ri === null) motivos.push("sem_ri");
  if (emp.publicacao !== "publicado") motivos.push("rascunho");
  if (!emp.curadoriaAprovada) motivos.push("sem_curadoria");
  const fase = faseVenda(e, ctx.hoje);
  // Regra 11: em stand-by enquanto pre_lancamento_ativo = false.
  if (fase === "pre_lancamento" && !emp.preLancamentoAtivo) motivos.push("pre_lancamento");
  if (fase === "esgotado") motivos.push("esgotado");
  if (emp.visibilidade === "nao_listado") motivos.push("nao_listado");
  if (emp.visibilidade === "exclusivo") motivos.push("exclusivo");
  if (ctx.campanhaTenantId && emp.tenantId !== ctx.campanhaTenantId) motivos.push("fora_da_campanha");
  return motivos;
}

export function elegivel(e: EmpreendimentoCompleto, ctx: ContextoElegibilidade): boolean {
  return motivosExclusao(e, ctx).length === 0;
}

export function baseElegivel(todos: EmpreendimentoCompleto[], ctx: ContextoElegibilidade): EmpreendimentoCompleto[] {
  return todos.filter((e) => elegivel(e, ctx));
}
