# Deploy (fly.io)

Static Vite build served by Caddy. **`fly deploy` builds from your local folder**
(it obeys `.dockerignore`, not `.gitignore`), so the git-ignored `public/assets`
is included and baked into the image. **Nothing media-related goes through git,
and the `/assets/<code>/…` links never change.**

## One-time

```bash
fly launch --no-deploy      # creates the app (keep app name 0xg-portfolio)
# DNS/custom domain later: fly certs add 0xg.gg
```

## Every deploy

```bash
# 1. ONLY when you've added/replaced media in a project's imports/:
SITE_URL=https://0xg.gg npm run content   # regenerates public/assets + manifest
npm run models                            # (only if you changed a project's model.glb)

# 2. deploy (ships your local dir incl. public/assets):
fly deploy
```

### Domain (`SITE_URL`)

The site's own domain is **not hardcoded** — it only feeds the **QR deep links**
(`https://<domain>/#<slug>`), which are baked when you run `npm run content`. The
app itself is domain-agnostic at runtime (deep links use `location.hash`).

```bash
SITE_URL=https://0xg.gg npm run content          # production domain
SITE_URL=https://0xg-portfolio.fly.dev npm run content   # before the custom domain
```

Defaults to `https://0xg.gg` if unset. Set it, run `content`, then `fly deploy`.
(The QR is generated at content-time, not in the Docker build, so it's a local
step — `fly deploy` only runs `vite build`.)

`git commit && git push` is independent — just source backup (code + manifest).
You do **not** need to push before deploying.

## What goes where

- `imports/` (raw originals) — local only, never in the image or prod. Build-time
  input to `npm run content`. Optionally back them up to a bucket; they are not
  needed to run the site.
- `public/assets/<code>/…` (optimized) — generated locally, baked into the image
  by `vite build`, served by Caddy at `/assets/…`.
- `dist/` — the built static site (`vite build` output) copied into the Caddy image.

## Notes

- Image build runs `vite build` only (not the content pipeline — that needs the
  large `imports/` + ffmpeg and is a deliberate local step).
- `fly deploy --local-only` builds on your machine instead of uploading the
  context to fly's remote builder (faster if your assets are large).
