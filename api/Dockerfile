FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json ./
COPY api/package.json api/
RUN npm ci --workspace=api --include-workspace-root

FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json ./
COPY api/package.json api/
COPY --from=deps /app/node_modules /app/node_modules
COPY api ./api
RUN npx prisma generate --schema=api/prisma/schema.prisma
RUN npm run build --workspace=api

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl
COPY package.json package-lock.json ./
COPY api/package.json api/
RUN npm ci --omit=dev --workspace=api --include-workspace-root
COPY --from=build /app/api/dist /app/api/dist
COPY --from=build /app/api/prisma /app/api/prisma
COPY --from=build /app/api/src /app/api/src
RUN npx prisma generate --schema=api/prisma/schema.prisma
EXPOSE 5000
CMD ["node", "api/dist/index.js"]
