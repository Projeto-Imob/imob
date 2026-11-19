# Busca: questionário, contagem, nota, escolha e motivo

> **Origem:** SPEC 1.0, §5 (Questionário Buscar Imóveis e Regras de cálculo) — texto da 1.0 preservado abaixo, só convertido para Markdown.
> **Fase na SPEC 2.0:** v1. A IA (extração de requisitos e motivo) fica desligada até a fase 3 (C2).

### Esclarecimentos e mudanças da 2.0

Aprovados pelo Matheus em 13/11/2026 (decisões em `docs/PLANO.md`).

- Pré-lançamento por subcondomínio: unidade de subcondomínio com lançamento futuro ou sem data fica fora da busca enquanto o pré-lançamento estiver desligado (hoje só sai quando todos os subcondomínios estão no futuro — achado da auditoria).
- Studio: tipologia residencial do tipo "Studio" ou "Loft" (o Loft foi decidido pelo Matheus em 14/11/2026; Kitnet continua fora até decisão em contrário). Tipologias comerciais e de terreno e a finalidade "Aluguel" ficam fora da busca de compra.
- Nota: soma exata (sem erro de ponto flutuante) e arredondamento para inteiro; o corte de 50 e a janela de 15 valem sobre a nota inteira exibida.
- Localização: "pontos" usa o ponto mais próximo de cada categoria (escola, parque, hospital, academia) cadastrado no empreendimento.
- Comportamento: fica fora da conta quando a pessoa não tem nenhuma abertura nem favorito em nenhum empreendimento.
- Sem nenhum componente com dado, a nota é nula e a opção não entra; o resultado diz que não há opção acima da nota mínima.
- Motivo fiel ao que a pessoa fez: entrada só se ela informou entrada; "região que você escolheu" só para bairro escolhido; "favoritou" só com favorito.
- Ampliar região não é oferecido quando a região é só "Perto de mim".
- Contagem no banco sem PostGIS na v1: latitude e longitude com caixa delimitadora e Haversine em SQL. Paridade TS × SQL obrigatória no CI.
- IA, quando ligada: teto de chamadas por dia e por pessoa no código, além do tempo limite de 5 s e do cache.

---

## Questionário Buscar Imóveis

Perguntas num schema declarativo (id, título, tipo, opções, efeito, contagem por opção, combinação, dependência, toFilter, toWeight), editável sem mexer em componente.

Uma pergunta por tela, botões de pelo menos 44 × 44 px e botão voltar. Sem tela de introdução.

Cabeçalho fixo com o contador ao vivo ("{n} empreendimentos", aria-live="polite") e "Pergunta {i} de {total}". O contador anima em cerca de 400 ms até o novo número, sem animação com prefers-reduced-motion.

Contagem por opção nas perguntas marcadas. A opção que levaria a zero fica desabilitada, com "nenhum no momento".

Com menos de 3 no conjunto, sugestão de ampliar, que relaxa o último filtro.

O progresso é salvo a cada resposta e retomado ao voltar.

No fim, tela "Analisando os {n} empreendimentos do seu perfil…", de 2 a 4 s, cancelável.

O contato (nome e WhatsApp) é pedido só no fim: "Seus imóveis estão prontos. Para onde enviamos?", com o opt-in de WhatsApp numa caixa separada e desmarcada.

| # | id | Pergunta | Tipo | Opções | Efeito |
| --- | --- | --- | --- | --- | --- |
| 1 | modo | Você quer comprar para morar ou para investir? | Única | Para morar; Para investir | Define o modo, não reduz |
| 2 | prazo | Quer receber o imóvel agora ou pode esperar a obra? | Única | Quero receber agora; Posso esperar a obra | "Agora" deixa só pronto para morar |
| 3 | quartos | Quantos quartos? | Múltipla | Studio; 1; 2; 3; 4 ou mais | Unidade disponível com aqueles quartos |
| 4 | regiao | Em quais bairros ou regiões? | Múltipla | Bairros da base, mais "Perto de mim" (raio de 5 km, posição só na sessão) | Bairro ou raio |
| 5 | pagamento | Como pretende pagar? | Formas e valores | À vista; Financiamento bancário; Direto com a construtora; Usar FGTS. Campos opcionais: entrada (R$) e quanto cabe por mês (R$) | Entrada e parcela compatíveis |
| 6 | permuta | Tem um imóvel para dar como parte do pagamento? | Única | Sim; Não | Com "sim", só quem aceita permuta |
| 7 | requisitos | O que não pode faltar? | Chips e texto livre, opcional | Piscina; Garagem; Portaria 24h; Churrasqueira; Academia | Chips filtram (precisa ter todos); o texto livre só pesa na nota |
| 8 | decisao | Em quanto tempo quer decidir? | Única | Em até 1 mês; 3 meses; 6 meses; Sem pressa | Só registra; serve à frequência de alertas |
| 9a | primeiro_investimento | É o seu primeiro investimento em imóvel? | Única, só no modo Investir | Sim; Não | Só registra |
| 9b | foco | O que você busca com o investimento? | Única, só no modo Investir | Renda de aluguel; Valorização; Os dois | Só registra; nunca pontua |

Texto livre dos requisitos: a IA só transforma o texto numa lista. A nota compara essa lista com as comodidades cadastradas, sem IA. O texto original vai também para o analista. Com a IA desligada, o texto é lido por palavras-chave do catálogo de comodidades.

