# Tasks

> **Suspensa em 13/11/2026.** Substituída pela SPEC 2.0, aprovada pelo Matheus: o plano vigente é `docs/PLANO.md` e o fluxo de trabalho é o método forja (decisão D1). Os grupos 1 e 2 foram concluídos e reaproveitados; o restante desta change fica como referência histórica e não deve ser executado.

> Cada grupo vira uma ou mais stories em `docs/stories/`, com branch e PR próprias; o merge é sempre de Matheus. Grupos marcados **[PARADA]** terminam com revisão de Matheus. Itens dependentes de decisão pendente entram desligados por flag (design D6). Stack: Next.js 16 + PostgreSQL 17/PostGIS + Drizzle + Better Auth + S3 compatível + pg-boss (design D4, D13–D17).

## 1. Fundação do repositório [PARADA]

- [x] 1.1 Mover o repositório inteiro para a pasta fora do OneDrive escolhida por Matheus e verificar com `git status` e `openspec list` que histórico e changes continuam íntegros
- [x] 1.2 Criar `docs/stories/` e a story 1.1 a partir deste grupo, e verificar que o arquivo segue o template de story do AIOX
- [x] 1.3 Criar `web/` com Next.js 16, React 19, TypeScript estrito e Tailwind v4 com versões fixadas, e verificar `npm run build` e `npm run typecheck` verdes
- [x] 1.4 Configurar ESLint com regra que proíbe acesso a `localStorage`, ao cliente Drizzle e ao armazenamento fora de `src/data/` e `src/server/`, e verificar que um arquivo de teste violador falha no lint
- [x] 1.5 Criar `web/config/brand.ts` com nome e logotipo e verificar, com teste, que trocar o nome altera cabeçalho e `<title>`
- [x] 1.6 Definir tokens de cor, tipografia (Inter Tight e Inter) e estilos de título e etiqueta no CSS global, e verificar com teste de contraste que as combinações de texto passam AA e que o lima não é usado como cor de texto sobre fundo claro
- [x] 1.7 Criar `src/i18n/pt-BR.ts`, o componente `<T>` e o script `npm run catalogo` que falha com literal de texto em JSX, e verificar com um componente de teste com literal
- [x] 1.8 Criar `config/flags.ts` com todas as flags do design D6 desligadas (incluindo `email_real`) e `config/scoring.config.ts` com os parâmetros **Proposta**, e verificar com teste de unidade os valores padrão
- [x] 1.9 Criar o teste de termos proibidos que varre `web/`, `db/` e `infra/` e verificar que falha ao inserir um termo proibido num arquivo temporário
- [x] 1.10 Criar `npm run check:secrets` e garantir `.gitignore` para `.env*` exceto `.env.example`, e verificar que o script acusa um arquivo `.env.local` rastreado
- [x] 1.11 Atualizar `.env.example` com `NEXT_PUBLIC_DATA_SOURCE` (`local`/`postgres`) e placeholders comentados de `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `S3_*` e chave de IA, e verificar que nenhum segredo usa prefixo `NEXT_PUBLIC_`
- [x] 1.12 Configurar Vitest, Playwright e axe com um teste mínimo de cada, e verificar `npm test` e `npm run test:e2e` verdes
- [ ] 1.13 Criar o workflow de CI com jobs `qualidade`, `build`, `e2e` (só PR) e `banco` (placeholder), `concurrency` com `cancel-in-progress`, template de PR, `CODEOWNERS` e dependabot semanal agrupado, e verificar uma execução verde numa PR de teste
- [x] 1.14 Implementar o layout base com navegação de cinco áreas (barra inferior no celular, menu superior no desktop), rodapé sem CRECI e indicação de dados de exemplo, e verificar com Playwright em 390, 1024 e 1440 px sem rolagem horizontal e axe sem violação

## 2. Domínio e dados locais

- [x] 2.1 Definir os tipos de domínio (empreendimento, subcondomínio, tipologia, unidade, plano, perfil, lead, atendimento, evento) com schemas Zod estritos, e verificar com testes de parse válidos e inválidos
- [x] 2.2 Criar o seed fictício determinístico de Porto Alegre (três incorporadoras, house, compradores, empreendimentos completos incluindo casos sem R.I., esgotado, pré-lançamento, exclusivo e não listado) como fonte única para o JSON local e o seed do banco, e verificar com teste que todos os registros estão marcados como exemplo
- [x] 2.3 Implementar a elegibilidade da base (R.I., publicado, curadoria, fase de venda calculada, visibilidade, campanha) e verificar com testes de cada caso de exclusão
- [x] 2.4 Implementar os filtros do questionário (prazo, quartos, região e raio, permuta, comodidades, unidade compatível) e verificar com testes por filtro
- [x] 2.5 Implementar a exigência por plano (entrada, parcela, à vista, melhor plano) e verificar com testes incluindo plano sem número de parcelas e empate
- [x] 2.6 Implementar a contagem total e por opção (combinação "ou" e "e", regra do zero, "Perto de mim" sem posição) e a ampliação por pergunta, e verificar com testes
- [x] 2.7 Implementar a nota com os cinco componentes, reponderação e sorteio fixo de desempate, e verificar com testes de determinismo e de imparcialidade (trocar comissão, destaque e incorporadora não muda nota nem ordem)
- [x] 2.8 Implementar a escolha de 2 a 3 opções e o caso "nenhuma acima do mínimo", e verificar com testes de fronteira (nota 50, janela de 15 pontos)
- [x] 2.9 Implementar o motivo por template (≤ 140 caracteres, frase removida sem marcador, frase padrão) e a extração de requisitos por palavras-chave do catálogo de comodidades, e verificar com testes de comprimento e de ausência de números fora do cadastro
- [x] 2.10 Implementar `resolveHomeState` e verificar com testes dos cinco estados
- [x] 2.11 Implementar a cascata de posição do mapa (URL, navegador, IP plugável, Porto Alegre) e o cálculo de tempo a pé, e verificar com testes de permissão negada, tempo esgotado e IP desligado
- [x] 2.12 Definir as portas dos repositórios em `src/data/port.ts` e implementar o adaptador local com LocalStorage versionado e migração que registra o que removeu, e verificar com a suíte de contrato rodando contra o adaptador local
- [x] 2.13 Implementar o repositório de eventos anônimos (ID anônimo, sem IP, sem posição exata, sem registro em god mode/impersonate) e verificar com testes de contrato
- [x] 2.14 Definir a porta `ArquivoStorage` e o adaptador de disco local (e IndexedDB para imagens da plataforma no modo local), e verificar com testes de gravação, leitura e recusa de tipo e tamanho

## 3. Jornada do comprador em modo local [PARADA]

- [ ] 3.1 Implementar o modo Morar/Investir global (seletor, persistência, estado na URL, cores de apoio configuráveis) e verificar com teste e2e que trocar o modo reordena blocos sem esconder dados e grava `mode_changed`
- [ ] 3.2 Implementar o login rápido simulado no modo local, o retorno só para caminho interno e `merge_visitor`, e verificar com testes de redirecionamento externo recusado e de favoritos locais migrados
- [ ] 3.3 Implementar o questionário `/buscar-imoveis` dirigido pelo schema declarativo, com uma pergunta por tela, voltar, contador ao vivo com `aria-live` e animação respeitando movimento reduzido, e verificar com e2e e axe
- [ ] 3.4 Implementar contagem por opção, opção desabilitada "nenhum no momento" e sugestão de ampliar, e verificar com e2e sobre o seed
- [ ] 3.5 Implementar progresso salvo e retomado, tela "Analisando…" cancelável e captura de contato opcional com opt-in de WhatsApp separado e desmarcado, e verificar com e2e que pular o contato ainda mostra o resultado
- [ ] 3.6 Implementar `/buscar-imoveis/resultado` com resumo em chips, cards, "Por que estou vendo isso?", "Ver no mapa", cartão do gerente e aviso de base, e verificar com e2e que o visitante sem conta vê de 2 a 3 opções
- [ ] 3.7 Implementar a gravação do resultado (nota, componentes, motivo) e verificar que reabrir mostra os mesmos valores
- [ ] 3.8 Implementar `/empreendimento/{slug}` com ordem de blocos por modo, Seus custos como estimativa (ITBI e registro "Não informado" até C7), plantas e unidades, vizinhança, dados legais, selo, escritório de vendas, parecidos e "Não informado" para campos vazios, e verificar com e2e por modo e axe
- [ ] 3.9 Implementar a regra de escassez com espelho < 24 h e verificar com teste de espelho atualizado há 23 h e 30 h
- [ ] 3.10 Implementar `/empreendimento/{slug}/agendar` em três toques com consentimento de visita versionado, confirmação com mensagem, mapa, "o que levar", perguntas para a visita, `.ics` e lembrete simulado, e verificar com e2e do questionário até a visita
- [ ] 3.11 Implementar "Falar com o gerente" com links `wa.me`, `mailto` e `tel` e o evento `manager_contact`, mantendo o comportamento de login atrás da flag `contato_exige_login` (C3), e verificar com e2e que as ações ficam a até 2 toques
- [ ] 3.12 Implementar `/mapa` com MapLibre e OpenFreeMap carregados sob demanda, tela de explicação antes da geolocalização, agrupamentos, pinos com variações, card rápido e "Minha localização", e verificar com e2e de posição simulada e de permissão negada abrindo em Porto Alegre
- [ ] 3.13 Implementar lista sincronizada (debounce 300 ms, deslizante no celular, lateral no desktop, alternância, teclado e leitor de tela), busca agrupada, "Buscar nesta área", filtros com "Ver {n} empreendimentos" e "Usar meu perfil", e verificar com e2e e axe
- [ ] 3.14 Implementar área vazia com alerta de área e os eventos `map_empty_area` e `map_area_alert_created`, e verificar com e2e de área vazia criando alerta
- [ ] 3.15 Implementar favoritos com login, convite a alerta, estado vazio, listas (criar, renomear, excluir, mover) e selo "Novidade", e verificar com e2e de favorito pedindo login
- [ ] 3.16 Implementar o comparador de até 3 e verificar o limite com teste
- [ ] 3.17 Implementar alertas (tipos, canal simulado, frequência, visto, pausar, desligar) e a regra de disparo a partir de mudanças de cadastro só na base elegível como função pura reutilizável pelo worker, e verificar com testes de alerta pausado e de empreendimento sem R.I.
- [ ] 3.18 Implementar `/conta` com visitas e propostas, privacidade (consentimentos, revogar, baixar JSON, apagar histórico, pausar alertas, excluir com anonimização) e configurações, e verificar com e2e de download e de exclusão
- [ ] 3.19 Implementar a home `/` pelos estados de `resolveHomeState`, com hero por modo, faixa de confiança, "Como funciona", fechamento da marca e blocos C5/C6/C13 desligados por flag, e verificar com e2e de cada estado
- [ ] 3.20 Gravar todos os eventos do catálogo nos pontos da jornada e o aviso curto de primeiro acesso, e verificar com teste e2e que a jornada completa gera os eventos esperados
- [ ] 3.21 Capturar telas em 390 e 1440 px de todas as rotas do comprador, rodar axe sem violação e registrar em `docs/` onde ver cada tela

## 4. Banco PostgreSQL, RLS e adaptador Postgres [PARADA]

- [ ] 4.1 Configurar Drizzle (`db/schema`, `drizzle-kit`, migrations SQL em `db/migrations/`) e `npm run test:db` com PGlite executando migrations, seed e pgTAP sem Docker, e verificar com um teste pgTAP mínimo
- [ ] 4.2 Verificar se o PostGIS carrega no PGlite (C11) e, se não, implementar a variante lat/lng só para testes locais com a mesma assinatura de função; registrar o resultado na story
- [ ] 4.3 Criar a migration dos papéis de banco `app_user`, `auth_service`, `worker` e `migrator` (sem `BYPASSRLS` para os três primeiros) e dos `GRANT`s mínimos, e verificar com pgTAP que `app_user` não é dono de tabela nem ignora RLS
- [ ] 4.4 Implementar o contexto por transação (`set_config('app.conta_id'/'app.impersonacao_id', …, true)`) e as funções `app.*` (`current_conta_id`, `current_role`, `current_tenant_id`, `is_god_mode`, `is_internal`, `pode_escrever`), e verificar com pgTAP e com teste de que consulta sem contexto não retorna linha de cliente
- [ ] 4.5 Criar migrations de identidade (`tenants`, `tenant_produtos`, `contas` referenciando o usuário do Better Auth, `tenant_convites`) e a restrição de conta única de god mode, e verificar com pgTAP
- [ ] 4.6 Criar migrations do catálogo (empreendimentos, `empreendimentos_comercial`, obra, subcondomínios, tipologias e vínculos, unidades, planos, `tabela_movimentos` somente inserção, equipe) com o gatilho que recusa publicação sem R.I. até para god mode e `project_change` por trigger, e verificar com pgTAP
- [ ] 4.7 Criar migrations de leads e atendimento (`leads`, `leads_contato`, `leads_interesses`, `atendimentos`, `crm_*`, visitas, propostas) com a política de contato derivada de interesse ativo por empreendimento, e verificar com pgTAP que questionário sozinho não libera contato e que revogar corta o acesso
- [ ] 4.8 Criar migrations de engajamento e comprador (`visitor`, `event`, `profile`, `favorite`, `list`, `alert`, `recommendation`, `consent`, `visualizacoes`, `empreendimento_engajamento`) e verificar com pgTAP que a incorporadora não lê `visualizacoes`
- [ ] 4.9 Criar migrations de conteúdo e governança (`conteudo_*`, `personalizacao`, `listas_opcoes`, `historico_edicoes`, `config_global`, `impersonation_sessions`, `notificacoes_simuladas`, `arquivos` com chave de armazenamento, `audit_logs` imutável) e verificar com pgTAP que ninguém atualiza ou apaga auditoria
- [ ] 4.10 Implementar `pode_escrever()` bloqueando god mode e impersonate em tabelas de cliente e as proteções de coluna de `role`, `tenant_id` e `responsavel_conta_id`, e verificar com pgTAP
- [ ] 4.11 Implementar as funções SQL `count_empreendimentos`, `count_by_option`, `empreendimentos_in_bbox` e `merge_visitor`, e verificar com teste de paridade contra as funções TS do grupo 2 e medição < 300 ms no seed
- [ ] 4.12 Escrever o teste de catálogo pgTAP (RLS em toda tabela, índice em todo `tenant_id`, `search_path` fixo, `security_invoker` em views, sem contexto só as funções da vitrine executam, nenhum termo proibido) e verificar verde
- [ ] 4.13 Escrever os pgTAP de visibilidade da especificação (comprador não lê comissão, equipe, rodízio, movimentos, engajamento, visualizações nem CRM; isolamento entre incorporadoras; exclusivo e não listado fora do mapa e da busca; etapa com cards não exclui; tipologia sem subcondomínio recusada; semelhante não libera contato; god mode só lê) e verificar verde
- [ ] 4.14 Criar o módulo `server-only` de conexão (`src/server/db`) que só entrega o cliente Drizzle dentro de `exigirContexto()`, com lista permitida de importação e teste que falha fora dela, e verificar o teste
- [ ] 4.15 Implementar `exigirContexto()` (sessão, conta, tenant, produtos, impersonate, transação com contexto, Zod estrito, 404 para outro tenant), e verificar com testes de tenant injetado no corpo, de id alheio e de concorrência entre duas contas no mesmo pool
- [ ] 4.16 Implementar o adaptador Postgres de todos os repositórios e verificar a suíte de contrato verde contra PGlite
- [ ] 4.17 Configurar o worker pg-boss (`src/worker/`, papel `worker`, relógio injetável) com uma tarefa de exemplo idempotente, e verificar com teste de execução repetida sem efeito duplicado
- [ ] 4.18 Ativar o job `banco` do CI com contêiner `postgis/postgis` (Postgres 17), `drizzle-kit migrate`, seed e `pg_prove`, e verificar execução verde
- [ ] 4.19 Documentar em `docs/` o modelo de dados, os papéis de banco, o contexto por transação e como rodar `test:db`, e verificar que os comandos documentados rodam como escritos

## 5. Autenticação (Better Auth), contas, papéis e privacidade

- [ ] 5.1 Configurar Better Auth com tabelas no schema `auth`, conexão `auth_service`, e-mail e senha, recuperação de senha com e-mail simulado (D10) e login social desligado, e verificar com testes de cadastro, login e recuperação
- [ ] 5.2 Implementar o cadastro público que cria só `buyer` em `contas` e o `proxy.ts` que lê o cookie de sessão, renova e redireciona, e verificar com teste que o cadastro não aceita outro papel e que `/conta` sem sessão redireciona ao login
- [ ] 5.3 Substituir o login simulado do modo local pelo Better Auth no modo `postgres`, mantendo `merge_visitor` e o retorno só para caminho interno, e verificar com e2e no modo `postgres`
- [ ] 5.4 Implementar convites com expiração para papéis de cliente e internos e os limites de concessão (não igual ou superior, não o próprio, não o último `client_superadmin`) com auditoria de negação, e verificar com pgTAP e teste de ação
- [ ] 5.5 Ativar o plugin de dois fatores (TOTP) e exigir segundo fator verificado para `god_mode` e `internal_*` em `exigirContexto()`, e verificar com teste que a fila não abre sem segundo fator
- [ ] 5.6 Criar o script de bootstrap do god mode sem credenciais versionadas e verificar que uma segunda execução falha
- [ ] 5.7 Implementar consentimentos versionados (visita, compartilhamento, WhatsApp) com origem, data, versão e texto, e a revogação pelo painel, e verificar com e2e de revogação cortando o acesso da incorporadora
- [ ] 5.8 Implementar desligamento na house (desativar sessão e conta, transferir ou devolver à fila) e exclusão como anonimização com permissão restrita, e verificar com testes

## 6. Incorporadora [PARADA]

- [ ] 6.1 Implementar o cadastro em 4 etapas com salvamento automático (800 ms, "Salvo" anunciado), validações da etapa 1, visibilidade e etapas de obra, e verificar com e2e e axe
- [ ] 6.2 Implementar subcondomínios (campos, endereço com lista do IBGE versionada, pin por clique ou arraste, "Localizar no mapa", infraestrutura com busca e "Todos", CEP atrás da flag `cep_servidor`), e verificar com e2e
- [ ] 6.3 Implementar tipologias no painel lateral (tipos, finalidade, planta, contagens, vínculo obrigatório, clonar) e a etapa Revisar, e verificar com e2e e com a recusa de tipologia sem subcondomínio
- [ ] 6.4 Implementar o adaptador S3 compatível do `ArquivoStorage` (chaves por tenant, upload pelo servidor, URL pública só para mídia publicada, URL assinada de curta duração para o resto) e os uploads de imagem (JPG, PNG, WebP até 10 MB, sem SVG), e verificar com testes contra um S3 simulado e de upload recusado
- [ ] 6.5 Implementar vídeos do YouTube validados com embed atrás da flag `video_embed` e CSP `frame-src` restrita, e verificar com teste de link inválido e de flag desligada
- [ ] 6.6 Implementar as abas Tabela de vendas (espelho com movimentos), Condições comerciais (planos e financiamento), Comissão (protegida após publicação e auditada), Localização (pontos próximos) e Equipe de vendas, e verificar com testes de permissão de `client_manager`
- [ ] 6.7 Implementar o início, a visão geral por período e a área de interesse agregado com gráficos de escala única, legenda e tabela alternativa, e verificar com teste que nenhum nome de comprador aparece
- [ ] 6.8 Implementar os dashboards da incorporadora com filtro Hoje e verificar com testes sobre o seed
- [ ] 6.9 Implementar o CRM kanban (etapas editáveis, ganho e perda fixas, painel do card, tarefas, notas, etiquetas, arrastar e "Mover para…", busca e filtros, lead próprio com origem) e verificar com e2e, axe e pgTAP de isolamento
- [ ] 6.10 Implementar leads da plataforma (busca somente leitura, mídia editável) e verificar com teste de edição recusada
- [ ] 6.11 Implementar equipe de vendas com importação CSV tudo ou nada e exportação UTF-8 com BOM e ";", escolha de quem aparece no escritório, e usuários (só `client_superadmin`), e verificar com testes de CSV e de permissão

## 7. House de vendas [PARADA]

- [ ] 7.1 Implementar a distribuição em rodízio, a fila da house e o prazo de proteção configurável, e verificar com testes de rodízio e de fila sem analista
- [ ] 7.2 Implementar a fila da analista com checklist de qualificação, agenda, confirmação e prazo de resposta, e verificar com e2e
- [ ] 7.3 Implementar o mini CRM do lead (kanban e lista, fato exigido por etapa, origem não editável, edição com histórico, respostas imutáveis, lead próprio privado) e verificar com testes e pgTAP
- [ ] 7.4 Implementar visitas da house (agendar, reagendar, cancelar, resultado) sincronizadas com o kanban, e verificar com e2e
- [ ] 7.5 Implementar "Passar ao gerente de produtos" e "Oferecer semelhantes" (sugestão sem liberar contato até novo consentimento), e verificar com pgTAP e e2e
- [ ] 7.6 Implementar a carteira do gerente de contas, o modo cliente que oculta comissão e material comercial, Mais Buscados só com ordem e os dashboards da house, e verificar com testes

## 8. Plataforma interna, god mode e tarefas agendadas [PARADA]

- [ ] 8.1 Implementar a gestão de tenants por `internal_superadmin` (criar, suspender, encerrar, produtos, papéis internos, ativação de pré-lançamento com registro de consentimento) e verificar com testes e auditoria
- [ ] 8.2 Implementar a curadoria e a publicação pela equipe com conferência de R.I., e verificar que publicar sem R.I. é recusado na interface e no banco
- [ ] 8.3 Implementar impersonate (motivo, alvo só cliente, sem troca de sessão, só leitura, 30 min com encerramento pelo worker, faixa fixa, auditoria, sem eventos), e verificar com e2e de escrita recusada e teste de expiração com relógio simulado
- [ ] 8.4 Implementar a Vitrine Destacada (planos, ativação com valor, vagas configuráveis, expiração pelo worker, elegibilidade, exibição só visual) e verificar com teste de que nota e ordem não mudam e de expiração com relógio simulado
- [ ] 8.5 Implementar Mais Buscados (só compradores, mês vigente, saída durante destaque e retorno no dia seguinte, recálculo pelo worker) e verificar com testes de data
- [ ] 8.6 Implementar o disparo de alertas pelo worker a partir de `project_change` (reutilizando a regra do item 3.17) gravando em `notificacoes_simuladas`, e verificar com teste de alerta pausado e de idempotência
- [ ] 8.7 Implementar o projeto de mídia (produto por tenant, verba, gasto manual, campanhas com conferência de R.I., lead de campanha exclusivo, CPL, CAC, ROI, leads por R$ 1.000, funil e curvas) e verificar com testes de cálculo e de visibilidade
- [ ] 8.8 Implementar a barra do god mode com "Editar esta tela", painel "Textos desta tela", catálogo com busca, filtros e "só os alterados", e recusa de termos proibidos, e verificar com e2e e axe
- [ ] 8.9 Implementar versões de textos legais com contagem de aceites, imagens da plataforma (redução para 1600 px, armazenamento S3 no modo `postgres` e IndexedDB no local), aparência com recusa de cor fora do AA e listas editáveis, e verificar com testes
- [ ] 8.10 Implementar histórico de edições, desfazer, restaurar, exportar e importar com validação, e verificar com teste de importação inválida sem efeito
- [ ] 8.11 Implementar a tela de notificações e e-mails simulados para a equipe e verificar que alertas, lembretes, convites e recuperações de senha aparecem nela

## 9. Negociação (Épico 2) e simulador

- [ ] 9.1 Implementar a proposta do comprador (unidade, valor, formas, validade, consentimento, aviso sem efeito jurídico) no formato a confirmar em C10, e verificar com e2e e liberação de contato só àquela incorporadora
- [ ] 9.2 Implementar a resposta da incorporadora (aceitar, recusar com motivo, contraproposta) refletida no painel do comprador, e verificar com testes
- [ ] 9.3 Implementar a reserva com prazo e liberação automática pelo worker com movimento no espelho, e verificar com teste de reserva vencida com relógio simulado
- [ ] 9.4 Implementar o contrato anexado (armazenamento privado com URL assinada) com status e data e a assinatura eletrônica atrás da flag `assinatura_eletronica`, e verificar com testes de acesso negado a outro tenant
- [ ] 9.5 Implementar o registro de venda (espelho, comissão com percentual congelado, dashboards) e a conferência com a lista da incorporadora, e verificar com teste de percentual alterado após a venda
- [ ] 9.6 Implementar o simulador atrás da flag `simulador` (cap rate, GRM, Cash-on-Cash, ganho de capital só com dados digitados, aviso de projeção, sem IA), e verificar com testes de aluguel vazio e de flag desligada

## 10. IA opcional (bloqueada por C2)

- [ ] 10.1 Implementar o módulo de IA de servidor (extração de requisitos em JSON validado e motivo com marcadores, timeout de 5 s, cache, rejeição de dígitos) atrás da flag `ia_motivo`, e verificar com testes usando cliente simulado, sem chamada real
- [ ] 10.2 Após escolha do modelo e liberação de custo por Matheus, ativar a flag em ambiente de teste e verificar que motivos continuam ≤ 140 caracteres e sem números fora do cadastro

## 11. Infraestrutura da VPS (bloqueada até aprovação de custo de Matheus)

- [ ] 11.1 Criar `infra/` com Docker Compose (app Next `standalone`, worker, Postgres 17 + PostGIS sem porta pública, proxy reverso com HTTPS) e `.env.example` próprio sem segredos, e verificar com `docker compose config` no CI
- [ ] 11.2 Criar o Dockerfile do app e do worker e verificar o build da imagem no CI
- [ ] 11.3 Configurar o backup diário cifrado do Postgres para o S3 e o script de restauração, e verificar com uma restauração completa num banco limpo
- [ ] 11.4 Criar o job de deploy que aplica migrations com o papel `migrator` após backup e depois publica app e worker, acionado só manualmente por Matheus, e verificar numa VPS de teste aprovada
- [ ] 11.5 Documentar em `docs/` a operação da VPS (deploy, backup, restauração, rotação de segredos, atualização) e verificar que os comandos documentados rodam como escritos

## 12. Integração e definição de pronto

- [ ] 12.1 Rodar a jornada completa em modo `postgres` sobre PGlite (questionário → resultado → visita → liberação à incorporadora → passagem ao gerente → proposta) e verificar os oito critérios de sucesso da especificação
- [ ] 12.2 Rodar `lint`, `typecheck`, `test`, `test:db`, `test:e2e`, `build`, `check:secrets` e `catalogo`, axe sem violação e capturas em 390 e 1440 px, e verificar todos verdes
- [ ] 12.3 Entregar a Matheus o relatório com o que mudou, pendências, custo de Actions e decisões novas, e verificar que as pendências da seção 15 estão listadas com as flags correspondentes

## Workflow follow-up

- Ativação remota: só depois que Matheus aprovar e contratar a VPS e o armazenamento S3; migrations aplicadas pelo job de deploy com o papel `migrator` (regra de parada).
- Arquivar esta change com `openspec-archive-change` quando as fases planejadas estiverem concluídas e revisadas por Matheus.
