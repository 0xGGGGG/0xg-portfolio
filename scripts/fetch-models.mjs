#!/usr/bin/env node
// Themed-model fetcher via the Poly Pizza API (free CC0/CC-BY low-poly).
// Key from env POLY_API_KEY or the secrets .env. Downloads one model per project
// (best low-poly match for a search term) into the project dir as model.glb, the
// default into content/models/_default.glb, and writes attributions to
// content/models/CREDITS.md. Then run `npm run models` to publish.
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { loadSecrets, mask } from './lib/secrets.mjs'
import { ROOT, PROJECTS_DIR, discoverProjects, ensureDir } from './lib/util.mjs'

// slug -> { term, want } — the objects 0xG asked for
// slug -> { search term, wanted words (title-matched), avoided words }.
// These terms reproduce the chosen models (and a complete CREDITS.md).
const PICKS = {
  '0xgcg': { term: 'spider', want: ['spider', 'tarantula', 'arachnid', 'ant'], avoid: ['web', 'cobweb', 'ladybug', 'man', 'pig', 'net'] },
  research: { term: 'dancer', want: ['dancer', 'ballerina', 'showgirl', 'dance', 'ballet'], avoid: ['robot', 'robo', 'mech', 'bot'] },
  nitef: { term: 'egg', want: ['egg'], avoid: ['cooked', 'fried', 'plate', 'bacon', 'breakfast', 'holder', 'cup', 'carton'] },
  relate: { term: 'humanoid robot', want: ['humanoid', 'cyborg', 'android', 'robot'], avoid: ['arm', 'hand', 'head only'] },
  altered: { term: 'vr headset', want: ['headset', 'helmet', 'goggles'], avoid: ['controller'] },
  tolsim: { term: 'wrench', want: ['wrench', 'spanner'], avoid: ['crowbar', 'monkey'] },
}

async function search(term, key) {
  const r = await fetch(`https://api.poly.pizza/v1.1/search/${encodeURIComponent(term)}?limit=16`, {
    headers: { 'x-auth-token': key },
  })
  if (!r.ok) throw new Error(`search ${r.status}`)
  return (await r.json()).results || []
}

/** prefer a TITLE match first (tags are noisy), avoid unwanted words, then clean low-poly */
function pick(results, want, avoid = []) {
  const ok = results.filter((m) => m.Download)
  if (!ok.length) return null
  const score = (m) => {
    const title = (m.Title || '').toLowerCase()
    const tags = (m.Tags || []).join(' ').toLowerCase()
    let s = 0
    if (avoid.some((a) => title.includes(a))) s += 200 // strongly avoid
    if (want.some((w) => title.includes(w))) s -= 100 // title match = best
    else if (want.some((w) => tags.includes(w))) s -= 40 // tag match = ok
    const tri = m['Tri Count'] || 0
    if (tri > 9000) s += 40 // too dense -> messy wireframe
    if (tri < 60) s += 15 // degenerate
    s += Math.min(tri / 4000, 8) // mild low-poly preference
    return s
  }
  return ok.sort((a, b) => score(a) - score(b))[0]
}

async function download(url, dst) {
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer())
  await fs.writeFile(dst, buf)
  return buf.length
}

async function main() {
  const key = process.env.POLY_API_KEY || (await loadSecrets()).POLY_API_KEY
  if (!key) {
    console.log('No POLY_API_KEY. Get one free at https://poly.pizza/api, then')
    console.log('run: POLY_API_KEY=... npm run fetch-models   (or add it to the secrets .env)')
    process.exit(0)
  }
  console.log('Poly Pizza key:', mask(key))
  const projects = await discoverProjects()
  const bySlug = Object.fromEntries(projects.map((p) => [p.slug, p]))
  await ensureDir(path.join(ROOT, 'content', 'models'))
  const credits = ['# Background 3D model credits', '', 'Per-project wireframe models (Poly Pizza):', '']

  for (const [slug, { term, want, avoid }] of Object.entries(PICKS)) {
    try {
      const m = pick(await search(term, key), want, avoid)
      if (!m) { console.log(`· ${slug}: no result for "${term}"`); continue }
      const dst =
        slug === '_default'
          ? path.join(ROOT, 'content', 'models', '_default.glb')
          : path.join(PROJECTS_DIR, bySlug[slug].dir, 'model.glb')
      const bytes = await download(m.Download, dst)
      credits.push(`- **${slug}** → ${m.Title} (${m.Licence}) — ${m.Attribution}`)
      console.log(`· ${slug} ← "${m.Title}" [${m['Tri Count']} tris, ${m.Licence}]  (${(bytes / 1024).toFixed(0)} KB)`)
    } catch (err) {
      console.log(`· ${slug}: ${err.message}`)
    }
  }
  await fs.writeFile(path.join(ROOT, 'content', 'models', 'CREDITS.md'), credits.join('\n') + '\n')
  console.log('\n✓ wrote CREDITS.md. Now run `npm run models` to publish.')
}

main().catch((e) => { console.error(e); process.exit(1) })
