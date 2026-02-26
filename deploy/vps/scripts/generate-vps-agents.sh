#!/usr/bin/env bash
set -euo pipefail

OUTPUT_FILE="/opt/AGENTS.md"
NOW_UTC="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

REPO_URL="${REPO_URL:-https://github.com/jaisonpereira/splitup-appverso}"
PROJECT_AGENTS_URL="${PROJECT_AGENTS_URL:-${REPO_URL}/blob/main/AGENTS.md}"
PROJECT_AGENTS_PATH="${PROJECT_AGENTS_PATH:-AGENTS.md}"

SUDO=""
if [ "$(id -u)" -ne 0 ]; then
  if command -v sudo >/dev/null 2>&1; then
    SUDO="sudo"
  else
    echo "[ERROR] Precisa de root ou sudo para escrever ${OUTPUT_FILE}" >&2
    exit 1
  fi
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "[ERROR] Docker não encontrado na VPS" >&2
  exit 1
fi

has_content() {
  [ -n "$(printf '%s\n' "$1" | sed '/^$/d')" ]
}

emit_list() {
  local data="$1"
  if has_content "$data"; then
    while IFS= read -r line; do
      [ -n "$line" ] && echo "- ${line}"
    done <<< "$data"
  else
    echo "- none"
  fi
}

build_https_health_report() {
  local domains="$1"
  local mode="${2:-root-only}"

  if ! command -v curl >/dev/null 2>&1; then
    echo "curl-not-installed"
    return
  fi

  if ! has_content "$domains"; then
    echo "none"
    return
  fi

  while IFS= read -r domain; do
    [ -n "$domain" ] || continue
    code="$(curl -L -k -sS -o /dev/null -m 10 -w '%{http_code}' "https://${domain}" || true)"
    [ -n "$code" ] || code="ERR"

    if [ "$mode" = "auto-api-status" ] && [[ "$domain" == api.* ]] && [[ "$code" != 2* ]]; then
      status_code="$(curl -L -k -sS -o /dev/null -m 10 -w '%{http_code}' "https://${domain}/status" || true)"
      if [[ "$status_code" == 2* ]]; then
        code="${status_code} (/status)"
      fi
    fi

    echo "${domain} => ${code}"
  done <<< "$domains"
}

HOSTNAME_VALUE="$(hostname 2>/dev/null || echo unknown)"
OS_VALUE="$(grep '^PRETTY_NAME=' /etc/os-release 2>/dev/null | cut -d= -f2- | tr -d '"' || echo unknown)"
KERNEL_VALUE="$(uname -r 2>/dev/null || echo unknown)"
UPTIME_VALUE="$(uptime -p 2>/dev/null || echo unknown)"
DOCKER_VERSION="$(docker --version 2>/dev/null || echo unknown)"
SWARM_STATE="$(docker info --format '{{.Swarm.LocalNodeState}}' 2>/dev/null || echo unknown)"
SWARM_MANAGER="$(docker info --format '{{.Swarm.ControlAvailable}}' 2>/dev/null || echo unknown)"

NODE_ROLE="worker"
if [ "$SWARM_MANAGER" = "true" ]; then
  NODE_ROLE="manager"
fi

DISK_ROOT="$(df -h / 2>/dev/null | awk 'NR==2 {print $2 " total, " $3 " used, " $4 " free (" $5 ")"}')"
if [ -z "$DISK_ROOT" ]; then
  DISK_ROOT="unknown"
fi

MEMORY_SUMMARY="unknown"
if command -v free >/dev/null 2>&1; then
  MEMORY_SUMMARY="$(free -h 2>/dev/null | awk '/^Mem:/ {print $2 " total, " $3 " used, " $4 " free"}')"
fi
if [ -z "$MEMORY_SUMMARY" ]; then
  MEMORY_SUMMARY="unknown"
fi

STACK_LIST="$(docker stack ls --format '{{.Name}}' 2>/dev/null || true)"
STACK_COUNT="$(printf '%s\n' "$STACK_LIST" | sed '/^$/d' | wc -l | tr -d ' ')"
SERVICE_LIST="$(docker service ls --format '{{.Name}}' 2>/dev/null || true)"
SERVICE_COUNT="$(printf '%s\n' "$SERVICE_LIST" | sed '/^$/d' | wc -l | tr -d ' ')"
SERVICE_SUMMARY="$(docker service ls --format '{{.Name}}|{{.Replicas}}|{{.Image}}' 2>/dev/null || true)"

KARAOKE_STACKS="$(printf '%s\n' "$STACK_LIST" | grep '^karaoke-' || true)"
KARAOKE_STACK_COUNT="$(printf '%s\n' "$KARAOKE_STACKS" | sed '/^$/d' | wc -l | tr -d ' ')"
KARAOKE_SERVICES="$(printf '%s\n' "$SERVICE_SUMMARY" | grep '^karaoke-' || true)"

