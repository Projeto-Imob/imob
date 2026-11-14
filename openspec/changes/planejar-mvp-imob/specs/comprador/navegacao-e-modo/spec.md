## Purpose

Dar ao comprador uma navegação estável em cinco áreas, livre de conta até o momento de valor, e um modo Morar/Investir que reorganiza a apresentação sem esconder dados.

## ADDED Requirements

### Requirement: Cinco áreas de navegação
A navegação SHALL ter Início (`/`), Buscar Imóveis (`/buscar-imoveis`), Mapa (`/mapa`), Favoritos (`/favoritos`) e Minha conta (`/conta`), numa barra inferior fixa no celular e num menu superior fixo no desktop.

#### Scenario: Celular
- **WHEN** qualquer área é aberta em 390 px
- **THEN** a barra inferior com as cinco áreas fica visível e indica a área atual

### Requirement: Ações de contato a até 2 toques
De qualquer tela com empreendimento, "Agendar visita" e "Falar com o gerente" SHALL estar a no máximo 2 toques.

#### Scenario: A partir do mapa
- **WHEN** o comprador toca num pino do mapa
- **THEN** o card rápido leva à página do empreendimento, onde "Agendar visita" está visível

### Requirement: Estado na URL
Filtros e modo SHALL ficar na URL, para compartilhar e voltar.

#### Scenario: Link compartilhado
- **WHEN** alguém abre um link de `/mapa` com filtros e modo na URL
- **THEN** o mapa abre com os mesmos filtros e modo

### Requirement: Login só no momento de valor
Navegar, responder ao questionário, ver resultado e usar o mapa SHALL ser livres. Login MUST ser pedido só para favoritar, agendar visita, criar alerta, enviar proposta e acessar o painel.

#### Scenario: Favoritar sem conta
- **WHEN** um visitante toca no coração
- **THEN** o login rápido é aberto e, após entrar, o favorito é salvo

### Requirement: Retorno seguro após login
Depois do login, o usuário SHALL voltar à tela de origem, e o parâmetro de retorno MUST aceitar só caminhos internos.

#### Scenario: Retorno externo
- **WHEN** o parâmetro de retorno aponta para `https://exemplo.com`
- **THEN** o usuário é levado a `/` em vez do endereço externo

### Requirement: Modo global Morar/Investir
O modo SHALL ser definido pela primeira pergunta do questionário e alterável por um seletor no topo, guardado no perfil com conta ou no navegador sem conta. O modo MUST NOT esconder dados; SHALL mudar ordem dos blocos, destaques, textos e cor de apoio.

#### Scenario: Troca de modo
- **WHEN** o comprador troca de Morar para Investir na página de um empreendimento
- **THEN** os blocos são reordenados, nenhum dado desaparece e o evento de troca de modo é registrado

### Requirement: Card por modo
No modo Morar, o card SHALL destacar entrada, parcela mensal, quartos e distância da escola; no Investir, preço/m², custo total, entrega e plano de pagamento. O CTA principal SHALL ser "Agendar visita" em Morar e "Ver análise completa" seguido de "Agendar visita" em Investir.

#### Scenario: Card no modo Investir
- **WHEN** o modo é Investir
- **THEN** o card mostra preço/m², custo total, entrega e plano em destaque

### Requirement: Cores de apoio pendentes
As cores de apoio de Morar e Investir SHALL ser configuráveis e passar em contraste AA; os valores propostos (`#9C3D17` e `#1D5A85`) aguardam decisão de Matheus (C1).

#### Scenario: Cor de apoio aplicada
- **WHEN** o modo Morar está ativo
- **THEN** a cor de apoio configurada para Morar é aplicada com contraste AA sobre o fundo
