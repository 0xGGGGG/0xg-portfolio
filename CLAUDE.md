# 0xG Portfolio — Project Guide

> Single-page Three.js portfolio for **0xG** (XR / creative technologist / artist).
> Hosted (eventually) at **https://0xg.gg**. This file is the source of truth for
> conventions; read it first each session.

## What this is

A **single page** that renders 0xG's projects as a **constellation**: a central
circle with **diamond icon-blocks around its radius**, one per project, in
chronological order. You move through projects the way you move through
**samspratt.com** — a radial, snap-stepped progression (see *Interaction* below).
Selecting a project slides the circle aside and opens that project's
**horizontal card carousel** (description → media → CTA + QR).

**The index is projects + navigation ONLY** — no bio, no about, no who/what copy.
The work is the content.

Content is data-driven: each project is a directory under `content/projects/`
with a hand-written `README.md` + raw `imports/` media. A build-time pipeline
turns that into an `index.mdx` + a typed manifest that feeds both the 3D scene and
the DOM sections.

## Stack (locked)

| Concern | Choice | Why |
|---|---|---|
| Build / framework | **Vite + React + TypeScript** | Static single-page app; no SSR/RSC/file-routing/image-opt needed. Lighter + faster HMR than Next. |
| 3D | **three.js** via `@react-three/fiber` + `@react-three/drei` + `@react-three/postprocessing` | Declarative R3F; drei helpers; postprocessing for the signature bloom. |
| Smooth input / state | `lenis` (smooth wheel/touch) + `zustand` (shared store) | One store readable from both `useFrame` and DOM React. |
| Styling | **CSS Modules + `src/styles/tokens.css`** | Ports 0xGCG's bespoke look 1:1. No Tailwind. |
| Content | **per-project `index.mdx` + zod frontmatter**, MDX via `@mdx-js/rollup` | Structured metadata + prose; validated at build. |
| Media | `sharp` (images) + `ffmpeg` (video), content-time only | Pre-optimized; never shipped from source. |
| QR | `qrcode` → build-time SVG | Zero runtime JS. |
| Runtime | **Node 24.11.0** (asdf `.tool-versions`), npm | — |
| Hosting | static `dist/` → **Caddy** on **fly.io `0xg-portfolio`**, Tigris volume at `/assets` | Cheapest for static + heavy media. Domain deferred. |

## Directory map

```
index.html  vite.config.ts  tsconfig.json  package.json  .tool-versions
src/
  main.tsx  App.tsx
  components/scene/      SceneCanvas, Constellation, Diamond, CircleCore,
                        CurrentMarker, Starfield, PostFX, sceneConfig
  components/sections/   ProjectSections, ProjectSection, Carousel, cards/*
  components/ui/         Topbar, Brand, Pill, Panel, Marker, QrCode, Media, CrtOverlay
  lib/content/           schema.ts, manifest.generated.ts (GENERATED), manifest.ts
  lib/scroll/            store.ts, useLenis.ts, mapping.ts
  lib/geometry/ring.ts   lib/assets.ts
  styles/                tokens.css, global.css
content/projects/<YYYY_NNNN_slug_collab>/
  README.md              hand-written source (kept)
  imports/               raw media source (NOT shipped, git-ignored from deploy)
  index.mdx              GENERATED draft, then hand-edited (frontmatter + prose)
scripts/                 build-content, scaffold-mdx, optimize-images,
                        transcode-video, gen-qr, sync-assets, extract-todos (.mjs)
public/                  static; /assets = Tigris volume in prod, local dir in dev
Caddyfile  Dockerfile  fly.toml
__resources__/0xgcg-ref/      0xGCG visual reference screenshots
__resources__/samspratt-ref/  samspratt.com navigation reference screenshots
```

