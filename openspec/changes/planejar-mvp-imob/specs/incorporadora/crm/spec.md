## Purpose

Oferecer à incorporadora um CRM kanban próprio para conduzir atendimentos dos seus empreendimentos, sem jamais alterar dados do comprador nem expor atendimentos de concorrentes.

## ADDED Requirements

### Requirement: Etapas editáveis por incorporadora
Cada incorporadora SHALL ter etapas próprias que pode criar, renomear e reordenar. Ganho e perda MUST ser fixas. Excluir etapa SHALL ser permitido só se vazia ou movendo os cards para outra.

#### Scenario: Excluir etapa com cards
- **WHEN** a incorporadora tenta excluir uma etapa com cards sem escolher destino
- **THEN** a exclusão é recusada

### Requirement: Card é o atendimento
Cada card SHALL representar um atendimento e abrir um painel com os dados do comprador somente leitura e só se liberados, mais campos editáveis do CRM: etapa, notas, tarefas com data, valor potencial, próxima ação, etiquetas e histórico de etapa.

#### Scenario: Contato não liberado
- **WHEN** o atendimento ainda não tem contato liberado
- **THEN** o painel mostra só os dados agregados permitidos, sem nome nem contato

### Requirement: Comprador intocável
A incorporadora MUST NOT editar as respostas nem o contato do comprador.

#### Scenario: Tentativa de editar contato
- **WHEN** a incorporadora tenta alterar o WhatsApp de um comprador
- **THEN** a operação é recusada

### Requirement: Mover cards com acessibilidade
O kanban SHALL permitir arrastar e soltar e a alternativa por teclado "Mover para…", registrando cada mudança no histórico de etapa.

#### Scenario: Mover por teclado
- **WHEN** o usuário escolhe "Mover para…" e seleciona uma etapa
- **THEN** o card muda de etapa e o histórico registra autor e data

### Requirement: Busca e filtros
O CRM SHALL ter busca e filtros por empreendimento, origem, responsável e etiqueta.

#### Scenario: Filtro por origem
- **WHEN** a incorporadora filtra por origem mídia
- **THEN** só cards de leads de mídia aparecem

### Requirement: Lead próprio
Card criado à mão SHALL ser lead próprio da incorporadora, com origem obrigatória e visível só a ela.

#### Scenario: Visibilidade do lead próprio
- **WHEN** a incorporadora cria um lead próprio
- **THEN** ele não aparece para a house nem entra nos números da plataforma

### Requirement: Isolamento do CRM
Uma incorporadora MUST NOT ler nem mover etapa de CRM de outra.

#### Scenario: Mover card alheio
- **WHEN** a incorporadora A tenta mover um card da incorporadora B por API
- **THEN** recebe resposta "não encontrado"
