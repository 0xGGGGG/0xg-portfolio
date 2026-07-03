import { useEffect, useState } from 'react'
import { COUNT, PROJECTS, projectBySlug, type Project } from '@/lib/content/manifest'
import PrintScene from './PrintScene'
import PrintCard from './PrintCard'
import PrintBackCards from './PrintBackCards'
import styles from './PrintPage.module.css'

const PAGE_W = 1920
const PAGE_H = 1080
const PORTFOLIO_URL = 'https://0xg.gg'
const WHOAMI_URL = `${PORTFOLIO_URL}/whoami`

/** the /print/<slug> attractor page: a slightly altered version of the real
 *  homepage index — same full-bleed scene, particle field, ring (all
 *  diamonds equally visible, nothing pushed aside) — nudged left, with one
 *  project's card + wireframe model featured, and clicking a diamond swaps
 *  the feature live. Fixed 1920x1080 (16:9); on screen it scales to fit the
 *  window, at print time it fills the page (see PrintPage.module.css). */
export default function PrintPage({ slug }: { slug?: string }) {
  const initial = (slug && projectBySlug(slug)) || PROJECTS[COUNT - 1]
  // plain React state, not the shared store's transient `hovered` — it must
  // survive the mouse leaving the diamond, unlike a hover preview.
  const [featured, setFeatured] = useState<Project>(initial)

  useEffect(() => {
    document.title = `${featured.title} — 0xG`
    const url = `/print/${featured.slug}`
    if (location.pathname !== url) history.replaceState(null, '', url)
  }, [featured])

  const [scale, setScale] = useState(1)
  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / PAGE_W, window.innerHeight / PAGE_H))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className={styles.stage}>
      <div className={styles.page} style={{ ['--scale' as string]: scale }}>
        <div className={styles.scene}>
          <PrintScene featured={featured} onSelect={setFeatured} />
        </div>

        <header className={styles.head}>
          <a className={styles.brand} href={PORTFOLIO_URL}>
            <span className={styles.brandMark}>0xG</span>
            <span className={styles.brandTag}>works</span>
          </a>
          <span className={styles.headMeta}>print * {featured.slug}</span>
          <span className={styles.headRight}>
            <span>{today}</span>
            <span>*</span>
            <a className={styles.headLink} href={PORTFOLIO_URL}>
              {PORTFOLIO_URL.replace(/^https?:\/\//, '')}
            </a>
          </span>
        </header>

        <PrintBackCards featured={featured} />

        <div className={styles.cardWrap}>
          <PrintCard project={featured} />
        </div>

        {featured.qr && (
          <div className={styles.reach}>
            <img className={styles.reachQr} src={featured.qr} alt={`QR code linking to ${featured.qrTarget}`} />
            <a className={styles.reachUrl} href={featured.qrTarget}>
              {featured.qrTarget.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}

        <div className={styles.whoami}>
          <img className={styles.whoamiQr} src="/assets/whoami-qr.svg" alt="QR code linking to the artist statement" />
          <div className={styles.whoamiText}>
            <a className={styles.whoamiLink} href={WHOAMI_URL}>
              artist statement
            </a>
            <a className={styles.whoamiUrl} href={WHOAMI_URL}>
              {WHOAMI_URL.replace(/^https?:\/\//, '')}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
