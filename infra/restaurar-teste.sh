#!/usr/bin/env bash
# Ensaio de restauração (fatia 0.4): baixa o backup mais recente do ambiente, decifra e restaura num
# Postgres descartável, sem rede, e confere o conteúdo. Não toca no banco do ambiente.
#
# A chave privada do age chega pela entrada padrão e nunca é gravada no disco do servidor. No PowerShell:
#   Get-Content -Raw <chave-age.txt> | ssh <servidor> /opt/imob/infra/restaurar-teste.sh hml
set -euo pipefail

readonly RCLONE_CONF=/opt/imob/backup/rclone.conf
readonly BUCKET=imob-backups
readonly NOME=imob_restauro_teste
readonly IMAGEM_PG=postgres:17.12

ambiente=${1:-}
[[ "$ambiente" =~ ^(hml|prd)$ ]] || { echo "uso: $0 <hml|prd>, com a chave privada do age na entrada padrão" >&2; exit 2; }
[[ ! -t 0 ]] || { echo "[restauro] mande a chave privada do age pela entrada padrão" >&2; exit 2; }
chave=$(tr -d '\r')
[[ "$chave" == *AGE-SECRET-KEY-* ]] || { echo "[restauro] a entrada não é uma chave do age" >&2; exit 2; }

ultimo=$(rclone --config "$RCLONE_CONF" lsf --files-only "r2:$BUCKET/$ambiente/" | sort | tail -n1)
[[ -n "$ultimo" ]] || { echo "[restauro] nenhum backup de $ambiente no R2" >&2; exit 1; }
echo "[restauro] backup: $ultimo"

limpar() { docker rm -f "$NOME" >/dev/null 2>&1 || true; }
trap limpar EXIT
limpar
docker run -d --name "$NOME" --network none --memory 256m -e POSTGRES_PASSWORD=descartavel "$IMAGEM_PG" >/dev/null

# O contêiner sobe um Postgres provisório (só socket) para se configurar; o definitivo também ouve TCP.
for _ in $(seq 1 60); do
  docker exec "$NOME" pg_isready -h 127.0.0.1 -U postgres -q && break
  sleep 2
done
docker exec "$NOME" pg_isready -h 127.0.0.1 -U postgres -q || { echo "[restauro] o Postgres descartável não subiu" >&2; exit 1; }

psql_teste() { docker exec -i "$NOME" psql -v ON_ERROR_STOP=1 -U postgres -qAt "$@"; }

# Os papéis precisam existir para os donos, os GRANTs e as políticas voltarem como estavam.
for papel in migrator app_user auth_service worker; do
  psql_teste -c "create role $papel"
done
psql_teste -c "create database imob owner migrator"

rclone --config "$RCLONE_CONF" cat "r2:$BUCKET/$ambiente/$ultimo" |
  age --decrypt -i <(printf '%s\n' "$chave") |
  docker exec -i "$NOME" pg_restore -U postgres -d imob --exit-on-error

migracoes=$(psql_teste -d imob -c "select count(*) from drizzle.__drizzle_migrations")
sem_rls=$(psql_teste -d imob -c "select count(*) from pg_tables where schemaname = 'public' and not rowsecurity")
empreendimentos=$(psql_teste -d imob -c "select count(*) from public.empreendimentos")
echo "[restauro] migrations: $migracoes; empreendimentos: $empreendimentos; tabelas sem RLS: $sem_rls"
((migracoes > 0 && sem_rls == 0)) || { echo "[restauro] o banco restaurado não confere" >&2; exit 1; }
echo "[restauro] ok: o backup $ultimo restaura num banco limpo"
