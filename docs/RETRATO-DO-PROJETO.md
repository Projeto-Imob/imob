# Imob: retrato do projeto

> **Atualizado em 17/11/2026, à noite.**
>
> Este documento junta, num lugar só, o caminho do projeto do zero até hoje e o que falta. Ele é um retrato: é atualizado a cada marco. A fonte da verdade do dia a dia continua sendo:
> - `docs/PLANO.md`: fatias, decisões e pendências;
> - `docs/DIARIO.md`: o registro de cada sessão.
>
> O repositório é público. Por isso aqui não há senha, chave, IP nem endereço interno do servidor; a seção 7 diz onde cada um está guardado.

## 1. O que é o Imob

Um ecossistema de geração de demanda para lançamentos imobiliários. A incorporadora vende direto ao comprador e ao investidor, que são atendidos pela house de vendas da plataforma.

O comprador:
1. responde a um questionário curto, vendo quantos imóveis combinam com ele;
2. recebe de 2 a 3 opções com nota e motivo;
3. abre a página do empreendimento;
4. fala com o gerente ou agenda uma visita.

A incorporadora só vê o contato do comprador depois de um interesse confirmado e com consentimento (regra 5).

- **Nome:** "Imob" é o nome de trabalho. "Vieza" é provisório na interface e vive só em `config/brand.ts`.
- **Prazo do MVP:** em homologação até **01/12/2026**, com a Fase 0, as fatias 1.1 a 1.3 e a 1.3b. A produção com tráfego pago vem na segunda quinzena de dezembro.

## 2. Linha do tempo, do zero até hoje

