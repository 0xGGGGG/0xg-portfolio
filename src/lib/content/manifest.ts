import { PROJECTS } from './manifest.generated'
import type { Project } from './types'

export type { Project, MediaItem, ProjectLink, MediaSource, About } from './types'
export { PROJECTS, ABOUT } from './manifest.generated'

export const COUNT = PROJECTS.length

/** neutral accent for the index/default state (no project selected or hovered) */
export const NEUTRAL_ACCENT = '#c4c9d0'

export const mod = (i: number, n = COUNT) => ((i % n) + n) % n

/** project at an unbounded (wrapping) playhead index */
export const projectAt = (active: number): Project => PROJECTS[mod(active)]

export const projectBySlug = (slug: string): Project | undefined =>
  PROJECTS.find((p) => p.slug === slug)

export const indexOfSlug = (slug: string): number =>
  PROJECTS.findIndex((p) => p.slug === slug)
