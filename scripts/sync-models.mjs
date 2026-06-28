#!/usr/bin/env node
// Sync each project's source model -> the served location.
//   content/projects/<dir>/model.glb   ->  public/assets/models/<slug>.glb
//   content/models/_default.glb        ->  public/assets/models/_default.glb   (the 0xG identity)
// Drop a GLB into a project dir (or content/models/_default.glb) and run `npm run models`.
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { ROOT, PROJECTS_DIR, discoverProjects, ensureDir } from './lib/util.mjs'

const OUT = path.join(ROOT, 'public', 'assets', 'models')

async function exists(p) {
  try { await fs.access(p); return true } catch { return false }
}
async function copy(src, dst, label) {
  if (!(await exists(src))) return false
  await fs.copyFile(src, dst)
  const { size } = await fs.stat(dst)
  console.log(`· ${label}  (${(size / 1024).toFixed(0)} KB)`)
  return true
}

async function main() {
  await ensureDir(OUT)
  let n = 0
  for (const p of await discoverProjects()) {
    const src = path.join(PROJECTS_DIR, p.dir, 'model.glb')
    if (await copy(src, path.join(OUT, `${p.slug}.glb`), `${p.slug} ← ${p.dir}/model.glb`)) n++
  }
  const def = path.join(ROOT, 'content', 'models', '_default.glb')
  if (await copy(def, path.join(OUT, '_default.glb'), `_default ← content/models/_default.glb`)) n++
  console.log(`\n✓ synced ${n} models → public/assets/models`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
