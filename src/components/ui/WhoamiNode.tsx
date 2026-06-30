import { useNav } from '@/lib/scroll/store'
import styles from './WhoamiNode.module.css'

/** A lone constellation node at the index — outside the ring, unconnected — that
 *  opens the /whoami about overlay. Only shown at the index (closed, not about). */
export default function WhoamiNode() {
  const open = useNav((s) => s.open)
  const about = useNav((s) => s.about)
  const openAbout = useNav((s) => s.openAbout)
  if (open || about) return null
  return (
    <button className={styles.node} onClick={openAbout} aria-label="whoami — about 0xG and G">
      <svg viewBox="0 0 40 44" className={styles.glyph} aria-hidden>
        <path d="M20 16 L12 32 M20 16 L28 32 M12 32 L28 32" />
        <circle cx="20" cy="11" r="4.5" />
        <circle cx="12" cy="32" r="2.4" />
        <circle cx="28" cy="32" r="2.4" />
      </svg>
      <span className={styles.label}>whoami</span>
    </button>
  )
}
