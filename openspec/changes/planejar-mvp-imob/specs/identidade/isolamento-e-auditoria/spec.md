## Purpose

Garantir que cada tenant veja só os próprios dados, que acessos privilegiados sejam somente leitura quando exigido e que toda ação sensível deixe rastro imutável.

## ADDED Requirements

### Requirement: Isolamento por tenant no banco
Toda tabela exposta SHALL ter política de acesso por linha baseada no tenant e no papel da conta, sendo essa a fonte da verdade de autorização. Dados sensíveis (comissão, escritório, contatos de lead) MUST ficar em tabelas separadas com políticas próprias.

#### Scenario: Incorporadora consulta outra
- **WHEN** um usuário da incorporadora A consulta diretamente atendimentos da incorporadora B
- **THEN** a consulta retorna zero linhas

### Requirement: Campos protegidos contra alteração
Os campos de papel, tenant e responsável de uma conta ou atendimento MUST NOT ser alterados por atualização comum; a mudança SHALL ocorrer só por operações autorizadas.

#### Scenario: Troca do próprio tenant
- **WHEN** um usuário tenta atualizar o próprio `tenant_id`
- **THEN** o banco recusa a alteração

### Requirement: Contexto validado no servidor
Toda ação de servidor SHALL validar o usuário autenticado, carregar conta, tenant, produtos e impersonate, ler o tenant só desse contexto (nunca de corpo, URL ou cabeçalho) e validar a entrada com schema estrito.

#### Scenario: Tenant injetado no corpo
- **WHEN** uma requisição envia `tenant_id` de outro tenant no corpo
- **THEN** o valor é ignorado e a operação usa o tenant do contexto

### Requirement: 404 para recurso de outro tenant
Pedidos por id de recurso de outro tenant SHALL responder 404, não 403.

#### Scenario: Id de empreendimento alheio
- **WHEN** a incorporadora A abre a URL de edição de um empreendimento da incorporadora B
- **THEN** recebe página "não encontrado"

### Requirement: Isolamento comercial entre incorporadoras
Uma incorporadora MUST NOT ver a etapa, a visita, a proposta ou as opções que um comprador tem com outra incorporadora.

#### Scenario: Comprador com duas visitas
- **WHEN** um comprador agendou visitas em empreendimentos das incorporadoras A e B
- **THEN** a incorporadora A vê só a visita no próprio empreendimento

### Requirement: Rota não autoriza dados
A camada de roteamento SHALL apenas renovar a sessão e redirecionar; a autorização de dados MUST ocorrer no banco e nas ações de servidor.

#### Scenario: Rota protegida sem sessão
- **WHEN** um visitante sem sessão abre `/conta`
- **THEN** é redirecionado ao login com retorno para `/conta`

### Requirement: Chave de serviço restrita
A chave secreta do banco SHALL ficar num único módulo exclusivo de servidor, importável só por uma lista permitida de arquivos, e MUST NOT ser usada para ler dados em nome de usuário. Um teste MUST falhar se for importada fora da lista.

#### Scenario: Importação indevida
- **WHEN** um componente fora da lista importa o módulo da chave secreta
- **THEN** o teste de importação falha

### Requirement: Impersonate só leitura
Impersonate SHALL estar disponível só a `internal_admin`, `internal_superadmin` e `god_mode`, com motivo obrigatório, alvo só de papel de cliente, sem troca de token, somente leitura por padrão, duração máxima de 30 minutos e faixa fixa "Você está vendo como [nome]". Nunca SHALL mudar papéis, usuários, tenant, consentimento ou cobrança, nem excluir.

#### Scenario: Escrita durante impersonate
- **WHEN** um `internal_admin` em impersonate tenta salvar uma nota de CRM
- **THEN** a operação é recusada e a tentativa é auditada

#### Scenario: Expiração
- **WHEN** passam 30 minutos desde o início do impersonate
- **THEN** a sessão de impersonate termina e a faixa desaparece

### Requirement: God mode só lê dado de cliente
O god mode SHALL ler dados de clientes e MUST NOT criar, editar ou excluir dados de incorporadoras, house, compradores ou investidores, nem em impersonate. Navegar como cliente MUST NOT gerar acesso, clique, evento ou última visita.

#### Scenario: God mode navega como comprador
- **WHEN** o god mode abre a página de um empreendimento em impersonate de comprador
- **THEN** nenhum evento, visualização ou última visita é registrado

### Requirement: Auditoria imutável
O sistema SHALL registrar em log imutável (sem atualização, exclusão ou truncamento para ninguém) alterações de verba, comissão, proposta, contrato, exclusão, papéis, situação do tenant, produtos, configuração global e consentimentos, além de aberturas de dados de tenant ou de contato de lead por papel interno ou god mode e mudanças de papel negadas. O log MUST guardar ids, não contatos.

#### Scenario: Analista abre contato
- **WHEN** uma `internal_seller` abre o WhatsApp de um lead
- **THEN** a auditoria registra conta, lead e momento, sem o número

#### Scenario: Tentativa de apagar auditoria
- **WHEN** qualquer papel tenta excluir uma linha da auditoria
- **THEN** o banco recusa
