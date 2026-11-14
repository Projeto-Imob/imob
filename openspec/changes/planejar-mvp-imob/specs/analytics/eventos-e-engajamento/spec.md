## Purpose

Medir o uso da plataforma e o interesse por empreendimento sem identificar o comprador para a incorporadora, alimentando indicadores, alertas e o ranking Mais Buscados.

## ADDED Requirements

### Requirement: Eventos anônimos
Os eventos de uso SHALL ser gravados com um ID anônimo, sem IP e sem posição exata, com aviso curto no primeiro acesso.

#### Scenario: Aviso no primeiro acesso
- **WHEN** um visitante abre a plataforma pela primeira vez
- **THEN** vê o aviso curto sobre o registro anônimo de uso

### Requirement: Catálogo de eventos
O catálogo inicial SHALL ser: `quiz_start`, `quiz_answer`, `quiz_option_disabled`, `quiz_widen_accepted`, `quiz_complete`, `contact_submitted`, `result_view`, `result_why_open`, `result_map_open`, `map_open`, `map_geo_permission`, `map_move`, `map_pin_click`, `map_empty_area`, `map_area_alert_created`, `project_view`, `costs_simulated`, `manager_contact`, `visit_started`, `visit_scheduled`, `favorite_add`, `alert_created` e `mode_changed`.

#### Scenario: Resposta do questionário
- **WHEN** o comprador responde a uma pergunta
- **THEN** `quiz_answer` é gravado com pergunta, valor e contagem antes e depois

#### Scenario: Contato com o gerente
- **WHEN** o comprador toca no WhatsApp do gerente
- **THEN** `manager_contact` é gravado com o canal `whatsapp`

### Requirement: Navegação privilegiada não conta
Acessos de god mode ou impersonate MUST NOT gerar eventos, visualizações nem última visita.

#### Scenario: Equipe em impersonate
- **WHEN** a equipe abre um empreendimento em impersonate
- **THEN** o contador de acessos do empreendimento não muda

### Requirement: Visualizações protegidas
A tabela de visualizações por conta, empreendimento e dia MUST NOT ser lida pela incorporadora; ela SHALL receber só números agregados. "Mesmo usuário viu" SHALL contar só usuários logados; o visitante anônimo entra só no total.

#### Scenario: Consulta direta da incorporadora
- **WHEN** um usuário de incorporadora consulta a tabela de visualizações
- **THEN** a consulta retorna zero linhas

### Requirement: Investidor interessado
Investidor interessado SHALL ser uma conta com objetivo "investir" que favoritou, pôs em lista, pediu contato, agendou visita ou mandou proposta no empreendimento, exposta só como número.

#### Scenario: Investidor favorita
- **WHEN** um comprador no modo Investir favorita o empreendimento X
- **THEN** o número de investidores interessados em X aumenta em 1

### Requirement: Mais Buscados
Mais Buscados SHALL ordenar empreendimentos orgânicos por cliques e buscas no mapa no mês vigente, contando só compradores. Durante a Vitrine Destacada, o empreendimento MUST ficar fora e voltar no dia seguinte ao fim, contando só o que veio depois.

#### Scenario: Fim do destaque
- **WHEN** a Vitrine Destacada de um empreendimento termina
- **THEN** no dia seguinte ele volta ao ranking contando só os cliques posteriores ao fim

#### Scenario: Visão da house
- **WHEN** a house abre Mais Buscados
- **THEN** vê só a ordem, sem números
