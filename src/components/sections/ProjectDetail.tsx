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
    if (active === shown) return
    if (!open || justOpened) {
      setShown(active) // snap when closed or opening directly to a project
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
  const cardCount = 2 + p.media.length

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
    if (track.current) track.current.scrollTo({ left: 0 })
    recompute()
  }, [shown])
  useEffect(() => {
    window.addEventListener('resize', recompute)
    return () => window.removeEventListener('resize', recompute)
  }, [])

  // rAF-throttled + layout-free: nearest cached centre to the scroll centre
  const rafId = useRef(0)
  const onScroll = () => {
    if (rafId.current) return
    rafId.current = requestAnimationFrame(() => {
      rafId.current = 0
      const el = track.current
      if (!el || !centers.current.length) return
      const center = el.scrollLeft + clientW.current / 2
      let best = 0
      let bestD = Infinity
      for (let i = 0; i < centers.current.length; i++) {
        const d = Math.abs(centers.current[i] - center)
        if (d < bestD) {
          bestD = d
          best = i
        }
      }
      setCard(best)
    })
  }

  const goto = (n: number) => {
    const el = track.current
    if (!el) return
    const i = Math.max(0, Math.min(cardCount - 1, n))
    const c = el.children[i] as HTMLElement | undefined
    if (c) el.scrollTo({ left: c.offsetLeft - (el.clientWidth - c.offsetWidth) / 2, behavior: 'smooth' })
  }

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

        {p.media.map((m) => {
          // card aspect follows the media, clamped: min 1:1 (square) … max 9:16 (portrait)
          const ar = Math.min(1, Math.max(9 / 16, m.width / m.height))
          return (
            <article
              className={`${styles.card} ${styles.cardMedia}`}
              key={m.src}
              style={{ ['--ar' as string]: ar }}
            >
              <div className={styles.mediaCard} data-stop-nav>
                <Media item={m} />
              </div>
            </article>
          )
        })}

        <article className={styles.card}>
          <CtaCard p={p} />
        </article>
      </div>

      <div className={`${styles.carouselNav} ${open ? styles.open : ''}`} data-stop-nav>
        <button onClick={() => goto(card - 1)} disabled={card <= 0} aria-label="previous card">
          ‹
        </button>
        <span className={styles.cardCount}>
          {String(card + 1).padStart(2, '0')} / {String(cardCount).padStart(2, '0')}
        </span>
        <button onClick={() => goto(card + 1)} disabled={card >= cardCount - 1} aria-label="next card">
          ›
        </button>
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
      {p.subtitle && (
        <h2 className={styles.subtitle}>
          <span className={styles.markDim}>{p.subtitle}</span>
        </h2>
      )}

      {p.wip && (
        <div className={styles.wip}>
          <span className={styles.wipIcon}>⚠</span>
          <span>{p.wip}</span>
        </div>
      )}

      <div className={styles.tags}>
        {p.by.map((b) => (
          <Pill key={b} accent={p.accent} dot>
            {b}
          </Pill>
        ))}
        {p.role && <Pill accent={p.accent}>{p.role}</Pill>}
        {p.place && <Pill accent={p.accent}>{p.place}</Pill>}
        {p.date && <Pill accent={p.accent}>{p.date}</Pill>}
      </div>

      <div className={styles.body}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={mark(styles.mark)}>
          {p.body}
        </ReactMarkdown>
      </div>
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
          {p.links.map((l) => (
            <Pill key={l.url} as="a" href={l.url} accent={p.accent} dot>
              {l.label}
            </Pill>
          ))}
        </div>
      )}
      <QrCode src={p.qr} target={p.qrTarget} />
    </div>
  )
}
