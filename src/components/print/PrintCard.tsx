import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Project } from '@/lib/content/manifest'
import Pill from '@/components/ui/Pill'
import ProjectIcon from '@/components/ui/ProjectIcon'
import styles from './PrintCard.module.css'

/** the single floating "attractor" card: description + first image + links
 *  merged into one glass panel (2px accent rail), the same visual language
 *  as the site's own Panel/CTA cards. The QR lives separately, pinned to the
 *  page's own bottom-right corner (see PrintPage). */
export default function PrintCard({ project }: { project: Project }) {
  const meta = [project.role, project.place, project.date].filter(Boolean) as string[]
  // a static print page can't play video — use the first still image, falling
  // back to a video's poster frame if the project has no image media at all.
  const heroImage = project.media.find((m) => m.kind === 'image')
  const heroVideo = project.media.find((m) => m.kind === 'video')
  const hero = heroImage
    ? { src: heroImage.src, sources: heroImage.sources, alt: heroImage.alt }
    : heroVideo?.poster
      ? { src: heroVideo.poster, sources: [], alt: heroVideo.alt }
      : undefined

  return (
    <div className={styles.card} style={{ ['--c' as string]: project.accent }}>
      <div className={styles.eyebrow}>
        <ProjectIcon slug={project.slug} accent={project.accent} size={20} />
        <span>{project.displayCode}</span>
      </div>
      <h1 className={styles.title}>{project.title}</h1>
      {meta.length > 0 && (
        <p className={styles.meta} data-testid="print-meta">
          {meta.map((part, i) => (
            <span key={i}>
              {i > 0 && <span className={styles.sep}>|</span>}
              {part}
            </span>
          ))}
        </p>
      )}
      {project.by.length > 0 && <p className={styles.by}>by {project.by.join(', ')}</p>}

      <div className={styles.mid}>
        <div className={styles.excerpt}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{project.body}</ReactMarkdown>
        </div>
        {hero && (
          <figure className={styles.hero}>
            <picture>
              {hero.sources.map((s) => (
                <source key={s.src} type={s.type} srcSet={s.src} />
              ))}
              <img src={hero.src} alt={hero.alt} />
            </picture>
          </figure>
        )}
      </div>

      <div className={styles.foot}>
        {project.links.map((l) => (
          <Pill key={l.url} as="a" href={l.url} accent={project.accent}>
            {l.label}
          </Pill>
        ))}
      </div>
    </div>
  )
}
