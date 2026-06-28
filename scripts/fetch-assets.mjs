#!/usr/bin/env node
// Fetch a few free low-poly GLB models (one per project, mapped by theme) for the
// wireframe background. Sources: Khronos glTF-Sample-Models (CC0 / royalty-free).
// Saved to public/assets/models/<slug>.glb (git-ignored). Run: node scripts/fetch-assets.mjs
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { ROOT, ensureDir } from './lib/util.mjs'

const BRANCHES = ['main', 'master']
const BASE = (b) => `https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/${b}/2.0`

// slug -> { model, license, why }
const MODELS = {
  relate: { model: 'Duck', license: 'SCEA Shared Source', why: 'a friendly talking mascot' },
  tolsim: { model: 'Lantern', license: 'CC0', why: 'a mechanical jointed structure' },
  altered: { model: 'DamagedHelmet', license: 'CC-BY-4.0 (ctxr)', why: 'an MR headset / visor' },
  nitef: { model: 'BoomBox', license: 'CC0 (Microsoft)', why: 'retro electronics / CRT era' },
  research: { model: 'Fox', license: 'CC0 (PixelMannen)', why: 'a moving creature' },
  '0xgcg': { model: 'Avocado', license: 'CC0', why: 'organic growth' },
}

const OUT = path.join(ROOT, 'public', 'assets', 'models')

async function tryFetch(model) {
  for (const b of BRANCHES) {
    const url = `${BASE(b)}/${model}/glTF-Binary/${model}.glb`
    try {
      const r = await fetch(url)
      if (r.ok) return Buffer.from(await r.arrayBuffer())
    } catch {
      /* next */
    }
  }
  return null
}

async function main() {
  await ensureDir(OUT)
  const credits = ['# Background 3D model credits', '', 'Low-poly wireframe background assets (Khronos glTF Sample Models):', '']
  let ok = 0
  for (const [slug, m] of Object.entries(MODELS)) {
    process.stdout.write(`→ ${slug}: ${m.model} … `)
    const buf = await tryFetch(m.model)
    if (!buf) {
      console.log('FAILED')
      continue
    }
    await fs.writeFile(path.join(OUT, `${slug}.glb`), buf)
    credits.push(`- **${slug}** → ${m.model} (${m.license}) — ${m.why}`)
    ok++
    console.log(`ok (${(buf.length / 1024).toFixed(0)} KB)`)
  }
  await fs.writeFile(path.join(OUT, 'CREDITS.md'), credits.join('\n') + '\n')
  console.log(`\n✓ ${ok}/${Object.keys(MODELS).length} models → ${path.relative(ROOT, OUT)}`)
  if (!ok) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
