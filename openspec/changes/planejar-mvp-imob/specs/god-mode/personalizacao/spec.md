## Purpose

Permitir que o god mode edite conteúdo e aparência da plataforma sem código, com histórico e versões, sem jamais escrever dado de cliente.

## ADDED Requirements

### Requirement: Escrita exclusiva do god mode
Só o god mode, com MFA, SHALL escrever o conteúdo da plataforma (textos, imagens, personalização, listas). Todos os perfis SHALL ler.

#### Scenario: Admin tenta editar texto
- **WHEN** um `internal_admin` tenta salvar um texto do catálogo
- **THEN** a operação é recusada

### Requirement: Catálogo de textos
Todo texto fixo de tela SHALL estar num catálogo gerado do código, com busca, filtro por área e "só os alterados". Texto montado com dado de cliente MUST NOT entrar no catálogo. A geração do catálogo MUST falhar se houver texto de tela fora dele.

#### Scenario: Só alterados
- **WHEN** o god mode filtra "só os alterados"
- **THEN** a lista mostra apenas textos com valor diferente do padrão

### Requirement: Editar esta tela
A barra do god mode SHALL ter "Editar esta tela", que contorna cada texto editável com lápis, e o painel "Textos desta tela" com o mesmo acesso por teclado.

#### Scenario: Edição por teclado
- **WHEN** o god mode abre "Textos desta tela" e edita um texto
- **THEN** o texto muda na tela sem recarregar o código

### Requirement: Versões de textos legais
Editar texto legal SHALL criar versão nova, e a tela SHALL mostrar quantos aceites cada versão tem.

#### Scenario: Contagem de aceites
- **WHEN** o god mode abre o texto de consentimento de visita
- **THEN** vê cada versão com o número de aceites

### Requirement: Imagens da plataforma
Logotipos, símbolos, favicon e imagem de destaque SHALL aceitar JPG, PNG ou WebP de até 10 MB, reduzidos para até 1600 px. No modo local, MUST ficar em armazenamento do navegador sem o limite de ~5 MB do LocalStorage.

#### Scenario: Imagem grande
- **WHEN** o god mode envia um PNG de 4000 px
- **THEN** a imagem é reduzida para 1600 px no maior lado

### Requirement: Aparência com checagem de contraste
Nome, slogan, suporte, rodapé, cores, cantos e tamanho do texto SHALL ser editáveis, e uma cor que falha no WCAG AA MUST ser recusada.

#### Scenario: Cor sem contraste
- **WHEN** o god mode escolhe cor de texto com contraste 2:1 sobre o fundo
- **THEN** a cor é recusada com o valor de contraste medido

### Requirement: Listas editáveis
O god mode SHALL editar origens do lead próprio, perguntas para a visita, formas de pagamento e itens de infraestrutura.

#### Scenario: Novo item de infraestrutura
- **WHEN** o god mode acrescenta um item de infraestrutura
- **THEN** o item aparece no cadastro de subcondomínios

### Requirement: Histórico, desfazer e restaurar
Cada mudança SHALL registrar antes, depois, data e autor, com desfazer a última e restaurar a personalização.

#### Scenario: Desfazer
- **WHEN** o god mode desfaz a última mudança de cor
- **THEN** a cor anterior volta e o histórico registra o desfazer

### Requirement: Exportar e importar conteúdo
O god mode SHALL exportar e importar só o conteúdo da plataforma, com validação antes de aplicar.

#### Scenario: Arquivo inválido
- **WHEN** o god mode importa um arquivo com campo desconhecido
- **THEN** a importação é recusada sem alterar nada

### Requirement: Fora da edição
O god mode MUST NOT editar pesos e regras da busca, registros da base, fotos de empreendimentos e logotipos de incorporadoras.

#### Scenario: Peso da busca
- **WHEN** o god mode procura editar os pesos da nota
- **THEN** não há tela ou API que permita a alteração
