import { useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { NEUTRAL_ACCENT, PROJECTS, type Project } from '@/lib/content/manifest'
import ProjectIcon from '@/components/ui/ProjectIcon'
import { printHero } from './printHero'
import styles from './PrintAllPage.module.css'

const PORTFOLIO_URL = 'https://0xg.gg'
const WHOAMI_URL = `${PORTFOLIO_URL}/whoami`

// print-specific condensed bio — the site's /whoami (G × 0xG, the history) is
// deliberately NOT reused here; a CV wants the core facts, the QR links to the
// full statement.
const BIO_LEAD = 'Creative technologist & artist, based in Berlin.'
const BIO = `
- Deep interest in movement, communal and spatial computing, interactive
  mediums, **HCI** & **HRI** (human-robot interaction), organic growth patterns
  and emergent simulations in math and visual arts.
- Proficient in **TouchDesigner**, **Unreal Engine** and **Unity**.
- Backed by 15 years of software engineering, specialized in **AI** and
  **real-time applications**: chat and game servers, chatbots, collaborative
  editors, IoT.
`

// newest work first — a CV leads with the current, unlike the ring's
// chronological orbit
const BY_DATE_DESC = [...PROJECTS].reverse()

/** hand-written ≤50-word summary from frontmatter; fall back to deriving one
 *  from the body at paragraph boundaries (never cut mid-line — a paragraph
 *  ending in ':' is kept glued to the list it introduces). */
function shortDesc(project: Project): string {
  if (project.summary) return project.summary
  const units = project.body
    .trim()
    .split(/\n\s*\n/)
    .reduce<string[]>((acc, p) => {
      const prev = acc[acc.length - 1]
      if (prev?.trimEnd().endsWith(':')) acc[acc.length - 1] = `${prev}\n\n${p}`
      else acc.push(p)
      return acc
    }, [])
  let excerpt = units[0]
  for (const u of units.slice(1)) {
    if (excerpt.length + u.length > 380) break
    excerpt += '\n\n' + u
  }
  return excerpt
}

function ProjectRow({ project, flip }: { project: Project; flip: boolean }) {
  const meta = [project.role, project.place, project.date].filter(Boolean) as string[]
  const hero = printHero(project)

  return (
    <section
      className={`${styles.row} ${flip ? styles.flip : ''}`}
      style={{ ['--c' as string]: project.accent }}
    >
      <div className={styles.rowText}>
        <div className={styles.eyebrow}>
          <ProjectIcon slug={project.slug} accent={project.accent} size={16} />
          <span>{project.displayCode}</span>
        </div>
        <h2 className={styles.title}>{project.title}</h2>
        {meta.length > 0 && (
          <p className={styles.meta}>
            {meta.map((part, i) => (
              <span key={i}>
                {i > 0 && <span className={styles.sep}>|</span>}
                {part}
              </span>
            ))}
          </p>
        )}
        {project.by.length > 0 && <p className={styles.by}>by {project.by.join(', ')}</p>}
        <div className={styles.excerpt}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{shortDesc(project)}</ReactMarkdown>
        </div>
        {project.qr && (
          <div className={styles.rowReach}>
            <img className={styles.reachQr} src={project.qr} alt={`QR code linking to ${project.qrTarget}`} />
            <a className={styles.reachUrl} href={project.qrTarget}>
              {project.qrTarget.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}
      </div>

      <div className={styles.rowMedia}>
        {hero && (
          <figure className={styles.hero}>
            {/* blurred cover copy fills the frame's letterbox areas */}
            <img className={styles.heroBlur} src={hero.src} alt="" aria-hidden />
            <picture className={styles.heroFit}>
              {hero.sources.map((s) => (
                <source key={s.src} type={s.type} srcSet={s.src} />
              ))}
              <img src={hero.src} alt={hero.alt} />
            </picture>
          </figure>
        )}
      </div>
    </section>
  )
}

/** the /print/all CV/portfolio document: a condensed whoami up top, then every
 *  project (newest first) as a compact row — short summary + one square image +
 *  QR — alternating text/media sides. Each A4 page is an EXPLICIT sheet box
 *  (3 project rows per sheet; the first also carries the whoami, the last the
 *  footer): at print time every sheet is exactly one page and paints the full
 *  paper itself (background + starfield edge to edge) — relying on @page
 *  margins instead leaves bands painted by the browser canvas, which renders
 *  a subtly different black and no stars. */
const ROWS_PER_SHEET = 3

export default function PrintAllPage() {
  useEffect(() => {
    document.title = '0xG — works — print'
  }, [])

  const today = new Date().toISOString().slice(0, 10)

  const sheets: Project[][] = []
  for (let i = 0; i < BY_DATE_DESC.length; i += ROWS_PER_SHEET)
    sheets.push(BY_DATE_DESC.slice(i, i + ROWS_PER_SHEET))

  return (
    <div className={styles.stage}>
      {sheets.map((chunk, s) => (
        <div key={s} className={styles.sheet}>
          {s === 0 && (
            <>
              <header className={styles.head}>
                <a className={styles.brand} href={PORTFOLIO_URL}>
                  <span>0xG</span>
                  <span className={styles.brandTag}>works</span>
                </a>
                <span className={styles.headMeta}>print * portfolio</span>
                <span className={styles.headRight}>
                  <span>{today}</span>
                  <span>*</span>
                  <a className={styles.headLink} href={PORTFOLIO_URL}>
                    {PORTFOLIO_URL.replace(/^https?:\/\//, '')}
                  </a>
                </span>
              </header>

              <section className={styles.about} style={{ ['--c' as string]: NEUTRAL_ACCENT }}>
                <div className={styles.aboutHead}>
                  <div className={styles.aboutIntro}>
                    <div className={styles.eyebrow}>
                      <span>whoami</span>
                    </div>
                    <h1 className={styles.aboutLead}>{BIO_LEAD}</h1>
                  </div>
                  <div className={styles.reach}>
                    <img
                      className={styles.reachQr}
                      src="/assets/whoami-qr.svg"
                      alt="QR code linking to the artist statement"
                    />
                    <a className={styles.reachUrl} href={WHOAMI_URL}>
                      {WHOAMI_URL.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                </div>
                <div className={styles.aboutBody}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{BIO}</ReactMarkdown>
                </div>
              </section>
            </>
          )}

          {chunk.map((p, i) => (
            <ProjectRow key={p.slug} project={p} flip={(s * ROWS_PER_SHEET + i) % 2 === 1} />
          ))}

          {s === sheets.length - 1 && (
            <footer className={styles.foot}>
              <span>
                0xG * works * {PROJECTS.length} projects * {today}
              </span>
              <a className={styles.headLink} href={PORTFOLIO_URL}>
                {PORTFOLIO_URL.replace(/^https?:\/\//, '')}
              </a>
            </footer>
          )}
        </div>
      ))}
    </div>
  )
}
