# Design

## Context

- Greenfield: o repositório tem só o framework AIOX, `CLAUDE.md`, `.github/` e o OpenSpec. Não há `web/`, `db/`, `package.json` nem `docs/stories/`.
- Stack definida na especificação (seção 13 do `CLAUDE.md`, revisada em 2026-11-13): Next.js 16 App Router com `proxy.ts`, React 19, TS estrito, Tailwind v4, Zod 4, RHF, Zustand, MapLibre + OpenFreeMap, Recharts, **PostgreSQL 17 + PostGIS em VPS própria**, **Drizzle ORM** (consultas e migrations), **Better Auth** (autenticação e MFA), **armazenamento S3 compatível**, **pg-boss** (tarefas agendadas), Vitest, Playwright, axe. O Supabase foi descartado por Matheus.
- Máquina de Matheus: Windows 11 Home, 8 GB de RAM, 2 núcleos, sem WSL nem Docker. O banco precisa ser validado localmente sem Docker.
- O repositório está dentro do OneDrive, e a especificação exige que o código fique fora dele.
- Há 15+ decisões pendentes de Matheus (seção 15 do `CLAUDE.md`) que afetam telas específicas, mas não a arquitetura.
- Motivação e escopo: ver `proposal.md`. Requisitos: ver `specs/`.

## Goals / Non-Goals

**Goals:**
- Uma única base de código que roda inteira em modo `local` (demo, sem banco) e em modo `postgres`, com o mesmo comportamento verificado por testes de contrato.
- Regras de negócio críticas (elegibilidade, nota, R.I., isolamento, liberação de contato) implementadas uma vez e testadas em unidade e no banco.
- Isolamento entre tenants garantido pelo próprio Postgres (RLS), mesmo sem o Supabase.
- Toda pendência de Matheus isolada atrás de flag ou configuração, para que a decisão vire mudança de configuração, não de código.
- Entrega em fases verticais, cada uma terminando numa parada de revisão.

**Non-Goals:**
- Envio real de WhatsApp, e-mail ou push; cobrança e gateway; integração automática com plataformas de anúncio; fluxo de aluguel; API pública e white label.
- Contratar VPS, armazenamento S3 ou provedor de e-mail sem aprovação de custo de Matheus (regra de parada).
- Escolher o modelo de IA ou qualquer serviço pago.

## Decisions

### D1. Layout do repositório
```
C:\dev\imob/             # raiz do repositório = raiz da aplicação Next.js (package.json aqui)
├── src/app/             # rotas: (comprador), incorporadora/, house/, plataforma/, god/
├── src/dominio/         # regras puras: elegibilidade, filtros, nota, motivo, homeState, mapa
├── src/data/            # portas e adaptadores por domínio: port.ts, local.ts, postgres.ts
├── src/server/          # db (Drizzle + contexto), auth (Better Auth), storage, ia
├── src/worker/          # tarefas agendadas (pg-boss), processo separado
├── src/i18n/pt-BR.ts e src/components/T.tsx
├── config/              # brand.ts, scoring.config.ts, flags.ts
├── scripts/             # catalogo, check:secrets, termos proibidos
├── tests/               # unit, contrato, e2e
├── db/                  # schema Drizzle, migrations/ (SQL), seed, tests/ (pgTAP)
├── infra/               # docker-compose da VPS, proxy, backup (sem segredos)
├── docs/stories/
├── openspec/
└── .aiox-core/, .claude/, squads/  # framework AIOX (fora do lint, do typecheck e das varreduras)
```
O repositório inteiro (incluindo `openspec/` e o framework AIOX) é movido para fora do OneDrive antes da primeira instalação de dependências. Alternativa considerada: manter planejamento no OneDrive e código em outro repositório — rejeitada porque divide a rastreabilidade story ↔ spec ↔ código e o CI.
Revisão de 2026-11-13 (Matheus): a aplicação, antes planejada em `web/`, fica na raiz do repositório, com `src/` na raiz. Lint, TypeScript, Tailwind e as varreduras excluem as pastas do framework.

