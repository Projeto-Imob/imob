/**
 * Texto livre dos requisitos sem IA (tarefa 2.9): lido por palavras-chave do catálogo de comodidades.
 * A IA (flag ia_motivo, grupo 10) só transforma o texto numa lista; a comparação é sempre esta.
 */
import type { Comodidade } from "@/modulos/catalogo";

/** Minúsculas, sem acento e com espaços simples. */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Ids das comodidades citadas no texto, na ordem do catálogo, sem repetição. */
export function extrairRequisitos(texto: string | null, catalogo: Comodidade[]): string[] {
  if (!texto) return [];
  const t = ` ${normalizar(texto)} `;
  return catalogo
    .filter((c) => c.palavrasChave.some((p) => t.includes(` ${normalizar(p)} `)))
    .map((c) => c.id);
}