## Regras de cálculo

Os parâmetros marcados Proposta ficam num arquivo de configuração (scoring.config.ts) e esperam a validação de Matheus [NEEDS CLARIFICATION: C14].

#### Base e filtros

| Regra | Definição |
| --- | --- |
| Base elegível | Publicado, aprovado pela curadoria, com R.I., fora de esgotado, pré-lançamento, rascunho, "exclusivo" e "não listado". Com campanha, só a incorporadora da campanha |
| Pronto para morar | Status de obra "pronto" ou entrega já vencida |
| Região | Bairro escolhido, ou vizinho acrescentado, ou dentro do raio de "Perto de mim" (5 km, Proposta). Sem região escolhida, não filtra |
| Permuta | Com "sim", só quem aceita permuta |
| Comodidades | Precisa ter todas as marcadas; só filtra quem tem o dado cadastrado |
| Unidade compatível | Disponível e com os quartos escolhidos (4 vale para 4 ou mais) |
| Exigência por plano | Entrada = preço × sinal%. Parcela = preço × mensais% ÷ número de parcelas; sem o número de parcelas, a parcela é nula. Só "À vista" marcado, ou sem planos: a entrada é o preço inteiro. Cabe quando a entrada exigida ≤ entrada informada e, havendo parcela máxima, a parcela existe e é ≤ a ela. A melhor exigência é a de menor entrada; no empate, a de menor preço |

#### Contagem e ampliação

Em perguntas de combinação "ou", a contagem por opção considera só aquela opção. Em "e" (requisitos), soma a opção às já marcadas. "Perto de mim" sem posição não é contado.

Ampliar: na região, inclui bairros da base a até 3,5 km de algum empreendimento dos bairros escolhidos (Proposta). Nas outras perguntas, deixa o filtro de lado: prazo vira "posso esperar", quartos fica vazio, pagamento perde os valores, permuta vira "não" e requisitos fica sem chips.

No banco, a contagem é por função SQL, em menos de 300 ms, com debounce de 150 ms e cache em memória por hash dos filtros.

Nota (0 a 100): determinística, calculada no código ou no banco, nunca pela IA.

| Componente | Peso | Cálculo | Fora da conta quando |
| --- | --- | --- | --- |
| Financeiro | 0,35 | Média de (1 − 0,5 × entrada exigida ÷ entrada informada) e (1 − 0,5 × parcela ÷ parcela máxima), +0,1 se a pessoa tem permuta e o empreendimento aceita. Limite 0 a 1 (Proposta) | Não informou entrada nem parcela |
| Tipologia | 0,25 | Unidades compatíveis ÷ 6, até 1 (Proposta) | Não escolheu quartos |
| Localização | 0,20 | Região: 1 no bairro escolhido, 0,6 no vizinho, ou 1 − distância ÷ raio em "Perto de mim". Pontos (escola, parque, hospital, academia): cada um 1 − metros ÷ 2.000, em média. Com os dois: 0,6 região + 0,4 pontos (Proposta) | Sem região e sem pontos |
| Requisitos | 0,10 | Atendidos ÷ pedidos (chips + itens do texto livre) | Nenhum requisito pedido |
| Comportamento | 0,10 | (aberturas + 2 × favoritos do empreendimento) ÷ 4, até 1 (Proposta) | Sem histórico |

Nota final = média ponderada só dos componentes com dado, com os pesos reponderados.

Escolha: só entram opções com nota ≥ 50 (Proposta). Vão as 2 melhores; a terceira só se estiver a até 15 pontos da primeira (Proposta). Sem opção acima da nota mínima, o sistema diz isso em vez de forçar uma indicação.

Motivo: até 140 caracteres. Sem IA, vem de templates: usa o componente de maior peso × nota e junta o segundo, se couber. Marcador sem valor tira a frase inteira. Sem componente com dado: "{nome} fica em {bairro} e tem unidade disponível no seu perfil."

Propostas da fatia 0.5a (esperam a validação de Matheus [NEEDS CLARIFICATION: C14]):
- Kitnet e outras tipologias residenciais sem dormitório que não sejam Studio ou Loft só entram quando a pessoa não filtra quartos.
- O meio ponto da nota arredonda para cima (57,5 vira 58; 49,5 vira 50 e entra no corte). A conta é em inteiros: pesos × 100 e componentes em 4 casas (`arredondamentoNota` em `config/scoring.config.ts`).
- Textos novos do motivo, conforme o que a pessoa informou: "A parcela de {parcela} cabe no que você informou." (só parcela máxima); "Fica em {bairro}, vizinho aos bairros que você escolheu."; "Fica em {bairro}, perto de você."; "Você já viu este empreendimento."; "Você favoritou este empreendimento.".

IA (Claude): chamada só por rota de servidor, com a chave em .env.local. Faz duas coisas: (a) transforma o texto livre numa lista de requisitos em JSON; (b) escreve o motivo de cada opção, recebendo só campos do cadastro, com marcadores no lugar dos números. Se falhar ou passar de 5 s, vale o template. O motivo fica em cache por perfil + empreendimento + data de atualização do empreendimento. Fica desligada até Matheus escolher o modelo [NEEDS CLARIFICATION: C2].

O resultado é gravado, com nota, componentes e motivo, para auditoria e para "Por que estou vendo isso?".
