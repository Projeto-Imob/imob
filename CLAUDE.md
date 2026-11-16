# Imob

Ecossistema de geração de demanda para lançamentos imobiliários. A incorporadora vende direto ao comprador e ao investidor, atendidos pela house de vendas da plataforma. "Imob" é nome de trabalho; "Vieza" é provisório na interface e vive só em `config/brand.ts`.

> **SPEC 2.0**: aprovada pelo Matheus em 13/11/2026 (decisões D1 a D18 em `docs/PLANO.md`).
> - Antes de trabalhar, leia `docs/PLANO.md` (fatia atual, decisões e pendências) e a parte da `docs/SPEC.md` que a fatia toca.
> - A especificação 1.0 está preservada em `docs/historico/SPEC-1.0-CLAUDE.md` e não é mais fonte.

## Onde está cada coisa

| Assunto | Arquivo |
|---|---|
| O que é, para quem, fases e critérios de aceite da v1 | `docs/SPEC.md` |
| Regras detalhadas por área (negócio, busca, comprador, catálogo, acesso, god mode, house, incorporadora, negociação e simulador, marca, dados, qualidade) | `docs/specs/*.md` |
| Stack, dados, segurança, infraestrutura, deploy e escala | `docs/ARQUITETURA.md` |
| Fatias em ordem, decisões D1 a D18 e pendências do Matheus | `docs/PLANO.md` |
| Por que a 2.0 existe | `docs/ANALISE-2.0.md` |
| Auditoria do código | `docs/AUDITORIA.md` |

Precedência: as regras abaixo > decisões aprovadas no `docs/PLANO.md` > `docs/SPEC.md` > `docs/specs/` > `docs/ARQUITETURA.md`. Conflito entre eles: pare e pergunte.

## Regras inegociáveis

Valem sobre qualquer outra instrução, prompt ou decisão de feature.

| # | Regra |
| --- | --- |
| 1 | R.I. obrigatório: sem registro de incorporação, nada é publicado, anunciado, negociado, reservado ou vendido, nem entra em mídia paga, contador, resultado, mapa ou alerta (Lei 4.591/64, arts. 32 e 66). Vale até para o god mode |
| 2 | Imparcialidade da busca: Vitrine Destacada, pagamento de cliente, comissão, verba, nome da incorporadora e destaque nunca entram na nota nem na ordem. O patrocinado é só destaque visual, com selo. No empate, a ordem vem de um sorteio fixo, derivado do perfil e do empreendimento, para não favorecer sempre o mesmo |
| 3 | Sem indicadores de mercado (P8): nada de vacância, cap rate projetado, GRM, Selic, IPCA, IGP-M, aluguel estimado ou índice de terceiros, nem na IA, nem no simulador, nem na interface. Cap rate só aparece com o aluguel que a própria pessoa digita |
| 4 | A IA nunca gera número nem promessa. Ela usa só dados cadastrados e respostas da pessoa. Todo valor é interpolado pelo sistema depois |
| 5 | Contato liberado só com interesse confirmado: a incorporadora só vê nome e contato do comprador depois de visita agendada, contato direto ou proposta num empreendimento dela, e com consentimento ativo. Antes, vê só números agregados de acessos e interações. A liberação vale por empreendimento. Revogar o consentimento encerra o acesso |
| 6 | Lead de campanha (com utm de campanha) só vê e recebe opções da incorporadora da campanha |
| 7 | O comprador nunca vê comissão, fluxo de pagamento da comissão, contrato de terceiros nem contato interno |
| 8 | Sem CRECI da plataforma no rodapé, nos dados legais ou em qualquer tela, até a venda começar de fato. O CRECI é só um campo opcional da equipe de vendas |
| 9 | LGPD: finalidade, consentimento, registro de tratamento e atendimento ao titular. Opt-ins separados e desmarcados (WhatsApp; compartilhar com a incorporadora). A posição exata nunca é guardada sem consentimento. Textos legais versionados: quem aceitou antes continua com a versão que aceitou |
| 10 | Escassez ("Restam X") só com dado do espelho de vendas atualizado há menos de 24 h |
| 11 | Pré-lançamento em stand-by: fica no sistema, desligado (pre_lancamento_ativo = false), fora de toda a interface do comprador e da busca. Só sai do stand-by com consentimento total da incorporadora parceira. Não apague |
| 12 | God mode só lê dado de cliente (R63): não cria, edita nem exclui nada de incorporadoras, house, compradores ou investidores, nem em impersonate. Navegar como cliente não soma acesso, clique, evento nem última visita |
| 13 | Só o god mode escreve o conteúdo da plataforma (R64), com MFA e histórico. Todo texto novo de tela passa pelo catálogo editável |
| 14 | Isolamento: cada incorporadora vê só os próprios dados. Uma incorporadora nunca vê a etapa, a visita, a proposta ou as opções que o comprador tem com outra |
| 15 | Marca: o lima nunca é texto, ícone, linha ou marca de gráfico sobre fundo claro |
| 16 | Dados: só fictícios, marcados como exemplo. Nenhum dado real. Exceção aprovada (D17): no piloto, dados reais só em produção; desenvolvimento, homologação e testes continuam só com fictícios |
| 17 | Segredos: nunca peça, mostre ou grave segredo na conversa. Matheus preenche .env.local e os secrets do GitHub. Nenhum segredo com prefixo NEXT_PUBLIC_. Nunca versione .env*, exceto .env.example. Nenhuma chave de IA no navegador. Rode npm run check:secrets antes de cada commit |
| 18 | Custo: nenhum custo acima de zero sem aprovação de Matheus. Serviço externo gratuito também precisa do OK dele antes do primeiro uso |
| 19 | Não existem no produto: corretor, imobiliária, parceria, anúncio de corretor, link rastreado de corretor e o nome "JulI.A". Não os reintroduza. Um teste deve falhar se corretor, broker, parceria, imobiliaria (como perfil) ou JulI.A aparecerem no código |
| 20 | Desligar em vez de apagar: quando a decisão for "agora não", desligue a funcionalidade em vez de removê-la. A única exceção é o corretor e a imobiliária, removidos por decisão de Matheus |