SPLITUP_STACK_PRESENT="no"
if printf '%s\n' "$STACK_LIST" | grep -qx 'splitup'; then
  SPLITUP_STACK_PRESENT="yes"
fi

PORTAINER_IMAGE="$(docker service ls --format '{{.Name}} {{.Image}}' 2>/dev/null | awk '$1=="portainer_portainer"{print $2; exit}')"
if [ -z "$PORTAINER_IMAGE" ]; then
  PORTAINER_IMAGE="$(docker service ls --format '{{.Name}} {{.Image}}' 2>/dev/null | awk '$1 ~ /^portainer_/ {print $2; exit}')"
fi
PORTAINER_VERSION="unknown"
if [ -n "$PORTAINER_IMAGE" ]; then
  PORTAINER_VERSION="${PORTAINER_IMAGE##*:}"
fi

TRAEFIK_SERVICE="$(docker service ls --format '{{.Name}}' 2>/dev/null | grep '^traefik_' | head -n 1 || true)"
TRAEFIK_ENABLED="no"
if [ -n "$TRAEFIK_SERVICE" ]; then
  TRAEFIK_ENABLED="yes (${TRAEFIK_SERVICE})"
fi

NGINX_STATUS="not-installed"
if command -v nginx >/dev/null 2>&1; then
  NGINX_STATUS="installed"
  if command -v systemctl >/dev/null 2>&1; then
    ACTIVE_STATE="$(systemctl is-active nginx 2>/dev/null || true)"
    if [ -n "$ACTIVE_STATE" ]; then
      NGINX_STATUS="installed (${ACTIVE_STATE})"
    fi
  fi
fi

POSTGRES_HOST_MODE="absent"
if pgrep -x postgres >/dev/null 2>&1; then
  POSTGRES_HOST_MODE="host-native"
fi

POSTGRES_CONTAINER_MODE="absent"
if docker ps --format '{{.Image}}' 2>/dev/null | grep -qi 'postgres'; then
  POSTGRES_CONTAINER_MODE="container-running"
fi

POSTGRES_VERSION_CLIENT="unknown"
if command -v psql >/dev/null 2>&1; then
  POSTGRES_VERSION_CLIENT="$(psql --version 2>/dev/null || echo unknown)"
fi

POSTGRES_LISTENERS="none"
if command -v ss >/dev/null 2>&1; then
  POSTGRES_LISTENERS="$(ss -ltnp 2>/dev/null | grep ':5432' || true)"
elif command -v netstat >/dev/null 2>&1; then
  POSTGRES_LISTENERS="$(netstat -ltnp 2>/dev/null | grep ':5432' || true)"
fi
if [ -z "$POSTGRES_LISTENERS" ]; then
  POSTGRES_LISTENERS="none"
fi

NETWORKS_SWARM="$(docker network ls --format '{{.Name}} {{.Driver}} {{.Scope}}' 2>/dev/null | awk '$3=="swarm" {print $1 " (" $2 ")"}' || true)"
if [ -z "$NETWORKS_SWARM" ]; then
  NETWORKS_SWARM="none"
fi

DOMAIN_VALUES=""
SERVICE_IDS="$(docker service ls -q 2>/dev/null || true)"
if [ -n "$SERVICE_IDS" ]; then
  ROUTER_RULE_LINES="$(docker service inspect $SERVICE_IDS --format '{{range $k,$v := .Spec.Labels}}{{printf "%s=%s\n" $k $v}}{{end}}' 2>/dev/null | grep 'traefik.http.routers.*.rule=' || true)"
  DOMAIN_VALUES="$(printf '%s\n' "$ROUTER_RULE_LINES" | grep -oE '`[^`]+`' | tr -d '`' | tr ',' '\n' | sed 's/^ *//;s/ *$//' | grep -E '^[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' | sort -u || true)"
fi

KARAOKE_DOMAINS="$(printf '%s\n' "$DOMAIN_VALUES" | grep -i 'karaoke' || true)"
SPLITUP_DOMAINS="$(printf '%s\n' "$DOMAIN_VALUES" | grep -E '(^|\.)splitup\.' || true)"

DOMAIN_HEALTH="$(build_https_health_report "$DOMAIN_VALUES" auto-api-status)"
KARAOKE_HEALTH="$(build_https_health_report "$KARAOKE_DOMAINS" auto-api-status)"
SPLITUP_HEALTH="$(build_https_health_report "$SPLITUP_DOMAINS" auto-api-status)"

STACK_SERVICES_MD="none"
if has_content "$STACK_LIST"; then
  STACK_SERVICES_TMP="$(mktemp)"
  while IFS= read -r stack; do
    [ -n "$stack" ] || continue
    {
      echo "### ${stack}"
      stack_services="$(docker stack services "$stack" --format '{{.Name}} | {{.Replicas}} | {{.Image}}' 2>/dev/null || true)"
      if has_content "$stack_services"; then
        while IFS= read -r row; do
          [ -n "$row" ] && echo "- ${row}"
        done <<< "$stack_services"
      else
        echo "- none"
      fi
      echo
    } >> "$STACK_SERVICES_TMP"
  done <<< "$STACK_LIST"
  STACK_SERVICES_MD="$(cat "$STACK_SERVICES_TMP")"
  rm -f "$STACK_SERVICES_TMP"