`lib/content/manifest.generated.ts` and each `index.mdx` are pipeline output —
`manifest.generated.ts` is fully generated (don't hand-edit); `index.mdx` is a
generated draft you then hand-edit.

## The signature interaction

Modeled on **samspratt.com** (a fixed-viewport, scroll-driven *state machine*, not
a tall scrolling page — see `__resources__/samspratt-ref/`). Adapted: samspratt is
a linear narrative (BEGIN gate, ordered chapters, autoplay); a portfolio is
**non-linear peers**, so we keep the radial snap but **drop the gate, the forced
order, and autoplay** — any diamond is directly reachable.

- **One source of truth: a normalized playhead / active index** in the zustand
  store. Wheel/trackpad/touch-drag, arrow keys, and diamond clicks **all drive that
  one value**. Ring rotation and the circle's aside-offset are **pure functions** of
  it, applied in `useFrame` via `MathUtils.damp` — so there is **no feedback loop**.
- **Stepped, snap-settling feel** (samspratt's, not free inertial spin): input is
  rate-limited so roughly one intent = advance one project; the ring eases so the
  active diamond rotates to a **fixed marker** (top-center / 3-o'clock toward the
  content). `ring.ts`: `baseAngle(i) = -PI/2 + i*TAU/n` (top, clockwise — ported
  from 0xGCG `circularPlayer.js`).
- **Active diamond** gets a **selection ring + bright glow**; neighbors dim/scale
  down. A persistent **position indicator** (ticks around the circle or `03 / 06`
  counter) keeps you oriented.
- **Two-tier reveal**: overview ring → select → circle slides **aside** (left on
  ≥760px, **top** on mobile) → the project's **horizontal carousel** opens. The two
  motions are **orthogonal**: ring = rotational, open project = horizontal — when a
  project is open, horizontal input pages its carousel; at ring level, input rotates
  the ring (`data-lenis-prevent` on the carousel track so they don't fight).
- **Per-project background tint** shifts to the active project's accent (cheap,
  high-impact; lifted from samspratt).
- **Deep links** are hash-based (`/#<slug>`); on load resolve slug → index and snap
  there. (A path router for samspratt-style `/n/i` URLs is a later option.)
- **Mobile**: collapse the rotating ring to **one focal diamond at a time** + a
  **bottom transport** (prev/next + a scrubber), rather than rendering the full
  wheel on a phone.
- **Reduced motion**: fall back to native scroll, snap instantly, keep diamonds
  tappable. The DOM sections are always a usable fallback if WebGL fails.

## Design system (ported from 0xGCG)

See `__resources__/0xgcg-ref/`. The world is **pitch-black, near-monochrome**; the
only saturated color is **one accent per project** (its diamond glow + card rail +
tint). **Bloom/glow is the only decoration** — let it carry richness, not gradients
or imagery.

`src/styles/tokens.css`:
```
--bg:#000; --ink:#e6e6e6; --dim:#888; --accent:#d6d6d6;
--font-mono:"SF Mono",ui-monospace,Menlo,Consolas,monospace;
--glow-sm:0 0 12px; --glow-md:0 0 18px var(--accent); --glow-lg:0 0 24px #fff;
--panel-bg:linear-gradient(180deg,rgba(8,12,20,.78),rgba(8,12,20,.55));
--panel-border:rgba(180,180,180,.16); --blur:10px;
--radius:4px; --pill-radius:99px; --bp-aside:760px;
/* temporal gradient endpoints for diamond hue = lerp by ordinal (cool -> warm) */
--ring-cool:#27e0a0; --ring-warm:#ff2bd6;
```
(0xGCG sets `body{overflow:hidden}` — **dropped**, this site scrolls/steps.)

**Diamond colors = a temporal gradient**: each diamond's hue is derived from its
`ordinal` (year/seq order) lerped cool→warm across the ring. **No manual color
tagging.** (0xGCG's own stage palette for reference: INIT `#5b7184`, GROW
`#27e0a0`, OPTIMIZE `#8be84b`, OVERFIT `#e0742a`, GLITCH `#ff2bd6`.)

**Typography**: one mono typeface everywhere. Chrome is **wide-tracked UPPERCASE**
(`letter-spacing .18–.34em`); tracking tightens as size grows (display `h1` ~.04em).
Body copy stays quiet (≥13px, `line-height 1.6`, mid-grey) — keep it ≥13px (0xGCG's
9.5–11px microcopy is too small). Lean into the **numbering ritual**: `03 / 06`,
coordinates, indices — the "instrument panel" identity.

**Component inventory** (mirror these from 0xGCG CSS):
- **`Pill`** — fully-rounded outlined chip (`border-radius:99px`, `1px
  rgba(255,255,255,.16)` border, faint fill). Used for tags, links, CTA, markers.
- **`Panel`** — the hallmark: **glass card with a 2px left accent rail**
  (`backdrop-filter:blur(10px)`, `--panel-bg` wash, `border-left:2px var(--c)`,
  `radius:4px`, `box-shadow:0 10px 50px rgba(0,0,0,.5)`). Enters `opacity 0→1 +
  translateY(14px)` over .5s. The project description card.
- **`Marker`** — the fixed current-project pointer + caption.
- **`Brand/Topbar`** — glowing `0xG` code (`mix-blend-mode:screen`).
- **Carousel scrubber** — reuse 0xGCG's **segmented ruler + sweeping playhead** and
  **step-pill row** as the per-project carousel progress/nav. Ensure the step row
  **wraps/scrolls** on mobile (0xGCG's clipped off-screen — don't repeat that).
- **`PostFX`** — `ACESFilmicToneMapping`, exposure ~0.9, `FogExp2` black,
  `UnrealBloom` (~0.3–0.5 strength). Keep WebGL minimal so it boots instantly — no
  multi-second CDN/model loads.

**Motion durations**: match 0xGCG — ~0.4–0.7s opacity+translate(+blur) on reveals,
0.12–0.2s on hover/active; damped eases for the circle-aside + project-in. Nothing
pops.

**Dropped from 0xGCG** (don't port): TTS + karaoke narration; hover-only discovery
(make project interactions explicit + **tap-friendly** — no hover on mobile); the
dense neuron-graph; the near-full-width tall mobile card; the cosmic-address ladder.

## Conventions

- **Project dir**: `YYYY_NNNN_slug_collaborator` (e.g. `2025_0001_relate_andrea`).
  `code = YYYY_NNNN`, `displayCode = YYYY.NNNN`, `slug` = clean deep-link target.
  Order on the ring = chronological `(year, seq)` = `ordinal`.
- **Media paths** are always **`/assets/<code>/<name>.<ext>`** — identical in dev
  (served from a local dir) and prod (Tigris volume mount). Source `imports/` never
  ships.
- **Deep link** = `https://0xg.gg/#<slug>` (hash, so it works under static export).
- **`status`**: `draft | ready | published`. `draft` projects show a dev-only badge;
  gate them out of prod if desired.

## Content pipeline

Run `npm run content` (also a `prebuild` hook). Standalone Node ESM scripts in
`scripts/`:
1. **Discover** dirs matching `^(?<year>\d{4})_(?<seq>\d{4})_(?<slug>…)_(?<collab>…)$`.
2. **Scaffold** a draft `index.mdx` (`scaffold-mdx.mjs`, idempotent): parse README
   H1→`title`, `## by`/`# By:`→`by[]`, `Support:`→`role/support`, `Place:`→`place`,
   bare URLs→`links[]`, the `### TODOs:` block→`todos[]`; body = README prose minus
   the TODO block. Hand-edit afterward.
3. **Optimize media** → `/assets/<code>/`: images via `sharp` (AVIF+WebP responsive
   + blur placeholder); video via `ffmpeg` (H.264 mp4 `+faststart` + WebM + poster,
   incl `.MOV`; cap 1080p). Idempotent (skip if derivative newer). If `ffmpeg`
   missing, log a per-project TODO instead of failing.
4. **QR** (`gen-qr.mjs`) → `/assets/<code>/qr.svg` encoding the deep link.
5. **Validate + emit**: `gray-matter` split, **zod**-validate frontmatter, write
   typed `lib/content/manifest.generated.ts` (`export const PROJECTS: Project[]`,
   each with `bodyMdx` + `ordinal`).
6. **Aggregate TODOs** (`extract-todos.mjs`) → surface per-project gaps.

**Frontmatter schema** (`lib/content/schema.ts`, zod → inferred TS):
`code, slug, year, seq, title, subtitle?, by[], role?, support?, place?, date?,
status, tags[], links[]{label,url,kind}, qrTarget, media[]{src,sources[],kind,
poster?,width,height,placeholder?,alt,caption?,credit?}, todos[]`.
No `stage` field — diamond hue is derived from `ordinal`.

## Commands

- `npm run dev` — Vite dev server.
- `npm run content` — run the pipeline (needs `sharp`; `ffmpeg` for video).
- `npm run build` — `prebuild` (content) → `vite build` → `dist/`.
- Deploy (later): `fly deploy` to `0xg-portfolio`.

## Hosting

`vite build` → static `dist/` → Caddy in a small Docker image on fly.io app
**`0xg-portfolio`** (region `fra`, scale-to-zero). Optimized media lives on a
**Tigris volume mounted at `/assets`**; `.dockerignore` excludes
`content/**/imports`. **Domain/CDN deferred** — runs at localhost in dev and the
fly URL after deploy.

> **`0xgcg.0xg.gg` is a SEPARATE deploy** of the 0xGCG project (featured here as a
> portfolio diamond whose CTA links out to it). Leave that app/deploy alone.

## Reference

- Live 0xGCG source to mine for CSS/feel:
  `/Users/gungorkocak/Projects/0xG/0xG/training/nodeinstitute_immersive_rooms/0xGCG/`
  — especially `styles.css` and `src/ui/circularPlayer.js` (the ring math).
- `__resources__/0xgcg-ref/` — 0xGCG visual screenshots (desktop + mobile).
- `__resources__/samspratt-ref/` — samspratt.com navigation screenshots; key frame
  `desktop-06-after-begin-scroll1.png` (the orbital ring with active node at marker).
- Plan: `~/.claude/plans/fancy-exploring-rain.md`. Build sequence: `TODOs.md`.

---

## v2 — interaction + generative (current state)

**Navigation model (refined):**
- **Closed** = full ring centered; click any diamond to open it.
- **Open** = the ring is pushed **~70% off-screen** (center off the left edge on
  desktop, off the top on mobile, computed from `useThree().viewport`), so only
  **prev · current · next** show. The active diamond sits at the circle's
  **right-middle** (desktop) / **bottom-middle** (mobile) marker. To move while
  open: click a visible neighbor or arrow keys (it rotates into place); far
  diamonds are dimmed + their labels hidden (`Constellation` passes `dim` to
  `Diamond` via `ringDist`). Esc / the `0xG` mark closes.

**Project content = full-viewport horizontal card scroller** (`ProjectDetail`):
CSS scroll-snap, **first card centered** (`padding-inline: calc((100vw - card)/2)`),
each card **≤90svh** (≤66svh mobile). The scroller is `pointer-events:none` so the
ring stays clickable through the gaps; only `.card`s are interactive. Marked
`data-stop-nav` so wheel/drag over it pages cards instead of stepping projects.
Cards = description → one per media → CTA+QR.

**Background field** (`components/scene/BackgroundField.tsx`): ~170 dots with a
CPU spring + mouse attract/repel + proximity "constellation" lines (accent-tinted,
additive). The **same dots morph between modes** per active project —
`neural · tree · dag · grid · galaxy · constellation` (`MODE_BY_ORDINAL`). Behind
the ring; deep stars are a separate `Starfield`.

**Per-project icons** (`lib/content/icons.ts` + `components/ui/ProjectIcon.tsx`):
hand-authored **constellation glyphs** (points+edges in a 0..100 viewBox) chosen
from each project's theme. Rendered as a mono glyph on each diamond and, larger
with a **draw-in reveal**, on the description + CTA cards.

**Generative assets** (reusable scripts, keys read at runtime — never committed):
- `scripts/lib/secrets.mjs` loads `FAL_API_KEY` / `REPLICATE_API_TOKEN` /
  `GEMINI_API_KEY` from an external `.env` (`SECRETS_ENV`, default the prism repo).
- `scripts/gen-bg-video.mjs` → fal.ai text-to-video (`fal-ai/ltx-video`) → a ~4s
  constellation loop in `public/assets/bg/`. (Kept as a reusable tool; **no longer
  displayed** — replaced by the wireframe morph below, which reads more clearly.)

**New deps in use:** none beyond the original set (icons/field are hand-rolled).
`lenis` still unused (custom `useNavInput`).

### 3D models — project-owned, swappable
Each project's wireframe model is **owned by the project**: `content/projects/<dir>/model.glb`
is the source of truth; the 0xG identity/default is `content/models/_default.glb`.
- `npm run models` (`scripts/sync-models.mjs`) publishes them → `public/assets/models/<slug>.glb`
  (+ `_default.glb`), which `WireframeMorph` loads. Drop in any GLB and re-run.
- `npm run fetch-models` (`scripts/fetch-models.mjs`) optionally auto-sources themed
  low-poly models from the **Poly Pizza API** (needs a free `POLY_API_KEY` in the secrets
  `.env`; the slug→search-term map encodes 0xG's wishlist: statue/spider-robot/dancer/egg/
  vr-headset/gears/android). Without a key it prints instructions. (Poly Pizza pages are
  JS-rendered + the CDN is key-gated, so non-API scraping doesn't work.)
- Current models are the Khronos placeholders (`scripts/fetch-assets.mjs`) until replaced.
- **Hover at the index previews a project's model** (`store.hovered`, set by `Diamond`);
  open shows the active project's model; otherwise the default.

### v3 deltas (current)
- **Diamonds are 3D constellation glyphs** now (`Glyph3D` from `icons.ts`), not
  octahedra — glowing star vertices + lines, accent-colored, dim when far.
- **Center logo** (`CenterLogo` in `Constellation`, `CenterLogo.module.css`):
  `0xG / works / tap any constellation in orbit`, replaces the central star,
  glides off with the ring on open.
- **Wireframe morph** (`WireframeMorph.tsx`): a low-poly icosahedron that morphs
  sphere↔cube↔octa↔spike↔disc as a faint additive background — replaces the video.
- **Background field = 512 dots** (was 170), shorter connection distance.
- **Smoother transitions**: lower damping (`LAMBDA_ROT/MOVE`), rotation leads the
  off-screen slide, plus a `RING_TILT_OPEN` 3D "gizmo" tilt when open.
- **Trackpad fix**: `useNavInput` fires once per gesture, re-arms only after the
  wheel fully settles (no macOS momentum double-steps). `store.dir` drives a
  directional card fade.
- **Manual arrows**: `CircleArrows` (up/down desktop · left/right mobile) steps the
  ring; carousel `‹ N/total ›` arrows under the cards page the project's carousel.
- **Boxless description card**: the first card (title+prose) is transparent/wider,
  floating over the scene (text-shadow for legibility); media + CTA keep glass frames.

### v4 deltas (current)
- **Real low-poly GLB wireframes** replace the procedural morph: `scripts/fetch-assets.mjs`
  downloads CC0/royalty-free Khronos sample models (one per project, theme-mapped) to
  `public/assets/models/<slug>.glb`; `WireframeMorph.tsx` builds clean `EdgesGeometry`
  wireframes, tints by accent, and crossfades to the active project's model. NASA has
  direct GLB URLs (`assets.science.nasa.gov/.../model/<slug>/<name>.glb`) — swap in via
  `fetch-assets.mjs` for space objects. `CREDITS.md` written alongside the models.
- **Field dots**: 512, **bigger**, custom `ShaderMaterial` with per-dot size+brightness —
  subtle random twinkle, and a strong **flare** when the mouse spring hits a dot (decays back).
- **Selection reticle**: thin **dashed** ring (drei `Line`), dashes orbit the perimeter +
  slow multi-axis 3D wobble (replaces the heavy solid torus).
- **Circle is a true circle again** (removed the skewing tilt); parks further off-screen
  (`ASIDE_LEFT_FRAC`/`ASIDE_TOP_FRAC`).
- **Motion**: removed the reduced-motion hard-snap (was the "it just jumps" cause) and
  lowered damping so the ring visibly rotates; rotation leads, slide lags.
- **Arrows**: `CircleArrows` are ▲▼ — left-center (inside the circle) on desktop, bottom
  on mobile. Carousel `‹ N/total ›` is bottom-left on desktop, **hidden on mobile** (swipe;
  the next card peeks via a narrower `--card-w`).
