/**
 * Cabeçalhos de segurança HTTP (fatia 0.5a, A5; decisão de 16/11/2026: CSP sem nonce).
 * Função pura, sem Next nem ambiente: `next.config.ts` só repassa o resultado em `headers()`.
 * O nonce exigiria renderizar tudo por requisição e derrubaria o cache das páginas públicas.
 */

/**
 * Origens extras por diretiva. É o ponto de extensão da CSP: uma fatia que precisa liberar um host
 * acrescenta a origem aqui (ex.: a 1.3c, do mapa, libera os tiles e os estilos do OpenFreeMap em
 * `connect` e `img`; vídeo do YouTube entra em `frame` como https://www.youtube-nocookie.com).
 */
export const ORIGENS_EXTRAS = {
  script: [] as string[],
  style: [] as string[],
  img: [] as string[],
  font: [] as string[],
  connect: [] as string[],
  frame: [] as string[],
};

export type OpcoesCabecalhos = {
  /** `next dev`: o React usa eval para remontar pilhas de chamada. */
  desenvolvimento: boolean;
  /** DSN do Sentry; só o host entra em `connect-src`. Sem DSN, o Sentry está desligado. */
  sentryDsn?: string | null;
  /** Origens extras, no lugar de `ORIGENS_EXTRAS` (testes). */
  extras?: typeof ORIGENS_EXTRAS;
};

export type Cabecalho = { key: string; value: string };

/** Origem (https://host) do DSN, ou nulo se não houver DSN ou ele não for uma URL. */
export function origemDoSentry(dsn: string | null | undefined): string | null {
  if (!dsn) return null;
  try {
    const url = new URL(dsn);
    return url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
}

export function montarCsp({ desenvolvimento, sentryDsn, extras = ORIGENS_EXTRAS }: OpcoesCabecalhos): string {
  const sentry = origemDoSentry(sentryDsn);
  const diretivas: Array<[string, string[]]> = [
    ["default-src", ["'self'"]],
    ["script-src", ["'self'", "'unsafe-inline'", ...(desenvolvimento ? ["'unsafe-eval'"] : []), ...extras.script]],
    ["style-src", ["'self'", "'unsafe-inline'", ...extras.style]],
    ["img-src", ["'self'", "data:", "blob:", ...extras.img]],
    ["font-src", ["'self'", ...extras.font]],
    ["connect-src", ["'self'", ...(sentry ? [sentry] : []), ...extras.connect]],
    ["frame-src", extras.frame.length > 0 ? extras.frame : ["'none'"]],
    ["frame-ancestors", ["'none'"]],
    ["object-src", ["'none'"]],
    ["base-uri", ["'self'"]],
    ["form-action", ["'self'"]],
  ];
  return diretivas.map(([nome, valores]) => `${nome} ${valores.join(" ")}`).join("; ");
}

export function montarCabecalhos(opcoes: OpcoesCabecalhos): Cabecalho[] {
  return [
    { key: "Content-Security-Policy", value: montarCsp(opcoes) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=(), payment=()" },
    // Sem includeSubDomains: o domínio tem outros subdomínios que não são do Imob.
    { key: "Strict-Transport-Security", value: "max-age=31536000" },
  ];
}
