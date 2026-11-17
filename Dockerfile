# syntax=docker/dockerfile:1
# Imagens do Imob (fatia 0.4; D12), publicadas no GHCR com a tag do commit:
#   app       — Next standalone, sem root, porta 3000. Ao subir, confere que o banco é do app_user.
#   migracao  — scripts de banco (bootstrap, migrate, seed) e o arquivo da stack, para tarefa avulsa.
# A imagem é pública: nada de segredo aqui. Tudo vem do ambiente na hora de rodar.
# Só o NEXT_PUBLIC_SENTRY_DSN entra no build, porque vai para o navegador (não é segredo).

ARG NODE_IMAGEM=node:24.19.0-trixie-slim

# --- Dependências completas, para o build ---
FROM ${NODE_IMAGEM} AS dependencias
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
# Sem scripts de instalação: nenhum é necessário para o build (e o @sentry/cli só serviria aos source maps).
RUN npm ci --ignore-scripts --no-audit --no-fund

# --- Build do Next em modo standalone ---
FROM dependencias AS construcao
COPY . .
ARG NEXT_PUBLIC_SENTRY_DSN=""
ENV NEXT_TELEMETRY_DISABLED=1 \
    IMOB_STANDALONE=1 \
    NEXT_PUBLIC_SENTRY_DSN=${NEXT_PUBLIC_SENTRY_DSN}
# O git não guarda pasta vazia: a public/ pode não existir no checkout.
RUN mkdir -p public && npm run build

# --- app ---
FROM ${NODE_IMAGEM} AS app
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
# Os arquivos ficam com o root: o processo (usuário node) lê, mas não altera o próprio código.
COPY --from=construcao /app/.next/standalone ./
COPY --from=construcao /app/.next/static ./.next/static
COPY --from=construcao /app/public ./public
COPY scripts/conferir-papel.ts ./scripts/conferir-papel.ts
# Única pasta gravável: o cache do Next.
RUN mkdir -p .next/cache && chown node:node .next/cache
USER node
EXPOSE 3000
CMD ["sh", "-c", "node scripts/conferir-papel.ts && exec node server.js"]

# --- migracao ---
FROM ${NODE_IMAGEM} AS migracao
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json .npmrc ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund && npm cache clean --force
COPY scripts/db ./scripts/db
COPY db/migrations ./db/migrations
COPY src ./src
# O deploy lê daqui o arquivo da stack da mesma versão (infra/deploy.sh).
COPY infra/imob-stack.yml ./infra/imob-stack.yml
USER node
ENTRYPOINT ["node", "scripts/db/cli.ts"]
CMD ["migrate"]
