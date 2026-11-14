## Purpose

Converter interesse em visita com o menor atrito possível, registrando o consentimento que libera o contato só à incorporadora daquele empreendimento.

## ADDED Requirements

### Requirement: Agendamento em três toques
O agendamento em `/empreendimento/{slug}/agendar` SHALL exigir só dia, horário e confirmar, com os dados do comprador já preenchidos e sem questionário.

#### Scenario: Comprador logado
- **WHEN** um comprador logado escolhe dia, horário e confirma
- **THEN** a visita é agendada em três toques

### Requirement: Login rápido e consentimento de visita
Antes de confirmar, o sistema SHALL pedir login rápido, se necessário, e registrar o consentimento de visita com a versão do texto.

#### Scenario: Visitante sem conta
- **WHEN** um visitante escolhe dia e horário e toca em confirmar
- **THEN** o login rápido é aberto e, após entrar, ele volta à confirmação com dia e horário preservados

### Requirement: Encaminhamento e liberação
A visita agendada SHALL entrar na fila da analista da house e liberar nome e contato só à incorporadora daquele empreendimento.

#### Scenario: Visita criada
- **WHEN** a visita é confirmada
- **THEN** a fila da house mostra a visita e a incorporadora dona do empreendimento vê o contato somente leitura

### Requirement: Confirmação completa
A confirmação SHALL mostrar a mensagem "Pronto! {dia}, {hora}, você conhece o seu possível novo lar. {gerente} te espera.", endereço e mapa, o gerente, "o que levar", as perguntas para fazer na visita, "Adicionar ao calendário" (arquivo `.ics`) e o aviso de lembrete por WhatsApp simulado.

#### Scenario: Adicionar ao calendário
- **WHEN** o comprador toca em "Adicionar ao calendário"
- **THEN** baixa um arquivo `.ics` com data, hora, endereço e nome do empreendimento

### Requirement: Gestão da visita pelo comprador
O comprador SHALL ver a visita no painel com status e próximo passo, e poder cancelá-la.

#### Scenario: Cancelamento
- **WHEN** o comprador cancela uma visita
- **THEN** o status muda para cancelada e a house vê a mudança na agenda
