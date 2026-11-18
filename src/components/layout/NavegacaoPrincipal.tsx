"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { T } from "@/components/T";
import { FLAGS_PADRAO, type Flag } from "@config/flags";
import { texto, type ChaveTexto } from "@/i18n/pt-BR";
import { IconeBuscar, IconeConta, IconeFavoritos, IconeInicio, IconeMapa } from "./Icones";

type Area = { href: string; rotulo: ChaveTexto; icone: ReactNode; ativa: (caminho: string) => boolean; flag?: Flag };

/** As cinco áreas do comprador. Mapa e Favoritos ficam atrás das flags, desligadas até a fatia 1.3c. */
export const TODAS_AS_AREAS: Area[] = [
  { href: "/", rotulo: "nav.inicio", icone: <IconeInicio />, ativa: (c) => c === "/" },
  { href: "/buscar-imoveis", rotulo: "nav.buscar", icone: <IconeBuscar />, ativa: (c) => c.startsWith("/buscar-imoveis") },
  { href: "/mapa", rotulo: "nav.mapa", icone: <IconeMapa />, ativa: (c) => c.startsWith("/mapa"), flag: "mapa_publico" },
  { href: "/favoritos", rotulo: "nav.favoritos", icone: <IconeFavoritos />, ativa: (c) => c.startsWith("/favoritos"), flag: "favoritos" },
  { href: "/conta", rotulo: "nav.conta", icone: <IconeConta />, ativa: (c) => c.startsWith("/conta") },
];

export const AREAS: Area[] = TODAS_AS_AREAS.filter((a) => !a.flag || FLAGS_PADRAO[a.flag]);

/**
 * Um único <nav>: barra inferior fixa no celular e menu no cabeçalho fixo a partir de md.
 * O item ativo usa o laranja como preenchimento atrás de texto preto (regra do laranja).
 */
export function NavegacaoPrincipal() {
  return <ListaNavegacao caminho={usePathname()} />;
}

/**
 * As áreas, com a ativa marcada. Sem caminho conhecido (no shell estático de uma rota com parâmetro,
 * antes de o caminho chegar), nenhuma área fica ativa.
 */
export function ListaNavegacao({ caminho }: { caminho: string | null }) {
  return (
    <nav
      aria-label={texto("nav.rotulo")}
      data-testid="navegacao-principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-borda-controle bg-off-white pb-[env(safe-area-inset-bottom)] md:static md:border-0 md:bg-transparent md:pb-0"
    >
      <ul className={`grid md:flex md:gap-1 ${AREAS.length === 5 ? "grid-cols-5" : "grid-cols-3"}`}>
        {AREAS.map((area) => {
          const ativa = caminho !== null && area.ativa(caminho);
          return (
            <li key={area.href}>
              <Link
                href={area.href}
                aria-current={ativa ? "page" : undefined}
                className={`flex min-h-14 min-w-11 flex-col items-center justify-center gap-0.5 px-1 text-xs font-medium text-preto md:min-h-11 md:flex-row md:gap-2 md:rounded-md md:px-3 md:text-sm ${
                  ativa ? "bg-laranja font-semibold" : "hover:bg-white"
                }`}
              >
                {area.icone}
                <span className="text-center leading-tight">
                  <T k={area.rotulo} />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
