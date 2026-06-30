#!/usr/bin/env node
// Content pipeline: content/projects/*/{README.md,imports/} -> index.mdx (draft)
// -> optimized /assets + qr.svg -> typed src/lib/content/manifest.generated.ts
// Usage: node scripts/build-content.mjs [--force] [--scaffold]
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'
import matter from 'gray-matter'
import QRCode from 'qrcode'
import {
  PROJECTS_DIR, ASSETS_DIR, MANIFEST_OUT, TODOS_OUT,
  discoverProjects, parseReadme, accentForOrdinal, ensureDir, safeName,
  IMAGE_EXT, VIDEO_EXT,
} from './lib/util.mjs'
import { processImage, processVideo, listImports, hasFfmpeg } from './lib/media.mjs'

const FORCE = process.argv.includes('--force')
// site origin used for QR deep links (https://<domain>/#<slug>). Override per
// deploy: SITE_URL=https://example.com npm run content
const SITE = (process.env.SITE_URL || 'https://0xg.gg').replace(/\/+$/, '')

async function exists(p) {
  try { await fs.access(p); return true } catch { return false }
}

/** Write a draft index.mdx from README parse (idempotent unless --force). */
async function scaffoldMdx(proj, mdxPath, readme) {
  if ((await exists(mdxPath)) && !FORCE) return false
  const data = {
    code: proj.code,
    slug: proj.slug,
    year: proj.year,
    seq: proj.seq,
    title: readme.title || proj.slug,
    subtitle: '',
    by: readme.by,
    role: readme.support || '',
    place: readme.place || '',
    date: '',
    status: 'draft',
    featured: proj.slug === '0xgcg' || undefined,
    tags: [],
    links: readme.links,
    media: [],
  }
  // qrTarget is derived from SITE_URL at build time, not pinned in the file
  // strip undefined
  Object.keys(data).forEach((k) => data[k] === undefined && delete data[k])
  const body = readme.body || `_TODO: write the ${data.title} description._`
  await fs.writeFile(mdxPath, matter.stringify('\n' + body + '\n', data))
  return true
}

async function genQr(target, outDir, code) {
  await ensureDir(outDir)
  const svg = await QRCode.toString(target, {
    type: 'svg',
    margin: 1,
    color: { dark: '#0b0b0b', light: '#e8e8e8' },
  })
  await fs.writeFile(path.join(outDir, 'qr.svg'), svg)
  // qr.svg keeps a fixed name but its contents change with the target — append a
  // content version so the long /assets cache can't serve a stale code
  const v = createHash('md5').update(target).digest('hex').slice(0, 8)
  return `/assets/${code}/qr.svg?v=${v}`
}

async function buildMedia(proj, importsDir, outDir) {
  const files = await listImports(importsDir)
  const processed = []
  for (const f of files) {
    const ext = path.extname(f).toLowerCase()
    try {
      if (IMAGE_EXT.has(ext)) {
        processed.push({ file: path.basename(f), ...(await processImage(f, outDir, proj.code, FORCE)) })
      } else if (VIDEO_EXT.has(ext)) {
        const v = await processVideo(f, outDir, proj.code, FORCE)
        if (v) processed.push({ file: path.basename(f), ...v })
      }
    } catch (err) {
      console.warn(`  ! media failed (${path.basename(f)}): ${err.message}`)
    }
  }
  return processed
}

/** Apply frontmatter media overrides (alt/caption/credit/order/hidden) by file. */
function mergeMedia(processed, overrides) {
  if (!overrides || !overrides.length) {
    // natural order: images first, then video, each by name
    return processed
      .map(({ file, ...m }) => m)
      .sort((a, b) => (a.kind === b.kind ? a.src.localeCompare(b.src) : a.kind === 'image' ? -1 : 1))
  }
  const byKey = new Map()
  for (const m of processed) byKey.set(safeName(m.file), m)
  const ordered = []
  for (const o of overrides) {
    if (o.hidden) continue
    const key = safeName(o.file || '')
    const m = byKey.get(key)
    if (!m) continue
    byKey.delete(key)
    const { file, ...rest } = m
    ordered.push({ ...rest, ...(o.alt && { alt: o.alt }), ...(o.caption && { caption: o.caption }), ...(o.credit && { credit: o.credit }), ...(o.creditUrl && { creditUrl: o.creditUrl }) })
  }
  // append any processed not listed
  for (const m of byKey.values()) {
    const { file, ...rest } = m
    ordered.push(rest)
  }
  return ordered
}

