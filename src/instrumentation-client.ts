import * as Sentry from "@sentry/nextjs";
import { ambientePeloHost, opcoesSentry } from "@/lib/sentry";

/** Liga o Sentry no navegador. Sem NEXT_PUBLIC_SENTRY_DSN, fica desligado; sem rastreio de desempenho no cliente. */
try {
  Sentry.init(
    opcoesSentry({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      ambiente: ambientePeloHost(window.location.hostname),
      tracesSampleRate: 0,
    }),
  );
} catch {
  // O monitoramento nunca derruba a página.
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