### D2. Regras de domínio como funções puras compartilhadas
Elegibilidade, filtros, exigência por plano, nota, escolha, motivo de template, `resolveHomeState`, cascata de posição do mapa e tempo a pé ficam em `src/dominio/`, sem dependência de React ou de banco. O adaptador local usa essas funções diretamente sobre o seed em memória.
No modo `postgres`, a **contagem** e o **recorte do mapa** rodam em funções SQL (requisito de < 300 ms) chamadas pelo Drizzle, e a **nota** roda no servidor Next com as mesmas funções TS sobre os candidatos retornados pelo banco. Um teste de paridade roda os mesmos fixtures pela função TS e pela função SQL e exige resultados iguais.
Alternativa: nota toda em SQL — rejeitada por duplicar fórmula e dificultar o teste de unidade e os parâmetros **Proposta**.

### D3. Portas e adaptadores com teste de contrato
Cada repositório (`EmpreendimentoRepo`, `ProfileRepo`, `EventRepo`, `FavoriteRepo`, `AlertRepo`, `LeadRepo`, `CrmRepo`, `HouseRepo`, `ConteudoRepo`, …) tem uma interface em `port.ts` e dois adaptadores (`local.ts`, `postgres.ts`). Uma suíte de contrato única roda contra os dois. Nenhum componente acessa LocalStorage, o cliente Drizzle ou o armazenamento diretamente; uma regra de lint proíbe esses imports fora de `src/data/` e `src/server/`. Dados do navegador têm versão de schema e migração que registra o que removeu. `NEXT_PUBLIC_DATA_SOURCE` = `local` (padrão) ou `postgres`.

### D4. Autorização em três camadas, sem Supabase
1. **RLS no Postgres como fonte da verdade.** O app conecta com o papel de banco `app_user` (sem `BYPASSRLS`, sem ser dono das tabelas). Toda requisição roda numa transação que grava o contexto com `set_config('app.conta_id', …, true)` e `set_config('app.impersonacao_id', …, true)` (válidos só na transação). As funções `app.*` (`current_conta_id()`, `current_role()`, `current_tenant_id()`, `is_god_mode()`, `is_internal()`, `pode_escrever()`) leem esse contexto e a tabela `contas`; são `security definer`, `stable`, com `search_path` vazio, usadas dentro de `(select …)`. Views com `security_invoker`. Sem contexto, `current_conta_id()` é nulo e as políticas só deixam passar o que é público da vitrine (equivalente ao `anon`).
2. `proxy.ts` só lê o cookie de sessão do Better Auth, renova e redireciona.
3. `exigirContexto()` no início de toda Server Action e Route Handler: valida a sessão pelo Better Auth no servidor, carrega conta, tenant, produtos e impersonate, abre a transação com o contexto, valida a entrada com Zod estrito e responde 404 para id de outro tenant.
Papéis de banco separados: `app_user` (aplicação), `auth_service` (só tabelas do Better Auth, no schema `auth`), `worker` (tarefas agendadas, com políticas próprias e auditadas) e `migrator` (dono do schema, usado só no deploy de migrations). O papel do produto vem sempre de `contas`, nunca da sessão do Better Auth.
`pode_escrever()` retorna falso para god mode em tabelas de cliente e para sessões de impersonate, implementando "god mode só lê" e "impersonate só leitura" no banco. Dados sensíveis em tabelas separadas (`empreendimentos_comercial`, `leads_contato`), porque RLS não filtra colunas. Colunas `role`, `tenant_id` e `responsavel_conta_id` protegidas por `GRANT` de coluna e trigger.
Alternativa: autorizar só na aplicação (filtros `where tenant_id = …` no Drizzle) — rejeitada porque um filtro esquecido vaza dados entre incorporadoras; o RLS continua sendo a barreira final.

