# Diário

Uma entrada por sessão, a mais recente no topo. Para continuar de onde parou, comece com `/forja:retomar`.

## 2026-11-16 21:30

**Feito:**
- Main com as PRs:
  - #3, fatia 0.2: banco, RLS e a política `contas_leitura` corrigida;
  - #4: Sentry no app, parte da 0.4;
  - #5: cor principal laranja #FF8C00;
  - #7, fatia 0.3: módulos, `app.na_vitrine` e a página `/empreendimento/[slug]` lendo do banco.

  CI verde em todas.
- Documentação: as 14 correções (CLAUDE.md, SPEC, PLANO, ARQUITETURA e specs).
- Infraestrutura:
  - R2 (buckets de homologação e de backups) e MCP da Cloudflare prontos;
  - acesso ao servidor por chave SSH testado.
- Plano de endurecimento do servidor aprovado, com volta para cada passo. Fica fora do repositório, na pasta protegida de credenciais.
- Auditoria nova (`docs/AUDITORIA.md`) num commit local da branch `docs/auditoria-2026-11-16`, ainda sem PR.
- Capturas da página da 0.3 em `capturas/fatia-0.3/`, fora do git.

**Em andamento:**
- **Endurecimento:** o Matheus saiu às 21:30 e autorizou só o passo 0, a foto do estado, que só lê. Ele está agendado para as 22:00, com segunda tentativa às 00:55 se a cota do plano acabar. Os demais passos esperam uma janela com ele presente.
- **Fatia 0.4 (homologação):** o Sentry já está na main. Falta o deploy, que depende de três coisas:
  - o endurecimento;
  - o subdomínio de homologação;
  - o DSN do projeto `imob` no Sentry.

  O agente que planejava o deploy parou no limite de cota, e o plano precisa ser refeito.
- **Teste de envio do Sentry:** espera o Matheus criar o projeto `imob`, gravar o DSN no cofre local e ligar "Prevent Storing of IP Addresses".

**Decisões:**
- **Prazos:** MVP em homologação até 01/12/2026, com a Fase 0 e as fatias 1.1 a 1.3. Produção com tráfego pago na segunda quinzena de dezembro.
- **Fatias em paralelo.** O que não aparece na demonstração fica para depois de 01/12: gitleaks, estabilidade da suíte e actions por SHA.
- **Também decididos:** piloto enxuto em dezembro, CSP sem nonce, cor laranja e protótipo visual até 20/11. Detalhes na seção Decisões do PLANO.
- **PR #6 do Dependabot não entra:** mistura versões maiores (TypeScript 7, ESLint 10 e `@types/node` 26) e quebrou o CI. O ajuste da configuração já está na 0.5.
- **Sessões curtas por causa da cota:** uma conversa por fatia, começando com `/forja:retomar`. Agentes de implementação no Sonnet, sem fork.

**Próximo passo:**
- Abrir uma nova conversa com `/forja:retomar` e conferir o resultado do passo 0.
- Fatia 0.4: refazer o plano do deploy em homologação e marcar com o Matheus a janela dos passos seguintes do endurecimento.
- Em paralelo, até 20/11: protótipo visual das telas da demonstração (início, questionário, resultado e página do empreendimento), com os benchmarks Reelly.io e QuintoAndar e o laranja.
- Pendências do Matheus:
  - subdomínio de homologação e onde fica o DNS;
  - projeto `imob` no Sentry;
  - C15 (advogado);
  - dados da incorporadora;
  - upgrade para o Max 5x;
  - OK para a PR da auditoria;
  - `gh auth refresh -h github.com -s delete_repo`, para apagar o `Projeto-Imob/imob-rascunho`.

**Atenção:**
- **Onde está este diário:** na branch local `docs/diario-2026-11-16`, sem PR. A próxima fatia sai dela, ou ela vira uma PR curta.
- **Pasta de trabalho por fatia:** crie à mão (armadilha nova no CLAUDE.md). O banco local é um só para todas as pastas.
- **CI depois de atualizar a branch:** atualizar a branch de uma PR no GitHub roda o CI de novo, e o merge só libera com os 4 checks verdes. Nunca use o bypass.
- **Arquivo órfão:** `db/seed/seed.gerado.json`, gerado pelo seed da 1.0, ficou na pasta. Ele não é rastreado e pode ser apagado.
- **Aviso no `npm install`:** aparece `allow-scripts`, de scripts de instalação pendentes de aprovação. Até agora não quebrou nada.
