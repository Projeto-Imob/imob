# Diário

Uma entrada por sessão, a mais recente no topo. Para continuar de onde parou, comece com `/forja:retomar`.

## 2026-11-17 15:16

**Feito:**
- **Fatia 0.4, parte do repositório, na PR #9** (branch `fatia/0.4-homologacao`). São quatro commits: saúde, banco, infraestrutura e docs. A PR também levou os commits de docs de 16 e 17/11, que não estavam na `main`.
  - **Infraestrutura:**
    - `Dockerfile` (alvos `app` e `migracao`) e `.dockerignore` como lista permitida;
    - `infra/imob-stack.yml`;
    - `infra/deploy.sh`, `infra/backup.sh`, `infra/restaurar-teste.sh` e o timer em `infra/systemd/`;
    - workflow `Deploy`.
  - **Saúde:** `/api/saude` e `scripts/conferir-papel.ts`. O app só sobe, e só fica saudável, como `app_user`.
  - **Banco:** limites de tempo nos papéis (Proposta), e `migrate` e `seed` sem o superusuário.
  - **CI:** job `imagem` nas PRs, que monta as imagens e confere bootstrap, migrations, seed, a recusa do papel errado, a saúde e a página.
- **Verde localmente:** `check:secrets`, `lint`, `typecheck`, `catalogo`, unidade (359) e banco (63).
- **Build standalone visto funcionando:** saúde 200 com o `app_user` e 503 com o `migrator`, a página responde 200, e o app recusa subir com o `migrator`.
- **Docs:** ARQUITETURA (seções 3, 8, 9 e 10) e PLANO atualizados.

**Em andamento:**
- **PR #9:** o CI estava rodando no fim da sessão. O job `imagem` é o primeiro build real do `Dockerfile`, porque a máquina não tem Docker. Se falhar, corrija antes do merge.
- **Parte do servidor da 0.4:** nada feito ainda. A lista está em "Próximo passo".

**Decisões:** tomadas na implementação, sem mudar o plano, e registradas no PLANO (Decisões, 17/11):
- o arquivo da stack de cada versão vai dentro da imagem de migração, então o servidor não guarda cópia do repositório;
- `deploy.sh preparar` faz a primeira subida e o bootstrap, e só roda no terminal do servidor;
- o seed fictício roda a cada deploy de homologação. Ele não duplica nada e nunca roda em produção;
- os limites de tempo por papel são **Proposta**: 15 s e 30 s no app e no auth, 60 s e 60 s no worker.

**Próximo passo:**
1. Conversa nova com `/forja:retomar`. Confira o CI da PR #9 com `gh pr checks 9`.
2. Janela com o Matheus para preparar o servidor, cada passo com OK:
   - usuário `deploy` no grupo docker, com a chave do Actions presa ao `deploy.sh` (`command=` e `restrict` no `authorized_keys`);
   - `age` e `rclone` instalados;
   - `/opt/imob/infra/` com os scripts, dono root;
   - `/opt/imob/hml/` com `deploy.env`, `app.env`, `db.env`, `migrator.env` e `bootstrap.env`. As senhas o Matheus preenche;
   - `/opt/imob/backup/` com `destinatario.age` e `rclone.conf`;
   - timer `imob-backup@hml`;
   - regra de 30 dias no bucket `imob-backups`.
3. Matheus:
   - par de chaves do `age`, gerado na máquina dele;
   - ambiente `homologacao` no GitHub, com os secrets `DEPLOY_HOST`, `DEPLOY_KNOWN_HOSTS` e `DEPLOY_SSH_KEY` e a variável `IMOB_DOMINIO`;
   - variável `NEXT_PUBLIC_SENTRY_DSN` no repositório;
   - monitor de disponibilidade;
   - merge da PR #9.
4. Depois do merge:
   - rode `deploy.sh preparar hml <commit>` no servidor e dê "Re-run" no Deploy;
   - ensaie o rollback (Run workflow com o commit anterior) e a restauração (`restaurar-teste.sh`, com a chave pela entrada padrão);
   - meça memória e swap;
   - confira as stacks vizinhas.

**Atenção:**
- **Primeiro deploy:** depois do merge, ele falha de propósito até o `preparar`.
- **Avisos do VS Code no `deploy.yml`:** o ambiente `homologacao`, os secrets e as variáveis aparecem como inválidos. É esperado até o Matheus criá-los no GitHub.
- **Pacote do GHCR:** pode nascer privado na primeira publicação. O servidor baixa sem token, então ele precisa ficar público.
- **`rclone.conf` do R2:** use `provider = Cloudflare` e `no_check_bucket = true`, porque o token só tem acesso aos objetos.
- **Mudança na stack:** só vale no deploy de um commit novo, porque o arquivo vai dentro da imagem.
- **Onde está este diário:** num commit local da `fatia/0.4-homologacao`, sem push, para não reiniciar o CI da PR #9. Ele sobe no próximo push.
- **Auditoria:** a branch local `docs/auditoria-2026-11-16` continua sem PR (pendência antiga).

## 2026-11-17 11:33

**Feito:**
- **Endurecimento do servidor concluído (passos 0 a 8)**, com o Matheus presente e snapshot antes. O detalhe fica fora do repositório.
  - Depois do reinício, alguns serviços de outras stacks não voltaram sozinhos e foram religados sem mudar a configuração.
  - Os sites ficaram como antes.
- **Sentry:** projeto `imob` criado, DSN no cofre do Matheus, evento de teste recebido.
- **Plano da 0.4 aprovado** e registrado na própria 0.4 do PLANO.
- **Decisões de 17/11 no PLANO:**
  - homologação num subdomínio da I.Ara;
  - MVP de 01/12 com a interface completa e cadeado no que fica para depois (fatia nova 1.3b);
  - pré-lançamento continua oculto;
  - login simples para a incorporadora.

**Em andamento:**
- **Fatia 0.4:** o plano está aprovado, e falta implementar. Começa pelo código, que não depende do servidor nem do DNS. A primeira etapa é o `next.config` com `IMOB_STANDALONE`.

**Decisões:** as de 17/11 estão na seção Decisões do PLANO. As da 0.4 estão na própria 0.4.

**Próximo passo:**
- Abrir uma conversa nova, rodar `/forja:retomar` e implementar a 0.4 conforme o plano, com testes primeiro, até a parte que não precisa do servidor.
- Até 20/11: protótipo visual com a navegação completa do comprador e da incorporadora, incluindo os itens com cadeado. Ele serve para aprovar a lista de funcionalidades da 1.3b.
- O registro DNS do subdomínio de homologação já existe, criado e conferido às 11:50. O primeiro deploy só depende do código da 0.4 e de uma janela para preparar o servidor, em que o Matheus preenche os arquivos de senha.

**Atenção:**
- **Escopo:** o MVP de 01/12 cresceu com a 1.3b (login, área da incorporadora e cadeados). Acompanhar o prazo fatia a fatia.
- **Senhas:** nunca digitar senha no prompt do servidor. O login é pela chave e não pede nada.

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
- **Endurecimento:** o Matheus saiu às 21:30 e autorizou só o passo 0, a foto do estado, que só lê.
  - O passo 0 rodou às 22:00 sem erro: a foto ficou salva no servidor, e todos os serviços estavam com as réplicas completas.
  - A checagem de saúde não achou endereço público para um dos conjuntos de serviços. Antes do próximo passo, confira se ele tem um, para que a checagem também o cubra.
  - Os demais passos esperam uma janela com o Matheus presente.
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
