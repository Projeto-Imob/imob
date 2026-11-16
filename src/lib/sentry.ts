/**
 * Opções do Sentry comuns ao servidor e ao navegador (decisão D10).
 * Nenhum dado pessoal sai do app (regra 9, LGPD): sem usuário, IP, cookies, cabeçalhos,
 * corpos nem parâmetros de URL, e sem gravação de sessão. Sem DSN, o Sentry fica desligado.
 */
import type { init } from "@sentry/nextjs";

type OpcoesInit = NonNullable<Parameters<typeof init>[0]>;

export type AmbienteSentry = "desenvolvimento" | "homologacao" | "producao";

const AMBIENTES: readonly string[] = ["desenvolvimento", "homologacao", "producao"];

/** No navegador, o ambiente sai do endereço: a mesma imagem roda em homologação e em produção (D12). */
export function ambientePeloHost(host: string): AmbienteSentry {
  const h = host.toLowerCase();
  if (h === "localhost" || h === "127.0.0.1" || h === "[::1]" || h.endsWith(".localhost")) return "desenvolvimento";
  if (h.startsWith("hml.") || h.startsWith("homologacao.")) return "homologacao";
  return "producao";
}

/** No servidor, vem de SENTRY_ENVIRONMENT; sem ela, do NODE_ENV. */
export function ambienteDoServidor(env: Record<string, string | undefined>): AmbienteSentry {
  const valor = env.SENTRY_ENVIRONMENT;
  if (valor && AMBIENTES.includes(valor)) return valor as AmbienteSentry;
  return env.NODE_ENV === "production" ? "producao" : "desenvolvimento";
}

/** Fração das requisições com rastreio de desempenho; fora de 0 a 1, vira 0. */
export function fracaoDeRastreio(valor: string | undefined): number {
  const n = Number(valor);
  return valor !== undefined && valor.trim() !== "" && Number.isFinite(n) && n >= 0 && n <= 1 ? n : 0;
}

export const COLETA_MINIMA = {
  userInfo: false,
  cookies: false,
  httpHeaders: false,
  httpBodies: [],
  urlQueryParams: false,
  graphQL: { document: false, variables: false },
  genAI: { inputs: false, outputs: false },
} satisfies OpcoesInit["dataCollection"];

type EventoLimpavel = {
  user?: unknown;
  request?: { url?: string; cookies?: unknown; headers?: unknown; data?: unknown; query_string?: unknown; env?: unknown };
};

/** Defesa em profundidade: o que escapar das opções acima sai do evento antes do envio. */
export function limparEvento<T extends EventoLimpavel>(evento: T): T {
  delete evento.user;
  const req = evento.request;
  if (req) {
    delete req.cookies;
    delete req.headers;
    delete req.data;
    delete req.query_string;
    delete req.env;
    if (typeof req.url === "string") req.url = req.url.split(/[?#]/)[0]!;
  }
  return evento;
}

export function opcoesSentry(entrada: { dsn: string | undefined; ambiente: AmbienteSentry; tracesSampleRate: number }): OpcoesInit {
  const dsn = entrada.dsn?.trim() || undefined;
  return {
    dsn,
    enabled: dsn !== undefined,
    environment: entrada.ambiente,
    tracesSampleRate: entrada.tracesSampleRate,
    dataCollection: COLETA_MINIMA,
    beforeSend: (evento) => limparEvento(evento),
    beforeSendTransaction: (evento) => limparEvento(evento),
  };
}
