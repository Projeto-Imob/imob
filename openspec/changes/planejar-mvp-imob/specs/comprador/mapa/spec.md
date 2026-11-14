## Purpose

Permitir explorar os lançamentos geograficamente, sem conta e sem expor a posição do usuário, com lista acessível sincronizada ao mapa e captura de demanda em áreas vazias.

## ADDED Requirements

### Requirement: Posição inicial em cascata
O centro inicial SHALL ser resolvido nesta ordem: coordenadas da URL (`lat`, `lng`, `z`); localização do navegador após tela de explicação (sem alta precisão, tempo limite de 5 s, cache de 10 min); cidade pelo IP por função de servidor plugável; Porto Alegre (lat −30,0346, lng −51,2177, zoom 11 a 12). A origem usada SHALL ser registrada no evento de abertura.

#### Scenario: Permissão negada
- **WHEN** o usuário nega a localização e a geolocalização por IP está desligada
- **THEN** o mapa abre em Porto Alegre com origem `default`

#### Scenario: Tempo esgotado
- **WHEN** o navegador não responde em 5 s
- **THEN** o sistema passa à etapa seguinte da cascata

### Requirement: Geolocalização por IP condicionada
A cidade pelo IP SHALL ficar desligada até a aprovação de Matheus do serviço.

#### Scenario: Serviço desligado
- **WHEN** a flag de IP está desligada
- **THEN** a etapa de IP é pulada sem chamada externa

### Requirement: Explicação antes de pedir localização
Antes do pedido do navegador, o sistema SHALL mostrar "Quer ver os lançamentos perto de você? Usamos sua localização só para centralizar o mapa." A posição exata MUST NOT ser gravada.

#### Scenario: Usuário aceita
- **WHEN** o usuário aceita e o navegador devolve a posição
- **THEN** o mapa centraliza nela e nenhum registro guarda as coordenadas exatas

### Requirement: Navegação e busca
O mapa SHALL ter "Minha localização", navegação livre pelo Brasil e busca por cidade, bairro ou nome com sugestões agrupadas por tipo, além de "Buscar nesta área".

#### Scenario: Busca por bairro
- **WHEN** o usuário digita o nome de um bairro
- **THEN** as sugestões aparecem agrupadas por cidade, bairro e empreendimento

### Requirement: Pinos e agrupamentos
O mapa SHALL agrupar pontos com a quantidade e, ao aproximar, mostrar pinos com o preço de entrada nas variações padrão, compatível com o perfil, patrocinado (cor diferente e estrela, sem prioridade) e visto.

#### Scenario: Pino patrocinado
- **WHEN** um empreendimento está na Vitrine Destacada
- **THEN** seu pino tem cor diferente e estrela, sem mudar a ordem da lista

### Requirement: Lista sincronizada e acessível
A lista SHALL mostrar os cards da área visível, atualizada após 300 ms sem movimento, como painel deslizante (fechada, metade, cheia) no celular e painel lateral no desktop, com alternância "Mostrar lista"/"Mostrar mapa". A lista MUST funcionar por teclado e leitor de tela.

#### Scenario: Teclado
- **WHEN** o usuário navega a lista só com o teclado
- **THEN** cada card recebe foco visível e abre os detalhes com Enter

### Requirement: Filtros com contagem
Os filtros SHALL usar os campos do questionário, mostrar a contagem ao vivo no botão "Ver {n} empreendimentos" e oferecer o atalho "Usar meu perfil".

#### Scenario: Usar meu perfil
- **WHEN** o comprador que concluiu o questionário toca em "Usar meu perfil"
- **THEN** os filtros recebem as respostas dele e o botão mostra a nova contagem

### Requirement: Card rápido do pino
O toque no pino SHALL abrir card com foto, nome, entrada mais parcela, % de obra, coração e "Ver detalhes".

#### Scenario: Favoritar pelo pino sem conta
- **WHEN** um visitante toca no coração do card rápido
- **THEN** o login rápido é pedido

### Requirement: Recorte só da base elegível
O mapa SHALL mostrar só empreendimentos da base elegível; exclusivos e não listados MUST ficar fora.

#### Scenario: Exclusivo na área
- **WHEN** um empreendimento exclusivo está na área visível
- **THEN** ele não aparece no mapa nem na lista

### Requirement: Área vazia e alerta de área
Sem empreendimento na área, o mapa SHALL mostrar "Ainda não temos lançamentos aqui. Quer ser avisado quando chegar?" com criação de alerta de área e registro do evento de área vazia. "Me avise de novos lançamentos nesta área" SHALL criar alerta com o recorte visível.

#### Scenario: Alerta em área vazia
- **WHEN** o comprador logado cria o alerta numa área vazia
- **THEN** o alerta de área é salvo com o recorte e os eventos de área vazia e de alerta criado são registrados
