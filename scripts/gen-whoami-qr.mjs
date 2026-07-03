#!/usr/bin/env node
// One-off asset for the /print page's small whoami block (not part of the
// per-project content pipeline — the whoami page has no Project entry of its
// own). Regenerate with: node scripts/gen-whoami-qr.mjs
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import QRCode from 'qrcode'

const SITE = (process.env.SITE_URL || 'https://0xg.gg').replace(/\/+$/, '')
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets', 'whoami-qr.svg')

const svg = await QRCode.toString(`${SITE}/whoami`, {
  type: 'svg',
  margin: 1,
  color: { dark: '#0b0b0b', light: '#e8e8e8' },
})
await fs.mkdir(path.dirname(OUT), { recursive: true })
await fs.writeFile(OUT, svg)
console.log(`wrote ${OUT}`)
