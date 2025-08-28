# ====== Builder ======
FROM node:20-alpine AS builder

WORKDIR /app

# 1) Instala TODAS las dependencias (incluye dev) para poder ejecutar vite build
COPY package*.json ./
RUN npm ci

# 2) Copia el código y construye
COPY . .
RUN npm run build

# ====== Production (Node runtime) ======
# Si tu app es SSR o necesitas Node para servir (por ejemplo, Express):
FROM node:20-alpine AS production

# Opcional pero útil
RUN apk add --no-cache dumb-init

# Usuario no-root
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
WORKDIR /app

# 3) Instala SOLO deps de producción
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force || true

# 4) Copia artefactos del build
COPY --from=builder /app/dist ./dist

USER nextjs
EXPOSE 3000
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Ajusta este comando a cómo sirves tu app:
# - Si es SSR:   "node dist/server.js"
# - Si es SPA:   cambia a la variante NGINX de abajo
CMD ["node", "dist/server.js"]

