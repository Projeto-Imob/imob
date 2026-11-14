## Purpose

Mostrar ao comprador tudo o que ele precisa para decidir pela visita — custos reais, unidades, vizinhança, dados legais e quem atende — na ordem adequada a cada modo.

## ADDED Requirements

### Requirement: Ordem dos blocos no modo Morar
No modo Morar, a página SHALL seguir a ordem: galeria e selos; resumo (nome, bairro, construtora, entrega, % de obra, status de vendas); barra fixa no celular com entrada e "Agendar visita"; Seus custos; plantas e unidades; vizinhança; números do investimento permitidos; comodidades; escritório de vendas; dados legais; empreendimentos parecidos.

#### Scenario: Página em Morar
- **WHEN** o comprador abre um empreendimento no modo Morar
- **THEN** os blocos aparecem nessa ordem

### Requirement: Ordem dos blocos no modo Investir
No modo Investir, a página SHALL mostrar primeiro os números (preço/m², custo total, entrega e plano), depois custos, plano de pagamento, região e galeria. Projeção com dados da pessoa MUST levar "Projeção", a data e "Não é garantia".

#### Scenario: Página em Investir
- **WHEN** o comprador abre um empreendimento no modo Investir
- **THEN** o bloco de números é o primeiro após o resumo

### Requirement: Seus custos como estimativa
O bloco "Quanto você paga de verdade, mês a mês" SHALL mostrar sinal, mensais com o índice do plano, intercaladas, chaves, saldo, financiamento, ITBI e registro, marcados como estimativa. A fonte de ITBI e registro aguarda a decisão C7 e, até lá, esses itens SHALL aparecer como "Não informado".

#### Scenario: Unidade escolhida
- **WHEN** o comprador escolhe uma unidade
- **THEN** os valores do fluxo de cada plano são recalculados para essa unidade

### Requirement: Campo sem dado
Todo campo sem dado SHALL aparecer como "Não informado".

#### Scenario: Sem número de elevadores
- **WHEN** o cadastro não tem número de elevadores
- **THEN** a página mostra "Não informado"

### Requirement: Plantas e unidades
O bloco de plantas SHALL agrupar por tipologia, com área privativa, preço e status de cada unidade.

#### Scenario: Unidade reservada
- **WHEN** uma unidade está reservada
- **THEN** ela aparece com a área privativa, o preço e o status "reservada"

### Requirement: Vizinhança sem serviço externo
A vizinhança SHALL listar escola, parque, hospital, academia, mercado e transporte mais próximos, vindos do cadastro, com ícone, nome, distância e tempo a pé a 80 m/min, e uma frase-resumo, sem serviço pago nem IA.

#### Scenario: Tempo a pé
- **WHEN** a escola mais próxima está a 480 m
- **THEN** a página mostra "6 min a pé"

### Requirement: Escritório de vendas
O escritório SHALL mostrar nome, foto, cargo, experiência, empresa e botões WhatsApp (com mensagem pronta), e-mail e telefone de quem a incorporadora escolheu para aquele empreendimento: o plantão dela ou o gerente de contas da house, sendo a house o padrão. Se o primeiro clique de contato exige login e cria lead aguarda a decisão C3.

#### Scenario: Padrão da house
- **WHEN** a incorporadora não escolheu quem aparece
- **THEN** o escritório mostra o gerente de contas da house

### Requirement: Dados legais e selo
A página SHALL mostrar número do R.I., cartório, data do registro e patrimônio de afetação, e o selo "Incorporação registrada" no card e na página.

#### Scenario: Selo exibido
- **WHEN** o empreendimento é exibido
- **THEN** o selo "Incorporação registrada" aparece com ícone e texto

### Requirement: Favoritar e listas na página
A página SHALL ter coração para favoritar e "Adicionar à lista". "Perguntas para fazer na visita" MUST NOT ficar na página; vai para a confirmação da visita.

#### Scenario: Adicionar à lista
- **WHEN** o comprador logado toca em "Adicionar à lista"
- **THEN** escolhe uma lista existente ou cria uma nova

### Requirement: Empreendimentos parecidos
A seção de parecidos SHALL usar os mesmos critérios imparciais da busca e só a base elegível.

#### Scenario: Parecido patrocinado
- **WHEN** um empreendimento parecido está na Vitrine Destacada
- **THEN** ele aparece na mesma posição que teria sem destaque, com o selo de espaço pago

### Requirement: Interesse no empreendimento pendente
O bloco de interesse no empreendimento SHALL ficar desligado até a decisão C4 de Matheus.

#### Scenario: Bloco desligado
- **WHEN** a flag de interesse está desligada
- **THEN** a página não mostra quantas pessoas visitaram o empreendimento
