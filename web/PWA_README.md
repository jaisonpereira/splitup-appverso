# PWA - Progressive Web App

## ✨ Recursos Implementados

A aplicação SplitUp agora é um **Progressive Web App (PWA)** com os seguintes recursos:

### 📱 Instalável

- Pode ser instalado em dispositivos móveis (Android/iOS)
- Pode ser instalado no desktop (Windows/Mac/Linux)
- Ícone na tela inicial
- Experiência nativa semelhante a um app

### 🔄 Service Worker

- Cache automático de recursos estáticos
- Funcionalidade offline básica
- Atualizações automáticas em segundo plano
- Melhor performance

### 🎨 Manifest

- Ícones em múltiplos tamanhos (72px até 512px)
- Splash screens automáticas
- Tema e cores personalizados
- Atalhos de aplicativo

## 🚀 Como Instalar

### No Desktop (Chrome/Edge)

1. Acesse a aplicação em produção
2. Procure o ícone de instalação (+) na barra de endereços
3. Clique em "Instalar" no prompt
4. O app aparecerá como aplicativo standalone

### No Mobile (Android)

1. Acesse a aplicação no Chrome/Edge
2. Toque no menu (⋮)
3. Selecione "Adicionar à tela inicial" ou "Instalar app"
4. Confirme a instalação

### No Mobile (iOS/Safari)

1. Acesse a aplicação no Safari
2. Toque no botão de compartilhar (⬆️)
3. Role e selecione "Adicionar à Tela de Início"
4. Confirme

## 🧪 Testando Localmente

### 1. Build de Produção

O PWA só funciona em modo de produção. Para testar:

```bash
# Na pasta web/
npm run build
npm run start
```

### 2. Abrir no Navegador

Acesse: http://localhost:3000

### 3. Verificar PWA

No Chrome DevTools:

- Abra DevTools (F12)
- Vá na aba "Application" / "Aplicativo"
- Verifique:
  - ✅ Manifest
  - ✅ Service Worker
  - ✅ Icons

## 📊 Cache Strategy

O next-pwa usa a seguinte estratégia:

- **Precaching**: Arquivos estáticos (JS, CSS, imagens)
- **Runtime Caching**: Requisições de API e recursos dinâmicos
- **Network First**: Para páginas HTML
- **Cache First**: Para assets estáticos

## 🔧 Configuração

### Service Worker

Configurado em `next.config.js`:

- Destino: `public/`
- Registro automático
- Skip waiting habilitado
- Desabilitado em desenvolvimento

### Manifest

Localizado em `public/manifest.json`:

- Nome: SplitUp
- Display: standalone
- Theme color: #1976d2
- Ícones: 72px até 512px
- Shortcuts: Nova Despesa, Meus Grupos

## 🎯 Recursos PWA Disponíveis

- ✅ Instalável
- ✅ Offline básico
- ✅ Service Worker
- ✅ Manifest
- ✅ Ícones adaptáveis
- ✅ Theme color
- ✅ Splash screens
- ✅ Atalhos de aplicativo
- ⚠️ Push notifications (não implementado)
- ⚠️ Background sync (não implementado)

## 📝 Próximos Passos

Para melhorar ainda mais o PWA:

1. **Notificações Push**: Implementar Web Push API
2. **Background Sync**: Sincronizar dados offline
3. **App Shortcuts**: Adicionar mais atalhos úteis
4. **Share Target**: Receber dados de outros apps
5. **Periodic Background Sync**: Atualizar dados periodicamente

## 🔍 Debugging

### Limpar Cache do Service Worker

No Chrome DevTools:

1. Application > Service Workers
2. Clique em "Unregister"
3. Application > Clear storage
4. Clique em "Clear site data"

### Verificar Manifest

No Chrome DevTools:

1. Application > Manifest
2. Verifique todos os campos e ícones

## 📚 Recursos Úteis

- [next-pwa Documentation](https://github.com/shadowwalker/next-pwa)
- [PWA Builder](https://www.pwabuilder.com/)
- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)

## 🎨 Personalizar Ícones

Para criar ícones personalizados:

1. Edite `public/icons/icon.svg`
2. Execute: `powershell -ExecutionPolicy Bypass -File generate.ps1`
3. Ou use ferramentas online:
   - [Favicon Generator](https://realfavicongenerator.net/)
   - [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)

## ⚡ Performance

Com PWA habilitado:

- ⚡ Carregamento mais rápido
- 📉 Menos consumo de dados
- 🔄 Atualizações em background
- 📱 Experiência nativa
