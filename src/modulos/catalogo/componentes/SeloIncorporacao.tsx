import { T } from "@/components/T";

/** Selo "Incorporação registrada" (regra 1): todo empreendimento da vitrine tem R.I. */
export function SeloIncorporacao() {
  return (
    <span className="etiqueta inline-flex items-center gap-1.5 border border-preto px-2 py-1 text-xs text-preto">
      <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <T k="empreendimento.selo_ri" />
    </span>
  );
}

/** Marca de dado fictício (regra 16). */
export function SeloExemplo() {
  return (
    <span className="etiqueta inline-block bg-grafite px-2 py-1 text-xs text-off-white">
      <T k="empreendimento.exemplo" />
    </span>
  );
}
