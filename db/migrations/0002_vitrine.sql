-- Migration da vitrine (fatia 0.3). Escrita à mão e revisada como código.
-- Aditiva: cria app.na_vitrine e troca só o corpo de app.esgotado (mesma assinatura e mesmos GRANTs).
-- A política de leitura do empreendimento não muda e passa a usar o esgotado novo.

-- Esgotado: todas as torres que o público vê estão 100% vendidas (status ou todas as unidades vendidas).
-- O público vê as torres lançadas até hoje, ou todas quando o pré-lançamento está ativo (regra 11, D15).
-- Antes, uma torre futura, que o público não vê, segurava na vitrine um empreendimento sem nada à venda.
create or replace function app.esgotado(p_empreendimento uuid) returns boolean
  language sql stable security definer set search_path = ''
  as $$
    with visiveis as (
      select s.id, s.status
      from public.subcondominios s
      join public.empreendimentos e on e.id = s.empreendimento_id
      where s.empreendimento_id = p_empreendimento
        and (e.pre_lancamento_ativo or (s.data_lancamento is not null and s.data_lancamento <= app.hoje()))
    )
    select exists (select 1 from visiveis)
      and not exists (
        select 1 from visiveis s
        where s.status <> 'vendido_100'
          and (
            not exists (select 1 from public.unidades u where u.subcondominio_id = s.id and u.empreendimento_id = p_empreendimento)
            or exists (select 1 from public.unidades u where u.subcondominio_id = s.id and u.empreendimento_id = p_empreendimento and u.status <> 'vendida')
          )
      )
  $$;--> statement-breakpoint

-- Vitrine pública (specs catalogo e busca-e-recomendacao, "base elegível"): publicado, aprovado pela curadoria,
-- com R.I. (regra 1), visibilidade ativa (não listado e exclusivo ficam fora da vitrine), fora do stand-by
-- (regra 11) e não esgotado. Não depende de quem consulta: a consulta pública filtra por ela, além do RLS.
create function app.na_vitrine(p_empreendimento uuid) returns boolean
  language sql stable security definer set search_path = ''
  as $$
    select exists (
      select 1 from public.empreendimentos e
      where e.id = p_empreendimento
        and e.publicacao = 'publicado'
        and e.curadoria_aprovada
        and e.ri_numero is not null
        and e.visibilidade = 'ativo'
        and (e.pre_lancamento_ativo or not app.em_stand_by(e.id))
        and not app.esgotado(e.id)
    )
  $$;--> statement-breakpoint

revoke execute on function app.na_vitrine(uuid) from public;--> statement-breakpoint
grant execute on function app.na_vitrine(uuid) to app_user, worker;