fi

TEMP_FILE="$(mktemp)"
{
  echo "# VPS AGENTS"
  echo
  echo "Gerado em: ${NOW_UTC}"
  echo
  echo "## Vínculo com o repositório SplitUp"
  echo "- Repositório: ${REPO_URL}"
  echo "- AGENTS do projeto: ${PROJECT_AGENTS_URL} (arquivo ${PROJECT_AGENTS_PATH})"
  echo "- AGENTS operacional da VPS: ${OUTPUT_FILE} (este arquivo)"
  echo "- Script gerador: deploy/vps/scripts/generate-vps-agents.sh"
  echo
  echo "## Host"
  echo "- Hostname: ${HOSTNAME_VALUE}"
  echo "- OS: ${OS_VALUE}"
  echo "- Kernel: ${KERNEL_VALUE}"
  echo "- Uptime: ${UPTIME_VALUE}"
  echo
  echo "## Capacidade"
  echo "- Disco raiz: ${DISK_ROOT}"
  echo "- Memória: ${MEMORY_SUMMARY}"
  echo
  echo "## Docker e Swarm"
  echo "- Docker: ${DOCKER_VERSION}"
  echo "- Swarm state: ${SWARM_STATE}"
  echo "- Node role: ${NODE_ROLE}"
  echo "- Total de stacks: ${STACK_COUNT}"
  echo "- Total de services: ${SERVICE_COUNT}"
  echo
  echo "### Stacks instaladas"
  emit_list "$STACK_LIST"
  echo
  echo "### Serviços por stack (name | replicas | image)"
  if has_content "$STACK_SERVICES_MD"; then
    printf '%s\n' "$STACK_SERVICES_MD"
  else
    echo "- none"
  fi
  echo
  echo "## Proxy e SSL"
  echo "- Traefik ativo: ${TRAEFIK_ENABLED}"
  echo "- Nginx no host: ${NGINX_STATUS}"
  echo "- TLS: automatizado via Traefik/ACME para serviços com labels corretas"
  echo
  echo "## Portainer"
  echo "- Service detectado: ${PORTAINER_IMAGE:-unknown}"
  echo "- Versão (tag da imagem): ${PORTAINER_VERSION}"
  echo
  echo "## PostgreSQL"
  echo "- Modo no host: ${POSTGRES_HOST_MODE}"
  echo "- Modo em container: ${POSTGRES_CONTAINER_MODE}"
  echo "- Versão cliente: ${POSTGRES_VERSION_CLIENT}"
  echo "- Listeners porta 5432:"
  echo '```'
  printf '%s\n' "$POSTGRES_LISTENERS"
  echo '```'
  echo
  echo "## Redes Swarm relevantes"
  emit_list "$NETWORKS_SWARM"
  echo
  echo "## Domínios roteados pelo Traefik"
  emit_list "$DOMAIN_VALUES"
  echo
  echo "## Healthcheck HTTPS (todos os domínios roteados)"
  emit_list "$DOMAIN_HEALTH"
  echo
  echo "## Karaoke (não-regressão)"
  echo "- Total de stacks karaoke: ${KARAOKE_STACK_COUNT}"
  echo "- Stacks karaoke detectadas:"
  emit_list "$KARAOKE_STACKS"
  echo "- Serviços karaoke (name|replicas|image):"
  emit_list "$KARAOKE_SERVICES"
  echo "- Domínios karaoke:"
  emit_list "$KARAOKE_DOMAINS"
  echo "- Healthcheck HTTPS karaoke:"
  emit_list "$KARAOKE_HEALTH"
  echo
  echo "## SplitUp"
  echo "- Stack splitup detectada: ${SPLITUP_STACK_PRESENT}"
  echo "- Domínios splitup:"
  emit_list "$SPLITUP_DOMAINS"
  echo "- Healthcheck HTTPS splitup:"
  emit_list "$SPLITUP_HEALTH"
  echo
  echo "## Observações operacionais"
  echo "- Não alterar stacks existentes sem janela de manutenção."
  echo "- SplitUp usa banco compartilhado em DB separado (splitup_db)."
  echo "- Não registrar segredos/senhas/tokens neste inventário."
} > "$TEMP_FILE"

$SUDO mkdir -p /opt
$SUDO cp "$TEMP_FILE" "$OUTPUT_FILE"
$SUDO chmod 644 "$OUTPUT_FILE"
rm -f "$TEMP_FILE"

echo "[INFO] Inventário atualizado em ${OUTPUT_FILE}"
