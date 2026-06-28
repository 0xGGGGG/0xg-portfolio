// Shared helpers for the content pipeline.
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(fileURLToPath(import.meta.url), '../../..')
export const PROJECTS_DIR = path.join(ROOT, 'content', 'projects')
export const ASSETS_DIR = path.join(ROOT, 'public', 'assets')
export const MANIFEST_OUT = path.join(ROOT, 'src', 'lib', 'content', 'manifest.generated.ts')
export const TODOS_OUT = path.join(ROOT, 'TODOs.content.md')

const DIR_RE = /^(?<year>\d{4})_(?<seq>\d{4})_(?<rest>.+)$/

/** Discover project directories matching YYYY_NNNN_slug_collaborator. */
export async function discoverProjects() {
  const entries = await fs.readdir(PROJECTS_DIR, { withFileTypes: true })
  const projects = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .map((name) => {
      const m = DIR_RE.exec(name)
      if (!m) return null
      const { year, seq, rest } = m.groups
      // rest = slug_collaborator; slug = first token, collaborator = remainder
      const parts = rest.split('_')
      const slug = parts[0]
      const collaborator = parts.slice(1).join('_') || null
      return {
        dir: name,
        year: Number(year),
        seq: Number(seq),
        code: `${year}_${seq}`,
        displayCode: `${year}.${seq}`,
        slug,
        collaborator,
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.year - b.year || a.seq - b.seq)
  projects.forEach((p, i) => (p.ordinal = i))
  return projects
}

/** Parse a project README.md into structured fields + a cleaned prose body. */
export function parseReadme(text) {
  const lines = text.split(/\r?\n/)
  const out = { title: '', by: [], role: '', support: '', place: '', links: [], todos: [], bodyLines: [] }

  let inTodos = false
  const urlRe = /(https?:\/\/[^\s)]+)/g

  for (let raw of lines) {
    const line = raw.trimEnd()
    const t = line.trim()

    // collect URLs everywhere
    const urls = t.match(urlRe)
    if (urls) for (const u of urls) out.links.push(u.replace(/[.,]$/, ''))

    if (/^#{2,3}\s*TODOs?:?/i.test(t)) {
      inTodos = true
      continue
    }
    if (inTodos) {
      const todo = t.match(/^[-*]\s*\[[ xX]?\]\s*(.+)$/)
      if (todo) out.todos.push(todo[1].trim())
      else if (/^#{1,3}\s/.test(t)) inTodos = false // a new heading ends TODOs
      continue
    }

    // title = first H1
    if (!out.title && /^#\s+\S/.test(t)) {
      out.title = t.replace(/^#\s+/, '').trim()
      continue
    }
    // by-line: "## by X", "# By: X", "## by: X"
    const by = t.match(/^#{1,3}\s*by:?\s+(.+)$/i)
    if (by) {
      out.by = by[1]
        .split(/,|&|\band\b/i)
        .map((s) => s.trim())
        .filter(Boolean)
      continue
    }
    const support = t.match(/^support:\s*(.+)$/i)
    if (support) {
      out.support = support[1].trim()
      continue
    }
    const place = t.match(/^place:\s*(.+)$/i)
    if (place) {
      out.place = place[1].trim()
      continue
    }
    // drop the standard boilerplate + empty headings
    if (/ultimate aim/i.test(t)) continue
    if (/^#\s*$/.test(t)) continue

    out.bodyLines.push(raw)
  }

  // dedupe links, build labels
  const seen = new Set()
  out.links = out.links
    .filter((u) => (seen.has(u) ? false : (seen.add(u), true)))
    .map((url) => ({ url, label: hostLabel(url), kind: linkKind(url) }))

  out.body = out.bodyLines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
  return out
}

function hostLabel(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function linkKind(url) {
  const u = url.toLowerCase()
  if (/youtube|youtu\.be|vimeo/.test(u)) return 'video'
  if (/instagram|twitter|x\.com|tiktok|carrd/.test(u)) return 'social'
  if (/luma|lu\.ma|eventbrite/.test(u)) return 'event'
  if (/github|gitlab/.test(u)) return 'source'
  return 'site'
}

export function humanize(filename) {
  return path
    .basename(filename, path.extname(filename))
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

/** safe base name for a derivative file */
export function safeName(filename) {
  return path
    .basename(filename, path.extname(filename))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

/* ----- temporal gradient: diamond accent by ordinal (cool -> mid -> warm) ----- */
const STOPS = ['#27e0a0', '#8be84b', '#ff2bd6']

export function accentForOrdinal(i, n) {
  const t = n > 1 ? i / (n - 1) : 0
  const seg = t < 0.5 ? [STOPS[0], STOPS[1], t * 2] : [STOPS[1], STOPS[2], (t - 0.5) * 2]
  return lerpHex(seg[0], seg[1], seg[2])
}

function lerpHex(a, b, t) {
  const ca = hexToRgb(a)
  const cb = hexToRgb(b)
  const r = Math.round(ca[0] + (cb[0] - ca[0]) * t)
  const g = Math.round(ca[1] + (cb[1] - ca[1]) * t)
  const bl = Math.round(ca[2] + (cb[2] - ca[2]) * t)
  return '#' + [r, g, bl].map((v) => v.toString(16).padStart(2, '0')).join('')
}

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

export async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

/** true if out is missing or older than src */
export async function isStale(srcPath, outPath) {
  try {
    const [s, o] = await Promise.all([fs.stat(srcPath), fs.stat(outPath)])
    return s.mtimeMs > o.mtimeMs
  } catch {
    return true
  }
}

export const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'])
export const VIDEO_EXT = new Set(['.mp4', '.mov', '.webm', '.m4v'])
