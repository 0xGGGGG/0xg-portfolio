import { PROJECTS, COUNT, type Project } from '@/lib/content/manifest'
import styles from './PrintBackCards.module.css'

// fixed pseudo-3D poses (fake depth via CSS perspective/rotate/translateZ) —
// "other works piling behind in space" behind the one project actually being
// pitched. Progressively smaller + fainter + further apart with distance, so
// the depth reads clearly: the first is legible-but-secondary, the last is
// barely a fragment.
const POSES = [
  {
    width: 640,
    height: 220,
    padding: '28px 34px',
    transform: 'translate(-180px, -118px) rotateZ(-7deg) rotateY(-18deg) translateZ(-70px)',
    opacity: 0.78,
    titleSize: 22,
    showText: true,
  },
  {
    width: 420,
    height: 170,
    padding: '22px 26px',
    // pulled inner (left) instead of out past the page's right edge
    transform: 'translate(-40px, -260px) rotateZ(4deg) rotateY(10deg) translateZ(-230px)',
    opacity: 0.4,
    titleSize: 16,
    showText: true,
  },
  {
    width: 128,
    height: 128,
    padding: '0',
    // pulled inner too, further still, so it stays on-page
    transform: 'translate(-160px, -390px) rotateZ(-4deg) rotateY(-10deg) translateZ(-400px)',
    opacity: 0.14,
    titleSize: 0,
    showText: false,
  },
]

/** +3 other projects, next by ordinal after the featured one (wrapping), so
 *  the trio varies per project rather than always showing the same three. */
function nextThree(featured: Project): Project[] {
  const out: Project[] = []
  for (let i = 1; i <= 3; i++) out.push(PROJECTS[(featured.ordinal + i) % COUNT])
  return out
}

export default function PrintBackCards({ featured }: { featured: Project }) {
  const others = nextThree(featured)
  return (
    <div className={styles.wrap} aria-hidden>
      {others.map((p, i) => {
        const pose = POSES[i]
        return (
          <div
            key={p.code}
            className={styles.card}
            style={{
              ['--c' as string]: p.accent,
              width: pose.width,
              height: pose.height,
              padding: pose.padding,
              transform: pose.transform,
              opacity: pose.opacity,
            }}
          >
            {pose.showText && (
              <>
                <div className={styles.eyebrow}>{p.displayCode}</div>
                <div className={styles.title} style={{ fontSize: pose.titleSize }}>
                  {p.title}
                </div>
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
