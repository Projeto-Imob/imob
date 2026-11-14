# Análise do projeto para a SPEC 2.0

**Data:** 13/11/2026.
**Escopo:** especificação 1.0, plano (change OpenSpec), processo e repositório, código e servidor.
**Como foi feita:**
- usando as skills do forja: `metodo-forja` (SPEC, PLANO e fatias verticais), `stack-moderna` (escolhas padrão) e `mentor` (servidor, Postgres, front e IA em produção);
- com a auditoria de código de hoje (`docs/AUDITORIA.md`);
- com um inventário do servidor feito só com leitura.

## Resumo

1. **A especificação 1.0 tem conteúdo de produto muito bom em um formato difícil de manter.** São 57,7 KB de texto puro carregados em toda sessão, misturando produto, cálculo, arquitetura, processo e pendências. A 2.0 preserva todo o texto, mas o reorganiza por assunto e por ritmo de mudança.
2. **O "MVP" é a plataforma inteira** (cerca de 25 capacidades), sem cliente nem praça definidos (P5). A 2.0 define um piloto com uma incorporadora e 12 funcionalidades.
3. **O plano é horizontal.** Banco real e login só chegam depois de todas as telas, e a integração fica para o fim. A 2.0 usa fatias verticais desde a Fase 0, com banco, login e deploy reais.
4. **Há dois modos de dados (LocalStorage e Postgres)**, o que dobra o trabalho, e há código "só para teste". A 2.0 usa um caminho de dados só: Postgres em todo ambiente.
5. **O processo tem cinco sistemas sobrepostos** (AIOX, GSD, OpenSpec, speckit e forja). A 2.0 adota um fluxo: o método forja.
6. **O servidor atual precisa de endurecimento** e tem pouca memória livre. Por decisão do Matheus (D11), o Imob usa esse servidor como stack isolada, e o endurecimento virou pré-requisito do primeiro deploy.

## 1. Especificação 1.0

| Problema | Evidência | Na 2.0 |
|---|---|---|
| Monólito no contexto de toda sessão | `CLAUDE.md` com 57,7 KB e 514 linhas. Somado a `.claude/CLAUDE.md` (12,7 KB), 10 regras do AIOX (33,5 KB) e instruções globais, passa de 100 KB (cerca de 25 a 30 mil tokens) antes do trabalho começar | `CLAUDE.md` curto com as 20 regras e o modo de trabalhar; o resto é lido sob demanda em `docs/` |
| Formato pouco navegável | Texto puro, com 164 linhas de tabela separadas por tabulação e só 3 títulos Markdown | Markdown real, um arquivo por área em `docs/specs/` (convertido por script, texto preservado) |
| Cinco tipos de conteúdo misturados | Produto, regras de cálculo, arquitetura, processo e pendências no mesmo arquivo, cada um mudando num ritmo | SPEC (escopo), specs (regras), ARQUITETURA (técnica), PLANO (fatias, decisões, pendências) |
| Sem corte de v1 | "MVP" com comprador, cadastro, CRM da incorporadora, mini CRM da house, god mode, impersonate, Vitrine Destacada, Mais Buscados, mídia, negociação e simulador; P5 em aberto | Piloto (F1 a F12) e fases 2 e 3 explícitas |
| A mesma regra escrita em vários lugares | `CLAUDE.md`, 26 specs do OpenSpec, `design.md`, `tasks.md` e stories. Mover `web/` para a raiz exigiu corrigir 5 documentos | Uma fonte por assunto e uma regra de precedência |
| Partes desatualizadas ou incompletas | "MinIO" como opção (as imagens oficiais saíram do Docker Hub em 2025); PostGIS sem confirmação no PGlite (C11); OpenFreeMap sem o OK que a regra 18 exige; nada sobre observabilidade, e-mail real para recuperação de senha ou teto de custo da IA | D8, D5, D10, D9 e D16 |
| Lacunas de regra achadas ao implementar | Pré-lançamento com uma torre lançada e outra futura; "studio" contando sala comercial; estados "perfil" × "ativo"; arredondamento da nota; pontos da localização; comportamento sem histórico; motivo que afirma o que a pessoa não fez; ampliar com "Perto de mim" | Esclarecimentos no topo de cada `docs/specs/*.md` (D15) |

O que se mantém sem discussão: as 20 regras inegociáveis, a matriz de visibilidade, o modelo de segurança (RLS, `exigirContexto()`, papéis de banco, auditoria), as regras de cálculo, os textos de referência, a marca e a decisão do Matheus de não usar o Supabase.

## 2. Plano (change OpenSpec `planejar-mvp-imob`)

