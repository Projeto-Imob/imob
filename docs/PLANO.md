# Plano — SPEC 2.0

> **Status:** aprovado pelo Matheus em 13/11/2026 (decisões D1 a D18, com a D11 ajustada por ele). Substitui a sequência da change OpenSpec `planejar-mvp-imob`, que fica suspensa e serve de referência.
> Cada item é uma **fatia vertical**: atravessa banco, servidor e tela e entrega algo usável. Uma fatia = uma sessão = um PR.

## Como trabalhar uma fatia

1. `/forja:retomar` lê o estado e diz a próxima fatia.
2. `/forja:feature <fatia>` explora, planeja e **para para aprovação**; depois implementa com teste primeiro.
3. Prova antes de "pronto". Passam `npm run check:secrets`, `lint`, `typecheck`, `test`, `test:db`, `build` e o e2e da fatia, e o fluxo é visto funcionando. Tela nova tem axe sem violação e capturas em 390 e 1440 px.
4. `/forja:revisar` caça bugs, segurança e excesso; corrija o que for crítico.
5. Commit convencional em português (`feat(busca): … [fatia 1.2]`); PR com o modelo; CI verde; o **merge é sempre do Matheus**.
6. Marque a fatia aqui, registre decisões novas em "Decisões" e rode `/forja:salvar` antes de `/clear`.

Fatias grandes ou incertas ganham uma spec própria em `docs/specs/<fatia>.md` antes do código.

## Já feito (antes da 2.0)

- [x] Fundação do repositório:
  - Next.js 16 na raiz;
  - marca e tokens com teste de contraste;
  - catálogo de textos `<T>` e `npm run catalogo`;
  - flags e `scoring.config.ts`;
  - termos proibidos e `check:secrets`;
  - Vitest, Playwright e axe;
  - CI, CODEOWNERS e dependabot;
  - layout base.

  Corresponde ao grupo 1 da change OpenSpec. A antiga 1.13 (ver o CI verde numa PR) fechou com a 0.1: os quatro jobs passaram na PR #1.
- [x] Regras puras da busca, com 282 testes, todas reaproveitadas na 2.0:
  - tipos Zod e seed fictício de Porto Alegre;
  - elegibilidade, filtros, exigência por plano, contagem e ampliação;
  - nota, escolha, motivo e requisitos;
  - `resolveHomeState` e cascata do mapa.

  Corresponde ao grupo 2. Os adaptadores LocalStorage e IndexedDB saem (D3).

## Fase 0 — Fundação de produção

