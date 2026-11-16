# Arquitetura — SPEC 2.0

> **Status:** aprovada pelo Matheus em 13/11/2026. As decisões D1 a D18 estão em `docs/PLANO.md` → Decisões. A D11 foi ajustada por ele: o Imob roda no servidor atual (Nuremberg), como stack isolada.
> Princípios: tecnologia chata e popular, um caminho de dados, segurança no banco, cópia antes de produção, medir antes de otimizar e, no servidor compartilhado, só adicionar.

## 1. Visão geral

```
Navegador (celular primeiro)
   │ HTTPS
   ▼
Firewall de nuvem da Hetzner (só 80, 443 e SSH)
   ▼
Traefik (já existente no servidor, compartilhado): HTTPS automático por subdomínio
   ▼
Stack imob_<ambiente> no Docker Swarm (isolada das stacks vizinhas)
   ├─ app: Next.js 16 standalone (sem estado)
   │     exigirContexto() → transação com set_config(app.conta_id, …)
   ├─ worker: pg-boss (tarefas agendadas)
   └─ db: PostgreSQL 17 próprio do Imob (RLS em toda tabela, sem porta publicada)
   │
   ├─► Cloudflare R2: fotos, plantas, documentos e backups cifrados
   ├─► Resend: e-mail transacional
   └─► Sentry (erros) e monitor de disponibilidade
```

É um monólito modular em Next.js, com banco próprio e um worker, dentro de uma stack do Swarm que não toca nas outras. É o desenho mais simples que atende multi-tenant com isolamento forte, e escala em etapas medidas (seção 11).

## 2. Stack

| Camada | Escolha | Situação na 2.0 |
|---|---|---|
| Framework | Next.js 16 (App Router, `proxy.ts`), React 19, TypeScript estrito | Mantida (instalada, versões fixadas) |
| Estilo e componentes | Tailwind v4 + **shadcn/ui** (Radix) com os tokens da marca | shadcn/ui é **nova** (D7) |
| Formulários e validação | React Hook Form + Zod 4 | Mantida |
| Estado no cliente | URL e servidor primeiro; Zustand só se uma tela precisar | Simplificada |
| Banco | **PostgreSQL 17**, instância própria do Imob, RLS em toda tabela | Mantida; PostGIS **adiado** (D5) |
| ORM e migrations | Drizzle ORM + drizzle-kit; políticas, funções e gatilhos em SQL revisado | Mantida |
| Autenticação | Better Auth (e-mail e senha, recuperação, TOTP), sessões no Postgres | Mantida |
| Tarefas agendadas | pg-boss num processo `worker` | Mantida |
| Arquivos | **Cloudflare R2** (S3 compatível, camada gratuita) | Aprovado (D8); MinIO **removido** |
| E-mail | Resend + React Email, atrás da flag `email_real` | Aprovado (D9) |
| Mapa | MapLibre GL + OpenFreeMap, carregados sob demanda | Mantida; OpenFreeMap aprovado |
| Gráficos | Recharts | Fase 2 |
| Observabilidade | Sentry (camada gratuita) + logs JSON + monitor de disponibilidade | Aprovado (D10) |
| Testes | Vitest (unidade e banco), Playwright + axe (e2e) | Mantida; testes de banco contra Postgres real (D13) |
| Dados no navegador | Só conveniências do visitante | Adaptador LocalStorage dos repositórios **removido** (D3) |
| Infraestrutura | Stack própria no Docker Swarm do servidor atual, atrás do Traefik existente | Aprovado (D11 ajustada) |
| Deploy | Imagens no GHCR por commit + `docker stack deploy` por GitHub Actions | Aprovado (D12) |

Regra para dependência nova: dizer por quê, fixar a versão e conferir a documentação atual (context7 ou `node_modules/next/dist/docs`) antes de usar a API.

## 3. Organização do código

Até a 1.0, o código era organizado por camada (`src/dominio`, `src/data`, `src/server`). Com 25 capacidades e cinco áreas de usuário, isso vira pasta-depósito. A 2.0 organiza **por domínio** (D6), desde a fatia 0.3:

