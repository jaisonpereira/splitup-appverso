# Deploy SplitUp na VPS

## Arquivos
- `stack.yml`: stack Swarm para Portainer (web + api)
- `vps.env.example`: exemplo de variáveis de ambiente de produção
- `sql/create_splitup_db.sql`: bootstrap idempotente do database
- `scripts/generate-vps-agents.sh`: gera inventário operacional em `/opt/AGENTS.md`

## Premissas da VPS
- Swarm ativo
- Traefik já existente e conectado na rede `KaraokeNet`
- SSL via `letsencryptresolver`
- PostgreSQL nativo no host em `172.18.0.1:5432`

## Bootstrap inicial (1x)
1. Criar `splitup_db` com workflow `bootstrap-host-postgres`.
2. Criar stack `splitup` no Portainer usando `deploy/vps/stack.yml`.
3. Definir env vars da stack com base em `vps.env` (ou `vps.env.example`).
4. Garantir que a stack está na rede externa `KaraokeNet`.

## Deploy contínuo
- Workflow `deploy-vps`:
  - build/push para GHCR
  - deploy via `PORTAINER_WEBHOOK_URL`
  - fallback: API do Portainer (`git/redeploy`)
  - sync opcional de `/opt/splitup/vps.env` usando secret `VPS_ENV_FILE`
  - healthcheck obrigatório dos domínios

## Segredos GitHub necessários
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
- `VPS_ENV_FILE` (opcional, para referência operacional)
