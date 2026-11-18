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

// As três funções abaixo copiam o banco (migrations 0001 e 0002); tests/banco/paridade.test.ts prova a igualdade.

/**
 * Torre que o público vê: lançada até hoje, ou qualquer uma com o pré-lançamento ativo.
 * Igual à política `subcondominios_leitura` (regra 11, por subcondomínio). Sem data não conta como lançada.
 */
export function subcondominioVisivel(sub: Subcondominio, e: EmpreendimentoCompleto, hoje: string): boolean {
  return e.empreendimento.preLancamentoAtivo || (sub.dataLancamento !== null && sub.dataLancamento <= hoje);
}

/** Stand-by: nenhuma torre lançada até hoje. Igual a `app.em_stand_by` (sem data ou futura não conta). */
export function emStandBy(e: EmpreendimentoCompleto, hoje: string): boolean {
  return !e.subcondominios.some((s) => s.dataLancamento !== null && s.dataLancamento <= hoje);
}

/** Esgotado: há torre visível e todas as visíveis estão vendidas. Igual a `app.esgotado`. */
export function esgotado(e: EmpreendimentoCompleto, hoje: string): boolean {
  const visiveis = e.subcondominios.filter((s) => subcondominioVisivel(s, e, hoje));
  return visiveis.length > 0 && visiveis.every((s) => subcondominioVendido(s, e.unidades));
}

/** Fase de venda calculada, sem campo próprio. */
export function faseVenda(e: EmpreendimentoCompleto, hoje: string): FaseVenda {
  if (esgotado(e, hoje)) return "esgotado";
  if (emStandBy(e, hoje)) return "pre_lancamento";
  return "vendas_abertas";
}

export function motivosExclusao(e: EmpreendimentoCompleto, ctx: ContextoElegibilidade): MotivoExclusao[] {
  const emp = e.empreendimento;
  const motivos: MotivoExclusao[] = [];
  if (emp.ri === null) motivos.push("sem_ri");
  if (emp.publicacao !== "publicado") motivos.push("rascunho");
  if (!emp.curadoriaAprovada) motivos.push("sem_curadoria");
  // Regra 11: em stand-by enquanto pre_lancamento_ativo = false. Igual a app.na_vitrine.
  if (emStandBy(e, ctx.hoje) && !emp.preLancamentoAtivo) motivos.push("pre_lancamento");
  if (esgotado(e, ctx.hoje)) motivos.push("esgotado");
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