```
src/
  app/                      # rotas: (publico)/, conta/, house/, incorporadora/, interno/, api/
  modulos/
    catalogo/               # empreendimentos, subcondomínios, tipologias, unidades, planos, publicação
    busca/                  # questionário, contagem, nota, escolha, motivo, recomendação
    atendimento/            # leads, fila da house, visitas, passagem ao gerente
    contas/                 # tenants, contas, convites, papéis, MFA
    privacidade/            # consentimentos, versões legais, direitos do titular
    analytics/              # eventos anônimos, números agregados
    <modulo>/
      regras.ts             # funções puras: sem React, sem banco, relógio injetado (a busca tem um arquivo por regra)
      tipos.ts              # schemas Zod de fronteira do módulo
      consultas.ts          # acesso a dados (server-only)
      acoes.ts              # Server Actions: exigirContexto() + Zod estrito
      componentes/          # UI do módulo
      index.ts              # API pública: o resto do app importa só daqui
  server/
    db/                     # cliente, contexto por transação e schema/ (tabelas Drizzle de todos os módulos)
    auth/, arquivos/, email/, observabilidade/
  lib/                      # utilitários sem domínio (esquemas Zod básicos, geo, formato, metadata)
  ui/                       # shadcn/ui (gerado, não editar à mão) e layout
  i18n/                     # catálogo de textos (pt-BR) e <T>
  styles/                   # tokens da marca e CSS global
  seed/                     # seed fictício único
config/                     # brand.ts, flags.ts, scoring.config.ts
db/migrations/              # SQL versionado: tabelas (geradas) e segurança (à mão: RLS, funções app.*, gatilhos, GRANTs)
scripts/db/                 # Postgres local, papéis, migrate, seed e reset
infra/                      # stack do Swarm, scripts de backup e deploy (sem segredos)
tests/                      # unit/, banco/, e2e/
```

As tabelas Drizzle ficam num lugar só, `src/server/db/schema/` (decisão da 0.2): o drizzle-kit e os scripts de banco leem o schema direto, sem depender dos módulos. Cada módulo lê e escreve as próprias tabelas pelo `consultas.ts`.

Regras de dependência, verificadas por lint (`eslint.config.mjs`, testadas em `tests/unit/lint-acesso-dados.test.ts`):
- Um módulo importa outro **só pelo `index.ts`**; no servidor, também por `consultas.ts` e `acoes.ts`. Dentro do módulo, só `./`.
- Banco (`src/server/db` e o driver) e arquivos (`src/server/arquivos`) só têm uma lista permitida: `src/server` e os `consultas.ts` e `acoes.ts` dos módulos, que começam por `import "server-only"`.
- Nada é guardado no navegador em `src/`: o lint pega os globais, apelidos (`w.localStorage`), acesso por string (`Reflect.get`) e `document.cookie`. Quando o progresso do questionário chegar, o arquivo que o guarda entra como exceção.
- `regras.ts`, os demais arquivos puros e o `index.ts` não importam React, Next, banco nem servidor, nem `consultas` e `acoes`. O índice pode reexportar os componentes do módulo.
- `sql.raw` é barrado fora dos testes: valor dinâmico vai como parâmetro em `` sql`…` ``.

O que mudou na fatia 0.3:

| Hoje | Vai para |
|---|---|
| `src/dominio/elegibilidade.ts`, `catalogo.ts` | `modulos/catalogo/elegibilidade.ts` e `regras.ts` |
| `src/dominio/filtros.ts`, `exigencia.ts`, `contagem.ts`, `nota.ts`, `escolha.ts`, `motivo.ts`, `requisitos.ts`, `sorteio.ts` | `modulos/busca/` |
| `src/dominio/homeState.ts` | `modulos/contas/homeState.ts` (home) |
| `src/dominio/mapa.ts`, `geo.ts` | `src/lib/geo.ts`; o mapa público é da fase 2 |
| `src/dominio/tipos.ts` | `tipos.ts` de cada módulo, com os esquemas básicos em `src/lib/esquemas.ts`; as tabelas já estão em `src/server/db/schema/` |
| `src/components/T.tsx` | `src/i18n/` (ainda não movido) |
| `src/components/layout/` | `src/ui/` (ainda não movido) |
| `src/data/port.ts`, `local.ts`, `armazenamento-local.ts`, `imagens-plataforma-idb.ts` | Removidos, com o `fake-indexeddb`, o `seed:json` e o `NEXT_PUBLIC_DATA_SOURCE` |
| `src/data/eventos.ts` | `modulos/analytics/regras.ts`; a lista permitida por tipo de evento ainda não foi feita |
| `src/data/arquivos.ts`, `src/server/storage/disco.ts` | `src/server/arquivos/` (disco no desenvolvimento, R2 em homologação e produção) |
| `tests/contrato/` | Removido com os adaptadores locais; o banco é testado em `tests/banco/`, contra o Postgres real |

