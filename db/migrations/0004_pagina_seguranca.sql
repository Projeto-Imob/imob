-- Segurança das tabelas da página do empreendimento (fatia 1.1). Escrita à mão e revisada como código.
-- Aditiva. Mesmo padrão de `planos` (0001_seguranca.sql): RLS ligado, leitura igual à do empreendimento
-- (quem vê o empreendimento vê o filho), escrita só com app.edita_catalogo() e UPDATE coluna a coluna.
-- O visitante lê o cartão do escritório por aqui, sem ler `contas`.

alter table public.pontos_proximos enable row level security;--> statement-breakpoint
alter table public.escritorios_vendas enable row level security;--> statement-breakpoint

create policy pontos_proximos_leitura on public.pontos_proximos for select to app_user
  using (exists (select 1 from public.empreendimentos e where e.id = pontos_proximos.empreendimento_id));--> statement-breakpoint
create policy pontos_proximos_insercao on public.pontos_proximos for insert to app_user with check ((select app.edita_catalogo()));--> statement-breakpoint
create policy pontos_proximos_alteracao on public.pontos_proximos for update to app_user using ((select app.edita_catalogo())) with check ((select app.edita_catalogo()));--> statement-breakpoint
create policy pontos_proximos_exclusao on public.pontos_proximos for delete to app_user using ((select app.edita_catalogo()));--> statement-breakpoint

create policy escritorios_vendas_leitura on public.escritorios_vendas for select to app_user
  using (exists (select 1 from public.empreendimentos e where e.id = escritorios_vendas.empreendimento_id));--> statement-breakpoint
create policy escritorios_vendas_insercao on public.escritorios_vendas for insert to app_user with check ((select app.edita_catalogo()));--> statement-breakpoint
create policy escritorios_vendas_alteracao on public.escritorios_vendas for update to app_user using ((select app.edita_catalogo())) with check ((select app.edita_catalogo()));--> statement-breakpoint
create policy escritorios_vendas_exclusao on public.escritorios_vendas for delete to app_user using ((select app.edita_catalogo()));--> statement-breakpoint

grant select, insert, delete on public.pontos_proximos, public.escritorios_vendas to app_user;--> statement-breakpoint
-- UPDATE por coluna: id e empreendimento_id não mudam pelo app.
grant update (categoria, nome, distancia_m, exemplo) on public.pontos_proximos to app_user;--> statement-breakpoint
grant update (origem, nome, cargo, experiencia, foto_path, whatsapp, email, telefone, exemplo) on public.escritorios_vendas to app_user;
