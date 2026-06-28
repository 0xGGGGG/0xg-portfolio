#!/usr/bin/env node
// Generate a short ~4s constellation-outlined loop for the site background via fal.ai.
// Usage: node scripts/gen-bg-video.mjs [--model fal-ai/...] [--prompt "..."]
// Reads FAL_API_KEY at runtime from the external secrets .env (never committed).
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { loadSecrets, mask } from './lib/secrets.mjs'
import { ROOT, ensureDir } from './lib/util.mjs'

const exec = promisify(execFile)
const arg = (k, d) => {
  const i = process.argv.indexOf(k)
  return i >= 0 ? process.argv[i + 1] : d
}

const PROMPT =
  arg('--prompt') ||
  'A seamless 4-second loop: a single human figure — a mover, a dancer and technologist — ' +
    'walking and reaching upward, drawn as a minimalist constellation: glowing white dots ' +
    'connected by thin star-map lines, on a pure black background. Faint twinkling stars, ' +
    'elegant slow motion, abstract line-art, cinematic, high contrast, looping.'

const CANDIDATES = [
  { model: 'fal-ai/ltx-video', input: { prompt: PROMPT } },
  { model: 'fal-ai/wan/v2.2-5b/text-to-video', input: { prompt: PROMPT } },
  {
    model: 'fal-ai/kling-video/v1/standard/text-to-video',
    input: { prompt: PROMPT, duration: '5', aspect_ratio: '16:9' },
  },
  { model: 'fal-ai/minimax/video-01', input: { prompt: PROMPT } },
]

const OUT_DIR = path.join(ROOT, 'public', 'assets', 'bg')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function deepFindMp4(obj) {
  let found = null
  const walk = (v) => {
    if (found) return
    if (typeof v === 'string') {
      if (/^https?:\/\/.*\.mp4(\?|$)/i.test(v)) found = v
    } else if (Array.isArray(v)) v.forEach(walk)
    else if (v && typeof v === 'object') Object.values(v).forEach(walk)
  }
  walk(obj)
  return found
}

async function submit(model, input, key) {
  const res = await fetch(`https://queue.fal.run/${model}`, {
    method: 'POST',
    headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`submit ${res.status}: ${text.slice(0, 200)}`)
  return JSON.parse(text)
}

async function poll(statusUrl, key, label) {
  const deadline = Date.now() + 6 * 60 * 1000
  while (Date.now() < deadline) {
    const r = await fetch(statusUrl, { headers: { Authorization: `Key ${key}` } })
    const j = await r.json().catch(() => ({}))
    if (j.status === 'COMPLETED') return true
    if (j.status === 'FAILED' || j.status === 'ERROR') throw new Error(`job failed: ${JSON.stringify(j).slice(0, 200)}`)
    process.stdout.write(`  …${label} ${j.status || r.status}\r`)
    await sleep(5000)
  }
  throw new Error('timeout')
}

async function main() {
  const sec = await loadSecrets()
  const key = sec.FAL_API_KEY
  console.log('FAL key:', mask(key))
  if (!key) process.exit(2)
  await ensureDir(OUT_DIR)

  const only = arg('--model')
  const list = only ? [{ model: only, input: { prompt: PROMPT } }] : CANDIDATES

  let videoUrl = null
  for (const c of list) {
    try {
      console.log(`→ trying ${c.model}`)
      const job = await submit(c.model, c.input, key)
      const statusUrl = job.status_url || job.response_url
      if (!statusUrl) throw new Error('no status_url in response')
      await poll(statusUrl, key, c.model)
      const r = await fetch(job.response_url, { headers: { Authorization: `Key ${key}` } })
      const out = await r.json()
      videoUrl = deepFindMp4(out)
      if (videoUrl) {
        console.log(`\n✓ ${c.model} produced: ${videoUrl}`)
        break
      }
      console.log(`  no mp4 in output of ${c.model}`)
    } catch (err) {
      console.log(`  ✗ ${c.model}: ${err.message}`)
    }
  }

  if (!videoUrl) {
    console.error('No model produced a video. Background video skipped (particle field stands alone).')
    process.exit(1)
  }

  // download + transcode to a web-friendly, faststart, muted loop + poster
  const raw = path.join(OUT_DIR, 'constellation-raw.mp4')
  const mp4 = path.join(OUT_DIR, 'constellation-loop.mp4')
  const poster = path.join(OUT_DIR, 'constellation-loop.jpg')
  const buf = Buffer.from(await (await fetch(videoUrl)).arrayBuffer())
  await fs.writeFile(raw, buf)
  await exec('ffmpeg', ['-nostdin', '-y', '-loglevel', 'error', '-i', raw,
    '-vf', 'scale=1280:-2', '-an', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '26',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4])
  await exec('ffmpeg', ['-nostdin', '-y', '-loglevel', 'error', '-ss', '1', '-i', raw,
    '-frames:v', '1', '-q:v', '3', poster])
  await fs.unlink(raw).catch(() => {})
  console.log(`✓ saved ${path.relative(ROOT, mp4)} (+ poster)`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