## 4. Dados

- **Um caminho só (D3).** Toda leitura e escrita passa pelo Postgres, em todo ambiente. O navegador guarda só o progresso do questionário, o modo e o aviso de eventos. Eventos anônimos vão para o servidor com um cookie de visitante (ID aleatório, sem IP), porque só assim alimentam os números da incorporadora.
- **Banco local (D4).** Postgres 17 nativo no Windows, com os binários portáteis oficiais (sem instalador, sem serviço e sem Docker): `npm run db:start` liga e `npm run db:stop` desliga. Dois bancos: `imob` (desenvolvimento, recriado por `npm run db:reset`) e `imob_teste` (recriado a cada `npm run test:db`). Passo a passo no `README.md`.
- **Banco no servidor.** Uma instância Postgres 17 própria do Imob por ambiente, separada do Postgres que atende os outros projetos e clientes. Os motivos:
  - mesma versão do desenvolvimento;
  - isolamento dos dados pessoais (LGPD);
  - papéis e RLS sem interferir em ninguém.
- **Migrations.** O schema é declarado em Drizzle num lugar só, `src/server/db/schema/`. O drizzle-kit gera a migration das tabelas (`npm run db:generate`); políticas RLS, funções `app.*`, gatilhos e GRANTs ficam numa migration SQL escrita à mão e revisada como código. As migrations ficam em `db/migrations/`, são só aditivas e rodam por `npm run db:migrate`, nunca por `drizzle-kit push`. No servidor, só o job de deploy aplica, com o papel `migrator` e depois do backup.
- **Seed.** Seed fictício único em `src/seed/seed.ts`, usado no desenvolvimento, nos testes e na homologação. A produção recebe dados reais só no piloto (D17).
- **Localização (D5).** Latitude e longitude no subcondomínio, com índice. A busca por área usa caixa delimitadora e a distância usa Haversine em SQL. O PostGIS entra depois, de forma aditiva, se a escala pedir.
- **Contagem rápida.** Função SQL `count_empreendimentos(filtros)` com índices nos filtros, meta abaixo de 300 ms. Um teste de paridade compara o resultado com as funções TS sobre o mesmo seed. A nota roda no servidor com as funções puras.
- **Entidades:** `docs/specs/dados.md`. Cada fatia cria só as tabelas de que precisa.

## 5. Segurança

O modelo da 1.0 está mantido; detalhes em `docs/specs/acesso-e-visibilidade.md`. São três camadas:

1. **RLS é a fonte da verdade.**
   - O app conecta com `app_user` (sem `BYPASSRLS`, sem ser dono das tabelas).
   - Cada requisição roda numa transação com `set_config('app.conta_id', …, true)` e `set_config('app.impersonacao_id', …, true)`.
   - As funções `app.*` são `security definer`, `stable` e `search_path` vazio, chamadas dentro de `(select …)` para avaliar uma vez por consulta, e não por linha.
   - Há índice em todo `tenant_id`.
   - Dados sensíveis ficam em tabelas separadas (`empreendimentos_comercial`, `leads_contato`).
2. **`proxy.ts`** só lê o cookie de sessão, renova e redireciona.
3. **`exigirContexto()`** abre toda Server Action e Route Handler: valida a sessão, carrega conta, tenant e impersonate, abre a transação, valida a entrada com Zod estrito e responde 404 para id de outro tenant.

