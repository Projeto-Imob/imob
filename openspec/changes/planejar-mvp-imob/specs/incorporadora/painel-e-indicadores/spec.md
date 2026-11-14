## Purpose

Dar à incorporadora visão do estoque, do interesse e do resultado dos próprios empreendimentos, sempre com dados agregados quando se trata de compradores sem contato liberado.

## ADDED Requirements

### Requirement: Início da incorporadora
O início SHALL mostrar "Desde sua última visita", seis cards com comparação ao período anterior, próximas ações, Movimentações, Mais Buscados e empreendimentos ativos.

#### Scenario: Comparação
- **WHEN** a incorporadora abre o início
- **THEN** cada card mostra o valor atual e a variação em relação ao período anterior

### Requirement: Visão geral por período
A visão geral SHALL mostrar empreendimentos ativos, unidades disponíveis (número, % e barra), reservas e vendas, com período hoje, 7, 30, 90 dias ou personalizado, e tabela por empreendimento.

#### Scenario: Período personalizado
- **WHEN** a incorporadora escolhe um intervalo personalizado
- **THEN** todos os números e a tabela refletem o intervalo

### Requirement: Interesse sem identificação
A área de interesse SHALL mostrar linha de acessos por dia; barras por empreendimento com acessos, usuários únicos, recorrentes (2+ visualizações) e investidores interessados; e KPIs de acessos hoje e média de visualizações por usuário. Nomes de compradores MUST NOT aparecer. O texto de privacidade SHALL explicar a contagem.

#### Scenario: Sem nomes
- **WHEN** a incorporadora abre o interesse de um empreendimento
- **THEN** vê apenas números, sem nome, e-mail ou telefone

### Requirement: Gráficos acessíveis
Cada gráfico SHALL ter uma única escala, sem eixo duplo, com legenda e tabela alternativa.

#### Scenario: Leitor de tela
- **WHEN** um usuário de leitor de tela chega a um gráfico
- **THEN** pode acessar a tabela com os mesmos dados

### Requirement: Dashboards
Os dashboards SHALL cobrir acessos, interações, leads direcionados, contatos liberados, visitas, propostas, vendas, VGV, resultado por empreendimento, venda por origem, interesse dos compradores, acessos e estoque por empreendimento e comercial, com filtro Hoje.

#### Scenario: Filtro Hoje
- **WHEN** a incorporadora aplica o filtro Hoje
- **THEN** todos os dashboards mostram só os dados do dia

### Requirement: Leads da plataforma
A incorporadora SHALL acompanhar o lead da busca somente leitura e editar o lead de mídia que sua equipe atende.

#### Scenario: Lead de busca
- **WHEN** a incorporadora abre um lead vindo da busca com contato liberado
- **THEN** vê os dados liberados sem opção de edição
