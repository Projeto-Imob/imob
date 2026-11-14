/**
 * Seed fictício e determinístico de Porto Alegre (tarefa 2.2, design D12).
 * Fonte única do modo local (importado pelo adaptador local) e do seed do banco
 * (`npm run seed:json` gera o JSON consumido no grupo 4). Todo registro tem `exemplo: true`.
 * Nomes de pessoas, empresas e empreendimentos são inventados; bairros e coordenadas são
 * referências geográficas públicas e aproximadas.
 */
import type {
  Comodidade,
  Conta,
  Empreendimento,
  EmpreendimentoComercial,
  Incorporadora,
  Plano,
  PontoProximo,
  Subcondominio,
  Tipologia,
  Unidade,
} from "@/dominio/tipos";

/** UUID v4 fixo a partir de um prefixo de entidade e um número. */
export function uid(prefixo: number, n: number): string {
  return `00000000-0000-4000-8${String(prefixo).padStart(3, "0")}-${String(n).padStart(12, "0")}`;
}

const P = { tenant: 1, conta: 2, emp: 3, sub: 4, tip: 5, uni: 6, plano: 7 } as const;

/** Data de referência do seed. As fases de venda são calculadas contra o relógio de quem consome. */
export const DATA_REFERENCIA_SEED = "2026-11-01T09:00:00-03:00";

// ---------- Tenants e contas ----------

export const incorporadoras: Incorporadora[] = [
  { id: uid(P.tenant, 1), tipo: "incorporadora", nomeComercial: "Horizonte Sul", razaoSocial: "Horizonte Sul Incorporações Ltda. (exemplo)", situacao: "ativo", exemplo: true },
  { id: uid(P.tenant, 2), tipo: "incorporadora", nomeComercial: "Vale Claro", razaoSocial: "Vale Claro Construtora S.A. (exemplo)", situacao: "ativo", exemplo: true },
  { id: uid(P.tenant, 3), tipo: "incorporadora", nomeComercial: "Pedra Alta", razaoSocial: "Pedra Alta Empreendimentos Ltda. (exemplo)", situacao: "ativo", exemplo: true },
];
const [HORIZONTE, VALE, PEDRA] = incorporadoras.map((i) => i.id) as [string, string, string];

const contaBase = { cargo: null, whatsapp: null, telefone: null, ativa: true, exemplo: true } as const;

export const contas: Conta[] = [
  // House de vendas (equipe da plataforma: tenant nulo)
  { ...contaBase, id: uid(P.conta, 1), nome: "Marina Exemplo", email: "marina.analista@exemplo.invalid", papel: "internal_seller", tenantId: null, cargo: "Analista de vendas", whatsapp: "+5551900000001" },
  { ...contaBase, id: uid(P.conta, 2), nome: "Rafael Exemplo", email: "rafael.analista@exemplo.invalid", papel: "internal_seller", tenantId: null, cargo: "Analista de vendas", whatsapp: "+5551900000002" },
  { ...contaBase, id: uid(P.conta, 3), nome: "Helena Exemplo", email: "helena.contas@exemplo.invalid", papel: "internal_account_manager", tenantId: null, cargo: "Gerente de contas", whatsapp: "+5551900000003", telefone: "+555130000003" },
  // Incorporadoras
  { ...contaBase, id: uid(P.conta, 10), nome: "Paulo Exemplo", email: "paulo@horizonte.exemplo.invalid", papel: "client_superadmin", tenantId: HORIZONTE },
  { ...contaBase, id: uid(P.conta, 11), nome: "Lia Exemplo", email: "lia@horizonte.exemplo.invalid", papel: "client_manager", tenantId: HORIZONTE, cargo: "Gerente de produtos" },
  { ...contaBase, id: uid(P.conta, 20), nome: "Bruno Exemplo", email: "bruno@valeclaro.exemplo.invalid", papel: "client_superadmin", tenantId: VALE },
  { ...contaBase, id: uid(P.conta, 30), nome: "Carla Exemplo", email: "carla@pedraalta.exemplo.invalid", papel: "client_superadmin", tenantId: PEDRA },
  // Compradores
  { ...contaBase, id: uid(P.conta, 100), nome: "Comprador Exemplo Um", email: "comprador1@exemplo.invalid", papel: "buyer", tenantId: null },
  { ...contaBase, id: uid(P.conta, 101), nome: "Compradora Exemplo Dois", email: "comprador2@exemplo.invalid", papel: "buyer", tenantId: null },
];

