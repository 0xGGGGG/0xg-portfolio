// Typed content model. The build-time pipeline (scripts/build-content.mjs)
// emits manifest.generated.ts as `PROJECTS: Project[]` matching these shapes.

export type MediaKind = 'image' | 'video'

export interface MediaSource {
  /** MIME type, e.g. "image/avif", "video/mp4" */
  type: string
  src: string
}

export interface MediaItem {
  kind: MediaKind
  /** primary display src, e.g. /assets/2025_0002/clip.mp4 */
  src: string
  /** additional <source> candidates (avif/webp for images, webm/mp4 for video) */
  sources: MediaSource[]
  poster?: string
  width: number
  height: number
  /** tiny blurred data URL placeholder (images) */
  placeholder?: string
  /** higher-quality source (mp4 / webp) swapped in only when fullscreened */
  hqSrc?: string
  alt: string
  caption?: string
  credit?: string
  /** source link for the credit (Instagram post / web page the media came from) */
  creditUrl?: string
  /** seconds (video) */
  duration?: number
}

export type LinkKind =
  | 'site'
  | 'event'
  | 'press'
  | 'video'
  | 'source'
  | 'social'
  | 'artist'
  | 'venue'

export interface ProjectLink {
  label: string
  url: string
  kind: LinkKind
}

export type ProjectStatus = 'draft' | 'ready' | 'published'

export interface Project {
  /** "2025_0001" */
  code: string
  /** "2025.0001" */
  displayCode: string
  /** clean deep-link target, e.g. "relate" */
  slug: string
  /** source directory name */
  dir: string
  year: number
  seq: number
  /** 0-based chronological index = ring order */
  ordinal: number
  title: string
  subtitle?: string
  /** collaborators / artist of the work */
  by: string[]
  role?: string
  support?: string
  place?: string
  date?: string
  status: ProjectStatus
  featured?: boolean
  /** when set, shows a "work in progress" warning banner with this message */
  wip?: string
  tags: string[]
  links: ProjectLink[]
  /** absolute or hash deep link encoded in the QR */
  qrTarget: string
  /** /assets/<code>/qr.svg */
  qr?: string
  /** hex, derived from ordinal (temporal gradient cool -> warm) */
  accent: string
  media: MediaItem[]
  /** open per-project authoring tasks (from README ### TODOs) */
  todos: string[]
  /** markdown body (rendered with react-markdown) */
  body: string
}
