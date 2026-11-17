# Imob

Aplicação Next.js 16 do Imob, na raiz do repositório.

## Documentação (SPEC 2.0)

| Arquivo | O que tem |
|---|---|
| `CLAUDE.md` | Regras inegociáveis e forma de trabalhar no repositório |
| `docs/SPEC.md` | O que é, para quem, fases e critérios de aceite da v1 |
| `docs/specs/` | Regras detalhadas por área |
| `docs/ARQUITETURA.md` | Stack, dados, segurança, infraestrutura, deploy e escala |
| `docs/PLANO.md` | Fatias em ordem, decisões e pendências |
| `docs/ANALISE-2.0.md` | Por que a especificação mudou |
| `docs/historico/` | Especificação 1.0, preservada |

## Começar

```bash
npm ci
cp .env.example .env.local   # só no seu computador; nunca versione
npm run dev                  # http://localhost:3000
```

Na primeira vez, para os testes ponta a ponta: `npx playwright install chromium --only-shell`.

## Comandos

| Comando | O que faz |
|---|---|
| `npm run lint` | ESLint, com as fronteiras: módulos pelo índice, banco e arquivos só em `src/server` e nos `consultas.ts`/`acoes.ts`, nada guardado no navegador e sem `sql.raw` |
| `npm run typecheck` | TypeScript estrito |
| `npm test` | Testes de unidade (Vitest) |
| `npm run test:e2e` | Playwright + axe sobre o build de produção (porta 3100), lendo do banco local: rode `npm run db:reset` antes |
| `npm run catalogo` | Falha com texto fora de `src/i18n/pt-BR.ts`; gera `src/i18n/catalogo.gerado.json` |
| `npm run check:secrets` | Falha com `.env*` versionável ou padrão de segredo; rode antes de cada commit |
| `npm run build` | Build de produção (roda `catalogo` antes) |
| `npm run db:start` / `db:stop` / `db:status` | Liga, desliga e mostra o Postgres local |
| `npm run db:reset` | Recria o banco local `imob`, aplica as migrations e grava o seed fictício (só em localhost) |
| `npm run db:migrate` / `db:seed` / `db:bootstrap` | Aplica migrations, grava o seed, cria papéis e banco |
| `npm run db:generate` | Gera a migration das tabelas a partir de `src/server/db/schema/` |
| `npm run test:db` | Testes de banco contra o Postgres real (recria `imob_teste` a cada execução) |

## Banco local (sem Docker)

PostgreSQL 17 com os binários portáteis oficiais, fora do repositório (decisão D4). Uma vez por máquina:

1. Baixe o zip "PostgreSQL binaries" da versão 17 no site da EDB e extraia as pastas `pgsql/bin`, `pgsql/lib` e `pgsql/share` em `C:\dev\ferramentas\pgsql`.
2. Crie o cluster, só com acesso local:
   ```bash
   C:\dev\ferramentas\pgsql\bin\initdb.exe -D C:\dev\ferramentas\pgdata-imob -U postgres -A trust -E UTF8 --locale-provider=builtin --builtin-locale=C.UTF-8
   ```
3. `npm run db:start` e depois `npm run db:reset`.

Outros caminhos: defina `PG_BIN` e `PGDATA_IMOB`. Depois de reiniciar o computador, basta `npm run db:start`.

O banco local só guarda dados fictícios e aceita conexão só da própria máquina, sem senha. Em homologação e produção, cada papel tem senha e as URLs vêm do ambiente (`.env.example`).

## Onde fica cada coisa

- `config/brand.ts`: nome e logotipo (provisórios).
- `config/flags.ts`: flags de funcionalidade, todas desligadas.
- `config/scoring.config.ts`: parâmetros **Proposta** da busca (C14).
- `src/app/globals.css`: tokens de cor e tipografia.
- `src/i18n/pt-BR.ts` e `src/components/T.tsx`: catálogo de textos.
- `src/modulos/<modulo>/`: regras, tipos, consultas e componentes de cada domínio; o resto do app importa pelo `index.ts`.
- `db/migrations/`: tabelas (geradas) e segurança e vitrine (escritas à mão).

## Observação para Windows

`npm test` passa por `scripts/vitest.mjs`, que normaliza a letra do drive: um terminal aberto em `c:\` minúsculo faz o Vitest carregar duas cópias de si mesmo.
