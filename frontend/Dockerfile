# ── Stage 1: builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN npm ci

COPY . .

# Vite bakes these into the bundle at build time
ARG VITE_API_BASE_URL
ARG VITE_GOOGLE_MAPS_API_KEY
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_SENTRY_DSN
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY \
    VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID \
    VITE_SENTRY_DSN=$VITE_SENTRY_DSN

RUN npm run build

# ── Stage 2: runtime (nginx) ─────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user and grant access to all nginx-writable paths
RUN addgroup -S ptrack && adduser -S ptrack -G ptrack \
    && mkdir -p /var/cache/nginx /var/log/nginx /tmp/client_body \
                /tmp/proxy_temp /tmp/fastcgi_temp /tmp/uwsgi_temp /tmp/scgi_temp \
    && chown -R ptrack:ptrack \
        /usr/share/nginx/html \
        /var/cache/nginx \
        /var/log/nginx \
        /tmp/client_body /tmp/proxy_temp /tmp/fastcgi_temp \
        /tmp/uwsgi_temp /tmp/scgi_temp \
    && touch /var/run/nginx.pid \
    && chown ptrack:ptrack /var/run/nginx.pid

USER ptrack

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]