**Como ficou no banco (fatia 0.2)**, com um teste de banco para cada item:
- **Papéis.** O `migrator` é dono do banco e das tabelas. `app_user`, `auth_service` e `worker` entram sem superusuário, sem `BYPASSRLS` e sem herdar papéis; fora do localhost, com senha SCRAM.
- **Funções `app.*`.** São elas: `current_conta_id`, `current_papel`, `current_tenant_id`, `is_god_mode`, `is_internal`, `is_equipe_plataforma`, `pode_escrever`, `edita_catalogo`, `ve_catalogo_privado`, `hoje` (data no fuso de São Paulo), `em_stand_by` e `esgotado`. Nenhuma é executável por `PUBLIC`, nem as criadas depois.
- **Políticas separadas por comando.** Na v1, só a equipe da plataforma escreve no catálogo (`app.edita_catalogo()`); god mode e impersonate nunca escrevem (regra 12).
- **Escrita limitada.**
  - O UPDATE é concedido coluna a coluna, sem `id`, `tenant_id` e `empreendimento_id`.
  - As tabelas filhas usam FK composta `(id, empreendimento_id)`: uma unidade nunca aponta para a torre ou a tipologia de outro empreendimento.
- **Gatilho `app.proteger_empreendimento`.**
  - Só a equipe publica e aprova a curadoria.
  - Só o `internal_superadmin` liga o pré-lançamento (regra 11).
  - O tenant do empreendimento não muda.
- **R.I.** Publicar exige R.I. completo (número, cartório não vazio e data), por restrição `check`, que vale até para o superusuário (regra 1).
- **Leitura.**
  - Visitante: só a base elegível, com o pré-lançamento avaliado por subcondomínio (D15).
  - Não listado: só com conta ativa.
  - Comissão: o comprador nunca lê.
  - Conta de comprador: a equipe e o god mode não leem; o contato chega a eles pelo lead, com consentimento.
  - Contas da incorporadora: a própria incorporadora, a equipe da plataforma e o god mode leem. A house lê só as contas internas: pela matriz, a equipe de vendas da incorporadora fica fora dela, e o contato do plantão chega pelo escritório de vendas do empreendimento.
  - Nome da incorporadora: só com empreendimento na vitrine.

Fica para a fatia 1.4 (com o login): contexto por token de sessão validado no banco, tabela de impersonate, `audit_logs` e lint contra SQL dinâmico.

Acrescentado na 2.0:
- **Cabeçalhos HTTP, definidos no próprio Next (`headers()` e `proxy.ts`)** para não depender do Traefik compartilhado:
  - CSP com nonce, com `frame-src` só para `youtube-nocookie.com` quando a flag estiver ligada;
  - `X-Content-Type-Options: nosniff`, `frame-ancestors 'none'`, `Referrer-Policy` e HSTS;
  - `Permissions-Policy: geolocation=(self)`.
- **Limite de tentativas** em login, cadastro, recuperação de senha, contato e contagem do questionário.
- **Uploads:** tipo conferido pelos bytes; remoção de EXIF (posição GPS); limite de dimensões; tamanhos gerados no upload.
- **Eventos com lista permitida de campos por tipo.** Uma chave fora da lista não é gravada.
- **Segredos:** cada um tem uma origem só (cofre, D18) e uma lista de onde mora (seção 10).

## 6. Ambientes

| Ambiente | Onde | Banco | Dados | E-mail |
|---|---|---|---|---|
| Local | Computador do Matheus | Postgres 17 nativo | Seed fictício | Simulado (tela interna) |
| CI | GitHub Actions | Contêiner `postgres:17.12` | Seed fictício | Simulado |
| Homologação | Servidor atual, stack `imob_hml` | Postgres 17 da stack | Seed fictício | Real, só para contas da equipe |
| Produção | Servidor atual, stack `imob_prd` (a partir da fatia 1.10) | Postgres 17 da stack | Reais (piloto) | Real |

Homologação e produção ficam juntas no mesmo servidor só se a memória permitir (seção 7). Se não, a decisão na fatia 1.10 é entre subir o plano do servidor (custo a aprovar) ou desligar a homologação durante o piloto.

## 7. Infraestrutura no servidor atual (D11)

