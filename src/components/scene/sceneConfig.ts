export const RADIUS = 3.2
export const DIAMOND_SIZE = 0.26
export const GLYPH_SCALE = 0.52 // size of a project's 3D constellation node
export const CAMERA_POS: [number, number, number] = [0, 0, 9.2]
export const FOV = 42

export const OPEN_SCALE = 0.8
export const CLOSED_SCALE = 1
// the ring is smaller on phones (portrait) so diamonds don't clip the edges
export const MOBILE_BASE = 0.5

// how far off-screen the ring centre parks when a project is open
// (fraction of viewport from centre toward the edge). Higher = more hidden.
export const ASIDE_LEFT_FRAC = 0.44 // desktop: push left
export const ASIDE_TOP_FRAC = 0.39 // mobile: push up

// damping rates (frame-rate independent). rotation leads, the off-screen
// slide lags noticeably so a select reads as "rotate, then glide aside".
export const LAMBDA_ROT = 3.4
export const LAMBDA_MOVE = 2.2
// faster snap back to centre when closing (returning to the index)
export const LAMBDA_RETURN = 5
