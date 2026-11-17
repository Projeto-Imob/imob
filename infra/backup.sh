#!/usr/bin/env bash
# Backup do banco do Imob (fatia 0.4; D8): pg_dump cifrado com age e enviado ao R2 por rclone.
# Uso: backup.sh <hml|prd> [diario|pre-deploy]
# Roda pelo timer imob-backup@<ambiente> (diário) e pelo deploy.sh (antes de cada deploy), com o usuário deploy.
#
# No servidor existe só a chave pública do age: o servidor cifra, mas não consegue ler os backups.
# A chave privada fica só com o Matheus. A retenção de 30 dias é uma regra de ciclo de vida do bucket.
#   /opt/imob/backup/destinatario.age   chave pública do age
#   /opt/imob/backup/rclone.conf        remoto "r2", com o token só de objetos dos buckets do Imob
set -euo pipefail

readonly PASTA=/opt/imob/backup
readonly DESTINATARIO="$PASTA/destinatario.age"
readonly RCLONE_CONF="$PASTA/rclone.conf"
readonly BUCKET=imob-backups

ambiente=${1:-}
motivo=${2:-diario}
[[ "$ambiente" =~ ^(hml|prd)$ && "$motivo" =~ ^(diario|pre-deploy)$ ]] || {
  echo "uso: $0 <hml|prd> [diario|pre-deploy]" >&2
  exit 2
}

banco=$(docker ps -q --filter "label=com.docker.swarm.service.name=imob_${ambiente}_db" --filter status=running | head -n1)
[[ -n "$banco" ]] || { echo "[backup] o banco de $ambiente não está rodando" >&2; exit 1; }

nome="imob-${ambiente}-$(date -u +%Y%m%dT%H%M%SZ)-${motivo}.dump.age"
destino="r2:${BUCKET}/${ambiente}/${nome}"

# Dentro do contêiner, o superusuário entra pelo socket local, sem senha.
docker exec "$banco" pg_dump -U postgres -d imob --format=custom |
  age --encrypt -R "$DESTINATARIO" |
  rclone --config "$RCLONE_CONF" rcat "$destino"

tamanho=$(rclone --config "$RCLONE_CONF" lsf --format s "$destino")
[[ "$tamanho" =~ ^[0-9]+$ ]] && ((tamanho > 0)) || { echo "[backup] $nome ficou vazio no R2" >&2; exit 1; }
echo "[backup] $nome enviado ($tamanho bytes)"
