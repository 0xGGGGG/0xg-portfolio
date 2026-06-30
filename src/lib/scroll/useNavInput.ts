import { useEffect } from 'react'
import { useNav } from './store'

/** Wheel / trackpad / drag / keyboard -> the playhead. Axis-based + consistent:
 *  VERTICAL scroll/drag changes the project EVERYWHERE (gaps and cards alike);
 *  HORIZONTAL is left to the carousel. One physical gesture = one step (rising-edge
 *  detection so macOS trackpad momentum, which only decays, can never re-fire). */
export function useNavInput() {
  useEffect(() => {
    let armed = true
    let prevAbs = 0
    let silence: ReturnType<typeof setTimeout> | null = null
    const FIRE = 14
    const FLOOR = 4

    // media (video/image) is marked [data-stop-nav] — scrolling over it must NOT
    // navigate projects (you're looking at the asset)
    const overMedia = (t: EventTarget | null) =>
      t instanceof HTMLElement ? !!t.closest('[data-stop-nav]') : false

    const fire = (dir: number) => useNav.getState().step(dir)

    const onWheel = (e: WheelEvent) => {
      // horizontal-dominant -> let the carousel scroll natively
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
      if (overMedia(e.target)) return // over a video/image: leave it alone
      // vertical -> step the project. NOTE: listener is passive (no preventDefault)
      // so the browser can scroll the carousel on the compositor thread without
      // blocking our WebGL render loop. The app shell is fixed/overflow-hidden, so
      // there's nothing to scroll vertically anyway.
      const ad = Math.abs(e.deltaY)
      if (silence) clearTimeout(silence)
      silence = setTimeout(() => (armed = true), 130) // re-arm after events stop (mouse)
      if (ad <= FLOOR) armed = true // momentum decayed -> ready for the next flick
      if (armed && ad >= FIRE && ad >= prevAbs) {
        armed = false
        fire(e.deltaY > 0 ? 1 : -1)
      }
      prevAbs = ad
    }

    const onKey = (e: KeyboardEvent) => {
      const st = useNav.getState()
      // vertical arrows step the project; horizontal arrows page the cards
      if (e.key === 'ArrowDown') st.step(1)
      else if (e.key === 'ArrowUp') st.step(-1)
      else if (e.key === 'ArrowRight') st.stepCard(1)
      else if (e.key === 'ArrowLeft') st.stepCard(-1)
      else if (e.key === 'Escape') st.close()
    }

    let dragging = false
    let sx = 0
    let sy = 0
    let moved = false
    let startedOverMedia = false
    const onDown = (e: PointerEvent) => {
      // mouse drags are for selecting text / interacting — never navigate.
      // touch/pen swipes navigate (desktop uses wheel + arrows + clicks).
      if (e.pointerType === 'mouse') return
      dragging = true
      sx = e.clientX
      sy = e.clientY
      moved = false
      startedOverMedia = overMedia(e.target)
    }
    const onMove = (e: PointerEvent) => {
      if (!dragging || moved || startedOverMedia) return
      const dx = e.clientX - sx
      const dy = e.clientY - sy
      if (Math.hypot(dx, dy) > 48) {
        moved = true
        // natural touch: swipe UP = go forward (next/older), swipe DOWN = back
        if (Math.abs(dy) > Math.abs(dx)) fire(dy > 0 ? -1 : 1) // vertical drag = project
        // horizontal drag is left to the carousel (touch pan-x)
      }
    }
    const onUp = () => (dragging = false)

    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [])
}

/** keep store.layout + reducedMotion in sync with the viewport */
export function useLayoutWatch() {
  useEffect(() => {
    const mqAside = window.matchMedia('(min-width: 760px)')
    const mqMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => {
      useNav.getState().setLayout(mqAside.matches ? 'aside-left' : 'aside-top')
      useNav.getState().setReducedMotion(mqMotion.matches)
    }
    apply()
    mqAside.addEventListener('change', apply)
    mqMotion.addEventListener('change', apply)
    return () => {
      mqAside.removeEventListener('change', apply)
      mqMotion.removeEventListener('change', apply)
    }
  }, [])
}
