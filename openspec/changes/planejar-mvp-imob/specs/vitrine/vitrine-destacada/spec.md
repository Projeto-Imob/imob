## Purpose

Permitir que a incorporadora compre destaque visual para um empreendimento, sem nenhum efeito sobre a nota, a ordem ou a busca.

## ADDED Requirements

### Requirement: Planos e ativação
A Vitrine Destacada SHALL ser comprada por empreendimento, à parte da verba de mídia, nos planos mensal (30 dias), semestral (180) ou anual (360), contados do pagamento. A equipe SHALL confirmar o pagamento e ativar, com valor obrigatório. Valores e número de vagas aguardam a decisão de Matheus.

#### Scenario: Ativação sem valor
- **WHEN** a equipe tenta ativar um destaque sem valor
- **THEN** a ativação é recusada

### Requirement: Limite de vagas e expiração
O destaque SHALL respeitar o limite configurado de vagas e terminar sozinho ao fim do período.

#### Scenario: Vagas esgotadas
- **WHEN** todas as vagas estão ocupadas e a equipe tenta ativar outro destaque
- **THEN** a ativação é recusada

#### Scenario: Fim do período
- **WHEN** passam 30 dias de um plano mensal
- **THEN** o destaque deixa de ser exibido

### Requirement: Elegibilidade do destaque
Só empreendimento publicado, com R.I. e vendas abertas SHALL receber destaque. Se sair do ar ou esgotar, o destaque MUST sumir.

#### Scenario: Esgotou durante o destaque
- **WHEN** um empreendimento destacado esgota
- **THEN** o destaque deixa de aparecer

### Requirement: Destaque só visual
O destaque SHALL ser só visual: cor diferente e estrela no mapa e etiqueta de espaço pago no card. Ele MUST NOT alterar ordem, nota ou busca.

#### Scenario: Ordem inalterada
- **WHEN** um destaque é ativado para um empreendimento do resultado
- **THEN** a ordem e as notas do resultado não mudam e o card ganha a etiqueta de espaço pago
