## Purpose

Dar à house de vendas o fluxo completo de atendimento — distribuir, qualificar, garantir a visita, passar ao gerente de produtos e oferecer semelhantes — com histórico e indicadores próprios.

## ADDED Requirements

### Requirement: Distribuição em rodízio
O lead da busca SHALL ir a uma analista ativa em rodízio, uma vez por analista ativa. Sem analista ativa, ou com regra manual, MUST ficar na fila da house, visível a toda a house até alguém assumir.

#### Scenario: Três analistas
- **WHEN** chegam quatro leads com três analistas ativas
- **THEN** cada analista recebe um e o quarto vai à primeira de novo

#### Scenario: Nenhuma analista ativa
- **WHEN** chega um lead sem analista ativa
- **THEN** ele fica na fila da house sem responsável

### Requirement: Proteção do lead
Um prazo de proteção (parâmetro Proposta) SHALL manter a atribuição do lead se o comprador procurar a incorporadora direto.

#### Scenario: Dentro do prazo
- **WHEN** o comprador contata a incorporadora direto dentro do prazo
- **THEN** o lead continua atribuído à analista original

### Requirement: Fila da analista
A fila SHALL mostrar leads novos de contato direto, visita e busca, com checklist de qualificação, agenda de visitas e confirmação, e prazo de resposta visível.

#### Scenario: Prazo de resposta
- **WHEN** um lead está sem primeira resposta
- **THEN** a fila mostra o tempo restante do prazo

### Requirement: Mini CRM do lead
O mini CRM SHALL ter kanban e lista com as etapas novo, qualificado, visita agendada, visita feita, proposta, reserva, contrato, venda e perdido (com motivo), e cada etapa MUST pedir o fato que representa. Origem SHALL ser sempre visível e não editável.

#### Scenario: Mover para visita agendada
- **WHEN** a analista move um lead para "visita agendada"
- **THEN** o sistema exige a data e o horário da visita

### Requirement: Edição com histórico
Quem atende SHALL editar contato, qualificação, negócio e acompanhamento, com autor e data no histórico. As respostas originais do questionário MUST NOT mudar.

#### Scenario: Correção de contato
- **WHEN** a analista corrige o e-mail do lead
- **THEN** o histórico registra antes, depois, autor e data, e as respostas do questionário seguem intactas

### Requirement: Lead próprio da house
O lead próprio SHALL ter origem obrigatória (Indicação, Carteira própria, Portal, Redes sociais, Outro), ser privado de quem cadastrou e ficar fora dos números da busca e da mídia.

#### Scenario: Visibilidade
- **WHEN** uma analista cadastra lead próprio
- **THEN** outras analistas, incorporadoras e a equipe da plataforma não o veem

### Requirement: Visitas da house
A house SHALL agendar, reagendar, cancelar e registrar resultado de visitas em agenda e lista, sincronizadas com o kanban.

#### Scenario: Resultado registrado
- **WHEN** a analista registra a visita como feita
- **THEN** o lead passa a "visita feita" no kanban

### Requirement: Passar ao gerente de produtos
"Passar ao gerente de produtos" SHALL registrar a passagem e dar ao gerente da incorporadora acesso ao atendimento.

#### Scenario: Passagem
- **WHEN** a analista passa o atendimento após a visita
- **THEN** o gerente de produtos da incorporadora vê o atendimento no CRM dela

### Requirement: Oferecer semelhantes sem liberar contato
Oferecer semelhantes SHALL usar a regra da busca e criar só a sugestão; o contato MUST ir à outra incorporadora só depois de novo consentimento do comprador.

#### Scenario: Sugestão criada
- **WHEN** a analista oferece dois semelhantes de outra incorporadora
- **THEN** o comprador vê as sugestões e a outra incorporadora não recebe nome nem contato

### Requirement: Gerente de contas
O gerente de contas SHALL ter carteira de incorporadoras e empreendimentos e aparecer no escritório de vendas quando a house atende.

#### Scenario: Carteira
- **WHEN** o gerente de contas abre a carteira
- **THEN** vê as incorporadoras e empreendimentos atribuídos a ele

### Requirement: Comissão fora do modo cliente
Comissão e material comercial SHALL aparecer para a house só fora do modo cliente.

#### Scenario: Modo cliente ativo
- **WHEN** a analista ativa o modo cliente para mostrar a tela ao comprador
- **THEN** comissão e material comercial ficam ocultos

### Requirement: Dashboards da house
Os dashboards SHALL mostrar vendas, VGV, comissão devida, leads, tempo de primeira resposta, funil, leads e vendas por origem, canais com melhor conversão, visitas, propostas, oportunidades e tarefas atrasadas.

#### Scenario: Tempo de primeira resposta
- **WHEN** a house abre o dashboard
- **THEN** vê o tempo médio de primeira resposta do período
