#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

CURRENT_USER="$(id -un)"
PROJECT_ID="$(printf '%s' "$SCRIPT_DIR" | cksum | awk '{print $1}')"
STATE_FILE="${TMPDIR:-/tmp}/splitup-local-${PROJECT_ID}.state"
DEFAULT_POSTGRES_CONTAINER="splitup-postgres"
POSTGRES_CONTAINER="$DEFAULT_POSTGRES_CONTAINER"
TERM_WAIT_SECONDS=5
KILL_WAIT_SECONDS=3

HAVE_LSOF=0
HAVE_SS=0
if command -v lsof >/dev/null 2>&1; then
  HAVE_LSOF=1
fi
if command -v ss >/dev/null 2>&1; then
  HAVE_SS=1
fi

if [ "$HAVE_LSOF" -eq 0 ] && [ "$HAVE_SS" -eq 0 ]; then
  echo "[ERROR] É necessário ter lsof ou ss instalado para detectar portas." >&2
  exit 1
fi

info() {
  printf '[INFO] %s\n' "$1"
}

warn() {
  printf '[WARN] %s\n' "$1"
}

error() {
  printf '[ERROR] %s\n' "$1" >&2
}

is_number() {
  case "$1" in
    ''|*[!0-9]*)
      return 1
      ;;
    *)
      return 0
      ;;
  esac
}

read_state_value() {
  local key="$1"
  local line
  line="$(grep -E "^${key}=" "$STATE_FILE" 2>/dev/null | head -n1 || true)"
  printf '%s\n' "${line#*=}"
}

contains_value() {
  local needle="$1"
  shift
  local value
  for value in "$@"; do
    if [ "$value" = "$needle" ]; then
      return 0
    fi
  done
  return 1
}

is_protected_pid() {
  local pid="$1"
  local owner
  local command

  if ! kill -0 "$pid" 2>/dev/null; then
    return 1
  fi

  owner="$(ps -o user= -p "$pid" 2>/dev/null | tr -d '[:space:]' || true)"
  if [ -z "$owner" ]; then
    return 1
  fi

  if [ "$owner" != "$CURRENT_USER" ]; then
    return 0
  fi

  command="$(ps -o command= -p "$pid" 2>/dev/null | sed 's/^[[:space:]]*//' || true)"
  case "$command" in
    /System/*|/usr/libexec/*|/usr/sbin/*|/sbin/*)
      return 0
      ;;
  esac

  if [[ "$command" == *"ControlCenter.app/Contents/MacOS/ControlCenter"* ]]; then
    return 0
  fi

  return 1
}

command_for_pid() {
  local pid="$1"
  ps -o command= -p "$pid" 2>/dev/null | sed 's/^[[:space:]]*//' || true
}

pids_for_port() {
  local port="$1"

  if [ "$HAVE_LSOF" -eq 1 ]; then
    lsof -nP -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null | sort -u || true
    return 0
  fi

  if [ "$HAVE_SS" -eq 1 ]; then
    ss -ltnp "( sport = :$port )" 2>/dev/null \
      | grep -oE 'pid=[0-9]+' \
      | cut -d= -f2 \
      | sort -u \
      || true
    return 0
  fi

  return 0
}

collect_eligible_pids_for_port() {
  local port="$1"
  local pid

  for pid in $(pids_for_port "$port"); do
    if is_protected_pid "$pid"; then
      continue
    fi
    printf '%s\n' "$pid"
  done
}

wait_for_pids_exit() {
  local timeout="$1"
  shift
  local deadline=$((SECONDS + timeout))
  local pending=1
  local pid

  while [ "$pending" -eq 1 ] && [ "$SECONDS" -lt "$deadline" ]; do
    pending=0
    for pid in "$@"; do
      if kill -0 "$pid" 2>/dev/null; then
        pending=1
        break
      fi
    done
    if [ "$pending" -eq 1 ]; then
      sleep 1
    fi
  done
}

