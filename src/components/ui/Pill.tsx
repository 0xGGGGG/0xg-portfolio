import type { ReactNode } from 'react'
import styles from './Pill.module.css'

interface Props {
  children: ReactNode
  accent?: string
  as?: 'span' | 'a'
  href?: string
  dot?: boolean
  solid?: boolean
}

export default function Pill({ children, accent, as = 'span', href, dot, solid }: Props) {
  const cls = `${styles.pill} ${solid ? styles.solid : ''}`
  const style = accent ? ({ ['--c' as string]: accent } as React.CSSProperties) : undefined
  if (as === 'a') {
    return (
      <a className={cls} style={style} href={href} target="_blank" rel="noreferrer noopener">
        {dot && <i className={styles.dot} />}
        {children}
      </a>
    )
  }
  return (
    <span className={cls} style={style}>
      {dot && <i className={styles.dot} />}
      {children}
    </span>
  )
}
