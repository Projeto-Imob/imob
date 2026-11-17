#!/usr/bin/env bash
# Deploy do Imob numa stack isolada do Swarm (fatia 0.4; ARQUITETURA, seção 8).
#
# Fica no servidor em /opt/imob/infra/deploy.sh, com dono root. O GitHub Actions entra com o usuário
# deploy, cuja chave só roda este script (command= no authorized_keys). O pedido chega em
# SSH_ORIGINAL_COMMAND, e por SSH só "deploy <ambiente> <commit>" é aceito.
#
# Ações:
#   deploy <ambiente> <commit>    backup de segurança, migrations, seed fictício (só hml), stack nova e
#                                 conferência da saúde; se a saúde falhar, volta à versão anterior.
#   preparar <ambiente> <commit>  só no terminal do servidor, na primeira vez ou para reaplicar os
#                                 papéis: sobe o banco e roda o bootstrap (papéis, limites e banco).
#
# Arquivos de cada ambiente em /opt/imob/<ambiente>/, fora do repositório e legíveis só pelo deploy:
#   deploy.env     IMOB_DOMINIO, TRAEFIK_REDE, TRAEFIK_ENTRADA e TRAEFIK_CERTRESOLVER
#   app.env        DATABASE_URL (app_user), SENTRY_DSN, SENTRY_ENVIRONMENT e afins
#   db.env         POSTGRES_PASSWORD (superusuário)
#   migrator.env   DATABASE_URL_MIGRATOR
#   bootstrap.env  DATABASE_URL_ADMIN e DB_SENHA_* (só para preparar)
set -euo pipefail

readonly BASE=/opt/imob
readonly IMAGEM=ghcr.io/projeto-imob/imob
readonly IMAGEM_MIGRACAO=ghcr.io/projeto-imob/imob-migracao
readonly ESPERA_SAUDE_S=300

falhar() { echo "[deploy] erro: $*" >&2; exit 1; }
avisar() { echo "[deploy] $*"; }

# --- Pedido: argumentos no terminal, ou SSH_ORIGINAL_COMMAND pela chave do Actions ---
if [[ $# -gt 0 ]]; then
  pedido="$*"
  origem=terminal
else
  pedido="${SSH_ORIGINAL_COMMAND:-}"
  origem=ssh
fi
acao="" ambiente="" versao="" resto=""
read -r acao ambiente versao resto <<<"$pedido" || true

[[ -z "$resto" ]] || falhar "pedido recusado. Uso: deploy <ambiente> <commit>"
case "$acao" in
  deploy) ;;
  preparar) [[ "$origem" == terminal ]] || falhar "pedido recusado: preparar só roda no terminal do servidor" ;;
  *) falhar "pedido recusado. Uso: deploy <ambiente> <commit>" ;;
esac
[[ "$ambiente" == hml ]] || falhar "ambiente desconhecido (por enquanto, só hml)"
[[ "$versao" =~ ^[0-9a-f]{40}$ ]] || falhar "commit inválido: use o SHA completo, com 40 caracteres"

readonly PASTA="$BASE/$ambiente"
readonly STACK="imob_$ambiente"
[[ -r "$PASTA/deploy.env" ]] || falhar "faltou $PASTA/deploy.env"
set -a
# shellcheck source=/dev/null
source "$PASTA/deploy.env"
set +a
export IMOB_AMBIENTE="$ambiente" IMOB_PASTA="$PASTA"

# Um deploy por ambiente de cada vez.
exec 9>"$PASTA/deploy.lock"
flock -w 600 9 || falhar "outro deploy de $ambiente não terminou em 10 minutos"

TEMP=$(mktemp -d)
trap 'rm -rf "$TEMP"' EXIT

servico_existe() { docker service inspect "$1" >/dev/null 2>&1; }

# Tag (commit) da imagem do app em execução, ou vazio se a stack ainda não tem o app.
versao_em_execucao() {
  local imagem
  imagem=$(docker service inspect "${STACK}_app" --format '{{.Spec.TaskTemplate.ContainerSpec.Image}}' 2>/dev/null) || return 0
  imagem=${imagem%%@*}
  echo "${imagem##*:}"
}

baixar_imagens() {
  docker pull -q "$IMAGEM:$1" >/dev/null
  docker pull -q "$IMAGEM_MIGRACAO:$1" >/dev/null
}

