## Purpose

Operar e prestar contas do projeto de mídia contratado à parte pela incorporadora, com leads exclusivos dela e indicadores de investimento por campanha e canal.

## ADDED Requirements

### Requirement: Produto contratado por tenant
A área de projeto de mídia SHALL aparecer só para a equipe da plataforma e para incorporadoras com o produto `projeto_midia` ativo.

#### Scenario: Sem contrato
- **WHEN** uma incorporadora sem o produto abre o menu
- **THEN** a área de projeto de mídia não aparece e a rota responde "não encontrado"

### Requirement: Verba e gasto
O sistema SHALL registrar verba aportada, gasto e saldo, com lançamento manual de gasto por campanha, e toda alteração de verba MUST ser auditada.

#### Scenario: Lançamento de gasto
- **WHEN** a equipe lança R$ 1.000 de gasto numa campanha
- **THEN** o saldo diminui R$ 1.000 e a auditoria registra a mudança

### Requirement: Campanhas com R.I. conferido
Campanhas SHALL ser cadastradas por empreendimento e canal, com período e gasto. Ativar campanha MUST exigir a conferência do R.I. do empreendimento.

#### Scenario: Empreendimento sem R.I.
- **WHEN** a equipe tenta ativar campanha de empreendimento sem R.I.
- **THEN** a ativação é recusada

### Requirement: Lead de campanha exclusivo
O lead com `utm` de campanha SHALL ser exclusivo da incorporadora da campanha, atendido pela equipe de vendas dela ou pela house, e ver só empreendimentos dela.

#### Scenario: Atribuição
- **WHEN** um lead chega pela campanha da incorporadora A
- **THEN** ele aparece no CRM de A como lead de mídia editável pela equipe dela

### Requirement: Indicadores de mídia
A área SHALL mostrar leads, CPL, CAC, ROI por canal, leads por R$ 1.000, funil e curva de conversão por campanha, e venda atribuída ao canal.

#### Scenario: CPL
- **WHEN** uma campanha gastou R$ 2.000 e gerou 40 leads
- **THEN** o CPL exibido é R$ 50
