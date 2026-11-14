# Dados: entidades, funções SQL, armazenamento e tarefas

> **Origem:** SPEC 1.0, §13 Banco (principais entidades) — texto da 1.0 preservado abaixo, só convertido para Markdown.
> **Fase na SPEC 2.0:** a lista é do produto completo; cada fatia cria só as tabelas de que precisa (migrations aditivas).

### Esclarecimentos e mudanças da 2.0

Aprovados pelo Matheus em 13/11/2026 (decisões em `docs/PLANO.md`).

- Schema declarado em Drizzle por módulo; políticas RLS, funções `app.*`, gatilhos e GRANTs em migrations SQL revisadas (sem mudança).
- Localização: latitude e longitude em vez de PostGIS na v1.
- Armazenamento: Cloudflare R2 (aprovado, D8); MinIO fora.
- Seed fictício único em `src/seed/seed.ts`, usado no desenvolvimento, nos testes e na homologação.

---

## Banco (principais entidades)

tenants, tenant_produtos (plataforma, projeto_midia), contas, tenant_convites, empreendimentos (com cnpj, tipo, visibilidade, videos, capa_path, mapa_interativo_url, escritorio, localização PostGIS, pronto para morar, % de obra, aceita permuta, entrada e parcela mínimas, preço "a partir de"), empreendimentos_comercial, obra_etapas, subcondominios, tipologias, tipologia_subcondominios, unidades, planos, tabela_movimentos, empreendimento_equipe, equipe_vendas, leads, leads_contato, leads_interesses (consentimento por empreendimento: origem, data, versão, texto e revogação), atendimentos (andamento por empreendimento, com etapa_id, analista_conta_id, valor, próxima ação, etiquetas), crm_etapas, crm_notas, crm_tarefas, visitas, propostas, visualizacoes, empreendimento_engajamento, destaques_vitrine, aportes e campanhas, visitor, event, profile, favorite, list, alert, project_change (preenchida por trigger), recommendation, consent, conteudo_textos, conteudo_versoes_legais, conteudo_imagens, personalizacao, listas_opcoes, historico_edicoes, config_global, impersonation_sessions, audit_logs.

Funções SQL (chamadas pelo Drizzle): count_empreendimentos(filters), count_by_option(filters, question_id), empreendimentos_in_bbox(min_lng, min_lat, max_lng, max_lat, filters), merge_visitor(visitor_id), interesse_empreendimentos(tenant, desde, ate), visao_geral_incorporadora(tenant, desde, ate), passar_ao_gerente_produtos(atendimento), oferecer_semelhantes(lead, empreendimentos), além de contato direto, visita, proposta (responder e cancelar), importar equipe, revogar consentimento, mover etapa e interesse.

Armazenamento (S3 compatível): prefixos empreendimentos/{tenant}/{empreendimento}/... e conteudo-plataforma/. Upload sempre pelo servidor, com checagem de papel, tenant, tipo e tamanho; mídia de empreendimento publicado por URL pública; plantas não publicadas, contratos e documentos só por URL assinada de curta duração.

Tarefas agendadas (pg-boss, processo worker): vencer reservas, encerrar Vitrine Destacada e impersonate, recalcular Mais Buscados, disparar alertas a partir de project_change e limpar convites vencidos. Cada tarefa é idempotente e auditada quando altera dado de cliente.

Seed: só fictício, com ids fixos: três incorporadoras, a house, compradores, dois empreendimentos com cadastro completo e CRM com etapas e cards.
