# Imob — SPEC 2.0

> **Status:** aprovada pelo Matheus em 13/11/2026 (decisões D1 a D18 em `docs/PLANO.md`). Substitui a especificação 1.0, preservada sem alteração em `docs/historico/SPEC-1.0-CLAUDE.md`.
> **Nome:** "Imob" é o nome de trabalho; "Vieza" é provisório na interface e vive só em `config/brand.ts`.
> **Por que 2.0:** ver `docs/ANALISE-2.0.md`.

## Como a especificação está organizada

| Documento | O que tem | Muda quando |
|---|---|---|
| `CLAUDE.md` | As 20 regras inegociáveis e como trabalhar no repositório. Carregado em toda sessão, por isso curto. | Raramente |
| `docs/SPEC.md` (este) | O que é, para quem, o que entra em cada fase e os critérios de aceite da v1. | O escopo muda |
| `docs/specs/*.md` | Regras detalhadas por área (texto da 1.0 preservado, com os esclarecimentos da 2.0 no topo). | Uma regra de negócio muda |
| `docs/ARQUITETURA.md` | Stack, dados, segurança, infraestrutura, deploy, observabilidade e caminho de escala. | Uma decisão técnica muda |
| `docs/PLANO.md` | Fatias verticais em ordem, decisões datadas e pendências do Matheus. | A cada fatia |

Regra de precedência: `CLAUDE.md` (regras inegociáveis) > decisões aprovadas no `docs/PLANO.md` > `docs/SPEC.md` > `docs/specs/*.md` > `docs/ARQUITETURA.md`. Conflito entre eles é bug de documentação: pare e pergunte. Uma decisão nova que mude a SPEC corrige o texto dela no mesmo PR.

## Problema

Lançamentos imobiliários vendem com ciclo longo, demanda pouco qualificada e pouca gente chegando à visita. O comprador sofre com decorado perdido, conta escondida e pressão de vendedor.

O Imob é um ecossistema de geração de demanda: a incorporadora (ou construtora) vende direto ao comprador e ao investidor, atendidos pela house de vendas da plataforma. O comprador responde a um questionário curto, recebe de 2 a 3 opções que cabem no perfil e no bolso, com nota e motivo, e agenda a visita. Detalhes de negócio, referências e metas: `docs/specs/negocio.md`.

## Usuários

| Perfil | O que precisa fazer | Fase |
|---|---|---|
| Comprador ou investidor | Achar o que cabe no perfil, entender o custo real, agendar visita e falar com o gerente, sem conta até o momento de valor. | v1 |
| Analista da house de vendas | Receber o lead, qualificar, garantir a visita e passar ao gerente de produtos da incorporadora. | v1 |
| Incorporadora (superadmin e gerente de produtos) | Ver os próprios empreendimentos, os números agregados e os atendimentos liberados. | v1 mínima; completa na fase 2 |
| Equipe da plataforma | Cadastrar e publicar empreendimentos (com R.I.), curar, convidar usuários e administrar tenants. | v1 |
| God mode (só o Matheus) | Ler tudo e editar o conteúdo da plataforma, sem tocar em dado de cliente. | Só leitura na v1 (conta por bootstrap com MFA na fatia 1.4; o banco garante a leitura sem escrita desde a 0.2); personalização e impersonate na fase 2 |
| Plantão da incorporadora e gerente de contas da house | Aparecer no escritório de vendas e atender. | Fase 2 |

Papéis, tenants e a matriz de visibilidade completa: `docs/specs/acesso-e-visibilidade.md`.

## Princípios da 2.0

1. **Piloto antes de plataforma.** A v1 valida a jornada central com uma incorporadora real: cadastro → busca → resultado → visita → house → incorporadora. Todo o resto espera a v1 rodar.
2. **Fatias verticais.** Cada entrega atravessa banco, servidor e tela e pode ser usada. Nada de "primeiro todo o backend".
3. **Um caminho de dados.** Postgres com RLS desde o primeiro dia, no desenvolvimento, nos testes e na produção. O navegador guarda só conveniências do visitante.
4. **Regras puras, uma vez.** As regras de busca (elegibilidade, filtros, nota, motivo) são funções puras já testadas em `src/dominio/`. A contagem também roda em SQL, com teste de paridade.
5. **Pendência vira flag, não bloqueio.** Toda decisão em aberto entra desligada ou com valor **Proposta** em configuração.
6. **Tecnologia chata e popular.** É o que tem documentação farta e rende mais com IA. Versões fixadas.

