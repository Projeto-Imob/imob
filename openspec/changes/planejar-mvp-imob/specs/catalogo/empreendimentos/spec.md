## Purpose

Manter a ficha padronizada de cada empreendimento — cadastro em 4 etapas, subcondomínios, tipologias, unidades, planos, comissão e mídias — como única fonte de dados para a busca, a página do comprador e os indicadores.

## ADDED Requirements

### Requirement: Cadastro em 4 etapas com salvamento automático
O cadastro SHALL ter as etapas Empreendimento, Subcondomínios, Tipologias e Revisar, salvando sozinho a cada mudança após 800 ms sem digitação e anunciando "Salvo" para tecnologia assistiva.

#### Scenario: Edição de campo
- **WHEN** o usuário altera a descrição e para de digitar
- **THEN** o rascunho é salvo e o indicador "Salvo" é anunciado

### Requirement: Etapa Empreendimento
A etapa 1 SHALL coletar nome (obrigatório, mínimo 4 caracteres), CNPJ opcional no formato 00.000.000/0000-00, R.I. (opcional no cadastro), tipo (Novo ou Terceiro/Classificado), visibilidade (Ativo, Não listado, Exclusivo), descrição, vídeos, foto de capa, link do mapa interativo e etapas de obra com nome e %.

#### Scenario: Nome curto
- **WHEN** o usuário informa um nome com 3 caracteres
- **THEN** o campo mostra erro de mínimo de 4 caracteres

#### Scenario: CNPJ inválido
- **WHEN** o usuário informa um CNPJ fora do formato
- **THEN** o campo mostra erro de formato

### Requirement: Visibilidade
"Não listado" SHALL ficar fora da vitrine e abrir por link só para quem tem login; "Exclusivo" SHALL ficar visível só para a house, fora do mapa e da busca.

#### Scenario: Link de não listado sem login
- **WHEN** um visitante sem login abre o link de um empreendimento não listado
- **THEN** recebe página "não encontrado" com convite ao login

### Requirement: Subcondomínios
Todo empreendimento SHALL ter ao menos um subcondomínio com nome, status (Na planta, Em obra, Pronto, 100% vendido), grupo, pavimentos, elevadores, datas de lançamento e entrega, endereço (endereço e número obrigatórios; estado e cidade de lista oficial do IBGE), pin no mapa e infraestrutura do catálogo editável mais "Outros itens".

#### Scenario: Sem endereço
- **WHEN** o usuário tenta avançar com um subcondomínio sem número
- **THEN** o campo número é marcado como obrigatório

#### Scenario: Localizar no mapa
- **WHEN** o usuário clica em "Localizar no mapa"
- **THEN** o mapa centraliza na cidade escolhida, sem geocodificação externa, e o pin é ajustado por clique ou arraste

### Requirement: Preenchimento por CEP condicionado
O preenchimento de endereço por CEP SHALL ser feito no servidor e MUST ficar desligado até a aprovação de Matheus do serviço externo.

#### Scenario: Serviço não aprovado
- **WHEN** a flag do serviço de CEP está desligada
- **THEN** os campos de endereço são preenchidos à mão, sem chamada externa

### Requirement: Tipologias
Cada tipologia SHALL ter nome, tipo da lista residencial, comercial ou terreno da especificação, finalidade (Venda; Aluguel; Venda e/ou aluguel), planta baixa, dormitórios, suítes, suítes master, banheiros, lavabos, vagas e ao menos um subcondomínio vinculado. O sistema SHALL permitir clonar uma tipologia existente.

#### Scenario: Tipologia sem subcondomínio
- **WHEN** alguém salva uma tipologia sem subcondomínio vinculado
- **THEN** o banco recusa

### Requirement: Revisão do cadastro
A etapa Revisar SHALL resumir as etapas com "Editar" em cada bloco e o botão "Ir para empreendimentos".

#### Scenario: Editar a partir da revisão
- **WHEN** o usuário clica em "Editar" no bloco de subcondomínios
- **THEN** volta à etapa 2 com os dados preservados

### Requirement: Espelho de unidades com histórico
As unidades SHALL ter área privativa, preço e status disponível, reservada ou vendida. Toda mudança MUST gerar um movimento num histórico somente de inserção.

#### Scenario: Unidade vendida
- **WHEN** o gerente marca uma unidade como vendida
- **THEN** um movimento com antes, depois, autor e data é acrescentado ao histórico

### Requirement: Planos de pagamento como dados
Os planos SHALL registrar sinal, mensais com número de parcelas, intercaladas, chaves, saldo e índice de correção, e as condições de financiamento (aceita, momento, % máximo, FGTS, dação e parcelamento direto).

#### Scenario: Plano sem número de parcelas
- **WHEN** um plano tem mensais em % mas não tem número de parcelas
- **THEN** a parcela calculada para esse plano é nula

### Requirement: Comissão editável e protegida
A comissão SHALL ficar num campo editável por empreendimento. Depois da publicação, só a equipe da plataforma MAY alterar R.I. e comissão, e toda alteração MUST ser auditada.

#### Scenario: Incorporadora altera R.I. publicado
- **WHEN** um `client_superadmin` tenta alterar o R.I. de um empreendimento publicado
- **THEN** a operação é recusada

### Requirement: Fase de venda calculada
A fase de venda SHALL ser calculada, sem campo próprio: data de lançamento futura é pré-lançamento; todos os subcondomínios 100% vendidos é esgotado.

#### Scenario: Último subcondomínio vendido
- **WHEN** o último subcondomínio disponível chega a 100% vendido
- **THEN** o empreendimento passa a ser exibido como esgotado sem edição manual

### Requirement: Mídias
Imagens SHALL aceitar só JPG, PNG e WebP de até 10 MB, sem SVG, gravadas em armazenamento separado por tenant e empreendimento; arquivos não publicados MUST ser acessíveis só a quem tem permissão. Vídeos SHALL aceitar só links do YouTube validados, embutidos pelo domínio sem cookies, e o embed MUST ficar desligado até a aprovação de Matheus.

#### Scenario: Upload de SVG
- **WHEN** o usuário envia um arquivo SVG como foto
- **THEN** o upload é recusado com a lista de formatos aceitos

#### Scenario: Embed não aprovado
- **WHEN** a flag de embed está desligada
- **THEN** o vídeo aparece como link externo, sem iframe

### Requirement: Registro de mudanças de cadastro
Mudanças de preço, % de obra, status e unidades SHALL ser registradas automaticamente como mudança de cadastro, para alimentar alertas e a home.

#### Scenario: Preço alterado
- **WHEN** o preço "a partir de" de um empreendimento muda
- **THEN** uma mudança de cadastro com valor anterior e novo é registrada

### Requirement: Abas pós-cadastro
Depois do cadastro, o empreendimento SHALL ter as abas Tabela de vendas, Condições comerciais, Comissão, Localização (pontos próximos com categoria e distância) e Equipe de vendas.

#### Scenario: Aba Comissão para gerente
- **WHEN** um `client_manager` abre o empreendimento
- **THEN** vê a aba Comissão somente leitura