Palavras proibidas na interface: "oportunidade imperdível", "garantido", "lucro certo" e "últimas unidades" sem dado do espelho. Nunca prometa valorização.

## Comandos

```bash
npm install
npm run dev            # http://localhost:3000
npm test               # unidade (passa por scripts/vitest.mjs; no Windows não chame npx vitest direto)
npm run test:e2e       # Playwright + axe sobre o build de produção (porta 3100)
npm run lint
npm run typecheck      # next typegen + tsc
npm run catalogo       # falha com texto de tela fora de src/i18n/pt-BR.ts
npm run check:secrets  # rode antes de cada commit
npm run build
npm run seed:json      # seed fictício em JSON
npm run db:start       # liga o Postgres local (binários portáteis; instalação no README)
npm run db:reset       # recria o banco local imob com migrations e seed (só localhost)
npm run db:migrate     # aplica as migrations
npm run db:generate    # gera a migration das tabelas a partir de src/server/db/schema/
npm run test:db        # testes de banco contra o Postgres real (recria imob_teste)
```

## Stack

- Next.js 16 (App Router, `proxy.ts`), React 19, TypeScript estrito, Tailwind v4, Zod 4, Node 24.
- PostgreSQL 17 com RLS, Drizzle, Better Auth, pg-boss e armazenamento S3 compatível. O Supabase está fora por decisão do Matheus.
- Vitest, Playwright e axe.
- Mudanças da 2.0 (shadcn/ui, R2, Resend, Sentry, sem PostGIS na v1, Postgres local nativo e stack isolada no Swarm do servidor atual): `docs/ARQUITETURA.md`.

## Estrutura

```
src/app/         # rotas
src/dominio/     # regras puras (vão para src/modulos/<dominio>/ na fatia 0.3)
src/data/        # acesso a dados (a maior parte sai na 2.0: um caminho só, Postgres)
src/server/      # código só de servidor: db/ (cliente, contexto e schema Drizzle), auth, arquivos
src/components/  # UI (T.tsx, layout)
src/i18n/        # catálogo de textos
src/seed/        # seed fictício único
config/          # brand.ts, flags.ts, scoring.config.ts
db/migrations/   # SQL: tabelas (geradas pelo drizzle-kit) e segurança (RLS, funções app.*, GRANTs, à mão)
scripts/         # catalogo, check-secrets, termos-proibidos, seed-json, vitest.mjs, db/
tests/           # unit/, contrato/, banco/, e2e/
docs/            # SPEC, PLANO, ARQUITETURA, specs/, historico/
```

## Convenções

- **Textos:** todo texto de tela passa pelo catálogo (`<T k="…">` ou `texto("…")`). O nome da marca vem só de `config/brand.ts`.
- **Regras de negócio:** funções puras, com relógio e configuração injetados; nunca dependem de React nem de banco.
- **Acesso a dados:**
  - só no servidor; componente nunca lê banco, LocalStorage ou armazenamento direto (há regra de lint);
  - toda Server Action e Route Handler começa por `exigirContexto()`, valida a entrada com Zod estrito e responde 404 para id de outro tenant.