## Fases

| Fase | Objetivo | Conteúdo |
|---|---|---|
| **0. Fundação de produção** | Esqueleto que já roda de ponta a ponta no servidor de homologação | Banco com RLS, deploy, backup, observabilidade, uma página real lendo do banco. O login entra na fatia 1.4 |
| **1. Piloto (v1)** | Uma incorporadora real com compradores reais | F1 a F12 abaixo |
| **2. Escala de uso** | Mais incorporadoras e mais volume | Mapa, favoritos, alertas, CRM kanban, mini CRM, cadastro pela incorporadora, god mode, impersonate |
| **3. Monetização e negociação** | Receita além da comissão | Vitrine Destacada, Mais Buscados, projeto de mídia, proposta/reserva/contrato/venda, simulador, IA |

A ordem das fatias está em `docs/PLANO.md`.

## Jornada da v1

1. A equipe da plataforma cadastra o empreendimento com R.I., registra a comissão e publica depois da curadoria.
2. O comprador entra pela home ou por um link, responde ao questionário vendo a contagem ao vivo e recebe de 2 a 3 opções com nota e motivo.
3. Se quiser, deixa nome e WhatsApp no fim: o lead vai para a fila da house, e nenhuma incorporadora vê o contato.
4. Agenda a visita em 3 toques (o login é pedido aqui) ou fala com o gerente por WhatsApp, e-mail ou telefone.
5. A analista da house qualifica, confirma e registra a visita. A visita agendada libera nome e contato só à incorporadora daquele empreendimento.
6. Depois da visita, a analista passa ao gerente de produtos da incorporadora, que acompanha o atendimento na área dela.

## v1 — funcionalidades

Regras de cálculo, textos e telas em detalhe: `docs/specs/`. Os critérios abaixo são o contrato de aceite de cada funcionalidade.

### F1. Página do empreendimento
Como comprador, sem conta, quero ver tudo o que importa de um lançamento para decidir se vale visitar.
Critérios de aceite:
- [ ] dado um empreendimento da base elegível, quando abro `/empreendimento/{slug}`, então vejo os blocos na ordem do modo (Morar ou Investir) definida em `docs/specs/comprador.md`, com preço, fluxo de cada plano calculado para a unidade escolhida, plantas e unidades, vizinhança com tempo a pé, comodidades, escritório de vendas e dados legais (R.I., cartório, data do registro e patrimônio de afetação), sem CRECI.
- [ ] dado um campo sem dado, então aparece "Não informado".
- [ ] dado o espelho de unidades atualizado há 24 h ou mais, então "Restam {x}" não aparece.
- [ ] dado um empreendimento sem R.I., em rascunho, esgotado, em pré-lançamento desligado ou exclusivo, então a página responde "não encontrado".
- [ ] dado um empreendimento não listado e um visitante sem login, então a página responde "não encontrado" com convite ao login.
- [ ] ITBI e registro aparecem como estimativa, e "Não informado" até a decisão C7.
- [ ] o selo "Incorporação registrada" aparece na página e nos cards.