**Decisão do Matheus (13/11/2026):** o Imob usa o servidor atual da Hetzner, na Alemanha: 2 vCPU, 3,7 GB de RAM e 38 GB de disco (24 GB livres), com Docker Swarm e Traefik.

O servidor é **compartilhado** com outros projetos e clientes, por isso valem as regras do mentor para servidor compartilhado:

- **Só adicionar.** Tudo do Imob tem o prefixo `imob_`: stacks, serviços, volumes, redes e configs. Nada das stacks vizinhas é alterado, reiniciado ou removido.
- **Rede própria.** A rede overlay `imob_<ambiente>_interno` é `attachable`, para rodar migrations como tarefa avulsa, e liga `app`, `worker` e `db`. Só o `app` também entra na rede do Traefik, com `traefik.enable=true` e um roteador por subdomínio. Os nomes da rede e do resolvedor de certificados vêm do arquivo de ambiente do servidor, não do repositório.
- **Postgres sem porta publicada,** com volume nomeado `imob_<ambiente>_db`.
- **Imagens com versão fixa,** a tag sendo o commit, nunca `:latest`.
- **Em cada serviço:** limite e reserva de memória, healthcheck e política de reinício.
- **Nunca `docker restart` num contêiner de serviço do Swarm,** porque o Swarm sobe outro e os dois ficam rodando. Para reiniciar, use `docker service update --force imob_…`, só com imagem de versão fixa.

**Orçamento de memória** (medido em 13/11: cerca de 800 MB livres):

| Serviço do Imob | Reserva | Limite |
|---|---|---|
| `app` (Next standalone) | 192 MB | 384 MB |
| `worker` (pg-boss) | 96 MB | 192 MB |
| `db` (Postgres 17: `shared_buffers` 128 MB, `max_connections` 40) | 192 MB | 512 MB |
| **Total por ambiente** | **cerca de 480 MB** | **cerca de 1,1 GB** |

Conclusões do orçamento:
- **Homologação cabe**, com folga pequena, desde que o swap de 2 GB entre antes (pré-requisito).
- **Homologação e produção juntas provavelmente não cabem.** A medição real na fatia 0.4 decide; a escolha entre subir o plano ou desligar a homologação fica para a fatia 1.10.
- Se alguma stack vizinha estiver sem uso, desligá-la liberaria memória. A decisão é do Matheus, porque não é do Imob.

**Pré-requisitos antes do primeiro deploy** (fatia 0.4). Eles mexem no servidor de todos os projetos: cada um tem o OK do Matheus, janela combinada, plano de volta escrito antes e conferência de que as stacks vizinhas continuam respondendo.
- **Firewall de nuvem da Hetzner** liberando só 22, 80 e 443; num servidor de nó único, as portas internas do Swarm não precisam de acesso externo.
- **SSH:**
  - só por chave, com a chave do Matheus testada antes;
  - usuário `deploy` para o GitHub Actions;
  - root com `prohibit-password`;
  - fail2ban;
  - X11 desligado.
- **Swap de 2 GB** e `vm.swappiness` baixo.
- **Rotação de log do Docker** (`max-size` 10 MB, 3 arquivos) e limite do journald. Vale para contêineres novos; os vizinhos herdam ao serem recriados por eles.
- **Backup do Imob:** `pg_dump` diário cifrado enviado ao R2, com restauração testada. Recomendado também o Hetzner Backups do servidor (cerca de +20% do plano; custo a aprovar), que protegeria igualmente os outros projetos.

**Latência:** a Alemanha fica a cerca de 200 ms do Brasil. Para compensar:
- renderizar no servidor numa ida só, sem cascata de requisições do cliente;
- cache das páginas públicas;
- `prefetch` dos links;
- imagens com cache longo;
- uma CDN quando o tráfego justificar (seção 11).

**LGPD:** dados de brasileiros num servidor na Alemanha configuram transferência internacional, o que entra na validação jurídica (C15). Os dados do Imob ficam em instância e rede próprias, sem contato com os bancos dos outros clientes.

## 8. Deploy

