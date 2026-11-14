// npm run check:secrets — regra 17. Falha se algum arquivo que seria versionado (rastreado, em stage
// ou novo e não ignorado) for um .env* (exceto .env.example) ou contiver padrão de chave ou segredo.
// Uso: node scripts/check-secrets.ts [--raiz <diretório do repositório>]
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type Achado = { arquivo: string; linha?: number; motivo: string };

const PLACEHOLDER = /^(?:<[^>]*>|\[[^\]]*\]|\$\{[^}]*\}|x+|\*+|senha|password|changeme|usuario|user|placeholder|\.\.\.)$/i;
/** Banco local de desenvolvimento ou de CI (contêiner de serviço em localhost) não é segredo. */
const HOST_LOCAL = /^(?:localhost|127\.0\.0\.1)(?::\d+)?(?:\/|$)/i;

const PADROES: ReadonlyArray<{ motivo: string; padrao: RegExp; ehPlaceholder?: (m: RegExpMatchArray) => boolean }> = [
  { motivo: "chave de acesso AWS", padrao: /\bAKIA[0-9A-Z]{16}\b/ },
  { motivo: "chave da Anthropic", padrao: /\bsk-ant-[A-Za-z0-9_-]{20,}/ },
  { motivo: "chave de API (sk-)", padrao: /\bsk-(?:proj-)?[A-Za-z0-9]{32,}/ },
  { motivo: "token do GitHub", padrao: /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{50,})/ },
  { motivo: "chave privada", padrao: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/ },
  {
    motivo: "URL de banco com senha",
    padrao: /\bpostgres(?:ql)?:\/\/[^:\s/@]+:([^@\s]+)@(\S*)/i,
    ehPlaceholder: (m) => PLACEHOLDER.test(m[1] ?? "") || HOST_LOCAL.test(m[2] ?? ""),
  },
  {
    motivo: "segredo com prefixo NEXT_PUBLIC_",
    padrao: /\bNEXT_PUBLIC_[A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|PRIVATE|API_KEY|ACCESS_KEY|DATABASE_URL)[A-Z0-9_]*\b/,
  },
  {
    motivo: "segredo atribuído em texto",
    // Valor entre aspas em código, JSON ou YAML.
    padrao: /(?:secret|token|password|senha|api[_-]?key|access[_-]?key)\w*["']?\s*[:=]\s*["']([A-Za-z0-9+/_\-]{16,})["']/i,
    ehPlaceholder: (m) => PLACEHOLDER.test(m[1] ?? ""),
  },
  {
    motivo: "segredo atribuído em variável de ambiente",
    // Linha NOME=valor, com nome em maiúsculas (arquivos de ambiente, Compose, shell).
    padrao: /^\s*(?:-\s*)?(?:export\s+)?[A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|API_KEY|ACCESS_KEY)[A-Z0-9_]*=["']?([^\s#'"]{8,})/,
    ehPlaceholder: (m) => PLACEHOLDER.test(m[1] ?? ""),
  },
];

const BINARIO = /\.(png|jpe?g|gif|webp|ico|woff2?|ttf|otf|pdf|zip|gz|mp4|mov)$/i;
/** Arquivos que contêm os padrões para poder verificá-los, e lockfiles (hashes de integridade). */
const PERMITIDOS = new Set(["scripts/check-secrets.ts", "package-lock.json"]);
/**
 * Framework de terceiros (AIOX e afins), que não é editado neste projeto e traz exemplos de
 * configuração na documentação. O conteúdo não é varrido; arquivos .env nessas pastas continuam barrados.
 */
const FRAMEWORK = /^(?:\.aiox-core|\.claude|\.agents|\.github\/agents)\//;

export function ehArquivoEnvProibido(arquivo: string): boolean {
  const nome = path.posix.basename(arquivo);
  return nome.startsWith(".env") && nome !== ".env.example";
}

export function procurarSegredos(texto: string, arquivo: string): Achado[] {
  const achados: Achado[] = [];
  texto.split(/\r?\n/).forEach((linha, i) => {
    for (const { motivo, padrao, ehPlaceholder } of PADROES) {
      const m = linha.match(padrao);
      if (m && !(ehPlaceholder?.(m) ?? false)) achados.push({ arquivo, linha: i + 1, motivo });
    }
  });
  return achados;
}

export function arquivosVersionaveis(raiz: string): string[] {
  const saida = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], {
    cwd: raiz,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return [...new Set(saida.split("\0").filter(Boolean))];
}

export function verificar(raiz: string): Achado[] {
  return arquivosVersionaveis(raiz).flatMap((arquivo) => {
    if (ehArquivoEnvProibido(arquivo)) return [{ arquivo, motivo: "arquivo .env versionável (só .env.example é permitido)" }];
    if (PERMITIDOS.has(arquivo) || FRAMEWORK.test(arquivo) || BINARIO.test(arquivo)) return [];
    const caminho = path.join(raiz, arquivo);
    if (!fs.existsSync(caminho) || fs.statSync(caminho).size > 2 * 1024 * 1024) return [];
    return procurarSegredos(fs.readFileSync(caminho, "utf8"), arquivo);
  });
}

function raizPadrao(): string {
  const aqui = path.dirname(fileURLToPath(import.meta.url));
  return execFileSync("git", ["rev-parse", "--show-toplevel"], { cwd: aqui, encoding: "utf8" }).trim();
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const i = process.argv.indexOf("--raiz");
  const raiz = i > -1 && process.argv[i + 1] ? path.resolve(process.argv[i + 1]!) : raizPadrao();
  const achados = verificar(raiz);
  if (achados.length > 0) {
    console.error(`Possíveis segredos (${achados.length}):`);
    for (const a of achados) console.error(`  ${a.arquivo}${a.linha ? `:${a.linha}` : ""}  ${a.motivo}`);
    console.error("Nenhum segredo vai para o repositório. Mova para .env.local ou para os secrets do GitHub.");
    process.exit(1);
  }
  console.log("check:secrets ok: nenhum segredo encontrado.");
}
