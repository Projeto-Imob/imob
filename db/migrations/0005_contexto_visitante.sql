-- Migration de segurança (fatia 1.3b, PR 1): contexto do visitante. Escrita à mão e revisada como código.
-- Aditiva: só cria duas funções. O visitante é um UUID aleatório do cookie httpOnly; o app grava por
-- set_config('app.visitante_id', …, true), válido só na transação (nunca vaza entre requisições do pool).

-- Quem é o visitante desta transação (nulo sem cookie).
create function app.current_visitante_id() returns uuid
  language sql stable security definer set search_path = ''
  as $$ select nullif(current_setting('app.visitante_id', true), '')::uuid $$;--> statement-breakpoint

-- Quem pode gravar como comprador (recomendação, lead, favorito): o visitante sem conta, com cookie, ou o
-- comprador logado e ativo. Nunca o god mode (regra 12), nem em impersonate, nem conta inativa ou de outro papel.
-- "Sem conta" é conta_id vazio: uma conta desativada (conta_id preenchido, sem papel) não vira visitante.
create function app.grava_como_comprador() returns boolean
  language sql stable security definer set search_path = ''
  as $$
    select coalesce(
      app.current_impersonacao_id() is null
        and (
          (app.current_conta_id() is null and app.current_visitante_id() is not null)
          or app.current_papel() = 'buyer'
        ),
      false)
  $$;--> statement-breakpoint

-- GRANTs mínimos: o worker só precisa saber quem é o visitante; só o app grava como comprador.
revoke execute on function app.current_visitante_id(), app.grava_como_comprador() from public;--> statement-breakpoint
grant execute on function app.current_visitante_id() to app_user, worker;--> statement-breakpoint
grant execute on function app.grava_como_comprador() to app_user;
