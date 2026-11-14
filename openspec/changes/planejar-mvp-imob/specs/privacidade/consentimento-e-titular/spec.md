## Purpose

Cumprir a LGPD em todo o fluxo do comprador: consentimentos separados e versionados, liberação de contato só com interesse confirmado e por empreendimento, e atendimento aos direitos do titular.

## ADDED Requirements

### Requirement: Opt-ins separados e desmarcados
Os consentimentos de contato por WhatsApp e de compartilhamento com a incorporadora SHALL ser caixas separadas, desmarcadas por padrão.

#### Scenario: Fim do questionário
- **WHEN** o comprador chega à tela de contato
- **THEN** a caixa de opt-in de WhatsApp aparece desmarcada e separada dos campos de nome e WhatsApp

### Requirement: Liberação de contato por empreendimento
A incorporadora SHALL ver nome e contato do comprador só depois de visita agendada, contato direto ou proposta num empreendimento dela, com consentimento ativo, e só para aquele empreendimento. Antes disso, MUST ver apenas números agregados.

#### Scenario: Só respondeu ao questionário
- **WHEN** um comprador respondeu ao questionário e recebeu um empreendimento da incorporadora A como opção
- **THEN** a incorporadora A não vê nome nem contato desse comprador

#### Scenario: Visita agendada
- **WHEN** o comprador agenda visita no empreendimento X da incorporadora A, com consentimento
- **THEN** a incorporadora A passa a ver nome e contato do comprador no contexto do empreendimento X, somente leitura

### Requirement: Revogação encerra acesso
Revogar um consentimento SHALL encerrar imediatamente o acesso da incorporadora ao contato do comprador naquele empreendimento.

#### Scenario: Revogação pelo painel
- **WHEN** o comprador revoga o consentimento do empreendimento X em `/conta`
- **THEN** a incorporadora deixa de ver o contato dele no empreendimento X e a revogação é auditada

### Requirement: Registro do consentimento
Cada consentimento SHALL registrar origem, data, versão e texto aceito e, quando houver, a data de revogação.

#### Scenario: Consulta de consentimento
- **WHEN** o comprador abre a área de privacidade
- **THEN** vê cada consentimento por empreendimento com versão e data

### Requirement: Textos legais versionados
Toda edição de texto legal (consentimento, visita, interesse) SHALL criar uma nova versão. Quem aceitou uma versão anterior MUST continuar vinculado à versão aceita.

#### Scenario: Nova versão do texto de visita
- **WHEN** o texto de consentimento de visita é editado
- **THEN** novos aceites usam a versão nova e aceites antigos continuam apontando para a versão anterior

### Requirement: Posição exata não é guardada
A posição exata do usuário MUST NOT ser gravada sem consentimento; para personalização, SHALL ser guardada no máximo a cidade. "Perto de mim" SHALL usar a posição só na sessão.

#### Scenario: Perto de mim
- **WHEN** o comprador escolhe "Perto de mim" no questionário
- **THEN** a posição é usada para o filtro e não é gravada no perfil nem nos eventos

### Requirement: Direitos do titular
O comprador SHALL poder baixar seus dados em JSON, apagar o histórico, pausar alertas e excluir a conta com confirmação. A exclusão MUST anonimizar eventos e manter registros financeiros.

#### Scenario: Baixar dados
- **WHEN** o comprador pede o download dos dados
- **THEN** recebe um arquivo JSON com perfil, respostas, favoritos, alertas, visitas, propostas e consentimentos

### Requirement: Lead de campanha restrito
Um lead que chega com `utm` de campanha SHALL ver e receber opções só da incorporadora da campanha.

#### Scenario: Questionário vindo de campanha
- **WHEN** um visitante chega por link de campanha da incorporadora A e conclui o questionário
- **THEN** todas as opções exibidas são de empreendimentos da incorporadora A

### Requirement: Informação ao comprador nunca exposta
O comprador MUST NOT ver comissão, fluxo de pagamento da comissão, contrato de terceiros nem contato interno.

#### Scenario: Página do empreendimento
- **WHEN** o comprador abre qualquer empreendimento
- **THEN** nenhum dado de comissão ou contato interno é carregado na página ou na resposta da API
