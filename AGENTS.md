# AGENTS

## Objetivo
Este repositorio usa workflows do GitHub Actions e Portainer para deploy do SplitUp na VPS.

## Fonte de dados de deploy
- Os dados de infraestrutura e variaveis de ambiente de producao devem estar em `vps.env` (ou no secret equivalente `VPS_ENV_FILE` no GitHub Actions).
- Em operacao, os segredos runtime da API podem ser definidos diretamente no Portainer (stack `splitup`), sem versionar valores reais.
- Nunca versionar segredos reais no repositorio.

## Estrutura atual da VPS (snapshot operacional)
- Docker Swarm ativo.
- Proxy ativo: Traefik (nao ha Nginx ativo no host).
- Portainer ativo em stack dedicada.
- PostgreSQL em modo nativo no host (porta `172.18.0.1:5432`), usado por outras aplicacoes.
- Stacks encontradas no servidor: `karaoke-backend`, `karaoke-frontend`, `karaoke-shared`, `portainer`, `traefik`.

## Regras de seguranca operacional
- Nao alterar as stacks existentes do Karaoke.
- Nao publicar portas host para o SplitUp; usar roteamento via Traefik.
- SSL deve ser garantido via Traefik + certresolver ja existente.
- Banco do SplitUp deve ser um database separado (`splitup_db`) no PostgreSQL compartilhado do host.

## OAuth Google em producao
- API runtime (Portainer): `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`.
- API CORS runtime (Portainer): `CORS_ORIGINS` (csv, ex.: `https://splitup.appverso.com.br`).
- Web build-time (GitHub Actions): `NEXT_PUBLIC_GOOGLE_CLIENT_ID` deve ser injetado via secret `WEB_NEXT_PUBLIC_GOOGLE_CLIENT_ID` no workflow `deploy-vps`.
- Variaveis `NEXT_PUBLIC_*` do frontend sao resolvidas no build da imagem e nao devem depender apenas de env runtime da stack.

## Inventario em runtime da VPS
- O inventario operacional deve ser mantido em `/opt/AGENTS.md` dentro da VPS.
- Esse arquivo e gerado/atualizado por `deploy/vps/scripts/generate-vps-agents.sh` via workflow.
- O workflow de deploy pode sincronizar o conteudo de `vps.env` para `/opt/splitup/vps.env` usando o secret `VPS_ENV_FILE`.

## Vinculo entre AGENTS (repo <-> VPS)
- AGENTS do projeto: `AGENTS.md` (este arquivo).
- AGENTS da VPS: `/opt/AGENTS.md`.
- O `/opt/AGENTS.md` deve sempre apontar de volta para este arquivo (`AGENTS.md`) e para o repositorio.
- Sempre que houver mudanca de infraestrutura/stack, atualizar ambos os lados:
  - localmente neste arquivo; e
  - na VPS via workflow `Update VPS AGENTS` (ou execucao direta do script `deploy/vps/scripts/generate-vps-agents.sh`).
