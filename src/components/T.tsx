import { texto, type ChaveTexto, type Variaveis } from "@/i18n/pt-BR";

type Props = {
  k: ChaveTexto;
  vars?: Variaveis;
};

/** Exibe um texto do catálogo (design D7). A sobreposição por conteudo_textos entra no grupo 8. */
export function T({ k, vars }: Props) {
  return <>{texto(k, vars)}</>;
}
