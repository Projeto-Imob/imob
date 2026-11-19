import { T } from "@/components/T";
import { texto, type ChaveTexto } from "@/i18n/pt-BR";
import { moeda, numero } from "@/lib/formato";
import type { Modo, PaginaEmpreendimento } from "../pagina";
import { Secao } from "./Secao";

/** Lista por tipologia, com as unidades (área, preço e situação). "Restam {x}" só chega decidido, fora do cache (regra 10). */
export function BlocoPlantas({ e, modo, restam }: { e: PaginaEmpreendimento; modo: Modo; restam: Record<string, number> }) {
  return (
    <Secao id="bloco-plantas" titulo="empreendimento.plantas.titulo" sub="empreendimento.plantas.sub" modo={modo}>
      <ul className="grid gap-6">
        {e.tipologias.map((t) => {
          const unidades = e.unidades.filter((u) => u.tipologiaId === t.id);
          const x = restam[t.id];
          return (
            <li key={t.id} className="border border-borda-controle bg-white p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg font-bold text-preto">{t.nome}</h3>
                {x !== undefined ? (
                  <span className="border border-preto px-2 py-0.5 text-sm font-semibold text-preto">
                    <T k="empreendimento.restam" vars={{ n: x }} />
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-texto-secundario">
                {t.tipo} · <T k={`empreendimento.finalidade.${t.finalidade}`} /> ·{" "}
                <T k="empreendimento.plantas.meta" vars={{ dormitorios: t.dormitorios, suites: t.suites, vagas: t.vagas }} />
              </p>
              {unidades.length ? (
                <ul className="mt-3 divide-y divide-borda-controle">
                  {unidades.map((u) => (
                    <li key={u.id} className="grid grid-cols-2 gap-x-4 gap-y-1 py-2 text-sm sm:grid-cols-4">
                      <span className="font-semibold text-preto">
                        <T k="empreendimento.plantas.unidade" vars={{ identificador: u.identificador }} />
                      </span>
                      <span className="text-preto">
                        <T k="empreendimento.plantas.area" vars={{ n: numero(u.areaPrivativa) }} />
                      </span>
                      <span className="text-preto">{moeda(u.preco)}</span>
                      <span className="text-texto-secundario">{texto(`empreendimento.status.${u.status}` satisfies ChaveTexto)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-texto-secundario">
                  <T k="empreendimento.plantas.sem_unidades" />
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </Secao>
  );
}