### D5. Liberação de contato por evento, não por flag
O acesso da incorporadora ao contato é derivado de `leads_interesses` (consentimento ativo por empreendimento, criado por visita, contato direto ou proposta). A política de `leads_contato` faz `exists` nessa tabela filtrando pelo tenant do empreendimento. Revogar preenche `revogado_em` e o acesso cai na próxima consulta. Alternativa: coluna booleana no lead — rejeitada por não ser por empreendimento nem auditável.

### D6. Pendências atrás de flags e configuração
- `config/flags.ts` (padrões versionados) sobreposto por `config_global` no banco (só `internal_superadmin`/god mode, auditado). Flags iniciais, todas desligadas: `ia_motivo` (C2), `cep_servidor` (ViaCEP), `video_embed` (C12), `geo_ip`, `interesse_publico` (C4), `home_destaques` (C13), `home_bairros` (C5), `prova_social` (C6), `simulador`, `assinatura_eletronica`, `login_google`, `contato_exige_login` (C3), `email_real`.
- `config/scoring.config.ts` guarda todos os parâmetros **Proposta** (raio 5 km, 3,5 km, divisores, nota mínima 50, janela de 15 pontos, prazo de proteção do lead) até a validação de Matheus (C14). Não é editável pelo god mode.
- Cores de apoio Morar/Investir (C1) como tokens configuráveis.
- `pre_lancamento_ativo` por empreendimento, `false` por padrão.

### D7. Catálogo de textos `<T>`
Todo texto fixo vive em `src/i18n/pt-BR.ts` com chave estável e é renderizado por `<T k="…">`. `npm run catalogo` extrai as chaves e falha se encontrar literal de texto em JSX fora do catálogo. Em runtime, `<T>` sobrepõe o padrão com `conteudo_textos` (cache por requisição). Textos legais vêm de `conteudo_versoes_legais` com versão imutável; o aceite grava o id da versão. O validador de gravação recusa os termos proibidos de comunicação.

### D8. Mapa
MapLibre GL com estilo do OpenFreeMap, carregado por `dynamic import` só em `/mapa`, no cadastro e na confirmação de visita. Agrupamento nativo do MapLibre sobre GeoJSON do recorte. No banco, localização PostGIS nativa (a VPS e o CI usam imagem com PostGIS). Se o PGlite local não carregar PostGIS (C11), as funções de recorte têm uma variante lat/lng com caixa delimitadora e Haversine usada só nos testes locais — a assinatura da função não muda, e o CI testa a versão PostGIS.

### D9. IA isolada num único módulo de servidor
`src/server/ia/` com duas funções: extrair requisitos (JSON validado por Zod) e redigir motivo com marcadores. Timeout de 5 s, cache por perfil + empreendimento + `updated_at`, rejeição de qualquer dígito na saída. Com `ia_motivo` desligada, o módulo nem é chamado. Chave só em `.env.local`, sem `NEXT_PUBLIC_`.

### D10. Notificações e e-mails simulados
Alertas, lembretes, convites e e-mails de recuperação de senha geram registros numa tabela `notificacoes_simuladas` (canal, destinatário por id, conteúdo, data) visível no painel interno. WhatsApp vira link `wa.me`. Com `email_real` ligada (após aprovação de provedor por Matheus), só o adaptador de e-mail muda.

### D11. Testes e CI
- Unidade (Vitest): domínio, termos proibidos, `resolveHomeState`, posição do mapa, motivo, CSV.
- Contrato (Vitest): mesma suíte para `local` e `postgres` (localmente sobre PGlite).
- Banco (pgTAP): `npm run test:db` no PGlite, sem Docker; no CI, job `banco` com contêiner `postgis/postgis` (Postgres 17), `drizzle-kit migrate`, seed e `pg_prove`.
- Teste de contexto: consulta como `app_user` **sem** contexto gravado não retorna nenhuma linha de cliente.
- E2E (Playwright, modo local) + axe, em 390 e 1440 px.
- CI: jobs `qualidade`, `build`, `e2e` (só PR), `banco`; `concurrency` com `cancel-in-progress`; dependabot semanal agrupado; `CODEOWNERS`; template de PR.
- `npm run check:secrets` (varredura de padrões de chave e de arquivos `.env*` exceto `.env.example`) e o teste de termos proibidos varrem o código do app (`src/`, `config/`, `scripts/`, `tests/`, `public/` e arquivos da raiz), `db/` e `infra/`; `docs/`, `openspec/`, `CLAUDE.md` e o framework AIOX ficam fora porque descrevem os termos proibidos.

