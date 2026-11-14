## Purpose

Adaptar a página inicial ao momento do comprador — novo, explorando, com perfil ou negociando — para levá-lo ao próximo passo útil.

## ADDED Requirements

### Requirement: Estado da home determinístico
O estado da home SHALL ser escolhido por uma função pura a partir de usuário, eventos, perfil, favoritos e visitas, entre `novo`, `navegou`, `perfil`, `ativo` e `negociando`.

#### Scenario: Visita agendada
- **WHEN** o comprador tem visita agendada
- **THEN** o estado é `negociando`

#### Scenario: Primeiro acesso
- **WHEN** não há eventos, perfil, favoritos nem visitas
- **THEN** o estado é `novo`

### Requirement: Home no estado novo
O estado `novo` SHALL mostrar hero com a promessa do modo (`home.hero.morar` ou `home.hero.investir`), "Descubra seu imóvel em 2 minutos", "Prefiro explorar no mapa", seletor de modo, faixa de confiança, "Como funciona" em 3 passos e rodapé com privacidade e sem CRECI. Destaques (C13), indicadores de bairros (C5) e prova social (C6) MUST ficar desligados até a decisão de Matheus.

#### Scenario: Blocos pendentes
- **WHEN** as decisões C5, C6 e C13 não foram tomadas
- **THEN** a home não exibe indicadores de bairros, depoimentos nem destaques

### Requirement: Home no estado navegou
O estado `navegou` SHALL mostrar "Continue de onde parou" e convite ao questionário.

#### Scenario: Questionário incompleto
- **WHEN** o visitante parou na pergunta 4
- **THEN** "Continue de onde parou" leva à pergunta 4

### Requirement: Home nos estados perfil e ativo
Os estados `perfil` e `ativo` SHALL mostrar "Seus imóveis", "O que mudou nos seus favoritos" e "Novos no seu perfil".

#### Scenario: Mudança em favorito
- **WHEN** um favorito teve mudança de preço
- **THEN** ele aparece em "O que mudou nos seus favoritos"

### Requirement: Home no estado negociando
O estado `negociando` SHALL mostrar o status da visita ou proposta e o gerente.

#### Scenario: Proposta em análise
- **WHEN** o comprador tem proposta em análise
- **THEN** a home mostra o status da proposta e o cartão do gerente

### Requirement: Fechamento do início
A home SHALL encerrar com "MIRAR NO AGORA PRA CHEGAR LONGE."

#### Scenario: Rodapé da home
- **WHEN** a home é exibida
- **THEN** o fechamento aparece antes do rodapé
