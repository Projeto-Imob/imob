-- Migration de segurança (fatia 0.2; design D4). Escrita à mão e revisada como código.
-- Os papéis migrator, app_user, auth_service e worker existem antes: npm run db:bootstrap.
-- O app conecta como app_user (sem BYPASSRLS, sem ser dono de tabela). Cada requisição roda
-- numa transação com set_config('app.conta_id', …, true) e set_config('app.impersonacao_id', …, true).
-- Políticas separadas por operação (uma regra de escrita nunca amplia a leitura) e funções de contexto
-- dentro de (select …), avaliadas uma vez por consulta.
-- v1 (SPEC 2.0, F8 e F9): só a equipe da plataforma escreve no catálogo; a incorporadora lê.

-- 1. Schemas e privilégios básicos
create schema if not exists app;--> statement-breakpoint
create schema if not exists auth;--> statement-breakpoint
revoke all on schema app from public;--> statement-breakpoint
grant usage on schema app to app_user, worker;--> statement-breakpoint
grant usage on schema auth to auth_service;--> statement-breakpoint
grant usage on schema public to app_user, worker, auth_service;--> statement-breakpoint
-- Global (sem "in schema"): funções criadas depois pelo migrator não nascem executáveis por PUBLIC.
alter default privileges revoke execute on functions from public;--> statement-breakpoint

-- 2. Funções de contexto: security definer (leem contas sem passar pelo RLS), stable e search_path vazio.
create function app.current_conta_id() returns uuid
  language sql stable security definer set search_path = ''
  as $$ select nullif(current_setting('app.conta_id', true), '')::uuid $$;--> statement-breakpoint

create function app.current_impersonacao_id() returns uuid
  language sql stable security definer set search_path = ''
  as $$ select nullif(current_setting('app.impersonacao_id', true), '')::uuid $$;--> statement-breakpoint

-- "current_role" é palavra reservada do SQL; por isso o papel atual se chama current_papel.
-- Conta desativada ou inexistente não tem papel: para o banco, é visitante.
create function app.current_papel() returns public.papel
  language sql stable security definer set search_path = ''
  as $$ select c.papel from public.contas c where c.id = app.current_conta_id() and c.ativa $$;--> statement-breakpoint

create function app.current_tenant_id() returns uuid
  language sql stable security definer set search_path = ''
  as $$ select c.tenant_id from public.contas c where c.id = app.current_conta_id() and c.ativa $$;--> statement-breakpoint

create function app.is_god_mode() returns boolean
  language sql stable security definer set search_path = ''
  as $$ select coalesce(app.current_papel() = 'god_mode', false) $$;--> statement-breakpoint

-- House de vendas e equipe da plataforma (sem o god mode, que tem função própria).
create function app.is_internal() returns boolean
  language sql stable security definer set search_path = ''
  as $$ select coalesce(app.current_papel() in ('internal_seller', 'internal_account_manager', 'internal_admin', 'internal_superadmin'), false) $$;--> statement-breakpoint

create function app.is_equipe_plataforma() returns boolean
  language sql stable security definer set search_path = ''
  as $$ select coalesce(app.current_papel() in ('internal_admin', 'internal_superadmin'), false) $$;--> statement-breakpoint

-- Regra 12: god mode só lê. Impersonate é só leitura. Sem conta ativa, ninguém escreve.
create function app.pode_escrever() returns boolean
  language sql stable security definer set search_path = ''
  as $$
    select coalesce(
      app.current_papel() is not null
        and app.current_impersonacao_id() is null
        and not app.is_god_mode(),
      false)
  $$;--> statement-breakpoint

-- Escrita no catálogo na v1: só a equipe da plataforma (a incorporadora cadastra na fase 2).
create function app.edita_catalogo() returns boolean
  language sql stable security definer set search_path = ''
  as $$ select app.pode_escrever() and app.is_equipe_plataforma() $$;--> statement-breakpoint