// ---------- Catálogo de comodidades (subconjunto inicial; o catálogo completo é editável pelo god mode) ----------

export const comodidades: Comodidade[] = [
  { id: "piscina", nome: "Piscina", grupo: "uso_comum", palavrasChave: ["piscina"] },
  { id: "garagem", nome: "Garagem", grupo: "infraestrutura_seguranca", palavrasChave: ["garagem", "vaga"] },
  { id: "portaria_24h", nome: "Portaria 24h", grupo: "infraestrutura_seguranca", palavrasChave: ["portaria", "porteiro"] },
  { id: "churrasqueira", nome: "Churrasqueira", grupo: "uso_comum", palavrasChave: ["churrasqueira", "churrasco"] },
  { id: "academia", nome: "Academia", grupo: "uso_comum", palavrasChave: ["academia", "fitness"] },
  { id: "salao_festas", nome: "Salão de festas", grupo: "uso_comum", palavrasChave: ["salao de festas", "salao"] },
  { id: "playground", nome: "Playground", grupo: "uso_comum", palavrasChave: ["playground", "brinquedoteca", "parquinho"] },
  { id: "pet_place", nome: "Pet place", grupo: "uso_comum", palavrasChave: ["pet place", "espaco pet"] },
  { id: "varanda_gourmet", nome: "Varanda gourmet", grupo: "uso_comum", palavrasChave: ["varanda gourmet", "sacada gourmet"] },
  { id: "coworking", nome: "Coworking", grupo: "uso_comum", palavrasChave: ["coworking"] },
  { id: "bicicletario", nome: "Bicicletário", grupo: "infraestrutura_seguranca", palavrasChave: ["bicicletario", "bicicleta"] },
  { id: "gerador", nome: "Gerador", grupo: "infraestrutura_seguranca", palavrasChave: ["gerador"] },
];

/** Chips da pergunta 7 (seção 5): ids do catálogo. */
export const CHIPS_REQUISITOS = ["piscina", "garagem", "portaria_24h", "churrasqueira", "academia"] as const;

// ---------- Empreendimentos ----------

type Definicao = {
  n: number;
  tenantId: string;
  nome: string;
  slug: string;
  bairro: string;
  lat: number;
  lng: number;
  ri: boolean;
  publicacao?: Empreendimento["publicacao"];
  curadoriaAprovada?: boolean;
  visibilidade?: Empreendimento["visibilidade"];
  percentualObra: number;
  aceitaPermuta: boolean;
  comodidades: string[] | null;
  status: Subcondominio["status"];
  dataLancamento: string;
  dataEntrega: string;
  /** [dormitórios, suítes, vagas, área, preço base, quantidade de unidades] */
  tipologias: Array<[number, number, number, number, number, number]>;
  /** Força todas as unidades vendidas (esgotado). */
  todasVendidas?: boolean;
  planos: Array<Pick<Plano, "nome" | "sinalPercentual" | "mensaisPercentual" | "numeroParcelas" | "intercaladasPercentual" | "chavesPercentual" | "saldoPercentual">>;
  pontos: PontoProximo[];
  comissao: number | null;
};

const pontosPadrao = (bairro: string, base: number): PontoProximo[] => [
  { categoria: "escola", nome: `Escola Exemplo ${bairro}`, distanciaM: 300 + base },
  { categoria: "parque", nome: `Praça Exemplo ${bairro}`, distanciaM: 500 + base },
  { categoria: "hospital", nome: "Hospital Exemplo", distanciaM: 1400 + base },
  { categoria: "academia", nome: "Academia Exemplo", distanciaM: 250 + base },
  { categoria: "mercado", nome: "Mercado Exemplo", distanciaM: 200 + base },
  { categoria: "transporte", nome: "Parada de ônibus Exemplo", distanciaM: 120 + base },
];

const planoDireto = { nome: "Direto com a construtora", sinalPercentual: 10, mensaisPercentual: 20, numeroParcelas: 36, intercaladasPercentual: 10, chavesPercentual: 10, saldoPercentual: 50 };
const planoFinanciado = { nome: "Sinal e financiamento", sinalPercentual: 20, mensaisPercentual: 10, numeroParcelas: 24, intercaladasPercentual: 0, chavesPercentual: 0, saldoPercentual: 70 };
const planoSemParcelas = { nome: "Mensais a combinar", sinalPercentual: 15, mensaisPercentual: 15, numeroParcelas: null, intercaladasPercentual: 0, chavesPercentual: 10, saldoPercentual: 60 };

