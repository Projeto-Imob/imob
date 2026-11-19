import { T } from "@/components/T";
import { ptBR, texto, type ChaveTexto } from "@/i18n/pt-BR";
import type { Modo, PaginaEmpreendimento } from "../pagina";
import { Secao } from "./Secao";

/** Comodidades do cadastro. Id sem texto no catálogo não aparece; sem dado cadastrado, "Não informado". */
export function BlocoComodidades({ e, modo }: { e: PaginaEmpreendimento; modo: Modo }) {
  const chaves = (e.comodidades ?? []).map((id) => `comodidade.${id}`).filter((k): k is ChaveTexto => k in ptBR);
  return (
    <Secao id="bloco-comodidades" titulo="empreendimento.comodidades.titulo" modo={modo}>
      {chaves.length ? (
        <ul className="flex flex-wrap gap-2">
          {chaves.map((k) => (
            <li key={k} className="border border-borda-controle bg-white px-3 py-1.5 text-sm text-preto">
              {texto(k)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-preto">
          <T k="empreendimento.nao_informado" />
        </p>
      )}
    </Secao>
  );
}
