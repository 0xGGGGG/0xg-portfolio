import { create } from 'zustand'
import { COUNT, mod } from '@/lib/content/manifest'

export type Layout = 'aside-left' | 'aside-top'

// Navigation is a bounded, latest-first list with an INDEX state above the top:
//   [ index ]  ->  newest project  ->  …  ->  oldest project
// scroll down advances toward older; scroll up goes newer, and past the newest
// returns to the index (circle centred). active = project ordinal (0 = oldest,
// COUNT-1 = newest). It only matters when `open`.
const NEWEST = COUNT - 1

interface NavState {
  count: number
  active: number
  open: boolean
  layout: Layout
  reducedMotion: boolean
  card: number
  /** last step direction (+1 down/older, -1 up/newer) — drives the content fade */
  dir: number
  /** slug being hovered at the index (previews its 3D model); null = default */
  hovered: string | null

  step: (dir: number) => void
  select: (projectIndex: number) => void
  close: () => void
  setOpen: (open: boolean) => void
  setLayout: (layout: Layout) => void
  setReducedMotion: (v: boolean) => void
  setCard: (i: number) => void
  setHovered: (slug: string | null) => void
}

export const useNav = create<NavState>((set) => ({
  count: COUNT,
  active: NEWEST, // ring is oriented to the newest even at the index
  open: false,
  layout: 'aside-left',
  reducedMotion: false,
  card: 0,
  dir: 1,
  hovered: null,

  // The loop wraps through the index:  index → newest → … → oldest → index → …
  // (and the reverse going up). The index keeps the last active for orientation.
  step: (d) =>
    set((s) => {
      if (d > 0) {
        // scroll down: open newest -> older -> (past oldest) back to index
        if (!s.open) return { open: true, active: NEWEST, card: 0, dir: 1 }
        if (s.active > 0) return { active: s.active - 1, card: 0, dir: 1 }
        return { open: false, dir: 1 } // oldest -> index
      } else {
        // scroll up: from index wrap to oldest; else go newer -> (past newest) index
        if (!s.open) return { open: true, active: 0, card: 0, dir: -1 }
        if (s.active < NEWEST) return { active: s.active + 1, card: 0, dir: -1 }
        return { open: false, dir: -1 } // newest -> index
      }
    }),

  select: (projectIndex) =>
    set((s) => ({
      open: true,
      active: projectIndex,
      card: 0,
      dir: projectIndex <= s.active ? 1 : -1,
    })),

  close: () => set({ open: false }),
  setOpen: (open) => set({ open }),
  setLayout: (layout) => set({ layout }),
  setReducedMotion: (v) => set({ reducedMotion: v }),
  setCard: (i) => set({ card: i }),
  setHovered: (slug) => set({ hovered: slug }),
}))

/** current project index (0..count-1) */
export const activeProjectIndex = () => mod(useNav.getState().active)