### F2. Buscar Imóveis (questionário)
Como comprador, quero responder poucas perguntas e ver na hora quantos empreendimentos cabem no meu perfil.
Critérios de aceite:
- [ ] as perguntas vêm de um schema declarativo, uma por tela, com voltar, sem tela de introdução e alvos de 44 × 44 px.
- [ ] dado que respondo uma pergunta, quando a base muda, então o contador "{n} empreendimentos" atualiza e é anunciado com `aria-live="polite"`, sem animação com movimento reduzido.
- [ ] dado uma opção que levaria a zero, então ela aparece desabilitada com "nenhum no momento"; "Perto de mim" sem posição não é contado.
- [ ] dado que restam menos de 3, então o sistema sugere ampliar, relaxando o último filtro conforme `docs/specs/busca-e-recomendacao.md`.
- [ ] dado que fecho a aba na pergunta 5, quando volto no mesmo navegador, então o questionário reabre na pergunta 5.
- [ ] a contagem responde em menos de 300 ms no banco, com espera de 150 ms entre mudanças.
- [ ] o modo Morar/Investir é definido pela primeira pergunta, fica na URL e muda ordem, destaques, textos e cor de apoio, sem esconder dado.

### F3. Resultado "Seus imóveis"
Como comprador, quero de 2 a 3 opções com nota e motivo para não perder tempo com o que não cabe.
Critérios de aceite:
- [ ] dado um perfil, então só entram opções com nota ≥ 50; vão as 2 melhores e a terceira só se estiver a até 15 pontos da primeira (**Proposta**, C14).
- [ ] dado que nenhuma opção atinge a nota mínima, então o resultado diz isso em vez de forçar uma indicação.
- [ ] cada motivo tem até 140 caracteres, só traz números do cadastro ou da conta e só afirma o que a pessoa informou.
- [ ] "Por que estou vendo isso?" mostra cada componente com peso, nota, detalhe e o que ficou fora da conta.
- [ ] dado que a comissão, o destaque ou a incorporadora de um empreendimento mudam, então nota e ordem não mudam.
- [ ] dado que reabro o resultado no dia seguinte, então vejo as mesmas notas, componentes e motivos gravados.
- [ ] a tela informa que as indicações vêm só da base da plataforma e mostra o cartão do gerente.

### F4. Contato no fim do questionário
Como comprador, quero escolher se deixo meu contato, sem que isso seja condição para ver o resultado.
Critérios de aceite:
- [ ] o contato é pedido só no fim ("Seus imóveis estão prontos. Para onde enviamos?"), com o opt-in de WhatsApp numa caixa separada e desmarcada.
- [ ] dado que não preencho, então vejo o resultado normalmente e nenhum lead com contato é criado.
- [ ] dado que informo nome e WhatsApp, então um lead entra na fila da house em rodízio e nenhuma incorporadora vê nome ou contato.

### F5. Login rápido e agendamento de visita
Como comprador, quero agendar a visita em 3 toques, entrando só quando for preciso.
Critérios de aceite:
- [ ] navegar, responder e ver o resultado não exigem conta; agendar exige login rápido (e-mail e senha, com recuperação por e-mail real).
- [ ] depois do login, volto à tela de origem; o retorno só aceita caminho interno.
- [ ] no login, o progresso do questionário e o histórico anônimo passam para a conta (`merge_visitor`).
- [ ] agendo com dia, horário e confirmar, com os dados já preenchidos, e o consentimento de visita é gravado com a versão do texto.
- [ ] a confirmação mostra endereço e mapa, o gerente, "o que levar", as perguntas para fazer na visita, "Adicionar ao calendário" (.ics) e o aviso de lembrete por WhatsApp (simulado).
- [ ] a visita entra na fila da house e libera nome e contato só à incorporadora daquele empreendimento.

### F6. Falar com o gerente
Como comprador, quero falar com uma pessoa de verdade, pelo canal que eu preferir.
Critérios de aceite:
- [ ] de qualquer tela, "Agendar visita" e "Falar com o gerente" ficam a no máximo 2 toques.
- [ ] o cartão do gerente tem nome, foto, cargo, WhatsApp (`wa.me` com mensagem pronta), e-mail (`mailto`) e telefone (`tel`).
- [ ] cada toque grava `manager_contact` com o canal.
- [ ] o comportamento de login e consentimento no primeiro clique segue a flag `contato_exige_login` (C3), desligada por padrão.

