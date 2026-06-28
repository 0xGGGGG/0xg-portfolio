import { iconFor } from '@/lib/content/icons'
import styles from './ProjectIcon.module.css'

interface Props {
  slug: string
  accent: string
  size?: number
  reveal?: boolean
  mono?: boolean
}

/** a project's constellation glyph — dots + lines, optionally animated drawing-in */
export default function ProjectIcon({ slug, accent, size = 40, reveal, mono }: Props) {
  const g = iconFor(slug)
  if (!g) return null
  return (
    <svg
      className={`${styles.icon} ${reveal ? styles.reveal : ''} ${mono ? styles.mono : ''}`}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ ['--c' as string]: accent }}
      aria-hidden
    >
      <g className={styles.edges}>
        {g.edges.map(([a, b], i) => (
          <line
            key={i}
            x1={g.points[a][0]}
            y1={g.points[a][1]}
            x2={g.points[b][0]}
            y2={g.points[b][1]}
            style={{ animationDelay: `${i * 70}ms` }}
          />
        ))}
      </g>
      <g className={styles.dots}>
        {g.points.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={3} style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </g>
    </svg>
  )
}
