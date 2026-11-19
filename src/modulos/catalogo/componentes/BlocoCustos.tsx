"use client";

import { useState } from "react";
import { T } from "@/components/T";
import { texto, type ChaveTexto } from "@/i18n/pt-BR";
import { moeda, numero } from "@/lib/formato";
import { fluxoDoPlano, unidadePadrao, unidadesDeVenda, type Modo, type PlanoPublico, type TipologiaPublica, type UnidadePublica } from "../pagina";
import { Secao } from "./Secao";

type Props = { unidades: UnidadePublica[]; tipologias: TipologiaPublica[]; planos: PlanoPublico[]; modo: Modo };

const CORES_BARRA = ["fill-preto", "fill-apoio-investir", "fill-apoio-morar", "fill-texto-discreto", "fill-borda-controle"];
const CORES_AMOSTRA = ["bg-preto", "bg-apoio-investir", "bg-apoio-morar", "bg-texto-discreto", "bg-borda-controle"];

/**
 * "Seus custos": fluxo de cada plano para a unidade escolhida. A conta roda no navegador, por fluxoDoPlano
 * (função pura); nada é enviado nem guardado. ITBI e registro ficam "Não informado" (C7).
 */
export function BlocoCustos({ unidades, tipologias, planos, modo }: Props) {
  const disponiveis = unidades.filter((u) => u.status === "disponivel");
  const padrao = unidadePadrao(unidadesDeVenda(unidades, tipologias)) ?? unidadePadrao(unidades);
  const [unidadeId, setUnidadeId] = useState(() => padrao?.id ?? "");
  const [planoId, setPlanoId] = useState(() => planos[0]?.id ?? "");
  const unidade = disponiveis.find((u) => u.id === unidadeId) ?? padrao;
  const plano = planos.find((p) => p.id === planoId) ?? null;

  return (
    <Secao id="bloco-custos" titulo="empreendimento.custos.titulo" sub="empreendimento.custos.sub" modo={modo}>
      <p className="mb-4 inline-block border border-atencao px-2 py-1 text-sm font-semibold text-atencao">
        <T k="empreendimento.custos.estimativa" />
      </p>
      {!unidade || !plano ? (
        <p className="text-preto">
          <T k={unidade ? "empreendimento.custos.sem_plano" : "empreendimento.custos.sem_unidade"} />
        </p>
      ) : (
        <Calculo
          unidade={unidade}
          plano={plano}
          disponiveis={disponiveis}
          tipologias={tipologias}
          planos={planos}
          aoEscolherUnidade={setUnidadeId}
          aoEscolherPlano={setPlanoId}
        />
      )}
    </Secao>
  );
}

