# 0xG Portfolio — TODOs

Two tracks: **Build** (engineering, phased) and **Content** (per-project
authoring, sourced from each project's `README.md` `### TODOs:`). See `CLAUDE.md`
for conventions and the design system; `~/.claude/plans/fancy-exploring-rain.md`
for the full plan.

Status: **Phases 0–3 largely built and running** (`npm run dev`). A working
constellation + content pipeline + carousel exists; remaining = polish, content
refinement, deploy. Reference screenshots in `__resources__/{0xgcg-ref,samspratt-ref}/`;
dev captures in `__resources__/portfolio-dev/`.

### Implementation notes (deviations from the original plan)
- **Vite + React + TS** scaffolded by hand (not `create-vite`).
- **MDX**: bodies are authored as `index.mdx` and rendered at runtime with
  `react-markdown` + `remark-gfm` (simpler than `@mdx-js/rollup`; upgrade later if
  embedded components are needed).
- **Input**: a custom rate-limited wheel/drag/key handler (`useNavInput`) drives a
  snap-stepped playhead — matches samspratt's stepped feel better than Lenis
  smooth-scroll over a tall DOM, so Lenis is unused for now.
- **Media** derivatives written to `public/assets/<code>/` (git-ignored), referenced
  as `/assets/...`; Tigris volume mounts there in prod.
- Project dirs moved under `content/projects/`.

---

## Build track

### Phase 0 — Scaffold
- [ ] `npm create vite@latest` → React + TypeScript at repo root (keep `.tool-versions`).
- [ ] Add deps: `three @react-three/fiber @react-three/drei @react-three/postprocessing lenis zustand zod gray-matter qrcode sharp @mdx-js/rollup @mdx-js/react`; dev: `@types/three`.
- [ ] `vite.config.ts`: React plugin, `@mdx-js/rollup`, `@/` path alias to `src/`.
- [ ] Port `src/styles/tokens.css` + `global.css` from 0xGCG (drop `overflow:hidden`; verify the page scrolls/steps).
- [ ] Build `ui/` primitives from 0xGCG CSS: `Pill`, `Panel` (2px left-rail glass), `Marker`, `Brand`/`Topbar`.

### Phase 1 — Content pipeline
- [ ] `src/lib/content/schema.ts` — zod schema + inferred TS types (see CLAUDE.md frontmatter schema).
- [ ] `scripts/scaffold-mdx.mjs` — `README.md` → draft `index.mdx` (idempotent, `--force`); parse title/by/role/place/links/TODOs.
- [ ] `scripts/optimize-images.mjs` — `sharp` → AVIF+WebP responsive + blur placeholder + intrinsic w/h.
- [ ] `scripts/transcode-video.mjs` — `ffmpeg` → mp4 (`+faststart`) + WebM + poster; handle `.MOV`; cap 1080p; idempotent; graceful if ffmpeg missing.
- [ ] `scripts/gen-qr.mjs` — `qrcode` → `/assets/<code>/qr.svg` of the deep link.
- [ ] `scripts/sync-assets.mjs` — place derivatives in the local `/assets` dir (Tigris volume in prod).
- [ ] `scripts/extract-todos.mjs` — aggregate per-project `todos[]` + auto-detected gaps.
- [ ] `scripts/build-content.mjs` — orchestrator → emit `lib/content/manifest.generated.ts`; wire `npm run content` + `prebuild`.
- [ ] Decide: commit `/assets` derivatives vs regenerate in CI (Tigris volume name + mount path).

### Phase 2 — Scene
- [ ] `SceneCanvas` (client mount, fixed background layer) + `Starfield` + `PostFX` (ACESFilmic, exposure ~0.9, FogExp2, UnrealBloom ~0.3–0.5).
- [ ] `src/lib/geometry/ring.ts` — `baseAngle(i) = -PI/2 + i*TAU/n`; position/marker math (port `circularPlayer.js`).
- [ ] `Constellation` + `Diamond` (temporal-gradient hue, selection ring, dim neighbors) + `CircleCore` (progress arc) + `CurrentMarker`.
- [ ] `lib/scroll/store.ts` (zustand: playhead/active index, layout) + `useLenis.ts`.
- [ ] Wire input → playhead; rotation/offset = pure functions of playhead via `MathUtils.damp` in `useFrame`; **verify no feedback loop**; stepped snap-to-nearest feel.
- [ ] Click diamond → `scrollToIndex`; arrow keys = prev/next; reduced-motion + hidden-tab guards.
- [ ] Mobile layout switch: circle aside-**left** ≥760px, aside-**top** below; mobile = single focal diamond.
- [ ] Persistent position indicator (`03 / 06` / ring ticks); per-project background tint.

### Phase 3 — Sections & carousel
- [ ] `ProjectSections` / `ProjectSection` (anchors = slug; IntersectionObserver confirms active index only).
- [ ] `Carousel` — CSS scroll-snap (`scroll-snap-type:x mandatory`, `data-lenis-prevent`); step row wraps/scrolls on mobile.
- [ ] `Media` — `<picture>` (avif→webp→jpg, intrinsic w/h, lazy, blur) + `<video>` (webm+mp4, poster, play-in-view).
- [ ] `cards/{DescriptionCard,MediaCard,CtaCard}`; CTA = link pills + `QrCode` + human-readable deep link.
- [ ] Hash deep-link resolution on load (`/#<slug>` → snap to index).
- [ ] **Flagship layout** for `2026_0002_0xgcg_nodeinst` (distinct treatment; CTA → `0xgcg.0xg.gg`).
- [ ] No-media card variant (for projects without media yet).

### Phase 4 — Polish
- [ ] Favicon, OG image, meta tags, JSON-LD, sitemap/robots.
- [ ] Reduced-motion pass; Lighthouse + CLS; tap targets; mobile bottom transport.
- [ ] Optional `CrtOverlay`; dev-only `draft` badges; tune scroll budget (ring rotation feel).

### Phase 5 — Deploy (later)
- [ ] `Dockerfile` (build → Caddy static) + `Caddyfile` + `fly.toml` + `.dockerignore`.
- [ ] Tigris bucket + volume mounted at `/assets`; `fly launch --no-deploy` → `fly deploy` to `0xg-portfolio`.
- [ ] Domain when ready; **verify `0xgcg.0xg.gg` untouched.**

---

## Content track (per project, from each README's `### TODOs:`)

### 2025_0001_relate_andrea — "Relate / Talk With Me" · Andrea Familari
- [ ] Fetch project info; save as md + relative assets.
- [ ] Write explanation: the installation (uzwei im Dortmunder U, Dortmund) + my involvement (NLX.ai bot as an Unreal Engine Blueprint component).
- [ ] No media yet → no-media card variant; add photos later.

### 2025_0002_tolsim_melodi — TOLSim (Unreal XR kinetic-joint builder)
- [ ] Transcode the 3 Oculus `.mp4`s + extract a meaningful poster/screenshot.
- [ ] Write the TOLSim explanation (patented kinetic joint system; Turkey govt grant prototype).

### 2025_0003_altered_state_000_cyberdelxhack — Cyberdelics Hackathon · Synesthesia MR
- [ ] Fetch the luma event page (https://luma.com/x66rm5gu) → md + assets; society links (cyberdelicnexus.carrd.co).
- [ ] Transcode `.mp4`/`.MOV`; process the jpegs.
- [ ] Write hackathon + app explanation (Meta Quest MR; mic + biotron/fruit sensors; GLSL portals); more photos later.

### 2025_0004_nitef_joaquina — "Nostalgia is the Extended Feedback" · Joaquina Salgado
- [ ] Fetch https://joaquinasalgado.com/nitef → md + assets.
- [ ] Transcode the `.MOV`; process jpegs.
- [ ] Write project + solo exhibition (SOMA Art Berlin) + my involvement (trackball/small-screen + electronics + programming); add photos later.

### 2026_0001_research_jam_chaos — Chaos Jam & Research · Collective Chaos Emblematic e.V.
- [ ] Fetch Chaos Emblematic general info.
- [ ] Download IG posts `DY5RrX9irhg` and `DVdold8CrQw`; name `YYYYMMDD_ig_<id>_…`; keep post ref for alt. **Confirm hosting rights.**
- [ ] Short blurb (collective / jam / research formats, 1–2 sentences) + my participation; add media later.

### 2026_0002_0xgcg_nodeinst — 0xGCG: Grow. Corrupt. Glitch. · Kunstkraftwerk Leipzig
- [ ] **Extract media from the 0xGCG project dir into this `imports/`.**
- [ ] Fetch Node Institute course pages + Kunstkraftwerk (place) info.
- [ ] Pull project info from the 0xGCG repo; flagship treatment; **CTA → 0xgcg.0xg.gg**.
