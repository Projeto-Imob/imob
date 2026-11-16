# Perfis, papéis, visibilidade e segurança de acesso

> **Origem:** SPEC 1.0, §3 Perfis, tenants e papéis e §13 (Segurança em três camadas; Testes de banco) — texto da 1.0 preservado abaixo, só convertido para Markdown.
> **Fase na SPEC 2.0:** v1 (contas, papéis, convites, MFA, RLS, auditoria; god mode só com leitura); impersonate e personalização do god mode na fase 2.

### Esclarecimentos e mudanças da 2.0

Aprovados pelo Matheus em 13/11/2026 (decisões em `docs/PLANO.md`).

- Modelo de segurança mantido integralmente: RLS como fonte da verdade, `exigirContexto()`, papéis de banco separados e auditoria imutável.
- Acrescentado: cabeçalhos de segurança e CSP em todas as respostas, e limite de tentativas (rate limit) em login, cadastro, contato e contagem do questionário.
- Testes de banco rodam contra Postgres real (local e CI) e podem ser escritos em Vitest; não há mais variante de função "só para teste".
- Fatia 0.2: `app.current_role()` passou a se chamar `app.current_papel()`, porque `current_role` é palavra reservada do Postgres. A conta de comprador (e-mail de login) não é lida pela equipe nem pelo god mode; o contato do comprador chega a eles pelo lead, com consentimento ativo, como na matriz abaixo.

---

## Perfis, tenants e papéis

### Perfis

| Perfil | Papel no negócio | Paga? |
| --- | --- | --- |
| Incorporadora ou construtora | Cliente: negocia a comissão, cadastra e edita os próprios empreendimentos, acompanha indicadores, tem CRM. Quem contrata o projeto de mídia tem essa área | A combinar (P6) |
| House de vendas (interna) | Analista de vendas: qualifica o lead e garante a visita. Gerente de contas: cuida da carteira de incorporadoras e aparece no escritório de vendas quando a house atende | Não se aplica |
| Comprador ou investidor | Busca imóveis, responde ao questionário, favorita, agenda visita, fala com o gerente e envia proposta | Não |
| Equipe da plataforma | Opera mídia, cadastro, curadoria, vendas e administração | Não se aplica |
| God mode | Só Matheus Pacheco, conta única | Não se aplica |

### Tenants

incorporadora (inclui construtora) e plataforma. Situação do tenant: implantacao, ativo, suspenso ou encerrado. Equipe da plataforma e buyer têm tenant_id nulo.

### Papéis

| Papel | Quem é |
| --- | --- |
| anon | Visitante sem conta |
| buyer | Comprador ou investidor |
| client_superadmin | Dono da conta da incorporadora |
| client_manager | Gerente de produtos da incorporadora: edita os próprios empreendimentos e o espelho, exceto R.I. e comissão |
| sales_member | Plantão (equipe de vendas) da incorporadora |
| internal_seller | Analista de vendas da house |
| internal_account_manager | Gerente de contas da house |
| internal_admin | Equipe da plataforma: operação, cadastro, mídia, curadoria, distribuição, conferência de vendas e suporte |
| internal_superadmin | Sócios: criar, suspender e encerrar tenants, papéis internos, produtos do tenant e liberar pré-lançamento |
| god_mode | Matheus, conta única |

### Regras de papel

Nenhuma tela ou API cria god_mode. A conta entra por um script de bootstrap rodado por Matheus, sem e-mail nem senha versionados. Um índice único parcial impede uma segunda conta.

god_mode e todos os papéis internos exigem MFA (sessão com segundo fator TOTP verificado pelo Better Auth), porque veem contato de comprador de vários tenants.

Ninguém concede papel igual ou superior ao próprio, muda o próprio papel ou remove o último client_superadmin de um tenant. Aplique no banco.

O cadastro público só cria buyer. Os demais entram por convite.

Ao desligar alguém da house, desative a conta e passe leads e histórico a outra pessoa da house, ou devolva à fila.

Exclusão de cliente = desativação e anonimização dos dados pessoais, mantendo registros financeiros, com permissão restrita.

### Matriz de visibilidade

