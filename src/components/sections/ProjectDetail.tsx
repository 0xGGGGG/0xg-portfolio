import { useEffect, useRef, useState } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { PROJECTS, mod, type Project } from '@/lib/content/manifest'
import { useNav } from '@/lib/scroll/store'
import Pill from '@/components/ui/Pill'
import Media from '@/components/ui/Media'
import QrCode from '@/components/ui/QrCode'
import ProjectIcon from '@/components/ui/ProjectIcon'
import styles from './ProjectDetail.module.css'

export default function ProjectDetail() {
  const active = useNav((s) => mod(s.active))
  const open = useNav((s) => s.open)
  const dir = useNav((s) => s.dir)
  const card = useNav((s) => s.card)
  const setCard = useNav((s) => s.setCard)
  const track = useRef<HTMLDivElement>(null)

  // crossfade between projects: fade the old out -> swap -> fade the new in.
  // `shown` lags `active` by the fade duration so the content swap is hidden.
  const [shown, setShown] = useState(active)
  const [fading, setFading] = useState(false)
  const prevOpen = useRef(open)
  useEffect(() => {
    const justOpened = open && !prevOpen.current
    prevOpen.current = open
    if (active === shown || !open || justOpened) {
      // snap (no crossfade) when nothing changed, when closed, or when opening
      // straight to a project — and ALWAYS clear `fading`, so the cards can never
      // get stuck at opacity:0 if a prior transition was interrupted (e.g. the
      // project was closed mid-fade, which used to leave `fading` true forever).
      setShown(active)
      setFading(false)
      return
    }
    setFading(true)
    const t = setTimeout(() => {
      setShown(active)
      setFading(false)
    }, 360)
    return () => clearTimeout(t)
  }, [active, shown, open])

  const p = PROJECTS[shown]
  // WIP projects drop the closing "reach this work" card — the WIP band on the
  // first media + the links on the description carry it instead.
  const cardCount = 1 + p.media.length + (p.wip ? 0 : 1)

  // Cache each card's centre. offsetLeft/offsetWidth are layout reads — doing them
  // per scroll event forces synchronous reflow and starves the WebGL render loop.
  // Recompute only when the project changes or on resize.
  const centers = useRef<number[]>([])
  const clientW = useRef(0)
  const recompute = () => {
    const el = track.current
    if (!el) return
    clientW.current = el.clientWidth
    centers.current = Array.from(el.children).map(
      (c) => (c as HTMLElement).offsetLeft + (c as HTMLElement).offsetWidth / 2,
    )
  }
  useEffect(() => {
    recompute()
    // jump to the active card — 0 for normal nav, but >0 honours a /slug/N deep link
    const el = track.current
    if (!el) return
    const c = el.children[useNav.getState().card] as HTMLElement | undefined
    el.scrollTo({ left: c ? c.offsetLeft - (el.clientWidth - c.offsetWidth) / 2 : 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown])
  useEffect(() => {
    window.addEventListener('resize', recompute)
    return () => window.removeEventListener('resize', recompute)
  }, [])

  // nearest cached card centre to a scroll position
  const nearest = (center: number) => {
    let best = 0
    let bestD = Infinity
    for (let i = 0; i < centers.current.length; i++) {
      const d = Math.abs(centers.current[i] - center)
      if (d < bestD) {
        bestD = d
        best = i
      }
    }
    return best
  }

  // rAF-throttled + layout-free: scroll position -> active card
  const rafId = useRef(0)
  const onScroll = () => {
    if (rafId.current) return
    rafId.current = requestAnimationFrame(() => {
      rafId.current = 0
      const el = track.current
      if (!el || !centers.current.length) return
      setCard(nearest(el.scrollLeft + clientW.current / 2))
    })
  }

  const goto = (n: number) => {
    const el = track.current
    if (!el) return
    const i = Math.max(0, Math.min(cardCount - 1, n))
    const c = el.children[i] as HTMLElement | undefined
    if (c) el.scrollTo({ left: c.offsetLeft - (el.clientWidth - c.offsetWidth) / 2, behavior: 'smooth' })
  }

  // external card change (orbit controller / deep-link) -> scroll the track to it
  useEffect(() => {
    const el = track.current
    if (!el || !centers.current.length) return
    if (nearest(el.scrollLeft + clientW.current / 2) !== card) goto(card)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card])

  return (
    <>
      <div
        className={`${styles.scroller} ${open ? styles.open : ''} ${fading ? styles.fading : ''}`}
        style={{ ['--c' as string]: p.accent, ['--dir' as string]: dir }}
        aria-hidden={!open}
        ref={track}
        onScroll={onScroll}
      >
        <article className={`${styles.card} ${styles.cardWide}`}>
          <DescriptionCard p={p} />
        </article>

        {p.media.map((m, i) => {
          // card aspect follows the media, clamped: min 1:1 (square) … max 9:16 (portrait)
          const ar = Math.min(1, Math.max(9 / 16, m.width / m.height))
          const wip = !!p.wip && i === 0
          return (
            <article
              className={`${styles.card} ${styles.cardMedia}`}
              key={m.src}
              style={{ ['--ar' as string]: ar }}
            >
              <div className={`${styles.mediaCard} ${wip ? styles.wipMedia : ''}`} data-stop-nav>
                {wip && <WipBand />}
                <Media item={m} />
              </div>
            </article>
          )
        })}

        {!p.wip && (
          <article className={styles.card}>
            <CtaCard p={p} />
          </article>
        )}
      </div>
    </>
  )
}

// marker-highlight: each line of text gets a hugging background (like a text selection)
const mark = (cls: string): Components => ({
  p: ({ children }) => (
    <p>
      <span className={cls}>{children}</span>
    </p>
  ),
  li: ({ children }) => (
    <li>
      <span className={cls}>{children}</span>
    </li>
  ),
})

function DescriptionCard({ p }: { p: Project }) {
  return (
    <div className={styles.desc}>
      <h1 className={styles.title}>
        <span className={styles.mark}>{p.title}</span>
      </h1>
      {(() => {
        // instrument-panel header: TYPE | PLACE | TIME (role · place · date)
        const meta = [p.role, p.place, p.date].filter(Boolean) as string[]
        return meta.length ? (
          <h2 className={styles.subtitle}>
            <span className={styles.markDim}>
              {meta.map((part, i) => (
                <span key={i}>
                  {i > 0 && <span className={styles.sep}>|</span>}
                  {part}
                </span>
              ))}
            </span>
          </h2>
        ) : null
      })()}

      {p.wip && (
        <div className={styles.wip}>
          <span className={styles.wipIcon}>⚠</span>
          <span>{p.wip}</span>
        </div>
      )}

      <div className={styles.body}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mark(styles.mark)}>
          {p.body}
        </ReactMarkdown>
      </div>

      {/* WIP projects have no CTA card, so the links live on the description */}
      {p.wip && p.links.length > 0 && (
        <div className={styles.descLinks}>
          <LinkPills links={p.links} accent={p.accent} />
        </div>
      )}
    </div>
  )
}

// kind-based glyph for a link pill (person / pin / globe …)
const icoProps = {
  width: 13,
  height: 13,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}
function LinkIcon({ kind }: { kind: string }) {
  switch (kind) {
    case 'artist':
      return (
        <svg {...icoProps} aria-hidden>
          <circle cx="12" cy="8" r="3.4" />
          <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
        </svg>
      )
    case 'venue':
      return (
        <svg {...icoProps} aria-hidden>
          <path d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10z" />
          <circle cx="12" cy="11" r="2.2" />
        </svg>
      )
    case 'event':
      return (
        <svg {...icoProps} aria-hidden>
          <rect x="4" y="5" width="16" height="16" rx="2" />
          <path d="M4 9.5h16M8.5 3v4M15.5 3v4" />
        </svg>
      )
    case 'social':
      return (
        <svg {...icoProps} aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.4 7" />
        </svg>
      )
    case 'video':
      return (
        <svg {...icoProps} aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M10 8.5l5.5 3.5-5.5 3.5z" fill="currentColor" stroke="none" />
        </svg>
      )
    default:
      return (
        <svg {...icoProps} aria-hidden>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M3.5 12h17M12 3.5c2.6 2.4 2.6 14.6 0 17M12 3.5c-2.6 2.4-2.6 14.6 0 17" />
        </svg>
      )
  }
}

function LinkPills({ links, accent }: { links: Project['links']; accent: string }) {
  return (
    <>
      {links.map((l) => (
        <Pill key={l.url} as="a" href={l.url} accent={accent}>
          <span className={styles.linkIco}>
            <LinkIcon kind={l.kind} />
          </span>
          {l.label}
        </Pill>
      ))}
    </>
  )
}

// glitchy hazard band stamped over the first media of a work-in-progress project
function WipBand() {
  const label = '⚠ WORK IN PROGRESS ⚠'
  return (
    <div className={styles.wipBand} aria-hidden>
      <span className={styles.wipBandText} data-text={label}>
        {label}
      </span>
    </div>
  )
}

function CtaCard({ p }: { p: Project }) {
  return (
    <div className={`${styles.panel} ${styles.cta}`}>
      <ProjectIcon slug={p.slug} accent={p.accent} size={56} reveal />
      <h3 className={styles.ctaHead}>Reach this work</h3>
      {p.links.length > 0 && (
        <div className={styles.links}>
          <LinkPills links={p.links} accent={p.accent} />
        </div>
      )}
      <QrCode src={p.qr} target={p.qrTarget} />
    </div>
  )
}
