# Proposal

> **Suspensa em 13/11/2026.** Substituída pela SPEC 2.0, aprovada pelo Matheus: o plano vigente é `docs/PLANO.md` e o fluxo de trabalho é o método forja (decisão D1). Os grupos 1 e 2 foram concluídos e reaproveitados; o restante desta change fica como referência histórica e não deve ser executado.

## Why

O Imob (nome de trabalho; "Vieza" provisório na interface) é um ecossistema de geração de demanda para lançamentos imobiliários: a incorporadora vende direto ao comprador e ao investidor, atendidos pela house de vendas interna. Hoje não existe código, só a especificação consolidada em `CLAUDE.md`. Esta change transforma essa especificação num plano executável e rastreável — capacidades, requisitos testáveis, decisões técnicas e uma sequência de entrega — para que cada story futura em `docs/stories/` nasça de um requisito já acordado, sem inventar regra (Artigo IV da Constitution).

## What Changes

- Cria do zero a aplicação web (Next.js 16 + PostgreSQL com PostGIS, Drizzle, Better Auth e armazenamento S3 compatível) com modo `local` (LocalStorage, demo) e modo `postgres`, atrás de portas e adaptadores por domínio. O Supabase deixa de fazer parte da stack.
- Introduz a jornada do comprador sem conta: questionário "Buscar Imóveis" com contador ao vivo, de 2 a 3 opções com nota determinística e motivo, mapa público, página do empreendimento nos modos Morar e Investir, agendamento de visita em 3 toques, favoritos, alertas e painel da conta.
- Introduz o cadastro de empreendimentos em 4 etapas, espelho de unidades, planos de pagamento, comissão e o portão de R.I. que bloqueia publicação até para o god mode.
- Introduz as áreas da incorporadora (indicadores agregados, CRM kanban, equipe de vendas, usuários, projeto de mídia) e da house de vendas (distribuição em rodízio, fila, mini CRM, visitas, passagem ao gerente de produtos, oferta de semelhantes).
- Introduz multi-tenancy com RLS como fonte da verdade, papéis com MFA, impersonate só leitura, auditoria imutável e LGPD (consentimentos por empreendimento, versões de textos legais, direitos do titular).
- Introduz o god mode de personalização (catálogo de textos `<T>`, imagens, cores com checagem WCAG, histórico) sem escrita em dado de cliente.
- Introduz Vitrine Destacada e Mais Buscados como recursos estritamente visuais, sem efeito na nota nem na ordem.
- Introduz negociação (proposta, reserva, contrato, registro de venda) como Épico 2, e o simulador como calculadora com dados da própria pessoa, sujeito à decisão pendente de Matheus.
- Introduz a fundação de engenharia: marca centralizada, design tokens, acessibilidade AA, testes (Vitest, Playwright, axe, pgTAP no PGlite), CI no GitHub Actions e verificação de segredos e termos proibidos.
- Itens com `[NEEDS CLARIFICATION: Cx]` ou marcados **Proposta** entram desligados, configuráveis ou atrás de flag até a decisão de Matheus; nada é inventado.

## Capabilities

### New Capabilities