-- Quem vê tudo do catálogo de um tenant (rascunhos, torres futuras): house, equipe, god mode e o próprio tenant.
create function app.ve_catalogo_privado(p_tenant uuid) returns boolean
  language sql stable security definer set search_path = ''
  as $$ select app.is_internal() or app.is_god_mode() or coalesce(p_tenant = app.current_tenant_id(), false) $$;--> statement-breakpoint

-- "Hoje" no fuso de São Paulo, igual ao relógio das regras em TypeScript, sem depender do TimeZone da sessão.
create function app.hoje() returns date
  language sql stable security definer set search_path = ''
  as $$ select (now() at time zone 'America/Sao_Paulo')::date $$;--> statement-breakpoint

-- Fase de venda calculada, sem campo próprio.
-- Stand-by (regra 11): nenhum subcondomínio lançado até hoje; lançamento futuro ou sem data não conta (D15).
create function app.em_stand_by(p_empreendimento uuid) returns boolean
  language sql stable security definer set search_path = ''
  as $$
    select not exists (
      select 1 from public.subcondominios s
      where s.empreendimento_id = p_empreendimento
        and s.data_lancamento is not null
        and s.data_lancamento <= app.hoje()
    )
  $$;--> statement-breakpoint

-- Esgotado: todos os subcondomínios 100% vendidos (status ou todas as unidades vendidas).
create function app.esgotado(p_empreendimento uuid) returns boolean
  language sql stable security definer set search_path = ''
  as $$
    select exists (select 1 from public.subcondominios s where s.empreendimento_id = p_empreendimento)
      and not exists (
        select 1 from public.subcondominios s
        where s.empreendimento_id = p_empreendimento
          and s.status <> 'vendido_100'
          and (
            not exists (select 1 from public.unidades u where u.subcondominio_id = s.id and u.empreendimento_id = p_empreendimento)
            or exists (select 1 from public.unidades u where u.subcondominio_id = s.id and u.empreendimento_id = p_empreendimento and u.status <> 'vendida')
          )
      )
  $$;--> statement-breakpoint

-- Campos que só a plataforma decide (defesa em profundidade; vale para as conexões da aplicação).
--   publicação e curadoria: equipe da plataforma;
--   pré-lançamento: só o internal_superadmin (com o consentimento da incorporadora, regra 11);
--   R.I.: equipe da plataforma (na fase 2, o superadmin da incorporadora enquanto for rascunho);
--   tenant: não muda.
create function app.proteger_empreendimento() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
  declare
    equipe boolean := app.is_equipe_plataforma();
    superadmin_interno boolean := coalesce(app.current_papel() = 'internal_superadmin', false);
    superadmin_cliente boolean := coalesce(app.current_papel() = 'client_superadmin', false);
    ri_mudou boolean;
  begin
    if session_user not in ('app_user', 'worker') then
      return new;
    end if;

    if tg_op = 'INSERT' then
      if not equipe and (new.publicacao <> 'rascunho' or new.curadoria_aprovada) then
        raise exception 'Só a equipe da plataforma publica e aprova a curadoria.' using errcode = '42501';
      end if;
      if new.pre_lancamento_ativo and not superadmin_interno then
        raise exception 'Só o internal_superadmin ativa o pré-lançamento.' using errcode = '42501';
      end if;
      ri_mudou := new.ri_numero is not null or new.ri_cartorio is not null
               or new.ri_data_registro is not null or new.ri_patrimonio_afetacao is not null;
      if ri_mudou and not (equipe or superadmin_cliente) then
        raise exception 'O gerente de produtos não registra o R.I.' using errcode = '42501';
      end if;
      return new;
    end if;

    if new.tenant_id is distinct from old.tenant_id then
      raise exception 'O tenant de um empreendimento não muda.' using errcode = '42501';
    end if;
    if not equipe and (new.publicacao is distinct from old.publicacao
                       or new.curadoria_aprovada is distinct from old.curadoria_aprovada) then
      raise exception 'Só a equipe da plataforma publica e aprova a curadoria.' using errcode = '42501';
    end if;
    if new.pre_lancamento_ativo is distinct from old.pre_lancamento_ativo and not superadmin_interno then
      raise exception 'Só o internal_superadmin ativa o pré-lançamento.' using errcode = '42501';
    end if;
    ri_mudou := (new.ri_numero, new.ri_cartorio, new.ri_data_registro, new.ri_patrimonio_afetacao)
                is distinct from (old.ri_numero, old.ri_cartorio, old.ri_data_registro, old.ri_patrimonio_afetacao);
    if ri_mudou and not (equipe or (superadmin_cliente and old.publicacao = 'rascunho')) then
      raise exception 'Depois de publicado, só a equipe da plataforma altera o R.I.; o gerente de produtos nunca altera.'
        using errcode = '42501';
    end if;
    return new;
  end
  $$;--> statement-breakpoint

