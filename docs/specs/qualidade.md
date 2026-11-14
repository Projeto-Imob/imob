# Requisitos não funcionais, critérios de sucesso e testes exigidos

> **Origem:** SPEC 1.0, §13 (Requisitos não funcionais, Critérios de sucesso, Testes exigidos) — texto da 1.0 preservado abaixo, só convertido para Markdown.
> **Fase na SPEC 2.0:** todas as fases; cada fatia prova os critérios que toca.

### Esclarecimentos e mudanças da 2.0

Aprovados pelo Matheus em 13/11/2026 (decisões em `docs/PLANO.md`).

- Os testes ponta a ponta são escritos por fatia, junto com a tela, e não num grupo de integração no fim.
- Testes de banco contra Postgres real (o mesmo da produção), local e no CI.

---

## Requisitos não funcionais

Mobile primeiro (desenho de 360 a 390 px, expandido até o desktop). Sem rolagem horizontal em 390, 1024 e 1440 px.

Contraste AA, foco visível, selos com ícone e texto (nunca só cor), alvos de 44 × 44 px, prefers-reduced-motion, axe sem violação. A lista do mapa funciona por teclado e leitor de tela.

LCP da página do empreendimento < 2,5 s em 4G; imagens responsivas com lazy loading; mapa e bibliotecas pesadas sob demanda.

TypeScript estrito, sem any novo. Variáveis novas vão para .env.example, com placeholder e comentário.

Textos centralizados em src/i18n/pt-BR.ts e exibidos pelo catálogo <T>.

## Critérios de sucesso

Um visitante sem conta conclui o questionário e vê de 2 a 3 opções.

Nenhum empreendimento sem R.I., em pré-lançamento, rascunho ou esgotado aparece no contador, no resultado, no mapa ou em alertas.

Trocar Vitrine Destacada, comissão ou incorporadora não muda a nota nem a ordem.

Nenhum motivo passa de 140 caracteres nem traz número que não venha do cadastro ou da conta.

"Agendar visita" e "Falar com o gerente" a até 2 toques; agendamento em 3.

Com localização negada, o mapa abre na cidade pelo IP ou em Porto Alegre.

Contagem no banco em menos de 300 ms.

A incorporadora não vê nome nem contato de quem só respondeu ao questionário.

## Testes exigidos

Unidade: filtros, regra do zero, nota e componentes, motivo sem IA, resolveHomeState, resolução da posição do mapa (negada, tempo esgotado, IP), teste que varre o código contra os termos proibidos.

Ponta a ponta: questionário completo até a visita; mapa na posição simulada, navegação, pino e favorito pedindo login; permissão negada com fallback; área vazia criando alerta.