1. **PR:** CI com os jobs `qualidade` (check:secrets, lint, typecheck, catálogo, unidade), `banco` (contêiner Postgres 17, migrations, seed e testes de banco), `build` e `e2e` (só em PR). `concurrency` cancela a execução anterior.
2. **Merge na `main`** (sempre pelo Matheus): build da imagem com tag do commit e envio ao GitHub Container Registry, que é privado.
3. **Deploy em homologação,** automático depois do merge. O GitHub Actions entra por SSH com o usuário `deploy`. O servidor tem acesso de leitura ao GHCR, com token guardado no próprio servidor. Os passos:
   1. `pg_dump` de segurança;
   2. migrations com o papel `migrator`, numa tarefa avulsa na rede da stack;
   3. `docker stack deploy --with-registry-auth -c infra/imob-stack.yml imob_hml`, com `IMOB_VERSAO=<commit>`;
   4. espera o healthcheck;
   5. smoke test com Playwright contra a URL.
4. **Deploy em produção:** os mesmos passos na stack `imob_prd`, manual e com aprovação do Matheus no ambiente protegido do GitHub.
5. **Rollback:** reaplicar a stack com o commit anterior. Como as migrations são só aditivas, a versão anterior do app roda sobre o schema novo.

Actions fixadas por SHA, com Dependabot atualizando. Varredura de segredos com gitleaks no CI, além do `check:secrets`. O arquivo da stack é versionado em `infra/` e nunca é aplicado com `--prune`: os serviços vizinhos não estão nele.

## 9. Observabilidade

- **Erros:** Sentry (camada gratuita) no navegador e no servidor.
- **Logs:** em JSON no stdout (pino), com `requestId`, rota, conta (id, nunca contato) e duração. A rotação é do Docker.
- **Disponibilidade:** monitor externo gratuito em `/` e `/api/saude` (que confere app, banco e worker), com alerta por e-mail.
- **Banco:**
  - `pg_stat_statements` ligado;
  - consultas acima de 300 ms vão para o log;
  - `explain (analyze, buffers)` antes de qualquer otimização.
- **Servidor:** memória e swap acompanhados depois de cada deploy, porque o orçamento é justo (seção 7).
- **Negócio:** o funil do piloto é calculado dos eventos anônimos (seção "Critérios de sucesso" da SPEC).
- **Auditoria:** `audit_logs` imutável, conforme `docs/specs/acesso-e-visibilidade.md`.

## 10. Custos, aprovações e segredos

Nada com custo acima de zero, nem serviço externo gratuito novo, sem o OK do Matheus (regra 18).

| Item | Custo | Situação |
|---|---|---|
| Servidor atual | Já pago | Aprovado (D11) |
| Subir o plano do servidor | Diferença mensal (conferir no painel) | Só se a medição pedir (fatia 1.10) |
| Hetzner Backups do servidor | Cerca de +20% do plano | Recomendado, aguardando aprovação |
| Domínio ou subdomínios | Conforme o domínio escolhido | A definir pelo Matheus |
| Cloudflare R2, Resend, Sentry, monitor de disponibilidade | Camadas gratuitas | Aprovados. Conta Cloudflare criada pelo Matheus; ativar o R2, o Sentry e o monitor é pendência da 0.4, e o Resend, da 1.5 |
| OpenFreeMap | Gratuito | Aprovado |
| ViaCEP, embed do YouTube, cidade pelo IP | Gratuitos | Aguardando OK, desligados por flag |
| GitHub Actions | Cota gratuita do plano | Avisar perto do limite |
| IA (Claude) | Por uso | Fase 3, com teto diário e por pessoa no código (D16) |

**Onde mora cada segredo** (a fonte da verdade é o cofre, D18). No servidor, cada ambiente tem o arquivo `/opt/imob/<ambiente>/.env`, com permissão 600, dono `deploy` e fora de qualquer repositório.

