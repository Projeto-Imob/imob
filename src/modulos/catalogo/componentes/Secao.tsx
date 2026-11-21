import type { ReactNode } from "react";
import { T } from "@/components/T";
import type { ChaveTexto } from "@/i18n/pt-BR";
import type { Modo } from "../pagina";

/** Casca de um bloco da página: título, subtítulo e a cor de apoio do modo (Morar ou Investir). */
export function Secao({ id, titulo, sub, modo, children }: { id: string; titulo: ChaveTexto; sub?: ChaveTexto; modo: Modo; children: ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <h2 id={id} className={`border-t-4 pt-3 text-2xl font-bold text-preto ${modo === "investir" ? "border-apoio-investir" : "border-apoio-morar"}`}>
        <T k={titulo} />
      </h2>
      {sub ? (
        <p className="mt-1 text-texto-secundario">
          <T k={sub} />
        </p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Texto do valor ou "Não informado" quando vazio. */
export function ouNaoInformado(valor: string | null | undefined): ReactNode {
  return valor && valor.trim() !== "" ? valor : <T k="empreendimento.nao_informado" />;
}
