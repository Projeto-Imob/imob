/**
 * Flags de funcionalidade (design D6). Padrões versionados, todos desligados até a decisão de Matheus.
 * No modo `postgres`, `config_global` sobrepõe estes valores (só internal_superadmin/god mode, auditado).
 * Regra 20: quando a decisão for "agora não", desligue aqui em vez de apagar o código.
 */
export const FLAGS_PADRAO = {
  /** C2: motivo e extração de requisitos por IA. */
  ia_motivo: false,
  /** CEP pelo ViaCEP, chamado pelo servidor (precisa do OK de Matheus). */
  cep_servidor: false,
  /** C12: embed de vídeo do YouTube (youtube-nocookie.com). */
  video_embed: false,
  /** Cidade pelo IP na cascata de posição do mapa (precisa do OK de Matheus). */
  geo_ip: false,
  /** C4: mostrar ao comprador o interesse no empreendimento. */
  interesse_publico: false,
  /** C13: destaques da home. */
  home_destaques: false,
  /** C5: indicadores dos bairros na home. */
  home_bairros: false,
  /** C6: prova social e depoimentos. */
  prova_social: false,
  /** Simulador de investimento (decisão pendente). */
  simulador: false,
  /** Assinatura eletrônica de contrato por provedor externo. */
  assinatura_eletronica: false,
  /** Login com Google (só depois do registro completo). */
  login_google: false,
  /** C3: "Falar com o gerente" exige login, consentimento e cria lead "Contato direto". */
  contato_exige_login: false,
  /** Mapa público (fatia 1.3c liga e faz a página). Desligada: a navegação não mostra o Mapa. */
  mapa_publico: false,
  /** Favoritos (fatia 1.3c liga e faz a página). Desligada: a navegação não mostra Favoritos. */
  favoritos: false,
  /** Agendar visita (fatia 1.5). Desligada: a página só oferece "Falar com o gerente". */
  agendar_visita: false,
  /** Envio real de e-mail (depende de provedor aprovado). Desligada: e-mails simulados (D10). */
  email_real: false,
} as const satisfies Record<string, boolean>;

export type Flag = keyof typeof FLAGS_PADRAO;
export type Flags = Record<Flag, boolean>;

/** Combina os padrões com a sobreposição vinda de config_global. Chaves desconhecidas são ignoradas. */
export function resolverFlags(sobreposicao?: Partial<Record<string, unknown>>): Flags {
  const flags: Flags = { ...FLAGS_PADRAO };
  if (!sobreposicao) return flags;
  for (const nome of Object.keys(FLAGS_PADRAO) as Flag[]) {
    const valor = sobreposicao[nome];
    if (typeof valor === "boolean") flags[nome] = valor;
  }
  return flags;
}