function Calculo({
  unidade, plano, disponiveis, tipologias, planos, aoEscolherUnidade, aoEscolherPlano,
}: {
  unidade: UnidadePublica;
  plano: PlanoPublico;
  disponiveis: UnidadePublica[];
  tipologias: TipologiaPublica[];
  planos: PlanoPublico[];
  aoEscolherUnidade: (id: string) => void;
  aoEscolherPlano: (id: string) => void;
}) {
  const fluxo = fluxoDoPlano(unidade, plano);
  const nomeDaTipologia = (id: string) => tipologias.find((t) => t.id === id)?.nome ?? "";
  const linhas: Array<{ rotulo: ChaveTexto; pct: number; valor: number; nota: string }> = [
    { rotulo: "empreendimento.custos.sinal", pct: plano.sinalPercentual, valor: fluxo.sinal, nota: texto("empreendimento.custos.sinal_quando") },
    {
      rotulo: "empreendimento.custos.mensais",
      pct: plano.mensaisPercentual,
      valor: fluxo.mensais,
      nota:
        fluxo.parcela === null || plano.numeroParcelas === null
          ? texto("empreendimento.custos.mensais_sem_numero")
          : texto("empreendimento.custos.mensais_parcelas", { n: plano.numeroParcelas, valor: moeda(fluxo.parcela) }),
    },
    {
      rotulo: "empreendimento.custos.intercaladas",
      pct: plano.intercaladasPercentual,
      valor: fluxo.intercaladas,
      nota: plano.intercaladasPercentual ? texto("empreendimento.custos.intercaladas_quando") : texto("empreendimento.custos.nao_ha"),
    },
    {
      rotulo: "empreendimento.custos.chaves",
      pct: plano.chavesPercentual,
      valor: fluxo.chaves,
      nota: plano.chavesPercentual ? texto("empreendimento.custos.chaves_quando") : texto("empreendimento.custos.nao_ha"),
    },
    { rotulo: "empreendimento.custos.saldo", pct: plano.saldoPercentual, valor: fluxo.saldo, nota: texto("empreendimento.custos.saldo_quando") },
  ];
  let acumulado = 0;
  const f = plano.financiamento;
  const sim = (v: boolean): ChaveTexto => (v ? "empreendimento.sim" : "empreendimento.nao");

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="custos-unidade" className="block text-sm font-semibold text-preto">
            <T k="empreendimento.custos.unidade" />
          </label>
          <select
            id="custos-unidade"
            value={unidade.id}
            onChange={(ev) => aoEscolherUnidade(ev.target.value)}
            className="mt-1 min-h-11 w-full border border-borda-controle bg-white px-3 text-preto"
          >
            {disponiveis.map((u) => (
              <option key={u.id} value={u.id}>
                {texto("empreendimento.custos.unidade_opcao", { identificador: u.identificador, tipologia: nomeDaTipologia(u.tipologiaId), area: numero(u.areaPrivativa) })}
              </option>
            ))}
          </select>
        </div>
        <fieldset>
          <legend className="text-sm font-semibold text-preto">
            <T k="empreendimento.custos.plano" />
          </legend>
          <div className="mt-1 flex flex-col gap-2">
            {planos.map((p) => (
              <label key={p.id} className="flex min-h-11 items-center gap-2 border border-borda-controle bg-white px-3 text-preto">
                <input type="radio" name="custos-plano" value={p.id} checked={p.id === plano.id} onChange={() => aoEscolherPlano(p.id)} />
                {p.nome}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <svg
        viewBox="0 0 100 6"
        preserveAspectRatio="none"
        role="img"
        aria-label={texto("empreendimento.custos.divisao", { partes: linhas.map((l) => `${texto(l.rotulo)} ${numero(l.pct)}%`).join(", ") })}
        className="mt-6 h-4 w-full"
      >
        {linhas.map((l, i) => {
          const x = acumulado;
          acumulado += l.pct;
          return <rect key={l.rotulo} x={x} width={l.pct} height="6" className={CORES_BARRA[i]} />;
        })}
      </svg>

      <ul className="mt-4 divide-y divide-borda-controle border-y border-borda-controle">
        {linhas.map((l, i) => (
          <li key={l.rotulo} className="grid grid-cols-[1fr_auto] gap-x-4 py-3">
            <span className="flex items-start gap-2 text-preto">
              <span aria-hidden="true" className={`mt-1.5 inline-block size-3 shrink-0 ${CORES_AMOSTRA[i]}`} />
              <span>
                <T k={l.rotulo} /> <strong>{numero(l.pct)}%</strong>
                <span className="block text-sm text-texto-secundario">{l.nota}</span>
              </span>
            </span>
            <span className="font-semibold text-preto">{moeda(l.valor)}</span>
          </li>
        ))}
        <li className="grid grid-cols-[1fr_auto] gap-x-4 py-3 font-bold text-preto">
          <T k="empreendimento.custos.preco" />
          <span>{moeda(fluxo.preco)}</span>
        </li>
        <li className="grid grid-cols-[1fr_auto] gap-x-4 py-3 text-preto">
          <span>
            <T k="empreendimento.custos.itbi" />
            <span className="block text-sm text-texto-secundario">
              <T k="empreendimento.custos.itbi_nota" />
            </span>
          </span>
          <span className="font-semibold">
            <T k="empreendimento.nao_informado" />
          </span>
        </li>
      </ul>
      <p className="mt-3 text-sm text-texto-secundario">
        <T k="empreendimento.custos.correcao" /> <T k="empreendimento.custos.nota" />
      </p>

      <h3 className="mt-6 text-lg font-bold text-preto">
        <T k="empreendimento.fin.titulo" />
      </h3>
      <dl className="mt-2 grid gap-3 sm:grid-cols-2">
        <Regra rotulo="empreendimento.fin.aceita" valor={texto(sim(f.aceita))} />
        <Regra rotulo="empreendimento.fin.momento" valor={f.momento ? texto(f.momento === "chaves" ? "empreendimento.fin.momento_chaves" : "empreendimento.fin.momento_assinatura") : null} />
        <Regra rotulo="empreendimento.fin.maximo" valor={f.percentualMaximo === null ? null : texto("empreendimento.fin.maximo_valor", { n: numero(f.percentualMaximo) })} />
        <Regra rotulo="empreendimento.fin.fgts" valor={texto(sim(f.fgts))} />
        <Regra rotulo="empreendimento.fin.dacao" valor={texto(sim(f.dacao))} />
        <Regra rotulo="empreendimento.fin.direto" valor={texto(sim(f.parcelamentoDireto))} />
      </dl>
    </div>
  );
}

function Regra({ rotulo, valor }: { rotulo: ChaveTexto; valor: string | null }) {
  return (
    <div className="border-t border-borda-controle pt-2">
      <dt className="text-sm text-texto-secundario">
        <T k={rotulo} />
      </dt>
      <dd className="font-semibold text-preto">{valor ?? <T k="empreendimento.nao_informado" />}</dd>
    </div>
  );
}
