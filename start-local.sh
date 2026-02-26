#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

POSTGRES_CONTAINER="splitup-postgres"
POSTGRES_USER="splitup"
POSTGRES_PASSWORD="splitup_password"
POSTGRES_DB="splitup_db"
DB_READY_TIMEOUT=60
DEFAULT_WEB_PORT=3000
DEFAULT_API_PORT=5000
PROJECT_ID="$(printf '%s' "$SCRIPT_DIR" | cksum | awk '{print $1}')"
STATE_FILE="${TMPDIR:-/tmp}/splitup-local-${PROJECT_ID}.state"
LOG_DIR="$SCRIPT_DIR/logs"
WEB_LOG_FILE="$LOG_DIR/frontend.log"
API_LOG_FILE="$LOG_DIR/backend.log"

info() {
  printf '[INFO] %s\n' "$1"
}

error() {
  printf '[ERROR] %s\n' "$1" >&2
}

require_command() {
  local command_name="$1"
  if ! command -v "$command_name" >/dev/null 2>&1; then
    error "Comando obrigatório não encontrado: $command_name"
    exit 1
  fi
}

is_port_in_use() {
  local port="$1"

  if command -v lsof >/dev/null 2>&1; then
    lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
    return $?
  fi

  if command -v ss >/dev/null 2>&1; then
    ss -ltn "( sport = :$port )" 2>/dev/null | grep -q LISTEN
    return $?
  fi

  return 1
}

next_free_port() {
  local port="$1"
  while is_port_in_use "$port"; do
    port=$((port + 1))
  done
  printf '%s\n' "$port"
}

require_command docker
require_command npm

if ! docker compose version >/dev/null 2>&1; then
  error "docker compose (v2) não está disponível."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  error "Docker daemon indisponível. Inicie o Docker Desktop e tente novamente."
  exit 1
fi

if [ ! -f "api/.env" ]; then
  if [ -f "api/.env.example" ]; then
    info "api/.env não encontrado. Criando a partir de api/.env.example."
    cp "api/.env.example" "api/.env"
  else
    error "api/.env e api/.env.example não encontrados."
    exit 1
  fi
fi

if ! npm ls concurrently --depth=0 >/dev/null 2>&1; then
  info "Dependências npm ausentes/incompletas. Executando npm install..."
  npm install
fi

info "Gerando Prisma Client da API..."
npm run prisma:generate --workspace=api

POSTGRES_RUNNING="$(docker inspect -f '{{.State.Running}}' "$POSTGRES_CONTAINER" 2>/dev/null || true)"
if [ "$POSTGRES_RUNNING" != "true" ]; then
  info "Container $POSTGRES_CONTAINER não está rodando. Subindo postgres..."
  docker compose up -d postgres
else
  info "Container $POSTGRES_CONTAINER já está rodando."
fi

info "Aguardando Postgres ficar pronto..."
START_TIME="$(date +%s)"
until docker exec "$POSTGRES_CONTAINER" pg_isready -U "$POSTGRES_USER" -d postgres >/dev/null 2>&1; do
  NOW="$(date +%s)"
  ELAPSED="$((NOW - START_TIME))"
  if [ "$ELAPSED" -ge "$DB_READY_TIMEOUT" ]; then
    error "Timeout aguardando Postgres após ${DB_READY_TIMEOUT}s."
    exit 1
  fi
  sleep 2
done
info "Postgres pronto."

DB_EXISTS="$(
  docker exec \
    -e PGPASSWORD="$POSTGRES_PASSWORD" \
    "$POSTGRES_CONTAINER" \
    psql -U "$POSTGRES_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${POSTGRES_DB}'"
)"

if [ "$DB_EXISTS" = "1" ]; then
  info "Database ${POSTGRES_DB} já existe."
else
  info "Criando database ${POSTGRES_DB}..."
  docker exec \
    -e PGPASSWORD="$POSTGRES_PASSWORD" \
    "$POSTGRES_CONTAINER" \
    psql -U "$POSTGRES_USER" -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE ${POSTGRES_DB};"
  info "Database ${POSTGRES_DB} criada."
fi

WEB_PORT="$(next_free_port "$DEFAULT_WEB_PORT")"
API_PORT="$(next_free_port "$DEFAULT_API_PORT")"

if [ "$WEB_PORT" != "$DEFAULT_WEB_PORT" ]; then
  info "Porta ${DEFAULT_WEB_PORT} ocupada. Web será iniciada na porta ${WEB_PORT}."
else
  info "Web será iniciada na porta ${WEB_PORT}."
fi

if [ "$API_PORT" != "$DEFAULT_API_PORT" ]; then
  info "Porta ${DEFAULT_API_PORT} ocupada. API será iniciada na porta ${API_PORT}."
else
  info "API será iniciada na porta ${API_PORT}."
fi

API_BASE_URL="http://localhost:${API_PORT}"
STARTED_AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

cat >"$STATE_FILE" <<EOF
WEB_PORT=$WEB_PORT
API_PORT=$API_PORT
POSTGRES_CONTAINER=$POSTGRES_CONTAINER
PROJECT_ROOT=$SCRIPT_DIR
STARTED_AT=$STARTED_AT
EOF
info "Estado local salvo em $STATE_FILE"

mkdir -p "$LOG_DIR"
: > "$WEB_LOG_FILE"
: > "$API_LOG_FILE"
info "Logs serão gravados em:"
info "  Frontend: $WEB_LOG_FILE"
info "  Backend:  $API_LOG_FILE"

info "Iniciando frontend + backend..."
exec npm exec concurrently -- \
  "NEXT_PUBLIC_API_URL=$API_BASE_URL npm run dev --workspace=web -- --port $WEB_PORT 2>&1 | tee -a '$WEB_LOG_FILE'" \
  "PORT=$API_PORT npm run dev --workspace=api 2>&1 | tee -a '$API_LOG_FILE'"
