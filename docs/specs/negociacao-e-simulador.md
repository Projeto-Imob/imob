# Negociação (Épico 2) e simulador

> **Origem:** SPEC 1.0, §9 Negociação e §10 Simulador — texto da 1.0 preservado abaixo, só convertido para Markdown.
> **Fase na SPEC 2.0:** fase 3, atrás das flags `assinatura_eletronica` e `simulador`. Depende de P7, C10 e da decisão sobre o simulador.

---

## Negociação (Épico 2)

Proposta com unidade, valor, plano de pagamento e validade, aprovada ou recusada pela incorporadora.

Reserva de unidade com prazo, liberada automaticamente ao vencer.

Contrato da incorporadora anexado, com status e data de assinatura. Assinatura eletrônica por provedor externo.

Ao registrar a venda: atualizar espelho, comissão devida e dashboards. A comissão usa o percentual negociado; vendas já registradas mantêm o valor se o percentual mudar.

Registro manual da venda e conferência periódica com a lista de vendas da incorporadora.

## Simulador

Calculadora com os números informados pela própria pessoa: cap rate, GRM, Cash-on-Cash e ganho de capital na venda. Sem vacância, sem índice de mercado, sem aluguel pré-preenchido, fora da IA. Não promete valorização e exibe texto legal validado em toda projeção. Custos de compra sempre como estimativa.