### D12. Seed único, fictício e determinístico
Um seed com ids fixos (três incorporadoras, a house, compradores, dois empreendimentos completos, CRM com etapas e cards, Porto Alegre) alimenta o modo local (via JSON gerado) e o banco (script de seed), garantindo que e2e e pgTAP vejam os mesmos dados. Todos marcados como exemplo.

### D13. Migrations com Drizzle, regras em SQL
O schema de tabelas é declarado no Drizzle e as migrations são geradas como SQL versionado em `db/migrations/`. Políticas RLS, funções `app.*`, gatilhos (R.I., `project_change`, auditoria, movimentos), `GRANT`s e funções de contagem são escritos em migrations SQL personalizadas, revisadas como código. Migrations só rodam pelo CI/deploy com o papel `migrator`, nunca à mão no remoto.
Alternativa: SQL puro com Kysely — viável, mas Matheus escolheu Drizzle; a regra "sem ORM" da especificação passa a ser "Drizzle como camada de consulta, regras de acesso no banco".

### D14. Autenticação com Better Auth
Better Auth no próprio Next, com tabelas no schema `auth` do mesmo Postgres: e-mail e senha, recuperação de senha, sessões em banco com cookie `httpOnly`, plugin de dois fatores (TOTP) e login social desligado (`login_google`). A conta de produto (`contas`) referencia o usuário do Better Auth; convites, papéis e tenant ficam em `contas`/`tenant_convites`, não no Better Auth. "MFA exigido" significa sessão com segundo fator verificado; `exigirContexto()` recusa papéis internos sem ele. O bootstrap do god mode é um script de servidor executado por Matheus, sem credenciais versionadas.

### D15. Armazenamento de arquivos
Porta `ArquivoStorage` com dois adaptadores: disco local (desenvolvimento e e2e) e S3 compatível (produção; provedor — Cloudflare R2 ou MinIO na VPS — escolhido por Matheus conforme custo). Chaves por tenant: `empreendimentos/{tenant}/{empreendimento}/…` e `conteudo-plataforma/…`. Upload sempre pelo servidor, com checagem de papel, tenant, tipo (JPG, PNG, WebP; sem SVG) e 10 MB. Imagens de empreendimento publicado são servidas por URL pública com cache; plantas não publicadas, contratos e documentos só por URL assinada de curta duração.

### D16. Tarefas agendadas com pg-boss
Um processo `worker` separado usa pg-boss (fila no próprio Postgres, sem Redis) para: vencer reservas, encerrar Vitrine Destacada, recalcular Mais Buscados, disparar alertas a partir de `project_change`, encerrar impersonate após 30 min e limpar convites vencidos. Cada tarefa é idempotente, auditada quando altera dado de cliente e testada com relógio simulado. No modo local, as mesmas funções rodam sob demanda na carga das telas.

### D17. Infraestrutura na VPS
Docker Compose (ou Coolify, à escolha de Matheus) com: app Next (`output: standalone`), worker, Postgres 17 + PostGIS e proxy reverso com HTTPS automático. Postgres sem porta pública. Backup diário com `pg_dump` cifrado para o armazenamento S3, retenção configurável e teste de restauração mensal. Segredos só no ambiente da VPS e nos secrets do GitHub. A contratação da VPS e do S3 depende da aprovação de custo de Matheus.

## Risks / Trade-offs

