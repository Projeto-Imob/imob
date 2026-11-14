# Auditoria do repositório Imob

**Data:** 13/11/2026 · **Escopo:** todo o código do app em `C:\dev\imob` (grupos 1 e 2 da change `planejar-mvp-imob`, 27 de 120 tarefas). O framework AIOX (`.aiox-core/`, `.claude/`, `.agents/`, `squads/`) ficou fora. **Nenhum código foi alterado nesta auditoria.**

**Como foi feita:** quatro análises em paralelo — mapa e stack, segurança, revisão dos trechos mais arriscados e cobertura de testes —, consolidadas e conferidas no código. Afirmações das análises que não se confirmaram foram corrigidas ou descartadas (ver "Notas de conferência" no fim).

---

## 1. Notas

| Dimensão | Nota | Em uma frase |
|---|:---:|---|
| Arquitetura | **8,0** | Domínio puro, portas e adaptadores com teste de contrato, configuração isolada; ainda não exercitada pela interface nem pelo Postgres. |
| Qualidade | **6,5** | Código limpo e determinístico, mas com um furo em regra inegociável (pré-lançamento parcial) e textos de motivo que afirmam o que a pessoa não fez. |
| Segurança | **7,5** | Nada crítico; faltam cabeçalhos HTTP e CSP, a limpeza de eventos é por lista negra e o `check:secrets` tem lacunas. Banco e login ainda não existem. |
| Testes | **7,0** | 282 testes cobrindo as regras centrais, com relógio injetado e contrato reutilizável; a suíte oscila na máquina local (timeout) e faltam os e2e da jornada. |
| DX (rodar e mexer) | **6,5** | Scripts claros e CI enxuto; depende de Node 24, de um contorno para o Vitest no Windows e a raiz divide espaço com o framework AIOX. |

---

## 2. Top 10 problemas (do mais grave ao menos)

### 1. Pré-lançamento parcial vaza para a busca — regra inegociável 11 · ALTA
`src/dominio/elegibilidade.ts:39` e `src/dominio/filtros.ts:41`
O empreendimento só é tratado como pré-lançamento quando **todos** os subcondomínios têm lançamento futuro, e `unidadesCompativeis` não olha a data de lançamento do subcondomínio da unidade.
**Falha:** torre A lançada em 2025 e torre B com lançamento em 2030 → as unidades da torre B entram no contador, no resultado e na nota. Subcondomínio com `dataLancamento` nula também conta como lançado.
**Correção:** descartar a unidade cujo subcondomínio tenha lançamento futuro ou nulo enquanto `preLancamentoAtivo` for falso; teste com empreendimento de duas torres.

### 2. LocalStorage pode apagar os dados do comprador · ALTA
`src/data/armazenamento-local.ts:91` e `:96`, `src/data/local.ts:34`
Com JSON ilegível ou versão maior que a atual (por exemplo, depois de voltar um deploy), `carregar` devolve vazio e a próxima gravação sobrescreve tudo, sem cópia. A migração v0 → v1 (`:65`) aproveita só quatro chaves e descarta as outras sem registrar — contraria "a migração registra o que removeu". Duas abas abertas fazem ler-alterar-gravar no mesmo blob e uma desfaz a outra.
**Correção:** guardar cópia (`imob:dados:backup-<data>`) antes de qualquer descarte, registrar as chaves de topo descartadas, reler antes de gravar e ouvir o evento `storage`.

### 3. Regra de lint de acesso a dados é contornável · ALTA
`eslint.config.mjs:49`
Confirmado: `Reflect.get(globalThis, "localStorage")`, `const w = window; w.localStorage` e `import { armazenamentoDoNavegador } from "@/data/armazenamento-local"` passam sem erro num componente. A garantia do design D3 fica só no papel.
**Correção:** permitir fora de `src/data` só a fábrica de repositórios (bloquear import de `@/data/armazenamento-local`, `@/data/local`, `@/data/imagens-plataforma-idb`) e acrescentar `no-restricted-syntax` para `Reflect.get` e `document.cookie`.

