# 0xG — portfolio

A single-page [three.js](https://threejs.org/) portfolio for **0xG** (XR /
creative technologist / artist). Projects are rendered as a **constellation**: a
central circle with a glyph node per project around its radius, in chronological
order. Selecting one slides the ring aside and opens that project's horizontal
card carousel (description → media → CTA + QR). The index is **projects +
navigation only** — the work is the content.

🔗 **Live:** https://0xg-portfolio.fly.dev/ (domain `0xg.gg` deferred)

---

## Stack

| Concern | Choice |
|---|---|
| Build | **Vite + React 18 + TypeScript** (static SPA, no SSR) |
| 3D | **three.js** via `@react-three/fiber` + `drei` + `postprocessing` (bloom) |
| State | `zustand` (one store, read from `useFrame` and the DOM alike) |
| Styling | **CSS Modules** + `src/styles/tokens.css` (no Tailwind) |
| Content | per-item **`index.mdx`** (frontmatter + markdown) → typed generated manifest |
| Media | `sharp` (images) + `ffmpeg` (video) + `qrcode` — build-time only |
| Runtime | **Node 24.11.0** (asdf `.tool-versions`), npm |
| Hosting | static `dist/` → **Caddy** on **fly.io** (`0xg-portfolio`) |

## Navigation

- **Orbital keycap D-pad** (center-bottom) + arrow keys: **↑ / ↓** step the
  project (wraps through the index), **← / →** page the open project's cards.
- Touch: swipe up/down (project) and left/right (cards), anywhere — including over
  media.
- **Path routing with history:** `/` (index), `/<slug>` (project), `/<slug>/<n>`
  (card `n`; out of bounds → 0), `/whoami` (about). Each project's QR encodes its
  `/<slug>` URL.

## Develop

```bash
asdf install            # Node 24.11.0 (or use your own Node 24)
npm install
npm run content         # build the content pipeline (needs sharp; ffmpeg for video)
npm run dev             # Vite dev server
```

Scripts:

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run content` | Run the content pipeline → optimized `public/assets` + generated manifest |
| `npm run content:force` | Same, re-processing all media |
| `npm run build` | `content` then `vite build` → `dist/` |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run models` | Publish per-project GLB wireframes to `public/assets/models` |

## Content

Content is data-driven and authored as MDX, then compiled into a typed manifest
(`src/lib/content/manifest.generated.ts` — **generated, don't hand-edit**).

```
content/
  projects/<YYYY_NNNN_slug_collaborator>/
    index.mdx     # frontmatter (code, slug, title, role/place/date, links, media…) + prose
    imports/      # raw source media (NOT shipped — gitignored)
    model.glb     # optional per-project 3D wireframe
  whoami/index.mdx  # the /whoami about page (title, lead + `##` sections)
```

`npm run content` discovers each `index.mdx`, optimizes its `imports/` media into
`/assets/<code>/…` (AVIF/WebP + blur placeholder; H.264 mp4 + WebM + poster, plus
a higher-quality variant served only on fullscreen), generates a QR SVG for the
deep link, and emits the manifest (`PROJECTS` + `ABOUT`). **To change copy, edit
the `index.mdx` and re-run `npm run content`.**

Media paths are always `/assets/<code>/<name>.<ext>` — identical in dev (served
from a local dir) and prod. Source `imports/` and the optimized `public/assets`
are both gitignored; assets are baked into the deploy image.

## Deploy

Static `dist/` served by Caddy in a small Docker image on fly.io app
**`0xg-portfolio`** (region `fra`, scale-to-zero). The build context bakes the
local `public/assets` (gitignored) into the image — so the Docker build runs
`vite build` only, **not** the content pipeline.

```bash
fly deploy --now
```

`SITE_URL` (default `https://0xg.gg`) only affects the QR deep-link origin — the
app itself is domain-agnostic (URLs come from `location`).

> Git and the deploy are independent: pushing to GitHub does not deploy, and
> `fly deploy` builds from the local working directory.

---

Built with [Claude Code](https://claude.com/claude-code).
