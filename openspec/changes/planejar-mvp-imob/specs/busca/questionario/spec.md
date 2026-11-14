## Purpose

Levar o comprador, sem conta, por um questionário curto e editável que reduz a base elegível ao vivo e termina com o perfil pronto para a recomendação e o contato opcional.

## ADDED Requirements

### Requirement: Perguntas declarativas
As perguntas SHALL vir de um schema declarativo (id, título, tipo, opções, efeito, contagem por opção, combinação, dependência, conversão em filtro e em peso), editável sem alterar componentes de tela. O conjunto inicial SHALL ser `modo`, `prazo`, `quartos`, `regiao`, `pagamento`, `permuta`, `requisitos`, `decisao` e, só no modo Investir, `primeiro_investimento` e `foco`.

#### Scenario: Modo Morar
- **WHEN** o comprador escolhe "Para morar" na primeira pergunta
- **THEN** as perguntas `primeiro_investimento` e `foco` não aparecem e o total do progresso é ajustado

### Requirement: Uma pergunta por tela
O questionário SHALL mostrar uma pergunta por tela, sem tela de introdução, com botões de no mínimo 44 × 44 px e botão voltar.

#### Scenario: Voltar
- **WHEN** o comprador toca em voltar na pergunta 4
- **THEN** volta à pergunta 3 com a resposta anterior preservada

### Requirement: Contador ao vivo
Um cabeçalho fixo SHALL mostrar "{n} empreendimentos" (ou "{n} empreendimento") e "Pergunta {i} de {total}". A mudança do número SHALL ser anunciada de forma educada a leitores de tela e animada em cerca de 400 ms, sem animação com movimento reduzido.

#### Scenario: Resposta reduz a base
- **WHEN** o comprador escolhe "Quero receber agora"
- **THEN** o contador passa ao número de empreendimentos prontos para morar

### Requirement: Contagem por opção e regra do zero
Nas perguntas marcadas, cada opção SHALL exibir quantos empreendimentos restariam. Em perguntas "ou", a contagem considera só aquela opção; em "e" (requisitos), soma a opção às já marcadas. A opção que levaria a zero MUST ficar desabilitada com "nenhum no momento". "Perto de mim" sem posição não é contado.

#### Scenario: Opção sem resultado
- **WHEN** nenhum empreendimento elegível tem unidade studio disponível
- **THEN** a opção "Studio" aparece desabilitada com "nenhum no momento"

### Requirement: Sugestão de ampliar
Com menos de 3 empreendimentos no conjunto, o sistema SHALL sugerir ampliar, relaxando o último filtro: na região, inclui bairros a até 3,5 km (parâmetro Proposta) de algum empreendimento dos bairros escolhidos; prazo vira "posso esperar"; quartos fica vazio; pagamento perde os valores; permuta vira "não"; requisitos fica sem chips.

#### Scenario: Ampliar região
- **WHEN** restam 2 empreendimentos após a região e o comprador aceita "incluir bairros vizinhos"
- **THEN** bairros vizinhos dentro do raio configurado entram e o evento de ampliação aceita é registrado

### Requirement: Progresso salvo
O progresso SHALL ser salvo a cada resposta e retomado ao voltar ao questionário, com ou sem conta.

#### Scenario: Retomar depois
- **WHEN** o comprador fecha a aba na pergunta 5 e volta no dia seguinte no mesmo navegador
- **THEN** o questionário reabre na pergunta 5 com as respostas anteriores

### Requirement: Texto livre de requisitos
O texto livre de requisitos SHALL ser convertido numa lista de itens comparada às comodidades cadastradas. Com a IA desligada, a conversão MUST usar palavras-chave do catálogo de comodidades. O texto original SHALL ir também para o analista.

#### Scenario: IA desligada
- **WHEN** o comprador escreve "quero varanda gourmet e pet place" e a IA está desligada
- **THEN** os itens reconhecidos pelo catálogo entram nos requisitos e o texto original fica no lead

### Requirement: Tela de análise cancelável
Ao concluir, o sistema SHALL mostrar "Analisando os {n} empreendimentos do seu perfil…" por 2 a 4 segundos, cancelável.

#### Scenario: Cancelar análise
- **WHEN** o comprador toca em cancelar durante a análise
- **THEN** volta à última pergunta com as respostas preservadas

### Requirement: Contato só no fim
O contato (nome e WhatsApp) SHALL ser pedido só no fim, com "Seus imóveis estão prontos. Para onde enviamos?", e MUST ser opcional para ver o resultado. Nome e WhatsApp informados SHALL criar o lead na fila da house em rodízio.

#### Scenario: Pular contato
- **WHEN** o comprador não preenche o contato
- **THEN** vê o resultado normalmente e nenhum lead com contato é criado

#### Scenario: Contato informado
- **WHEN** o comprador informa nome e WhatsApp
- **THEN** um lead é criado na fila da house e nenhuma incorporadora vê seu nome ou contato

### Requirement: Contagem rápida
A contagem SHALL responder em menos de 300 ms no banco, com espera de 150 ms entre mudanças e cache por combinação de filtros.

#### Scenario: Mudanças rápidas
- **WHEN** o comprador marca três chips em menos de 150 ms
- **THEN** apenas uma contagem é solicitada
