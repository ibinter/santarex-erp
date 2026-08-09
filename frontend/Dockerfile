FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
# URL de la démo publique (§8.3) : si définie au build, le bouton
# « Explorer la démo » apparaît sur la vitrine (§4.7 : sinon masqué).
ARG NEXT_PUBLIC_DEMO_URL
ENV NEXT_PUBLIC_DEMO_URL=$NEXT_PUBLIC_DEMO_URL
RUN mkdir -p public && npm run build

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# Messages i18n par namespace : lus via fs au runtime (process.cwd()/messages),
# donc NON tracés par le build standalone → il faut les copier explicitement,
# sinon les pages traduites affichent les clés au lieu du texte.
COPY --from=builder /app/messages ./messages
EXPOSE 3000
CMD ["node", "server.js"]
