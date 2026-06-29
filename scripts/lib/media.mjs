// Image (sharp) + video (ffmpeg) optimization. Outputs go to public/assets/<code>/
// and are referenced as /assets/<code>/<name>.<ext>.
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import sharp from 'sharp'
import { ensureDir, isStale, safeName, humanize } from './util.mjs'

const exec = promisify(execFile)

const IMG_MAX = 2000 // cap longest side (inline)
const IMG_HQ_MAX = 3200 // cap longest side (fullscreen, higher quality)
const VID_MAX = 1280 // cap longest side (inline)
const VID_HQ_MAX = 1600 // cap longest side (fullscreen, higher bitrate)
const PUBLIC_PREFIX = (code, file) => `/assets/${code}/${file}`

let ffmpegOK = null
export async function hasFfmpeg() {
  if (ffmpegOK !== null) return ffmpegOK
  try {
    await exec('ffmpeg', ['-version'])
    ffmpegOK = true
  } catch {
    ffmpegOK = false
  }
  return ffmpegOK
}

/** Optimize one image -> { avif, webp, blur placeholder, dims }. */
export async function processImage(srcPath, outDir, code, force) {
  const base = safeName(srcPath)
  const webpRel = PUBLIC_PREFIX(code, `${base}.webp`)
  const avifRel = PUBLIC_PREFIX(code, `${base}.avif`)
  const hqRel = PUBLIC_PREFIX(code, `${base}.hq.webp`)
  const webpAbs = path.join(outDir, `${base}.webp`)
  const avifAbs = path.join(outDir, `${base}.avif`)
  const hqAbs = path.join(outDir, `${base}.hq.webp`)
  await ensureDir(outDir)

  const meta = await sharp(srcPath).rotate().metadata()
  const w = meta.width ?? 0
  const h = meta.height ?? 0
  const longest = Math.max(w, h || 1)
  const scale = Math.min(1, IMG_MAX / longest)
  const outW = Math.round(w * scale)
  const outH = Math.round(h * scale)
  const hqScale = Math.min(1, IMG_HQ_MAX / longest)

  if (force || (await isStale(srcPath, webpAbs))) {
    await sharp(srcPath).rotate().resize(outW, outH).webp({ quality: 80 }).toFile(webpAbs)
  }
  if (force || (await isStale(srcPath, avifAbs))) {
    await sharp(srcPath).rotate().resize(outW, outH).avif({ quality: 55 }).toFile(avifAbs)
  }
  // high-quality variant served only when the card is fullscreened
  if (force || (await isStale(srcPath, hqAbs))) {
    await sharp(srcPath)
      .rotate()
      .resize(Math.round(w * hqScale), Math.round(h * hqScale))
      .webp({ quality: 92 })
      .toFile(hqAbs)
  }

  // tiny blurred placeholder (base64 data URL)
  const blurBuf = await sharp(srcPath).rotate().resize(20).webp({ quality: 40 }).toBuffer()
  const placeholder = `data:image/webp;base64,${blurBuf.toString('base64')}`

  return {
    kind: 'image',
    src: webpRel,
    sources: [
      { type: 'image/avif', src: avifRel },
      { type: 'image/webp', src: webpRel },
    ],
    width: outW,
    height: outH,
    placeholder,
    hqSrc: hqRel,
    alt: humanize(srcPath),
  }
}

async function ffprobeDims(srcPath) {
  const { stdout } = await exec('ffprobe', [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    srcPath,
  ])
  const [w, h, dur] = stdout.trim().split(/\s+/)
  return { width: Number(w), height: Number(h), duration: Number(dur) }
}

/** Transcode one video -> mp4 (h264 faststart) + poster jpg. */
export async function processVideo(srcPath, outDir, code, force) {
  if (!(await hasFfmpeg())) return null
  const base = safeName(srcPath)
  const mp4Rel = PUBLIC_PREFIX(code, `${base}.mp4`)
  const hqMp4Rel = PUBLIC_PREFIX(code, `${base}.hq.mp4`)
  const posterRel = PUBLIC_PREFIX(code, `${base}.jpg`)
  const mp4Abs = path.join(outDir, `${base}.mp4`)
  const hqMp4Abs = path.join(outDir, `${base}.hq.mp4`)
  const posterAbs = path.join(outDir, `${base}.jpg`)
  await ensureDir(outDir)

  const { width, height, duration } = await ffprobeDims(srcPath)
  const longest = Math.max(width, height)
  const scaleTo = (cap) =>
    longest > cap
      ? width >= height
        ? `scale=${cap}:-2`
        : `scale=-2:${cap}`
      : 'scale=trunc(iw/2)*2:trunc(ih/2)*2'
  const scaleFilter = scaleTo(VID_MAX)

  if (force || (await isStale(srcPath, mp4Abs))) {
    await exec('ffmpeg', [
      '-nostdin', '-y', '-loglevel', 'error',
      '-i', srcPath,
      '-vf', scaleFilter,
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '28',
      '-maxrate', '4M', '-bufsize', '8M',
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
      '-c:a', 'aac', '-b:a', '128k', '-ac', '2',
      mp4Abs,
    ], { maxBuffer: 1 << 26 })
  }

  // high-quality variant served only when the video is fullscreened
  if (force || (await isStale(srcPath, hqMp4Abs))) {
    await exec('ffmpeg', [
      '-nostdin', '-y', '-loglevel', 'error',
      '-i', srcPath,
      '-vf', scaleTo(VID_HQ_MAX),
      '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
      '-maxrate', '5M', '-bufsize', '10M',
      '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
      '-c:a', 'aac', '-b:a', '160k', '-ac', '2',
      hqMp4Abs,
    ], { maxBuffer: 1 << 26 })
  }

  if (force || (await isStale(srcPath, posterAbs))) {
    const ts = Math.max(0.1, Math.min(duration * 0.25, duration - 0.1))
    await exec('ffmpeg', [
      '-nostdin', '-y', '-loglevel', 'error',
      '-ss', String(ts), '-i', srcPath,
      '-vf', scaleFilter,
      '-frames:v', '1', '-q:v', '3',
      posterAbs,
    ], { maxBuffer: 1 << 26 })
  }

  // actual output dims after the scale filter (longest side capped to VID_MAX)
  let outW = width
  let outH = height
  if (longest > VID_MAX) {
    if (width >= height) {
      outW = VID_MAX
      outH = Math.round((height * VID_MAX) / width)
    } else {
      outH = VID_MAX
      outW = Math.round((width * VID_MAX) / height)
    }
  }
  outW -= outW % 2
  outH -= outH % 2

  return {
    kind: 'video',
    src: mp4Rel,
    sources: [{ type: 'video/mp4', src: mp4Rel }],
    poster: posterRel,
    width: outW,
    height: outH,
    duration: Math.round(duration),
    hqSrc: hqMp4Rel,
    alt: humanize(srcPath),
  }
}

export async function listImports(importsDir) {
  try {
    const files = await fs.readdir(importsDir)
    return files
      .filter((f) => !f.startsWith('.'))
      .map((f) => path.join(importsDir, f))
  } catch {
    return []
  }
}
