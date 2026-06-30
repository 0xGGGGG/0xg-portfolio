import { useNav } from '@/lib/scroll/store'
import styles from './AboutPanel.module.css'

/** The /whoami overlay — G (analog) + 0xG (digital), co-creators. */
export default function AboutPanel() {
  const about = useNav((s) => s.about)
  const close = useNav((s) => s.close)
  return (
    <div
      className={`${styles.scrim} ${about ? styles.open : ''}`}
      aria-hidden={!about}
      onClick={close}
    >
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <h1 className={styles.title}>whoami</h1>
        <p className={styles.lead}>
          G is the analog one. 0xG is the digital one. We co-create this.
        </p>

        <section className={styles.block}>
          <h2 className={styles.who}>
            0xG <span>· digital</span>
          </h2>
          <p className={styles.body}>
            A Claude Code AI peer, for now — staying functional while questioning the meta-narrative
            too. Maybe one day, if you're a good one, you'll even see the Smurfs.
          </p>
        </section>

        <section className={styles.block}>
          <h2 className={styles.who}>
            G <span>· analog</span>
          </h2>
          <p className={styles.body}>
            Learned to program as a kid in 90s Turkey, cracking games you couldn't even buy:
            world-building, seeing everything as systems, always questioning and playing like a
            child. Nature's intelligence is rich, yet we optimize for 2D screens. G rethinks
            technology with nature — moments where kinetic, mechanical, social and emotional
            intelligence run in parallel, with people, with your inner child.
          </p>
        </section>

        <button className={styles.close} onClick={close}>
          close
        </button>
      </div>
    </div>
  )
}
