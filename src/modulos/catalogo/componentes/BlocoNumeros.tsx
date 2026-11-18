import { T } from "@/components/T";
import type { ChaveTexto } from "@/i18n/pt-BR";
import { mesAno, moeda } from "@/lib/formato";
import { entradaMinima, precoPorM2, unidadePadrao, type Modo, type PaginaEmpreendimento } from "../pagina";
import { Secao } from "./Secao";

/** Números do cadastro: sem indicador de mercado (regra 3). */
export function BlocoNumeros({ e, modo }: { e: PaginaEmpreendimento; modo: Modo }) {
  const padrao = unidadePadrao(e.unidades);
  const entrada = entradaMinima(e.unidades, e.planos);
  const destaque = modo === "investir" ? "text-apoio-investir" : "text-apoio-morar";
  return (
    <Secao id="bloco-numeros" titulo={modo === "investir" ? "empreendimento.numeros.titulo_investir" : "empreendimento.numeros.titulo"} sub="empreendimento.numeros.sub" modo={modo}>
      <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Numero rotulo="empreendimento.numeros.a_partir" valor={padrao ? moeda(padrao.preco) : null} destaque={destaque} />
        <Numero rotulo="empreendimento.numeros.preco_m2" valor={padrao ? moeda(precoPorM2(padrao)) : null} />
        <Numero rotulo="empreendimento.numeros.entrada_minima" valor={entrada === null ? null : moeda(entrada)} />
        <Numero rotulo="empreendimento.entrega" valor={e.entrega ? mesAno(e.entrega) : null} />
      </dl>
      <p className="mt-4 text-sm text-texto-secundario">
        <span className="font-semibold">
          <T k="empreendimento.numeros.planos" />
          {": "}
        </span>
        {e.planos.length ? e.planos.map((p) => p.nome).join(" · ") : <T k="empreendimento.nao_informado" />}
      </p>
    </Secao>
  );
}

function Numero({ rotulo, valor, destaque = "text-preto" }: { rotulo: ChaveTexto; valor: string | null; destaque?: string }) {
  return (
    <div className="border-t border-borda-controle pt-3">
      <dt className="text-sm text-texto-secundario">
        <T k={rotulo} />
      </dt>
      <dd className={`mt-1 text-lg font-bold ${destaque}`}>{valor ?? <T k="empreendimento.nao_informado" />}</dd>
    </div>
  );
}
