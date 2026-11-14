# House de vendas

> **Origem:** SPEC 1.0, §8 House de vendas — texto da 1.0 preservado abaixo, só convertido para Markdown.
> **Fase na SPEC 2.0:** v1: rodízio, fila, qualificação, visitas e "Passar ao gerente de produtos", com etapas até "visita feita" e "perdido". Fase 2: mini CRM kanban completo, oferecer semelhantes, carteira do gerente de contas e dashboards. Etapas de proposta, reserva, contrato e venda chegam com a negociação (fase 3).

### Esclarecimentos e mudanças da 2.0

Aprovados pelo Matheus em 13/11/2026 (decisões em `docs/PLANO.md`).

- Prazo de proteção do lead: sem valor na 1.0; fica nulo até o Matheus definir (C14).

---

## House de vendas

Distribuição: o lead da busca vai a uma analista ativa, em rodízio (uma vez por analista ativa). Sem analista ativa, ou na regra manual, fica na fila da house, visível a toda a house até alguém assumir. Prazo de proteção ao lead mantém a atribuição se o comprador procurar a incorporadora direto (Proposta).

Fila da analista: leads novos de contato direto, visita e busca; checklist de qualificação; agenda de visitas e confirmação; prazo de resposta visível.

Depois da visita: "Passar ao gerente de produtos" registra a passagem, e o gerente da incorporadora vê o atendimento.

Oferecer semelhantes: pela regra da busca; cria só a sugestão, o comprador decide, e o contato só vai à outra incorporadora com novo consentimento.

Gerente de contas: carteira de incorporadoras e empreendimentos; é quem aparece no escritório de vendas quando a house atende.

Mini CRM do lead: kanban e lista nas etapas novo, qualificado, visita agendada, visita feita, proposta, reserva, contrato, venda e perdido (com motivo). Cada etapa pede o fato que representa. Origem sempre visível e não editável. Quem atende edita contato, qualificação, negócio e acompanhamento, com autor e data no histórico; as respostas originais do questionário não mudam. Lead próprio com origem obrigatória (Indicação, Carteira própria, Portal, Redes sociais, Outro), privado de quem cadastrou e fora dos números da busca e da mídia.

Visitas: agenda e lista, com agendar, reagendar, cancelar e registrar resultado, sincronizadas com o kanban.

Dashboards: vendas, VGV, comissão devida, leads, tempo de primeira resposta, funil, leads e vendas por origem, canais com melhor conversão, visitas, propostas, oportunidades e tarefas atrasadas.

Comissão e material comercial aparecem para a house fora do modo cliente.
