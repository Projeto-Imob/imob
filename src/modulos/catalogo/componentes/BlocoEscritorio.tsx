import { FLAGS_PADRAO } from "@config/flags";
import { T } from "@/components/T";
import { texto, type ChaveTexto } from "@/i18n/pt-BR";
import { linkEmail, linkTelefone, linkWhatsapp, type Modo, type PaginaEmpreendimento } from "../pagina";
import { Secao, ouNaoInformado } from "./Secao";
import { SeloExemplo } from "./SeloIncorporacao";

const iniciais = (nome: string) =>
  nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p.charAt(0).toLocaleUpperCase("pt-BR"))
    .join("");

/**
 * Cartão do escritório de vendas: só a house (decisão 11), com contato liberado (decisão 2): wa.me com mensagem
 * pronta e mailto. O telefone fica atrás da flag `contato_telefone_publico`, desligada por decisão do Matheus
 * (18/11/2026). Sem cartão cadastrado, cada campo é "Não informado". O evento manager_contact vem na 1.9.
 */
export function BlocoEscritorio({
  e,
  modo,
  telefonePublico = FLAGS_PADRAO.contato_telefone_publico,
}: {
  e: PaginaEmpreendimento;
  modo: Modo;
  telefonePublico?: boolean;
}) {
  const o = e.escritorio;
  return (
    <Secao id="escritorio" titulo="empreendimento.escritorio.titulo" sub="empreendimento.escritorio.sub" modo={modo}>
      <div className="border border-borda-controle bg-white p-4">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center bg-grafite font-bold text-off-white">
            {o ? iniciais(o.nome) : "?"}
          </span>
          <div>
            <p className="font-bold text-preto">{ouNaoInformado(o?.nome)}</p>
            <p className="text-sm text-texto-secundario">
              {ouNaoInformado(o?.cargo)}
              {o?.origem === "house" ? (
                <>
                  {" · "}
                  <T k="empreendimento.escritorio.origem_house" />
                </>
              ) : null}
            </p>
          </div>
          {o?.exemplo ? <SeloExemplo /> : null}
        </div>
        <p className="mt-3 text-sm text-preto">
          <span className="text-texto-secundario">
            <T k="empreendimento.escritorio.experiencia" />
            {": "}
          </span>
          {ouNaoInformado(o?.experiencia)}
        </p>
        <div className={`mt-4 grid gap-2 ${telefonePublico ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          <Contato
            rotulo="empreendimento.escritorio.whatsapp"
            href={o?.whatsapp ? linkWhatsapp(o.whatsapp, texto("empreendimento.escritorio.mensagem", { empreendimento: e.nome })) : null}
            externo
          />
          <Contato rotulo="empreendimento.escritorio.email" href={o?.email ? linkEmail(o.email) : null} />
          {telefonePublico ? (
            <Contato rotulo="empreendimento.escritorio.telefone" href={o?.telefone ? linkTelefone(o.telefone) : null} />
          ) : null}
        </div>
      </div>
    </Secao>
  );
}

function Contato({ rotulo, href, externo = false }: { rotulo: ChaveTexto; href: string | null; externo?: boolean }) {
  if (!href) {
    return (
      <span className="flex min-h-11 flex-col justify-center border border-borda-controle px-3 py-1 text-sm text-texto-secundario">
        <T k={rotulo} />
        <span className="font-semibold text-preto">
          <T k="empreendimento.nao_informado" />
        </span>
      </span>
    );
  }
  return (
    <a
      href={href}
      {...(externo ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="flex min-h-11 items-center justify-center bg-preto px-3 py-2 font-semibold text-off-white"
    >
      <T k={rotulo} />
    </a>
  );
}