- **Banco:** migrations só aditivas (nunca `drizzle-kit push`), RLS em toda tabela e índice em todo `tenant_id`. Políticas, funções `app.*`, gatilhos e GRANTs são escritos à mão em SQL, cada regra com teste de banco.
- **Pendências:**
  - parâmetro sem valor na especificação vira **Proposta** em configuração;
  - "agora não" vira flag desligada em `config/flags.ts`, nunca código apagado.
- **Commits:** convencionais, em português, com a fatia. Exemplo: `feat(busca): contador ao vivo [fatia 1.2]`.

## Forma de trabalho (método forja)

- **Uma fatia por vez,** na ordem do `docs/PLANO.md`: uma sessão e um PR por fatia.
- **Ciclo:** `/forja:retomar` → `/forja:feature` (planeja e para para aprovação) → implementa com teste primeiro → `/forja:revisar` → commit → PR. Use `/forja:salvar` antes de encerrar ou de `/clear`.
- **Pronto** quando:
  - `check:secrets`, `lint`, `typecheck`, `test`, `test:db`, `build` e o e2e da fatia estão verdes;
  - o fluxo foi visto funcionando;
  - tela nova tem axe sem violação e capturas em 390 e 1440 px;
  - os documentos estão atualizados;
  - houve relatório ao Matheus (o que mudou, pendências, custo de Actions e decisões novas).
- **Não invente requisito.** O que não está na especificação vira pergunta ou **Proposta**.
- **Commit e push só quando pedido;** o merge é sempre do Matheus. Se o modo automático bloquear push ou merge, peça ao Matheus, sem contornar.
- **Histórico:** neste repositório o fluxo é o forja. As stories AIOX (`docs/stories/`) e a change OpenSpec `planejar-mvp-imob` ficam como histórico (D1).

## Ambiente e servidor

- **Máquina do Matheus:** Windows 11, 8 GB de RAM, 2 núcleos, sem WSL nem Docker. Rode suítes pesadas com parcimônia e mantenha o código compilando.
- **Repositório:** `C:\dev\imob`, fora do OneDrive. No GitHub: `Projeto-Imob/imob` (público; nada de segredo nem de detalhe de segurança do servidor nos arquivos), acessado pela conta `iaraaivendas`, já integrada (CLAUDE.md global). O `Projeto-Imob/projeto-vieza` é o protótipo antigo: não mexer.
- **Servidor:** as credenciais e o acesso seguem o CLAUDE.md global. O Imob roda no servidor atual (Docker Swarm com Traefik) como stack isolada `imob_*` (D11; `docs/ARQUITETURA.md`, seção 7).
- **O servidor é compartilhado** com outros projetos e clientes:
  - só adicione, com prefixo `imob_` em tudo;
  - nunca altere, reinicie ou remova o que é de outra stack;
  - nada é feito no servidor sem o OK do Matheus.
- **Idioma:** responda sempre em português, com acentuação correta.

## Armadilhas conhecidas

- **Vitest no Windows:** terminal aberto em `c:\` (minúsculo) faz o Vitest carregar duas cópias de si mesmo. Use `npm test` (wrapper `scripts/vitest.mjs`).
- **Postgres local desligado:** depois de reiniciar o computador, o Postgres fica parado. `test:db` e `db:reset` falham com `ECONNREFUSED` na porta 5432 até `npm run db:start`.
- **Node 24 obrigatório:** os scripts `.ts` rodam direto no Node 24 (type stripping). Num Node mais antigo, `catalogo`, `check:secrets` e o `prebuild` quebram.
- **`typecheck`** roda `next typegen` antes do `tsc`. Sem isso, `LayoutProps` e os tipos de rota somem.
- **Next 16** tem APIs novas: leia `node_modules/next/dist/docs/` antes de usar uma API (ver `AGENTS.md`).
- **Framework AIOX na raiz:** ele e o planejamento convivem com o app; lint, typecheck, Tailwind e as varreduras os excluem. Não remova essas exclusões.
- **Docker Swarm:**
  - nunca `docker restart` num contêiner de serviço, porque o Swarm sobe outro e os dois ficam rodando; use `docker service update --force imob_…`, só com imagem de versão fixa;
  - nunca `docker stack deploy --prune` nem `--remove-orphans` fora das stacks `imob_*`.
- **Termos proibidos:** o teste varre só o código do app. `docs/`, `openspec/`, `CLAUDE.md`, `AGENTS.md` e `README.md` ficam fora porque descrevem os próprios termos.