### 4. Eventos limpam IP e posição por lista negra · MÉDIA (LGPD, regra 9)
`src/data/eventos.ts:9`
Só nomes exatos de chave são removidos. `centroLat`, `lat_lng: "-30.03,-51.21"`, `clientIp` ou `centro: ["-30.03","-51.21"]` passam e ficam gravados. Não há limite de quantidade de chaves nem de tamanho dos valores.
**Correção:** lista **permitida** de chaves por tipo de evento (schema Zod por `tipo`), recusa de strings com cara de coordenada ou IP, limite de chaves e de tamanho.

### 5. Sem cabeçalhos de segurança nem CSP · MÉDIA
`next.config.ts:3`
Não há CSP, `X-Content-Type-Options`, `frame-ancestors`, `Referrer-Policy`, `Permissions-Policy` nem HSTS. O app pode ser embutido em iframe e um XSS futuro alcançaria LocalStorage e IndexedDB. A especificação já pede `frame-src` restrito ao YouTube sem cookies.
**Correção:** `headers()` no `next.config.ts` (ou no `proxy.ts`) com CSP por nonce, `nosniff`, `frame-ancestors 'none'`, `Permissions-Policy: geolocation=(self)` e HSTS.

### 6. O motivo afirma o que a pessoa não fez · MÉDIA (regra 4)
`src/dominio/motivo.ts:30`, `:36` e `:51`
Quem informou só a parcela recebe "A entrada de R$ X cabe no que você informou"; bairro acrescentado pela ampliação ou por "Perto de mim" recebe "na região que você escolheu"; quem só abriu a página recebe "já viu e favoritou".
**Correção:** escolher o modelo pelo detalhe do componente (entrada informada, origem da região, favorito > 0) e testar cada variação.

### 7. Sala comercial, lote ou tipologia de aluguel entram na busca de compra · MÉDIA
`src/dominio/filtros.ts:31`
`dormitorios === 0` é tratado como studio e a finalidade não é verificada: "Sala comercial" e "Lote" contam como "Studio"; tipologia só de aluguel (fluxo fora do MVP) entra no contador.
**Correção:** studio só para tipo residencial `Studio`/`Kitnet`/`Loft` (a confirmar com Matheus), e excluir `finalidade: "aluguel"`.

### 8. `check:secrets` deixa passar chaves comuns · MÉDIA
`scripts/check-secrets.ts:15` e `:51`
Não pega chave do Google (`AIza…`), Stripe (`sk_live_`), JWT (`eyJ…`), Slack (`xox…`), URLs `mysql://`/`redis://` com senha, YAML sem aspas nem segredos com menos de 8 caracteres. As pastas do framework (`.claude/`, `.agents/`) são versionáveis e ficam fora da varredura.
**Correção:** acrescentar esses padrões, varrer as pastas do framework só com os padrões de alta confiança e somar o gitleaks no CI.

### 9. Suíte de testes instável na máquina local · MÉDIA
`tests/unit/lint-acesso-dados.test.ts:28`
O teste sobe o ESLint completo e estourou o limite de 30 s com a máquina carregada (8 GB, 2 núcleos); outro arquivo falhou ao iniciar o worker do Vitest. Na execução isolada passa — mas a suíte não está confiavelmente verde.
**Correção:** limite maior só para esse arquivo, uma única instância de ESLint reaproveitada e `pool`/`maxWorkers` ajustados para a máquina local.

### 10. Arredondamento da nota em ponto flutuante · BAIXA
`src/dominio/nota.ts:150`
Combinação real dá 57,5 exato, o código calcula `57.49999999999999` e a nota sai 57. Mexe na ordem, na janela de 15 pontos e, no limite, no corte de 50 (que é aplicado à nota já arredondada).
**Correção:** somar em inteiros (pesos × 100) ou `Math.round(x + 1e-9)`; decidir com Matheus se o corte de 50 vale para a nota arredondada.

