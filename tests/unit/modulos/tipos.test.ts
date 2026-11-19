import { describe, expect, it } from "vitest";
import { evento } from "@/modulos/analytics";
import { lead, leadContato } from "@/modulos/atendimento";
import { PERFIL_VAZIO, perfil } from "@/modulos/busca";
import { empreendimento, escritorioVendas, plano, tipologia, unidade } from "@/modulos/catalogo";

const ID = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

const empreendimentoValido = {
  id: ID(1),
  slug: "residencial-exemplo",
  tenantId: ID(2),
  nome: "Residencial Exemplo",
  cnpj: "12.345.678/0001-90",
  ri: { numero: "R.1-12345", cartorio: "1º Registro de Imóveis", dataRegistro: "2026-01-10", patrimonioAfetacao: true },
  tipo: "novo",
  visibilidade: "ativo",
  publicacao: "publicado",
  curadoriaAprovada: true,
  preLancamentoAtivo: false,
  descricao: "Exemplo.",
  videos: [],
  capaPath: null,
  mapaInterativoUrl: null,
  obraEtapas: [{ nome: "Fundação", percentual: 100 }],
  percentualObra: 40,
  aceitaPermuta: false,
  comodidades: ["piscina"],
  localizacao: { lat: -30.03, lng: -51.2 },
  bairro: "Centro Histórico",
  cidade: "Porto Alegre",
  uf: "RS",
  pontosProximos: [{ categoria: "escola", nome: "Escola Exemplo", distanciaM: 480 }],
  espelhoAtualizadoEm: "2026-11-12T10:00:00-03:00",
  atualizadoEm: "2026-11-12T10:00:00-03:00",
  exemplo: true,
};

describe("escritório de vendas: telefones", () => {
  const cartao = {
    empreendimentoId: ID(1), origem: "house", nome: "Atendimento", cargo: null, experiencia: null, fotoPath: null,
    whatsapp: "+5551900000100", email: "atendimento.house@exemplo.invalid", telefone: "+555130000100", exemplo: true,
  };

  it("aceita WhatsApp e telefone internacionais, ou nulos", () => {
    expect(escritorioVendas.safeParse(cartao).success).toBe(true);
    expect(escritorioVendas.safeParse({ ...cartao, whatsapp: null, telefone: null }).success).toBe(true);
  });

  it.each(["51900000100", "+0551900000100", "+55 51 90000-0100", "+5551", "+5551900000100123456", "tel:+5551900000100"])("recusa %s", (valor) => {
    expect(escritorioVendas.safeParse({ ...cartao, whatsapp: valor }).success).toBe(false);
    expect(escritorioVendas.safeParse({ ...cartao, telefone: valor }).success).toBe(false);
  });
});

describe("schemas de domínio", () => {
  it("aceita um empreendimento válido", () => {
    expect(empreendimento.parse(empreendimentoValido)).toEqual(empreendimentoValido);
  });

  it.each([
    ["nome com 3 caracteres", { nome: "Abc" }],
    ["CNPJ fora do formato", { cnpj: "12345678000190" }],
    ["campo desconhecido (estrito)", { comissao: 5 }],
    ["dado não marcado como exemplo", { exemplo: false }],
    ["visibilidade inválida", { visibilidade: "publico" }],
    ["slug com maiúsculas", { slug: "Residencial" }],
  ])("recusa empreendimento com %s", (_, alteracao) => {
    expect(empreendimento.safeParse({ ...empreendimentoValido, ...alteracao }).success).toBe(false);
  });

  it("aceita empreendimento sem R.I. (opcional no cadastro)", () => {
    expect(empreendimento.safeParse({ ...empreendimentoValido, ri: null }).success).toBe(true);
  });

  const tipologiaValida = {
    id: ID(3),
    empreendimentoId: ID(1),
    nome: "2 dormitórios final 01",
    tipo: "Apartamento",
    finalidade: "venda",
    plantaPath: null,
    dormitorios: 2,
    suites: 1,
    suitesMaster: 0,
    banheiros: 2,
    lavabos: 0,
    vagas: 1,
    subcondominioIds: [ID(4)],
    exemplo: true,
  };

  it("recusa tipologia sem subcondomínio vinculado", () => {
    expect(tipologia.safeParse(tipologiaValida).success).toBe(true);
    expect(tipologia.safeParse({ ...tipologiaValida, subcondominioIds: [] }).success).toBe(false);
  });

  it("recusa tipo de tipologia fora da lista da especificação", () => {
    expect(tipologia.safeParse({ ...tipologiaValida, tipo: "Mansão" }).success).toBe(false);
  });

  it("recusa unidade com preço zero e status desconhecido", () => {
    const u = { id: ID(5), empreendimentoId: ID(1), tipologiaId: ID(3), subcondominioId: ID(4), identificador: "101", areaPrivativa: 62, preco: 480000, status: "disponivel", exemplo: true };
    expect(unidade.safeParse(u).success).toBe(true);
    expect(unidade.safeParse({ ...u, preco: 0 }).success).toBe(false);
    expect(unidade.safeParse({ ...u, status: "bloqueada" }).success).toBe(false);
  });

  it("aceita plano sem número de parcelas e recusa percentual acima de 100", () => {
    const p = {
      id: ID(6), empreendimentoId: ID(1), nome: "Plano direto", sinalPercentual: 10, mensaisPercentual: 20, numeroParcelas: null,
      intercaladasPercentual: 10, chavesPercentual: 10, saldoPercentual: 50, indiceCorrecao: "INCC",
      financiamento: { aceita: true, momento: "chaves", percentualMaximo: 80, fgts: true, dacao: false, parcelamentoDireto: true },
      exemplo: true,
    };
    expect(plano.safeParse(p).success).toBe(true);
    expect(plano.safeParse({ ...p, sinalPercentual: 120 }).success).toBe(false);
  });

  it("perfil vazio é válido e opção de quartos desconhecida é recusada", () => {
    expect(perfil.parse(PERFIL_VAZIO)).toEqual(PERFIL_VAZIO);
    expect(perfil.safeParse({ ...PERFIL_VAZIO, quartos: ["5"] }).success).toBe(false);
  });

  it("lead e contato separados; WhatsApp em formato numérico", () => {
    const l = { id: ID(7), origem: "busca", campanhaTenantId: null, contaId: null, visitorId: ID(8), perfil: PERFIL_VAZIO, requisitosTextoOriginal: null, criadoEm: "2026-11-12T10:00:00-03:00", exemplo: true };
    expect(lead.safeParse(l).success).toBe(true);
    expect(lead.safeParse({ ...l, origem: "corretagem" }).success).toBe(false);
    const c = { leadId: ID(7), nome: "Pessoa Exemplo", whatsapp: "+5551999990000", email: null, optInWhatsapp: false, exemplo: true };
    expect(leadContato.safeParse(c).success).toBe(true);
    expect(leadContato.safeParse({ ...c, whatsapp: "(51) 99999-0000" }).success).toBe(false);
  });

  it("evento só aceita tipos do catálogo", () => {
    const e = { id: ID(9), visitorId: ID(8), contaId: null, tipo: "quiz_start", empreendimentoId: null, dados: {}, criadoEm: "2026-11-12T10:00:00-03:00" };
    expect(evento.safeParse(e).success).toBe(true);
    expect(evento.safeParse({ ...e, tipo: "page_view" }).success).toBe(false);
  });
});
