import type { Brand } from "@config/brand";
import { T } from "@/components/T";

/** Rodapé sem CRECI (regra 8) e com aviso de dados de exemplo (regra 16). */
export function Rodape({ marca }: { marca: Brand }) {
  return (
    <footer className="border-t border-borda-controle text-sm text-texto-secundario">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8">
        <p className="titulo-marca text-preto">{marca.nome}</p>
        <p className="mt-2" data-testid="aviso-dados-exemplo">
          <span className="etiqueta inline-block bg-lima px-1.5 py-0.5 text-[0.6875rem] text-preto">
            <T k="rodape.dados_exemplo" />
          </span>
        </p>
      </div>
    </footer>
  );
}
