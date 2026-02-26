# SplitUp

A monorepo application for expense splitting with authentication.

## Structure

- `web/` - Next.js frontend with Material-UI
- `api/` - Express backend API

## Features

- Email/Password authentication
- OAuth integration (Google, Facebook)
- Modern UI with Material-UI
- **Progressive Web App (PWA)** - Instalável em dispositivos móveis e desktop
- Service Worker para funcionalidade offline
- Ícones e manifest personalizados

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Start development servers:

```bash
npm run dev
```

This will start both the web app (http://localhost:3000) and API (http://localhost:5000).

## Development

- `npm run dev` - Start both web and api in development mode
- `npm run dev:web` - Start only web app
- `npm run dev:api` - Start only API
- `npm run build` - Build both projects
