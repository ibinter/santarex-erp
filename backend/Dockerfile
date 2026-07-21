FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine AS production
WORKDIR /app
# postgresql-client fournit pg_dump / pg_restore pour le module Sauvegardes.
RUN apk add --no-cache postgresql-client
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
# Scripts utilitaires (seed, etc.) disponibles dans l'image de production.
COPY --from=builder /app/scripts ./scripts
EXPOSE 3001
CMD ["node", "dist/main"]
