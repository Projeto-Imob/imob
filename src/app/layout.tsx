import { brand } from "@config/brand";
import { Suspense } from "react";
import { T } from "@/components/T";
import { MarcaCabecalho } from "@/components/layout/MarcaCabecalho";
import { ListaNavegacao, NavegacaoPrincipal } from "@/components/layout/NavegacaoPrincipal";
import { Rodape } from "@/components/layout/Rodape";
import { metadataDaMarca } from "@/lib/metadata";
import { fonteInterface, fonteTitulo } from "@/styles/fonts";
import "./globals.css";

export const metadata = metadataDaMarca(brand);

// A navegação lê o caminho (usePathname), que suspende no shell estático das rotas com parâmetro
// (Cache Components): sem o Suspense, o build falha. O substituto é a mesma navegação, sem área ativa.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${fonteInterface.variable} ${fonteTitulo.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-laranja focus:px-4 focus:py-3 focus:text-preto"
        >
          <T k="layout.pular" />
        </a>
        <header className="sticky top-0 z-30 border-b border-borda-controle bg-off-white">
          <div className="mx-auto flex min-h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
            <MarcaCabecalho marca={brand} />
            <Suspense fallback={<ListaNavegacao caminho={null} />}>
              <NavegacaoPrincipal />
            </Suspense>
          </div>
        </header>
        <main id="conteudo" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8">
          {children}
        </main>
        <Rodape marca={brand} />
      </body>
    </html>
  );
}
