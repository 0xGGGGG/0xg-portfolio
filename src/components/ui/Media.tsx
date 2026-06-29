import { useEffect, useRef, useState } from 'react'
import type { MediaItem } from '@/lib/content/manifest'
import styles from './Media.module.css'

export default function Media({ item }: { item: MediaItem }) {
  if (item.kind === 'video') return <VideoMedia item={item} />
  return <ImageMedia item={item} />
}

function ImageMedia({ item }: { item: MediaItem }) {
  const [loaded, setLoaded] = useState(false)
  const frame = useRef<HTMLDivElement>(null)
  const toggleFs = () => {
    const el = frame.current
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    else if (el.requestFullscreen) el.requestFullscreen().catch(() => {})
  }
  return (
    <figure className={styles.media}>
      <div className={styles.frame} ref={frame}>
        {item.placeholder && (
          <img className={styles.blur} src={item.placeholder} alt="" aria-hidden />
        )}
        <picture className={styles.picture}>
          {item.sources.map((s) => (
            <source key={s.src} type={s.type} srcSet={s.src} />
          ))}
          <img
            className={`${styles.img} ${loaded ? styles.loaded : ''}`}
            src={item.src}
            width={item.width}
            height={item.height}
            alt={item.alt}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
          />
        </picture>
        <div className={styles.controls}>
          <span />
          <div className={styles.cluster}>
            <button onClick={toggleFs} aria-label="Fullscreen">
              <IconFullscreen />
            </button>
          </div>
        </div>
      </div>
      <Caption item={item} />
    </figure>
  )
}

function Caption({ item }: { item: MediaItem }) {
  if (!item.caption && !item.credit) return null
  return (
    <figcaption className={styles.cap}>
      {item.caption}
      {item.credit &&
        (item.creditUrl ? (
          <a
            className={`${styles.credit} ${styles.creditLink}`}
            href={item.creditUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {item.credit} ↗
          </a>
        ) : (
          <span className={styles.credit}>{item.credit}</span>
        ))}
    </figcaption>
  )
}

function VideoMedia({ item }: { item: MediaItem }) {
  const video = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const [fs, setFs] = useState(false)
  const userPaused = useRef(false)

  useEffect(() => {
    const el = video.current
    if (!el) return
    // load + play ONLY while on screen (preload=none keeps off-screen videos at
    // zero bandwidth); pause when it scrolls away.
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (!userPaused.current) el.play().catch(() => {})
        } else el.pause()
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    const onFs = () => setFs(document.fullscreenElement === el)
    const onBegin = () => setFs(true) // iOS
    const onEnd = () => setFs(false)
    document.addEventListener('fullscreenchange', onFs)
    el.addEventListener('webkitbeginfullscreen', onBegin)
    el.addEventListener('webkitendfullscreen', onEnd)
    return () => {
      io.disconnect()
      document.removeEventListener('fullscreenchange', onFs)
      el.removeEventListener('webkitbeginfullscreen', onBegin)
      el.removeEventListener('webkitendfullscreen', onEnd)
    }
  }, [])

  const togglePlay = () => {
    const el = video.current
    if (!el) return
    if (el.paused) {
      userPaused.current = false
      el.play().catch(() => {})
    } else {
      userPaused.current = true
      el.pause()
    }
  }
  const toggleMute = () => {
    const el = video.current
    if (!el) return
    el.muted = !el.muted
    setMuted(el.muted)
  }
  const toggleFs = () => {
    const el = video.current as
      | (HTMLVideoElement & { webkitEnterFullscreen?: () => void })
      | null
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    else if (el.requestFullscreen) el.requestFullscreen().catch(() => {})
    else if (el.webkitEnterFullscreen) el.webkitEnterFullscreen()
  }

  return (
    <figure className={styles.media}>
      <div className={styles.frame}>
        {/* cheap blurred poster fills the letterbox (was a 2nd video — too heavy) */}
        {item.poster && <img className={styles.bgVid} src={item.poster} alt="" aria-hidden />}
        <video
          ref={video}
          className={styles.video}
          poster={item.poster}
          muted
          loop
          playsInline
          preload="none"
          controls={fs} /* native controls (with scrubber) in fullscreen */
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onClick={fs ? undefined : togglePlay}
        >
          {item.sources.map((s) => (
            <source key={s.src} src={s.src} type={s.type} />
          ))}
        </video>

        <div className={styles.controls}>
          <div className={styles.cluster}>
            <button onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>
              {playing ? <IconPause /> : <IconPlay />}
            </button>
          </div>
          <div className={styles.cluster}>
            <button onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
              {muted ? <IconMuted /> : <IconSound />}
            </button>
            <button onClick={toggleFs} aria-label="Fullscreen">
              <IconFullscreen />
            </button>
          </div>
        </div>
      </div>
      <Caption item={item} />
    </figure>
  )
}

/* ---- icons (18px, currentColor) ---- */
const fill = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'currentColor' as const }
const line = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}
const IconPlay = () => (
  <svg {...fill} aria-hidden>
    <path d="M8 5v14l11-7z" />
  </svg>
)
const IconPause = () => (
  <svg {...fill} aria-hidden>
    <rect x="6" y="5" width="4" height="14" rx="1" />
    <rect x="14" y="5" width="4" height="14" rx="1" />
  </svg>
)
const IconSound = () => (
  <svg {...line} aria-hidden>
    <path d="M4 9v6h3l5 4V5L7 9H4z" />
    <path d="M16 8.5a5 5 0 010 7" />
  </svg>
)
const IconMuted = () => (
  <svg {...line} aria-hidden>
    <path d="M4 9v6h3l5 4V5L7 9H4z" />
    <line x1="16" y1="9" x2="22" y2="15" />
    <line x1="22" y1="9" x2="16" y2="15" />
  </svg>
)
const IconFullscreen = () => (
  <svg {...line} aria-hidden>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </svg>
)
