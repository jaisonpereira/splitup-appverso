#!/usr/bin/env bash
set -euo pipefail

OUTPUT_FILE="/opt/AGENTS.md"
NOW_UTC="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

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

HOSTNAME_VALUE="$(hostname 2>/dev/null || echo unknown)"
OS_VALUE="$(grep '^PRETTY_NAME=' /etc/os-release 2>/dev/null | cut -d= -f2- | tr -d '"' || echo unknown)"
KERNEL_VALUE="$(uname -r 2>/dev/null || echo unknown)"
DOCKER_VERSION="$(docker --version 2>/dev/null || echo unknown)"
SWARM_STATE="$(docker info --format '{{.Swarm.LocalNodeState}}' 2>/dev/null || echo unknown)"
SWARM_MANAGER="$(docker info --format '{{.Swarm.ControlAvailable}}' 2>/dev/null || echo unknown)"
NODE_ROLE="worker"
if [ "$SWARM_MANAGER" = "true" ]; then
  NODE_ROLE="manager"
fi

STACK_LIST="$(docker stack ls --format '{{.Name}}' 2>/dev/null || true)"
STACK_COUNT="$(printf '%s\n' "$STACK_LIST" | sed '/^$/d' | wc -l | tr -d ' ')"
SERVICE_LIST="$(docker service ls --format '{{.Name}}' 2>/dev/null || true)"
SERVICE_COUNT="$(printf '%s\n' "$SERVICE_LIST" | sed '/^$/d' | wc -l | tr -d ' ')"

PORTAINER_IMAGE="$(docker service ls --format '{{.Name}} {{.Image}}' 2>/dev/null | awk '$1=="portainer_portainer"{print $2}')"
PORTAINER_VERSION="unknown"
if [ -n "$PORTAINER_IMAGE" ]; then
  PORTAINER_VERSION="${PORTAINER_IMAGE##*:}"
fi

TRAEFIK_ENABLED="no"
if docker service ls --format '{{.Name}}' 2>/dev/null | grep -q '^traefik_'; then
  TRAEFIK_ENABLED="yes"
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

POSTGRES_VERSION="unknown"
if command -v psql >/dev/null 2>&1; then
  POSTGRES_VERSION="$(psql --version 2>/dev/null || echo unknown)"
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

DOMAINS="none"
SERVICE_IDS="$(docker service ls -q 2>/dev/null || true)"
if [ -n "$SERVICE_IDS" ]; then
  ROUTER_RULE_LINES="$(docker service inspect $SERVICE_IDS --format '{{range $k,$v := .Spec.Labels}}{{printf "%s=%s\n" $k $v}}{{end}}' 2>/dev/null | grep 'traefik.http.routers.*.rule=' || true)"
  DOMAIN_VALUES="$(printf '%s\n' "$ROUTER_RULE_LINES" | grep -oE '`[^`]+`' | tr -d '`' | grep -E '^[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' | sort -u || true)"
  if [ -n "$DOMAIN_VALUES" ]; then
    DOMAINS="$DOMAIN_VALUES"
  fi
fi

TEMP_FILE="$(mktemp)"
{
  echo "# VPS AGENTS"
  echo
  echo "Gerado em: ${NOW_UTC}"
  echo
  echo "## Host"
  echo "- Hostname: ${HOSTNAME_VALUE}"
  echo "- OS: ${OS_VALUE}"
  echo "- Kernel: ${KERNEL_VALUE}"
  echo
  echo "## Docker/Swarm"
  echo "- Docker: ${DOCKER_VERSION}"
  echo "- Swarm state: ${SWARM_STATE}"
  echo "- Node role: ${NODE_ROLE}"
  echo "- Total de stacks: ${STACK_COUNT}"
  echo "- Total de services: ${SERVICE_COUNT}"
  echo
  echo "### Stacks instaladas"
  if [ -n "$(printf '%s\n' "$STACK_LIST" | sed '/^$/d')" ]; then
    while IFS= read -r stack; do
      [ -n "$stack" ] && echo "- ${stack}"
    done <<< "$STACK_LIST"
  else
    echo "- none"
  fi
  echo
  echo "## Proxy e SSL"
  echo "- Proxy ativo (Traefik stack): ${TRAEFIK_ENABLED}"
  echo "- Nginx no host: ${NGINX_STATUS}"
  echo "- Certificados TLS: gerenciados via Traefik/ACME quando labels estão configuradas"
  echo
  echo "## Portainer"
  echo "- Versão (imagem): ${PORTAINER_VERSION}"
  echo "- Service: portainer_portainer"
  echo
  echo "## PostgreSQL"
  echo "- Modo no host: ${POSTGRES_HOST_MODE}"
  echo "- Modo em container: ${POSTGRES_CONTAINER_MODE}"
  echo "- Versão cliente: ${POSTGRES_VERSION}"
  echo "- Listeners porta 5432:"
  echo '```'
  printf '%s\n' "$POSTGRES_LISTENERS"
  echo '```'
  echo
  echo "## Redes Swarm relevantes"
  if [ -n "$(printf '%s\n' "$NETWORKS_SWARM" | sed '/^$/d')" ]; then
    while IFS= read -r net; do
      [ -n "$net" ] && echo "- ${net}"
    done <<< "$NETWORKS_SWARM"
  else
    echo "- none"
  fi
  echo
  echo "## Domínios roteados (Traefik rules)"
  if [ "$DOMAINS" = "none" ]; then
    echo "- none"
  else
    while IFS= read -r d; do
      [ -n "$d" ] && echo "- ${d}"
    done <<< "$DOMAINS"
  fi
  echo
  echo "## Observações operacionais"
  echo "- Não alterar stacks existentes sem janela de manutenção."
  echo "- SplitUp deve usar banco compartilhado em DB separado (splitup_db)."
  echo "- Evitar hardcode de segredos neste arquivo; usar apenas inventário técnico."
} > "$TEMP_FILE"

$SUDO mkdir -p /opt
$SUDO cp "$TEMP_FILE" "$OUTPUT_FILE"
$SUDO chmod 644 "$OUTPUT_FILE"
rm -f "$TEMP_FILE"

echo "[INFO] Inventário atualizado em ${OUTPUT_FILE}"
