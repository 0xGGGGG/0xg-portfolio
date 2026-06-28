import type { Layout } from '@/lib/scroll/store'

export const TAU = Math.PI * 2

export const stepAngle = (n: number) => TAU / n

/** placement angle of diamond i (i = 0 at +x / 3 o'clock, counter-clockwise) */
export const baseAngle = (i: number, n: number) => i * stepAngle(n)

export function ringPosition(i: number, n: number, radius: number): [number, number, number] {
  const a = baseAngle(i, n)
  return [Math.cos(a) * radius, Math.sin(a) * radius, 0]
}

/** where the active diamond should sit on screen */
export function markerAngle(layout: Layout): number {
  // aside-left  -> content on the right -> active diamond at 3 o'clock (0)
  // aside-top   -> content below        -> active diamond at 6 o'clock (-PI/2)
  return layout === 'aside-top' ? -Math.PI / 2 : 0
}

/** group z-rotation that brings the (unbounded) active playhead to the marker */
export function rotationForActive(active: number, n: number, layout: Layout): number {
  return markerAngle(layout) - active * stepAngle(n)
}

/** frame-rate independent exponential damp toward target */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt))
}
