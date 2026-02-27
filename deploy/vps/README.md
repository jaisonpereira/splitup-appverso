# Deploy SplitUp na VPS

## Arquivos
- `stack.yml`: stack Swarm para Portainer (web + api)
- `vps.env.example`: exemplo de variaveis de ambiente de producao
- `sql/create_splitup_db.sql`: bootstrap idempotente do database
- `scripts/generate-vps-agents.sh`: gera inventario operacional em `/opt/AGENTS.md`

## Premissas da VPS
- Swarm ativo
- Traefik ja existente e conectado na rede `KaraokeNet`
- SSL via `letsencryptresolver`
- PostgreSQL nativo no host em `172.18.0.1:5432`

## Bootstrap inicial (1x)
1. Criar `splitup_db` com workflow `bootstrap-host-postgres`.
2. Criar stack `splitup` no Portainer usando `deploy/vps/stack.yml`.
3. Definir env vars da stack no Portainer com base em `vps.env` (ou `vps.env.example`).
4. Garantir que a stack esta na rede externa `KaraokeNet`.

## Variaveis importantes
- Runtime da API (Portainer):
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `CORS_ORIGINS` (csv, ex.: `https://splitup.appverso.com.br`)
- Build da imagem web (GitHub Actions):
  - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` via secret `WEB_NEXT_PUBLIC_GOOGLE_CLIENT_ID`

## Deploy continuo
- Workflow `deploy-vps`:
  - build/push para GHCR
  - build da imagem web com `NEXT_PUBLIC_GOOGLE_CLIENT_ID` via secret GitHub
  - deploy via `PORTAINER_WEBHOOK_URL`
  - fallback: API do Portainer (`git/redeploy`)
  - sync opcional de `/opt/splitup/vps.env` usando secret `VPS_ENV_FILE`
  - healthcheck obrigatorio dos dominios

## Segredos GitHub necessarios
- `VPS_HOST`
- `VPS_USER`
- `VPS_SSH_KEY`
- `GHCR_USERNAME`
- `GHCR_PAT`
- `PORTAINER_WEBHOOK_URL`
- `PORTAINER_URL`
- `PORTAINER_STACK_ID`
- `PORTAINER_ENDPOINT_ID`
- `PORTAINER_API_TOKEN`
- `WEB_NEXT_PUBLIC_GOOGLE_CLIENT_ID` (obrigatorio para Google OAuth no frontend em producao)
- `VPS_ENV_FILE` (opcional, para referencia operacional)
