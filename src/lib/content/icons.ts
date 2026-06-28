// Per-project constellation glyphs — small star-maps chosen from each project's
// theme. points are in a 0..100 viewBox; edges join point indices.
// (Authored from the project descriptions; regenerate/extend via scripts/gen-icons.mjs.)

export interface IconGlyph {
  points: [number, number][]
  edges: [number, number][]
}

export const ICONS: Record<string, IconGlyph> = {
  // relate — two "speaking" clusters bridged (conversation)
  relate: {
    points: [
      [24, 36], [16, 54], [40, 56],
      [76, 40], [84, 58], [60, 58],
    ],
    edges: [
      [0, 1], [1, 2], [2, 0],
      [3, 4], [4, 5], [5, 3],
      [2, 5],
    ],
  },
  // tolsim — a triangulated truss (joints + sticks)
  tolsim: {
    points: [
      [50, 16], [24, 62], [76, 62], [50, 62], [37, 39], [63, 39],
    ],
    edges: [
      [0, 4], [4, 1], [0, 5], [5, 2], [1, 3], [3, 2], [4, 3], [5, 3], [4, 5],
    ],
  },
  // altered — an eye / radiating senses (MR vision)
  altered: {
    points: [
      [50, 50], [50, 28], [72, 50], [50, 72], [28, 50],
      [66, 34], [66, 66], [34, 66], [34, 34],
    ],
    edges: [
      [0, 1], [0, 2], [0, 3], [0, 4],
      [1, 5], [5, 2], [2, 6], [6, 3], [3, 7], [7, 4], [4, 8], [8, 1],
    ],
  },
  // nitef — nested screens + a feedback line to the center (CRT feedback)
  nitef: {
    points: [
      [24, 28], [76, 28], [76, 72], [24, 72],
      [40, 42], [60, 42], [60, 58], [40, 58],
      [50, 50],
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [6, 8],
    ],
  },
  // research — a moving figure (live visuals / movement)
  research: {
    points: [
      [50, 22], [38, 38], [62, 38], [30, 24], [70, 26],
      [45, 60], [55, 60], [34, 80], [66, 80],
    ],
    edges: [
      [0, 1], [0, 2], [1, 3], [2, 4], [1, 5], [2, 6], [5, 6], [5, 7], [6, 8],
    ],
  },
  // 0xgcg — a helix with rungs (grow · loop · glitch)
  '0xgcg': {
    points: [
      [38, 18], [62, 30], [38, 42], [62, 54], [38, 66], [62, 78],
    ],
    edges: [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5],
      [0, 2], [1, 3], [2, 4], [3, 5],
    ],
  },
}

export const iconFor = (slug: string): IconGlyph | undefined => ICONS[slug]
