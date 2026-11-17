import * as Sentry from "@sentry/nextjs";
import { ambienteDoServidor, fracaoDeRastreio, opcoesSentry } from "@/lib/sentry";

/** Liga o Sentry no servidor (Node e edge). Sem SENTRY_DSN, fica desligado. */
export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" && process.env.NEXT_RUNTIME !== "edge") return;
  Sentry.init(
    opcoesSentry({
      dsn: process.env.SENTRY_DSN,
      ambiente: ambienteDoServidor(process.env),
      tracesSampleRate: fracaoDeRastreio(process.env.SENTRY_TRACES_SAMPLE_RATE),
    }),
  );
}

/** Erros de Server Components, Route Handlers e Server Actions. */
export const onRequestError = Sentry.captureRequestError;
