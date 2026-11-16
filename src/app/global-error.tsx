"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { texto } from "@/i18n/pt-BR";
import "./globals.css";

/** Erro na raiz do app: substitui o layout, por isso traz o próprio <html> e <body>. */
export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="bg-off-white text-preto">
        <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 px-4">
          <h1 className="font-titulo text-3xl font-bold">{texto("erro.titulo")}</h1>
          <p className="text-texto-secundario">{texto("erro.texto")}</p>
          <button
            type="button"
            onClick={() => retry()}
            className="self-start rounded-full bg-preto px-5 py-2.5 font-semibold text-off-white focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {texto("erro.tentar")}
          </button>
        </main>
      </body>
    </html>
  );
}
