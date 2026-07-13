import type { Project } from '@/lib/content/manifest'

export interface PrintHero {
  src: string
  sources: { type: string; src: string }[]
  alt: string
}

/** a static print page can't play video — use the first still image, falling
 *  back to a video's poster frame if the project has no image media at all. */
export function printHero(project: Project): PrintHero | undefined {
  const image = project.media.find((m) => m.kind === 'image')
  if (image) return { src: image.src, sources: image.sources, alt: image.alt }
  const video = project.media.find((m) => m.kind === 'video')
  return video?.poster ? { src: video.poster, sources: [], alt: video.alt } : undefined
}
