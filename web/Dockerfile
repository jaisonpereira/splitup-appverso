FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY web/package.json web/
RUN npm ci --workspace=web --include-workspace-root

FROM node:20-alpine AS build
WORKDIR /app
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY package.json package-lock.json ./
COPY web/package.json web/
COPY --from=deps /app/node_modules /app/node_modules
COPY web ./web
RUN npm run build --workspace=web

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY web/package.json web/
RUN npm ci --omit=dev --workspace=web --include-workspace-root
COPY --from=build /app/web/.next /app/web/.next
COPY --from=build /app/web/public /app/web/public
EXPOSE 3000
CMD ["npm", "run", "start", "--workspace=web"]