### F7. Fila da house de vendas
Como analista da house, quero receber, qualificar e levar o lead até a visita e ao gerente de produtos.
Critérios de aceite:
- [ ] o lead da busca vai a uma analista ativa em rodízio; sem analista ativa, fica na fila da house, visível a toda a house até alguém assumir.
- [ ] a fila mostra leads novos de busca, contato direto e visita, com prazo de resposta visível.
- [ ] a analista preenche o checklist de qualificação e confirma, reagenda, cancela ou registra o resultado da visita.
- [ ] a origem do lead é sempre visível e não editável; as respostas originais do questionário não mudam; toda edição guarda autor e data.
- [ ] as etapas da v1 vão de "novo" a "visita feita", mais "perdido" (com motivo); as etapas de proposta em diante chegam na fase 3.
- [ ] "Passar ao gerente de produtos" registra a passagem e a incorporadora passa a ver o atendimento.

### F8. Área mínima da incorporadora
Como incorporadora, quero acompanhar meus empreendimentos e os atendimentos liberados, sem ver quem não demonstrou interesse.
Critérios de aceite:
- [ ] entro por convite; o superadmin da incorporadora convida gerentes de produtos.
- [ ] vejo só os meus empreendimentos, com números agregados (acessos, visitas agendadas e feitas, leads liberados), nunca nomes de quem só acessou.
- [ ] vejo os atendimentos liberados (visita agendada, contato direto ou passagem da house), somente leitura, com etapa.
- [ ] nunca vejo lead que só respondeu ao questionário, nem opções que o comprador tem com outra incorporadora, nem lead próprio da house.
- [ ] uma consulta direta ao banco com a conta de uma incorporadora não retorna linha de outra (RLS).

### F9. Cadastro e publicação pela equipe da plataforma
Como equipe da plataforma, quero cadastrar e publicar empreendimentos com segurança jurídica.
Critérios de aceite:
- [ ] o cadastro tem as 4 etapas da `docs/specs/catalogo.md` (empreendimento, subcondomínios, tipologias, revisar), com salvamento automático e "Salvo" anunciado.
- [ ] a tabela de vendas tem unidades com área privativa, preço e status, e toda mudança grava um movimento no histórico (só inserção).
- [ ] as condições comerciais registram os planos; a comissão é visível e editável só pela equipe da plataforma, com auditoria.
- [ ] publicar sem R.I. é recusado na tela e no banco, até para o god mode.
- [ ] a fase de venda é calculada, avaliada por subcondomínio, sem campo próprio.
- [ ] mudanças de preço, % de obra, status e unidades geram registro de mudança de cadastro.
- [ ] imagens aceitam só JPG, PNG e WebP de até 10 MB, conferidas pelos bytes, sem SVG e sem metadados de posição.

### F10. Contas, papéis e acesso
Como plataforma, quero que cada pessoa veja e faça só o que o papel dela permite.
Critérios de aceite:
- [ ] o cadastro público só cria `buyer`; os demais papéis entram por convite com expiração.
- [ ] ninguém concede papel igual ou superior ao próprio, muda o próprio papel ou remove o último `client_superadmin`; a recusa é aplicada no banco e auditada.
- [ ] god mode e papéis internos exigem segundo fator (TOTP) verificado.
- [ ] a conta god mode entra por script de bootstrap, sem credencial versionada; uma segunda execução falha.
- [ ] toda ação de servidor começa por `exigirContexto()` e responde 404 para id de outro tenant.

### F11. Privacidade e LGPD
Como comprador, quero controlar meus dados e consentimentos.
Critérios de aceite:
- [ ] opt-ins separados e desmarcados (WhatsApp; compartilhar com a incorporadora).
- [ ] consentimentos por empreendimento, com origem, data, versão e texto; quem aceitou antes continua com a versão que aceitou.
- [ ] dado que revogo o consentimento, então a incorporadora perde o acesso ao meu contato na consulta seguinte.
- [ ] baixo meus dados em JSON, apago o histórico e excluo a conta com confirmação; a exclusão anonimiza e mantém registros financeiros.
- [ ] o primeiro acesso mostra o aviso curto de registro anônimo de uso; eventos não guardam IP nem posição exata.
- [ ] os textos de consentimento, visita e projeção passam pela validação jurídica (C15) antes de abrir para o público.