- [x] **0.1 Repositório no GitHub.** Concluída em 14/11/2026 (PR #1): `Projeto-Imob/imob` público, `main` protegida (PR obrigatório, CI `qualidade`, `build` e `banco` exigido, sem force-push), hooks quebrados e do GSD removidos das configurações locais.
  - Entrega:
    - framework AIOX e GSD fora do versionamento (D14);
    - primeiro commit;
    - repositório público novo `Projeto-Imob/imob` (o `projeto-vieza` fica intacto como histórico do protótipo);
    - `main` protegida (PR e CI verde). A revisão do Matheus é o próprio merge, que só ele faz: as PRs saem da conta dele e o GitHub não deixa o autor aprovar a própria PR, por isso não há aprovação obrigatória.
  - Verificar: uma PR de teste com os quatro jobs do CI verdes (fecha a antiga 1.13). Na 0.1, o job `banco` era só um marcador; a 0.2 o liga de verdade.
- [x] **0.2 Banco local e de teste.** Entregue na PR #2 (16/11/2026): Postgres 17.12 local com binários portáteis (`npm run db:start`), Drizzle, migrations de tabelas e de segurança, seed e 38 testes de banco, local e no CI (job `banco` com `postgres:17.12`).
  - Entrega:
    - Postgres 17 local (D4);
    - Drizzle e drizzle-kit;
    - `db/migrations/` com papéis `app_user`, `auth_service`, `worker` e `migrator`;
    - funções `app.*` e contexto por transação;
    - tabelas mínimas de tenants, contas e catálogo;
    - seed;
    - scripts `db:reset`, `db:migrate` e `test:db`.
  - Verificar (testes de banco, local e CI):
    - consulta como `app_user` sem contexto não retorna linha de cliente;
    - RLS e índice em todo `tenant_id`;
    - publicar sem R.I. é recusado até para o god mode.
  - Decisões técnicas (detalhes na `docs/ARQUITETURA.md`, seções 4 e 5):
    - o schema Drizzle fica num lugar só, `src/server/db/schema/`; os módulos da 0.3 importam dele;
    - na v1, só a equipe da plataforma escreve no catálogo (F9); a incorporadora lê os próprios empreendimentos e passa a escrever na fase 2;
    - pré-lançamento avaliado por subcondomínio também no banco (D15): a torre com lançamento futuro some da vitrine com as tipologias e unidades dela;
    - o nome da incorporadora só é público quando ela tem empreendimento na vitrine;
    - a conta de comprador (e-mail de login) não é lida pela equipe nem pelo god mode: o contato do comprador chega a eles pelo lead, com consentimento ativo (matriz de visibilidade);
    - a house lê só as contas internas: a equipe de vendas da incorporadora fica fora dela (matriz de visibilidade), e o contato do plantão chega pelo escritório de vendas do empreendimento. Corrigido depois da auditoria de 16/11, antes do merge;
    - a função do papel atual chama `app.current_papel()`, porque `current_role` é palavra reservada do Postgres.
- [x] **0.3 Primeira fatia vertical e módulos.** Entregue em 16/11/2026, na branch `fatia/0.3-modulos`: `src/modulos/` com índice como API pública e lint de fronteira, migration `0002_vitrine`, página `/empreendimento/{slug}` com o resumo lido do banco e Postgres no job `e2e` do CI.
  - Entrega:
    - `src/dominio` reorganizado em `src/modulos/` (D6), com lint de fronteira, incluindo a lista permitida de quem importa `src/server/db` (`docs/specs/acesso-e-visibilidade.md`);
    - página `/empreendimento/{slug}` lendo do banco pelo módulo `catalogo`, com a elegibilidade aplicada no banco e no servidor.
  - Verificar:
    - e2e abre um empreendimento elegível e recebe "não encontrado" para cada caso de exclusão do seed;
    - axe sem violação.
  - Decisões técnicas (detalhes na `docs/ARQUITETURA.md`, seções 3 e 11):
    - a elegibilidade da página vem só do banco: a consulta pública filtra por `app.na_vitrine`, além do RLS do visitante. A regra em TypeScript e a paridade TS × SQL ficam para a 0.5;
    - a `0002_vitrine` conta como aditiva: cria `app.na_vitrine` e troca só o corpo de `app.esgotado`, que passa a olhar as torres que o público vê (as lançadas, ou todas com o pré-lançamento ativo);
    - "não encontrado" responde 200 com `noindex`: com Cache Components, o shell estático sai antes do `notFound()`;
    - sem `generateStaticParams`: a página renderiza a cada requisição, e o dado fica em `use cache` por horas, com tag por empreendimento;
    - o acesso ao banco abre e fecha a transação por conta própria (o `begin` do Drizzle ficava fora do `try` e prendia a conexão), e a consulta pública é só de leitura;
    - o lint barra `sql.raw` fora dos testes desde esta fatia (saiu da 1.4);
    - sem CSP nesta fatia: ela entra na 0.5, sem nonce.
- [ ] **0.4 Homologação no servidor atual, como stack isolada** (D11; `docs/ARQUITETURA.md`, seção 7).
  - Entrega, parte 1 — endurecimento do servidor compartilhado:
    - firewall de nuvem com 22, 80 e 443;
    - SSH só por chave (a chave do Matheus já está instalada e testada), com usuário `deploy` e fail2ban;
    - swap de 2 GB;
    - rotação de logs.

    Cada item tem OK do Matheus, janela combinada e plano de volta escrito antes. As stacks vizinhas são conferidas antes e depois de cada mudança.
  - Entrega, parte 2 — stack `imob_hml`:
    - `app`, `worker`, Postgres 17 próprio e backup;
    - rede própria e HTTPS pelo Traefik existente num subdomínio;
    - limites de memória;
    - imagem no GHCR por commit e deploy por Actions (D12);
    - Sentry e monitor de disponibilidade (D10). O SDK está no app desde 16/11/2026, sem dado pessoal. Faltam:
      - o DSN no servidor e no build;
      - o monitor de disponibilidade (o plano grátis do Sentry inclui 1);
      - os source maps;
    - backup diário cifrado no R2 (D8);
    - o contêiner `app` recebe só a `DATABASE_URL` do `app_user` e, ao subir, confere que conectou como `app_user`; o `migrator` só existe na tarefa de migration;
    - `statement_timeout` e `idle_in_transaction_session_timeout` nos papéis do app e do worker;
    - migrations só por `db:migrate` (nunca `drizzle-kit push`), com as senhas dos papéis vindas do cofre (`DB_SENHA_*`).
  - Verificar:
    - URL de homologação com a página da 0.3;
    - deploy e rollback ensaiados;
    - restauração do backup num banco limpo;
    - memória e swap medidos dentro do orçamento;
    - stacks vizinhas intactas.
  - Bloqueada por:
    - OK e janela para o endurecimento;
    - subdomínio de homologação;
    - DSN do projeto `imob` no Sentry (conta criada em 16/11/2026), gravado pelo Matheus no cofre e no servidor. O R2 ficou pronto e testado em 16/11/2026: buckets `imob-hml-arquivos` e `imob-backups`, com token só de objetos nesses dois.
- [ ] **0.5 Correções que a 2.0 mantém** (da `docs/AUDITORIA.md`).
  - Entrega:
    - pré-lançamento por subcondomínio, com os casos do D15 no seed (torre com lançamento futuro e sem data) e paridade TS × SQL;
    - studio e finalidade (Studio e Loft contam como studio, decisão de 14/11/2026);
    - nota somada em inteiros;
    - motivo fiel ao que a pessoa informou;
    - CSP e cabeçalhos de segurança (CSP sem nonce, mantendo o cache; decisão de 16/11/2026);
    - `check:secrets` com os padrões que faltam e gitleaks no CI;
    - actions por SHA e imagem do Postgres do CI por digest;
    - Dependabot só com versões menores e de correção. Versão maior (como TypeScript 7, ESLint 10 e `@types/node` acima do Node 24) vira decisão, com PR própria; a PR #2, que juntou as duas coisas e quebrou o CI, é fechada;
    - suíte estável na máquina local.
  - Verificar: um teste novo para cada achado; suíte verde três vezes seguidas.

## Fase 1 — Piloto (v1)

- [ ] **1.1 Página do empreendimento completa (F1).**
  - Entrega:
    - blocos por modo, custos estimados, plantas e unidades;
    - vizinhança com tempo a pé;
    - dados legais, escritório de vendas e "Não informado";
    - escassez com espelho de menos de 24 h;
    - não listado só com login;
    - navegação da v1 (F12) com Início, Buscar e Minha conta.
  - Verificar: e2e por modo; espelho com 23 h e com 30 h; axe; LCP medido.
- [ ] **1.2 Questionário com contagem ao vivo (F2).**
  - Entrega:
    - schema declarativo e uma pergunta por tela;
    - contador com `aria-live`, contagem por opção e regra do zero;
    - ampliar, progresso salvo no navegador e tela "Analisando";
    - contagem em SQL abaixo de 300 ms.
  - Verificar: paridade TS × SQL no seed; medição de tempo; e2e e axe.
- [ ] **1.3 Resultado e lead (F3, F4).**
  - Entrega:
    - 2 a 3 opções com nota, motivo e "Por que estou vendo isso?";
    - recomendação gravada;
    - aviso da base;
    - contato opcional no fim criando o lead na fila da house.
  - Verificar:
    - e2e do visitante sem conta vendo de 2 a 3 opções;
    - teste de banco: a incorporadora não lê o lead que só respondeu ao questionário.
- [ ] **1.4 Contas e login rápido (F10, F5).**
  - Entrega:
    - Better Auth (e-mail e senha, recuperação);
    - cadastro público só de `buyer`;
    - convites com limites de concessão;
    - MFA para internos;
    - bootstrap do god mode (na v1 ele só lê; o banco já bloqueia a escrita dele desde a 0.2);
    - retorno só para caminho interno;
    - `merge_visitor`;
    - contexto do banco endurecido: a conta entra por token de sessão validado no banco, e não por `set_config` direto; o impersonate é validado numa tabela própria; a transação fica inutilizável depois do callback;
    - `audit_logs`;
    - o que a conta de um tenant suspenso ou encerrado ainda vê (**Proposta:** só a vitrine pública).
  - Verificar:
    - teste de redirecionamento externo recusado;
    - fila interna não abre sem segundo fator;
    - segunda execução do bootstrap falha;
    - teste de banco: `set_config` com outra conta, sem token válido, não abre dado nenhum.
- [ ] **1.5 Visita em 3 toques (F5).**
  - Entrega:
    - dia, horário e confirmar, com consentimento versionado;
    - confirmação com mapa, gerente, "o que levar", perguntas, `.ics` e lembrete simulado;
    - liberação de contato só à incorporadora do empreendimento;
    - e-mail real de confirmação (D9).
  - Verificar: e2e do questionário até a visita; teste de banco da liberação e da revogação.
  - Depende de: conta do Resend, com a chave gravada pelo Matheus no cofre e no servidor. Sem ela, a fatia entra com a flag `email_real` desligada.
- [ ] **1.6 Fila da house (F7).**
  - Entrega:
    - rodízio, fila sem analista, checklist de qualificação;
    - confirmar, reagendar, cancelar e resultado da visita;
    - etapas até "visita feita" e "perdido";
    - histórico com autor;
    - "Passar ao gerente de produtos".
  - Verificar: testes de rodízio e de fila sem analista; e2e da analista; teste de banco do isolamento.
- [ ] **1.7 Área mínima da incorporadora (F8).**
  - Entrega:
    - convite;
    - empreendimentos próprios com números agregados;
    - atendimentos liberados somente leitura.
  - Verificar: teste de banco do isolamento entre incorporadoras; nenhum nome de quem só acessou; e2e.
- [ ] **1.8 Cadastro e publicação pela equipe (F9).**
  - Entrega:
    - 4 etapas com salvamento automático;
    - tabela de vendas com movimentos, planos e comissão auditada;
    - R.I. obrigatório e curadoria;
    - uploads no R2 sem EXIF;
    - registro de mudanças de cadastro.
  - Verificar: e2e e axe; recusa de tipologia sem subcondomínio e de SVG; publicação sem R.I. recusada na tela e no banco.
- [ ] **1.9 Falar com o gerente, privacidade e home (F6, F11, F12).**
  - Entrega:
    - `wa.me`, `mailto` e `tel` com evento;
    - consentimentos por empreendimento: revogar, baixar JSON, apagar histórico e excluir com anonimização;
    - aviso de eventos;
    - home pelos estados da v1.
  - Verificar: e2e de revogação cortando o acesso; download e exclusão; ações a até 2 toques.
- [ ] **1.10 Lançamento do piloto.**
  - Entrega:
    - e-mail real;
    - textos legais validados (C15);
    - limite de tentativas;
    - revisão de segurança sem achado crítico;
    - dados reais da incorporadora piloto só em produção (D17);
    - `/forja:ship` em produção.
  - Verificar:
    - checklist do `/forja:ship`;
    - fluxo principal testado na URL de produção;
    - logs dos primeiros dias lidos.
  - Bloqueada por: P5, C14, C15, subdomínio de produção e a decisão sobre a memória da produção (medida na 0.4). A D17 já está aprovada: dados reais só em produção.

## Fase 2 e Fase 3

Fatiadas quando a v1 estiver no ar, nesta ordem de valor:

- **Fase 2:**
  1. mapa público;
  2. favoritos e alertas;
  3. CRM kanban da incorporadora;
  4. mini CRM da house e "oferecer semelhantes";
  5. cadastro pela incorporadora e equipe de vendas com CSV;
  6. god mode de personalização;
  7. impersonate;
  8. home no estado ativo e comparador;
  9. ainda sem lugar na ordem (estão na SPEC): listas, selo "Novidade", carteira do gerente de contas, dashboards completos, usuários da incorporadora, tela interna de notificações e e-mails simulados e login com Google (flag).
- **Fase 3:** Mais Buscados e Vitrine Destacada; projeto de mídia; proposta, reserva, contrato e venda; simulador; IA.

## Decisões

**Já tomadas pelo Matheus**

- 2026-11-13: Supabase fora da stack. Banco, auth e arquivos próprios: PostgreSQL 17, Drizzle, Better Auth, armazenamento S3 compatível e pg-boss, em VPS própria.
- 2026-11-13: repositório em `C:\dev\imob`, fora do OneDrive.
- 2026-11-13: aplicação na raiz do repositório (`src/` na raiz, sem `web/`).
- 2026-11-13: GitHub na conta `iaraaivendas`, integrado ao `gh` e ao `git`.
- 2026-11-13: **SPEC 2.0 aprovada**, com as decisões D1 a D18 abaixo. Na D11, o Matheus escolheu usar o servidor atual (Nuremberg), que ainda tem espaço, em vez de uma VPS dedicada.
- 2026-11-14: repositório **público** `Projeto-Imob/imob`, para ter a `main` protegida sem custo (no plano gratuito, repositório privado de organização não tem proteção de branch). A estratégia de negócio fica pública; o diagnóstico de segurança do servidor fica fora do repositório, na pasta protegida de credenciais.
- 2026-11-14: **Loft conta como studio** na busca (esclarecimento do D15, entra na fatia 0.5). Kitnet continua fora até decisão em contrário.
- 2026-11-16: **prazos.** MVP em homologação até 01/12 (Fase 0 e fatias 1.1 a 1.3), com fatias em paralelo. Fica para depois de 01/12 o que não aparece na demonstração: gitleaks, estabilidade da suíte e actions por SHA.
- 2026-11-16: **piloto enxuto em dezembro:** página, questionário, resultado e contato. O lead chega à house por WhatsApp ou e-mail, e os empreendimentos são cadastrados por script com os dados da incorporadora. Depende da C15. A jornada completa da v1 passa para janeiro.
- 2026-11-16: **CSP sem nonce**, mantendo o cache das páginas públicas (fatia 0.5).
- 2026-11-16: na 0.3, a elegibilidade da página vem só da regra do banco (`app.na_vitrine`); a paridade TS × SQL fica para a 0.5. A migration `0002_vitrine`, que troca o corpo de `app.esgotado`, conta como aditiva. "Não encontrado" responde 200 com `noindex`.
- 2026-11-16: **cor principal da marca: laranja #FF8C00**, no lugar do lima. Preto, grafite e off-white mantidos. A regra 15 passa a valer para o laranja (2,12:1 sobre o off-white).
- 2026-11-16: **protótipo visual até 20/11/2026** das telas da demonstração, seguindo os benchmarks Reelly.io e QuintoAndar documentados em `docs/specs/negocio.md`. As fatias seguem em paralelo.

**Decisões da 2.0 (aprovadas em 13/11/2026)**

| # | Decisão proposta | Por quê | Alternativa |
|---|---|---|---|
| D1 | Método forja como fluxo único (SPEC → PLANO → fatia → revisar → ship). Stories AIOX e change OpenSpec ficam como histórico | Um processo só: menos contexto por sessão, menos documento duplicado | Manter OpenSpec só como guarda das specs detalhadas |
| D2 | Escopo da v1 = piloto com uma incorporadora (F1 a F12). Mapa e favoritos na fase 2 | Validar a jornada central antes de construir 25 capacidades | Mapa na v1, somando 2 ou 3 fatias |
| D3 | Um caminho de dados: Postgres em todo ambiente; navegador só para conveniências do visitante | Fim da dupla implementação de cada repositório; eventos chegam aos números | Manter o modo LocalStorage para demo sem servidor |
| D4 | Postgres 17 nativo no Windows para desenvolver e testar | Mesmo banco da produção, sem Docker, RAM baixa | PGlite (sem instalar, paridade menor) |
| D5 | Sem PostGIS na v1: latitude e longitude, caixa delimitadora e Haversine em SQL | Uma praça e centenas de pontos; acaba a função "só para teste" (C11) | PostGIS desde já (resolver C11) |
| D6 | Código organizado por módulos de domínio, com API pública e lint de fronteira | Escala para 25 capacidades sem pasta-depósito | Manter as camadas atuais |
| D7 | shadcn/ui (Radix) como base de componentes, com os tokens da marca | Diálogos, menus e painéis acessíveis prontos; padrão de mercado | Componentes à mão |
| D8 | Arquivos no Cloudflare R2 (camada gratuita, sem custo de saída); MinIO fora | MinIO deixou de ser opção livre em 2025; R2 sem manutenção | SeaweedFS na própria VPS |
| D9 | E-mail real (Resend, camada gratuita) antes de compradores reais | Recuperação de senha e confirmação de visita não podem ser simuladas no piloto | Outro provedor transacional |
| D10 | Observabilidade: Sentry (camada gratuita) e monitor de disponibilidade | Erro de produção visto antes do cliente | GlitchTip na VPS |
| D11 | **Ajustada pelo Matheus:** o Imob roda no servidor atual (Hetzner, Alemanha) como stack isolada do Swarm. Prefixo `imob_`, rede e Postgres 17 próprios, HTTPS pelo Traefik existente, limites de memória. Começa só com homologação; produção na fatia 1.10, conforme a memória medida | O servidor ainda tem espaço e não gera custo novo | VPS dedicada em Ashburn (EUA), que fica como etapa 2 do caminho de escala |
| D12 | Deploy por imagem com tag do commit (GHCR) e `docker stack deploy` da stack `imob_*`; homologação automática; produção manual com aprovação; rollback = commit anterior | Volta em um comando; nada de `:latest` | Deploy pela API de um Portainer |
| D13 | Testes de banco em Vitest contra Postgres real (pgTAP opcional) | Um único executor de testes; `pg_prove` exige Perl | pgTAP com `pg_prove` só no CI |
| D14 | `.aiox-core` (52 MB), GSD e hooks fora do repositório do produto; AIOX global continua disponível | Repositório leve; menos hooks rodando a cada ferramenta | Versionar o framework |
| D15 | Esclarecimentos de regra da busca e da home (topo de `docs/specs/busca-e-recomendacao.md` e `comprador.md`) | Lacunas achadas ao implementar e auditar | Discutir item a item |
| D16 | IA (quando ligada) com teto diário e por pessoa no código e caminho sem IA | Lei 9 do mentor; custo previsível | Só o timeout e o cache da 1.0 |
| D17 | Regra 16 no piloto: dados reais só em produção; desenvolvimento e homologação só fictícios | O piloto precisa do empreendimento real | Piloto também com dados fictícios |
| D18 | Cofre de senhas (Bitwarden ou 1Password) como fonte da verdade dos segredos | Trocar segredo sem esquecer onde ele mora | Arquivos `.env` em cada lugar |

## Pendências do Matheus

| # | Pendência | Valor provisório | Bloqueia |
|---|---|---|---|
| P5 | Primeiro cliente e praça | Porto Alegre fictícia | Lançamento (1.10) |
| P6 | Remuneração da Imob e tratamento contábil da verba | — | Nada na v1 |
| P7 | A incorporadora conduz proposta e contrato no sistema? | — | Fase 3 |
| P10 | Oferta em PDF com a marca da house | Fora | — |
| P11 | Meta de receita, time e lançamentos por gestor | — | Metas do piloto |
| C1 | Cores de apoio Morar `#9C3D17` e Investir `#1D5A85` | Essas (passam no AA) | Nada |
| C2 | Modelo de IA e custo | Desligada | Fase 3 |
| C3 | "Falar com o gerente" exige login no primeiro clique? | Livre (flag desligada) | Nada |
| C4 | Mostrar interesse no empreendimento ao comprador | Desligado | Nada |
| C5, C6, C13 | Indicadores de bairros, prova social, destaques da home | Desligados | Nada |
| C7 | Fonte do ITBI e do registro | "Não informado" | Nada |
| C8 | Configurações dos outros perfis | — | Fase 2 |
| C9 | Consórcio como forma de pagamento | Fora | Nada |
| C10 | Como o comprador envia proposta | — | Fase 3 |
| C11 | PostGIS no PGlite | Resolvida pela D5 (sem PostGIS na v1) | — |
| C12 | Embed de vídeo e tour 3D | Desligado (link externo) | Nada |
| C14 | Parâmetros **Proposta** da busca | Valores do `scoring.config.ts` | Lançamento (1.10) |
| C15 | Validação jurídica de consentimento, visita, projeção, atuação sem CRECI e hospedagem fora do Brasil | — | Lançamento (1.10) |
| — | Simulador, Vitrine Destacada (vagas e valores), planos Essencial e Avançado, quantos "semelhantes" | — | Fases 2 e 3 |
| — | Proposta e contrato continuam dentro do sistema (R5) mesmo com o fluxo Reelly no atendimento? | — | Fase 3 |
| — | OK e janela para o endurecimento do servidor compartilhado (seção 7 da ARQUITETURA) | — | 0.4 |
| — | Subdomínios de homologação e de produção | — | 0.4 e 1.10 |
| — | DSN do Sentry (conta criada em 16/11/2026) e conta do Resend, com as chaves gravadas pelo Matheus no cofre e no servidor (o R2 ficou pronto e testado em 16/11/2026) | — | Sentry: 0.4. Resend: 1.5 (sem ele, flag `email_real` desligada) |
| — | Kitnet conta como studio? | Não | Nada |
| — | Hetzner Backups do servidor (cerca de +20% do plano; protege também os outros projetos) | `pg_dump` diário no R2 | Nada (recomendado) |
| — | Memória para a produção: subir o plano ou desligar a homologação, se a medição pedir | Decidir na 1.10 | 1.10 |