| Segredo | Local | CI | Homologação e produção |
|---|---|---|---|
| `DATABASE_URL` (`app_user`) | Opcional: o padrão é o localhost sem senha | Montado pelo teste | `.env` do ambiente; é a única URL que o contêiner `app` recebe |
| `DATABASE_URL_MIGRATOR` e `DB_SENHA_*` (senhas dos papéis) | Não precisa | Valores de teste no workflow | `.env` da tarefa de migration, nunca no `app` |
| `DATABASE_URL_ADMIN` (superusuário, só para criar papéis e banco) | Opcional: o padrão é o localhost | Valor de teste no workflow | Só no bootstrap do ambiente |
| `POSTGRES_PASSWORD` do contêiner do banco | Não se aplica | Gerado no job | `.env` do ambiente |
| `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` | `.env.local` | Gerado no job | `.env` do ambiente |
| `S3_*` (R2) | `.env.local` (opcional) | Não precisa | `.env` do ambiente |
| `RESEND_API_KEY` | Não precisa | Não precisa | `.env` do ambiente |
| `SENTRY_DSN` | Opcional | Não precisa | `.env` do ambiente |
| Token de leitura do GHCR | Não se aplica | Não se aplica | Login do Docker no servidor |
| Chave SSH de deploy | Não se aplica | Secret do ambiente no GitHub | `authorized_keys` do usuário `deploy` |
| `ANTHROPIC_API_KEY` (fase 3) | `.env.local` | Nunca (mock) | `.env` do ambiente |

## 11. Desempenho e caminho de escala

**Metas:**
- LCP da página do empreendimento < 2,5 s em 4G, apesar da distância de cerca de 200 ms;
- contagem < 300 ms;
- resposta de Server Action < 500 ms no p95, medida no servidor.

**Como chegar lá:**
- **Server Components e streaming.**
- **Cache das páginas públicas:**
  - `use cache` com `cacheTag` por empreendimento, invalidado na publicação e nas mudanças de cadastro. Desde a 0.3, a página do empreendimento lê o dado em `use cache` com `cacheLife("hours")` e as tags `vitrine` e `empreendimento:{slug}`; a invalidação chega com a escrita do catálogo. Sem `generateStaticParams`, a página renderiza a cada requisição e só o dado fica em cache;
  - base elegível em cache por hash dos filtros.
- **Imagens:** gerar os tamanhos no upload e servir do R2 com cache longo, para não gastar CPU do servidor compartilhado.
- **Fontes locais** (já feito).
- **MapLibre por `dynamic import`.**
- **Menos idas ao servidor por tela.**

**Escala por etapas, sempre com o gatilho medido antes:**

| Etapa | Gatilho medido | Ação |
|---|---|---|
| 1. Subir o plano do servidor | Memória acima de 80% ou uso de swap constante; CPU acima de 70% sustentada | Plano maior na Hetzner, em minutos (custo a aprovar) |
| 2. Servidor próprio do Imob | Disputa de recursos com as stacks vizinhas, exigência de isolamento ou latência acima da meta | Mover as stacks `imob_*` para uma VPS dedicada. A recomendação original era Ashburn (EUA), mais perto do Brasil. Mesmo arquivo de stack e mesmas imagens |
| 3. Banco separado | Postgres disputando memória ou disco com o app | Servidor de banco no mesmo datacenter, rede privada |
| 4. Mais instâncias do app | Uma instância não segura o p95 | Réplicas do serviço `app` no Swarm; cache do Next compartilhado (Valkey) |
| 5. CDN | Tráfego de imagens e estáticos pesando, ou latência ao Brasil | Domínio do R2 e páginas estáticas atrás da Cloudflare |
| 6. Nova praça | Primeira incorporadora fora de Porto Alegre | Sem mudança de schema: cidade e UF já estão no dado; filtro de praça na busca |

O app não guarda estado (sessão no banco, arquivos no R2), e a stack é declarada num arquivo versionado. Por isso as etapas 2 a 4 não exigem reescrever código.

## 12. Servidor atual

O diagnóstico detalhado de 13/11/2026 (rede, acesso e riscos) fica **fora do repositório**, por segurança, na pasta protegida de credenciais do Matheus. Aqui ficam só as conclusões que guiam o Imob:

- O servidor é compartilhado com outros projetos e clientes e tem pouca memória livre (seção 7).
- O endurecimento listado na seção 7 é pré-requisito do primeiro deploy, porque o Imob vai guardar dados pessoais.
- As demais correções protegem os outros projetos e seguem a critério do Matheus, cada uma com OK e plano de volta.
