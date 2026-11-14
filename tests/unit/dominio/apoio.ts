import { montarCompletos, type EmpreendimentoCompleto } from "@/dominio/catalogo";
import { PERFIL_VAZIO, type Empreendimento, type Perfil } from "@/dominio/tipos";
import { gerarSeed } from "@/seed/seed";

export const HOJE = "2026-11-13";
export const seed = gerarSeed();
export const completos = () => montarCompletos(gerarSeed());

export function porSlug(lista: EmpreendimentoCompleto[], slug: string): EmpreendimentoCompleto {
  const e = lista.find((c) => c.empreendimento.slug === slug);
  if (!e) throw new Error(`slug inexistente no seed: ${slug}`);
  return e;
}

/** Cópia profunda com alterações no empreendimento. */
export function comEmpreendimento(e: EmpreendimentoCompleto, alteracao: Partial<Empreendimento>): EmpreendimentoCompleto {
  const c = structuredClone(e);
  Object.assign(c.empreendimento, alteracao);
  return c;
}

export function perfilCom(alteracao: Partial<Perfil>): Perfil {
  return { ...structuredClone(PERFIL_VAZIO), ...alteracao };
}