const DEFINICOES: Definicao[] = [
  // ---- Base elegível ----
  { n: 1, tenantId: HORIZONTE, nome: "Residencial Jardim das Águas", slug: "residencial-jardim-das-aguas", bairro: "Moinhos de Vento", lat: -30.0262, lng: -51.2009, ri: true, percentualObra: 100, aceitaPermuta: true, comodidades: ["piscina", "garagem", "portaria_24h", "academia", "salao_festas"], status: "pronto", dataLancamento: "2023-03-01", dataEntrega: "2025-12-15", tipologias: [[2, 1, 1, 68, 690000, 6], [3, 1, 2, 94, 980000, 4]], planos: [planoFinanciado], pontos: pontosPadrao("Moinhos", 0), comissao: 4 },
  { n: 2, tenantId: HORIZONTE, nome: "Edifício Mirante Petrópolis", slug: "edificio-mirante-petropolis", bairro: "Petrópolis", lat: -30.0425, lng: -51.1846, ri: true, percentualObra: 55, aceitaPermuta: false, comodidades: ["garagem", "portaria_24h", "churrasqueira", "playground"], status: "em_obra", dataLancamento: "2025-02-01", dataEntrega: "2027-10-30", tipologias: [[1, 0, 1, 42, 420000, 5], [2, 1, 1, 63, 560000, 6]], planos: [planoDireto, planoFinanciado], pontos: pontosPadrao("Petrópolis", 150), comissao: 4.5 },
  { n: 3, tenantId: VALE, nome: "Vila Menino Deus", slug: "vila-menino-deus", bairro: "Menino Deus", lat: -30.0525, lng: -51.2244, ri: true, percentualObra: 30, aceitaPermuta: true, comodidades: ["piscina", "garagem", "churrasqueira", "pet_place"], status: "na_planta", dataLancamento: "2026-03-01", dataEntrega: "2028-12-20", tipologias: [[2, 1, 1, 70, 610000, 6], [3, 2, 2, 102, 890000, 3]], planos: [planoDireto, planoSemParcelas], pontos: pontosPadrao("Menino Deus", 80), comissao: 5 },
  { n: 4, tenantId: VALE, nome: "Bela Vista Prime", slug: "bela-vista-prime", bairro: "Bela Vista", lat: -30.0405, lng: -51.1985, ri: true, percentualObra: 80, aceitaPermuta: false, comodidades: ["piscina", "garagem", "portaria_24h", "academia", "coworking"], status: "em_obra", dataLancamento: "2024-06-01", dataEntrega: "2026-12-10", tipologias: [[3, 3, 2, 128, 1450000, 4], [4, 3, 3, 165, 1980000, 2]], planos: [planoFinanciado], pontos: pontosPadrao("Bela Vista", 220), comissao: 3.5 },
  { n: 5, tenantId: PEDRA, nome: "Studio Cidade Baixa", slug: "studio-cidade-baixa", bairro: "Cidade Baixa", lat: -30.042, lng: -51.219, ri: true, percentualObra: 45, aceitaPermuta: false, comodidades: null, status: "em_obra", dataLancamento: "2025-08-01", dataEntrega: "2027-08-15", tipologias: [[0, 0, 0, 34, 360000, 8]], planos: [planoDireto], pontos: pontosPadrao("Cidade Baixa", 60), comissao: 5 },
  { n: 6, tenantId: PEDRA, nome: "Recanto da Tristeza", slug: "recanto-da-tristeza", bairro: "Tristeza", lat: -30.1095, lng: -51.254, ri: true, percentualObra: 100, aceitaPermuta: true, comodidades: ["piscina", "garagem", "churrasqueira", "playground", "pet_place"], status: "pronto", dataLancamento: "2022-05-01", dataEntrega: "2024-11-30", tipologias: [[3, 1, 2, 110, 820000, 4], [4, 2, 2, 140, 1100000, 2]], planos: [planoFinanciado, planoSemParcelas], pontos: pontosPadrao("Tristeza", 400), comissao: 4 },

  // ---- Casos de exclusão ----
  { n: 7, tenantId: HORIZONTE, nome: "Torre Partenon Sem Registro", slug: "torre-partenon-sem-registro", bairro: "Partenon", lat: -30.059, lng: -51.172, ri: false, publicacao: "rascunho", curadoriaAprovada: false, percentualObra: 10, aceitaPermuta: false, comodidades: ["garagem"], status: "na_planta", dataLancamento: "2026-01-15", dataEntrega: "2029-06-30", tipologias: [[2, 1, 1, 60, 450000, 4]], planos: [planoDireto], pontos: pontosPadrao("Partenon", 100), comissao: 4 },
  { n: 8, tenantId: VALE, nome: "Jardim Botânico Esgotado", slug: "jardim-botanico-esgotado", bairro: "Jardim Botânico", lat: -30.053, lng: -51.176, ri: true, percentualObra: 100, aceitaPermuta: false, comodidades: ["garagem", "portaria_24h"], status: "vendido_100", dataLancamento: "2021-04-01", dataEntrega: "2023-10-01", tipologias: [[2, 1, 1, 65, 520000, 4]], todasVendidas: true, planos: [planoFinanciado], pontos: pontosPadrao("Jardim Botânico", 120), comissao: 4 },
  { n: 9, tenantId: PEDRA, nome: "Três Figueiras Pré-lançamento", slug: "tres-figueiras-pre-lancamento", bairro: "Três Figueiras", lat: -30.034, lng: -51.169, ri: true, percentualObra: 0, aceitaPermuta: false, comodidades: ["piscina", "academia"], status: "na_planta", dataLancamento: "2030-03-01", dataEntrega: "2033-03-01", tipologias: [[3, 2, 2, 120, 1300000, 4]], planos: [planoDireto], pontos: pontosPadrao("Três Figueiras", 200), comissao: 4 },
  { n: 10, tenantId: HORIZONTE, nome: "Auxiliadora Exclusivo House", slug: "auxiliadora-exclusivo-house", bairro: "Auxiliadora", lat: -30.0195, lng: -51.195, ri: true, visibilidade: "exclusivo", percentualObra: 60, aceitaPermuta: false, comodidades: ["garagem", "portaria_24h"], status: "em_obra", dataLancamento: "2025-01-10", dataEntrega: "2027-05-30", tipologias: [[2, 1, 1, 66, 640000, 4]], planos: [planoFinanciado], pontos: pontosPadrao("Auxiliadora", 90), comissao: 4 },
  { n: 11, tenantId: VALE, nome: "Rio Branco Não Listado", slug: "rio-branco-nao-listado", bairro: "Rio Branco", lat: -30.033, lng: -51.206, ri: true, visibilidade: "nao_listado", percentualObra: 70, aceitaPermuta: true, comodidades: ["piscina", "garagem"], status: "em_obra", dataLancamento: "2024-09-01", dataEntrega: "2027-02-28", tipologias: [[2, 1, 1, 72, 700000, 4]], planos: [planoDireto], pontos: pontosPadrao("Rio Branco", 110), comissao: 4 },
];

