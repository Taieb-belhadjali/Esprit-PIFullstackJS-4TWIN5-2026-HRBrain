# ─────────────────────────────────────────────
# Stage 1 — Build
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ─────────────────────────────────────────────
# Stage 2 — Production (nginx léger)
# ─────────────────────────────────────────────
FROM nginx:1.25-alpine AS production

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/dist /usr/share/nginx/html

# ARG permet de choisir la config nginx au moment du build :
#   Docker Compose : docker build .                        → nginx.conf (backend)
#   Kubernetes     : docker build --build-arg ENV=k8s .   → nginx.k8s.conf (backend-service)
ARG ENV=local
COPY nginx.conf       /etc/nginx/conf.d/nginx.local.conf
COPY nginx.k8s.conf   /etc/nginx/conf.d/nginx.k8s.conf
RUN if [ "$ENV" = "k8s" ]; then \
      cp /etc/nginx/conf.d/nginx.k8s.conf /etc/nginx/conf.d/default.conf; \
    else \
      cp /etc/nginx/conf.d/nginx.local.conf /etc/nginx/conf.d/default.conf; \
    fi && \
    rm /etc/nginx/conf.d/nginx.local.conf /etc/nginx/conf.d/nginx.k8s.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]
