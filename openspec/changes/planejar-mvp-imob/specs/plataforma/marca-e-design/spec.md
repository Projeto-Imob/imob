## Purpose

Garantir identidade visual consistente, troca simples de nome e logotipo e acessibilidade AA em todas as telas da plataforma, em qualquer largura de 360 a 1440 px.

## ADDED Requirements

### Requirement: Nome e logotipo centralizados
O nome do produto e o logotipo SHALL vir de uma única configuração de marca. Textos de interface MUST NOT conter o nome do produto escrito diretamente, para que a troca de nome altere todas as telas de uma vez.

#### Scenario: Troca do nome provisório
- **WHEN** o nome configurado muda de "Vieza" para outro valor
- **THEN** cabeçalho, rodapé, título das páginas e e-mails simulados exibem o novo nome sem outra alteração

### Requirement: Paleta e tipografia da marca
A interface SHALL usar os tokens de cor da especificação (lima `#DBDF4A`, preto `#0C0C0C`, grafite `#262626`, off-white `#F4F4F0`, textos `#45453F`/`#5D5D55`, borda `#85857B`, secundário sobre preto `#A8A89E`, sucesso `#15803D`, atenção `#B45309`, erro `#B91C1C`), Inter Tight em títulos e números de destaque e Inter na interface.

#### Scenario: Token aplicado
- **WHEN** qualquer componente precisa de cor de erro
- **THEN** ele usa o token de erro `#B91C1C`, sem valor hexadecimal próprio

### Requirement: Lima nunca como traço sobre fundo claro
Sobre fundo claro, o lima MUST NOT ser usado como cor de texto, ícone, linha ou marca de gráfico; só como preenchimento atrás de texto preto. Sobre preto, o lima MAY ser cor de texto.

#### Scenario: Destaque de título em área clara
- **WHEN** um título de marca recebe destaque numa seção off-white
- **THEN** o destaque é um bloco lima com texto preto

#### Scenario: Gráfico em área clara
- **WHEN** um gráfico é exibido sobre fundo claro
- **THEN** suas séries usam a rampa ordinal `#949800`–`#242500` ou a paleta categórica `#7A7F00`, `#2A78D6`, `#EB6834`, `#6250D6`, e nunca o lima

### Requirement: Acessibilidade AA
Toda tela SHALL atender WCAG 2.1 AA: contraste AA, foco visível, alvos de toque de no mínimo 44 × 44 px, selos com ícone e texto (nunca só cor) e respeito a `prefers-reduced-motion`. A verificação automática com axe MUST terminar sem violação.

#### Scenario: Movimento reduzido
- **WHEN** o sistema operacional do usuário pede movimento reduzido
- **THEN** animações de contador, transições e carrosséis são exibidas sem animação

#### Scenario: Selo de status
- **WHEN** um selo de status (ex.: "Incorporação registrada") é exibido
- **THEN** ele traz ícone e texto, além da cor

### Requirement: Layout mobile primeiro sem rolagem horizontal
As telas SHALL ser desenhadas para 360–390 px e expandidas até o desktop, sem rolagem horizontal em 390, 1024 e 1440 px.

#### Scenario: Larguras de verificação
- **WHEN** qualquer rota pública é renderizada em 390, 1024 ou 1440 px
- **THEN** a largura do documento não excede a da janela

### Requirement: Desempenho da página do empreendimento
A página do empreendimento SHALL ter LCP abaixo de 2,5 s em perfil 4G, com imagens responsivas, carregamento tardio e mapa e bibliotecas pesadas carregados sob demanda.

#### Scenario: Medição em 4G
- **WHEN** a página de um empreendimento do seed é medida com perfil 4G
- **THEN** o LCP é menor que 2,5 s
