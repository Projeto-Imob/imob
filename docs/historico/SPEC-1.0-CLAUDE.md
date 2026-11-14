Projeto Imob: especificação consolidada
1. O produto
O que é: um ecossistema de geração de demanda para lançamentos imobiliários. A incorporadora (ou construtora, que é o mesmo perfil) vende direto ao comprador e ao investidor, que são atendidos pela house de vendas interna da plataforma.
Nome: ainda não existe. "Imob" é o nome de trabalho nos documentos e "Vieza" é provisório na interface. Centralize nome e logotipo num único arquivo de configuração (config/brand.ts) e evite o nome em textos da interface, para a troca ser simples.
Praça: o MVP atende poucas incorporadoras numa única praça. Cliente e praça reais ainda não existem (P5). A praça fictícia do protótipo é Porto Alegre.
Posicionamento: plataforma e ecossistema, não corretor autônomo nem imobiliária B2C.
Por quê: encurtar o ciclo de vendas, gerar demanda qualificada e controlada e levar mais gente à visita.
Referências de fluxo (benchmarks):

Referência	O que se aproveita
QuintoAndar	O comprador navega sem barreira de conta e vai direto à visita
Reelly	Escritório de vendas com nome, cargo, empresa, WhatsApp, e-mail e telefone; estrutura de dados do empreendimento
Bloco	Fluxo do cadastro de empreendimento em 4 etapas
Órulo e Netspaces	Mercado: Órulo é só hub; Netspaces é concorrente direta. O diferencial é a engenharia de demanda somada ao comercial próprio
Nunca copie marca, textos, listas, imagens ou ativos dessas referências. Use só o padrão de fluxo.

Dois produtos separados
Produto	O que é	Indicadores
Plataforma	Comprador e investidor usam de graça: buscam, respondem ao questionário, recebem de 2 a 3 opções e agendam visita. A house atende	VGV, leads direcionados, compatibilidade média e conversão lead → visita → proposta → contrato
Projeto de mídia (contratado à parte)	A incorporadora entrega a verba, e a Imob opera as campanhas. Os leads são exclusivos dela, atendidos pela equipe de vendas dela ou pela house	Verba, gasto, saldo, CPL, CAC, ROI por canal, leads por R$ 1.000 e curva de conversão por campanha
Tudo do projeto de mídia só aparece para a equipe da plataforma e para a incorporadora que contratou.

Visão total do produto (contexto, não é escopo inteiro do MVP)
Gestão do investimento de mídia da construtora: criativos estáticos e em vídeo, mídia paga, funil e indicadores. O lead é da construtora.
House de vendas: o comprador/investidor passa por uma triagem em nossa plataforma, respondendo um questionário bem extenso de perguntas qualificatórias, onde direcionamos para o imóvel ideal. O objetivo final é conectar o comprador diretamente com a incorporadora.
Incorporadora direto com o cliente, no modelo QuintoAndar.
Metas de VGV
Período	VGV
Por mês, no ano 1	R$ 2 milhões
Ano 1	R$ 24 milhões
Ano 2	R$ 48 milhões
Ano 3	R$ 100 milhões
Ano 4	R$ 250 milhões
Ano 5	R$ 500 milhões
VGV não é receita da Imob. A comissão é negociada com cada incorporadora e registrada em campo editável.

2. Regras inegociáveis
Valem sobre qualquer outra instrução, prompt ou decisão de feature.

#	Regra
1	R.I. obrigatório: sem registro de incorporação, nada é publicado, anunciado, negociado, reservado ou vendido, nem entra em mídia paga, contador, resultado, mapa ou alerta (Lei 4.591/64, arts. 32 e 66). Vale até para o god mode
2	Imparcialidade da busca: Vitrine Destacada, pagamento de cliente, comissão, verba, nome da incorporadora e destaque nunca entram na nota nem na ordem. O patrocinado é só destaque visual, com selo. No empate, a ordem vem de um sorteio fixo, derivado do perfil e do empreendimento, para não favorecer sempre o mesmo
3	Sem indicadores de mercado (P8): nada de vacância, cap rate projetado, GRM, Selic, IPCA, IGP-M, aluguel estimado ou índice de terceiros, nem na IA, nem no simulador, nem na interface. Cap rate só aparece com o aluguel que a própria pessoa digita
4	A IA nunca gera número nem promessa. Ela usa só dados cadastrados e respostas da pessoa. Todo valor é interpolado pelo sistema depois
5	Contato liberado só com interesse confirmado: a incorporadora só vê nome e contato do comprador depois de visita agendada, contato direto ou proposta num empreendimento dela, e com consentimento ativo. Antes, vê só números agregados de acessos e interações. A liberação vale por empreendimento. Revogar o consentimento encerra o acesso
6	Lead de campanha (com utm de campanha) só vê e recebe opções da incorporadora da campanha
7	O comprador nunca vê comissão, fluxo de pagamento da comissão, contrato de terceiros nem contato interno
8	Sem CRECI da plataforma no rodapé, nos dados legais ou em qualquer tela, até a venda começar de fato. O CRECI é só um campo opcional da equipe de vendas
9	LGPD: finalidade, consentimento, registro de tratamento e atendimento ao titular. Opt-ins separados e desmarcados (WhatsApp; compartilhar com a incorporadora). A posição exata nunca é guardada sem consentimento. Textos legais versionados: quem aceitou antes continua com a versão que aceitou
10	Escassez ("Restam X") só com dado do espelho de vendas atualizado há menos de 24 h
11	Pré-lançamento em stand-by: fica no sistema, desligado (pre_lancamento_ativo = false), fora de toda a interface do comprador e da busca. Só sai do stand-by com consentimento total da incorporadora parceira. Não apague
12	God mode só lê dado de cliente (R63): não cria, edita nem exclui nada de incorporadoras, house, compradores ou investidores, nem em impersonate. Navegar como cliente não soma acesso, clique, evento nem última visita
13	Só o god mode escreve o conteúdo da plataforma (R64), com MFA e histórico. Todo texto novo de tela passa pelo catálogo editável
14	Isolamento: cada incorporadora vê só os próprios dados. Uma incorporadora nunca vê a etapa, a visita, a proposta ou as opções que o comprador tem com outra
15	Marca: o lima nunca é texto, ícone, linha ou marca de gráfico sobre fundo claro
16	Dados: só fictícios, marcados como exemplo. Nenhum dado real
17	Segredos: nunca peça, mostre ou grave segredo na conversa. Matheus preenche .env.local e os secrets do GitHub. Nenhum segredo com prefixo NEXT_PUBLIC_. Nunca versione .env*, exceto .env.example. Nenhuma chave de IA no navegador. Rode npm run check:secrets antes de cada commit
18	Custo: nenhum custo acima de zero sem aprovação de Matheus. Serviço externo gratuito também precisa do OK dele antes do primeiro uso
19	Não existem no produto: corretor, imobiliária, parceria, anúncio de corretor, link rastreado de corretor e o nome "JulI.A". Não os reintroduza. Um teste deve falhar se corretor, broker, parceria, imobiliaria (como perfil) ou JulI.A aparecerem no código
20	Desligar em vez de apagar: quando a decisão for "agora não", desligue a funcionalidade em vez de removê-la. A única exceção é o corretor e a imobiliária, removidos por decisão de Matheus
Palavras proibidas na interface: "oportunidade imperdível", "garantido", "lucro certo" e "últimas unidades" sem dado do espelho. Nunca prometa valorização.