- `plataforma/marca-e-design`: marca e nome centralizados, tokens de cor e tipografia, regras do lima, acessibilidade AA e não funcionais de layout.
- `plataforma/conformidade-de-publicacao`: regras inegociáveis transversais — R.I. obrigatório, base elegível, pré-lançamento em stand-by, escassez com espelho < 24 h, palavras e termos proibidos, sem CRECI da plataforma, sem indicadores de mercado.
- `identidade/contas-e-papeis`: tenants, papéis, convites, MFA, bootstrap do god mode, limites de concessão de papel, desligamento e exclusão.
- `identidade/isolamento-e-auditoria`: RLS por tenant, contexto no servidor, resposta 404 entre tenants, impersonate só leitura e auditoria imutável.
- `privacidade/consentimento-e-titular`: opt-ins separados, liberação de contato por empreendimento, textos legais versionados, revogação e direitos do titular.
- `catalogo/empreendimentos`: ficha, cadastro em 4 etapas, subcondomínios, tipologias, espelho de unidades, planos, comissão, mídias, visibilidade e fase de venda calculada.
- `busca/questionario`: schema declarativo das perguntas, contador ao vivo, contagem por opção, regra do zero, ampliação, progresso salvo e captura de contato no fim.
- `busca/recomendacao`: filtros da base elegível, nota de 0 a 100, escolha de 2 a 3 opções, motivo por template ou IA, imparcialidade e gravação para auditoria.
- `comprador/navegacao-e-modo`: cinco áreas, estado na URL, modo Morar/Investir, login só no momento de valor e retorno seguro.
- `comprador/resultado`: tela "Seus imóveis", cards, "Por que estou vendo isso?" e cartão do gerente.
- `comprador/pagina-empreendimento`: blocos por modo, custos estimados, plantas e unidades, vizinhança, dados legais, escritório de vendas e parecidos.
- `comprador/mapa`: resolução da posição inicial, pinos e agrupamentos, lista sincronizada, filtros com contagem, área vazia e alerta de área.
- `comprador/visitas`: agendamento em 3 toques, consentimento de visita, confirmação com `.ics` e lembrete simulado.
- `comprador/favoritos-e-alertas`: favoritos, listas, selo "Novidade", comparador, alertas e registro de mudanças de cadastro.
- `comprador/conta`: login rápido, `merge_visitor`, painel de visitas e propostas, privacidade e configurações.
- `comprador/inicio`: home por estado com `resolveHomeState`.
- `analytics/eventos-e-engajamento`: eventos de uso anônimos, visualizações, investidor interessado e Mais Buscados.
- `incorporadora/painel-e-indicadores`: início, visão geral, interesse agregado e dashboards sem identificação de comprador.
- `incorporadora/crm`: kanban com etapas editáveis, cards de atendimento, tarefas, notas e lead próprio.
- `incorporadora/equipe-e-usuarios`: equipe de vendas (plantão), importação e exportação CSV, convites e desativação.
- `house/atendimento`: distribuição em rodízio, fila, mini CRM, visitas, passagem ao gerente de produtos, semelhantes, carteira e dashboards.
- `midia/projeto-de-midia`: verba, campanhas, leads exclusivos de campanha e indicadores de mídia.
- `vitrine/vitrine-destacada`: compra, ativação, vagas, expiração e exibição só visual.
- `negociacao/propostas-e-contratos`: proposta, contraproposta, reserva com prazo, contrato e registro de venda com comissão (Épico 2).
- `simulador/calculadora-investimento`: cap rate, GRM, Cash-on-Cash e ganho de capital só com dados da pessoa.
- `god-mode/personalizacao`: catálogo de textos, versões legais, imagens, aparência, listas editáveis, histórico, exportar e importar.

### Modified Capabilities

- Nenhuma. Não há specs existentes em `openspec/specs/`.

## Impact

- **Código novo:** aplicação na raiz do repositório (Next.js 16, React 19, TypeScript estrito, Tailwind v4, Zod 4, React Hook Form, Zustand, MapLibre GL + OpenFreeMap, Recharts, Drizzle, Better Auth, pg-boss), schema, migrations, seed e testes pgTAP em `db/`, e infraestrutura da VPS em `infra/`.
- **Localização do código:** a especificação exige pasta fora do OneDrive; o repositório atual está no OneDrive. Ver decisão em aberto no `design.md`.
- **Serviços externos:** VPS própria (PostgreSQL 17 + PostGIS, app e worker) e armazenamento S3 compatível, ambos contratados só com aprovação de custo de Matheus; provedor de e-mail transacional idem (até lá, e-mails simulados). ViaCEP, embed do YouTube e geolocalização por IP exigem OK prévio de Matheus. IA (Claude) desligada até a escolha do modelo (C2). WhatsApp, e-mail e push simulados. Nenhum custo sem aprovação.
- **CI:** GitHub Actions com jobs `qualidade`, `build`, `e2e` e `banco`; consumo de minutos monitorado.
- **Processo:** cada grupo de tarefas vira story em `docs/stories/`, com branch e PR; merge sempre de Matheus.
- **Pendências que bloqueiam partes do escopo:** P5–P11 e C1–C15 da especificação (seção 15), além de simulador, Vitrine Destacada (vagas e valores) e planos Essencial/Avançado.
