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
# Templates email .hbs : le glob nest-cli ne copie pas les fichiers à plat →
# on les copie explicitement dans dist pour que le mailer les trouve.
COPY --from=builder /app/src/mail/templates ./dist/mail/templates
# Scripts utilitaires (seed, etc.) disponibles dans l'image de production.
COPY --from=builder /app/scripts ./scripts
EXPOSE 3001
CMD ["node", "dist/main"]
