# --- build the static site -------------------------------------------------
# Uses the LOCAL public/assets (git-ignored, but present in the build context)
# + the committed manifest. Runs `vite build` only (the content pipeline that
# reads imports/ is a local step you run when media changes — see DEPLOY.md).
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx vite build

# --- serve the static dist/ with Caddy -------------------------------------
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
EXPOSE 80