create trigger empreendimentos_proteger before insert or update on public.empreendimentos
  for each row execute function app.proteger_empreendimento();--> statement-breakpoint

revoke execute on all functions in schema app from public;--> statement-breakpoint
grant execute on function app.current_conta_id(), app.current_impersonacao_id(), app.current_papel(),
  app.current_tenant_id(), app.is_god_mode(), app.is_internal(), app.is_equipe_plataforma(),
  app.pode_escrever(), app.edita_catalogo(), app.ve_catalogo_privado(uuid), app.hoje(),
  app.em_stand_by(uuid), app.esgotado(uuid)
  to app_user, worker;--> statement-breakpoint

-- 3. RLS em toda tabela
alter table public.tenants enable row level security;--> statement-breakpoint
alter table public.contas enable row level security;--> statement-breakpoint
alter table public.empreendimentos enable row level security;--> statement-breakpoint
alter table public.empreendimentos_comercial enable row level security;--> statement-breakpoint
alter table public.subcondominios enable row level security;--> statement-breakpoint
alter table public.tipologias enable row level security;--> statement-breakpoint
alter table public.tipologia_subcondominios enable row level security;--> statement-breakpoint
alter table public.unidades enable row level security;--> statement-breakpoint
alter table public.planos enable row level security;--> statement-breakpoint

-- tenants: o nome da incorporadora é público quando ela tem algum empreendimento visível
-- (matriz de visibilidade); o resto, só o próprio tenant, a house, a equipe e o god mode.
create policy tenants_leitura on public.tenants for select to app_user using (
  (select app.is_internal()) or (select app.is_god_mode())
  or id = (select app.current_tenant_id())
  or exists (select 1 from public.empreendimentos e where e.tenant_id = tenants.id)
);--> statement-breakpoint
create policy tenants_insercao on public.tenants for insert to app_user
  with check ((select app.current_papel()) = 'internal_superadmin' and (select app.pode_escrever()));--> statement-breakpoint
create policy tenants_alteracao on public.tenants for update to app_user
  using ((select app.current_papel()) = 'internal_superadmin' and (select app.pode_escrever()))
  with check ((select app.current_papel()) = 'internal_superadmin' and (select app.pode_escrever()));--> statement-breakpoint

-- contas (matriz de visibilidade): a própria; as do mesmo tenant; a equipe da plataforma e o god mode leem todas
-- as que não são de comprador; a house lê só as contas internas — a equipe de vendas da incorporadora fica fora
-- dela, e o contato do plantão chega pelo escritório de vendas do empreendimento. Dados de comprador chegam a quem
-- atende pelos leads, com consentimento, a partir da fatia 1.3. A escrita chega com o login (fatia 1.4).
create policy contas_leitura on public.contas for select to app_user using (
  id = (select app.current_conta_id())
  or (tenant_id is not null and tenant_id = (select app.current_tenant_id()))
  or (papel <> 'buyer' and ((select app.is_equipe_plataforma()) or (select app.is_god_mode())))
  or (papel in ('internal_seller', 'internal_account_manager', 'internal_admin', 'internal_superadmin')
      and (select app.is_internal()))
);--> statement-breakpoint

