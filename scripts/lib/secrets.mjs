// Loads API keys at runtime from an external .env (NOT in this repo, never committed).
// Default source: the prism project's .env. Override with SECRETS_ENV.
import { promises as fs } from 'node:fs'

const DEFAULT_ENV = '/Users/gungorkocak/Projects/shopnomix/prism/.env'

let cache = null

export async function loadSecrets(envPath = process.env.SECRETS_ENV || DEFAULT_ENV) {
  if (cache) return cache
  const out = {}
  try {
    const text = await fs.readFile(envPath, 'utf8')
    for (const line of text.split(/\r?\n/)) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue // skip blanks + commented lines
      const m = t.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/i)
      if (!m) continue
      let v = m[2].trim().replace(/^["']|["']$/g, '')
      out[m[1]] = v
    }
  } catch (err) {
    console.warn(`! could not read secrets from ${envPath}: ${err.message}`)
  }
  // process.env wins if present
  for (const k of ['GEMINI_API_KEY', 'REPLICATE_API_TOKEN', 'FAL_API_KEY', 'OPENAI_API_KEY', 'POLY_API_KEY']) {
    if (process.env[k]) out[k] = process.env[k]
  }
  cache = out
  return out
}

/** mask a secret for safe logging */
export const mask = (s) => (s ? `${s.slice(0, 4)}…${s.slice(-3)} (${s.length})` : '(missing)')
