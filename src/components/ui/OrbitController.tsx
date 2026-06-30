import { useNav } from '@/lib/scroll/store'
import { PROJECTS, mod, NEUTRAL_ACCENT } from '@/lib/content/manifest'
import styles from './OrbitController.module.css'

const cardCountOf = (i: number) => 1 + PROJECTS[i].media.length + (PROJECTS[i].wip ? 0 : 1)

/** A 3D-printed keycap D-pad. ▲▼ step the project (orbit, wraps through the
 *  index) · ◀▶ page the cards (bounded). Mirrors the arrow keys (↑↓ projects,
 *  ←→ cards). */
export default function OrbitController() {
  const open = useNav((s) => s.open)
  const active = useNav((s) => mod(s.active))
  const card = useNav((s) => s.card)
  const step = useNav((s) => s.step)
  const stepCard = useNav((s) => s.stepCard)

  const accent = open ? PROJECTS[active].accent : NEUTRAL_ACCENT
  const cardCount = cardCountOf(active)

  return (
    <div className={styles.pad} style={{ ['--c' as string]: accent }} data-stop-nav>
      <button
        className={`${styles.key} ${styles.up}`}
        onClick={() => step(-1)}
        aria-label="previous work"
      >
        ▲
      </button>
      <button
        className={`${styles.key} ${styles.left}`}
        onClick={() => stepCard(-1)}
        disabled={!open || card <= 0}
        aria-label="previous card"
      >
        ◀
      </button>
      <button
        className={`${styles.key} ${styles.right}`}
        onClick={() => stepCard(1)}
        disabled={!open || card >= cardCount - 1}
        aria-label="next card"
      >
        ▶
      </button>
      <button
        className={`${styles.key} ${styles.down}`}
        onClick={() => step(1)}
        aria-label="next work"
      >
        ▼
      </button>
    </div>
  )
}
