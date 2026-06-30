import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ABOUT } from '@/lib/content/manifest'
import { useNav } from '@/lib/scroll/store'
import styles from './AboutPanel.module.css'

// `## 0xG · digital` -> bold "0xG" + dim "· digital"; `## G /üngör · analog` ->
// bold "G" + dim "/üngör · analog" (split on the first space)
const components: Components = {
  h2: ({ children }) => {
    const text = Array.isArray(children) ? children.join('') : String(children ?? '')
    const i = text.indexOf(' ')
    const label = i < 0 ? text : text.slice(0, i)
    const rest = i < 0 ? '' : text.slice(i + 1)
    return (
      <h2 className={styles.who}>
        {label}
        {rest ? (
          <>
            {' '}
            <span>{rest}</span>
          </>
        ) : null}
      </h2>
    )
  },
  p: ({ children }) => <p className={styles.body}>{children}</p>,
}

/** The /whoami overlay — G (analog) + 0xG (digital), co-creators.
 *  Content authored in content/whoami/index.mdx. */
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
        <h1 className={styles.title}>{ABOUT.title}</h1>
        {ABOUT.lead && <p className={styles.lead}>{ABOUT.lead}</p>}
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {ABOUT.body}
        </ReactMarkdown>
        <button className={styles.close} onClick={close}>
          close
        </button>
      </div>
    </div>
  )
}