### F12. Home, navegação e marca
Como comprador, quero entender a proposta em segundos e começar.
Critérios de aceite:
- [ ] a navegação da v1 tem Início, Buscar Imóveis e Minha conta (barra inferior no celular, menu superior no desktop); Mapa e Favoritos entram na fase 2, atrás de flag.
- [ ] a home escolhe o estado por `resolveHomeState`: no estado novo, hero do modo, "Descubra seu imóvel em 2 minutos", faixa de confiança, "Como funciona" em 3 passos e o fechamento "MIRAR NO AGORA PRA CHEGAR LONGE."; "Continue de onde parou" no estado navegou; "Seus imóveis" e "Novos no seu perfil" no estado perfil (questionário concluído); o status da visita no estado negociando. O estado ativo (com favorito ou alerta) é da fase 2.
- [ ] destaques (C13), indicadores de bairros (C5) e prova social (C6) ficam desligados.
- [ ] o rodapé não tem CRECI; os dados de exemplo são indicados como tal.
- [ ] a marca segue `docs/specs/marca-e-design.md`: o laranja nunca é texto, ícone, linha ou marca de gráfico sobre fundo claro.

## Fora da v1

**Fase 2 (escala de uso):**
- mapa público, com posição em cascata, lista sincronizada, filtros com contagem, área vazia e alerta de área;
- favoritos, listas, comparador e selo "Novidade";
- alertas (canais simulados) e home no estado ativo;
- CRM kanban da incorporadora, equipe de vendas com CSV e usuários da incorporadora;
- mini CRM kanban da house, oferecer semelhantes, carteira do gerente de contas e dashboards completos;
- cadastro de empreendimento pela própria incorporadora;
- god mode de personalização: textos, versões legais pela tela, imagens, aparência, listas e histórico;
- impersonate só leitura, tela interna de notificações e e-mails simulados, e login com Google (flag).

**Fase 3 (monetização e negociação):** Vitrine Destacada, Mais Buscados, projeto de mídia e lead de campanha, proposta, contraproposta, reserva, contrato e registro de venda com comissão, simulador e IA no motivo e nos requisitos (C2).

**Fora do produto** (sem mudança desde a 1.0): leilão de leads, tokenização, vacância e indicadores de mercado, corretor, imobiliária, parcerias, anúncios de corretor, financeiro interno da Imob e funil comercial da própria Imob.

## Telas da v1

| Tela | Objetivo | Ação principal |
|---|---|---|
| `/` | Explicar a proposta e levar ao questionário | "Descubra seu imóvel em 2 minutos" |
| `/buscar-imoveis` | Questionário com contador ao vivo | Responder |
| `/buscar-imoveis/resultado` | 2 a 3 opções com nota e motivo | "Agendar visita" |
| `/empreendimento/{slug}` | Tudo sobre o lançamento | "Agendar visita" |
| `/empreendimento/{slug}/agendar` | Visita em 3 toques | Confirmar |
| `/entrar` | Login rápido no momento de valor | Continuar com e-mail |
| `/conta` | Visitas, privacidade e configurações básicas | Revogar, baixar ou excluir |
| `/house` | Fila, lead e visitas da analista | Qualificar e confirmar |
| `/incorporadora` | Empreendimentos e atendimentos liberados | Acompanhar |
| `/interno` | Tenants, usuários, cadastro e publicação | Publicar com R.I. |

## Dados da v1

Lista completa de entidades: `docs/specs/dados.md`. Quem lê e quem escreve: `docs/specs/acesso-e-visibilidade.md`, sempre garantido por RLS.

