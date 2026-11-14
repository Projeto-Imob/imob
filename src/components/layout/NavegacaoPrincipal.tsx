"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { T } from "@/components/T";
import { texto, type ChaveTexto } from "@/i18n/pt-BR";
import { IconeBuscar, IconeConta, IconeFavoritos, IconeInicio, IconeMapa } from "./Icones";

type Area = { href: string; rotulo: ChaveTexto; icone: ReactNode; ativa: (caminho: string) => boolean };

/** As cinco áreas do comprador (CLAUDE.md, seção 5). */
export const AREAS: Area[] = [
  { href: "/", rotulo: "nav.inicio", icone: <IconeInicio />, ativa: (c) => c === "/" },
  { href: "/buscar-imoveis", rotulo: "nav.buscar", icone: <IconeBuscar />, ativa: (c) => c.startsWith("/buscar-imoveis") },
  { href: "/mapa", rotulo: "nav.mapa", icone: <IconeMapa />, ativa: (c) => c.startsWith("/mapa") },
  { href: "/favoritos", rotulo: "nav.favoritos", icone: <IconeFavoritos />, ativa: (c) => c.startsWith("/favoritos") },
  { href: "/conta", rotulo: "nav.conta", icone: <IconeConta />, ativa: (c) => c.startsWith("/conta") },
];

/**
 * Um único <nav>: barra inferior fixa no celular e menu no cabeçalho fixo a partir de md.
 * O item ativo usa o lima como preenchimento atrás de texto preto (regra do lima).
 */
export function NavegacaoPrincipal() {
  const caminho = usePathname() ?? "/";
  return (
    <nav
      aria-label={texto("nav.rotulo")}
      data-testid="navegacao-principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-borda-controle bg-off-white pb-[env(safe-area-inset-bottom)] md:static md:border-0 md:bg-transparent md:pb-0"
    >
      <ul className="grid grid-cols-5 md:flex md:gap-1">
        {AREAS.map((area) => {
          const ativa = area.ativa(caminho);
          return (
            <li key={area.href}>
              <Link
                href={area.href}
                aria-current={ativa ? "page" : undefined}
                className={`flex min-h-14 min-w-11 flex-col items-center justify-center gap-0.5 px-1 text-xs font-medium text-preto md:min-h-11 md:flex-row md:gap-2 md:rounded-md md:px-3 md:text-sm ${
                  ativa ? "bg-lima font-semibold" : "hover:bg-white"
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