| Dado | Comprador | House de vendas | Incorporadora | Equipe da plataforma |
| --- | --- | --- | --- | --- |
| Nome da incorporadora | Sim | Sim | Sim | Sim |
| Comissão do lançamento | Não | Sim, fora do modo cliente | Só nos próprios | Sim |
| Proposta e contrato | Só os próprios | Só os que negocia | Só nos seus empreendimentos | Sim |
| Dados do lead, incluindo o nome | Só os próprios | Os que atende, a fila sem responsável e os próprios | Mídia: os das suas campanhas. Plataforma: só depois de visita, contato direto ou proposta, somente leitura. Nunca as opções de concorrentes nem lead próprio da house | Sim, menos lead próprio |
| Contato do lead | Só o próprio | Nos mesmos casos, com consentimento ativo | Nos mesmos casos, com consentimento ativo | Sim, com consentimento ativo, menos lead próprio |
| Acessos, interações e cliques no mapa | Não [NEEDS CLARIFICATION: C4] | Não; no Mais Buscados, só a ordem | Dos próprios empreendimentos, só números | Sim |
| Quem visualizou um empreendimento | Não | Não | Nunca: só números | Sim |
| Verba e indicadores de mídia | Não | Não | Só a própria, se contratou | Sim |
| Equipe de vendas da incorporadora | Não | Não | A própria | Sim |
| Material comercial e contato do plantão | Não | Sim, fora do modo cliente | Os próprios | Sim |
| Conteúdo da plataforma (textos, imagens, personalização) | Lê | Lê | Lê | Lê; só o god mode escreve |

## Segurança em três camadas

RLS é a fonte da verdade. Banco único com tenant_id e RLS em toda tabela exposta; índice em todo tenant_id. O app conecta com o papel de banco app_user (sem BYPASSRLS e sem ser dono das tabelas); cada requisição roda numa transação que grava a conta e o impersonate com set_config('app.conta_id', ..., true) e set_config('app.impersonacao_id', ..., true). Sem contexto, só o que é público da vitrine aparece. Papéis de banco separados: app_user, auth_service (só tabelas do Better Auth, schema auth), worker e migrator (dono do schema, só no deploy). Funções no schema app (current_conta_id(), current_role(), current_tenant_id(), is_god_mode(), is_internal(), pode_escrever()), security definer, stable, search_path vazio, consultadas dentro de (select ...). Views com security_invoker = true. O papel vem da tabela contas, nunca de dado de perfil editável ou do conteúdo da sessão. Drizzle é a camada de consulta e de migrations; políticas RLS, funções, gatilhos e GRANTs são escritos em migrations SQL revisadas. RLS não filtra colunas: dado sensível fica em tabela separada (ex.: empreendimentos_comercial com comissão e escritório; leads_contato com WhatsApp e e-mail). Bloqueie alteração de role, tenant_id e responsavel_conta_id por GRANT de coluna ou trigger.

proxy.ts só para rota: lê o cookie de sessão do Better Auth, renova e redireciona. Não autoriza dados.

Contexto no servidor: toda Server Action e Route Handler começa com exigirContexto(): valida a sessão no servidor pelo Better Auth, carrega conta, tenant, produtos e impersonate, abre a transação com o contexto do banco, lê o tenant_id só do contexto (nunca de corpo, URL ou cabeçalho), valida a entrada com Zod estrito e responde 404, não 403, para id de outro tenant.

A conexão com o banco (DATABASE_URL) fica num único módulo server-only, que só entrega o cliente Drizzle dentro de exigirContexto() e é importado só de uma lista permitida (um teste falha fora dela). Credenciais de S3, Better Auth e IA também ficam só no servidor.

Impersonate: só internal_admin, internal_superadmin e god_mode, com motivo obrigatório; alvo só papel de cliente. Sem trocar de token. Só leitura por padrão; nunca muda papéis, usuários, tenant, consentimento ou cobrança, nem exclui. Máximo de 30 minutos. Faixa fixa "Você está vendo como [nome]". Tudo vai para a auditoria.

Auditoria imutável (audit_logs, sem UPDATE, DELETE ou TRUNCATE para ninguém): verba, comissão, proposta, contrato, exclusão, papéis, situação do tenant, produtos, config_global e consentimentos. Registre também quando papel interno ou god mode abre dados de um tenant ou contato de lead, e mudanças de papel negadas. Guarde ids, não contatos.

## Testes de banco (cobertura mínima)

Os mesmos arquivos rodam no PGlite (npm run test:db, sem Docker) e no CI (contêiner postgis/postgis com Postgres 17, drizzle-kit migrate, seed e pg_prove). Cubra, no mínimo:

O comprador não lê comissão, equipe, rodízio, movimentos, engajamento, visualizações nem CRM.

A incorporadora não vê etapa, visita ou proposta com outra; vê só números de visualização; não lê nem move etapa de CRM de outra.

Exclusivo ou não listado fica fora do mapa e da busca. Publicar sem R.I. é recusado, até para o god mode.

Excluir etapa com cards é recusado. Tipologia sem subcondomínio é recusada.

Oferecer semelhante não libera contato.

God mode lê e não escreve dado de cliente, direto ou em impersonate.

Teste de catálogo: RLS em toda tabela, índice em todo tenant_id, search_path fixo em toda security definer, security_invoker em toda view, anon só executa as funções da vitrine, nenhum resto de broker, corretor ou imobiliaria.
