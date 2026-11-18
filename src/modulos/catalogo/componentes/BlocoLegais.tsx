import type { ReactNode } from "react";
import { T } from "@/components/T";
import type { ChaveTexto } from "@/i18n/pt-BR";
import { dataCurta } from "@/lib/formato";
import type { Modo, PaginaEmpreendimento } from "../pagina";
import { Secao, ouNaoInformado } from "./Secao";

/** Dados legais: R.I., cartório, data e patrimônio de afetação. Sem CRECI (regra 8). */
export function BlocoLegais({ e, modo }: { e: PaginaEmpreendimento; modo: Modo }) {
  const afetacao = e.ri.patrimonioAfetacao === null ? null : e.ri.patrimonioAfetacao ? "empreendimento.sim" : "empreendimento.nao";
  return (
    <Secao id="bloco-legais" titulo="empreendimento.legais.titulo" sub="empreendimento.legais.sub" modo={modo}>
      <dl className="grid gap-4 sm:grid-cols-2">
        <Item rotulo="empreendimento.legais.ri" valor={ouNaoInformado(e.ri.numero)} />
        <Item rotulo="empreendimento.legais.cartorio" valor={ouNaoInformado(e.ri.cartorio)} />
        <Item rotulo="empreendimento.legais.data" valor={ouNaoInformado(e.ri.dataRegistro ? dataCurta(e.ri.dataRegistro) : null)} />
        <Item rotulo="empreendimento.legais.afetacao" valor={afetacao ? <T k={afetacao} /> : <T k="empreendimento.nao_informado" />} />
      </dl>
    </Secao>
  );
}

function Item({ rotulo, valor }: { rotulo: ChaveTexto; valor: ReactNode }) {
  return (
    <div className="border-t border-borda-controle pt-3">
      <dt className="text-sm text-texto-secundario">
        <T k={rotulo} />
      </dt>
      <dd className="mt-1 font-semibold text-preto">{valor}</dd>
    </div>
  );
}