-- empreendimentos: house, equipe e god mode leem todos; a incorporadora lê os próprios; o público, só a base
-- elegível (publicado, curado, com R.I., fora de exclusivo, stand-by e esgotado; não listado só com conta ativa).
create policy empreendimentos_leitura on public.empreendimentos for select to app_user using (
  (select app.is_internal()) or (select app.is_god_mode())
  or tenant_id = (select app.current_tenant_id())
  or (
    publicacao = 'publicado' and curadoria_aprovada and ri_numero is not null
    and (visibilidade = 'ativo' or (visibilidade = 'nao_listado' and (select app.current_papel()) is not null))
    and (pre_lancamento_ativo or not app.em_stand_by(id))
    and not app.esgotado(id)
  )
);--> statement-breakpoint
create policy empreendimentos_insercao on public.empreendimentos for insert to app_user
  with check ((select app.edita_catalogo()));--> statement-breakpoint
create policy empreendimentos_alteracao on public.empreendimentos for update to app_user
  using ((select app.edita_catalogo()))
  with check ((select app.edita_catalogo()));--> statement-breakpoint

-- Dados comerciais: house, equipe e god mode; a incorporadora só os próprios; o comprador nunca (regra 7).
create policy comercial_leitura on public.empreendimentos_comercial for select to app_user using (
  (select app.is_internal()) or (select app.is_god_mode())
  or exists (
    select 1 from public.empreendimentos e
    where e.id = empreendimentos_comercial.empreendimento_id and e.tenant_id = (select app.current_tenant_id())
  )
);--> statement-breakpoint
create policy comercial_insercao on public.empreendimentos_comercial for insert to app_user
  with check ((select app.edita_catalogo()));--> statement-breakpoint
create policy comercial_alteracao on public.empreendimentos_comercial for update to app_user
  using ((select app.edita_catalogo()))
  with check ((select app.edita_catalogo()));--> statement-breakpoint

-- subcondomínios: veem-se pelo empreendimento; o público não vê torre não lançada (lançamento futuro ou
-- sem data) enquanto o pré-lançamento estiver desligado (regra 11, por subcondomínio, D15).
create policy subcondominios_leitura on public.subcondominios for select to app_user using (
  exists (
    select 1 from public.empreendimentos e
    where e.id = subcondominios.empreendimento_id
      and (app.ve_catalogo_privado(e.tenant_id) or e.pre_lancamento_ativo
           or (subcondominios.data_lancamento is not null and subcondominios.data_lancamento <= (select app.hoje())))
  )
);--> statement-breakpoint

-- tipologias: o público vê só as que têm vínculo com um subcondomínio visível.
create policy tipologias_leitura on public.tipologias for select to app_user using (
  exists (select 1 from public.empreendimentos e where e.id = tipologias.empreendimento_id and app.ve_catalogo_privado(e.tenant_id))
  or exists (select 1 from public.tipologia_subcondominios ts where ts.tipologia_id = tipologias.id)
);--> statement-breakpoint

-- Vínculos e unidades seguem a visibilidade do subcondomínio (que já segue a do empreendimento).
create policy tipologia_subcondominios_leitura on public.tipologia_subcondominios for select to app_user
  using (exists (select 1 from public.subcondominios s where s.id = tipologia_subcondominios.subcondominio_id));--> statement-breakpoint
create policy unidades_leitura on public.unidades for select to app_user
  using (exists (select 1 from public.subcondominios s where s.id = unidades.subcondominio_id));--> statement-breakpoint

-- planos: seguem o empreendimento.
create policy planos_leitura on public.planos for select to app_user
  using (exists (select 1 from public.empreendimentos e where e.id = planos.empreendimento_id));--> statement-breakpoint