function construir() {
  const empreendimentos: Empreendimento[] = [];
  const comerciais: EmpreendimentoComercial[] = [];
  const subcondominios: Subcondominio[] = [];
  const tipologias: Tipologia[] = [];
  const unidades: Unidade[] = [];
  const planos: Plano[] = [];

  for (const d of DEFINICOES) {
    const empId = uid(P.emp, d.n);
    const subId = uid(P.sub, d.n * 10 + 1);
    empreendimentos.push({
      id: empId,
      slug: d.slug,
      tenantId: d.tenantId,
      nome: d.nome,
      cnpj: null,
      ri: d.ri
        ? { numero: `R.${d.n}-${String(40000 + d.n * 137).padStart(6, "0")} (exemplo)`, cartorio: "Registro de Imóveis Exemplo de Porto Alegre", dataRegistro: d.dataLancamento, patrimonioAfetacao: d.n % 2 === 1 }
        : null,
      tipo: "novo",
      visibilidade: d.visibilidade ?? "ativo",
      publicacao: d.publicacao ?? "publicado",
      curadoriaAprovada: d.curadoriaAprovada ?? true,
      preLancamentoAtivo: false,
      descricao: `Empreendimento fictício de exemplo no bairro ${d.bairro}, em Porto Alegre.`,
      videos: [],
      capaPath: null,
      mapaInterativoUrl: null,
      obraEtapas: [
        { nome: "Fundação", percentual: Math.min(100, d.percentualObra * 3) },
        { nome: "Estrutura", percentual: d.percentualObra },
        { nome: "Acabamento", percentual: Math.max(0, d.percentualObra - 40) },
      ],
      percentualObra: d.percentualObra,
      aceitaPermuta: d.aceitaPermuta,
      comodidades: d.comodidades,
      localizacao: { lat: d.lat, lng: d.lng },
      bairro: d.bairro,
      cidade: "Porto Alegre",
      uf: "RS",
      pontosProximos: d.pontos,
      espelhoAtualizadoEm: "2026-10-31T18:00:00-03:00",
      atualizadoEm: "2026-10-31T18:00:00-03:00",
      exemplo: true,
    });
    comerciais.push({ empreendimentoId: empId, comissaoPercentual: d.comissao, escritorio: "house", exemplo: true });
    subcondominios.push({
      id: subId,
      empreendimentoId: empId,
      nome: "Torre única",
      status: d.status,
      grupo: "residencial",
      pavimentos: 12,
      elevadores: 2,
      dataLancamento: d.dataLancamento,
      dataEntrega: d.dataEntrega,
      endereco: {
        cep: null,
        logradouro: `Rua Exemplo do ${d.bairro}`,
        numero: String(100 + d.n * 10),
        complemento: null,
        bairro: d.bairro,
        cidade: "Porto Alegre",
        uf: "RS",
        posicao: { lat: d.lat, lng: d.lng },
      },
      infraestrutura: d.comodidades ?? [],
      outrosItens: null,
      exemplo: true,
    });
    d.planos.forEach((p, i) => {
      planos.push({
        ...p,
        id: uid(P.plano, d.n * 10 + i + 1),
        empreendimentoId: empId,
        indiceCorrecao: "INCC",
        financiamento: { aceita: p.saldoPercentual > 0, momento: "chaves", percentualMaximo: 80, fgts: true, dacao: false, parcelamentoDireto: p.numeroParcelas !== null },
        exemplo: true,
      });
    });
    d.tipologias.forEach(([dormitorios, suites, vagas, area, precoBase, quantidade], t) => {
      const tipId = uid(P.tip, d.n * 10 + t + 1);
      tipologias.push({
        id: tipId,
        empreendimentoId: empId,
        nome: dormitorios === 0 ? "Studio compacto" : `${dormitorios} dormitórios final 0${t + 1}`,
        tipo: dormitorios === 0 ? "Studio" : "Apartamento",
        finalidade: "venda",
        plantaPath: null,
        dormitorios,
        suites,
        suitesMaster: suites > 0 ? 1 : 0,
        banheiros: Math.max(1, suites + 1),
        lavabos: dormitorios >= 3 ? 1 : 0,
        vagas,
        subcondominioIds: [subId],
        exemplo: true,
      });
      for (let u = 0; u < quantidade; u++) {
        const andar = 2 + u;
        // Padrão determinístico de status: a cada 4 unidades, 1 reservada e 1 vendida.
        const status: Unidade["status"] = d.todasVendidas ? "vendida" : u % 4 === 1 ? "vendida" : u % 4 === 3 ? "reservada" : "disponivel";
        unidades.push({
          id: uid(P.uni, d.n * 1000 + t * 100 + u + 1),
          empreendimentoId: empId,
          tipologiaId: tipId,
          subcondominioId: subId,
          identificador: `${andar}0${t + 1}`,
          areaPrivativa: area,
          preco: precoBase + u * 15000,
          status,
          exemplo: true,
        });
      }
    });
  }
  return { empreendimentos, comerciais, subcondominios, tipologias, unidades, planos };
}

export type Seed = {
  incorporadoras: Incorporadora[];
  contas: Conta[];
  comodidades: Comodidade[];
} & ReturnType<typeof construir>;

/** Gera o seed. Função pura: duas chamadas devolvem dados iguais. */
export function gerarSeed(): Seed {
  return { incorporadoras, contas, comodidades, ...construir() };
}

/** Slugs dos casos de exclusão, para testes. */
export const CASOS_EXCLUSAO = {
  semRI: "torre-partenon-sem-registro",
  esgotado: "jardim-botanico-esgotado",
  preLancamento: "tres-figueiras-pre-lancamento",
  exclusivo: "auxiliadora-exclusivo-house",
  naoListado: "rio-branco-nao-listado",
} as const;
