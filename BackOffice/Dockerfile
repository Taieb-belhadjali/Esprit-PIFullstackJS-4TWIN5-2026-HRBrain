# ─────────────────────────────────────────────
# Stage 1 — Build
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Disable AES hardware acceleration (fixes ERR_SSL_CIPHER_OPERATION_FAILED on VMs)
ENV OPENSSL_ia32cap="~0x200000200000000"

# Copier uniquement les fichiers de dépendances d'abord (cache layer)
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Installer toutes les dépendances (dev incluses pour le build)
RUN npm ci

# Copier le code source
COPY src/ ./src/

# Compiler TypeScript → dist/
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2 — Production
# ─────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app

# Disable AES hardware acceleration (fixes ERR_SSL_CIPHER_OPERATION_FAILED on VMs)
ENV OPENSSL_ia32cap="~0x200000200000000"

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copier uniquement les dépendances de production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copier le build compilé depuis le stage builder
COPY --from=builder /app/dist ./dist

# Copier les ressources nécessaires au runtime
COPY prompts/ ./prompts/

# Créer les dossiers nécessaires avec les bons droits
RUN mkdir -p uploads logs && chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/main"]
