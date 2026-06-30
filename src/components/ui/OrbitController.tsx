import { useNav } from '@/lib/scroll/store'
import { PROJECTS, mod, NEUTRAL_ACCENT } from '@/lib/content/manifest'
import styles from './OrbitController.module.css'

const cardCountOf = (i: number) => 1 + PROJECTS[i].media.length + (PROJECTS[i].wip ? 0 : 1)

type Dir = 'up' | 'down' | 'left' | 'right'
const ARROW: Record<Dir, string> = {
  up: 'M17 27 L24 19 L31 27',
  down: 'M17 21 L24 29 L31 21',
  left: 'M27 17 L19 24 L27 31',
  right: 'M21 17 L29 24 L21 31',
}

/** Wireframe keycap D-pad (matches the constellation/glow language). ▲▼ step the
 *  project (orbit, wraps through the index) · ◀▶ page the cards (bounded).
 *  Mirrors the arrow keys (↑↓ projects, ←→ cards). */
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
      <Key dir="up" cls={styles.up} onClick={() => step(-1)} label="previous work" />
      <Key
        dir="left"
        cls={styles.left}
        onClick={() => stepCard(-1)}
        disabled={!open || card <= 0}
        label="previous card"
      />
      <Key
        dir="right"
        cls={styles.right}
        onClick={() => stepCard(1)}
        disabled={!open || card >= cardCount - 1}
        label="next card"
      />
      <Key dir="down" cls={styles.down} onClick={() => step(1)} label="next work" />
    </div>
  )
}

function Key({
  dir,
  cls,
  onClick,
  disabled,
  label,
}: {
  dir: Dir
  cls: string
  onClick: () => void
  disabled?: boolean
  label: string
}) {
  return (
    <button className={`${styles.key} ${cls}`} onClick={onClick} disabled={disabled} aria-label={label}>
      <svg viewBox="0 0 48 48" className={styles.cap} aria-hidden>
        <rect x="4" y="4" width="40" height="40" rx="13" className={styles.box} />
        <path d={ARROW[dir]} className={styles.arrow} />
      </svg>
    </button>
  )
}
