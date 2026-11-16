/**
 * Catálogo de textos fixos da interface (design D7). Toda string visível passa por aqui,
 * com chave estável, e é exibida por <T k="…"> ou texto("…"). Marcadores entre chaves
 * ({n}, {i}) são preenchidos pelo sistema, nunca pela IA.
 * Em runtime, o conteúdo editado pelo god mode (conteudo_textos) sobrepõe estes padrões.
 * Não escreva o nome da marca aqui: use config/brand.ts.
 */
export const ptBR = {
  // Navegação (seção 5)
  "nav.inicio": "Início",
  "nav.buscar": "Buscar Imóveis",
  "nav.mapa": "Mapa",
  "nav.favoritos": "Favoritos",
  "nav.conta": "Minha conta",
  "nav.rotulo": "Navegação principal",
  "layout.pular": "Pular para o conteúdo",
  "rodape.dados_exemplo": "Todos os dados exibidos são fictícios, de exemplo.",

  // Erro na raiz do app (global-error)
  "erro.titulo": "Algo deu errado.",
  "erro.texto": "Tente de novo em alguns instantes. Se continuar, volte mais tarde.",
  "erro.tentar": "Tentar de novo",

  // Textos de referência (seção 5) e fechamento do início (seção 12)
  "home.hero.morar": "O lar que cabe na sua vida. A gente analisa, você só visita.",
  "home.hero.investir": "Só o que passou na nossa análise. Com os números na mesa.",
  "home.relief": "Sem decorado perdido. Sem conta escondida. Sem pressão de vendedor.",
  "home.fechamento": "MIRAR NO AGORA PRA CHEGAR LONGE.",
  "quiz.counter": "{n} empreendimentos",
  "quiz.counter.one": "{n} empreendimento",
  "quiz.progress": "Pergunta {i} de {total}",
  "quiz.almost": "Restam {n} empreendimentos no seu perfil. Falta pouco.",
  "quiz.analyzing": "Analisando os {n} empreendimentos do seu perfil…",
  "quiz.contact": "Seus imóveis estão prontos. Para onde enviamos?",
  "quiz.option.none": "nenhum no momento",
  "quiz.widen": "Poucas opções com esse filtro. Quer incluir bairros vizinhos?",
  "result.why": "Por que estou vendo isso?",

  // Motivo por template (seção 5 "Motivo"). Só o padrão vem literal da especificação; os demais
  // são propostos. Todo marcador é preenchido pelo sistema; marcador sem valor tira a frase inteira.
  "motivo.padrao": "{nome} fica em {bairro} e tem unidade disponível no seu perfil.",
  "motivo.financeiro": "A entrada de {entrada} cabe no que você informou.",
  "motivo.tipologia.one": "Tem {n} unidade disponível com os quartos que você quer.",
  "motivo.tipologia": "Tem {n} unidades disponíveis com os quartos que você quer.",
  "motivo.localizacao.regiao": "Fica em {bairro}, na região que você escolheu.",
  "motivo.localizacao.pontos": "Fica a {minutos} min a pé de {ponto}.",
  "motivo.requisitos": "Tem {atendidos} de {pedidos} itens que você pediu.",
  "motivo.comportamento": "Combina com o que você já viu e favoritou.",
  "map.geo.ask": "Quer ver os lançamentos perto de você? Usamos sua localização só para centralizar o mapa.",
  "map.empty": "Ainda não temos lançamentos aqui. Quer ser avisado quando chegar?",
  "map.alert": "Me avise de novos lançamentos nesta área",
  "map.filters.cta": "Ver {n} empreendimentos",
  "project.costs.title": "Quanto você paga de verdade, mês a mês",
  "project.projection.disclaimer": "Projeção calculada em {data} com {indicadores}. Não é garantia.",
  "visit.confirmed": "Pronto! {dia}, {hora}, você conhece o seu possível novo lar. {gerente} te espera.",
  "favorites.empty": "Toque no coração para acompanhar um imóvel. A gente avisa quando algo mudar.",
} as const;

export type ChaveTexto = keyof typeof ptBR;
export type Variaveis = Record<string, string | number>;
export type Sobreposicoes = Partial<Record<ChaveTexto, string>>;

export function interpolar(modelo: string, vars?: Variaveis): string {
  if (!vars) return modelo;
  return modelo.replace(/\{(\w+)\}/g, (marcador, nome: string) =>
    nome in vars ? String(vars[nome]) : marcador,
  );
}

/** Texto do catálogo para atributos (aria-label, alt, title, placeholder) e código fora de JSX. */
export function texto(k: ChaveTexto, vars?: Variaveis, sobreposicoes?: Sobreposicoes): string {
  return interpolar(sobreposicoes?.[k] ?? ptBR[k], vars);
}