**Também observados (menores):**
- `src/dominio/mapa.ts:56` — o limite de 5 s corre enquanto a pessoa decide no pedido de permissão; quem demora 6 s para tocar em "Permitir" cai em Porto Alegre.
- `src/server/storage/disco.ts:26` — a chave `…/logo.png.meta.json` sobrescreve o meta de `logo.png` e a leitura passa a lançar erro; nomes reservados do Windows (`CON`, `NUL`) e ponto no fim passam; não há `realpath` contra symlink.
- `src/data/arquivos.ts:58` — imagens gravadas sem remover EXIF (GPS) nem limitar dimensões.
- `.github/workflows/ci.yml:28` — actions fixadas por tag (`@v7`), não por SHA.
- `src/dominio/contagem.ts:110` — "incluir bairros vizinhos" não tem efeito quando a região é só "Perto de mim".
- `src/i18n/pt-BR.ts:59` — `nome in vars` consulta o protótipo (`{constructor}`); usar `Object.hasOwn`.
- `npm audit`: 0 vulnerabilidades de produção; 7 moderadas só de desenvolvimento (`minimatch` via `typescript-eslint`).

---

## 3. Plano de ataque

### Onda 1 — urgente (esta semana)
Itens que tocam regra inegociável, perda de dado ou a garantia de arquitetura. Uma story curta de correção antes do grupo 3.
1. Pré-lançamento por subcondomínio (problema 1), com teste de duas torres.
2. LocalStorage sem perda: cópia antes de descartar, registro das chaves v0, releitura antes de gravar (problema 2).
3. Fechar a regra de lint: só a fábrica de repositórios fora de `src/data` (problema 3), com os casos de contorno no teste.
4. Eventos com lista permitida por tipo (problema 4).
5. Estabilizar a suíte local (problema 9).

### Onda 2 — importante (este mês, junto com os grupos 3 e 4)
6. Cabeçalhos de segurança e CSP (problema 5), já com `frame-src` do YouTube atrás da flag.
7. Motivo fiel ao que a pessoa fez (problema 6) e studio/finalidade (problema 7) — levar a Matheus a definição de studio.
8. `check:secrets` com os padrões que faltam e gitleaks no CI; actions por SHA (problema 8).
9. Arredondamento da nota em inteiros e decisão sobre o corte de 50 (problema 10).
10. Testes que faltam: e2e da jornada (questionário → resultado → visita; mapa com posição simulada, permissão negada e área vazia) à medida que as telas do grupo 3 surgem; `sorteio` com valor fixo conhecido; `eventos.ts` e `imagens-plataforma-idb.ts` isolados; trocar o teste que lê `layout.tsx` como texto (`tests/unit/brand.test.tsx:30`) por teste de comportamento.

### Onda 3 — melhoria contínua
11. Arquivos: recusar `.meta.json` como chave, nomes reservados do Windows e symlink; remover EXIF e limitar dimensões no adaptador S3 (grupo 6).
12. Geolocalização: limite de 5 s só depois da permissão concedida.
13. Medição de cobertura (`@vitest/coverage-v8`, decisão de Matheus) e meta mínima no CI.
14. DX: documentar no README a exigência de Node 24 e o contorno do Vitest; avaliar mover o framework AIOX para fora da raiz do app ou isolar melhor as exclusões.
15. Atualizar `typescript-eslint` para zerar o `npm audit` de desenvolvimento.

---

## Notas de conferência
- **Testes que já existem** (uma das análises os listou como ausentes): fronteiras da escolha — nota 50, janela exata de 15, nenhuma acima do mínimo, máximo de 3 (`tests/unit/dominio/nota.test.ts:110-140`); imparcialidade a comissão, destaque e incorporadora (`nota.test.ts:85`); motivo ≤ 140 caracteres e sem número fora do cadastro sobre todo o seed (`tests/unit/dominio/motivo.test.ts:35`); `disco.ts` com subida de diretório, tipo e tamanho (`tests/unit/data/arquivos.test.ts:87`); eventos anônimos pela suíte de contrato (`tests/contrato/repositorios.contrato.ts`).
- **Arquivos gerados não são versionados:** `src/i18n/catalogo.gerado.json` e `db/seed/seed.gerado.json` estão no `.gitignore`.
- A falha por timeout ocorreu com quatro análises rodando ao mesmo tempo na máquina; na execução normal a suíte passou (282 testes).
- Não há histórico git ainda (sem commits), então não houve varredura de segredos no histórico.
