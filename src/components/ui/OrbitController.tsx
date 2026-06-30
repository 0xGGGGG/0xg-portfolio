import { useEffect, useRef, useState } from 'react'
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
const KEY_DIR: Record<string, Dir> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
}

/** Wireframe keycap D-pad (matches the constellation/glow language). ▲▼ step the
 *  project (orbit, wraps through the index) · ◀▶ page the cards (bounded).
 *  Mirrors the arrow keys (↑↓ projects, ←→ cards) and lights the matching key on
 *  press — keyboard, click, AND touch (iOS doesn't fire :active reliably on tap). */
export default function OrbitController() {
  const open = useNav((s) => s.open)
  const active = useNav((s) => mod(s.active))
  const card = useNav((s) => s.card)
  const step = useNav((s) => s.step)
  const stepCard = useNav((s) => s.stepCard)

  const accent = open ? PROJECTS[active].accent : NEUTRAL_ACCENT
  const cardCount = cardCountOf(active)

  const [pressed, setPressed] = useState<Dir | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const flash = (d: Dir) => {
    setPressed(d)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setPressed(null), 200)
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const d = KEY_DIR[e.key]
      if (d) flash(d)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      clearTimeout(timer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={styles.dock}>
      <div className={styles.pad} style={{ ['--c' as string]: accent }} data-stop-nav>
        <Key dir="up" cls={styles.up} onClick={() => step(-1)} label="previous work" lit={pressed === 'up'} flash={flash} />
        <Key
          dir="left"
          cls={styles.left}
          onClick={() => stepCard(-1)}
          disabled={!open || card <= 0}
          label="previous card"
          lit={pressed === 'left'}
          flash={flash}
        />
        <Key
          dir="right"
          cls={styles.right}
          onClick={() => stepCard(1)}
          disabled={!open || card >= cardCount - 1}
          label="next card"
          lit={pressed === 'right'}
          flash={flash}
        />
        <Key dir="down" cls={styles.down} onClick={() => step(1)} label="next work" lit={pressed === 'down'} flash={flash} />
      </div>
    </div>
  )
}

function Key({
  dir,
  cls,
  onClick,
  disabled,
  label,
  lit,
  flash,
}: {
  dir: Dir
  cls: string
  onClick: () => void
  disabled?: boolean
  label: string
  lit?: boolean
  flash: (d: Dir) => void
}) {
  return (
    <button
      className={`${styles.key} ${cls} ${lit ? styles.pressed : ''}`}
      onClick={onClick}
      onPointerDown={() => flash(dir)}
      disabled={disabled}
      aria-label={label}
    >
      <svg viewBox="0 0 48 48" className={styles.cap} aria-hidden>
        <rect x="4" y="4" width="40" height="40" rx="13" className={styles.box} />
        <path d={ARROW[dir]} className={styles.arrow} />
      </svg>
    </button>
  )
}
