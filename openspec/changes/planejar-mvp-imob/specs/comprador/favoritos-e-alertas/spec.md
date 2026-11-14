## Purpose

Permitir ao comprador acompanhar empreendimentos e áreas ao longo do tempo, ser avisado de mudanças relevantes e comparar opções lado a lado.

## ADDED Requirements

### Requirement: Favoritar com login
Todo card e pino SHALL ter coração. Favoritar MUST pedir login rápido e salvar o favorito depois dele. Após favoritar, o sistema SHALL convidar a criar um alerta.

#### Scenario: Primeiro favorito
- **WHEN** o comprador favorita um empreendimento
- **THEN** o favorito é salvo e aparece o convite para criar alerta

### Requirement: Favoritos vazios
Sem favoritos, a área SHALL mostrar "Toque no coração para acompanhar um imóvel. A gente avisa quando algo mudar."

#### Scenario: Lista vazia
- **WHEN** o comprador abre `/favoritos` sem nenhum favorito
- **THEN** vê a mensagem de estado vazio

### Requirement: Listas
O comprador SHALL criar, renomear, excluir listas e mover empreendimentos entre elas.

#### Scenario: Mover entre listas
- **WHEN** o comprador move um empreendimento da lista A para a B
- **THEN** ele deixa de aparecer em A e passa a aparecer em B

### Requirement: Selo Novidade
O selo "Novidade" SHALL aparecer quando o empreendimento mudou desde a última visita da pessoa.

#### Scenario: Preço mudou
- **WHEN** o preço de um favorito muda depois da última visita do comprador
- **THEN** o card mostra "Novidade"

### Requirement: Comparador
O comparador SHALL aceitar até 3 empreendimentos e mostrar custo total, entrega, m², distâncias e indicadores permitidos.

#### Scenario: Quarto item
- **WHEN** o comprador tenta adicionar um quarto empreendimento
- **THEN** o sistema informa o limite de 3

### Requirement: Alertas
O sistema SHALL suportar alertas de perfil, favorito, área, preço e obra; empreendimento novo nas buscas salvas; e, nos favoritos, mudança de preço, unidade nova, disponibilidade e fase de venda. Cada alerta SHALL ter canal (WhatsApp, e-mail ou push, simulados) e frequência, e poder ser marcado como visto, pausado ou desligado.

#### Scenario: Alerta de preço
- **WHEN** o preço de um favorito com alerta ativo muda
- **THEN** uma notificação simulada é registrada no canal escolhido

#### Scenario: Alerta pausado
- **WHEN** o alerta está pausado e o preço muda
- **THEN** nenhuma notificação é gerada

### Requirement: Alertas só com base elegível
Alertas MUST NOT disparar por empreendimento fora da base elegível.

#### Scenario: Novo sem R.I.
- **WHEN** um empreendimento novo sem R.I. entra no cadastro numa área com alerta
- **THEN** nenhum alerta é disparado
