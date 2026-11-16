CREATE TYPE "public"."papel" AS ENUM('buyer', 'client_superadmin', 'client_manager', 'sales_member', 'internal_seller', 'internal_account_manager', 'internal_admin', 'internal_superadmin', 'god_mode');--> statement-breakpoint
CREATE TYPE "public"."situacao_tenant" AS ENUM('implantacao', 'ativo', 'suspenso', 'encerrado');--> statement-breakpoint
CREATE TYPE "public"."tipo_tenant" AS ENUM('incorporadora', 'plataforma');--> statement-breakpoint
CREATE TYPE "public"."escritorio" AS ENUM('house', 'plantao');--> statement-breakpoint
CREATE TYPE "public"."finalidade" AS ENUM('venda', 'aluguel', 'venda_ou_aluguel');--> statement-breakpoint
CREATE TYPE "public"."grupo_subcondominio" AS ENUM('residencial', 'loteamento_horizontal', 'comercial', 'residencial_comercial');--> statement-breakpoint
CREATE TYPE "public"."momento_financiamento" AS ENUM('chaves', 'assinatura');--> statement-breakpoint
CREATE TYPE "public"."publicacao" AS ENUM('rascunho', 'publicado');--> statement-breakpoint
CREATE TYPE "public"."status_subcondominio" AS ENUM('na_planta', 'em_obra', 'pronto', 'vendido_100');--> statement-breakpoint
CREATE TYPE "public"."status_unidade" AS ENUM('disponivel', 'reservada', 'vendida');--> statement-breakpoint
CREATE TYPE "public"."tipo_empreendimento" AS ENUM('novo', 'terceiro');--> statement-breakpoint
CREATE TYPE "public"."visibilidade" AS ENUM('ativo', 'nao_listado', 'exclusivo');--> statement-breakpoint
CREATE TABLE "contas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_user_id" text,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"papel" "papel" NOT NULL,
	"tenant_id" uuid,
	"cargo" text,
	"whatsapp" text,
	"telefone" text,
	"ativa" boolean DEFAULT true NOT NULL,
	"exemplo" boolean DEFAULT false NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contas_auth_user_id_unique" UNIQUE("auth_user_id"),
	CONSTRAINT "contas_email_unique" UNIQUE("email"),
	CONSTRAINT "contas_papel_e_tenant" CHECK ((papel in ('client_superadmin', 'client_manager', 'sales_member')) = (tenant_id is not null))
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tipo" "tipo_tenant" NOT NULL,
	"nome_comercial" text NOT NULL,
	"razao_social" text NOT NULL,
	"situacao" "situacao_tenant" DEFAULT 'implantacao' NOT NULL,
	"exemplo" boolean DEFAULT false NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "empreendimentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"nome" text NOT NULL,
	"cnpj" text,
	"ri_numero" text,
	"ri_cartorio" text,
	"ri_data_registro" date,
	"ri_patrimonio_afetacao" boolean,
	"tipo" "tipo_empreendimento" DEFAULT 'novo' NOT NULL,
	"visibilidade" "visibilidade" DEFAULT 'ativo' NOT NULL,
	"publicacao" "publicacao" DEFAULT 'rascunho' NOT NULL,
	"curadoria_aprovada" boolean DEFAULT false NOT NULL,
	"pre_lancamento_ativo" boolean DEFAULT false NOT NULL,
	"descricao" text DEFAULT '' NOT NULL,
	"videos" text[] DEFAULT '{}'::text[] NOT NULL,
	"capa_path" text,
	"mapa_interativo_url" text,
	"percentual_obra" numeric(5, 2) DEFAULT 0 NOT NULL,
	"aceita_permuta" boolean DEFAULT false NOT NULL,
	"comodidades" text[],
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"bairro" text NOT NULL,
	"cidade" text NOT NULL,
	"uf" text NOT NULL,
	"espelho_atualizado_em" timestamp with time zone,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"exemplo" boolean DEFAULT false NOT NULL,
	CONSTRAINT "empreendimentos_slug_unique" UNIQUE("slug"),
	CONSTRAINT "empreendimentos_nome_minimo" CHECK (char_length(btrim(nome)) >= 4),
	CONSTRAINT "empreendimentos_cnpj_formato" CHECK (cnpj is null or cnpj ~ '^[0-9]{2}\.[0-9]{3}\.[0-9]{3}/[0-9]{4}-[0-9]{2}$'),
	CONSTRAINT "empreendimentos_uf" CHECK (char_length(uf) = 2),
	CONSTRAINT "empreendimentos_percentual_obra" CHECK (percentual_obra between 0 and 100),
	CONSTRAINT "empreendimentos_posicao" CHECK (latitude between -90 and 90 and longitude between -180 and 180),
	CONSTRAINT "empreendimentos_publicacao_exige_ri" CHECK (publicacao <> 'publicado' or (ri_numero is not null and btrim(ri_numero) <> '' and ri_cartorio is not null and btrim(ri_cartorio) <> '' and ri_data_registro is not null))
);
--> statement-breakpoint
CREATE TABLE "empreendimentos_comercial" (
	"empreendimento_id" uuid PRIMARY KEY NOT NULL,
	"comissao_percentual" numeric(5, 2),
	"escritorio" "escritorio" DEFAULT 'house' NOT NULL,
	"exemplo" boolean DEFAULT false NOT NULL,
	CONSTRAINT "comercial_comissao" CHECK (comissao_percentual is null or comissao_percentual between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "planos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empreendimento_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"sinal_percentual" numeric(5, 2) NOT NULL,
	"mensais_percentual" numeric(5, 2) NOT NULL,
	"numero_parcelas" integer,
	"intercaladas_percentual" numeric(5, 2) DEFAULT 0 NOT NULL,
	"chaves_percentual" numeric(5, 2) DEFAULT 0 NOT NULL,
	"saldo_percentual" numeric(5, 2) DEFAULT 0 NOT NULL,
	"indice_correcao" text,
	"financiamento_aceita" boolean DEFAULT false NOT NULL,
	"financiamento_momento" "momento_financiamento",
	"financiamento_percentual_maximo" numeric(5, 2),
	"fgts" boolean DEFAULT false NOT NULL,
	"dacao" boolean DEFAULT false NOT NULL,
	"parcelamento_direto" boolean DEFAULT false NOT NULL,
	"exemplo" boolean DEFAULT false NOT NULL,
	CONSTRAINT "planos_parcelas" CHECK (numero_parcelas is null or numero_parcelas > 0),
	CONSTRAINT "planos_percentuais" CHECK (sinal_percentual between 0 and 100 and mensais_percentual between 0 and 100 and intercaladas_percentual between 0 and 100 and chaves_percentual between 0 and 100 and saldo_percentual between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "subcondominios" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empreendimento_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"status" "status_subcondominio" DEFAULT 'na_planta' NOT NULL,
	"grupo" "grupo_subcondominio" DEFAULT 'residencial' NOT NULL,
	"pavimentos" integer,
	"elevadores" integer,
	"data_lancamento" date,
	"data_entrega" date,
	"cep" text,
	"logradouro" text NOT NULL,
	"numero" text NOT NULL,
	"complemento" text,
	"bairro" text NOT NULL,
	"cidade" text NOT NULL,
	"uf" text NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"infraestrutura" text[] DEFAULT '{}'::text[] NOT NULL,
	"outros_itens" text,
	"exemplo" boolean DEFAULT false NOT NULL,
	CONSTRAINT "subcondominios_id_empreendimento" UNIQUE("id","empreendimento_id"),
	CONSTRAINT "subcondominios_pavimentos" CHECK (pavimentos is null or pavimentos >= 0),
	CONSTRAINT "subcondominios_elevadores" CHECK (elevadores is null or elevadores >= 0)
);
--> statement-breakpoint
CREATE TABLE "tipologia_subcondominios" (
	"empreendimento_id" uuid NOT NULL,
	"tipologia_id" uuid NOT NULL,
	"subcondominio_id" uuid NOT NULL,
	CONSTRAINT "tipologia_subcondominios_tipologia_id_subcondominio_id_pk" PRIMARY KEY("tipologia_id","subcondominio_id")
);
--> statement-breakpoint
CREATE TABLE "tipologias" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empreendimento_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"tipo" text NOT NULL,
	"finalidade" "finalidade" DEFAULT 'venda' NOT NULL,
	"planta_path" text,
	"dormitorios" integer DEFAULT 0 NOT NULL,
	"suites" integer DEFAULT 0 NOT NULL,
	"suites_master" integer DEFAULT 0 NOT NULL,
	"banheiros" integer DEFAULT 0 NOT NULL,
	"lavabos" integer DEFAULT 0 NOT NULL,
	"vagas" integer DEFAULT 0 NOT NULL,
	"exemplo" boolean DEFAULT false NOT NULL,
	CONSTRAINT "tipologias_id_empreendimento" UNIQUE("id","empreendimento_id"),
	CONSTRAINT "tipologias_contagens" CHECK (dormitorios >= 0 and suites >= 0 and suites_master >= 0 and banheiros >= 0 and lavabos >= 0 and vagas >= 0)
);
--> statement-breakpoint
CREATE TABLE "unidades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empreendimento_id" uuid NOT NULL,
	"tipologia_id" uuid NOT NULL,
	"subcondominio_id" uuid NOT NULL,
	"identificador" text NOT NULL,
	"area_privativa" numeric(10, 2) NOT NULL,
	"preco" numeric(14, 2) NOT NULL,
	"status" "status_unidade" DEFAULT 'disponivel' NOT NULL,
	"exemplo" boolean DEFAULT false NOT NULL,
	CONSTRAINT "unidades_identificador_por_subcondominio" UNIQUE("subcondominio_id","identificador"),
	CONSTRAINT "unidades_valores" CHECK (area_privativa > 0 and preco > 0)
);
--> statement-breakpoint
ALTER TABLE "contas" ADD CONSTRAINT "contas_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "empreendimentos" ADD CONSTRAINT "empreendimentos_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "empreendimentos_comercial" ADD CONSTRAINT "empreendimentos_comercial_empreendimento_id_empreendimentos_id_fk" FOREIGN KEY ("empreendimento_id") REFERENCES "public"."empreendimentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planos" ADD CONSTRAINT "planos_empreendimento_id_empreendimentos_id_fk" FOREIGN KEY ("empreendimento_id") REFERENCES "public"."empreendimentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subcondominios" ADD CONSTRAINT "subcondominios_empreendimento_id_empreendimentos_id_fk" FOREIGN KEY ("empreendimento_id") REFERENCES "public"."empreendimentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tipologia_subcondominios" ADD CONSTRAINT "tipologia_subcondominios_empreendimento_id_empreendimentos_id_fk" FOREIGN KEY ("empreendimento_id") REFERENCES "public"."empreendimentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tipologia_subcondominios" ADD CONSTRAINT "tipologia_subcondominios_tipologia_mesmo_empreendimento" FOREIGN KEY ("tipologia_id","empreendimento_id") REFERENCES "public"."tipologias"("id","empreendimento_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tipologia_subcondominios" ADD CONSTRAINT "tipologia_subcondominios_subcondominio_mesmo_empreendimento" FOREIGN KEY ("subcondominio_id","empreendimento_id") REFERENCES "public"."subcondominios"("id","empreendimento_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tipologias" ADD CONSTRAINT "tipologias_empreendimento_id_empreendimentos_id_fk" FOREIGN KEY ("empreendimento_id") REFERENCES "public"."empreendimentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unidades" ADD CONSTRAINT "unidades_empreendimento_id_empreendimentos_id_fk" FOREIGN KEY ("empreendimento_id") REFERENCES "public"."empreendimentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unidades" ADD CONSTRAINT "unidades_tipologia_mesmo_empreendimento" FOREIGN KEY ("tipologia_id","empreendimento_id") REFERENCES "public"."tipologias"("id","empreendimento_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unidades" ADD CONSTRAINT "unidades_subcondominio_mesmo_empreendimento" FOREIGN KEY ("subcondominio_id","empreendimento_id") REFERENCES "public"."subcondominios"("id","empreendimento_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contas_tenant_id_idx" ON "contas" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "empreendimentos_tenant_id_idx" ON "empreendimentos" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "empreendimentos_vitrine_idx" ON "empreendimentos" USING btree ("publicacao","visibilidade");--> statement-breakpoint
CREATE INDEX "empreendimentos_posicao_idx" ON "empreendimentos" USING btree ("latitude","longitude");--> statement-breakpoint
CREATE INDEX "planos_empreendimento_id_idx" ON "planos" USING btree ("empreendimento_id");--> statement-breakpoint
CREATE INDEX "subcondominios_empreendimento_id_idx" ON "subcondominios" USING btree ("empreendimento_id");--> statement-breakpoint
CREATE INDEX "tipologia_subcondominios_empreendimento_id_idx" ON "tipologia_subcondominios" USING btree ("empreendimento_id");--> statement-breakpoint
CREATE INDEX "tipologia_subcondominios_subcondominio_id_idx" ON "tipologia_subcondominios" USING btree ("subcondominio_id");--> statement-breakpoint
CREATE INDEX "tipologias_empreendimento_id_idx" ON "tipologias" USING btree ("empreendimento_id");--> statement-breakpoint
CREATE INDEX "unidades_empreendimento_id_idx" ON "unidades" USING btree ("empreendimento_id");--> statement-breakpoint
CREATE INDEX "unidades_tipologia_id_idx" ON "unidades" USING btree ("tipologia_id");--> statement-breakpoint
CREATE INDEX "unidades_subcondominio_id_idx" ON "unidades" USING btree ("subcondominio_id","status");