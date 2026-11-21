CREATE TYPE "public"."categoria_ponto" AS ENUM('escola', 'parque', 'hospital', 'academia', 'mercado', 'transporte');--> statement-breakpoint
CREATE TABLE "escritorios_vendas" (
	"empreendimento_id" uuid PRIMARY KEY NOT NULL,
	"origem" "escritorio" DEFAULT 'house' NOT NULL,
	"nome" text NOT NULL,
	"cargo" text,
	"experiencia" text,
	"foto_path" text,
	"whatsapp" text,
	"email" text,
	"telefone" text,
	"exemplo" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pontos_proximos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"empreendimento_id" uuid NOT NULL,
	"categoria" "categoria_ponto" NOT NULL,
	"nome" text NOT NULL,
	"distancia_m" integer NOT NULL,
	"exemplo" boolean DEFAULT false NOT NULL,
	CONSTRAINT "pontos_proximos_unico" UNIQUE("empreendimento_id","categoria","nome"),
	CONSTRAINT "pontos_proximos_distancia" CHECK (distancia_m >= 0)
);
--> statement-breakpoint
ALTER TABLE "escritorios_vendas" ADD CONSTRAINT "escritorios_vendas_empreendimento_id_empreendimentos_id_fk" FOREIGN KEY ("empreendimento_id") REFERENCES "public"."empreendimentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pontos_proximos" ADD CONSTRAINT "pontos_proximos_empreendimento_id_empreendimentos_id_fk" FOREIGN KEY ("empreendimento_id") REFERENCES "public"."empreendimentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pontos_proximos_empreendimento_id_idx" ON "pontos_proximos" USING btree ("empreendimento_id");