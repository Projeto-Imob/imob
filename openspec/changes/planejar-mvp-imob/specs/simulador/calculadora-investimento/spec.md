## Purpose

Oferecer ao investidor uma calculadora que usa apenas números digitados por ele, sem indicadores de mercado e sem promessa de valorização, enquanto Matheus decide se o simulador permanece.

## ADDED Requirements

### Requirement: Simulador desligável
O simulador SHALL ficar atrás de uma flag, desligado até a decisão de Matheus sobre mantê-lo.

#### Scenario: Flag desligada
- **WHEN** a flag do simulador está desligada
- **THEN** nenhuma tela ou link do simulador aparece

### Requirement: Cálculos só com dados da pessoa
A calculadora SHALL calcular cap rate, GRM, Cash-on-Cash e ganho de capital na venda só com valores digitados pela pessoa. Aluguel MUST NOT vir pré-preenchido, e vacância e índices de mercado MUST NOT existir.

#### Scenario: Aluguel vazio
- **WHEN** a pessoa não digita o aluguel
- **THEN** cap rate, GRM e Cash-on-Cash não são exibidos

### Requirement: Texto legal e estimativa
Toda projeção SHALL exibir o texto legal validado com "Projeção", a data e "Não é garantia", e custos de compra SHALL aparecer como estimativa. A IA MUST NOT participar do simulador.

#### Scenario: Projeção calculada
- **WHEN** a pessoa calcula o ganho de capital
- **THEN** o resultado mostra o aviso de projeção com a data e "Não é garantia"
