## Purpose

Transformar as respostas do questionário em 2 a 3 opções com nota determinística, auditável e imparcial, explicando o motivo sem inventar números nem promessas.

## ADDED Requirements

### Requirement: Filtros da recomendação
O conjunto candidato SHALL partir da base elegível e aplicar: pronto para morar (status "pronto" ou entrega vencida) quando "agora"; região por bairro, vizinho acrescentado ou raio de 5 km (Proposta) em "Perto de mim", sem filtro se vazia; permuta quando "sim"; todas as comodidades marcadas entre quem tem o dado; unidade disponível com os quartos escolhidos (4 vale para 4 ou mais); e plano que cabe na entrada e na parcela informadas.

#### Scenario: Quatro ou mais quartos
- **WHEN** o comprador escolhe "4 ou mais"
- **THEN** empreendimentos com unidade disponível de 4 ou 5 dormitórios são compatíveis

### Requirement: Exigência por plano
Para cada plano, entrada SHALL ser preço × sinal% e parcela preço × mensais% ÷ número de parcelas (nula sem número de parcelas). Só "À vista" marcado, ou sem planos, a entrada é o preço inteiro. O plano cabe quando entrada exigida ≤ entrada informada e, havendo parcela máxima, a parcela existe e é ≤ a ela. A melhor exigência é a de menor entrada; no empate, a de menor preço.

#### Scenario: Parcela acima do limite
- **WHEN** a parcela exigida é R$ 3.200 e a parcela máxima informada é R$ 3.000
- **THEN** o plano não cabe

### Requirement: Nota determinística de 0 a 100
A nota SHALL ser a média ponderada só dos componentes com dado, com pesos reponderados: financeiro 0,35, tipologia 0,25, localização 0,20, requisitos 0,10 e comportamento 0,10, com as fórmulas da especificação. A nota MUST NOT ser calculada por IA, e os parâmetros marcados Proposta SHALL ficar em configuração.

#### Scenario: Sem dado financeiro
- **WHEN** o comprador não informa entrada nem parcela
- **THEN** o componente financeiro fica fora da conta e os demais pesos são reponderados

#### Scenario: Mesmo perfil, mesma nota
- **WHEN** o mesmo perfil é avaliado duas vezes contra o mesmo cadastro
- **THEN** as notas e componentes são idênticos

### Requirement: Imparcialidade
Vitrine Destacada, pagamento de cliente, comissão, verba, nome da incorporadora e destaque MUST NOT influenciar nota nem ordem. No empate, a ordem SHALL vir de sorteio fixo derivado do perfil e do empreendimento.

#### Scenario: Troca de comissão
- **WHEN** a comissão de um empreendimento é alterada e o mesmo perfil é reavaliado
- **THEN** nota e ordem permanecem iguais

#### Scenario: Empate
- **WHEN** dois empreendimentos têm a mesma nota
- **THEN** a ordem entre eles é sempre a mesma para aquele perfil e pode variar entre perfis

### Requirement: Escolha de 2 a 3 opções
Só entram opções com nota ≥ 50 (Proposta). O sistema SHALL mostrar as 2 melhores e a terceira só se estiver a até 15 pontos da primeira (Proposta). Sem opção acima da nota mínima, MUST dizer isso em vez de forçar uma indicação.

#### Scenario: Terceira distante
- **WHEN** as notas são 88, 80 e 70
- **THEN** só as duas primeiras são exibidas

#### Scenario: Nenhuma acima do mínimo
- **WHEN** todas as notas são menores que 50
- **THEN** o resultado informa que não há opção acima da nota mínima, sem exibir indicação forçada

### Requirement: Motivo por template
Cada opção SHALL ter motivo de até 140 caracteres gerado de templates a partir do componente de maior peso × nota, juntando o segundo se couber. Marcador sem valor MUST remover a frase inteira. Sem componente com dado, o motivo SHALL ser "{nome} fica em {bairro} e tem unidade disponível no seu perfil."

#### Scenario: Limite de caracteres
- **WHEN** a junção de duas frases passa de 140 caracteres
- **THEN** só a primeira frase é usada

### Requirement: IA opcional e restrita
A IA SHALL ficar desligada até a escolha do modelo por Matheus. Quando ligada, MUST ser chamada só pelo servidor, receber só campos do cadastro com marcadores no lugar de números, e o sistema SHALL interpolar os valores depois. Falha ou demora acima de 5 s MUST usar o template. O motivo SHALL ficar em cache por perfil, empreendimento e data de atualização.

#### Scenario: Tempo esgotado
- **WHEN** a IA não responde em 5 s
- **THEN** o motivo de template é exibido

#### Scenario: Número inventado
- **WHEN** a resposta da IA contém um número literal
- **THEN** o motivo é descartado e o template é usado

### Requirement: Gravação para auditoria
O resultado SHALL ser gravado com nota, componentes, pesos e motivo, para auditoria e para "Por que estou vendo isso?".

#### Scenario: Consulta posterior
- **WHEN** o comprador reabre o resultado no dia seguinte
- **THEN** vê as mesmas notas e componentes gravados
