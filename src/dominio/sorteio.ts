/**
 * Sorteio fixo de desempate (regra 2): derivado do perfil e do empreendimento, para não favorecer
 * sempre o mesmo. Mesmo perfil, mesma ordem; perfis diferentes podem ter ordens diferentes.
 * FNV-1a de 32 bits: determinístico e sem dependência.
 */
export function sorteioFixo(sementePerfil: string, empreendimentoId: string): number {
  let h = 0x811c9dc5;
  const texto = `${sementePerfil}:${empreendimentoId}`;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}
