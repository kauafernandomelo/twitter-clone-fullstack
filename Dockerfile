# syntax=docker/dockerfile:1

# ---------- build: instala tudo, compila front e API ----------
FROM node:24-bookworm-slim AS build
WORKDIR /app

# 1) manifestos primeiro: a camada do npm ci fica em cache enquanto as dependências não mudam
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
# o postinstall da API roda "prisma generate", que precisa do schema
COPY apps/api/prisma apps/api/prisma
COPY apps/api/prisma.config.ts apps/api/
# a config do Prisma lê DATABASE_URL; no build não há banco, então um valor qualquer basta
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build"
RUN npm ci

# 2) código e build
COPY . .
RUN npm run build -w @twitter-clone/web \
  && npm run build -w @twitter-clone/api \
  && npm prune --omit=dev \
  && mkdir -p apps/api/node_modules

# ---------- runtime: só o que roda em produção ----------
FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production \
    PORT=3333 \
    WEB_DIST_DIR=/app/apps/web/dist
WORKDIR /app

COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/apps/api/package.json ./apps/api/
COPY --from=build --chown=node:node /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build --chown=node:node /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=node:node /app/apps/api/prisma ./apps/api/prisma
COPY --from=build --chown=node:node /app/apps/api/prisma.config.ts ./apps/api/
COPY --from=build --chown=node:node /app/apps/web/dist ./apps/web/dist

# nunca rodar como root dentro do container
USER node
WORKDIR /app/apps/api
EXPOSE 3333

# aplica as migrations pendentes e sobe a API (que também serve o front)
CMD ["sh", "-c", "npx prisma migrate deploy && exec node dist/server.mjs"]
