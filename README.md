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
| `npm run lint` | ESLint, incluindo a regra que proíbe acesso a dados fora de `src/data/` e `src/server/` |
| `npm run typecheck` | TypeScript estrito |
| `npm test` | Testes de unidade (Vitest) |
| `npm run test:e2e` | Playwright + axe sobre o build de produção (porta 3100) |
| `npm run catalogo` | Falha com texto fora de `src/i18n/pt-BR.ts`; gera `src/i18n/catalogo.gerado.json` |
| `npm run check:secrets` | Falha com `.env*` versionável ou padrão de segredo; rode antes de cada commit |
| `npm run build` | Build de produção (roda `catalogo` antes) |

## Onde fica cada coisa

- `config/brand.ts`: nome e logotipo (provisórios).
- `config/flags.ts`: flags de funcionalidade, todas desligadas.
- `config/scoring.config.ts`: parâmetros **Proposta** da busca (C14).
- `src/app/globals.css`: tokens de cor e tipografia.
- `src/i18n/pt-BR.ts` e `src/components/T.tsx`: catálogo de textos.

## Observação para Windows

`npm test` passa por `scripts/vitest.mjs`, que normaliza a letra do drive: um terminal aberto em `c:\` minúsculo faz o Vitest carregar duas cópias de si mesmo.
