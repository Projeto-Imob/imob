# Marca e design

> **Origem:** SPEC 1.0, §12 Marca e design — texto da 1.0 preservado abaixo, só convertido para Markdown.
> **Fase na SPEC 2.0:** todas as fases.

### Esclarecimentos e mudanças da 2.0

Aprovados pelo Matheus em 13/11/2026 (decisões em `docs/PLANO.md`).

- Componentes de interface sobre shadcn/ui (Radix), com estes tokens: acessibilidade de diálogos, menus, abas e painéis sem reinventar.
- A regra do lima e o contraste AA continuam garantidos por teste automático (`tests/unit/tokens.test.ts`).

---

## Marca e design

| Item | Valor |
| --- | --- |
| Lima (principal) | #DBDF4A |
| Preto | #0C0C0C |
| Grafite | #262626 |
| Off-white (fundo) | #F4F4F0 |
| Texto secundário / discreto | #45453F / #5D5D55 |
| Borda de controle | #85857B |
| Secundário sobre preto | #A8A89E |
| Status (sucesso / atenção) / erro | #15803D / #B45309 / #B91C1C |
| Fontes | Inter Tight em títulos e números de destaque; Inter na interface |
| Títulos de marca | Caixa alta, Bold 800, tracking −3% |
| Etiqueta | Peso 600, caixa alta, tracking 0,14em |
| Destaque de título | Bloco lima com texto preto; sobre preto, texto lima |
| Fechamento do início | "MIRAR NO AGORA PRA CHEGAR LONGE." |

Do brandbook valem só cores e logotipo, ambos provisórios. Não use o tom, os textos nem o posicionamento do brandbook.

O lima tem 1,30:1 sobre o off-white: nas áreas claras, nunca é texto, ícone, linha ou marca de gráfico. Use-o só como preenchimento atrás de texto preto.

Gráficos: rampa ordinal de #949800 a #242500 (≥ 3:1 sobre branco); paleta categórica #7A7F00, #2A78D6, #EB6834, #6250D6.

Tokens no CSS global; logotipo e nome num único arquivo de configuração.