-- Escrita nas tabelas filhas: só a equipe da plataforma (v1). As FKs compostas garantem que os filhos de um
-- empreendimento só apontam para coisas do mesmo empreendimento.
create policy subcondominios_insercao on public.subcondominios for insert to app_user with check ((select app.edita_catalogo()));--> statement-breakpoint
create policy subcondominios_alteracao on public.subcondominios for update to app_user using ((select app.edita_catalogo())) with check ((select app.edita_catalogo()));--> statement-breakpoint
create policy subcondominios_exclusao on public.subcondominios for delete to app_user using ((select app.edita_catalogo()));--> statement-breakpoint
create policy tipologias_insercao on public.tipologias for insert to app_user with check ((select app.edita_catalogo()));--> statement-breakpoint
create policy tipologias_alteracao on public.tipologias for update to app_user using ((select app.edita_catalogo())) with check ((select app.edita_catalogo()));--> statement-breakpoint
create policy tipologias_exclusao on public.tipologias for delete to app_user using ((select app.edita_catalogo()));--> statement-breakpoint
create policy tipologia_subcondominios_insercao on public.tipologia_subcondominios for insert to app_user with check ((select app.edita_catalogo()));--> statement-breakpoint
create policy tipologia_subcondominios_exclusao on public.tipologia_subcondominios for delete to app_user using ((select app.edita_catalogo()));--> statement-breakpoint
create policy unidades_insercao on public.unidades for insert to app_user with check ((select app.edita_catalogo()));--> statement-breakpoint
create policy unidades_alteracao on public.unidades for update to app_user using ((select app.edita_catalogo())) with check ((select app.edita_catalogo()));--> statement-breakpoint
create policy unidades_exclusao on public.unidades for delete to app_user using ((select app.edita_catalogo()));--> statement-breakpoint
create policy planos_insercao on public.planos for insert to app_user with check ((select app.edita_catalogo()));--> statement-breakpoint
create policy planos_alteracao on public.planos for update to app_user using ((select app.edita_catalogo())) with check ((select app.edita_catalogo()));--> statement-breakpoint
create policy planos_exclusao on public.planos for delete to app_user using ((select app.edita_catalogo()));--> statement-breakpoint

-- 4. GRANTs mínimos (o RLS decide as linhas; o GRANT decide as operações e as colunas)
grant select on public.tenants, public.contas to app_user;--> statement-breakpoint
grant insert on public.tenants to app_user;--> statement-breakpoint
grant select, insert on public.empreendimentos, public.empreendimentos_comercial to app_user;--> statement-breakpoint
grant select, insert, delete on public.subcondominios, public.tipologias, public.unidades, public.planos to app_user;--> statement-breakpoint
grant select, insert, delete on public.tipologia_subcondominios to app_user;--> statement-breakpoint
-- UPDATE por coluna: id, tenant_id e empreendimento_id não mudam pelo app. Coluna nova nasce sem UPDATE
-- (a migration que a cria decide). Empreendimento não se apaga pelo app: "agora não" vira rascunho (regra 20).
do $$
declare
  tabela text;
  colunas text;
begin
  foreach tabela in array array['tenants', 'empreendimentos', 'empreendimentos_comercial', 'subcondominios', 'tipologias', 'unidades', 'planos'] loop
    select string_agg(quote_ident(column_name), ', ' order by ordinal_position) into colunas
    from information_schema.columns
    where table_schema = 'public' and table_name = tabela
      and column_name not in ('id', 'tenant_id', 'empreendimento_id');
    execute format('grant update (%s) on public.%I to app_user', colunas, tabela);
  end loop;
end
$$;--> statement-breakpoint

-- 5. Uma só conta god mode (conta única do Matheus, criada por script de bootstrap na fatia 1.4).
create unique index contas_um_god_mode on public.contas ((true)) where papel = 'god_mode';
