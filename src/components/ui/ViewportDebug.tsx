import { useEffect, useState } from 'react'

/** TEMPORARY: prints viewport metrics so we can size the bottom controls for the
 *  iOS Safari address bar. A red dot marks `position:fixed; bottom:0`; a green dot
 *  marks the bottom of `100dvh`. Remove once the D-pad is positioned. */
export default function ViewportDebug() {
  const [s, setS] = useState('')
  useEffect(() => {
    const probe = document.createElement('div')
    probe.style.cssText =
      'position:fixed;bottom:0;left:0;width:0;height:env(safe-area-inset-bottom,0px);pointer-events:none'
    document.body.appendChild(probe)
    const update = () => {
      const vv = window.visualViewport
      setS(
        [
          `innerH ${window.innerHeight}`,
          `vvH ${Math.round(vv?.height ?? 0)}`,
          `vvTop ${Math.round(vv?.offsetTop ?? 0)}`,
          `safeBottom ${probe.offsetHeight}`,
          `docClientH ${document.documentElement.clientHeight}`,
          `screenH ${window.screen.height}`,
          `dpr ${window.devicePixelRatio}`,
        ].join('\n'),
      )
    }
    update()
    const vv = window.visualViewport
    vv?.addEventListener('resize', update)
    vv?.addEventListener('scroll', update)
    const id = window.setInterval(update, 400)
    return () => {
      clearInterval(id)
      vv?.removeEventListener('resize', update)
      vv?.removeEventListener('scroll', update)
      probe.remove()
    }
  }, [])
  return (
    <>
      <pre
        style={{
          position: 'fixed',
          top: 'calc(env(safe-area-inset-top, 0px) + 54px)',
          left: 8,
          zIndex: 99,
          margin: 0,
          padding: '6px 8px',
          font: '11px/1.35 monospace',
          color: '#0f0',
          background: 'rgba(0,0,0,0.78)',
          border: '1px solid #0f0',
          pointerEvents: 'none',
          whiteSpace: 'pre',
        }}
      >
        {s}
      </pre>
      {/* red = fixed bottom:0 · green = 100dvh bottom · cyan = 100svh bottom */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: 2, background: 'red', zIndex: 99, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: 'calc(100dvh - 2px)', left: 0, right: 0, height: 2, background: '#0f0', zIndex: 99, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: 'calc(100svh - 2px)', left: 0, right: 0, height: 2, background: 'cyan', zIndex: 99, pointerEvents: 'none' }} />
    </>
  )
}