3. Perfis, tenants e papéis
Perfis
Perfil	Papel no negócio	Paga?
Incorporadora ou construtora	Cliente: negocia a comissão, cadastra e edita os próprios empreendimentos, acompanha indicadores, tem CRM. Quem contrata o projeto de mídia tem essa área	A combinar (P6)
House de vendas (interna)	Analista de vendas: qualifica o lead e garante a visita. Gerente de contas: cuida da carteira de incorporadoras e aparece no escritório de vendas quando a house atende	Não se aplica
Comprador ou investidor	Busca imóveis, responde ao questionário, favorita, agenda visita, fala com o gerente e envia proposta	Não
Equipe da plataforma	Opera mídia, cadastro, curadoria, vendas e administração	Não se aplica
God mode	Só Matheus Pacheco, conta única	Não se aplica
Tenants
incorporadora (inclui construtora) e plataforma. Situação do tenant: implantacao, ativo, suspenso ou encerrado. Equipe da plataforma e buyer têm tenant_id nulo.

Papéis
Papel	Quem é
anon	Visitante sem conta
buyer	Comprador ou investidor
client_superadmin	Dono da conta da incorporadora
client_manager	Gerente de produtos da incorporadora: edita os próprios empreendimentos e o espelho, exceto R.I. e comissão
sales_member	Plantão (equipe de vendas) da incorporadora
internal_seller	Analista de vendas da house
internal_account_manager	Gerente de contas da house
internal_admin	Equipe da plataforma: operação, cadastro, mídia, curadoria, distribuição, conferência de vendas e suporte
internal_superadmin	Sócios: criar, suspender e encerrar tenants, papéis internos, produtos do tenant e liberar pré-lançamento
god_mode	Matheus, conta única
Regras de papel:

Nenhuma tela ou API cria god_mode. A conta entra por um script de bootstrap rodado por Matheus, sem e-mail nem senha versionados. Um índice único parcial impede uma segunda conta.
god_mode e todos os papéis internos exigem MFA (sessão com segundo fator TOTP verificado pelo Better Auth), porque veem contato de comprador de vários tenants.
Ninguém concede papel igual ou superior ao próprio, muda o próprio papel ou remove o último client_superadmin de um tenant. Aplique no banco.
O cadastro público só cria buyer. Os demais entram por convite.
Ao desligar alguém da house, desative a conta e passe leads e histórico a outra pessoa da house, ou devolva à fila.
Exclusão de cliente = desativação e anonimização dos dados pessoais, mantendo registros financeiros, com permissão restrita.
Matriz de visibilidade
Dado	Comprador	House de vendas	Incorporadora	Equipe da plataforma
Nome da incorporadora	Sim	Sim	Sim	Sim
Comissão do lançamento	Não	Sim, fora do modo cliente	Só nos próprios	Sim
Proposta e contrato	Só os próprios	Só os que negocia	Só nos seus empreendimentos	Sim
Dados do lead, incluindo o nome	Só os próprios	Os que atende, a fila sem responsável e os próprios	Mídia: os das suas campanhas. Plataforma: só depois de visita, contato direto ou proposta, somente leitura. Nunca as opções de concorrentes nem lead próprio da house	Sim, menos lead próprio
Contato do lead	Só o próprio	Nos mesmos casos, com consentimento ativo	Nos mesmos casos, com consentimento ativo	Sim, com consentimento ativo, menos lead próprio
Acessos, interações e cliques no mapa	Não [NEEDS CLARIFICATION: C4]	Não; no Mais Buscados, só a ordem	Dos próprios empreendimentos, só números	Sim
Quem visualizou um empreendimento	Não	Não	Nunca: só números	Sim
Verba e indicadores de mídia	Não	Não	Só a própria, se contratou	Sim
Equipe de vendas da incorporadora	Não	Não	A própria	Sim
Material comercial e contato do plantão	Não	Sim, fora do modo cliente	Os próprios	Sim
Conteúdo da plataforma (textos, imagens, personalização)	Lê	Lê	Lê	Lê; só o god mode escreve
4. Jornada principal
A equipe cadastra o empreendimento (ou a incorporadora cadastra), com R.I., e a comissão é negociada e registrada.
O comprador entra por Buscar Imóveis (questionário com contagem ao vivo) ou pelo Mapa, sem precisar de conta.
O sistema mostra de 2 a 3 opções, com nota e motivo, usando só os dados cadastrados e as respostas.
O comprador agenda a visita (3 toques) ou fala com o gerente (WhatsApp, e-mail ou telefone). O login é pedido só neste momento de valor.
A analista da house recebe o lead, qualifica e garante a visita. A visita agendada libera nome e contato só à incorporadora daquele empreendimento.
Depois da visita, a analista passa ao gerente de produtos da incorporadora. Sem venda, oferece produtos semelhantes; a outra incorporadora só recebe o contato quando o comprador confirmar interesse nela.
Proposta, reserva e contrato passam pelo sistema. A venda atualiza o espelho de unidades, a comissão e os dashboards.
Lead de mídia: quem chega por campanha faz o mesmo questionário, só vê a incorporadora da campanha e é atendido pela equipe de vendas dela ou pela house.

Lead do questionário sem conta: nome e WhatsApp deixados no fim criam o lead na fila da house, em rodízio. A incorporadora continua sem ver nome e contato até a visita.

5. Interface do comprador
Navegação
Cinco áreas, numa barra inferior fixa no celular e num menu superior fixo no desktop:

Área	Rota
Início	/
Buscar Imóveis	/buscar-imoveis e /buscar-imoveis/resultado
Mapa	/mapa
Favoritos	/favoritos
Minha conta	/conta/*
Rotas transversais: /empreendimento/{slug} e /empreendimento/{slug}/agendar.

De qualquer tela, "Agendar visita" e "Falar com o gerente" ficam a no máximo 2 toques.
O estado dos filtros e do modo fica na URL, para compartilhar e voltar.
Login só para: favoritar, agendar visita, criar alerta, enviar proposta e acessar o painel. Navegar, responder, ver resultado e usar o mapa são livres.
Modo Morar/Investir
Modo global morar ou investir, definido pela primeira pergunta do questionário e alterável por um seletor no topo. Fica no perfil, com conta, ou no navegador, sem conta.
O modo não esconde dado: muda a ordem dos blocos, os destaques, os textos e a cor de apoio.
Card: Morar destaca entrada, parcela mensal, quartos e distância da escola. Investir destaca preço/m², custo total, entrega e plano de pagamento.
CTA principal: Morar, "Agendar visita". Investir, "Ver análise completa" e depois "Agendar visita".
Cores de apoio: uma quente para Morar e uma fria para Investir, com contraste AA medido [NEEDS CLARIFICATION: C1].
Questionário Buscar Imóveis
Perguntas num schema declarativo (id, título, tipo, opções, efeito, contagem por opção, combinação, dependência, toFilter, toWeight), editável sem mexer em componente.
Uma pergunta por tela, botões de pelo menos 44 × 44 px e botão voltar. Sem tela de introdução.
Cabeçalho fixo com o contador ao vivo ("{n} empreendimentos", aria-live="polite") e "Pergunta {i} de {total}". O contador anima em cerca de 400 ms até o novo número, sem animação com prefers-reduced-motion.
Contagem por opção nas perguntas marcadas. A opção que levaria a zero fica desabilitada, com "nenhum no momento".
Com menos de 3 no conjunto, sugestão de ampliar, que relaxa o último filtro.
O progresso é salvo a cada resposta e retomado ao voltar.
No fim, tela "Analisando os {n} empreendimentos do seu perfil…", de 2 a 4 s, cancelável.
O contato (nome e WhatsApp) é pedido só no fim: "Seus imóveis estão prontos. Para onde enviamos?", com o opt-in de WhatsApp numa caixa separada e desmarcada.
#	id	Pergunta	Tipo	Opções	Efeito
1	modo	Você quer comprar para morar ou para investir?	Única	Para morar; Para investir	Define o modo, não reduz
2	prazo	Quer receber o imóvel agora ou pode esperar a obra?	Única	Quero receber agora; Posso esperar a obra	"Agora" deixa só pronto para morar
3	quartos	Quantos quartos?	Múltipla	Studio; 1; 2; 3; 4 ou mais	Unidade disponível com aqueles quartos
4	regiao	Em quais bairros ou regiões?	Múltipla	Bairros da base, mais "Perto de mim" (raio de 5 km, posição só na sessão)	Bairro ou raio
5	pagamento	Como pretende pagar?	Formas e valores	À vista; Financiamento bancário; Direto com a construtora; Usar FGTS. Campos opcionais: entrada (R$) e quanto cabe por mês (R$)	Entrada e parcela compatíveis
6	permuta	Tem um imóvel para dar como parte do pagamento?	Única	Sim; Não	Com "sim", só quem aceita permuta
7	requisitos	O que não pode faltar?	Chips e texto livre, opcional	Piscina; Garagem; Portaria 24h; Churrasqueira; Academia	Chips filtram (precisa ter todos); o texto livre só pesa na nota
8	decisao	Em quanto tempo quer decidir?	Única	Em até 1 mês; 3 meses; 6 meses; Sem pressa	Só registra; serve à frequência de alertas
9a	primeiro_investimento	É o seu primeiro investimento em imóvel?	Única, só no modo Investir	Sim; Não	Só registra
9b	foco	O que você busca com o investimento?	Única, só no modo Investir	Renda de aluguel; Valorização; Os dois	Só registra; nunca pontua
Texto livre dos requisitos: a IA só transforma o texto numa lista. A nota compara essa lista com as comodidades cadastradas, sem IA. O texto original vai também para o analista. Com a IA desligada, o texto é lido por palavras-chave do catálogo de comodidades.

Regras de cálculo
Os parâmetros marcados Proposta ficam num arquivo de configuração (scoring.config.ts) e esperam a validação de Matheus [NEEDS CLARIFICATION: C14].

Base e filtros

Regra	Definição
Base elegível	Publicado, aprovado pela curadoria, com R.I., fora de esgotado, pré-lançamento, rascunho, "exclusivo" e "não listado". Com campanha, só a incorporadora da campanha
Pronto para morar	Status de obra "pronto" ou entrega já vencida
Região	Bairro escolhido, ou vizinho acrescentado, ou dentro do raio de "Perto de mim" (5 km, Proposta). Sem região escolhida, não filtra
Permuta	Com "sim", só quem aceita permuta
Comodidades	Precisa ter todas as marcadas; só filtra quem tem o dado cadastrado
Unidade compatível	Disponível e com os quartos escolhidos (4 vale para 4 ou mais)
Exigência por plano	Entrada = preço × sinal%. Parcela = preço × mensais% ÷ número de parcelas; sem o número de parcelas, a parcela é nula. Só "À vista" marcado, ou sem planos: a entrada é o preço inteiro. Cabe quando a entrada exigida ≤ entrada informada e, havendo parcela máxima, a parcela existe e é ≤ a ela. A melhor exigência é a de menor entrada; no empate, a de menor preço
Contagem e ampliação

Em perguntas de combinação "ou", a contagem por opção considera só aquela opção. Em "e" (requisitos), soma a opção às já marcadas. "Perto de mim" sem posição não é contado.
Ampliar: na região, inclui bairros da base a até 3,5 km de algum empreendimento dos bairros escolhidos (Proposta). Nas outras perguntas, deixa o filtro de lado: prazo vira "posso esperar", quartos fica vazio, pagamento perde os valores, permuta vira "não" e requisitos fica sem chips.
No banco, a contagem é por função SQL, em menos de 300 ms, com debounce de 150 ms e cache em memória por hash dos filtros.
Nota (0 a 100): determinística, calculada no código ou no banco, nunca pela IA.

Componente	Peso	Cálculo	Fora da conta quando
Financeiro	0,35	Média de (1 − 0,5 × entrada exigida ÷ entrada informada) e (1 − 0,5 × parcela ÷ parcela máxima), +0,1 se a pessoa tem permuta e o empreendimento aceita. Limite 0 a 1 (Proposta)	Não informou entrada nem parcela
Tipologia	0,25	Unidades compatíveis ÷ 6, até 1 (Proposta)	Não escolheu quartos
Localização	0,20	Região: 1 no bairro escolhido, 0,6 no vizinho, ou 1 − distância ÷ raio em "Perto de mim". Pontos (escola, parque, hospital, academia): cada um 1 − metros ÷ 2.000, em média. Com os dois: 0,6 região + 0,4 pontos (Proposta)	Sem região e sem pontos
Requisitos	0,10	Atendidos ÷ pedidos (chips + itens do texto livre)	Nenhum requisito pedido
Comportamento	0,10	(aberturas + 2 × favoritos do empreendimento) ÷ 4, até 1 (Proposta)	Sem histórico
Nota final = média ponderada só dos componentes com dado, com os pesos reponderados.

Escolha: só entram opções com nota ≥ 50 (Proposta). Vão as 2 melhores; a terceira só se estiver a até 15 pontos da primeira (Proposta). Sem opção acima da nota mínima, o sistema diz isso em vez de forçar uma indicação.

Motivo: até 140 caracteres. Sem IA, vem de templates: usa o componente de maior peso × nota e junta o segundo, se couber. Marcador sem valor tira a frase inteira. Sem componente com dado: "{nome} fica em {bairro} e tem unidade disponível no seu perfil."

IA (Claude): chamada só por rota de servidor, com a chave em .env.local. Faz duas coisas: (a) transforma o texto livre numa lista de requisitos em JSON; (b) escreve o motivo de cada opção, recebendo só campos do cadastro, com marcadores no lugar dos números. Se falhar ou passar de 5 s, vale o template. O motivo fica em cache por perfil + empreendimento + data de atualização do empreendimento. Fica desligada até Matheus escolher o modelo [NEEDS CLARIFICATION: C2].

O resultado é gravado, com nota, componentes e motivo, para auditoria e para "Por que estou vendo isso?".

Resultado "Seus imóveis"
Resumo do perfil numa linha, com chips que voltam à pergunta correspondente.
De 2 a 3 cards: foto, nome, bairro, nota de 0 a 100, motivo, entrada mais parcela, selos, "Agendar visita" e "Ver detalhes".
"Por que estou vendo isso?" mostra cada componente com peso, nota, detalhe e o que ficou fora da conta.
"Ver no mapa" abre /mapa com os filtros do questionário.
Cartão do gerente: nome, foto, cargo, WhatsApp, e-mail e telefone.
Informe que as indicações vêm só dos empreendimentos da base da plataforma.
Página do empreendimento
Ordem no modo Morar:

Galeria e selos (capa, fotos, vídeos do YouTube, link do mapa interativo).
Resumo: nome, bairro, construtora, entrega, % de obra e status de vendas.
Barra fixa no celular, com a entrada e "Agendar visita".
Seus custos ("Quanto você paga de verdade, mês a mês"): sinal, mensais com o índice do plano (INCC), intercaladas, chaves, saldo, financiamento, ITBI e registro, marcados como estimativa [NEEDS CLARIFICATION: C7].
Plantas e unidades por tipologia: área privativa, preço e status. "Restam {x}" só com espelho atualizado há menos de 24 h.
Vizinhança: escola, parque, hospital, academia, mercado e transporte mais próximos, com ícone por categoria, nome, distância e tempo a pé (80 m/min). Uma frase resume ("Escola a 6 min a pé, parque a 10 min"). Vem do cadastro, sem serviço pago e sem IA.
Números do investimento permitidos (sem indicador de mercado).
Interesse no empreendimento [NEEDS CLARIFICATION: C4].
Comodidades.
Escritório de vendas.
Dados legais: número do R.I., cartório, data do registro e patrimônio de afetação. Sem CRECI.
Empreendimentos parecidos.
Modo Investir: números primeiro (preço/m², custo total, entrega e plano), depois custos, plano de pagamento, região e galeria. Projeção feita com dados da pessoa leva "Projeção", a data e "Não é garantia".

Regras da página:

O comprador vê preço, fluxo de pagamento de cada plano com valores calculados para a unidade escolhida, entrada mínima e regras de financiamento (se aceita, em que momento, % máximo, FGTS, dação e tipos, parcelamento direto).
Campo sem dado aparece como "Não informado".
Selo "Incorporação registrada" no card e na página.
"Perguntas para fazer na visita" não fica na página: vai para a confirmação da visita.
Coração para favoritar e "Adicionar à lista".
Escritório de vendas (modelo Reelly): nome, foto, cargo, experiência, [EMPRESA] e os botões WhatsApp (wa.me com mensagem pronta), e-mail (mailto) e telefone (tel). Em cada empreendimento, a incorporadora escolhe quem aparece: o plantão dela ou o gerente de contas da house. O padrão é a house. Se o primeiro clique de contato exige login, consentimento e cria o lead "Contato direto": [NEEDS CLARIFICATION: C3].

Proposta do comprador: unidade, valor, formas de pagamento, validade e consentimento, sem efeito jurídico. A incorporadora aceita, recusa com motivo ou faz contraproposta. Como o comprador envia: [NEEDS CLARIFICATION: C10].

Agendamento de visita
Três toques: dia, horário e confirmar, com os dados já preenchidos. Sem questionário.
Pede login rápido antes de confirmar e registra o consentimento de visita, com a versão do texto.
A visita vai para a fila do analista da house e libera nome e contato só à incorporadora daquele empreendimento.
A confirmação mostra endereço e mapa, o gerente, "o que levar", as perguntas para fazer na visita, "Adicionar ao calendário" (.ics) e o aviso de lembrete por WhatsApp (simulado).
Mapa (público)
Centro inicial, nesta ordem: (1) coordenadas da URL (lat, lng, z); (2) localização do navegador, depois de uma tela de explicação, com enableHighAccuracy: false, timeout: 5000, maximumAge: 600000; (3) cidade pelo IP, por função de servidor plugável; (4) Porto Alegre (lat −30,0346, lng −51,2177, zoom 11 a 12).
Posição exata nunca é guardada sem consentimento; para personalizar, no máximo a cidade.
Botão "Minha localização" e navegação livre pelo Brasil.
Busca por cidade, bairro ou nome, com sugestões agrupadas por tipo; sugestões por tipo, preço total ou por m², área, vagas, "Perto de mim" e "Buscar nesta área".
Agrupamentos com a quantidade; ao aproximar, pinos com o preço de entrada. Variações de pino: padrão, compatível com o perfil, patrocinado (cor diferente e estrela, sem prioridade) e visto.
Lista deslizante no celular (fechada, metade e cheia) e painel lateral no desktop, com os cards da área visível, atualizada com debounce de 300 ms. Alternância "Mostrar lista" / "Mostrar mapa".
Filtros com os campos do questionário e contagem ao vivo no botão "Ver {n} empreendimentos". Atalho "Usar meu perfil".
Toque no pino abre card rápido: foto, nome, entrada mais parcela, % de obra, coração e "Ver detalhes".
"Me avise de novos lançamentos nesta área" cria alerta de área com o recorte visível.
Área vazia: "Ainda não temos lançamentos aqui. Quer ser avisado quando chegar?", com alerta de área e o evento map_empty_area como sinal de demanda.
Início (home conforme o estado)
Função pura resolveHomeState escolhe o estado a partir de usuário, eventos, perfil, favoritos e visitas:

Estado	O que mostra
novo	Hero com a promessa do modo, "Descubra seu imóvel em 2 minutos", "Prefiro explorar no mapa" e seletor de modo; faixa de confiança (incorporação registrada, curadoria com IA e humana, atendimento com nome); "Como funciona" em 3 passos; destaques [NEEDS CLARIFICATION: C13]; indicadores dos bairros [NEEDS CLARIFICATION: C5]; prova social só com dado real [NEEDS CLARIFICATION: C6]; rodapé com privacidade, sem CRECI
navegou	"Continue de onde parou" e convite ao questionário
perfil e ativo	"Seus imóveis", "O que mudou nos seus favoritos" e "Novos no seu perfil"
negociando	Status da visita ou proposta e o gerente
Favoritos, listas, comparador e alertas
Coração em todo card e pino; favoritar pede login rápido, e o favorito é salvo depois dele. Depois de favoritar, convide a criar um alerta.
Listas: criar, renomear, excluir e mover entre listas.
Selo "Novidade" quando o empreendimento mudou desde a última visita da pessoa.
Comparador de até 3: custo total, entrega, m², distâncias e indicadores permitidos.
Alertas dos tipos perfil, favorito, área, preço e obra; empreendimento novo nas buscas salvas; nos favoritos, mudança de preço, unidade nova, disponibilidade e fase de venda. Canal (WhatsApp, e-mail ou push, simulados) e frequência. Marcar como visto, pausar e desligar.
Mudanças de preço, % de obra, status e unidades ficam registradas como mudança de cadastro (project_change), para os alertas e a home.
Painel do comprador (/conta)
Visitas e propostas enviadas, com status, próximo passo, contraproposta e cancelar.
Privacidade: consentimentos por empreendimento (com versão e data), revogar, baixar os dados em JSON, apagar o histórico, pausar alertas e excluir a conta com confirmação. A exclusão anonimiza os eventos e mantém os registros financeiros.
Configurações: perfil, mudar senha, refazer o questionário, modo padrão, notificações e localização.
Login e conta
Login rápido no momento de valor ("Continuar com seu e-mail" ou conta existente). E-mail e senha, com recuperação; Google só depois do registro completo.
merge_visitor: no login, o histórico anônimo e os favoritos locais passam para a conta.
Depois do login, a pessoa volta à tela de origem. O retorno só aceita caminho interno, para evitar redirecionamento aberto.
Eventos de uso
Gravados com um ID anônimo, sem IP e sem posição exata, com aviso curto no primeiro acesso:

quiz_start, quiz_answer (pergunta, valor, contagem antes e depois), quiz_option_disabled, quiz_widen_accepted, quiz_complete, contact_submitted, result_view, result_why_open, result_map_open, map_open (origem da posição: url, browser, ip, default), map_geo_permission, map_move, map_pin_click, map_empty_area, map_area_alert_created, project_view, costs_simulated, manager_contact (canal), visit_started, visit_scheduled, favorite_add, alert_created, mode_changed.

Textos de referência
Chave	Texto
home.hero.morar	O lar que cabe na sua vida. A gente analisa, você só visita.
home.hero.investir	Só o que passou na nossa análise. Com os números na mesa.
home.relief	Sem decorado perdido. Sem conta escondida. Sem pressão de vendedor.
quiz.counter	{n} empreendimentos
quiz.counter.one	{n} empreendimento
quiz.progress	Pergunta {i} de {total}
quiz.almost	Restam {n} empreendimentos no seu perfil. Falta pouco.
quiz.analyzing	Analisando os {n} empreendimentos do seu perfil…
quiz.contact	Seus imóveis estão prontos. Para onde enviamos?
quiz.option.none	nenhum no momento
quiz.widen	Poucas opções com esse filtro. Quer incluir bairros vizinhos?
result.why	Por que estou vendo isso?
map.geo.ask	Quer ver os lançamentos perto de você? Usamos sua localização só para centralizar o mapa.
map.empty	Ainda não temos lançamentos aqui. Quer ser avisado quando chegar?
map.alert	Me avise de novos lançamentos nesta área
map.filters.cta	Ver {n} empreendimentos
project.costs.title	Quanto você paga de verdade, mês a mês
project.projection.disclaimer	Projeção calculada em {data} com {indicadores}. Não é garantia.
visit.confirmed	Pronto! {dia}, {hora}, você conhece o seu possível novo lar. {gerente} te espera.
favorites.empty	Toque no coração para acompanhar um imóvel. A gente avisa quando algo mudar.
6. Empreendimentos
Dados
Ficha padronizada: nome, incorporadora (nome comercial e razão social), localização, tipologias, status de obra, status de venda, previsão de entrega, descrição, mídias e documentos.
Dados legais: número do R.I. ou matrícula, cartório, data do registro e patrimônio de afetação.
Espelho de unidades: disponível, reservada e vendida, atualizado pela equipe e pelo gerente da incorporadora. Toda mudança gera um movimento no histórico (só acrescenta linhas).
Planos de pagamento como dados: sinal, mensais (com número de parcelas), intercaladas, chaves, saldo e índice de correção.
Comissão de cada lançamento em campo editável. Só a equipe da plataforma altera R.I. e comissão depois de publicado.
Fase de venda calculada, sem campo próprio: data de lançamento futura = pré-lançamento (stand-by); todos os subcondomínios 100% vendidos = esgotado.
Finalidade "Aluguel" é salva e aparece na página; o fluxo de aluguel fica fora do MVP.
Cadastro em 4 etapas (fluxo da Bloco, com interface, textos e listas próprios)
Salva sozinho a cada mudança (debounce de 800 ms), com o indicador "Salvo" anunciado por aria-live.

Etapa 1. Empreendimento

Nome (obrigatório, mínimo 4 caracteres), CNPJ opcional (00.000.000/0000-00), registro de incorporação (opcional no cadastro, obrigatório para publicar).
Tipo: Novo ou Terceiro/Classificado. Visibilidade: Ativo; Não listado (salvo, fora da vitrine, abre por link para quem tem login); Exclusivo (visível só para a house, fora do mapa e da busca).
Descrição, vídeos (links do YouTube), foto de capa (JPG ou PNG, sugerido 1200 × 675 px), link do mapa interativo, andamento da obra (etapas com nome e %, botão "Adicionar etapa").
Etapa 2. Subcondomínios (torre, bloco ou fase; no mínimo 1)

Nome; status (Na planta, Em obra, Pronto, 100% vendido); grupo (Residencial; Loteamento ou condomínio horizontal; Comercial; Residencial e comercial); pavimentos; elevadores; datas de lançamento e entrega.
Endereço: CEP preenche o resto (ViaCEP, chamado pelo servidor, precisa do OK de Matheus); endereço e número obrigatórios; estado e cidade de um arquivo do IBGE versionado; bairro em texto com sugestão dos já cadastrados; complemento opcional; pin no mapa por clique ou arraste; "Localizar no mapa" centraliza na cidade, sem geocodificação.
Infraestrutura: caixas de marcar com busca e "Todos", em dois grupos (uso comum; infraestrutura e segurança), mais "Outros itens" em texto livre. O catálogo é próprio, editável pelo god mode, com cerca de 60 itens de uso comum e 40 de segurança.
Botão "Adicionar subcondomínio".
Etapa 3. Tipologias (painel lateral que salva sozinho)

Nome (ex.: "2 dormitórios final 01", "Garden").
Tipo — Residencial: Apartamento, Casa, Casa de condomínio, Casa em condomínio rural, Chácara, Cobertura, Duplex, Duplex garden, Fazenda, Flat, Garden, Kitnet, Loft, Mansão em condomínio fechado, Sobrado, Sobrado duplex, Sobrado triplex, Studio. Comercial: Box, Casa comercial, Conjunto comercial, Depósito, Galpão, Loja, Loja comercial, Loja shopping, Pavilhão, Prédio inteiro, Sala comercial, Sala comercial aérea, Sala comercial térrea. Terreno: Lote, Terreno, Terreno em condomínio, Terreno padrão.
Finalidade: Venda; Aluguel; Venda e/ou aluguel.
Planta baixa (upload); dormitórios, suítes, suítes master, banheiros, lavabos e vagas.
Subcondomínios que usam a tipologia: no mínimo 1. A área privativa não entra aqui (vai para a Tabela de vendas). Opção "Clonar existente".
Etapa 4. Revisar: resumo das etapas com "Editar" em cada bloco e o botão final "Ir para empreendimentos".

Abas depois do cadastro: Tabela de vendas (unidades, área privativa, preço e status), Condições comerciais (planos, entrada e financiamento), Comissão, Localização (pontos próximos com categoria e distância) e Equipe de vendas.

Mídias
Imagens: só JPG, PNG e WebP, até 10 MB. Sem SVG de upload.
Vídeos: só links do YouTube validados, embutidos com youtube-nocookie.com; a CSP libera só esse domínio em frame-src. O embed precisa do OK de Matheus antes do primeiro uso [NEEDS CLARIFICATION: C12].
Vitrine Destacada
A incorporadora compra por empreendimento, à parte da verba de mídia e sem precisar do projeto de mídia.
Planos mensal (30 dias), semestral (180) ou anual (360), contados a partir do pagamento. A equipe confirma o pagamento e ativa, com valor obrigatório. Termina sozinha e respeita um limite de vagas.
Só entra empreendimento publicado, com R.I. e vendas abertas. Se sair do ar ou esgotar, o destaque some.
Só visual: cor diferente e estrela no mapa, etiqueta de espaço pago no card. Não muda a ordem nem a busca.
Mais Buscados
Empreendimentos orgânicos com mais cliques e buscas no mapa no mês vigente, contando só cliques de compradores. Durante a Vitrine Destacada, o empreendimento fica fora, e volta no dia seguinte ao fim, contando só o que veio depois.

7. Incorporadora
Início: "Desde sua última visita", seis cards com comparação ao período anterior, próximas ações, Movimentações, Mais Buscados e empreendimentos ativos.
Visão geral: empreendimentos ativos, unidades disponíveis (número e %, com barra), reservas e vendas; período hoje, 7, 30, 90 dias ou personalizado; tabela por empreendimento.
Interesse de compradores e investidores (nunca aparecem nomes): linha de acessos por dia; barras por empreendimento com acessos, usuários únicos, recorrentes (2+ visualizações) e investidores interessados; KPIs de acessos hoje e média de visualizações por usuário. Uma escala por gráfico, sem eixo duplo, com legenda e tabela alternativa.
"Mesmo usuário viu" conta só quem está logado. A tabela de visualizações (conta, empreendimento, dia, vezes) a incorporadora não lê; ela recebe só números. O visitante anônimo entra só no total. O texto de privacidade avisa disso.
Investidor interessado: conta com objetivo "investir" que favoritou, pôs em lista, pediu contato, agendou visita ou mandou proposta. Só número.
Dashboards (filtro Hoje em todos os perfis): acessos, interações, leads direcionados, contatos liberados, visitas, propostas, vendas, VGV, resultado por empreendimento, venda por origem, interesse dos compradores, acessos e estoque por empreendimento e comercial.
CRM: kanban com etapas por incorporadora e editáveis (criar, renomear, reordenar; excluir só vazia ou movendo os cards). Ganho e perda são fixas. O card é o atendimento. Busca e filtros por empreendimento, origem, responsável e etiqueta. O card abre um painel com dados do comprador só leitura e só se liberados, campos do CRM editáveis (etapa, notas, tarefas, valor potencial, próxima ação, etiquetas), tarefas com data e histórico de etapa. Arrastar e soltar, com alternativa por teclado "Mover para…". Card criado à mão é lead próprio da incorporadora, com origem obrigatória e visível só a ela. A incorporadora nunca edita as respostas nem o contato do comprador.
Leads da plataforma: acompanha o lead da busca (só leitura). Edita o lead de mídia que a equipe dela atende.
Equipe de vendas (plantão): nome, cargo, empresa, CRECI opcional, WhatsApp, e-mail e situação. Card no empreendimento com a lista, o responsável e o rodízio. Importar CSV (modelo para baixar, prévia com erro por linha, tudo ou nada). Exportar CSV em UTF-8 com BOM e separador ";".
Usuários (só client_superadmin): convidar, escolher gerente ou plantão e desativar.
Projeto de mídia (só se contratou): verba aportada e gasta, saldo, campanhas por empreendimento e canal com período e gasto (lançamento manual), leads, CPL, CAC, ROI, funil e venda atribuída ao canal. Ativar campanha exige conferência do R.I.
8. House de vendas
Distribuição: o lead da busca vai a uma analista ativa, em rodízio (uma vez por analista ativa). Sem analista ativa, ou na regra manual, fica na fila da house, visível a toda a house até alguém assumir. Prazo de proteção ao lead mantém a atribuição se o comprador procurar a incorporadora direto (Proposta).
Fila da analista: leads novos de contato direto, visita e busca; checklist de qualificação; agenda de visitas e confirmação; prazo de resposta visível.
Depois da visita: "Passar ao gerente de produtos" registra a passagem, e o gerente da incorporadora vê o atendimento.
Oferecer semelhantes: pela regra da busca; cria só a sugestão, o comprador decide, e o contato só vai à outra incorporadora com novo consentimento.
Gerente de contas: carteira de incorporadoras e empreendimentos; é quem aparece no escritório de vendas quando a house atende.
Mini CRM do lead: kanban e lista nas etapas novo, qualificado, visita agendada, visita feita, proposta, reserva, contrato, venda e perdido (com motivo). Cada etapa pede o fato que representa. Origem sempre visível e não editável. Quem atende edita contato, qualificação, negócio e acompanhamento, com autor e data no histórico; as respostas originais do questionário não mudam. Lead próprio com origem obrigatória (Indicação, Carteira própria, Portal, Redes sociais, Outro), privado de quem cadastrou e fora dos números da busca e da mídia.
Visitas: agenda e lista, com agendar, reagendar, cancelar e registrar resultado, sincronizadas com o kanban.
Dashboards: vendas, VGV, comissão devida, leads, tempo de primeira resposta, funil, leads e vendas por origem, canais com melhor conversão, visitas, propostas, oportunidades e tarefas atrasadas.
Comissão e material comercial aparecem para a house fora do modo cliente.
9. Negociação (Épico 2)
Proposta com unidade, valor, plano de pagamento e validade, aprovada ou recusada pela incorporadora.
Reserva de unidade com prazo, liberada automaticamente ao vencer.
Contrato da incorporadora anexado, com status e data de assinatura. Assinatura eletrônica por provedor externo.
Ao registrar a venda: atualizar espelho, comissão devida e dashboards. A comissão usa o percentual negociado; vendas já registradas mantêm o valor se o percentual mudar.
Registro manual da venda e conferência periódica com a lista de vendas da incorporadora.
10. Simulador
Calculadora com os números informados pela própria pessoa: cap rate, GRM, Cash-on-Cash e ganho de capital na venda. Sem vacância, sem índice de mercado, sem aluguel pré-preenchido, fora da IA. Não promete valorização e exibe texto legal validado em toda projeção. Custos de compra sempre como estimativa.

11. God mode: personalização da plataforma
O god mode edita conteúdo e aparência da plataforma, sem mexer em código e sem tocar em dado de cliente. Antes de criar qualquer recurso para o god mode, pergunte: altera dado de cliente? Se sim, fica de fora ou vira só leitura.

Barra do god mode com "Editar esta tela": cada texto editável ganha contorno e lápis; o painel "Textos desta tela" dá o mesmo acesso pelo teclado.
Textos fixos num catálogo gerado do código (<T> e npm run catalogo), com busca, filtro por área e "só os alterados". Texto montado com dado de cliente não entra.
Textos legais (consentimento, visita, interesse) ganham versão nova a cada edição; a tela mostra quantos aceites cada versão tem.
Logotipos, símbolos, favicon e imagem de destaque trocáveis por JPG, PNG ou WebP de até 10 MB, reduzidos para até 1600 px. No modo local, ficam no IndexedDB (não no LocalStorage, por causa do limite de ~5 MB).
Nome, slogan, suporte, rodapé, cores, cantos e tamanho do texto editáveis. Cor que falha no WCAG AA é recusada.
Listas editáveis: origens do lead próprio, perguntas para a visita, formas de pagamento e itens de infraestrutura.
Histórico de cada mudança (antes, depois, data, autor), desfazer a última e restaurar a personalização.
"Exportar" e "Importar" só o conteúdo da plataforma, com validação.
Fora da edição: pesos e regras da busca, registros da base, fotos de empreendimentos e logotipos de incorporadoras.
Impersonate do god mode é só leitura.
12. Marca e design
Item	Valor
Lima (principal)	#DBDF4A
Preto	#0C0C0C
Grafite	#262626
Off-white (fundo)	#F4F4F0
Texto secundário / discreto	#45453F / #5D5D55
Borda de controle	#85857B
Secundário sobre preto	#A8A89E
Status (sucesso / atenção) / erro	#15803D / #B45309 / #B91C1C
Fontes	Inter Tight em títulos e números de destaque; Inter na interface
Títulos de marca	Caixa alta, Bold 800, tracking −3%
Etiqueta	Peso 600, caixa alta, tracking 0,14em
Destaque de título	Bloco lima com texto preto; sobre preto, texto lima
Fechamento do início	"MIRAR NO AGORA PRA CHEGAR LONGE."
Do brandbook valem só cores e logotipo, ambos provisórios. Não use o tom, os textos nem o posicionamento do brandbook.
O lima tem 1,30:1 sobre o off-white: nas áreas claras, nunca é texto, ícone, linha ou marca de gráfico. Use-o só como preenchimento atrás de texto preto.
Gráficos: rampa ordinal de #949800 a #242500 (≥ 3:1 sobre branco); paleta categórica #7A7F00, #2A78D6, #EB6834, #6250D6.
Tokens no CSS global; logotipo e nome num único arquivo de configuração.
13. Arquitetura e engenharia
Stack
Next.js 16 (App Router; middleware se chama proxy), React 19, TypeScript estrito, Tailwind v4, Zod 4, React Hook Form, Zustand, MapLibre GL com OpenFreeMap (sem chave e sem custo; agrupamento nativo), Recharts, PostgreSQL 17 com PostGIS em VPS própria, Drizzle ORM (consultas e migrations), Better Auth (login, recuperação de senha, MFA TOTP, sessões no próprio Postgres), armazenamento S3 compatível (Cloudflare R2 ou MinIO, a escolher por custo), pg-boss (tarefas agendadas num worker separado, fila no Postgres), Vitest, Playwright e axe. Fixe as versões e confira a documentação atual antes de usar cada API.
O Supabase não faz parte da stack (decisão de Matheus em 2026-11-13). O plano técnico detalhado está em openspec/changes/planejar-mvp-imob/design.md.

Camada de dados
NEXT_PUBLIC_DATA_SOURCE = local (padrão: LocalStorage e modo demo) ou postgres. Não é segredo.
Portas e adaptadores por domínio (data/port.ts, local.ts, postgres.ts), com teste de contrato que roda igual nos dois. Repositórios: EmpreendimentoRepo, ProfileRepo, EventRepo, FavoriteRepo, AlertRepo e os de incorporadora e house. Arquivos passam pela porta ArquivoStorage (disco local no desenvolvimento, S3 em produção).
Nenhum componente lê LocalStorage, o banco ou o armazenamento direto: tudo passa pelos repositórios.
Dados do navegador com versão de schema e migração sem perda; a migração registra o que removeu.
Segurança em três camadas
RLS é a fonte da verdade. Banco único com tenant_id e RLS em toda tabela exposta; índice em todo tenant_id. O app conecta com o papel de banco app_user (sem BYPASSRLS e sem ser dono das tabelas); cada requisição roda numa transação que grava a conta e o impersonate com set_config('app.conta_id', ..., true) e set_config('app.impersonacao_id', ..., true). Sem contexto, só o que é público da vitrine aparece. Papéis de banco separados: app_user, auth_service (só tabelas do Better Auth, schema auth), worker e migrator (dono do schema, só no deploy). Funções no schema app (current_conta_id(), current_role(), current_tenant_id(), is_god_mode(), is_internal(), pode_escrever()), security definer, stable, search_path vazio, consultadas dentro de (select ...). Views com security_invoker = true. O papel vem da tabela contas, nunca de dado de perfil editável ou do conteúdo da sessão. Drizzle é a camada de consulta e de migrations; políticas RLS, funções, gatilhos e GRANTs são escritos em migrations SQL revisadas. RLS não filtra colunas: dado sensível fica em tabela separada (ex.: empreendimentos_comercial com comissão e escritório; leads_contato com WhatsApp e e-mail). Bloqueie alteração de role, tenant_id e responsavel_conta_id por GRANT de coluna ou trigger.
proxy.ts só para rota: lê o cookie de sessão do Better Auth, renova e redireciona. Não autoriza dados.
Contexto no servidor: toda Server Action e Route Handler começa com exigirContexto(): valida a sessão no servidor pelo Better Auth, carrega conta, tenant, produtos e impersonate, abre a transação com o contexto do banco, lê o tenant_id só do contexto (nunca de corpo, URL ou cabeçalho), valida a entrada com Zod estrito e responde 404, não 403, para id de outro tenant.
A conexão com o banco (DATABASE_URL) fica num único módulo server-only, que só entrega o cliente Drizzle dentro de exigirContexto() e é importado só de uma lista permitida (um teste falha fora dela). Credenciais de S3, Better Auth e IA também ficam só no servidor.
Impersonate: só internal_admin, internal_superadmin e god_mode, com motivo obrigatório; alvo só papel de cliente. Sem trocar de token. Só leitura por padrão; nunca muda papéis, usuários, tenant, consentimento ou cobrança, nem exclui. Máximo de 30 minutos. Faixa fixa "Você está vendo como [nome]". Tudo vai para a auditoria.
Auditoria imutável (audit_logs, sem UPDATE, DELETE ou TRUNCATE para ninguém): verba, comissão, proposta, contrato, exclusão, papéis, situação do tenant, produtos, config_global e consentimentos. Registre também quando papel interno ou god mode abre dados de um tenant ou contato de lead, e mudanças de papel negadas. Guarde ids, não contatos.
Banco (principais entidades)
tenants, tenant_produtos (plataforma, projeto_midia), contas, tenant_convites, empreendimentos (com cnpj, tipo, visibilidade, videos, capa_path, mapa_interativo_url, escritorio, localização PostGIS, pronto para morar, % de obra, aceita permuta, entrada e parcela mínimas, preço "a partir de"), empreendimentos_comercial, obra_etapas, subcondominios, tipologias, tipologia_subcondominios, unidades, planos, tabela_movimentos, empreendimento_equipe, equipe_vendas, leads, leads_contato, leads_interesses (consentimento por empreendimento: origem, data, versão, texto e revogação), atendimentos (andamento por empreendimento, com etapa_id, analista_conta_id, valor, próxima ação, etiquetas), crm_etapas, crm_notas, crm_tarefas, visitas, propostas, visualizacoes, empreendimento_engajamento, destaques_vitrine, aportes e campanhas, visitor, event, profile, favorite, list, alert, project_change (preenchida por trigger), recommendation, consent, conteudo_textos, conteudo_versoes_legais, conteudo_imagens, personalizacao, listas_opcoes, historico_edicoes, config_global, impersonation_sessions, audit_logs.

Funções SQL (chamadas pelo Drizzle): count_empreendimentos(filters), count_by_option(filters, question_id), empreendimentos_in_bbox(min_lng, min_lat, max_lng, max_lat, filters), merge_visitor(visitor_id), interesse_empreendimentos(tenant, desde, ate), visao_geral_incorporadora(tenant, desde, ate), passar_ao_gerente_produtos(atendimento), oferecer_semelhantes(lead, empreendimentos), além de contato direto, visita, proposta (responder e cancelar), importar equipe, revogar consentimento, mover etapa e interesse.

Armazenamento (S3 compatível): prefixos empreendimentos/{tenant}/{empreendimento}/... e conteudo-plataforma/. Upload sempre pelo servidor, com checagem de papel, tenant, tipo e tamanho; mídia de empreendimento publicado por URL pública; plantas não publicadas, contratos e documentos só por URL assinada de curta duração.

Tarefas agendadas (pg-boss, processo worker): vencer reservas, encerrar Vitrine Destacada e impersonate, recalcular Mais Buscados, disparar alertas a partir de project_change e limpar convites vencidos. Cada tarefa é idempotente e auditada quando altera dado de cliente.

Seed: só fictício, com ids fixos: três incorporadoras, a house, compradores, dois empreendimentos com cadastro completo e CRM com etapas e cards.

Testes de banco (pgTAP)
Os mesmos arquivos rodam no PGlite (npm run test:db, sem Docker) e no CI (contêiner postgis/postgis com Postgres 17, drizzle-kit migrate, seed e pg_prove). Cubra, no mínimo:

O comprador não lê comissão, equipe, rodízio, movimentos, engajamento, visualizações nem CRM.
A incorporadora não vê etapa, visita ou proposta com outra; vê só números de visualização; não lê nem move etapa de CRM de outra.
Exclusivo ou não listado fica fora do mapa e da busca. Publicar sem R.I. é recusado, até para o god mode.
Excluir etapa com cards é recusado. Tipologia sem subcondomínio é recusada.
Oferecer semelhante não libera contato.
God mode lê e não escreve dado de cliente, direto ou em impersonate.
Teste de catálogo: RLS em toda tabela, índice em todo tenant_id, search_path fixo em toda security definer, security_invoker em toda view, anon só executa as funções da vitrine, nenhum resto de broker, corretor ou imobiliaria.
Requisitos não funcionais
Mobile primeiro (desenho de 360 a 390 px, expandido até o desktop). Sem rolagem horizontal em 390, 1024 e 1440 px.
Contraste AA, foco visível, selos com ícone e texto (nunca só cor), alvos de 44 × 44 px, prefers-reduced-motion, axe sem violação. A lista do mapa funciona por teclado e leitor de tela.
LCP da página do empreendimento < 2,5 s em 4G; imagens responsivas com lazy loading; mapa e bibliotecas pesadas sob demanda.
TypeScript estrito, sem any novo. Variáveis novas vão para .env.example, com placeholder e comentário.
Textos centralizados em src/i18n/pt-BR.ts e exibidos pelo catálogo <T>.
Critérios de sucesso
Um visitante sem conta conclui o questionário e vê de 2 a 3 opções.
Nenhum empreendimento sem R.I., em pré-lançamento, rascunho ou esgotado aparece no contador, no resultado, no mapa ou em alertas.
Trocar Vitrine Destacada, comissão ou incorporadora não muda a nota nem a ordem.
Nenhum motivo passa de 140 caracteres nem traz número que não venha do cadastro ou da conta.
"Agendar visita" e "Falar com o gerente" a até 2 toques; agendamento em 3.
Com localização negada, o mapa abre na cidade pelo IP ou em Porto Alegre.
Contagem no banco em menos de 300 ms.
A incorporadora não vê nome nem contato de quem só respondeu ao questionário.
Testes exigidos
Unidade: filtros, regra do zero, nota e componentes, motivo sem IA, resolveHomeState, resolução da posição do mapa (negada, tempo esgotado, IP), teste que varre o código contra os termos proibidos.
Ponta a ponta: questionário completo até a visita; mapa na posição simulada, navegação, pino e favorito pedindo login; permissão negada com fallback; área vazia criando alerta.
GitHub e CI
main protegida: PR, CI verde e revisão de Matheus.
CI com os jobs qualidade (lint, typecheck, unit, test:db), build, e2e (Playwright em modo local, só em PR) e banco (contêiner PostGIS: migrations, seed e pgTAP). concurrency com cancel-in-progress. Avise Matheus antes de passar do limite gratuito de minutos do Actions.
Template de PR, CODEOWNERS e dependabot semanal agrupado.
Ambientes
Local: modo local, sem banco; banco validado no PGlite.
Postgres local completo só quando houver Docker; sem Docker, PGlite.
Remoto: VPS própria com Docker Compose (ou Coolify): app Next (standalone), worker, PostgreSQL 17 + PostGIS sem porta pública e proxy reverso com HTTPS; backup diário cifrado no S3 com restauração testada. VPS, S3 e provedor de e-mail só com aprovação de custo de Matheus. Migrations só pelo job de deploy, com o papel migrator e após backup, nunca à mão.
Regra de parada: sem VPS e S3 aprovados e provisionados por Matheus, entregue migrations, seed e pgTAP validados no PGlite e no CI, e pare antes de aplicar no remoto.
Serviços gratuitos que precisam do OK de Matheus antes do primeiro uso: ViaCEP, embed do YouTube, geolocalização por IP. WhatsApp, e-mail (inclusive recuperação de senha e convites) e push ficam simulados (links wa.me e tela interna de notificações simuladas). Nada pago.
14. Forma de trabalho
Trabalhe por stories em docs/stories/, uma por vez, cada uma com branch própria e PR. Marque o checklist e mantenha a File List.
Não invente requisito. Regra ou parâmetro que não vier desta especificação é marcado como Proposta e levado a Matheus. Se algo conflitar com esta especificação, pare e pergunte.
Commits convencionais em português, com [Story X.Y]. Rode npm run check:secrets antes de cada commit. Commit só quando pedido.
Push e PR só depois dos quality gates; o merge é sempre de Matheus. Se o modo automático bloquear um push ou merge, peça a Matheus, sem contornar.
Definição de pronto: lint, typecheck, test, test:db, test:e2e, build, check:secrets e catalogo verdes; axe sem violação; capturas em 390 e 1440 px revisadas; documentação atualizada; relatório a Matheus com o que mudou, o que ficou pendente, custo de Actions e decisões novas.
Cada fase grande termina com uma parada para Matheus revisar.
Máquina de Matheus: Windows 11 Home, 8 GB de RAM e 2 núcleos, sem WSL nem Docker. Rode suítes pesadas com parcimônia e mantenha o código compilando a cada lote, porque o servidor local lê a mesma pasta.
Pasta do código: fora do OneDrive (o OneDrive atrapalha .git e node_modules). Ao entregar, diga onde ver cada coisa.
Responda sempre em português, com acentuação correta.
15. Em aberto (decisões de Matheus)
#	Pendência
P5	Primeiro cliente e praça
P6	Remuneração da Imob e tratamento contábil da verba (a combinar)
P7	A incorporadora aceita conduzir proposta e contrato no sistema? (níveis: registro, fluxo, assinatura)
P10	Oferta em PDF com a marca da house: fora do MVP?
P11	Meta de receita, quem contrata o time e quantos lançamentos cada gestor atende
C1	Cores de apoio: Morar #9C3D17 e Investir #1D5A85 (passam no AA)
C2	Modelo de IA: Claude Opus 5.5 (~US$ 0,03 por questionário) ou Haiku 5.5 (~US$ 0,001), e a liberação do custo
C3	"Falar com o gerente" exige login, consentimento e lead "Contato direto" no primeiro clique, ou fica livre?
C4	Mostrar ao comprador o interesse no empreendimento ("X pessoas visitaram esta semana") conflita com a matriz de visibilidade
C5	Indicadores dos bairros na home são dado de mercado (conflitam com P8): saem ou têm outra fonte?
C6	Prova social e depoimentos: o bloco fica oculto até haver dado real?
C7	Fonte do ITBI e do registro: alíquota fixa por cidade, campo do cadastro ou valor informado pela pessoa?
C8	Configurações dos outros perfis (Perfil, Mudar senha, Usuários, Privacidade, Integrações bloqueada "plano Avançado", Meu plano)
C9	Formas de pagamento: Consórcio entra?
C10	Como o comprador envia proposta (formulário com unidade, valor, formas e validade?)
C11	PostGIS no PGlite: carrega? Senão, variante lat/lng só nos testes locais; o PostGIS real é testado no CI
C12	Embed de vídeo e tour 3D na galeria
C13	Critério dos destaques da home: Mais Buscados, escolha da equipe ou outro?
C14	Parâmetros marcados como Proposta nas regras de cálculo
C15	Validação jurídica dos textos de consentimento, visita e projeção, e de a house atender e mostrar valores sem CRECI da plataforma
—	Simulador: continua como calculadora ou sai?
—	Vitrine Destacada: só a incorporadora compra? Quantas vagas? Qual o valor de cada plano?
—	Planos "Essencial" e "Avançado": nomes e conteúdo (só exibição, sem cobrança)
—	Quantas opções a house oferece em "semelhantes"
—	Proposta e contrato continuam dentro do sistema (R5) mesmo com o fluxo Reelly no atendimento?
—	Infraestrutura: provedor e orçamento da VPS, armazenamento S3 (Cloudflare R2 ou MinIO na VPS), Docker Compose ou Coolify, e provedor de e-mail transacional
—	Pasta do código fora do OneDrive (ex.: C:\dev\imob)
16. Fora do MVP
Decidido: leilão de leads, tokenização, vacância e indicadores de mercado, corretor, imobiliária, parcerias e anúncios de corretor.
Para depois: anúncio de imóvel fora da base, imóveis prontos de terceiros, fluxo de aluguel, integração automática com plataformas de anúncio (o gasto entra à mão), eventos, API e white label, envio real de WhatsApp e push, cobrança e gateway de pagamento.
Fora do produto: financeiro interno da Imob (usar ERP pronto, com a verba dos clientes separada da receita) e funil comercial da própria Imob (usar CRM pronto).