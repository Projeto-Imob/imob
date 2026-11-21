import Link from "next/link";
import { T } from "@/components/T";
import { texto } from "@/i18n/pt-BR";
import { moeda } from "@/lib/formato";

/**
 * Barra fixa do celular, acima da navegação: entrada "a partir de" e "Falar com o gerente", que leva ao bloco do
 * escritório. "Agendar visita" só aparece com a flag agendar_visita (fatia 1.5).
 */
export function BarraFixa({ entrada, slug, agendarVisita }: { entrada: number | null; slug: string; agendarVisita: boolean }) {
  return (
    <div
      role="region"
      aria-label={texto("empreendimento.barra.rotulo")}
      className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 flex items-center justify-between gap-3 border-t border-borda-controle bg-off-white px-4 py-2 md:hidden"
    >
      <div>
        <span className="block text-xs text-texto-secundario">
          <T k="empreendimento.barra.entrada" />
        </span>
        <span className="font-bold text-preto">{entrada === null ? <T k="empreendimento.nao_informado" /> : moeda(entrada)}</span>
      </div>
      <div className="flex gap-2">
        {agendarVisita ? (
          <Link href={`/empreendimento/${slug}/agendar`} className="flex min-h-11 items-center bg-laranja px-3 font-semibold text-preto">
            <T k="empreendimento.barra.agendar" />
          </Link>
        ) : null}
        <a href="#escritorio" className="flex min-h-11 items-center bg-preto px-3 font-semibold text-off-white">
          <T k="empreendimento.barra.falar_gerente" />
        </a>
      </div>
    </div>
  );
}
