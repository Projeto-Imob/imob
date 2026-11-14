## Purpose

Dar ao comprador login rápido sem perda do que fez como visitante e um painel para acompanhar visitas e propostas, controlar a privacidade e ajustar as preferências.

## ADDED Requirements

### Requirement: Login rápido
O login SHALL oferecer "Continuar com seu e-mail" ou conta existente, com e-mail e senha e recuperação de senha. Login social MUST ficar desligado até o registro completo.

#### Scenario: Recuperar senha
- **WHEN** o comprador pede recuperação de senha
- **THEN** recebe o fluxo de redefinição no e-mail informado

### Requirement: Incorporação do histórico de visitante
No login, o histórico anônimo, as respostas e os favoritos locais SHALL passar para a conta.

#### Scenario: Favoritos locais
- **WHEN** um visitante com respostas salvas no navegador faz login
- **THEN** o perfil da conta recebe essas respostas e o histórico anônimo fica vinculado à conta

### Requirement: Painel de visitas e propostas
`/conta` SHALL listar visitas e propostas enviadas com status, próximo passo, contraproposta e opção de cancelar.

#### Scenario: Contraproposta recebida
- **WHEN** a incorporadora faz contraproposta
- **THEN** o painel mostra a contraproposta com os novos valores

### Requirement: Privacidade no painel
A área de privacidade SHALL mostrar consentimentos por empreendimento (versão e data), permitir revogar, baixar os dados em JSON, apagar o histórico, pausar alertas e excluir a conta com confirmação.

#### Scenario: Excluir conta
- **WHEN** o comprador confirma a exclusão
- **THEN** a conta é desativada, os dados pessoais são anonimizados e os registros financeiros permanecem

### Requirement: Configurações
As configurações SHALL permitir editar perfil, mudar senha, refazer o questionário, escolher modo padrão, notificações e localização.

#### Scenario: Refazer questionário
- **WHEN** o comprador escolhe refazer o questionário
- **THEN** o questionário recomeça e o novo perfil substitui o anterior ao concluir