# A stack de cada versão vem da imagem de migracao dessa versão: o servidor não guarda cópia do repositório.
aplicar_stack() { # $1 = versão; $2 = réplicas do app
  local arquivo="$TEMP/stack-$1.yml"
  docker run --rm --network none --entrypoint cat "$IMAGEM_MIGRACAO:$1" infra/imob-stack.yml >"$arquivo"
  IMOB_VERSAO="$1" IMOB_APP_REPLICAS="$2" docker stack deploy --detach=true -c "$arquivo" "$STACK"
}

# Tarefa avulsa da CLI de banco na rede interna da stack (o migrator só existe aqui).
tarefa_de_banco() { # $1 = versão; $2 = arquivo de ambiente; demais = comando da CLI
  local versao_tarefa=$1 arquivo_env=$2
  shift 2
  [[ -r "$arquivo_env" ]] || falhar "faltou $arquivo_env"
  docker run --rm --network "${STACK}_interno" --env-file "$arquivo_env" --memory 256m \
    "$IMAGEM_MIGRACAO:$versao_tarefa" "$@"
}

esperar_banco() {
  local fim=$((SECONDS + 180))
  while ((SECONDS < fim)); do
    [[ -n "$(docker ps -q --filter "label=com.docker.swarm.service.name=${STACK}_db" --filter health=healthy)" ]] && return 0
    sleep 5
  done
  falhar "o banco de $ambiente não ficou saudável em 3 minutos"
}

# Saúde pelo endereço público: passa pelo Traefik e pelo certificado, e confere a versão servida.
saude_ok() { # $1 = versão esperada
  local corpo
  corpo=$(curl -fsS --max-time 10 "https://$IMOB_DOMINIO/api/saude" 2>/dev/null) || return 1
  [[ "$corpo" == *'"status":"ok"'* && "$corpo" == *"\"versao\":\"$1\""* ]]
}

esperar_saude() { # $1 = versão esperada
  local fim=$((SECONDS + ESPERA_SAUDE_S))
  while ((SECONDS < fim)); do
    saude_ok "$1" && return 0
    sleep 10
  done
  return 1
}

# Mantém só as imagens da versão nova e da anterior; as demais continuam no GHCR.
limpar_imagens() {
  local manter=" $* " repo tag
  for repo in "$IMAGEM" "$IMAGEM_MIGRACAO"; do
    docker image ls "$repo" --format '{{.Tag}}' | while read -r tag; do
      [[ "$manter" == *" $tag "* ]] && continue
      docker image rm "$repo:$tag" >/dev/null 2>&1 || true
    done
  done
}

preparar() {
  baixar_imagens "$versao"
  if ! servico_existe "${STACK}_db"; then
    avisar "criando a stack $STACK só com o banco (app com 0 réplicas)"
    aplicar_stack "$versao" 0
  fi
  esperar_banco
  avisar "papéis, limites e banco (bootstrap)"
  tarefa_de_banco "$versao" "$PASTA/bootstrap.env" bootstrap
  avisar "pronto. Agora: $0 deploy $ambiente $versao"
}

deploy() {
  servico_existe "${STACK}_db" || falhar "a stack $STACK não existe. Rode antes, no servidor: $0 preparar $ambiente $versao"
  avisar "baixando as imagens de $versao"
  baixar_imagens "$versao"
  local anterior
  anterior=$(versao_em_execucao)
  avisar "versão em execução: ${anterior:-nenhuma}"

  avisar "backup de segurança"
  "$BASE/infra/backup.sh" "$ambiente" pre-deploy

  avisar "migrations"
  tarefa_de_banco "$versao" "$PASTA/migrator.env" migrate
  if [[ "$ambiente" == hml ]]; then
    # Regra 16 e D17: homologação só com dados fictícios. O seed é idempotente.
    avisar "seed fictício"
    tarefa_de_banco "$versao" "$PASTA/migrator.env" seed --homologacao
  fi

  avisar "stack $STACK com $versao"
  aplicar_stack "$versao" 1
  if esperar_saude "$versao"; then
    limpar_imagens "$versao" "$anterior"
    avisar "pronto: $versao no ar"
    return 0
  fi

  avisar "a saúde não respondeu com $versao em $ESPERA_SAUDE_S s"
  if [[ -n "$anterior" && "$anterior" != "$versao" ]]; then
    # As migrations são só aditivas: a versão anterior roda sobre o schema novo.
    avisar "voltando para $anterior"
    aplicar_stack "$anterior" 1
    if esperar_saude "$anterior"; then
      avisar "voltou para $anterior"
    else
      avisar "ATENÇÃO: $anterior também não respondeu"
    fi
  fi
  falhar "deploy de $versao falhou"
}

"$acao"
