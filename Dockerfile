# syntax=docker/dockerfile:1
FROM node:26-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --ignore-scripts

COPY . .

# Vide = l'application appelle /api sur sa propre origine (proxy nginx).
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime

LABEL org.opencontainers.image.title="momentum-frontend" \
      org.opencontainers.image.description="Interface web Momentum servie par nginx"

# Adresse de l'API et DNS utilisés par le proxy /api (surchargeables au lancement).
ENV API_UPSTREAM=http://api:8080 \
    DNS_RESOLVER=127.0.0.11

COPY --from=build --chown=101:101 /app/dist/ /usr/share/nginx/html/
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template

USER 101
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["wget", "--quiet", "--tries=1", "--spider", "http://127.0.0.1:8080/health"]