import { useNav } from '@/lib/scroll/store'
import styles from './CircleArrows.module.css'

/** manual ring stepper — up/down on desktop, left/right on mobile */
export default function CircleArrows() {
  const step = useNav((s) => s.step)
  return (
    <div className={styles.arrows}>
      <button className={`${styles.btn} ${styles.prev}`} onClick={() => step(-1)} aria-label="previous work" />
      <button className={`${styles.btn} ${styles.next}`} onClick={() => step(1)} aria-label="next work" />
    </div>
  )
}
