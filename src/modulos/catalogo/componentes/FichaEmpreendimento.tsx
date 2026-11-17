import { T } from "@/components/T";
import { texto, type ChaveTexto } from "@/i18n/pt-BR";
import { mesAno, numero } from "@/lib/formato";
import type { EmpreendimentoPublico } from "../tipos";

/** Resumo do empreendimento na página pública (fatia 0.3). Os demais blocos da página chegam na 1.1. */
export function FichaEmpreendimento({ empreendimento: e }: { empreendimento: EmpreendimentoPublico }) {
  return (
    <article className="max-w-3xl">
      <p className="etiqueta inline-flex items-center gap-1.5 border border-preto px-2 py-1 text-xs text-preto">
        <IconeSelo />
        <T k="empreendimento.selo_ri" />
      </p>
      <h1 className="mt-4 text-3xl font-bold text-preto md:text-4xl">{e.nome}</h1>
      <p className="mt-2 text-texto-secundario">
        <T k="empreendimento.local" vars={{ bairro: e.bairro, cidade: e.cidade, uf: e.uf }} />
      </p>
      <dl aria-label={texto("empreendimento.resumo")} className="mt-6 grid gap-4 sm:grid-cols-3">
        <Fato rotulo="empreendimento.construtora" valor={e.construtora} />
        <Fato rotulo="empreendimento.entrega" valor={e.entrega ? mesAno(e.entrega) : null} />
        <Fato rotulo="empreendimento.obra" valor={texto("empreendimento.obra_valor", { n: numero(e.percentualObra) })} />
      </dl>
      {e.descricao ? <p className="mt-6 whitespace-pre-line text-preto">{e.descricao}</p> : null}
    </article>
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

function IconeSelo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
