import { PROJECTS, mod } from '@/lib/content/manifest'
import { useNav } from '@/lib/scroll/store'
import ProjectIcon from './ProjectIcon'
import styles from './Topbar.module.css'

export default function Topbar() {
  const active = useNav((s) => mod(s.active))
  const open = useNav((s) => s.open)
  const close = useNav((s) => s.close)
  const count = useNav((s) => s.count)
  const p = PROJECTS[active]
  // latest-first position (newest = 01)
  const pos = count - active

  return (
    <header className={styles.bar}>
      <button className={styles.brand} onClick={close} title="0xG — back to the index">
        <span className={styles.code}>0xG</span>
        <span className={styles.tag}>works</span>
      </button>

      {open ? (
        <button
          className={styles.now}
          style={{ ['--c' as string]: p.accent }}
          onClick={close}
          title="Back to the index"
        >
          <span className={styles.pos}>
            {String(pos).padStart(2, '0')}/{String(count).padStart(2, '0')}
          </span>
          <span className={styles.name}>{p.title}</span>
          <span className={styles.icon}>
            <ProjectIcon slug={p.slug} accent={p.accent} size={26} mono />
          </span>
        </button>
      ) : (
        <span className={styles.idle}>{count} works · scroll to enter</span>
      )}
    </header>
  )
}
