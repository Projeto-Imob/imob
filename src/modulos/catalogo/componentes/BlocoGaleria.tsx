import { T } from "@/components/T";
import { texto, type ChaveTexto } from "@/i18n/pt-BR";
import { FachadaIlustrada } from "./FachadaIlustrada";
import { SeloExemplo } from "./SeloIncorporacao";

const ITENS: ChaveTexto[] = [
  "empreendimento.galeria.fachada",
  "empreendimento.galeria.hall",
  "empreendimento.galeria.lazer",
  "empreendimento.galeria.sala",
  "empreendimento.galeria.rua",
];

/** Semente estável a partir do slug, para cada empreendimento ter o seu prédio. */
function semente(slug: string): number {
  let h = 7;
  for (const c of slug) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 1000;
}

/** Fachadas ilustradas de exemplo (decisão 5). As fotos reais chegam com o upload da fatia 1.8. */
export function BlocoGaleria({ slug }: { slug: string }) {
  const base = semente(slug);
  return (
    <section aria-labelledby="bloco-galeria">
      <h2 id="bloco-galeria" className="sr-only">
        <T k="empreendimento.galeria.titulo" />
      </h2>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {ITENS.map((chave, i) => {
          const item = texto(chave);
          return (
            <figure key={chave} className={`relative overflow-hidden border border-borda-controle bg-preto ${i === 0 ? "col-span-2 aspect-16/9 md:row-span-2 md:aspect-auto" : "aspect-4/3"}`}>
              <FachadaIlustrada semente={base * 10 + i} descricao={texto("empreendimento.galeria.alt", { item })} />
              {i === 0 ? (
                <span className="absolute left-2 top-2">
                  <SeloExemplo />
                </span>
              ) : null}
              <figcaption className="absolute inset-x-0 bottom-0 bg-preto px-2 py-1 text-xs text-off-white">
                <T k="empreendimento.galeria.legenda" vars={{ item }} />
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
}
