// Preparação global dos testes de banco: recria imob_teste do zero, aplica as migrations,
// grava o seed fictício e acrescenta registros que só existem nos testes.
import pg from "pg";
import { descrever, ehLocal, nomeDoBanco, urlAdmin, urlDoPapel } from "../../scripts/db/config";
import { migrar, prepararBanco, prepararPapeis, semear } from "../../scripts/db/operacoes";

export default async function preparar() {
  const admin = urlAdmin();
  if (!ehLocal(admin)) throw new Error(`Os testes de banco só rodam contra Postgres em localhost (${descrever(admin)}).`);
  await prepararPapeis(admin);
  await prepararBanco(admin, nomeDoBanco("teste"), { recriar: true });
  const migrator = urlDoPapel("migrator", "teste");
  await migrar(migrator);
  await semear(migrator);

  const c = new pg.Client({ connectionString: migrator });
  await c.connect();
  try {
    // O seed real não tem equipe da plataforma nem god mode (este entra por script de bootstrap).
    await c.query(
      `insert into contas (id, nome, email, papel, ativa, exemplo) values
         ('00000000-0000-4000-8009-000000000001', 'Equipe Teste', 'equipe.teste@exemplo.invalid', 'internal_admin', true, true),
         ('00000000-0000-4000-8009-000000000002', 'God Mode Teste', 'god.teste@exemplo.invalid', 'god_mode', true, true),
         ('00000000-0000-4000-8009-000000000003', 'Sócio Teste', 'socio.teste@exemplo.invalid', 'internal_superadmin', true, true),
         ('00000000-0000-4000-8009-000000000004', 'Comprador Inativo', 'inativo.teste@exemplo.invalid', 'buyer', false, true)`,
    );
    // Incorporadora ativa sem nenhum empreendimento na vitrine: o nome não é público.
    await c.query(
      `insert into tenants (id, tipo, nome_comercial, razao_social, situacao, exemplo) values
         ('00000000-0000-4000-8009-000000000010', 'incorporadora', 'Sem Vitrine', 'Sem Vitrine Ltda. (exemplo)', 'ativo', true)`,
    );
    // Segunda torre de um empreendimento já à venda, com lançamento futuro (pré-lançamento desligado).
    await c.query(
      `with emp as (select id from empreendimentos where slug = 'vila-menino-deus')
       insert into subcondominios (id, empreendimento_id, nome, status, data_lancamento, data_entrega,
         logradouro, numero, bairro, cidade, uf, latitude, longitude, exemplo)
       select '00000000-0000-4000-8009-000000000101', emp.id, 'Torre B (futura)', 'na_planta', '2031-01-01', '2034-01-01',
         'Rua Exemplo do Menino Deus', '300', 'Menino Deus', 'Porto Alegre', 'RS', -30.0525, -51.2244, true from emp`,
    );
    await c.query(
      `with emp as (select id from empreendimentos where slug = 'vila-menino-deus')
       insert into tipologias (id, empreendimento_id, nome, tipo, dormitorios, exemplo)
       select '00000000-0000-4000-8009-000000000102', emp.id, 'Cobertura da Torre B', 'Cobertura', 4, true from emp`,
    );
    await c.query(
      `with emp as (select id from empreendimentos where slug = 'vila-menino-deus')
       insert into tipologia_subcondominios (empreendimento_id, tipologia_id, subcondominio_id)
       select emp.id, '00000000-0000-4000-8009-000000000102', '00000000-0000-4000-8009-000000000101' from emp`,
    );
    await c.query(
      `with emp as (select id from empreendimentos where slug = 'vila-menino-deus')
       insert into unidades (id, empreendimento_id, tipologia_id, subcondominio_id, identificador, area_privativa, preco, status, exemplo)
       select '00000000-0000-4000-8009-000000000103', emp.id, '00000000-0000-4000-8009-000000000102',
         '00000000-0000-4000-8009-000000000101', 'B-1501', 180, 2100000, 'disponivel', true from emp`,
    );
  } finally {
    await c.end();
  }
}
