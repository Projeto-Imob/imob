// Arquivos de infraestrutura da fatia 0.4: regras do servidor compartilhado (ARQUITETURA, seção 7)
// e a validação do pedido no deploy.sh, que é a fronteira da chave do GitHub Actions.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const RAIZ = path.resolve(__dirname, "../..");
const ler = (arquivo: string) => fs.readFileSync(path.join(RAIZ, arquivo), "utf8");

const STACK = ler("infra/imob-stack.yml");
const SCRIPTS = ["infra/deploy.sh", "infra/backup.sh", "infra/restaurar-teste.sh"];
const PUBLICOS = [
  "infra/imob-stack.yml",
  ...SCRIPTS,
  "infra/systemd/imob-backup@.service",
  "infra/systemd/imob-backup@.timer",
  ".github/workflows/deploy.yml",
  ".github/workflows/ci.yml",
  "Dockerfile",
];

const SERVICOS = STACK.slice(STACK.indexOf("\nservices:"), STACK.indexOf("\nnetworks:"));
function bloco(servico: string): string {
  const inicio = SERVICOS.indexOf(`\n  ${servico}:`);
  const proximo = SERVICOS.slice(inicio + 1).search(/\n {2}[a-z_]+:\s*\n/);
  return proximo === -1 ? SERVICOS.slice(inicio) : SERVICOS.slice(inicio, inicio + 1 + proximo);
}

describe("stack do Swarm", () => {
  it("tem só app, worker e db", () => {
    expect([...SERVICOS.matchAll(/^ {2}([a-z_]+):\s*$/gm)].map((m) => m[1])).toEqual(["app", "worker", "db"]);
  });

  it("toda imagem tem versão fixa: o commit ou uma versão exata do Postgres, nunca latest", () => {
    const imagens = [...STACK.matchAll(/^\s+image:\s*(.+?)\s*$/gm)].map((m) => m[1]);
    expect(imagens).toHaveLength(3);
    for (const imagem of imagens) expect(imagem).toMatch(/:(\$\{IMOB_VERSAO[^}]*\}|\d+\.\d+)$/);
  });

  it("todo serviço tem reserva e limite de memória", () => {
    for (const servico of ["app", "worker", "db"]) {
      expect(bloco(servico)).toMatch(/reservations:\s*\n\s+memory: \d+M/);
      expect(bloco(servico)).toMatch(/limits:\s*\n\s+memory: \d+M/);
    }
  });

  it("o worker fica desligado até a primeira tarefa agendada (regra 20)", () => {
    expect(bloco("worker")).toMatch(/replicas: 0\b/);
  });

  it("o banco nunca roda dois Postgres no mesmo volume e não publica porta", () => {
    expect(bloco("db")).toMatch(/order: stop-first/);
    expect(STACK).not.toMatch(/^\s+ports:/m);
  });

  it("só o app entra na rede do Traefik, que vem do servidor", () => {
    expect(bloco("app")).toMatch(/networks: \[interno, traefik\]/);
    expect(bloco("worker")).toMatch(/networks: \[interno\]/);
    expect(bloco("db")).toMatch(/networks: \[interno\]/);
    expect(STACK).toMatch(/traefik:\s*\n\s+external: true\s*\n\s+name: \$\{TRAEFIK_REDE\}/);
  });
});

describe("arquivos públicos de infraestrutura", () => {
  it("não trazem endereço IP do servidor (o repositório é público)", () => {
    // Só valem o loopback e o 0.0.0.0 (ouvir em todas as interfaces dentro do contêiner).
    const permitido = (ip: string) => ip.startsWith("127.") || ip === "0.0.0.0";
    for (const arquivo of PUBLICOS) {
      const ips = [...ler(arquivo).matchAll(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g)].map((m) => m[0]);
      expect(ips.filter((ip) => !permitido(ip)), arquivo).toEqual([]);
    }
  });

  it("os scripts param no primeiro erro e nunca usam --prune nem docker restart", () => {
    for (const arquivo of SCRIPTS) {
      const texto = ler(arquivo);
      expect(texto, arquivo).toMatch(/^set -euo pipefail$/m);
      expect(texto, arquivo).not.toMatch(/--prune|--remove-orphans|docker restart/);
    }
  });
});

// O bash existe no CI (Linux) e no Git Bash do Windows; sem ele, estes testes não rodam.
const temBash = spawnSync("bash", ["-c", "echo ok"], { encoding: "utf8" }).stdout?.trim() === "ok";

describe.skipIf(!temBash)("deploy.sh: pedido pela chave do Actions", () => {
  const COMMIT = "0123456789abcdef0123456789abcdef01234567";

  function pedir(pedido: string) {
    const r = spawnSync("bash", ["infra/deploy.sh"], {
      cwd: RAIZ,
      encoding: "utf8",
      env: { ...process.env, SSH_ORIGINAL_COMMAND: pedido },
    });
    return { codigo: r.status, erro: r.stderr };
  }

  it("os scripts não têm erro de sintaxe", () => {
    for (const arquivo of SCRIPTS) {
      expect(spawnSync("bash", ["-n", arquivo], { cwd: RAIZ, encoding: "utf8" }).status, arquivo).toBe(0);
    }
  });

  it.each([
    ["vazio", ""],
    ["outro comando", "rm -rf /"],
    ["comando a mais", `deploy hml ${COMMIT}; rm -rf /`],
    ["argumento a mais", `deploy hml ${COMMIT} extra`],
    ["substituição de comando", "$(touch /tmp/imob-invasao) hml x"],
  ])("recusa pedido %s", (_caso, pedido) => {
    const r = pedir(pedido);
    expect(r.codigo).toBe(1);
    expect(r.erro).toContain("pedido recusado");
  });

  it("recusa preparar por SSH: só no terminal do servidor", () => {
    expect(pedir(`preparar hml ${COMMIT}`).erro).toContain("preparar só roda no terminal");
  });

  it("recusa ambiente fora da lista e commit que não seja o SHA completo", () => {
    expect(pedir(`deploy prd ${COMMIT}`).erro).toContain("ambiente desconhecido");
    expect(pedir("deploy hml abc123").erro).toContain("commit inválido");
    expect(pedir(`deploy hml ${COMMIT.toUpperCase()}`).erro).toContain("commit inválido");
  });

  it("aceita deploy hml <commit> e segue para o servidor (aqui, sem a pasta do ambiente)", () => {
    const r = pedir(`deploy hml ${COMMIT}`);
    expect(r.codigo).toBe(1);
    expect(r.erro).toContain("faltou /opt/imob/hml/deploy.env");
  });
});