async function main() {
  const t0 = Date.now()
  const ffmpeg = await hasFfmpeg()
  if (!ffmpeg) console.warn('! ffmpeg not found — videos will be skipped (logged as TODOs).')

  const discovered = await discoverProjects()
  if (!discovered.length) {
    console.error(`No projects found under ${PROJECTS_DIR}`)
    process.exit(1)
  }
  const n = discovered.length
  const projects = []
  const allTodos = []

  for (const proj of discovered) {
    const dir = path.join(PROJECTS_DIR, proj.dir)
    const mdxPath = path.join(dir, 'index.mdx')
    const readmePath = path.join(dir, 'README.md')
    const importsDir = path.join(dir, 'imports')
    const outDir = path.join(ASSETS_DIR, proj.code)

    const readmeText = (await exists(readmePath)) ? await fs.readFile(readmePath, 'utf8') : ''
    const readme = parseReadme(readmeText)

    const created = await scaffoldMdx(proj, mdxPath, readme)
    const { data: fm, content: body } = matter(await fs.readFile(mdxPath, 'utf8'))

    const media = mergeMedia(await buildMedia(proj, importsDir, outDir), fm.media)

    const accent = accentForOrdinal(proj.ordinal, n)
    const qrTarget = fm.qrTarget || `${SITE}/${proj.slug}`
    const qr = await genQr(qrTarget, outDir, proj.code)

    // auto-detected gaps -> todos
    const todos = [...(readme.todos || [])]
    if (!media.length) todos.push('No media yet — add files to imports/ (no-media card variant in use).')
    const hasVideo = (await listImports(importsDir)).some((f) => VIDEO_EXT.has(path.extname(f).toLowerCase()))
    if (hasVideo && !ffmpeg) todos.push('ffmpeg missing — videos not transcoded.')
    if ((fm.status || 'draft') === 'draft') todos.push('index.mdx still status:draft — author + set status:ready.')

    // frontmatter links first so their curated labels win over README-parsed ones
    const links = dedupeLinks([...(toLinkArray(fm.links) || []), ...(readme.links || [])])

    const project = {
      code: proj.code,
      displayCode: proj.displayCode,
      slug: fm.slug || proj.slug,
      dir: proj.dir,
      year: proj.year,
      seq: proj.seq,
      ordinal: proj.ordinal,
      title: fm.title || readme.title || proj.slug,
      subtitle: fm.subtitle || undefined,
      // explicit frontmatter (even empty) wins; only fall back to the README
      // parse when the field is absent from the frontmatter entirely
      by: fm.by !== undefined ? arr(fm.by) : readme.by,
      role: fm.role !== undefined ? fm.role || undefined : readme.support || undefined,
      support: readme.support || undefined,
      place: fm.place !== undefined ? fm.place || undefined : readme.place || undefined,
      date: fm.date || undefined,
      status: fm.status || 'draft',
      featured: fm.featured || undefined,
      wip: typeof fm.wip === 'string' ? fm.wip : fm.wip ? 'Work in progress' : undefined,
      tags: arr(fm.tags),
      links,
      qrTarget,
      qr,
      accent,
      media,
      todos,
      body: body.trim(),
    }
    pruneUndefined(project)
    projects.push(project)
    if (todos.length) allTodos.push({ code: proj.displayCode, title: project.title, todos })

    console.log(
      `· ${proj.displayCode} ${project.title}  —  ${media.length} media${created ? ', scaffolded index.mdx' : ''}`,
    )
  }

  await emitManifest(projects)
  await emitTodos(allTodos)
  console.log(`\n✓ ${projects.length} projects → manifest in ${((Date.now() - t0) / 1000).toFixed(1)}s`)
}

function arr(v) {
  return Array.isArray(v) ? v : v ? [v] : []
}
function toLinkArray(v) {
  if (!Array.isArray(v)) return []
  return v
    .map((l) => (typeof l === 'string' ? { url: l, label: l, kind: 'site' } : l))
    .filter((l) => l && l.url)
}
function dedupeLinks(list) {
  const seen = new Set()
  const norm = (u) => u.replace(/[#?].*$/, '').replace(/\/$/, '')
  return list.filter((l) => {
    const k = norm(l.url)
    return seen.has(k) ? false : (seen.add(k), true)
  })
}
function pruneUndefined(o) {
  for (const k of Object.keys(o)) if (o[k] === undefined) delete o[k]
}

async function emitManifest(projects) {
  await ensureDir(path.dirname(MANIFEST_OUT))
  const banner =
    '// AUTO-GENERATED by scripts/build-content.mjs — do not edit by hand.\n' +
    '// Run `npm run content` to regenerate.\n'
  const out =
    banner +
    "import type { Project } from './types'\n\n" +
    'export const PROJECTS: Project[] = ' +
    JSON.stringify(projects, null, 2) +
    '\n'
  await fs.writeFile(MANIFEST_OUT, out)
}

async function emitTodos(groups) {
  const lines = ['# Content TODOs (auto-generated)', '', '> Regenerated by `npm run content`. Source: each project README `### TODOs:` + detected gaps.', '']
  for (const g of groups) {
    lines.push(`## ${g.code} — ${g.title}`)
    for (const t of g.todos) lines.push(`- [ ] ${t}`)
    lines.push('')
  }
  await fs.writeFile(TODOS_OUT, lines.join('\n'))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
