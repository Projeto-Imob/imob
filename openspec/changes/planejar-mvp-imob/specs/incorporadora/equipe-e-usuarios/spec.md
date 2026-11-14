## Purpose

Permitir que a incorporadora mantenha sua equipe de vendas (plantão) e seus usuários de sistema, e escolha quem atende em cada empreendimento.

## ADDED Requirements

### Requirement: Cadastro da equipe de vendas
Cada pessoa do plantão SHALL ter nome, cargo, empresa, CRECI opcional, WhatsApp, e-mail e situação.

#### Scenario: Sem CRECI
- **WHEN** a incorporadora cadastra alguém sem CRECI
- **THEN** o cadastro é aceito

### Requirement: Equipe por empreendimento
Cada empreendimento SHALL ter card de equipe com a lista, o responsável e o rodízio, e a escolha de quem aparece no escritório de vendas (plantão ou gerente de contas da house, padrão house).

#### Scenario: Trocar para plantão
- **WHEN** a incorporadora escolhe o plantão para um empreendimento
- **THEN** a página pública passa a mostrar o responsável do plantão

### Requirement: Importação CSV tudo ou nada
A importação SHALL oferecer modelo para baixar, prévia com erro por linha e gravação tudo ou nada.

#### Scenario: Linha inválida
- **WHEN** o arquivo tem uma linha com e-mail inválido
- **THEN** a prévia aponta a linha e nada é gravado

### Requirement: Exportação CSV
A exportação SHALL gerar CSV em UTF-8 com BOM e separador ";".

#### Scenario: Abrir no Excel
- **WHEN** a equipe é exportada
- **THEN** o arquivo abre com acentos corretos e colunas separadas por ";"

### Requirement: Usuários da incorporadora
Só `client_superadmin` SHALL convidar usuários, escolher gerente ou plantão e desativá-los.

#### Scenario: Gerente tenta convidar
- **WHEN** um `client_manager` tenta convidar um usuário
- **THEN** a operação é recusada