| Quando | Marco |
|---|---|
| Antes de 13/11 | Protótipo antigo (`Projeto-Imob/projeto-vieza`, que não se mexe mais), SPEC 1.0 e planejamento em AIOX/OpenSpec, hoje só como histórico. Foram feitas a fundação do repositório (Next.js 16, marca e tokens, catálogo de textos, flags, `check:secrets`, Vitest, Playwright e axe, CI) e as regras puras da busca, com 282 testes reaproveitados na 2.0. |
| 13/11 | **SPEC 2.0 aprovada**, com as decisões D1 a D18. O Supabase sai da stack, que fica com Postgres 17, Drizzle, Better Auth, R2 e pg-boss. O Imob passa a rodar no servidor atual, como stack isolada (D11). |
| 14/11 | Repositório público `Projeto-Imob/imob`, com a `main` protegida. **Fatia 0.1** concluída (PR #1). |
| 16/11 | **Fatia 0.2**: banco local e de teste, migrations com RLS, seed fictício e testes de banco (PR #3). Também no dia: auditoria do código, buckets do R2 e plano de endurecimento do servidor. Decisões: prazos, piloto enxuto, CSP sem nonce, cor laranja e protótipo até 20/11. |
| 16/11, à noite | Sentry no app, sem dado pessoal (PR #4); cor principal laranja #FF8C00 (PR #5); **fatia 0.3**, com módulos de domínio e a página do empreendimento lendo do banco (PR #7). |
| 17/11, de manhã | **Endurecimento do servidor** concluído: firewall de 22, 80 e 443, SSH só por chave, fail2ban, swap de 2 GB e rotação de logs. Projeto `imob` no Sentry. **Plano da 0.4 aprovado.** Decisões: homologação num subdomínio da I.Ara e MVP com a interface completa e cadeado no que vem depois (fatia nova 1.3b). |
| 17/11, à tarde | **Fatia 0.4, parte do repositório** (PR #9): imagem Docker, stack do Swarm, deploy pelo GitHub Actions com volta automática, backup cifrado e a rota `/api/saude`. Configuração: ambiente `homologacao` no GitHub, chaves do backup (`age`) com cópia no Bitwarden, imagens públicas no GHCR e o servidor preparado (usuário `deploy`, `/opt/imob`, timer do backup, regra de 30 dias no R2, banco da homologação no ar). |
| 17/11, à tarde | Aceleração com agentes: planos das fatias 0.5, 1.1 e 1.2/1.3 feitos em Opus e protótipo clicável das telas do MVP, tudo esperando a aprovação do Matheus. |
| 17/11, à noite | **Homologação no ar** (commit `afe9415`), com HTTPS da Let's Encrypt, saúde e página respondendo, e as stacks vizinhas intactas. O primeiro deploy revelou três ajustes, que vão numa PR pequena: label duplicado do Traefik, conferência do `rclone` com o R2 e `deploy.sh` rodado pelo root. |

## 3. Como o projeto está organizado

### 3.1 Stack de tecnologia

As versões vêm do `package.json` e das imagens, fixas (sem `^` nem `latest`).

| Camada | Tecnologia | Versão | Situação |
|---|---|---|---|
| Ambiente de execução | Node.js | 24.19 | Em uso |
| Framework web | Next.js (App Router e Cache Components) | 16.4.6 | Em uso |
| Interface | React | 19.3.0 | Em uso |
| Linguagem | TypeScript, no modo estrito | 5.9.3 | Em uso |
| Estilo | Tailwind CSS (pelo Turbopack) e tokens da marca | 4.3.3 | Em uso |
| Fontes | Inter e Inter Tight (fontsource) | 5.3.0 | Em uso |
| Textos | Catálogo `src/i18n/pt-BR.ts` e `<T>` | — | Em uso |
| Validação | Zod | 4.6.7 | Em uso |
| Banco de dados | PostgreSQL, com RLS em toda tabela | 17.12 | Em uso: local, CI e homologação |
| Acesso ao banco | Drizzle ORM e drizzle-kit | 0.45.4 e 0.31.11 | Em uso |
| Driver do banco | node-postgres (`pg`) | 8.23.1 | Em uso |
| Erros | Sentry para Next.js, sem dado pessoal | 11.10.0 | Em uso |
| Testes de unidade e de banco | Vitest | 5.1.0 | Em uso |
| Testes ponta a ponta e acessibilidade | Playwright e axe | 1.65.0 e 4.14.0 | Em uso |
| Lint | ESLint e eslint-config-next | 9.39.5 e 16.4.6 | Em uso |
| Componentes | shadcn/ui (Radix) | — | Previsto (D7), entra com a 1.3b |
| Login | Better Auth | — | Previsto, na 1.3b (simples) e na 1.4 |
| Tarefas agendadas | pg-boss, no worker | — | Previsto; o worker está com 0 réplicas |
| E-mail | Resend | — | Previsto (D9); falta a conta |
| Mapa | OpenFreeMap | — | Aprovado, para a fase 2 |

### 3.2 Serviços e contas

| Serviço | Para quê | Custo | Situação |
|---|---|---|---|
| GitHub (`Projeto-Imob/imob`) | Código, PRs, CI, deploy (Actions) e Dependabot | Gratuito, porque o repositório é público | Em uso |
| GitHub Container Registry | Imagens `imob` e `imob-migracao`, uma por commit | Gratuito, porque os pacotes são públicos | Em uso |
| Servidor na Hetzner (Alemanha) | Homologação agora, produção na 1.10. É compartilhado com outros projetos | Já pago | Em uso |
| Cloudflare R2 | Buckets `imob-hml-arquivos` (arquivos) e `imob-backups` (backups) | Camada gratuita | Em uso |
| Sentry | Erros do app (projeto `imob`) e o monitor de disponibilidade | Camada gratuita | Erros em uso; o monitor falta ligar |
| Bitwarden | Cofre de senhas e chaves (D18) | Gratuito | Em uso desde 17/11 |
| DNS do domínio da I.Ara | Subdomínio da homologação | Já pago | Em uso |
| Let's Encrypt, pelo Traefik | Certificado HTTPS | Gratuito | Em uso |
| Resend | E-mail transacional | Camada gratuita | Falta criar a conta, com o OK do Matheus |

### 3.3 Stacks no servidor (Docker Swarm)

| Stack | Serviço | Imagem | Memória (reserva / limite) | Situação |
|---|---|---|---|---|
| `imob_hml` | `app` | `ghcr.io/projeto-imob/imob:<commit>` | 192 MB / 384 MB | No ar; 87 MB em repouso |
| `imob_hml` | `db` | `postgres:17.12`, com o volume `imob_hml_db` | 192 MB / 512 MB | No ar; 60 MB em repouso |
| `imob_hml` | `worker` | `ghcr.io/projeto-imob/imob:<commit>` | 96 MB / 192 MB | 0 réplicas até a primeira tarefa agendada |
| `imob_prd` | Os mesmos três | As mesmas | As mesmas | Planejada na 1.10, com aprovação manual |

Também fazem parte da stack:
- **Rede:** `imob_<ambiente>_interno`, sem porta publicada. Só o `app` entra também na rede do Traefik.
- **Tarefa avulsa `imob-migracao`:** roda o bootstrap, o migrate e o seed, e termina.
- **Timer `imob-backup@<ambiente>`:** no systemd do servidor.

O servidor também roda stacks de outros projetos e clientes. O Imob nunca as toca.

### 3.4 Ferramentas de trabalho

- **Máquina do Matheus:** Windows 11 com 8 GB, sem Docker, e Postgres 17 portátil para desenvolver e testar.
- **Claude Code no VS Code, com o método forja (`/forja:*`).** O planejamento e a revisão são sempre em Opus; a implementação, em Sonnet.
- **Linha de comando:**
  - `gh` (GitHub CLI) autenticado;
  - `age` e `rclone` para os backups;
  - SSH por chave, com o agente do Windows.

### 3.5 Estrutura do repositório

```
src/app/            rotas: página do empreendimento e /api/saude
src/modulos/        um módulo por domínio, com index.ts como API pública:
                    catalogo, busca, contas, atendimento e analytics
src/server/         só servidor: db/ (conexão, contexto e schema Drizzle) e saude.ts
src/components/     interface comum (T.tsx e layout)
src/i18n/           catálogo de textos
src/seed/           seed fictício único, marcado como exemplo
src/lib/            utilitários sem domínio
config/             brand.ts, flags.ts e scoring.config.ts
db/migrations/      SQL: tabelas (geradas pelo drizzle-kit) e segurança (RLS, funções e GRANTs, à mão)
scripts/            catálogo, check-secrets, termos proibidos, db/ (CLI do banco) e conferir-papel.ts
infra/              stack do Swarm, deploy.sh, backup.sh, restaurar-teste.sh e o timer do backup (systemd)
tests/              unit/, banco/ e e2e/
docs/               SPEC, PLANO, ARQUITETURA, DIARIO, AUDITORIA, specs/ por área e este retrato
Dockerfile          alvos app (Next standalone, sem root) e migracao (CLI de banco)
.github/workflows/  ci.yml (qualidade, banco, build, e2e e imagem) e deploy.yml
```

### 3.6 Como uma mudança chega à homologação

1. **PR:** o CI roda cinco jobs:
   - `qualidade`: segredos, lint, typecheck, catálogo e unidade;
   - `banco`: Postgres real;
   - `build`;
   - `e2e`, com axe;
   - `imagem`: monta as imagens e testa bootstrap, migrations, seed, a recusa do papel errado, a saúde e a página.
2. **Merge na `main`,** sempre pelo Matheus. O workflow **Deploy** monta as imagens `imob` e `imob-migracao` com a tag do commit e publica no GHCR (pacote público, sem segredo).
3. **No servidor,** o Actions entra por SSH com uma chave que só roda o `deploy.sh`. O script faz, nesta ordem:
   1. backup cifrado de segurança;
   2. migrations, com o papel `migrator`;
   3. seed fictício, só em homologação;
   4. troca da stack;
   5. espera a `/api/saude` responder com a versão nova.

   Se a saúde falhar, ele volta sozinho à versão anterior.
4. **Voltar a qualquer commit publicado:** Actions > Deploy > Run workflow.

**Backup:** `pg_dump` cifrado com `age` e enviado ao R2 todo dia às 3h e antes de cada deploy, com retenção de 30 dias. O servidor só tem a chave pública: ele cifra, mas não consegue ler os backups.

### 3.7 Segurança e dados

- **Papéis do banco:** `migrator`, dono das tabelas; `app_user`, o app; `auth_service`, o login; `worker`. Nenhum deles é superusuário nem ignora o RLS.
  - O app só sobe conectado como `app_user` (`scripts/conferir-papel.ts`).
  - O app e o worker têm limite de tempo por consulta e por transação parada (**Proposta**: 15 s e 30 s para o app e o auth, 60 s e 60 s para o worker).
- **Isolamento:** cada incorporadora vê só os próprios dados (regra 14). O contato do comprador só aparece com interesse confirmado e consentimento (regra 5).
- **Dados:** só fictícios em desenvolvimento, testes e homologação. Dados reais só em produção, no piloto (D17).
- **Segredos:** nunca no repositório. A fonte da verdade é o Bitwarden (D18). Veja a seção 7.

## 4. Fases e fatias

Legenda: ✅ feito · 🔄 em andamento · 📝 plano pronto, esperando aprovação · ⏳ ainda não começou

### Fase 0: fundação de produção

| Fatia | Entrega | Situação |
|---|---|---|
| 0.1 | Repositório no GitHub, `main` protegida e CI | ✅ PR #1 (14/11) |
| 0.2 | Banco local e de teste, migrations com RLS, seed e testes de banco | ✅ PR #3 (16/11) |
| 0.3 | Módulos de domínio e página do empreendimento lendo do banco | ✅ PR #7 (16/11) |
| 0.4 | Homologação no servidor, como stack isolada | 🔄 **No ar desde 17/11** (PR #4 e PR #9), com memória medida e stacks vizinhas intactas. Falta: a PR com os ajustes do primeiro deploy, ensaiar a volta e a restauração do backup, o monitor de disponibilidade e as senhas do banco no Bitwarden |
| 0.5 | Correções da auditoria | 🔄 **0.5a** aprovada; implementação começou em 17/11 (correções da busca, CSP, Dependabot e padrões do `check:secrets`). A **0.5b** fica para depois de 01/12 (gitleaks, actions por SHA e suíte estável) |

### Fase 1: piloto (v1)

| Fatia | Entrega | Situação |
|---|---|---|
| 1.1 | Página do empreendimento completa (F1) | 🔄 Plano aprovado; implementação começou em 17/11. Tamanho M |
| 1.2 | Questionário com contagem ao vivo (F2) | 📝 Plano aprovado; começa depois da PR 1 da 0.5a. Tamanho G |
| 1.3 | Resultado e lead (F3 e F4) | 📝 Plano aprovado; começa depois da 1.1 e da 1.2. Tamanho M. A entrega do lead à house está em decisão |
| 1.3b | Interface completa do MVP, com cadeado e login simples | 🔄 Lista de funcionalidades aprovada em 17/11; plano em Opus em andamento |
| 1.3c | **Mapa e Favoritos no MVP**, para o comprador e a incorporadora (decisão de 17/11, que muda a D2) | 🔄 Plano em Opus em andamento, junto com a 1.3b |
| 1.4 | Contas e login rápido (F10 e F5) | ⏳ Depois de 01/12 |
| 1.5 | Visita em 3 toques (F5) | ⏳ Depende da conta do Resend |
| 1.6 | Fila da house (F7) | ⏳ |
| 1.7 | Área mínima da incorporadora (F8) | ⏳ |
| 1.8 | Cadastro e publicação pela equipe (F9) | ⏳ |
| 1.9 | Falar com o gerente, privacidade e home (F6, F11 e F12) | ⏳ |
| 1.10 | Lançamento do piloto em produção | ⏳ Bloqueada por P5, C14, C15, domínio de produção e decisão de memória |

### Fases 2 e 3

São fatiadas depois que a v1 estiver no ar.
- **Fase 2:** mapa, favoritos e alertas, CRMs, cadastro pela incorporadora, god mode de personalização, impersonate e comparador.
- **Fase 3:** Mais Buscados e Vitrine Destacada, mídia, proposta e contrato, simulador e IA.

### Números de hoje

- 360 testes de unidade e 63 de banco, todos verdes.
- 5 jobs no CI.
- 9 PRs: 6 entregues e 3 do Dependabot.

## 5. O que falta até 01/12

### 5.1 Ordem de execução (agentes em paralelo)

1. **Fechar a 0.4:** a PR dos ajustes, os ensaios de volta e de restauração e o monitor.
2. **0.5a, PR 1** (correções da busca). É a primeira, porque destrava a 1.2 e a 1.3.
3. **1.1** em paralelo com a 0.5a.
4. **1.2** depois da PR 1 da 0.5a.
5. **1.3** depois da 1.1 e da 1.2.
6. **1.3b** depois do protótipo e da lista aprovados.
7. **0.5a, PR 2** (CSP, Dependabot e padrões do `check:secrets`) entra quando houver folga.

Regras do trabalho em paralelo:
- cada fatia fica numa pasta de trabalho própria (`git worktree`), com banco local próprio;
- no máximo 2 agentes implementando ao mesmo tempo, porque a máquina tem 8 GB;
- o planejamento e a revisão são sempre em Opus, e a implementação, em Sonnet;
- commit, push e PR estão autorizados por fatia; o merge é sempre do Matheus.

### 5.2 Riscos

- **Prazo:** uma fatia G e três M em 12 dias, mais a 1.3b. A válvula de escape são os cortes de cada plano, que deixam funcionalidades desligadas por flag (regra 20).
- **Migrations em paralelo:** o Drizzle pula sem avisar uma migration mais antiga que a última aplicada. Cada fatia numera a sua só no fim, depois de atualizar a branch com a `main`, e nunca edita migration já mergeada.
- **Memória do servidor:** com a homologação no ar, ainda há cerca de 1,2 GB disponíveis. O app e o banco usam juntos uns 150 MB em repouso, e a reserva é de 384 MB. A produção junto com a homologação é decidida na 1.10.
- **Cota do Claude:** muitos agentes em paralelo esgotam a cota.

## 6. Decisões que esperam o Matheus

> **17/11, à noite:** o Matheus aprovou as recomendações abaixo, com duas ressalvas:
> - item 9: Mapa e Favoritos entram no MVP de verdade, sem cadeado, na fatia nova 1.3c;
> - item 3: em seguida, ele escolheu, entre opções novas, a entrega do lead à house pelo WhatsApp (via n8n) e pelo e-mail (Resend) juntos.

**Novas, dos planos de 17/11 (com a recomendação):**

1. **Aprovar os planos da 0.5a, da 1.1 e da 1.2/1.3 e a lista de funcionalidades do protótipo.** O protótipo fica em `C:\dev\imob-prototipo\index.html`, fora do repositório.
2. **Contato do gerente (WhatsApp, e-mail e telefone) liberado até 01/12.** Recomendação: sim. É o caminho do lead no piloto (decisão de 16/11).
3. **Como o lead chega à house em dezembro.** Recomendação: pelo cartão do gerente, com o lead gravado para a 1.6. O e-mail automático (Resend) entra antes do tráfego pago.
4. **Índice dos planos.** Recomendação: mostrar "corrigidas pelo índice do contrato", sem dizer o nome do índice (regra 3).
5. **Fotos na demonstração.** Recomendação: fachadas ilustradas, como no protótipo, sem custo. Fotos fictícias custariam cerca de 1 dia.
6. **Pergunta 9b do modo Investir ("O que você busca com o investimento?").** Recomendação: manter como está na spec. Ela só registra a resposta, nunca pontua e não promete nada.
7. **Duas exceções técnicas:**
   - o progresso do questionário salvo no navegador, liberado num único arquivo;
   - a rota pública de contagem sem login, que devolve só números agregados.

   Recomendação: aprovar as duas.
8. **Área da incorporadora:** "Meus empreendimentos" liberado só com dados de cadastro, sem nenhum número de comprador. Recomendação: sim.
9. **Navegação:** Mapa e Favoritos aparecem com cadeado. Recomendação: sim, como pede a 1.3b.
10. **Padrões novos do `check:secrets` já na 0.5a.** Recomendação: sim.
11. **Contato do plantão da incorporadora no cartão de vendas.** As specs se contradizem. Até a decisão, a página mostra só a house.

**Do PLANO, ainda em aberto:**
- **P5:** primeiro cliente e praça.
- **C14:** parâmetros da busca.
- **C15:** validação jurídica, que bloqueia a produção.
- **Conta do Resend:** bloqueia o e-mail real.
- **Domínio de produção:** compra com custo.
- **Hetzner Backups:** recomendado.
- **Memória da produção:** decidida na 1.10.

## 7. Onde fica cada coisa (sem segredos)

| O quê | Onde |
|---|---|
| Especificação, regras e decisões | `docs/SPEC.md`, `docs/specs/`, `docs/PLANO.md` e `docs/ARQUITETURA.md` |
| Histórico das sessões | `docs/DIARIO.md` |
| Senhas e chaves | **Bitwarden** do Matheus (D18). Estão lá a chave privada dos backups e as senhas do banco da homologação |
| Credenciais do servidor, do R2 e do Sentry | Pasta protegida de credenciais no computador do Matheus, fora de qualquer repositório |
| Segredos do deploy | Ambiente `homologacao` do GitHub: `DEPLOY_HOST`, `DEPLOY_KNOWN_HOSTS`, `DEPLOY_SSH_KEY` e a variável `IMOB_DOMINIO`. O DSN do navegador é uma variável do repositório |
| Endereço da homologação | Variável `IMOB_DOMINIO` no GitHub. Fica fora do repositório, de propósito |
| Arquivos do servidor | `/opt/imob/<ambiente>/` (ambiente, senhas e trava do deploy) e `/opt/imob/backup/` (chave pública e acesso ao R2), legíveis só pelo usuário `deploy` |
| Backups | Bucket `imob-backups` no R2, cifrados, por 30 dias |
| Erros | Projeto `imob` no Sentry |
| Imagens | `ghcr.io/projeto-imob/imob` e `ghcr.io/projeto-imob/imob-migracao` (públicas) |

## 8. Como trabalhar no projeto

- **Método forja**, uma fatia por vez:
  1. `/forja:retomar`;
  2. plano e aprovação;
  3. implementação com teste primeiro;
  4. `/forja:revisar`;
  5. PR;
  6. merge do Matheus;
  7. `/forja:salvar`.
- **Regras inegociáveis:** as 20 do `CLAUDE.md` valem acima de tudo, como R.I. obrigatório, imparcialidade da busca, LGPD, isolamento e dados fictícios fora da produção.
- **Comandos principais:**
  - `npm run dev`;
  - `npm test`, `npm run test:db` e `npm run test:e2e`;
  - `npm run lint`, `npm run typecheck` e `npm run check:secrets`;
  - `npm run db:start` e `npm run db:reset`;
  - `IMOB_STANDALONE=1 npm run build`, o build igual ao da imagem.
- **Servidor compartilhado** com outros projetos e clientes:
  - só adicionar, com prefixo `imob_`;
  - nunca mexer nas stacks vizinhas;
  - toda ação no servidor precisa do OK do Matheus.