- [Contexto da conexão esquecido ou vazando entre requisições no pool] → contexto gravado com `set_config(…, true)` dentro da transação de cada requisição; `exigirContexto()` é o único caminho para obter o cliente do banco; teste que prova zero linhas sem contexto e teste de concorrência com duas contas.
- [Drizzle com RLS] → o Drizzle não gerencia todas as políticas; regras de acesso ficam em migrations SQL revisadas e cobertas por pgTAP.
- [Operar a VPS (atualização, backup, segurança)] → Compose versionado em `infra/`, backup automático com restauração testada, Postgres sem porta pública, atualizações de segurança automáticas do sistema operacional.
- [Better Auth e contas de produto divergirem] → `contas` é a fonte de papel e tenant; usuário sem `contas` ativa não acessa nada além da vitrine.
- [Paridade TS × SQL nas regras de filtro diverge] → teste de paridade obrigatório no CI sobre os fixtures do seed; qualquer mudança de regra altera os dois lados na mesma PR.
- [PGlite sem PostGIS] → variante lat/lng só nos testes locais (D8); PostGIS real testado no job `banco`.
- [Máquina com 8 GB e 2 núcleos] → e2e e build pesados no CI; localmente rodar suítes por pasta; sem Docker.
- [Minutos do GitHub Actions] → e2e só em PR, cache de dependências, `cancel-in-progress`; avisar Matheus perto do limite gratuito.
- [Escopo muito grande para uma change] → tarefas organizadas em fases com parada de revisão; cada grupo vira story própria; partes bloqueadas por decisão entram desligadas.
- [Regras de privacidade só na UI] → toda regra de visibilidade tem teste pgTAP correspondente; UI nunca é a única barreira.
- [Repositório no OneDrive corrompe `.git`/`node_modules`] → mover o repositório antes de qualquer `npm install` (primeira tarefa).
- [Textos fora do catálogo] → `npm run catalogo` falha no CI.

## Migration Plan

Greenfield, sem migração de dados. Sequência de entrega (detalhada em `tasks.md`), cada fase com parada para Matheus:

0. Fundação: mover repositório, esqueleto da aplicação na raiz, marca, tokens, catálogo, flags, CI, verificações.
1. Domínio e dados locais: seed, regras puras, portas e adaptador local.
2. Jornada do comprador (modo local): navegação, questionário, resultado, empreendimento, visita, mapa, favoritos, alertas, conta, home.
3. Banco: schema Drizzle, papéis de banco, contexto, RLS, funções SQL, auditoria, pgTAP, adaptador Postgres e contrato.
4. Contas e autenticação (Better Auth, MFA, convites) e privacidade.
5. Incorporadora: cadastro em 4 etapas, arquivos, painel, CRM, equipe, usuários.
6. House de vendas.
7. God mode e plataforma interna (tenants, impersonate, Vitrine Destacada, projeto de mídia) e worker.
8. Negociação (Épico 2) e simulador (se mantido).
9. Ativação remota: só com VPS e S3 aprovados e contratados por Matheus; migrations pelo CI com o papel `migrator`.

Rollback: cada fase é uma ou mais PRs independentes em `main`; reverter uma PR desfaz a fase sem afetar dados reais (não há dados reais). Em produção, cada deploy de migration é precedido de backup.

## Open Questions

- Caminho exato da pasta fora do OneDrive (ex.: `C:\dev\imob`): Matheus escolhe na primeira tarefa.
- Provedor da VPS e do armazenamento S3 (R2 ou MinIO na própria VPS) e orçamento mensal: decisão de custo de Matheus antes da fase 9.
- Docker Compose puro ou Coolify na VPS: escolha de Matheus antes da fase 9; não muda o código.
- Provedor de e-mail transacional para `email_real`: pendente de aprovação de custo.
- Limite de minutos do Actions a partir do qual Matheus quer ser avisado.
- Pendências de negócio P5–P11 e C1–C15: já isoladas por flags/configuração (D6) e não alteram a arquitetura nem a quebra de tarefas.
