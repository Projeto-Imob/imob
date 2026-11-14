## Purpose

Levar a negociação para dentro do sistema — proposta, reserva, contrato e venda — atualizando espelho, comissão e indicadores com rastreabilidade (Épico 2).

## ADDED Requirements

### Requirement: Proposta do comprador
A proposta SHALL conter unidade, valor, formas de pagamento, validade e consentimento, e MUST informar que não tem efeito jurídico. O formato exato de envio aguarda a decisão C10.

#### Scenario: Envio de proposta
- **WHEN** um comprador logado envia proposta para uma unidade disponível
- **THEN** a proposta é registrada, o contato é liberado à incorporadora daquele empreendimento e a auditoria registra o evento

### Requirement: Resposta da incorporadora
A incorporadora SHALL aceitar, recusar com motivo obrigatório ou fazer contraproposta.

#### Scenario: Recusa sem motivo
- **WHEN** a incorporadora tenta recusar sem motivo
- **THEN** a operação é recusada

### Requirement: Reserva com prazo
A reserva de unidade SHALL ter prazo e MUST ser liberada automaticamente ao vencer, com movimento no histórico do espelho.

#### Scenario: Reserva vencida
- **WHEN** o prazo de uma reserva acaba sem contrato
- **THEN** a unidade volta a disponível e um movimento é registrado

### Requirement: Contrato
O contrato da incorporadora SHALL ser anexado com status e data de assinatura. A assinatura eletrônica por provedor externo MUST ficar desligada até a aprovação de custo de Matheus.

#### Scenario: Contrato anexado
- **WHEN** a incorporadora anexa o contrato assinado
- **THEN** o atendimento mostra o contrato com status e data

### Requirement: Registro de venda
Registrar a venda SHALL atualizar o espelho, a comissão devida e os dashboards. A comissão SHALL usar o percentual negociado vigente; vendas já registradas MUST manter o valor se o percentual mudar.

#### Scenario: Percentual alterado depois
- **WHEN** a comissão do empreendimento muda de 4% para 5% após uma venda registrada
- **THEN** a comissão da venda já registrada permanece em 4%

### Requirement: Conferência de vendas
A equipe SHALL poder registrar venda manualmente e conferir periodicamente com a lista de vendas da incorporadora.

#### Scenario: Divergência
- **WHEN** a lista da incorporadora tem uma venda não registrada no sistema
- **THEN** a conferência aponta a divergência
