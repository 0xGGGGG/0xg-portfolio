import { useNav } from '@/lib/scroll/store'
import { PROJECTS, COUNT, mod, NEUTRAL_ACCENT } from '@/lib/content/manifest'
import styles from './OrbitController.module.css'

const TAU = Math.PI * 2
const cardCountOf = (i: number) => 1 + PROJECTS[i].media.length + (PROJECTS[i].wip ? 0 : 1)

/** One control for both axes:
 *  ▲▼ step the project (orbit, wraps through the index) · ◀▶ page the cards
 *  (bounded). The orbit minimap shows the active project on the ring + a card
 *  row shows the card position. Replaces the old CircleArrows + carousel nav. */
export default function OrbitController() {
  const open = useNav((s) => s.open)
  const active = useNav((s) => mod(s.active))
  const card = useNav((s) => s.card)
  const step = useNav((s) => s.step)
  const setCard = useNav((s) => s.setCard)

  const accent = open ? PROJECTS[active].accent : NEUTRAL_ACCENT
  const cardCount = cardCountOf(active)
  const stepCard = (d: number) => setCard(Math.max(0, Math.min(cardCount - 1, card + d)))

  return (
    <div className={styles.wrap} style={{ ['--c' as string]: accent }} data-stop-nav>
      <button className={styles.btn} onClick={() => step(-1)} aria-label="previous work">
        ▲
      </button>
      <div className={styles.mid}>
        <button
          className={styles.btn}
          onClick={() => stepCard(-1)}
          disabled={!open || card <= 0}
          aria-label="previous card"
        >
          ◀
        </button>
        <Orbit active={active} open={open} />
        <button
          className={styles.btn}
          onClick={() => stepCard(1)}
          disabled={!open || card >= cardCount - 1}
          aria-label="next card"
        >
          ▶
        </button>
      </div>
      <button className={styles.btn} onClick={() => step(1)} aria-label="next work">
        ▼
      </button>
      {open && cardCount > 1 && (
        <div className={styles.cards}>
          {Array.from({ length: cardCount }).map((_, i) => (
            <i key={i} className={i === card ? styles.cardOn : styles.cardDot} />
          ))}
        </div>
      )}
    </div>
  )
}

/** minimap: project dots on a ring, active one pinned to the top + lit */
function Orbit({ active, open }: { active: number; open: boolean }) {
  const C = 23
  const R = 17
  return (
    <svg width={46} height={46} viewBox="0 0 46 46" className={styles.orbit} aria-hidden>
      <circle cx={C} cy={C} r={R} className={styles.ring} />
      {PROJECTS.map((_, i) => {
        const a = -Math.PI / 2 + ((i - active) / COUNT) * TAU
        const x = C + Math.cos(a) * R
        const y = C + Math.sin(a) * R
        const on = open && i === active
        return (
          <circle key={i} cx={x} cy={y} r={on ? 3 : 1.7} className={on ? styles.dotOn : styles.dot} />
        )
      })}
    </svg>
  )
}
