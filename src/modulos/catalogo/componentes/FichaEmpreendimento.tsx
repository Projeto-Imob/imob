import { T } from "@/components/T";
import { texto, type ChaveTexto } from "@/i18n/pt-BR";
import { mesAno, numero } from "@/lib/formato";
import type { PaginaEmpreendimento } from "../pagina";
import { SeloExemplo, SeloIncorporacao } from "./SeloIncorporacao";

type Props = {
  empreendimento: PaginaEmpreendimento;
  /** Regra 10: decidida fora do cache. Total de unidades disponíveis, só com o espelho atualizado há menos de 24 h. */
  restam: number | null;
};

/** Bloco de resumo da página do empreendimento (fatias 0.3 e 1.1). */
export function FichaEmpreendimento({ empreendimento: e, restam }: Props) {
  return (
    <section aria-labelledby="bloco-resumo">
      <div className="flex flex-wrap items-center gap-2">
        <SeloIncorporacao />
        {e.exemplo ? <SeloExemplo /> : null}
      </div>
      <h1 id="bloco-resumo" className="mt-4 text-3xl font-bold text-preto md:text-4xl">
        {e.nome}
      </h1>
      <p className="mt-2 text-texto-secundario">
        <T k="empreendimento.local" vars={{ bairro: e.bairro, cidade: e.cidade, uf: e.uf }} />
      </p>
      <dl aria-label={texto("empreendimento.resumo")} className="mt-6 grid gap-4 sm:grid-cols-3">
        <Fato rotulo="empreendimento.construtora" valor={e.construtora} />
        <Fato rotulo="empreendimento.entrega" valor={e.entrega ? mesAno(e.entrega) : null} />
        <div className="border-t border-borda-controle pt-3">
          <dt className="text-sm text-texto-secundario">
            <T k="empreendimento.obra" />
          </dt>
          <dd className="mt-1 font-semibold text-preto">
            <T k="empreendimento.obra_valor" vars={{ n: numero(e.percentualObra) }} />
          </dd>
        </div>
      </dl>
      <svg viewBox="0 0 100 4" preserveAspectRatio="none" role="img" aria-label={texto("empreendimento.obra_valor", { n: numero(e.percentualObra) })} className="mt-3 h-1.5 w-full max-w-sm">
        <rect width="100" height="4" className="fill-borda-controle" />
        <rect width={Math.max(0, Math.min(100, e.percentualObra))} height="4" className="fill-preto" />
      </svg>
      {restam !== null ? (
        <p className="mt-4 flex flex-wrap items-center gap-2 font-semibold text-preto">
          <T k="empreendimento.restam_resumo" vars={{ n: restam }} />
          <span className="text-sm font-normal text-texto-secundario">
            <T k="empreendimento.espelho_fresco" />
          </span>
        </p>
      ) : (
        <p className="mt-4 text-sm text-texto-secundario">
          <T k="empreendimento.disponibilidade_confirmar" />
        </p>
      )}
      {/* Espaço do botão de favoritar: a fatia 1.3c põe o botão aqui (flag favoritos). */}
      <div data-espaco="favoritar" />
      {e.descricao ? <p className="mt-6 whitespace-pre-line text-preto">{e.descricao}</p> : null}
    </section>
  );
}

/** Substituto enquanto o empreendimento chega do banco. */
export function FichaEmpreendimentoCarregando() {
  return (
    <div role="status" className="max-w-3xl animate-pulse">
      <span className="sr-only">
        <T k="empreendimento.carregando" />
      </span>
      <div aria-hidden="true" className="h-7 w-48 bg-borda-controle" />
      <div aria-hidden="true" className="mt-4 h-10 w-3/4 bg-borda-controle" />
      <div aria-hidden="true" className="mt-3 h-5 w-1/2 bg-borda-controle" />
    </div>
  );
}

function Fato({ rotulo, valor }: { rotulo: ChaveTexto; valor: string | null }) {
  return (
    <div className="border-t border-borda-controle pt-3">
      <dt className="text-sm text-texto-secundario">
        <T k={rotulo} />
      </dt>
      <dd className="mt-1 font-semibold text-preto">{valor ?? <T k="empreendimento.nao_informado" />}</dd>
    </div>
  );
}
