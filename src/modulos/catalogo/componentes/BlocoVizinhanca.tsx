import type { ReactNode } from "react";
import { T } from "@/components/T";
import { texto, type ChaveTexto } from "@/i18n/pt-BR";
import type { CategoriaPonto } from "../tipos";
import { fraseVizinhanca, pontosPorCategoria, type Modo, type PaginaEmpreendimento } from "../pagina";
import { Secao } from "./Secao";

const ROTULO: Record<CategoriaPonto, ChaveTexto> = {
  escola: "empreendimento.viz.escola",
  parque: "empreendimento.viz.parque",
  hospital: "empreendimento.viz.hospital",
  academia: "empreendimento.viz.academia",
  mercado: "empreendimento.viz.mercado",
  transporte: "empreendimento.viz.transporte",
};

const maiuscula = (s: string) => s.charAt(0).toLocaleUpperCase("pt-BR") + s.slice(1);
const minuscula = (s: string) => s.charAt(0).toLocaleLowerCase("pt-BR") + s.slice(1);

/** Vizinhança com tempo a pé (80 m/min), lida do cadastro: sem serviço pago e sem IA. */
export function BlocoVizinhanca({ e, modo }: { e: PaginaEmpreendimento; modo: Modo }) {
  const [a, b] = fraseVizinhanca(e.pontos);
  return (
    <Secao id="bloco-vizinhanca" titulo="empreendimento.viz.titulo" modo={modo}>
      {a && b ? (
        <p className="font-semibold text-preto">
          <T k="empreendimento.viz.frase_2" vars={{ a: maiuscula(texto(ROTULO[a.categoria])), x: a.minutos, b: minuscula(texto(ROTULO[b.categoria])), y: b.minutos }} />
        </p>
      ) : a ? (
        <p className="font-semibold text-preto">
          <T k="empreendimento.viz.frase_1" vars={{ a: maiuscula(texto(ROTULO[a.categoria])), x: a.minutos }} />
        </p>
      ) : null}
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {pontosPorCategoria(e.pontos).map(({ categoria, ponto }) => (
          <li key={categoria} className="flex items-start gap-3 border-t border-borda-controle pt-3">
            <span className="mt-0.5 text-preto">
              <IconeCategoria categoria={categoria} />
            </span>
            <span>
              <span className="block text-sm text-texto-secundario">
                <T k={ROTULO[categoria]} />
              </span>
              {ponto ? (
                <>
                  <span className="block font-semibold text-preto">{ponto.nome}</span>
                  <span className="block text-sm text-texto-secundario">
                    <T k="empreendimento.viz.linha" vars={{ distancia: ponto.distanciaM, minutos: ponto.minutos }} />
                  </span>
                </>
              ) : (
                <span className="block font-semibold text-preto">
                  <T k="empreendimento.nao_informado" />
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-texto-secundario">
        <T k="empreendimento.viz.nota" />
      </p>
    </Secao>
  );
}

const TRACOS: Record<CategoriaPonto, ReactNode> = {
  escola: <path d="M2 9l10-5 10 5-10 5zM6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5" />,
  parque: <path d="M12 21v-7M12 14c-4 0-6-3-6-6a6 6 0 0 1 12 0c0 3-2 6-6 6z" />,
  hospital: <path d="M4 4h16v16H4zM12 8v8M8 12h8" />,
  academia: <path d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12" />,
  mercado: <path d="M3 4h2l2.5 11h10L20 7H6.5M9 20h.01M17 20h.01" />,
  transporte: <path d="M5 4h14a1 1 0 0 1 1 1v11H4V5a1 1 0 0 1 1-1zM4 11h16M8 20v-4M16 20v-4" />,
};

function IconeCategoria({ categoria }: { categoria: CategoriaPonto }) {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {TRACOS[categoria]}
    </svg>
  );
}
