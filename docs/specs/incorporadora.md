# Área da incorporadora

> **Origem:** SPEC 1.0, §7 Incorporadora — texto da 1.0 preservado abaixo, só convertido para Markdown.
> **Fase na SPEC 2.0:** v1 mínima: convite, empreendimentos próprios com números agregados e atendimentos liberados (somente leitura, etapa simples). Fase 2: CRM kanban, equipe de vendas com CSV, usuários e dashboards completos. Fase 3: projeto de mídia.

### Esclarecimentos e mudanças da 2.0

Aprovados pelo Matheus em 13/11/2026 (decisões em `docs/PLANO.md`).

- Nada da regra muda; só a ordem de entrega.

---

## Incorporadora

Início: "Desde sua última visita", seis cards com comparação ao período anterior, próximas ações, Movimentações, Mais Buscados e empreendimentos ativos.

Visão geral: empreendimentos ativos, unidades disponíveis (número e %, com barra), reservas e vendas; período hoje, 7, 30, 90 dias ou personalizado; tabela por empreendimento.

Interesse de compradores e investidores (nunca aparecem nomes): linha de acessos por dia; barras por empreendimento com acessos, usuários únicos, recorrentes (2+ visualizações) e investidores interessados; KPIs de acessos hoje e média de visualizações por usuário. Uma escala por gráfico, sem eixo duplo, com legenda e tabela alternativa.

"Mesmo usuário viu" conta só quem está logado. A tabela de visualizações (conta, empreendimento, dia, vezes) a incorporadora não lê; ela recebe só números. O visitante anônimo entra só no total. O texto de privacidade avisa disso.

Investidor interessado: conta com objetivo "investir" que favoritou, pôs em lista, pediu contato, agendou visita ou mandou proposta. Só número.

Dashboards (filtro Hoje em todos os perfis): acessos, interações, leads direcionados, contatos liberados, visitas, propostas, vendas, VGV, resultado por empreendimento, venda por origem, interesse dos compradores, acessos e estoque por empreendimento e comercial.

CRM: kanban com etapas por incorporadora e editáveis (criar, renomear, reordenar; excluir só vazia ou movendo os cards). Ganho e perda são fixas. O card é o atendimento. Busca e filtros por empreendimento, origem, responsável e etiqueta. O card abre um painel com dados do comprador só leitura e só se liberados, campos do CRM editáveis (etapa, notas, tarefas, valor potencial, próxima ação, etiquetas), tarefas com data e histórico de etapa. Arrastar e soltar, com alternativa por teclado "Mover para…". Card criado à mão é lead próprio da incorporadora, com origem obrigatória e visível só a ela. A incorporadora nunca edita as respostas nem o contato do comprador.

Leads da plataforma: acompanha o lead da busca (só leitura). Edita o lead de mídia que a equipe dela atende.

Equipe de vendas (plantão): nome, cargo, empresa, CRECI opcional, WhatsApp, e-mail e situação. Card no empreendimento com a lista, o responsável e o rodízio. Importar CSV (modelo para baixar, prévia com erro por linha, tudo ou nada). Exportar CSV em UTF-8 com BOM e separador ";".

Usuários (só client_superadmin): convidar, escolher gerente ou plantão e desativar.

Projeto de mídia (só se contratou): verba aportada e gasta, saldo, campanhas por empreendimento e canal com período e gasto (lançamento manual), leads, CPL, CAC, ROI, funil e venda atribuída ao canal. Ativar campanha exige conferência do R.I.