| Entidade | Escreve | Lê |
|---|---|---|
| tenants, contas, convites | Equipe da plataforma (e superadmin da incorporadora, para os próprios convites) | O próprio tenant; equipe da plataforma |
| empreendimentos, subcondomínios, tipologias, unidades, planos, movimentos | Equipe da plataforma | Comprador: só a base elegível. Incorporadora: os próprios |
| empreendimentos_comercial (comissão, escritório) | Equipe da plataforma | Equipe da plataforma e house (fora do modo cliente); incorporadora só a própria; comprador nunca |
| leads, atendimentos, visitas | Comprador (os próprios), house | House; incorporadora só os liberados do próprio empreendimento |
| leads_contato, leads_interesses (consentimento) | Comprador, house | Incorporadora só com interesse ativo no próprio empreendimento |
| recomendações, eventos, versões legais, aceites | Sistema | Comprador (os próprios); incorporadora só números agregados |
| audit_logs, project_change | Sistema (só inserção) | Equipe da plataforma |

## Integrações da v1

| Serviço | Para quê | Situação |
|---|---|---|
| Cloudflare R2 (S3 compatível) | Fotos, plantas, documentos e backups cifrados | Aprovado (D8); conta Cloudflare criada pelo Matheus; ativar o R2 é pendência da 0.4 |
| Resend (e-mail transacional) | Recuperação de senha, confirmação de visita, convites | Aprovado (D9); obrigatório antes de compradores reais; conta a criar pelo Matheus (1.5) |
| MapLibre com OpenFreeMap | Pin no cadastro e mapa na confirmação da visita | Aprovado |
| WhatsApp | Links `wa.me`, sem API | Sem custo |
| Sentry e monitor de disponibilidade | Erros de produção e queda | Aprovado (D10); contas a criar pelo Matheus (0.4) |
| ViaCEP, embed do YouTube, cidade pelo IP | Conforto | Desligados por flag até o OK |
| IA (Claude) | Motivo e requisitos | Fase 3, desligada (C2) |

## Requisitos não funcionais

Lista completa: `docs/specs/qualidade.md`. Os que pesam na v1:

- **Celular primeiro:** de 360 a 390 px, expandido até o desktop, sem rolagem horizontal em 390, 1024 e 1440 px.
- **Acessibilidade AA:**
  - foco visível;
  - selos com ícone e texto, nunca só cor;
  - alvos de 44 × 44 px;
  - `prefers-reduced-motion`;
  - axe sem violação.
- **Desempenho:**
  - LCP da página do empreendimento < 2,5 s em 4G;
  - contagem < 300 ms;
  - mapa e bibliotecas pesadas carregados sob demanda.
- **Segurança:**
  - RLS em toda tabela;
  - `exigirContexto()` em toda ação;
  - Zod estrito na fronteira;
  - CSP e cabeçalhos de segurança;
  - limite de tentativas em login e formulários;
  - nenhum segredo com `NEXT_PUBLIC_`.
- **LGPD:** finalidade, consentimento, registro de tratamento e atendimento ao titular.
- **Idioma:** português do Brasil, com todo texto fixo no catálogo `src/i18n/pt-BR.ts`.
- **Disponibilidade e recuperação:**
  - backup diário fora do servidor;
  - restauração testada todo mês;
  - deploy com volta em um comando.

## Critérios de sucesso

**Técnicos** (da 1.0, mantidos):
1. Um visitante sem conta conclui o questionário e vê de 2 a 3 opções.
2. Nenhum empreendimento sem R.I., em pré-lançamento, em rascunho ou esgotado aparece no contador, no resultado, no mapa ou em alertas.
3. Trocar Vitrine Destacada, comissão ou incorporadora não muda a nota nem a ordem.
4. Nenhum motivo passa de 140 caracteres nem traz número que não venha do cadastro ou da conta.
5. "Agendar visita" e "Falar com o gerente" ficam a até 2 toques, e o agendamento leva 3.
6. Com localização negada, o mapa abre na cidade pelo IP ou em Porto Alegre (fase 2).
7. A contagem no banco leva menos de 300 ms.
8. A incorporadora não vê nome nem contato de quem só respondeu ao questionário.

**Do piloto** (medidos pelos eventos, com metas a definir com o Matheus, P11):
- questionário iniciado → concluído;
- resultado → visita agendada;
- visita agendada → feita;
- feita → passada ao gerente;
- tempo até a primeira resposta da house;
- leads qualificados por empreendimento.
