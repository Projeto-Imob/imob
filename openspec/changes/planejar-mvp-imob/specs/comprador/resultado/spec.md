## Purpose

Apresentar ao comprador as opções recomendadas de forma transparente, com a explicação da nota, o caminho direto para a visita e o atendimento com nome.

## ADDED Requirements

### Requirement: Resumo do perfil
A tela "Seus imóveis" SHALL abrir com um resumo do perfil numa linha, com chips que voltam à pergunta correspondente.

#### Scenario: Ajustar quartos
- **WHEN** o comprador toca no chip de quartos
- **THEN** volta à pergunta de quartos com as demais respostas preservadas

### Requirement: Cards das opções
O resultado SHALL exibir de 2 a 3 cards com foto, nome, bairro, nota de 0 a 100, motivo, entrada mais parcela, selos (incluindo "Incorporação registrada"), "Agendar visita" e "Ver detalhes".

#### Scenario: Card exibido
- **WHEN** o resultado tem duas opções
- **THEN** cada card mostra todos os elementos listados

### Requirement: Por que estou vendo isso
"Por que estou vendo isso?" SHALL mostrar cada componente com peso, nota, detalhe e o que ficou fora da conta, a partir do resultado gravado.

#### Scenario: Componente fora da conta
- **WHEN** o comprador não informou quartos e abre a explicação
- **THEN** o componente tipologia aparece como fora da conta

### Requirement: Ver no mapa
"Ver no mapa" SHALL abrir `/mapa` com os filtros do questionário.

#### Scenario: Abrir mapa do resultado
- **WHEN** o comprador toca em "Ver no mapa"
- **THEN** o mapa abre com os filtros do perfil aplicados e o evento correspondente é registrado

### Requirement: Cartão do gerente
O resultado SHALL exibir o cartão do gerente com nome, foto, cargo, WhatsApp, e-mail e telefone.

#### Scenario: Cartão visível
- **WHEN** o resultado é exibido
- **THEN** o cartão do gerente aparece com os três canais de contato

### Requirement: Aviso de base
O resultado SHALL informar que as indicações vêm só dos empreendimentos da base da plataforma.

#### Scenario: Aviso exibido
- **WHEN** o resultado é exibido
- **THEN** o aviso sobre a base da plataforma aparece abaixo dos cards
