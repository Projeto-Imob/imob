import Link from "next/link";
import { T } from "@/components/T";
import { texto } from "@/i18n/pt-BR";
import type { Modo } from "../pagina";

/** Seletor Morar/Investir no topo da página. O modo fica na URL (`?modo=`), para compartilhar e voltar. */
export function SeletorModo({ slug, modo }: { slug: string; modo: Modo }) {
  return (
    <nav aria-label={texto("empreendimento.modo.rotulo")} className="flex gap-2">
      {(["morar", "investir"] as const).map((m) => (
        <Link
          key={m}
          href={`/empreendimento/${slug}?modo=${m}`}
          aria-current={m === modo ? "true" : undefined}
          className={`flex min-h-11 items-center border px-4 font-semibold ${m === modo ? "border-preto bg-preto text-off-white" : "border-borda-controle bg-white text-preto"}`}
        >
          <T k={m === "morar" ? "empreendimento.modo.morar" : "empreendimento.modo.investir"} />
        </Link>
      ))}
    </nav>
  );
}