- **120 tarefas em 12 grupos numa única change.** Uma change do OpenSpec funciona melhor pequena e focada.
- **Fases horizontais.** A ordem é domínio → todas as telas do comprador em modo local → banco → login → incorporadora → house → plataforma → negociação → IA → infraestrutura → integração (12.1). Consequências:
  - o primeiro fluxo com banco real e login só existe no grupo 5;
  - um lead só chega à house no grupo 7;
  - os problemas de integração aparecem no fim, quando custam mais.

  O método forja diz o contrário: "nunca primeiro todo o backend, depois todo o front".
- **Dois modos de dados.** Cada repositório existiria duas vezes (LocalStorage e Postgres), com uma suíte de contrato para mantê-los iguais. Os eventos gravados no navegador nunca chegariam aos números da incorporadora.
- **Código diferente no teste e na produção.** A variante latitude e longitude "só para testes locais" e o PostGIS no CI testam funções diferentes.

Na 2.0: Fase 0 com banco, login e deploy reais; fatias verticais pequenas; um caminho de dados; o mesmo Postgres no desenvolvimento, nos testes e na produção.

## 3. Processo e repositório

| Achado | Evidência | Na 2.0 |
|---|---|---|
| Cinco sistemas de processo sobrepostos | AIOX (agentes, constituição, stories, 10 regras), GSD (12 agentes, comandos, hooks), OpenSpec (change e skills) e, globalmente, speckit, superpowers e forja. Cada um com sua ideia de spec, plano e tarefa | Método forja como fluxo único (D1) |
| Hooks em toda chamada de ferramenta | `.claude/settings.json`: `gsd-check-update` em toda sessão e `gsd-context-monitor` depois de toda ferramenta, numa máquina de 2 núcleos | Desligados com o GSD (D14) |
| Framework pesado dentro do produto | `.aiox-core` com 52 MB entraria no primeiro commit | Fora do versionamento (D14) |
| Sem rede de segurança de versão | Nenhum commit e nenhum remoto até hoje | Fatia 0.1: GitHub, `main` protegida, CI |

## 4. Código

Resumo de `docs/AUDITORIA.md`:

| Arquitetura | Qualidade | Segurança | Testes | DX |
|:-:|:-:|:-:|:-:|:-:|
| 8,0 | 6,5 | 7,5 | 7,0 | 6,5 |

**O que a 2.0 aproveita integralmente:**
- as regras puras da busca (elegibilidade, filtros, exigência, contagem, nota, escolha, motivo e requisitos), com 282 testes;
- os tipos Zod e o seed fictício;
- marca, tokens e teste de contraste;
- catálogo de textos, flags e `scoring.config.ts`;
- CI, `check:secrets` e o teste de termos proibidos;
- o layout.

**O que sai:** os adaptadores LocalStorage e IndexedDB dos repositórios e a suíte de contrato entre os dois modos. O que esses arquivos protegiam passa a ser coberto por testes de banco contra o Postgres real.

**O que vira trabalho da Fase 0** (fatia 0.5):
- pré-lançamento por subcondomínio;
- motivo fiel;
- studio e finalidade;
- nota em inteiros;
- cabeçalhos de segurança;
- `check:secrets` ampliado;
- estabilidade da suíte.

## 5. Servidor

O diagnóstico detalhado fica fora do repositório, por segurança, na pasta protegida de credenciais do Matheus. Em resumo:

- **É compartilhado** com outros projetos e clientes.
- **Está sem folga:** cerca de 800 MB de RAM livres.
- **Precisa de endurecimento** de rede, acesso e backup antes de receber dados pessoais.
- **Está longe:** fica na Alemanha, a cerca de 200 ms do Brasil.

**Decisão do Matheus (D11):** o Imob usa este servidor como stack isolada, com:
- prefixo `imob_`;
- rede e Postgres 17 próprios;
- HTTPS pelo Traefik existente;
- limites de memória.

Os itens P0 viraram pré-requisitos da fatia 0.4. Os demais esperam o OK dele.

## 6. O que a 2.0 entrega

| Objetivo | Como |
|---|---|
| **Escalável** | Monólito modular sem estado no app; RLS e índices desde o primeiro dia; caminho de escala por etapas com gatilho medido (plano maior → servidor próprio → banco separado → mais instâncias → CDN); praça nova sem mudança de schema |
| **Fácil de manter** | Um caminho de dados; uma fonte por assunto; módulos por domínio com fronteira verificada por lint; `CLAUDE.md` curto; decisões datadas; tecnologia popular com versões fixadas; imagens por commit e migrations só aditivas |
| **Ágil** | Piloto com 12 funcionalidades; fatias verticais de uma sessão e um PR; homologação a cada merge; pendências atrás de flag em vez de bloquear; um fluxo de trabalho (forja) |

Decisões aprovadas pelo Matheus em 13/11/2026, com a D11 ajustada. A próxima fatia é a 0.1.
