# AGENTS

## Objetivo
Este repositório usa workflows do GitHub Actions e Portainer para deploy do SplitUp na VPS.

## Fonte de dados de deploy
- Os dados de infraestrutura e variáveis de ambiente de produção devem estar em `vps.env` (ou no secret equivalente `VPS_ENV_FILE` no GitHub Actions).
- Nunca versionar segredos reais no repositório.

## Estrutura atual da VPS (snapshot operacional)
- Docker Swarm ativo.
- Proxy ativo: Traefik (não há Nginx ativo no host).
- Portainer ativo em stack dedicada.
- PostgreSQL em modo nativo no host (porta `172.18.0.1:5432`), usado por outras aplicações.
- Stacks encontradas no servidor: `karaoke-backend`, `karaoke-frontend`, `karaoke-shared`, `portainer`, `traefik`.

## Regras de segurança operacional
- Não alterar as stacks existentes do Karaoke.
- Não publicar portas host para o SplitUp; usar roteamento via Traefik.
- SSL deve ser garantido via Traefik + certresolver já existente.
- Banco do SplitUp deve ser um database separado (`splitup_db`) no PostgreSQL compartilhado do host.

## Inventário em runtime da VPS
- O inventário operacional deve ser mantido em `/opt/AGENTS.md` dentro da VPS.
- Esse arquivo é gerado/atualizado por `deploy/vps/scripts/generate-vps-agents.sh` via workflow.
- O workflow de deploy pode sincronizar o conteúdo de `vps.env` para `/opt/splitup/vps.env` usando o secret `VPS_ENV_FILE`.

## Vínculo entre AGENTS (repo <-> VPS)
- AGENTS do projeto: `AGENTS.md` (este arquivo).
- AGENTS da VPS: `/opt/AGENTS.md`.
- O `/opt/AGENTS.md` deve sempre apontar de volta para este arquivo (`AGENTS.md`) e para o repositório.
- Sempre que houver mudança de infraestrutura/stack, atualizar ambos os lados:
  - localmente neste arquivo; e
  - na VPS via workflow `Update VPS AGENTS` (ou execução direta do script `deploy/vps/scripts/generate-vps-agents.sh`).
