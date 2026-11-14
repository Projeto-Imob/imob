## Purpose

Aplicar de forma transversal as regras inegociáveis de publicação e comunicação (R.I., pré-lançamento, escassez, termos e indicadores proibidos), de modo que nenhuma tela, papel ou automação as contorne.

## ADDED Requirements

### Requirement: R.I. obrigatório para publicar
Um empreendimento sem número de registro de incorporação SHALL ser recusado ao publicar, anunciar, negociar, reservar, vender, entrar em mídia paga, contador, resultado, mapa ou alerta. A recusa MUST valer para todos os papéis, inclusive o god mode, e ser aplicada no banco.

#### Scenario: Publicação sem R.I.
- **WHEN** qualquer papel tenta publicar um empreendimento com o R.I. vazio
- **THEN** a operação é recusada com mensagem explicando que o registro de incorporação é obrigatório

#### Scenario: God mode tenta publicar sem R.I.
- **WHEN** o god mode tenta publicar um empreendimento sem R.I. diretamente no banco
- **THEN** o banco recusa a operação

### Requirement: Base elegível do comprador
Contador, resultado, mapa, alertas e listas públicas SHALL incluir só empreendimentos publicados, aprovados pela curadoria, com R.I., fora de esgotado, pré-lançamento, rascunho, "exclusivo" e "não listado".

#### Scenario: Empreendimento esgotado
- **WHEN** todos os subcondomínios de um empreendimento ficam 100% vendidos
- **THEN** ele deixa de aparecer no contador, no resultado, no mapa e nos alertas

### Requirement: Pré-lançamento em stand-by
O pré-lançamento SHALL permanecer no sistema com `pre_lancamento_ativo = false`, fora de toda a interface do comprador e da busca. Só `internal_superadmin` MAY ativá-lo, com registro do consentimento total da incorporadora; ele MUST NOT ser apagado.

#### Scenario: Data de lançamento futura
- **WHEN** um empreendimento tem data de lançamento futura e o pré-lançamento está desligado
- **THEN** ele não aparece em nenhuma tela do comprador nem na contagem

### Requirement: Escassez só com espelho recente
Mensagens de escassez como "Restam {x}" SHALL aparecer só quando o espelho de vendas tiver sido atualizado há menos de 24 horas.

#### Scenario: Espelho desatualizado
- **WHEN** o espelho foi atualizado há 30 horas
- **THEN** a página mostra as unidades sem a mensagem "Restam {x}"

### Requirement: Sem indicadores de mercado
Interface, IA e simulador MUST NOT exibir vacância, cap rate projetado, GRM, Selic, IPCA, IGP-M, aluguel estimado ou índice de terceiros. Cap rate SHALL aparecer só calculado com o aluguel digitado pela própria pessoa. O índice de correção do plano (ex.: INCC) é dado cadastrado do plano e MAY ser exibido.

#### Scenario: Página no modo Investir
- **WHEN** o comprador abre um empreendimento no modo Investir
- **THEN** não há aluguel estimado nem indicador macroeconômico na tela

### Requirement: Palavras proibidas na interface
A interface MUST NOT conter "oportunidade imperdível", "garantido", "lucro certo", promessa de valorização ou "últimas unidades" sem dado do espelho. O catálogo de textos SHALL recusar a gravação de texto com esses termos.

#### Scenario: God mode edita texto com termo proibido
- **WHEN** o god mode salva um texto contendo "lucro certo"
- **THEN** a gravação é recusada com a indicação do termo proibido

### Requirement: Termos fora do produto
O código-fonte e o banco MUST NOT conter os perfis ou termos `corretor`, `broker`, `parceria`, `imobiliaria` (como perfil) nem `JulI.A`. Uma verificação automática SHALL falhar a suíte de testes se algum aparecer.

#### Scenario: Termo reintroduzido
- **WHEN** um arquivo de código passa a conter `broker`
- **THEN** o teste de termos proibidos falha apontando o arquivo e a linha

### Requirement: Sem CRECI da plataforma
Rodapé, dados legais e qualquer tela MUST NOT exibir CRECI da plataforma. CRECI SHALL existir só como campo opcional da equipe de vendas da incorporadora.

#### Scenario: Dados legais do empreendimento
- **WHEN** o comprador lê a seção de dados legais
- **THEN** vê número do R.I., cartório, data do registro e patrimônio de afetação, sem CRECI

### Requirement: Dados de exemplo identificados
Todo dado de seed e do modo demo SHALL ser fictício e marcado como exemplo; nenhum dado real de pessoa ou empresa MUST ser incluído.

#### Scenario: Modo demo
- **WHEN** a aplicação roda no modo local com o seed
- **THEN** as telas exibem a indicação de que os dados são de exemplo