TARGET_PORTS=()
if [ -f "$STATE_FILE" ]; then
  info "Lendo estado de execução em $STATE_FILE"
  WEB_PORT="$(read_state_value WEB_PORT)"
  API_PORT="$(read_state_value API_PORT)"
  STATE_POSTGRES_CONTAINER="$(read_state_value POSTGRES_CONTAINER)"

  if is_number "$WEB_PORT"; then
    TARGET_PORTS+=("$WEB_PORT")
  fi

  if is_number "$API_PORT" && ! contains_value "$API_PORT" "${TARGET_PORTS[@]-}"; then
    TARGET_PORTS+=("$API_PORT")
  fi

  if [ -n "$STATE_POSTGRES_CONTAINER" ]; then
    POSTGRES_CONTAINER="$STATE_POSTGRES_CONTAINER"
  fi
fi

if [ "${#TARGET_PORTS[@]}" -eq 0 ]; then
  info "Estado não encontrado ou inválido. Usando fallback agressivo de portas."
  for port in $(seq 3000 3010); do
    TARGET_PORTS+=("$port")
  done
  for port in $(seq 5000 5010); do
    TARGET_PORTS+=("$port")
  done
fi

info "Portas alvo: ${TARGET_PORTS[*]}"

TERM_PIDS=()
for port in "${TARGET_PORTS[@]}"; do
  for pid in $(collect_eligible_pids_for_port "$port"); do
    if ! contains_value "$pid" "${TERM_PIDS[@]-}"; then
      TERM_PIDS+=("$pid")
    fi
  done
done

if [ "${#TERM_PIDS[@]}" -gt 0 ]; then
  info "Enviando SIGTERM para PIDs: ${TERM_PIDS[*]}"
  kill -TERM "${TERM_PIDS[@]}" 2>/dev/null || true
  wait_for_pids_exit "$TERM_WAIT_SECONDS" "${TERM_PIDS[@]}"
else
  info "Nenhum PID elegível encontrado para SIGTERM."
fi

KILL_PIDS=()
for port in "${TARGET_PORTS[@]}"; do
  for pid in $(collect_eligible_pids_for_port "$port"); do
    if ! contains_value "$pid" "${KILL_PIDS[@]-}"; then
      KILL_PIDS+=("$pid")
    fi
  done
done

if [ "${#KILL_PIDS[@]}" -gt 0 ]; then
  warn "Processos ainda ativos após SIGTERM. Enviando SIGKILL para: ${KILL_PIDS[*]}"
  kill -KILL "${KILL_PIDS[@]}" 2>/dev/null || true
  wait_for_pids_exit "$KILL_WAIT_SECONDS" "${KILL_PIDS[@]}"
else
  info "Nenhum PID elegível restante após SIGTERM."
fi

FAILURE=0
for port in "${TARGET_PORTS[@]}"; do
  LISTEN_PIDS=()
  ELIGIBLE_PIDS=()
  PROTECTED_PIDS=()

  for pid in $(pids_for_port "$port"); do
    LISTEN_PIDS+=("$pid")
    if is_protected_pid "$pid"; then
      PROTECTED_PIDS+=("$pid")
    else
      ELIGIBLE_PIDS+=("$pid")
    fi
  done

  if [ "${#ELIGIBLE_PIDS[@]}" -gt 0 ]; then
    error "Porta $port ainda ocupada por PIDs elegíveis: ${ELIGIBLE_PIDS[*]}"
    FAILURE=1
  elif [ "${#LISTEN_PIDS[@]}" -eq 0 ]; then
    info "Porta $port fechada."
  else
    warn "Porta $port segue ocupada por processo protegido:"
    for pid in "${PROTECTED_PIDS[@]}"; do
      warn "  PID $pid - $(command_for_pid "$pid")"
    done
  fi
done

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  info "Parando container do postgres local..."
  docker compose stop postgres >/dev/null 2>&1 || warn "Falha ao executar docker compose stop postgres."

  if docker ps --filter "name=^/${POSTGRES_CONTAINER}$" --format '{{.ID}}' | grep -q .; then
    error "Container ${POSTGRES_CONTAINER} continua em execução."
    FAILURE=1
  else
    info "Container ${POSTGRES_CONTAINER} parado."
  fi
else
  warn "Docker indisponível neste momento. Pulando parada do postgres."
fi

if [ "$FAILURE" -eq 0 ]; then
  rm -f "$STATE_FILE"
  info "Arquivo de estado removido."
  info "stop-local concluído com sucesso."
  exit 0
fi

error "stop-local concluído com pendências. Revise os erros acima."
exit 1
