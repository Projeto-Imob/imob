## Purpose

Definir quem pode existir no sistema, como cada conta entra, que papel exerce e quais limites protegem a hierarquia de papéis entre tenants de incorporadora, a plataforma e o comprador.

## ADDED Requirements

### Requirement: Tenants e situação
O sistema SHALL ter tenants dos tipos `incorporadora` (inclui construtora) e `plataforma`, com situação `implantacao`, `ativo`, `suspenso` ou `encerrado`. Contas da equipe da plataforma e `buyer` MUST ter tenant nulo. Só `internal_superadmin` SHALL criar, suspender e encerrar tenants.

#### Scenario: Tenant suspenso
- **WHEN** um tenant de incorporadora é suspenso
- **THEN** seus usuários não acessam a área da incorporadora e seus empreendimentos saem da vitrine

### Requirement: Papéis disponíveis
O sistema SHALL suportar os papéis `anon`, `buyer`, `client_superadmin`, `client_manager`, `sales_member`, `internal_seller`, `internal_account_manager`, `internal_admin`, `internal_superadmin` e `god_mode`. O papel MUST ser lido do cadastro de contas do produto, nunca de dados de perfil editáveis pelo usuário nem do conteúdo da sessão ou do token.

#### Scenario: Dado de perfil adulterado
- **WHEN** um usuário altera um dado do próprio perfil para indicar `internal_admin`
- **THEN** o sistema continua tratando a conta pelo papel registrado na tabela de contas

### Requirement: Cadastro público só cria comprador
O cadastro público SHALL criar só contas `buyer`. Os demais papéis MUST entrar por convite com expiração.

#### Scenario: Convite de gerente
- **WHEN** um `client_superadmin` convida alguém como gerente de produtos
- **THEN** a pessoa recebe o convite e, ao aceitar, entra com `client_manager` no tenant de quem convidou

### Requirement: Conta única de god mode
Nenhuma tela ou API SHALL criar `god_mode`. A conta MUST ser criada por script de bootstrap executado por Matheus, sem credenciais versionadas, e uma restrição única no banco MUST impedir uma segunda conta.

#### Scenario: Segunda conta god mode
- **WHEN** alguém tenta inserir uma segunda conta com papel `god_mode`
- **THEN** o banco recusa a inserção

### Requirement: MFA para papéis internos
`god_mode` e todos os papéis `internal_*` SHALL exigir sessão com segundo fator de autenticação verificado para acessar dados.

#### Scenario: Analista sem segundo fator
- **WHEN** uma `internal_seller` entra só com senha
- **THEN** o sistema exige o segundo fator antes de mostrar a fila de leads

### Requirement: Limites de concessão de papel
Ninguém SHALL conceder papel igual ou superior ao próprio, mudar o próprio papel ou remover o último `client_superadmin` de um tenant. As regras MUST ser aplicadas no banco e tentativas negadas MUST ir para a auditoria.

#### Scenario: Remoção do último dono
- **WHEN** o único `client_superadmin` de um tenant tenta se rebaixar a `client_manager`
- **THEN** a operação é recusada e registrada na auditoria

### Requirement: Permissões do gerente de produtos
`client_manager` SHALL editar os empreendimentos e o espelho do próprio tenant, exceto R.I. e comissão.

#### Scenario: Gerente tenta alterar comissão
- **WHEN** um `client_manager` tenta alterar a comissão de um empreendimento
- **THEN** a operação é recusada

### Requirement: Desligamento na house
Ao desligar alguém da house, a conta SHALL ser desativada e seus leads e histórico MUST ser transferidos a outra pessoa da house ou devolvidos à fila.

#### Scenario: Analista desligada com leads
- **WHEN** uma analista com 12 leads é desligada sem destino escolhido
- **THEN** a conta fica inativa e os 12 leads voltam à fila da house com o histórico preservado

### Requirement: Exclusão como anonimização
Excluir um cliente SHALL desativar a conta e anonimizar os dados pessoais, mantendo registros financeiros, e MUST exigir permissão restrita.

#### Scenario: Exclusão de comprador com proposta
- **WHEN** um comprador com proposta registrada é excluído
- **THEN** nome e contatos são anonimizados e o registro da proposta permanece
